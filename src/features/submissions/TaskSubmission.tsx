import React, { useState, useEffect } from 'react';
import type { Task } from '../../types/schema';
import { CameraCapture } from './CameraCapture';
import { VideoCapture } from './VideoCapture';
import { QuizInput } from './QuizInput';
import { uploadImage, uploadVideo } from '../../services/storage.service';
import { createSubmission, verifyGPSLocation } from '../../services/submission.service';
import { useAuthStore } from '../../store/authStore';
import { validateQuizAnswer } from '../../utils/quizValidation';
import { formatPoints } from '../../utils/format';
import { submissionFailed } from '../../utils/messages';
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface TaskSubmissionProps {
  task: Task;
  onSuccess: () => void;
  onCancel: () => void;
}

type SubmissionState = 'idle' | 'capture' | 'uploading' | 'success' | 'error' | 'failed';

export const TaskSubmission: React.FC<TaskSubmissionProps> = ({ task, onSuccess, onCancel }) => {
  const { team, tenant } = useAuthStore();
  // The detail's primary button already confirmed, so capture opens at once
  const [state, setState] = useState<SubmissionState>('capture');
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [distanceFromTask, setDistanceFromTask] = useState<number | null>(null);
  // Check-ins wait for the location check before the camera opens, so a late fix can't pull the player out mid-shot
  const [locationChecked, setLocationChecked] = useState(() => task.type !== 'GPS' || !navigator.geolocation);
  
  // Quiz attempt tracking (Phase 1)
  const [quizAttempts, setQuizAttempts] = useState<number>(0);
  const maxQuizAttempts = 3;

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
              // Only leave capture; never interrupt an upload or a result
              setState((current) => (current === 'capture' ? 'idle' : current));
            }
          }
          setLocationChecked(true);
        },
        (err) => {
          console.error('Error getting location:', err);
          setError('Unable to get your location. Please enable location services.');
          setLocationChecked(true);
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
      
      setError(submissionFailed('photo'));
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
      
      setError(submissionFailed('video'));
      setState('error');
    }
  };

  const handleQuizSubmit = async (answer: string | number) => {
    if (!team || !tenant) {
      setError('Missing authentication data');
      return;
    }

    // Phase 1: Check attempt limits BEFORE submission
    const currentAttempt = quizAttempts + 1;
    
    if (currentAttempt > maxQuizAttempts) {
      setError(`❌ Maximum attempts (${maxQuizAttempts}) reached for this quiz.`);
      setState('failed');
      return;
    }

    setState('uploading');
    setError(null);

    try {
      // Phase 2: Use fuzzy matching for answer validation
      let validationResult;
      
      if (task.quizCorrectAnswer !== undefined) {
        validationResult = validateQuizAnswer(answer, task.quizCorrectAnswer, {
          caseSensitive: false, // Case-insensitive by default
          fuzzyThreshold: 0.65, // 65% similarity - catches most single-char typos
          allowFuzzy: true, // Enable typo forgiveness
          fuzzyPointsMultiplier: 0.95, // Award 95% points for close matches
        });
      } else {
        // If no correct answer is set, accept any answer
        validationResult = {
          isCorrect: true,
          similarity: 1.0,
          pointsMultiplier: 1.0,
          feedback: '✅ Answer submitted',
          isFuzzyMatch: false,
        };
      }
      
      // Phase 1 + 2: Calculate points based on attempt number AND fuzzy match
      const pointsMultipliers = [1.0, 0.75, 0.50]; // 100%, 75%, 50% for attempts 1, 2, 3
      const attemptMultiplier = pointsMultipliers[currentAttempt - 1] || 0.25;
      
      // Combine attempt multiplier with fuzzy match multiplier
      // Award points ONLY if correct, decreasing with each attempt
      const pointsAwarded = validationResult.isCorrect 
        ? Math.floor(task.points * attemptMultiplier * validationResult.pointsMultiplier)
        : 0; // Zero points for wrong answers
      
      // If answer is wrong, increment attempts and show feedback
      if (!validationResult.isCorrect) {
        setQuizAttempts(currentAttempt);
        const attemptsRemaining = maxQuizAttempts - currentAttempt;
        
        if (attemptsRemaining > 0) {
          setError(
            `${validationResult.feedback}\nYou have ${attemptsRemaining} ${
              attemptsRemaining === 1 ? 'attempt' : 'attempts'
            } remaining.`
          );
          setState('capture'); // Allow retry
        } else {
          setError(`${validationResult.feedback}\n❌ Maximum attempts reached. Task failed.`);
          setState('failed');
        }
        return;
      }
      
      // Correct answer - create submission
      await createSubmission(task.id, team.id, tenant.id, team.eventId, {
        type: 'text',
        textResponse: String(answer),
        points: pointsAwarded,
        submittedLocation: userLocation
          ? {
              lat: userLocation.coords.latitude,
              lng: userLocation.coords.longitude,
              accuracy: userLocation.coords.accuracy,
            }
          : undefined,
      });

      setState('success');
      
      // Show success message with points info (including fuzzy match indicator)
      if (validationResult.isFuzzyMatch) {
        setError(`${validationResult.feedback} ${formatPoints(pointsAwarded, { signed: true })} (typo forgiven)`);
      } else if (currentAttempt === 1) {
        setError(`✅ Correct! Perfect score: ${formatPoints(pointsAwarded, { signed: true })}`);
      } else {
        setError(`✅ Correct! ${formatPoints(pointsAwarded, { signed: true })} (${currentAttempt} attempts)`);
      }
      
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
      
      setError(submissionFailed('answer'));
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
      return <CameraCapture onCapture={handlePhotoCapture} onCancel={onCancel} />;
    }
    
    if (task.type === 'VIDEO') {
      console.log('🎥 Rendering VideoCapture');
      return <VideoCapture onCapture={handleVideoCapture} onCancel={onCancel} />;
    }
    
    if (task.type === 'QUIZ' && task.description) {
      console.log('❓ Rendering QuizInput');
      return (
        <QuizInput 
          question={task.description}
          type={task.quizType || 'text'}
          options={task.quizOptions}
          hint={task.quizHint}
          onSubmit={handleQuizSubmit}
          onCancel={onCancel}
          // Phase 3: Pass attempt tracking props
          currentAttempt={quizAttempts + 1} // Next attempt number
          maxAttempts={maxQuizAttempts}
          progressiveHints={[
            task.quizHint || '',  // First hint (from task)
            'Think carefully about the answer...',  // Second attempt hint
            'Consider alternative spellings or common variations...', // Third attempt hint
          ]}
        />
      );
    }

    if (!locationChecked) {
      return (
        <div role="status" className="fixed inset-0 z-[110] grid place-items-center bg-scrim text-text">
          <p className="px-6 py-4 rounded-card bg-surface-raised border border-line">Checking your location…</p>
        </div>
      );
    }

    if (task.type === 'GPS' || task.type === 'GPS_LOCATION') {
      console.log('📍 Rendering CameraCapture for GPS');
      return <CameraCapture onCapture={handlePhotoCapture} onCancel={onCancel} />;
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
            <p className="text-white font-bold text-lg">{formatPoints(task.points, { signed: true })}</p>
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

      {/* Too far: the only idle case, until the detail checks distance itself */}
      {state === 'idle' && (
        <button
          onClick={onCancel}
          className="w-full py-4 px-6 border border-white/20 text-gray-300 
                   hover:bg-white/10 hover:text-white rounded-lg backdrop-blur-sm 
                   transition-all font-semibold touch-manipulation"
          style={{ minHeight: '48px' }}
        >
          Close
        </button>
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
