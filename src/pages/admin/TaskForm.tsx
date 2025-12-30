import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../services/firebase.service';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { TaskTypeSelector } from '../../components/admin/TaskTypeSelector';
import { GPSPicker } from '../../components/admin/GPSPicker';
import { QuizBuilder, type QuizConfig } from '../../components/admin/QuizBuilder';
import type { Task, TaskType } from '../../types/schema';

export function TaskForm() {
  const navigate = useNavigate();
  const { eventId, taskId } = useParams<{ eventId: string; taskId: string }>();
  const { adminProfile } = useAdminAuth();
  const isEditMode = !!taskId;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>('');

  // Form state
  const [taskType, setTaskType] = useState<TaskType>('GPS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(100);
  const [isActive, setIsActive] = useState(true);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  // GPS fields
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [radius, setRadius] = useState(50);
  const [requiresPhoto, setRequiresPhoto] = useState(false);
  
  // Photo/Video fields
  const [photoPrompt, setPhotoPrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [requiresGPS, setRequiresGPS] = useState(false);
  
  // Quiz fields
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    quizType: 'text',
    quizCorrectAnswer: '',
  });

  // Load event name
  useEffect(() => {
    if (!eventId) return;

    const loadEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          setEventName(eventDoc.data().name);
        }
      } catch (err) {
        console.error('Error loading event:', err);
      }
    };

    loadEvent();
  }, [eventId]);

  // Load existing task in edit mode
  useEffect(() => {
    if (!taskId || !eventId) return;

    const loadTask = async () => {
      try {
        setLoading(true);
        setError(null);

        const taskDoc = await getDoc(doc(db, 'tasks', taskId));
        
        if (!taskDoc.exists()) {
          setError('Task not found');
          return;
        }

        const task = { id: taskDoc.id, ...taskDoc.data() } as Task;

        // Verify task belongs to this event
        if (task.eventId !== eventId) {
          setError('Task does not belong to this event');
          return;
        }

        // Populate form
        setTaskType(task.type);
        setTitle(task.title);
        setDescription(task.description);
        setPoints(task.points);
        setIsActive(task.isActive);
        setDifficulty(task.difficulty || 'medium');

        // Type-specific fields
        if (task.type === 'GPS' || task.type === 'GPS_LOCATION') {
          if (task.coordinates) {
            setCoordinates({ lat: task.coordinates.lat, lng: task.coordinates.lng });
          }
          setRadius(task.radius || 50);
          setRequiresPhoto(task.requiresPhoto || false);
        } else if (task.type === 'PHOTO') {
          setPhotoPrompt(task.description);
          setRequiresGPS(task.requiresGPS || false);
          if (task.requiresGPS && task.coordinates) {
            setCoordinates({ lat: task.coordinates.lat, lng: task.coordinates.lng });
            setRadius(task.radius || 50);
          }
        } else if (task.type === 'VIDEO') {
          setVideoPrompt(task.description);
          setRequiresGPS(task.requiresGPS || false);
          if (task.requiresGPS && task.coordinates) {
            setCoordinates({ lat: task.coordinates.lat, lng: task.coordinates.lng });
            setRadius(task.radius || 50);
          }
        } else if (task.type === 'QUIZ') {
          setQuizConfig({
            quizType: task.quizType || 'text',
            quizOptions: task.quizOptions,
            quizCorrectAnswer: task.quizCorrectAnswer || '',
            quizHint: task.quizHint,
          });
        }
      } catch (err: any) {
        console.error('Error loading task:', err);
        setError(err.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId, eventId]);

  const validateForm = (): string | null => {
    if (!title.trim()) return 'Title is required';
    if (!description.trim()) return 'Description is required';
    if (points < 1 || points > 10000) return 'Points must be between 1 and 10,000';

    if (taskType === 'GPS' || taskType === 'GPS_LOCATION') {
      if (!coordinates) return 'Location is required for GPS tasks';
      if (radius < 10 || radius > 500) return 'Radius must be between 10 and 500 meters';
    }

    if (taskType === 'PHOTO') {
      if (!photoPrompt.trim()) return 'Photo prompt is required';
      if (requiresGPS && !coordinates) return 'Location is required when GPS is enabled';
    }

    if (taskType === 'VIDEO') {
      if (!videoPrompt.trim()) return 'Video prompt is required';
      if (requiresGPS && !coordinates) return 'Location is required when GPS is enabled';
    }

    if (taskType === 'QUIZ') {
      if (!quizConfig.quizCorrectAnswer) return 'Correct answer is required';
      if (quizConfig.quizType === 'multiple-choice') {
        if (!quizConfig.quizOptions || quizConfig.quizOptions.length < 2) {
          return 'At least 2 options required for multiple choice';
        }
        if (!quizConfig.quizOptions.includes(quizConfig.quizCorrectAnswer as string)) {
          return 'Correct answer must be one of the options';
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Ensure we have adminProfile and tenantId
      if (!adminProfile) {
        throw new Error('Admin profile not loaded. Please refresh and try again.');
      }

      const tenantId = adminProfile.managedTenantIds?.[0];
      if (!tenantId) {
        throw new Error('No tenant assigned to your admin account.');
      }

      if (!eventId) {
        throw new Error('Event ID is missing.');
      }

      // Build task data based on type
      const baseData: any = {
        eventId,
        tenantId,
        title: title.trim(),
        description: description.trim(),
        taskType: taskType, // Cloud Function expects 'taskType' not 'type'
        points,
        isActive,
        difficulty,
      };

      console.log('📤 Sending task data:', baseData);

      // Add type-specific fields
      if (taskType === 'GPS' || taskType === 'GPS_LOCATION') {
        baseData.coordinates = coordinates;
        baseData.radius = radius;
        baseData.requiresPhoto = requiresPhoto;
      } else if (taskType === 'PHOTO') {
        baseData.description = photoPrompt.trim();
        baseData.requiresGPS = requiresGPS;
        if (requiresGPS && coordinates) {
          baseData.coordinates = coordinates;
          baseData.radius = radius;
        }
      } else if (taskType === 'VIDEO') {
        baseData.description = videoPrompt.trim();
        baseData.requiresGPS = requiresGPS;
        if (requiresGPS && coordinates) {
          baseData.coordinates = coordinates;
          baseData.radius = radius;
        }
      } else if (taskType === 'QUIZ') {
        baseData.quizType = quizConfig.quizType;
        baseData.quizCorrectAnswer = quizConfig.quizCorrectAnswer;
        baseData.quizOptions = quizConfig.quizOptions;
        baseData.quizHint = quizConfig.quizHint;
      }

      if (isEditMode) {
        // Update existing task
        const updateTaskSecure = httpsCallable(functions, 'updateTaskSecure');
        await updateTaskSecure({ taskId, updates: baseData });
      } else {
        // Create new task
        const createTaskSecure = httpsCallable(functions, 'createTaskSecure');
        await createTaskSecure(baseData);
      }

      navigate(`/admin/events/${eventId}/tasks`);
    } catch (err: any) {
      console.error('Error saving task:', err);
      setError(err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </AdminLayout>
    );
  }

  // Check if admin profile is loaded
  if (!adminProfile) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-400 mb-4">Admin profile not loaded</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Check if admin has tenants
  if (!adminProfile.managedTenantIds || adminProfile.managedTenantIds.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-400 mb-4">No tenants assigned to your admin account</p>
            <p className="text-slate-400 text-sm">Contact a superadmin to assign tenants</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/admin/events/${eventId}/tasks`)}
            className="text-blue-400 hover:text-blue-300 active:text-blue-500 text-sm font-medium mb-4 flex items-center gap-2 min-h-[44px] py-2 touch-manipulation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tasks
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {isEditMode ? 'Edit Task' : 'Create Task'}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-mono uppercase tracking-widest">
            {eventName}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Type Selector */}
          <TaskTypeSelector
            value={taskType}
            onChange={setTaskType}
            disabled={isEditMode}
          />

          {/* Basic Info */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 md:p-6 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Basic Information</h3>

            <div>
              <label htmlFor="title" className="block text-sm font-bold text-slate-300 mb-2">
                Task Title <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Find the Brandenburg Gate"
                maxLength={100}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-bold text-slate-300 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Navigate to this famous landmark and check in when you arrive..."
                rows={4}
                maxLength={500}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">{description.length}/500 characters</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="points" className="block text-sm font-bold text-slate-300 mb-2">
                  Points <span className="text-red-400">*</span>
                </label>
                <input
                  id="points"
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  min={1}
                  max={10000}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-bold text-slate-300 mb-2">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 bg-slate-900 border-slate-700 rounded text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
              />
              <label htmlFor="isActive" className="text-sm text-slate-300 cursor-pointer">
                Task is active (visible to players)
              </label>
            </div>
          </div>

          {/* Type-Specific Configuration */}
          {(taskType === 'GPS' || taskType === 'GPS_LOCATION') && (
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 md:p-6 space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">GPS Configuration</h3>
              
              <GPSPicker
                coordinates={coordinates}
                radius={radius}
                onCoordinatesChange={setCoordinates}
                onRadiusChange={setRadius}
              />

              <div className="flex items-center gap-3">
                <input
                  id="requiresPhoto"
                  type="checkbox"
                  checked={requiresPhoto}
                  onChange={(e) => setRequiresPhoto(e.target.checked)}
                  className="w-5 h-5 bg-slate-900 border-slate-700 rounded text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="requiresPhoto" className="text-sm text-slate-300 cursor-pointer">
                  Require photo proof at location
                </label>
              </div>
            </div>
          )}

          {taskType === 'PHOTO' && (
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 md:p-6 space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Photo Challenge Configuration</h3>

              <div>
                <label htmlFor="photoPrompt" className="block text-sm font-bold text-slate-300 mb-2">
                  Photo Prompt <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="photoPrompt"
                  value={photoPrompt}
                  onChange={(e) => setPhotoPrompt(e.target.value)}
                  placeholder="Take a selfie with the statue..."
                  rows={3}
                  maxLength={300}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="requiresGPS"
                  type="checkbox"
                  checked={requiresGPS}
                  onChange={(e) => setRequiresGPS(e.target.checked)}
                  className="w-5 h-5 bg-slate-900 border-slate-700 rounded text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="requiresGPS" className="text-sm text-slate-300 cursor-pointer">
                  Require photo at specific location
                </label>
              </div>

              {requiresGPS && (
                <GPSPicker
                  coordinates={coordinates}
                  radius={radius}
                  onCoordinatesChange={setCoordinates}
                  onRadiusChange={setRadius}
                />
              )}
            </div>
          )}

          {taskType === 'VIDEO' && (
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 md:p-6 space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Video Challenge Configuration</h3>

              <div>
                <label htmlFor="videoPrompt" className="block text-sm font-bold text-slate-300 mb-2">
                  Video Prompt <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="videoPrompt"
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="Record your team performing the dance..."
                  rows={3}
                  maxLength={300}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="requiresGPSVideo"
                  type="checkbox"
                  checked={requiresGPS}
                  onChange={(e) => setRequiresGPS(e.target.checked)}
                  className="w-5 h-5 bg-slate-900 border-slate-700 rounded text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="requiresGPSVideo" className="text-sm text-slate-300 cursor-pointer">
                  Require video at specific location
                </label>
              </div>

              {requiresGPS && (
                <GPSPicker
                  coordinates={coordinates}
                  radius={radius}
                  onCoordinatesChange={setCoordinates}
                  onRadiusChange={setRadius}
                />
              )}
            </div>
          )}

          {taskType === 'QUIZ' && (
            <QuizBuilder
              config={quizConfig}
              onChange={setQuizConfig}
            />
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-600/50 text-white py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Task' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/admin/events/${eventId}/tasks`)}
              disabled={saving}
              className="w-full sm:flex-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:bg-slate-800/50 text-white py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
