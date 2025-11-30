import { useState } from 'react';
import type { Task } from '../../types/schema';
import { useTaskStore } from '../../store/taskStore';

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
}

export function TaskCard({ task, isCompleted }: TaskCardProps) {
  const { setSelectedTask } = useTaskStore();
  const [imageError, setImageError] = useState(false);

  const getTypeIcon = (type: Task['type']) => {
    switch (type) {
      case 'GPS_LOCATION':
        return '📍';
      case 'PHOTO':
        return '📸';
      case 'VIDEO':
        return '🎥';
      case 'QUIZ':
        return '❓';
      case 'QR_CODE':
        return '📱';
      case 'SPONSORED':
        return '⭐';
      default:
        return '✨';
    }
  };

  const getDifficultyColor = (difficulty?: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: Task['type']) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div
      onClick={() => setSelectedTask(task)}
      className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
        isCompleted ? 'opacity-75 border-2 border-green-500' : ''
      }`}
    >
      {/* Task Image */}
      {task.imageUrl && !imageError ? (
        <div className="relative h-48 bg-gray-200">
          <img
            src={task.imageUrl}
            alt={task.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          {isCompleted && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full font-semibold text-sm flex items-center gap-1">
              <span>✓</span>
              <span>Completed</span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center relative">
          <span className="text-6xl">{getTypeIcon(task.type)}</span>
          {isCompleted && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full font-semibold text-sm flex items-center gap-1">
              <span>✓</span>
              <span>Completed</span>
            </div>
          )}
        </div>
      )}

      {/* Task Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Task Metadata */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Type Badge */}
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
            {getTypeIcon(task.type)}
            {getTypeLabel(task.type)}
          </span>

          {/* Difficulty Badge */}
          {task.difficulty && (
            <span className={`px-2 py-1 text-xs font-semibold rounded ${getDifficultyColor(task.difficulty)}`}>
              {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
            </span>
          )}

          {/* Sponsored Badge */}
          {task.sponsorName && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
              Sponsored
            </span>
          )}
        </div>

        {/* Points */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">{task.points}</span>
            <span className="text-sm text-gray-600">points</span>
          </div>

          {/* Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTask(task);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isCompleted
                ? 'bg-gray-100 text-gray-600'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isCompleted ? 'View' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}
