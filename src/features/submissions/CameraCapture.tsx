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
        
        {!capturedImage && permissionRequested && !error && (
          <button
            onClick={toggleCamera}
            className="p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 
                     transition-all touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Flip camera"
          >
            <RotateCw className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Camera/Preview - Allow scrolling on very small screens */}
      <div className="flex-1 relative flex items-center justify-center overflow-auto min-h-0">
        {!permissionRequested ? (
          // Permission request screen
          <div className="text-center text-white p-6 max-w-md mx-auto">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-cyan-500/30 blur-3xl rounded-full" />
              <Camera className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto text-cyan-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3">Camera Access Needed</h3>
            <p className="text-gray-300 mb-8 text-sm sm:text-base">
              We need access to your camera to take a photo for this task.
            </p>
            <button
              onClick={startCamera}
              className="group relative overflow-hidden rounded-lg font-bold py-4 px-8 touch-manipulation"
              style={{ minHeight: '56px' }}
            >
              {/* Gradient Background Layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 
                            group-hover:from-cyan-500 group-hover:to-blue-500 
                            transition-all duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 
                            blur-xl opacity-50 group-hover:opacity-70 
                            transition-opacity duration-300" />
              
              {/* Button Content */}
              <span className="relative z-10 text-white uppercase tracking-wider text-base sm:text-lg">
                Enable Camera
              </span>
            </button>
          </div>
        ) : error ? (
          <div className="text-center text-white p-6 max-w-md mx-auto">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-red-500/30 blur-3xl rounded-full" />
              <Camera className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto text-red-400" />
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
        ) : capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-full object-contain"
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-white text-lg">Loading camera...</div>
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
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
        ) : capturedImage ? (
          <div className="flex gap-3 sm:gap-4">
            <button
              onClick={retakePhoto}
              className="flex-1 py-4 px-6 border border-white/20 text-white 
                       hover:bg-white/10 rounded-lg backdrop-blur-sm 
                       transition-all font-semibold touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              Retake
            </button>
            <button
              onClick={confirmPhoto}
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
                Use Photo
              </span>
            </button>
          </div>
        ) : (
          <button
            onClick={capturePhoto}
            disabled={isLoading || !!error}
            className="group relative w-full overflow-hidden rounded-lg font-bold py-4 sm:py-5 px-6 
                     disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            style={{ minHeight: '56px' }}
          >
            {/* Gradient Background Layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 
                          group-hover:from-cyan-500 group-hover:to-blue-500 
                          transition-all duration-300 group-disabled:from-gray-700 group-disabled:to-gray-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 
                          blur-xl opacity-50 group-hover:opacity-70 
                          transition-opacity duration-300 group-disabled:opacity-0" />
            
            {/* Button Content */}
            <span className="relative z-10 flex items-center justify-center gap-2 text-white uppercase tracking-wider text-base sm:text-lg">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
              Take Photo
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
