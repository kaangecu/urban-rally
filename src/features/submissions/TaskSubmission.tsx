import React, { useState, useEffect } from 'react';
import type { Task } from '../../types/schema';
import { CameraCapture } from './CameraCapture';
import { VideoCapture } from './VideoCapture';
import { QuizInput } from './QuizInput';
import { uploadImage, uploadVideo } from '../../services/storage.service';
import { createSubmission, verifyGPSLocation } from '../../services/submission.service';
import { useAuthStore } from '../../store/authStore';
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface TaskSubmissionProps {
  task: Task;
  onSuccess: () => void;
  onCancel: () => void;
}

type SubmissionState = 'idle' | 'capture' | 'uploading' | 'success' | 'error';

export const TaskSubmission: React.FC<TaskSubmissionProps> = ({ task, onSuccess, onCancel }) => {
  const { team, tenant } = useAuthStore();
  const [state, setState] = useState<SubmissionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [distanceFromTask, setDistanceFromTask] = useState<number | null>(null);

  console.log('🎯 TaskSubmission rendered', { 
    taskType: task.type, 
    taskId: task.id, 
    state,
    team: team?.id,
    tenant: tenant?.id
  });

  // Get user location on mount
  useEffect(() => {
    if (task.type === 'GPS' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position);
          
          if (task.coordinates) {
            const distance = verifyGPSLocation(
              { lat: position.coords.latitude, lng: position.coords.longitude },
              task.coordinates,
              task.radius || 50
            );
            
            if (!distance.isValid) {
              setDistanceFromTask(distance.distance);
            }
          }
        },
        (err) => {
          console.error('Error getting location:', err);
          setError('Unable to get your location. Please enable location services.');
        },
        { enableHighAccuracy: true }
      );
    }
  }, [task]);

  const handlePhotoCapture = async (file: File) => {
    if (!team || !tenant) {
      setError('Missing authentication data');
      return;
    }

    setState('uploading');
    setError(null);

    try {
      // Upload photo
      const path = `submissions/${tenant.id}/${team.eventId}/${team.id}/${task.id}`;
      const photoUrl = await uploadImage(file, path, (progress) => {
        setUploadProgress(progress);
      });

      // Create submission
      await createSubmission(task.id, team.id, tenant.id, team.eventId, {
        type: 'photo',
        photoUrls: [photoUrl],
        points: task.points,
        submittedLocation: userLocation
          ? {
              lat: userLocation.coords.latitude,
              lng: userLocation.coords.longitude,
              accuracy: userLocation.coords.accuracy,
            }
          : undefined,
      });

      setState('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Error submitting photo:', err);
      
      // Handle duplicate submission gracefully
      if (err instanceof Error && err.message === 'Task already completed') {
        setError('✅ You have already completed this task!');
        setState('success'); // Show as success since task is done
        setTimeout(() => {
          onSuccess();
        }, 2000);
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to submit photo');
      setState('error');
    }
  };

  const handleVideoCapture = async (file: File) => {
    if (!team || !tenant) {
      setError('Missing authentication data');
      return;
    }

    setState('uploading');
    setError(null);

    try {
      // Upload video
      const path = `submissions/${tenant.id}/${team.eventId}/${team.id}/${task.id}`;
      const videoUrl = await uploadVideo(file, path, (progress) => {
        setUploadProgress(progress);
      });

      // Create submission
      await createSubmission(task.id, team.id, tenant.id, team.eventId, {
        type: 'video',
        videoUrl,
        points: task.points,
        submittedLocation: userLocation
          ? {
              lat: userLocation.coords.latitude,
              lng: userLocation.coords.longitude,
              accuracy: userLocation.coords.accuracy,
            }
          : undefined,
      });

      setState('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Error submitting video:', err);
      
      // Handle duplicate submission gracefully
      if (err instanceof Error && err.message === 'Task already completed') {
        setError('✅ You have already completed this task!');
        setState('success'); // Show as success since task is done
        setTimeout(() => {
          onSuccess();
        }, 2000);
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to submit video');
      setState('error');
    }
  };

  const handleQuizSubmit = async (answer: string) => {
    if (!team || !tenant) {
      setError('Missing authentication data');
      return;
    }

    setState('uploading');
    setError(null);

    try {
      // Create submission with text answer
      await createSubmission(task.id, team.id, tenant.id, team.eventId, {
        type: 'text',
        textResponse: answer,
        points: task.points,
        submittedLocation: userLocation
          ? {
              lat: userLocation.coords.latitude,
              lng: userLocation.coords.longitude,
              accuracy: userLocation.coords.accuracy,
            }
          : undefined,
      });

      setState('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      
      // Handle duplicate submission gracefully
      if (err instanceof Error && err.message === 'Task already completed') {
        setError('✅ You have already completed this task!');
        setState('success'); // Show as success since task is done
        setTimeout(() => {
          onSuccess();
        }, 2000);
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
      setState('error');
    }
  };

  const startCapture = () => {
    console.log('🚀 startCapture called, task type:', task.type);
    
    // Check GPS proximity if required
    if (task.type === 'GPS' && distanceFromTask !== null) {
      console.log('❌ GPS check failed, distance:', distanceFromTask);
      setError(`You are ${Math.round(distanceFromTask)}m away from the task location. Get closer to submit.`);
      return;
    }

    console.log('✅ Setting state to capture');
    setState('capture');
  };

  // Render capture interfaces
  if (state === 'capture') {
    console.log('📸 Rendering capture interface for type:', task.type);
    
    if (task.type === 'PHOTO') {
      console.log('📸 Rendering CameraCapture');
      return <CameraCapture onCapture={handlePhotoCapture} onCancel={() => setState('idle')} />;
    }
    
    if (task.type === 'VIDEO') {
      console.log('🎥 Rendering VideoCapture');
      return <VideoCapture onCapture={handleVideoCapture} onCancel={() => setState('idle')} />;
    }
    
    if (task.type === 'QUIZ' && task.description) {
      console.log('❓ Rendering QuizInput');
      return <QuizInput question={task.description} onSubmit={handleQuizSubmit} onCancel={() => setState('idle')} />;
    }

    if (task.type === 'GPS' || task.type === 'GPS_LOCATION') {
      console.log('📍 Rendering CameraCapture for GPS');
      return <CameraCapture onCapture={handlePhotoCapture} onCancel={() => setState('idle')} />;
    }
    
    console.log('⚠️ No matching task type, returning null');
  }

  // Render submission UI in a glassmorphic modal
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110]"
      onClick={onCancel}
    >
      <div 
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl max-w-lg w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'rgba(17, 24, 39, 0.95)'
        }}
      >
        {/* Glassmorphic Glow Effects */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-pink-500/30 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 p-4 sm:p-6">
      {/* GPS Distance Warning */}
      {task.type === 'GPS' && distanceFromTask !== null && (
        <div className="mb-4 p-4 rounded-xl border border-yellow-500/30 bg-yellow-950/30 backdrop-blur-sm flex items-start gap-3">
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,rgba(234,179,8,0.2)_1px,transparent_1px)] bg-[length:10px_10px] rounded-xl" />
          <MapPin className="relative w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="relative">
            <p className="text-sm font-bold text-yellow-300 uppercase tracking-wider">Too far from location</p>
            <p className="text-sm text-yellow-200 mt-1">
              You are {Math.round(distanceFromTask)}m away. You need to be within {task.radius || 50}m of the task location.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {state === 'error' && error && (
        <div className="mb-4 p-4 rounded-xl border border-red-500/30 bg-red-950/30 backdrop-blur-sm flex items-start gap-3">
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,rgba(239,68,68,0.2)_1px,transparent_1px)] bg-[length:10px_10px] rounded-xl" />
          <AlertCircle className="relative w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="relative">
            <p className="text-sm font-bold text-red-300 uppercase tracking-wider">Submission Failed</p>
            <p className="text-sm text-red-200 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {state === 'success' && (
        <div className="p-6 sm:p-8 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-500/30 blur-3xl rounded-full" />
            <CheckCircle className="relative w-16 h-16 sm:w-20 sm:h-20 text-green-400 mx-auto mb-4" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Task Completed!</h3>
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 rounded-full shadow-[0_0_20px_-3px_rgba(34,197,94,0.6)]">
            <p className="text-white font-bold text-lg">+{task.points} XP</p>
          </div>
        </div>
      )}

      {/* Uploading State */}
      {state === 'uploading' && (
        <div className="p-6 sm:p-8 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-cyan-500/30 blur-3xl rounded-full" />
            <Loader2 className="relative w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 mx-auto animate-spin" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Uploading...</h3>
          
          {/* Progress Bar */}
          <div className="relative w-full h-3 bg-white/5 rounded-full border border-white/10 overflow-hidden backdrop-blur-sm">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 shadow-[0_0_10px_-2px_rgba(6,182,212,0.8)]"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-cyan-300 mt-3 font-semibold">{uploadProgress}%</p>
        </div>
      )}

      {/* Initial State - Submit Button */}
      {state === 'idle' && (
        <div className="space-y-4">
          {/* XP Display */}
          <div className="text-center mb-6">
            <p className="text-gray-400 mb-3 text-sm sm:text-base">Ready to complete this task?</p>
            <div className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-[0_0_20px_-3px_rgba(236,72,153,0.6)]">
              <p className="text-white font-bold text-xl sm:text-2xl">+{task.points} XP</p>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={startCapture}
            disabled={task.type === 'GPS' && distanceFromTask !== null}
            className="group relative w-full overflow-hidden rounded-lg font-bold py-4 sm:py-5 px-6 
                     disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            style={{ minHeight: '56px' }}
          >
            {/* Gradient Background Layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 
                          group-hover:from-pink-500 group-hover:to-purple-500 
                          transition-all duration-300 group-disabled:from-gray-700 group-disabled:to-gray-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 
                          blur-xl opacity-50 group-hover:opacity-70 
                          transition-opacity duration-300 group-disabled:opacity-0" />
            
            {/* Button Content */}
            <span className="relative z-10 text-white uppercase tracking-wider text-base sm:text-lg">
              {task.type === 'PHOTO' && '📸 Take Photo'}
              {task.type === 'VIDEO' && '🎥 Record Video'}
              {task.type === 'QUIZ' && '❓ Answer Quiz'}
              {(task.type === 'GPS' || task.type === 'GPS_LOCATION') && '📍 Take Photo at Location'}
            </span>
          </button>

          {/* Secondary Action Button */}
          <button
            onClick={onCancel}
            className="w-full py-4 px-6 border border-white/20 text-gray-300 
                     hover:bg-white/10 hover:text-white rounded-lg backdrop-blur-sm 
                     transition-all font-semibold touch-manipulation"
            style={{ minHeight: '48px' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error State - Retry Button */}
      {state === 'error' && (
        <div className="space-y-4 mt-4">
          <button
            onClick={startCapture}
            className="group relative w-full overflow-hidden rounded-lg font-bold py-4 sm:py-5 px-6 touch-manipulation"
            style={{ minHeight: '56px' }}
          >
            {/* Gradient Background Layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 
                          group-hover:from-pink-500 group-hover:to-purple-500 
                          transition-all duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 
                          blur-xl opacity-50 group-hover:opacity-70 
                          transition-opacity duration-300" />
            
            {/* Button Content */}
            <span className="relative z-10 text-white uppercase tracking-wider text-base sm:text-lg">
              Try Again
            </span>
          </button>

          <button
            onClick={onCancel}
            className="w-full py-4 px-6 border border-white/20 text-gray-300 
                     hover:bg-white/10 hover:text-white rounded-lg backdrop-blur-sm 
                     transition-all font-semibold touch-manipulation"
            style={{ minHeight: '48px' }}
          >
            Cancel
          </button>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
