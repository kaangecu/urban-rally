import React, { useRef, useState, useEffect } from 'react';
import { Video, X, Square, Check } from 'lucide-react';

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

  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

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
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
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
            console.log('🎥 Loading state cleared');
          } catch (err) {
            console.error('❌ Error creating video blob:', err);
            setError('Failed to process video. Please try again.');
            setIsLoading(false);
          }
        }, 100); // Small delay to ensure state updates properly
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          
          // Auto-stop at max duration
          if (newTime >= maxDuration) {
            stopRecording();
          }
          
          return newTime;
        });
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

    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    console.log('🎥 Creating file from blob, size:', blob.size);
    
    const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    <div 
      className="fixed inset-0 bg-black z-[120] flex flex-col h-screen"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm flex-shrink-0">
        <button
          onClick={handleCancel}
          className="p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 
                   transition-all touch-manipulation"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Cancel"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        {isRecording && (
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-red-950/50 border border-red-500/30 backdrop-blur-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/50 blur-lg rounded-full" />
              <div className="relative w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_-2px_rgba(239,68,68,0.8)]" />
            </div>
            <span className="text-white font-mono text-sm sm:text-base font-bold">
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </span>
          </div>
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

      {/* Controls - Fixed at bottom, always visible */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm flex-shrink-0 safe-area-bottom">
        {!permissionRequested ? (
          <button
            onClick={handleCancel}
            className="w-full py-4 px-6 border border-white/20 text-white 
                     hover:bg-white/10 rounded-lg backdrop-blur-sm 
                     transition-all font-semibold touch-manipulation"
            style={{ minHeight: '48px' }}
          >
            Cancel
          </button>
        ) : recordedVideo ? (
          <div className="flex gap-3 sm:gap-4">
            <button
              onClick={retakeVideo}
              className="flex-1 py-4 px-6 border border-white/20 text-white 
                       hover:bg-white/10 rounded-lg backdrop-blur-sm 
                       transition-all font-semibold touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              Retake
            </button>
            <button
              onClick={confirmVideo}
              className="group relative flex-1 overflow-hidden rounded-lg font-bold py-4 px-6 touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              {/* Gradient Background Layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 
                            group-hover:from-green-500 group-hover:to-emerald-500 
                            transition-all duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 
                            blur-xl opacity-50 group-hover:opacity-70 
                            transition-opacity duration-300" />
              
              {/* Button Content */}
              <span className="relative z-10 flex items-center justify-center gap-2 text-white uppercase tracking-wider">
                <Check className="w-5 h-5" />
                Use Video
              </span>
            </button>
          </div>
        ) : isRecording ? (
          <button
            onClick={stopRecording}
            className="group relative w-full overflow-hidden rounded-lg font-bold py-4 sm:py-5 px-6 touch-manipulation"
            style={{ minHeight: '56px' }}
          >
            {/* Red Background Layers for Recording Stop */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-600 
                          group-hover:from-red-500 group-hover:to-rose-500 
                          transition-all duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-600 
                          blur-xl opacity-50 group-hover:opacity-70 
                          transition-opacity duration-300" />
            
            {/* Button Content */}
            <span className="relative z-10 flex items-center justify-center gap-2 text-white uppercase tracking-wider text-base sm:text-lg">
              <Square className="w-5 h-5 sm:w-6 sm:h-6" />
              Stop Recording
            </span>
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={startRecording}
              disabled={isLoading || !!error}
              className="group relative w-full overflow-hidden rounded-lg font-bold py-4 sm:py-5 px-6 
                       disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              style={{ minHeight: '56px' }}
            >
              {/* Gradient Background Layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 
                            group-hover:from-purple-500 group-hover:to-pink-500 
                            transition-all duration-300 group-disabled:from-gray-700 group-disabled:to-gray-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 
                            blur-xl opacity-50 group-hover:opacity-70 
                            transition-opacity duration-300 group-disabled:opacity-0" />
              
              {/* Button Content */}
              <span className="relative z-10 flex items-center justify-center gap-2 text-white uppercase tracking-wider text-base sm:text-lg">
                <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                Start Recording
              </span>
            </button>
            
            {!isRecording && permissionRequested && (
              <p className="text-center text-gray-400 text-[13px] sm:text-sm">
                Maximum duration: {maxDuration} seconds
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
