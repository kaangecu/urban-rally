import React, { useRef, useState, useEffect } from 'react';
import { Video, X, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatClock } from '../../utils/format';

// Only read from the shutter handler and its timer, never during render
const now = () => Date.now();
const secondsSince = (start: number) => Math.floor((now() - start) / 1000);

// iOS Safari before 18.4 can't record WebM, so fall back to MP4
function pickRecordingType(): { mimeType: string; type: string; ext: string } {
  if (MediaRecorder.isTypeSupported?.('video/webm;codecs=vp8,opus')) {
    return { mimeType: 'video/webm;codecs=vp8,opus', type: 'video/webm', ext: 'webm' };
  }
  return { mimeType: 'video/mp4', type: 'video/mp4', ext: 'mp4' };
}

interface VideoCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
}

export const VideoCapture: React.FC<VideoCaptureProps> = ({ 
  onCapture, 
  onCancel,
  maxDuration = 30 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const recordingTypeRef = useRef({ type: 'video/webm', ext: 'webm' });

  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // From Stop until the recorder hands over the clip; the shutter stays off so a double tap can't start a new take
  const [stopping, setStopping] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  const startCamera = async () => {
    try {
      console.log('🎥 startCamera called');
      setIsLoading(true);
      setError(null);
      setPermissionRequested(true);

      // Request camera and microphone permission with proper constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      };

      console.log('🎥 Requesting camera/mic with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('🎥 Got stream:', stream);

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('🎥 Set stream to video element');
      } else {
        console.warn('⚠️ videoRef.current is null');
      }

      setIsLoading(false);
      console.log('🎥 Camera started successfully');
    } catch (err) {
      console.error('❌ Error accessing camera/microphone:', err);
      const name = err instanceof Error ? err.name : '';
      
      let errorMessage = 'Unable to access camera or microphone.';
      
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone permission denied. Please enable access in your browser settings and reload the page.';
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found on this device.';
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        errorMessage = 'Camera or microphone is already in use by another application.';
      } else if (name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested settings. Trying with basic settings...';
        // Retry with basic constraints
        setTimeout(() => retryWithBasicConstraints(), 1000);
        return;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const retryWithBasicConstraints = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      
      // Simplest possible constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error with basic constraints:', err);
      setError('Unable to access camera/microphone. Please check your browser permissions.');
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    try {
      chunksRef.current = [];
      
      const { mimeType, type, ext } = pickRecordingType();
      recordingTypeRef.current = { type, ext };
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('🎥 Data chunk received, size:', event.data.size);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🎥 MediaRecorder stopped, processing video...');
        console.log('🎥 Chunks collected:', chunksRef.current.length);
        
        setIsLoading(true); // Show loading while creating blob
        
        // Use setTimeout to ensure state updates properly
        setTimeout(() => {
          try {
            const blob = new Blob(chunksRef.current, { type: recordingTypeRef.current.type });
            console.log('🎥 Blob created, size:', blob.size);
            
            const url = URL.createObjectURL(blob);
            console.log('🎥 Object URL created:', url);
            console.log('🎥 Setting recordedVideo state to:', url);
            
            setRecordedVideo(url);
            console.log('🎥 recordedVideo state set');
            
            // Stop camera stream
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
              console.log('🎥 Camera stream stopped');
            }
            
            setIsLoading(false); // Clear loading state
            setStopping(false);
            console.log('🎥 Loading state cleared');
          } catch (err) {
            console.error('❌ Error creating video blob:', err);
            setError('Failed to process video. Please try again.');
            setIsLoading(false);
            setStopping(false);
          }
        }, 100); // Small delay to ensure state updates properly
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer; recording stops itself at the limit. Time comes from the clock, since
      // mobile browsers throttle intervals while the screen is locked but keep recording
      startedAtRef.current = now();
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.min(maxDuration, secondsSince(startedAtRef.current));
        setRecordingTime(elapsed);
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    console.log('🎥 stopRecording called');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('🎥 Stopping MediaRecorder, state:', mediaRecorderRef.current.state);
      setStopping(true);
      mediaRecorderRef.current.stop();
    } else {
      console.log('⚠️ MediaRecorder already inactive or null');
    }
    
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('🎥 Timer cleared');
    }
  };

  const retakeVideo = () => {
    console.log('🎥 Retaking video');
    
    // Clean up old video URL to free memory
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
    }
    
    setRecordedVideo(null);
    setRecordingTime(0);
    setError(null);
    chunksRef.current = [];
    startCamera();
  };

  const confirmVideo = () => {
    console.log('🎥 Confirming video, chunks:', chunksRef.current.length);
    
    if (chunksRef.current.length === 0) {
      console.error('❌ No video chunks to upload');
      setError('No video recorded. Please try again.');
      return;
    }

    const { type, ext } = recordingTypeRef.current;
    const blob = new Blob(chunksRef.current, { type });
    console.log('🎥 Creating file from blob, size:', blob.size);
    
    const file = new File([blob], `video-${Date.now()}.${ext}`, { type });
    console.log('🎥 File created:', file.name, file.size, 'bytes');
    
    onCapture(file);
  };

  const handleCancel = () => {
    console.log('🎥 Cancelling video capture');
    
    // Clean up video URL if it exists
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
    }
    
    cleanup();
    onCancel();
  };

  console.log('🎥 VideoCapture render, state:', {
    permissionRequested,
    isRecording,
    hasRecordedVideo: !!recordedVideo,
    recordedVideoURL: recordedVideo,
    error,
    isLoading
  });

  // Debug: Check why preview might not show
  if (recordedVideo) {
    console.log('✅ recordedVideo is truthy, should show preview');
  } else if (isLoading) {
    console.log('⏳ isLoading is true, showing loading screen');
  } else if (!permissionRequested) {
    console.log('🚫 Permission not requested, showing permission screen');
  } else if (error) {
    console.log('❌ Error state:', error);
  } else {
    console.log('📹 Should show live camera');
  }

  useEffect(() => {
    console.log('🎥 VideoCapture mounted, permissionRequested:', permissionRequested);
    
    // Only start camera automatically if user already requested permission
    if (permissionRequested) {
      console.log('🎥 Auto-starting camera');
      // Starting the camera stream is a sync with an external system, which is what effects are for.
      // startCamera sets loading state first; reworking this into the click handler is a separate change.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startCamera();
    }
    return () => {
      console.log('🎥 VideoCapture unmounting, cleaning up');
      cleanup();
    };
  }, [permissionRequested]);

  return (
    // The camera is always dark, whatever the app theme
    <div data-theme="night" className="fixed inset-0 bg-black text-text z-[120] flex flex-col h-screen">
      <div className="ur-glass flex items-center justify-between gap-3 p-3 flex-shrink-0">
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Cancel"
          className="grid place-items-center size-touch shrink-0 rounded-pill text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          <X className="size-6" aria-hidden="true" />
        </button>
        {(isRecording || recordingTime > 0) && !recordedVideo && (
          <span className="ur-rec" role="timer">
            {formatClock(recordingTime)} / {formatClock(maxDuration)}
          </span>
        )}
      </div>

      {/* Video/Preview - Allow scrolling on very small screens */}
      <div className="flex-1 relative flex items-center justify-center overflow-auto min-h-0">
        {!permissionRequested ? (
          // Permission request screen
          <div className="text-center text-white p-6 max-w-md mx-auto">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full" />
              <Video className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto text-purple-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3">Camera & Microphone Access Needed</h3>
            <p className="text-gray-300 mb-8 text-sm sm:text-base">
              We need access to your camera and microphone to record a video for this task.
            </p>
            <button
              onClick={startCamera}
              className="group relative overflow-hidden rounded-lg font-bold py-4 px-8 touch-manipulation"
              style={{ minHeight: '56px' }}
            >
              {/* Gradient Background Layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 
                            group-hover:from-purple-500 group-hover:to-pink-500 
                            transition-all duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 
                            blur-xl opacity-50 group-hover:opacity-70 
                            transition-opacity duration-300" />
              
              {/* Button Content */}
              <span className="relative z-10 text-white uppercase tracking-wider text-base sm:text-lg">
                Enable Camera & Mic
              </span>
            </button>
          </div>
        ) : error ? (
          <div className="text-center text-white p-6 max-w-md mx-auto">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-red-500/30 blur-3xl rounded-full" />
              <Video className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto text-red-400" />
            </div>
            <p className="text-lg mb-6 text-gray-300">{error}</p>
            {error.includes('reload the page') ? (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 border border-white/20 text-white 
                         hover:bg-white/10 rounded-lg backdrop-blur-sm 
                         transition-all font-semibold touch-manipulation"
                style={{ minHeight: '48px' }}
              >
                Reload Page
              </button>
            ) : (
              <button
                onClick={retryWithBasicConstraints}
                className="px-6 py-3 border border-white/20 text-white 
                         hover:bg-white/10 rounded-lg backdrop-blur-sm 
                         transition-all font-semibold touch-manipulation"
                style={{ minHeight: '48px' }}
              >
                Try Again
              </button>
            )}
          </div>
        ) : recordedVideo ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                <div className="text-white text-lg">Processing video...</div>
              </div>
            )}
            <video
              ref={previewRef}
              src={recordedVideo}
              controls
              playsInline
              preload="auto"
              className="w-full h-full object-contain"
              onLoadStart={() => {
                console.log('🎥 Video load started');
              }}
              onLoadedMetadata={() => {
                console.log('🎥 Video metadata loaded');
                setIsLoading(false);
              }}
              onLoadedData={() => {
                console.log('🎥 Video data loaded, ready to play');
              }}
              onCanPlay={() => {
                console.log('🎥 Video can play');
              }}
              onError={(e) => {
                console.error('❌ Video playback error:', e);
                const videoElement = e.currentTarget;
                console.error('❌ Video error details:', {
                  error: videoElement.error,
                  networkState: videoElement.networkState,
                  readyState: videoElement.readyState
                });
                setError('Unable to play video preview. You can still upload it.');
                setIsLoading(false);
              }}
            />
          </>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-white text-lg">Loading camera...</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls on dark glass; hidden while a camera error is shown, kept once there is a clip to retake or send */}
      {(!error || recordedVideo) && (
        <div className="ur-glass p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] flex-shrink-0">
          {!permissionRequested ? (
            <Button variant="secondary" block onClick={handleCancel}>
              Cancel
            </Button>
          ) : recordedVideo ? (
            <div className="flex gap-3">
              <Button variant="secondary" block onClick={retakeVideo}>
                Retake
              </Button>
              <Button block onClick={confirmVideo}>
                <Check className="size-5" aria-hidden="true" />
                Use video
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* The shutter is also the stop button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || stopping}
                aria-label={isRecording ? 'Stop recording' : 'Record video'}
                className={`ur-shutter ur-shutter--video${isRecording ? ' ur-shutter--recording' : ''} disabled:opacity-50`}
              />
              {!isRecording && <p className="text-sm text-text-muted">Up to {maxDuration} seconds</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
