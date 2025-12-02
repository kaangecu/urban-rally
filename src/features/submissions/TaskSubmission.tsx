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

  return (
    <div className="p-6">
      {/* GPS Distance Warning */}
      {task.type === 'GPS' && distanceFromTask !== null && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
          <MapPin className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-900">Too far from location</p>
            <p className="text-sm text-orange-700 mt-1">
              You are {Math.round(distanceFromTask)}m away. You need to be within {task.radius || 50}m of the task location.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {state === 'error' && error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-900">Submission Failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {state === 'success' && (
        <div className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Task Completed!</h3>
          <p className="text-gray-600">+{task.points} points</p>
        </div>
      )}

      {/* Uploading State */}
      {state === 'uploading' && (
        <div className="p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Uploading...</h3>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{uploadProgress}%</p>
        </div>
      )}

      {/* Initial State - Submit Button */}
      {state === 'idle' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <p className="text-gray-700 mb-2">Ready to complete this task?</p>
            <p className="text-2xl font-bold text-blue-600">+{task.points} points</p>
          </div>

          <button
            onClick={startCapture}
            disabled={task.type === 'GPS' && distanceFromTask !== null}
            className="w-full py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg"
          >
            {task.type === 'PHOTO' && 'Take Photo'}
            {task.type === 'VIDEO' && 'Record Video'}
            {task.type === 'QUIZ' && 'Answer Quiz'}
            {(task.type === 'GPS' || task.type === 'GPS_LOCATION') && 'Take Photo at Location'}
          </button>

          <button
            onClick={onCancel}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
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
            className="w-full py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            Try Again
          </button>

          <button
            onClick={onCancel}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
