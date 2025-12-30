import React from 'react';
import type { TaskType } from '../../types/schema';

interface TaskTypeSelectorProps {
  value: TaskType;
  onChange: (type: TaskType) => void;
  disabled?: boolean;
}

interface TaskTypeOption {
  value: TaskType;
  label: string;
  description: string;
  icon: React.ReactElement;
  color: string;
}

export function TaskTypeSelector({ value, onChange, disabled }: TaskTypeSelectorProps) {
  const taskTypes: TaskTypeOption[] = [
    {
      value: 'GPS',
      label: 'GPS Location',
      description: 'Require teams to reach a specific location',
      color: 'blue',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      value: 'PHOTO',
      label: 'Photo Challenge',
      description: 'Teams must take a photo at location or of specific subject',
      color: 'purple',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      value: 'VIDEO',
      label: 'Video Challenge',
      description: 'Teams must record a video performing a task',
      color: 'pink',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      value: 'QUIZ',
      label: 'Quiz/Trivia',
      description: 'Teams answer questions or solve puzzles',
      color: 'green',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-slate-300 mb-2">
        Task Type <span className="text-red-400">*</span>
      </label>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {taskTypes.map((type) => {
          const isSelected = value === type.value;
          const colorClasses = {
            blue: isSelected
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 hover:border-blue-500/50',
            purple: isSelected
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-slate-700 hover:border-purple-500/50',
            pink: isSelected
              ? 'border-pink-500 bg-pink-500/10'
              : 'border-slate-700 hover:border-pink-500/50',
            green: isSelected
              ? 'border-green-500 bg-green-500/10'
              : 'border-slate-700 hover:border-green-500/50',
          };

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => !disabled && onChange(type.value)}
              disabled={disabled}
              className={`
                ${colorClasses[type.color as keyof typeof colorClasses]}
                bg-[#1e293b] border-2 rounded-lg p-4
                transition-all cursor-pointer
                min-h-[100px] touch-manipulation
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                text-left
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`text-${type.color}-400 flex-shrink-0`}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white mb-1">{type.label}</div>
                  <div className="text-xs text-slate-400 line-clamp-2">{type.description}</div>
                </div>
                {isSelected && (
                  <svg className={`w-5 h-5 text-${type.color}-400 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {disabled && (
        <p className="text-xs text-slate-500 italic">Task type cannot be changed after creation</p>
      )}
    </div>
  );
}
