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

  useEffect(() => {
    console.log('🎥 VideoCapture mounted, permissionRequested:', permissionRequested);
    
    // Only start camera automatically if user already requested permission
    if (permissionRequested) {
      console.log('🎥 Auto-starting camera');
      startCamera();
    }
    return () => {
      console.log('🎥 VideoCapture unmounting, cleaning up');
      cleanup();
    };
  }, [permissionRequested]);

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
    } catch (err: any) {
      console.error('❌ Error accessing camera/microphone:', err);
      
      let errorMessage = 'Unable to access camera or microphone.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone permission denied. Please enable access in your browser settings and reload the page.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera or microphone is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
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
    } catch (err: any) {
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
        
        try {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          console.log('🎥 Blob created, size:', blob.size);
          
          const url = URL.createObjectURL(blob);
          console.log('🎥 Object URL created:', url);
          
          setRecordedVideo(url);
          setIsLoading(false); // Clear loading state
          
          // Stop camera stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            console.log('🎥 Camera stream stopped');
          }
        } catch (err) {
          console.error('❌ Error creating video blob:', err);
          setError('Failed to process video. Please try again.');
          setIsLoading(false);
        }
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
    error,
    isLoading
  });

  return (
    <div 
      className="fixed bg-black z-[120] flex flex-col h-screen"
      style={{ 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 flex-shrink-0">
        <button
          onClick={handleCancel}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-mono text-sm sm:text-lg">
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </span>
          </div>
        )}
      </div>

      {/* Video/Preview - Allow scrolling on very small screens */}
      <div className="flex-1 relative flex items-center justify-center overflow-auto min-h-0">
        {!permissionRequested ? (
          // Permission request screen
          <div className="text-center text-white p-6">
            <Video className="w-16 h-16 mx-auto mb-4 text-white/70" />
            <h3 className="text-xl font-semibold mb-3">Camera & Microphone Access Needed</h3>
            <p className="text-white/70 mb-6">
              We need access to your camera and microphone to record a video for this task.
            </p>
            <button
              onClick={startCamera}
              className="px-8 py-4 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg"
            >
              Enable Camera & Mic
            </button>
          </div>
        ) : error ? (
          <div className="text-center text-white p-6">
            <p className="text-lg mb-4">{error}</p>
            {error.includes('reload the page') ? (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Reload Page
              </button>
            ) : (
              <button
                onClick={retryWithBasicConstraints}
                className="px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        ) : recordedVideo ? (
          <video
            ref={previewRef}
            src={recordedVideo}
            controls
            playsInline
            preload="auto"
            className="w-full h-full object-contain"
            onLoadedMetadata={() => {
              console.log('🎥 Video metadata loaded');
              setIsLoading(false);
            }}
            onLoadedData={() => {
              console.log('🎥 Video data loaded, ready to play');
            }}
            onError={(e) => {
              console.error('❌ Video playback error:', e);
              setError('Unable to play video preview. You can still upload it.');
              setIsLoading(false);
            }}
          />
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
              <div 
                className="absolute flex items-center justify-center bg-black/50"
                style={{ top: 0, left: 0, right: 0, bottom: 0 }}
              >
                <div className="text-white text-lg">Loading camera...</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls - Fixed at bottom, always visible */}
      <div className="p-4 sm:p-6 bg-black/50 flex-shrink-0 safe-area-bottom">
        {!permissionRequested ? (
          <button
            onClick={handleCancel}
            className="w-full py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-semibold"
          >
            Cancel
          </button>
        ) : recordedVideo ? (
          <div className="flex gap-4">
            <button
              onClick={retakeVideo}
              className="flex-1 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-semibold"
            >
              Retake
            </button>
            <button
              onClick={confirmVideo}
              className="flex-1 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Use Video
            </button>
          </div>
        ) : isRecording ? (
          <button
            onClick={stopRecording}
            className="w-full py-3 sm:py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold flex items-center justify-center gap-2 text-base sm:text-lg"
          >
            <Square className="w-5 h-5 sm:w-6 sm:h-6" />
            Stop Recording
          </button>
        ) : (
          <>
            <button
              onClick={startRecording}
              disabled={isLoading || !!error}
              className="w-full py-3 sm:py-4 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 text-base sm:text-lg"
            >
              <Video className="w-5 h-5 sm:w-6 sm:h-6" />
              Start Recording
            </button>
            
            {!isRecording && permissionRequested && (
              <p className="text-center text-white/70 text-xs sm:text-sm mt-2">
                Maximum duration: {maxDuration} seconds
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
