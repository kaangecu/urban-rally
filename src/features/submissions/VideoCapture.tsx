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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      cleanup();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error accessing camera/microphone:', err);
      setError('Unable to access camera or microphone. Please check permissions.');
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
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);
        
        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const retakeVideo = () => {
    setRecordedVideo(null);
    setRecordingTime(0);
    chunksRef.current = [];
    startCamera();
  };

  const confirmVideo = () => {
    if (chunksRef.current.length === 0) return;

    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
    onCapture(file);
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-[120] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <button
          onClick={handleCancel}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-mono text-lg">
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </span>
          </div>
        )}
      </div>

      {/* Video/Preview */}
      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <div className="text-center text-white p-6">
            <p className="text-lg mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : recordedVideo ? (
          <video
            ref={previewRef}
            src={recordedVideo}
            controls
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-w-full max-h-full object-contain"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-lg">Loading camera...</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/50">
        {recordedVideo ? (
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
            className="w-full py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <Square className="w-6 h-6" />
            Stop Recording
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={isLoading || !!error}
            className="w-full py-4 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            <Video className="w-6 h-6" />
            Start Recording
          </button>
        )}
        
        {!recordedVideo && !isRecording && (
          <p className="text-center text-white/70 text-sm mt-3">
            Maximum duration: {maxDuration} seconds
          </p>
        )}
      </div>
    </div>
  );
};
