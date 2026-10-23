import { useState } from 'react';
import type { Task } from '../../types/schema';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { isCyberpunkTheme } from '../../utils/theme';
import { getTaskTypeInfo } from '../../utils/taskTypes';

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
}

export function TaskCard({ task, isCompleted }: TaskCardProps) {
  const { setSelectedTask } = useTaskStore();
  const { tenant } = useAuthStore();
  const [imageError, setImageError] = useState(false);
  
  const useCyberpunk = tenant ? isCyberpunkTheme(tenant) : false;

  const getDifficultyColor = (difficulty?: 'easy' | 'medium' | 'hard') => {
    if (useCyberpunk) {
      // Cyberpunk theme colors
      switch (difficulty) {
        case 'easy':
          return 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300';
        case 'medium':
          return 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300';
        case 'hard':
          return 'bg-pink-500/20 border border-pink-500/50 text-pink-300';
        default:
          return 'bg-white/10 border border-white/20 text-gray-300';
      }
    }
    
    // Light theme colors
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

  const { label: typeLabel, Icon: TypeIcon } = getTaskTypeInfo(task.type);

  return (
    <div
      onClick={() => setSelectedTask(task)}
      className={`rounded-lg overflow-hidden cursor-pointer transition-all ${
        useCyberpunk
          ? `glass-card-strong neon-border hover:neon-glow hover:scale-105 ${
              isCompleted ? 'opacity-75 neon-border-cyan shadow-[0_0_20px_-5px_rgba(6,182,212,0.7)]' : ''
            }`
          : `bg-white shadow-md hover:shadow-lg hover:scale-105 ${
              isCompleted ? 'opacity-75 border-2 border-green-500' : ''
            }`
      }`}
    >
      {/* Task Image */}
      {task.imageUrl && !imageError ? (
        <div className={`relative h-48 ${useCyberpunk ? 'bg-black/40' : 'bg-gray-200'}`}>
          <img
            src={task.imageUrl}
            alt={task.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          {isCompleted && (
            <div className={`absolute top-2 right-2 px-3 py-1 rounded-full font-semibold text-sm flex items-center gap-1 ${
              useCyberpunk
                ? 'bg-cyan-500/80 text-white shadow-[0_0_15px_-3px_rgba(6,182,212,0.7)] backdrop-blur-sm'
                : 'bg-green-500 text-white'
            }`}>
              <span>✓</span>
              <span>Completed</span>
            </div>
          )}
        </div>
      ) : (
        <div className={`h-48 flex items-center justify-center relative ${
          useCyberpunk
            ? 'glass-frosted-dark border-b border-white/10'
            : 'bg-gradient-to-br from-blue-100 to-indigo-100'
        }`}>
          <TypeIcon className={`w-16 h-16 ${useCyberpunk ? 'text-pink-300' : 'text-blue-600'}`} aria-hidden="true" />
          {isCompleted && (
            <div className={`absolute top-2 right-2 px-3 py-1 rounded-full font-semibold text-sm flex items-center gap-1 ${
              useCyberpunk
                ? 'glass-card-strong neon-border-cyan text-cyan-300'
                : 'bg-green-500 text-white'
            }`}>
              <span>✓</span>
              <span>Completed</span>
            </div>
          )}
        </div>
      )}

      {/* Task Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className={`text-lg font-bold mb-2 line-clamp-2 ${
          useCyberpunk ? 'text-white' : 'text-gray-900'
        }`}>
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className={`text-sm mb-3 line-clamp-2 ${
            useCyberpunk ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {task.description}
          </p>
        )}

        {/* Task Metadata */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Type Badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-[13px] font-semibold rounded ${
            useCyberpunk
              ? 'glass-frosted neon-border-pink text-pink-300'
              : 'bg-blue-100 text-blue-800'
          }`}>
            <TypeIcon className="w-3.5 h-3.5" aria-hidden="true" />
            {typeLabel}
          </span>

          {/* Difficulty Badge */}
          {task.difficulty && (
            <span className={`px-2 py-1 text-[13px] font-semibold rounded ${getDifficultyColor(task.difficulty)}`}>
              {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
            </span>
          )}

          {/* Sponsored Badge */}
          {task.sponsorName && (
            <span className={`px-2 py-1 text-[13px] font-semibold rounded ${
              useCyberpunk
                ? 'glass-frosted border border-yellow-500/50 text-yellow-300'
                : 'bg-purple-100 text-purple-800'
            }`}>
              Sponsored
            </span>
          )}
        </div>

        {/* Points */}
        <div className={`flex items-center justify-between pt-3 border-t ${
          useCyberpunk ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${
              useCyberpunk
                ? 'bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent'
                : 'text-blue-600'
            }`}>
              {task.points}
            </span>
            <span className={`text-sm ${useCyberpunk ? 'text-gray-500' : 'text-gray-600'}`}>
              points
            </span>
          </div>

          {/* Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTask(task);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isCompleted
                ? useCyberpunk
                  ? 'bg-white/10 text-gray-400 border border-white/20'
                  : 'bg-gray-100 text-gray-600'
                : useCyberpunk
                  ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40'
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
