import React, { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff, X, RotateCw, Check, ImageUp } from 'lucide-react';
import { PermissionPrompt } from '../../components/ui/PermissionPrompt';
import { Button } from '../../components/ui/Button';

type CameraPermission = 'granted' | 'prompt' | 'denied';

/** Browsers without the Permissions API for cameras are treated as "prompt". */
async function getCameraPermission(): Promise<CameraPermission> {
  try {
    const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return status.state;
  } catch {
    return 'prompt';
  }
}

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  /** What to photograph, shown above the viewfinder */
  brief?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel, brief }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [blocked, setBlocked] = useState(false);

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
    } catch (err) {
      console.error('Error accessing camera:', err);
      const name = err instanceof Error ? err.name : '';
      
      let errorMessage = 'Unable to access camera.';
      
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setBlocked(true);
        setIsLoading(false);
        return;
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
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
    } catch (err) {
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

  // Skip the explainer when the camera is already allowed; it is only for the first ask
  useEffect(() => {
    getCameraPermission().then((state) => {
      if (state === 'granted') setPermissionRequested(true);
      if (state === 'denied') setBlocked(true);
      setCheckingPermission(false);
    });
  }, []);

  const handleGalleryPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onCapture(file);
  };

  useEffect(() => {
    // Only start camera automatically if user already requested permission
    if (permissionRequested) {
      // Starting the camera stream is a sync with an external system, which is what effects are for.
      // startCamera sets loading state first; reworking this into the click handler is a separate change.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [facingMode, permissionRequested]);

  return (
    // The camera is always dark, whatever the app theme
    <div data-theme="night" className="fixed inset-0 bg-black text-text z-[120] flex flex-col h-screen">
      <div className="ur-glass flex items-center gap-3 p-3 flex-shrink-0">
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Cancel"
          className="grid place-items-center size-touch shrink-0 rounded-pill text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          <X className="size-6" aria-hidden="true" />
        </button>
        <p className="flex-1 min-w-0 font-display font-semibold line-clamp-2">{brief}</p>
        {!capturedImage && permissionRequested && !error && !blocked && (
          <button
            type="button"
            onClick={toggleCamera}
            aria-label="Flip camera"
            className="grid place-items-center size-touch shrink-0 rounded-pill text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            <RotateCw className="size-6" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Camera/Preview - Allow scrolling on very small screens */}
      <div className="flex-1 relative flex items-center justify-center overflow-auto min-h-0">
        {checkingPermission ? null : blocked ? (
          <div className="w-full max-w-md mx-auto p-4">
            <PermissionPrompt
              Icon={CameraOff}
              title="Camera is blocked"
              text="Your browser isn't letting Urban Rally use the camera. To turn it back on:"
            >
              <ol className="list-decimal pl-6 text-text">
                <li>Tap the lock or settings icon next to the web address.</li>
                <li>Set Camera to Allow.</li>
                <li>Reload the page and open the task again.</li>
              </ol>
              <label className="relative inline-flex items-center justify-center gap-2 min-h-touch px-6 rounded-pill bg-surface text-text border border-line-strong font-display text-[15px] font-bold uppercase tracking-[0.08em] cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring has-[:focus-visible]:outline-offset-2">
                <ImageUp className="size-5" aria-hidden="true" />
                Choose a photo instead
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleGalleryPick} />
              </label>
            </PermissionPrompt>
          </div>
        ) : !permissionRequested ? (
          <div className="w-full max-w-md mx-auto p-4">
            <PermissionPrompt
              Icon={Camera}
              title="Allow the camera"
              text="This task needs a photo. Your browser will ask once; photos are only sent when you tap Use photo."
            >
              <Button block onClick={startCamera}>
                Allow camera
              </Button>
            </PermissionPrompt>
          </div>
        ) : error ? (
          <div className="text-center text-white p-6 max-w-md mx-auto">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-red-500/30 blur-3xl rounded-full" />
              <Camera className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto text-red-400" />
            </div>
            <p className="text-lg mb-6 text-gray-300">{error}</p>
            <button
              onClick={retryWithBasicConstraints}
              className="px-6 py-3 border border-white/20 text-white 
                       hover:bg-white/10 rounded-lg backdrop-blur-sm 
                       transition-all font-semibold touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              Try Again
            </button>
          </div>
        ) : capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Your photo" 
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

      {/* Controls on dark glass; hidden while an error is shown */}
      {!error && !checkingPermission && (
        <div className="ur-glass p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] flex-shrink-0">
          {!permissionRequested || blocked ? (
            <Button variant="secondary" block onClick={handleCancel}>
              Cancel
            </Button>
          ) : capturedImage ? (
            <div className="flex gap-3">
              <Button variant="secondary" block onClick={retakePhoto}>
                Retake
              </Button>
              <Button block onClick={confirmPhoto}>
                <Check className="size-5" aria-hidden="true" />
                Use photo
              </Button>
            </div>
          ) : (
            <div className="grid place-items-center">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={isLoading}
                aria-label="Take photo"
                className="ur-shutter disabled:opacity-50"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
