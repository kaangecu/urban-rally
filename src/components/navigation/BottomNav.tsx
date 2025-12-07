import React from 'react';
import { Users } from 'lucide-react';

interface BottomNavProps {
  viewMode: 'list' | 'map' | 'team';
  onViewModeChange: (mode: 'list' | 'map' | 'team') => void;
  teamScore: number;
  completedTasks: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  viewMode,
  onViewModeChange,
  teamScore,
  completedTasks,
}) => {
  return (
    <div className="fixed bottom-6 left-4 right-4 z-50">
      <div className="relative rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl px-2 py-4 shadow-[0_0_20px_-5px_rgba(236,72,153,0.3)] flex justify-around items-center">
        
        {/* List View Button */}
        <button
          onClick={() => onViewModeChange('list')}
          className={`relative flex flex-col items-center gap-1 transition-colors ${
            viewMode === 'list' ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          {viewMode === 'list' && (
            <div className="absolute -top-4 w-8 h-8 bg-cyan-500/40 rounded-full blur-lg"></div>
          )}
          <svg
            className={`w-6 h-6 ${
              viewMode === 'list' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <span
            className={`text-[9px] font-bold uppercase ${
              viewMode === 'list' ? 'drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : ''
            }`}
          >
            Tasks
          </span>
        </button>

        {/* Map View Button */}
        <button
          onClick={() => onViewModeChange('map')}
          className={`relative flex flex-col items-center gap-1 transition-colors ${
            viewMode === 'map' ? 'text-pink-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          {viewMode === 'map' && (
            <div className="absolute -top-4 w-8 h-8 bg-pink-500/40 rounded-full blur-lg"></div>
          )}
          <svg
            className={`w-6 h-6 ${
              viewMode === 'map' ? 'drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span
            className={`text-[9px] font-bold uppercase ${
              viewMode === 'map' ? 'drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]' : ''
            }`}
          >
            Map
          </span>
        </button>

        {/* Team View Button */}
        <button
          onClick={() => onViewModeChange('team')}
          className={`relative flex flex-col items-center gap-1 transition-colors ${
            viewMode === 'team' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          {viewMode === 'team' && (
            <div className="absolute -top-4 w-8 h-8 bg-purple-500/40 rounded-full blur-lg"></div>
          )}
          <Users
            className={`w-6 h-6 ${
              viewMode === 'team' ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : ''
            }`}
          />
          <span
            className={`text-[9px] font-bold uppercase ${
              viewMode === 'team' ? 'drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]' : ''
            }`}
          >
            Team
          </span>
        </button>

        {/* Score Display */}
        <div className="relative flex flex-col items-center gap-1 text-purple-400">
          <div className="absolute -top-4 w-8 h-8 bg-purple-500/30 rounded-full blur-lg"></div>
          <div className="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-purple-600 px-2 py-1 rounded-full shadow-[0_0_15px_-3px_rgba(236,72,153,0.6)]">
            <svg
              className="w-4 h-4 text-yellow-300 drop-shadow-[0_0_6px_rgba(253,224,71,0.8)]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-bold text-white text-xs">{teamScore}</span>
          </div>
          <span className="text-[9px] font-bold uppercase drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">
            XP
          </span>
        </div>

        {/* Progress Display */}
        <div className="relative flex flex-col items-center gap-1 text-green-400">
          <div className="absolute -top-4 w-8 h-8 bg-green-500/30 rounded-full blur-lg"></div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.4)]">
            <svg
              className="w-5 h-5 drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-[9px] font-bold uppercase drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">
            {completedTasks}
          </span>
        </div>
      </div>
    </div>
  );
};
