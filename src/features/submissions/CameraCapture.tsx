import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCw, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  useEffect(() => {
    // Only start camera automatically if user already requested permission
    if (permissionRequested) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [facingMode, permissionRequested]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setPermissionRequested(true);

      // Stop any existing stream
      stopCamera();

      // Request camera permission with proper constraints
      // Using 'exact' can fail if the device doesn't support that facing mode
      // Using 'ideal' falls back gracefully
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      
      let errorMessage = 'Unable to access camera.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please enable camera access in your browser settings and reload the page.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
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
      
      stopCamera();
      
      // Simplest possible constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Error with basic constraints:', err);
      setError('Unable to access camera. Please check your browser permissions.');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) return;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
    }, 'image/jpeg', 0.9);
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div 
      className="fixed bg-black z-[120] flex flex-col"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <button
          onClick={handleCancel}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        {!capturedImage && (
          <button
            onClick={toggleCamera}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <RotateCw className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Camera/Preview */}
      <div className="flex-1 relative flex items-center justify-center">
        {!permissionRequested ? (
          // Permission request screen
          <div className="text-center text-white p-6">
            <Camera className="w-16 h-16 mx-auto mb-4 text-white/70" />
            <h3 className="text-xl font-semibold mb-3">Camera Access Needed</h3>
            <p className="text-white/70 mb-6">
              We need access to your camera to take a photo for this task.
            </p>
            <button
              onClick={startCamera}
              className="px-8 py-4 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg"
            >
              Enable Camera
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
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain" />
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
              <div 
                className="absolute flex items-center justify-center bg-black/50"
                style={{ top: 0, left: 0, right: 0, bottom: 0 }}
              >
                <div className="text-white text-lg">Loading camera...</div>
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/50">
        {!permissionRequested ? (
          <button
            onClick={handleCancel}
            className="w-full py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-semibold"
          >
            Cancel
          </button>
        ) : capturedImage ? (
          <div className="flex gap-4">
            <button
              onClick={retakePhoto}
              className="flex-1 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-semibold"
            >
              Retake
            </button>
            <button
              onClick={confirmPhoto}
              className="flex-1 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Use Photo
            </button>
          </div>
        ) : (
          <button
            onClick={capturePhoto}
            disabled={isLoading || !!error}
            className="w-full py-4 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            <Camera className="w-6 h-6" />
            Take Photo
          </button>
        )}
      </div>
    </div>
  );
};
