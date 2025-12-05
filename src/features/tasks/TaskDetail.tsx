import { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { TaskSubmission } from '../submissions/TaskSubmission';

export function TaskDetail() {
  const { selectedTask, setSelectedTask } = useTaskStore();
  const { team } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('📋 TaskDetail rendered', { 
    taskId: selectedTask?.id, 
    isSubmitting,
    isCompleted: team?.completedTaskIds.includes(selectedTask?.id || '') || false
  });

  if (!selectedTask) return null;

  const isCompleted = team?.completedTaskIds.includes(selectedTask.id) || false;

  return (
    <>
      {/* Main TaskDetail Modal - Cyberpunk Glass Design */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
        onClick={() => setSelectedTask(null)}
      >
        <div 
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{
            // Fallback for older browsers that don't support backdrop-filter
            backgroundColor: 'rgba(17, 24, 39, 0.95)'
          }}
        >
          {/* Glassmorphic Glow Effects */}
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-pink-500/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/30 blur-3xl pointer-events-none" />
          
          {/* Header */}
          <div className="sticky top-0 z-20 border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-xl bg-gray-900/80">
            <h2 className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
              Task Details
            </h2>
            <button
              onClick={() => setSelectedTask(null)}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        {/* Content */}
        <div className="relative z-10 p-6 space-y-6">
          {/* Task Image */}
          {selectedTask.imageUrl && (
            <div className="relative overflow-hidden rounded-xl border border-white/10">
              <img
                src={selectedTask.imageUrl}
                alt={selectedTask.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          )}

          {/* Title & Status Badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {isCompleted ? (
                <span className="mb-2 inline-block rounded-full border border-green-500/50 bg-green-950/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-300 shadow-[0_0_10px_-3px_rgba(34,197,94,0.7)]">
                  ✓ Completed
                </span>
              ) : (
                <span className="mb-2 inline-block rounded-full border border-cyan-500/50 bg-cyan-950/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300 shadow-[0_0_10px_-3px_rgba(6,182,212,0.7)]">
                  Active Quest
                </span>
              )}
              <h3 className="text-2xl font-extrabold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] mb-2">
                {selectedTask.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">{selectedTask.description}</p>
            </div>
            
            {/* XP Badge */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 rounded-full shadow-[0_0_15px_-3px_rgba(236,72,153,0.6)] shrink-0">
              <span className="font-bold text-white text-lg">{selectedTask.points} XP</span>
            </div>
          </div>

          {/* Bonus Points */}
          {selectedTask.bonusPoints && (
            <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-purple-950/30 p-4 backdrop-blur-sm">
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(168,85,247,0.2)_1px,transparent_1px)] bg-[length:10px_10px]" />
              <div className="relative flex items-center justify-between">
                <span className="text-purple-300 font-medium">Bonus Available</span>
                <span className="text-2xl font-bold text-purple-400">
                  +{selectedTask.bonusPoints} XP
                </span>
              </div>
            </div>
          )}

          {/* Requirements */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-lg">Mission Requirements</h4>
            <div className="space-y-3">
              {selectedTask.type === 'GPS' || selectedTask.type === 'GPS_LOCATION' ? (
                <div className="flex items-center gap-3 text-gray-300 bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <span className="text-2xl">📍</span>
                  <span>Visit the location (within {selectedTask.radius || 50}m)</span>
                </div>
              ) : null}
              
              {selectedTask.requiresPhoto && (
                <div className="flex items-center gap-3 text-gray-300 bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <span className="text-2xl">📸</span>
                  <span>Take a photo</span>
                </div>
              )}
              
              {selectedTask.requiresVideo && (
                <div className="flex items-center gap-3 text-gray-300 bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <span className="text-2xl">🎥</span>
                  <span>Record a video</span>
                </div>
              )}
              
              {selectedTask.requiresText && (
                <div className="flex items-center gap-3 text-gray-300 bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <span className="text-2xl">✍️</span>
                  <span>Provide a text answer</span>
                </div>
              )}
            </div>
          </div>

          {/* Sponsor Info */}
          {selectedTask.sponsorName && (
            <div className="relative overflow-hidden rounded-xl border border-yellow-500/30 bg-yellow-950/20 p-4 backdrop-blur-sm">
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,rgba(234,179,8,0.2)_1px,transparent_1px)] bg-[length:10px_10px]" />
              <div className="relative flex items-center gap-3">
                <span className="text-3xl">⭐</span>
                <div>
                  <p className="font-semibold text-white text-sm uppercase tracking-wide">Sponsored by</p>
                  <p className="text-yellow-400 font-bold text-lg">{selectedTask.sponsorName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Hints */}
          {selectedTask.hints && selectedTask.hints.length > 0 && (
            <div>
              <h4 className="font-semibold text-white mb-4 text-lg">Available Hints</h4>
              <div className="space-y-3">
                {selectedTask.hints.map((hint, index) => (
                  <div
                    key={hint.id}
                    className="relative group cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                    
                    <div className="relative flex items-center justify-between rounded-xl border border-white/10 bg-gray-900/60 p-4 backdrop-blur-xl hover:border-yellow-500/50 transition-colors">
                      <div>
                        <p className="font-bold text-white">Hint #{index + 1}</p>
                        <p className="text-sm text-yellow-400 font-mono">{hint.cost} XP Cost</p>
                      </div>
                      <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all shadow-[0_0_15px_-3px_rgba(234,179,8,0.6)]">
                        Unlock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            {!isCompleted ? (
              <>
                <button 
                  onClick={() => {
                    console.log('🎬 Start Task button clicked!');
                    setIsSubmitting(true);
                  }}
                  className="relative group flex-1 overflow-hidden rounded-lg font-bold py-4 px-6 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 group-hover:from-pink-500 group-hover:to-purple-500 transition-all" />
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                  <span className="relative text-white uppercase tracking-wider drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                    Start Mission
                  </span>
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-6 py-4 border border-white/20 text-gray-300 font-semibold rounded-lg hover:bg-white/10 hover:text-white transition-colors backdrop-blur-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setSelectedTask(null)}
                className="flex-1 bg-white/10 border border-white/20 text-gray-300 font-semibold py-4 px-6 rounded-lg hover:bg-white/20 hover:text-white transition-colors backdrop-blur-sm"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* TaskSubmission Overlay - renders on top when active */}
      {isSubmitting && !isCompleted && (
        <TaskSubmission
          task={selectedTask}
          onSuccess={() => {
            console.log('✅ TaskSubmission success');
            setIsSubmitting(false);
            setSelectedTask(null);
            // Refresh team data to show updated score
            window.location.reload();
          }}
          onCancel={() => {
            console.log('❌ TaskSubmission cancelled');
            setIsSubmitting(false);
          }}
        />
      )}
    </>
  );
}
