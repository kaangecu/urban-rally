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
      {/* Main TaskDetail Modal */}
      <div 
        className="fixed bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gray-900">Task Details</h2>
            <button
              onClick={() => setSelectedTask(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Task Image */}
          {selectedTask.imageUrl && (
            <img
              src={selectedTask.imageUrl}
              alt={selectedTask.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {/* Title & Status */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-2xl font-bold text-gray-900 flex-1">
                {selectedTask.title}
              </h3>
              {isCompleted && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full font-semibold text-sm flex items-center gap-1 ml-4">
                  <span>✓</span>
                  <span>Completed</span>
                </span>
              )}
            </div>
            <p className="text-gray-600">{selectedTask.description}</p>
          </div>

          {/* Points */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Task Reward</span>
              <span className="text-3xl font-bold text-blue-600">
                {selectedTask.points} points
              </span>
            </div>
            {selectedTask.bonusPoints && (
              <p className="text-sm text-gray-600 mt-2">
                + {selectedTask.bonusPoints} bonus points available
              </p>
            )}
          </div>

          {/* Requirements */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Requirements</h4>
            <div className="space-y-2">
              {selectedTask.type === 'GPS' || selectedTask.type === 'GPS_LOCATION' ? (
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="text-2xl">📍</span>
                  <span>Visit the location (within {selectedTask.radius || 50}m)</span>
                </div>
              ) : null}
              
              {selectedTask.requiresPhoto && (
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="text-2xl">📸</span>
                  <span>Take a photo</span>
                </div>
              )}
              
              {selectedTask.requiresVideo && (
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="text-2xl">🎥</span>
                  <span>Record a video</span>
                </div>
              )}
              
              {selectedTask.requiresText && (
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="text-2xl">✍️</span>
                  <span>Provide a text answer</span>
                </div>
              )}
            </div>
          </div>

          {/* Sponsor Info */}
          {selectedTask.sponsorName && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="font-semibold text-gray-900">Sponsored by</p>
                  <p className="text-purple-700 font-medium">{selectedTask.sponsorName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Hints */}
          {selectedTask.hints && selectedTask.hints.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Available Hints</h4>
              <div className="space-y-2">
                {selectedTask.hints.map((hint, index) => (
                  <div
                    key={hint.id}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">Hint #{index + 1}</p>
                      <p className="text-sm text-gray-600">{hint.cost} points</p>
                    </div>
                    <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors">
                      Unlock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {!isCompleted ? (
              <>
                <button 
                  onClick={() => {
                    console.log('🎬 Start Task button clicked!');
                    setIsSubmitting(true);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Start Task
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setSelectedTask(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
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
        <div 
          className="fixed bg-black bg-opacity-70 flex items-center justify-center z-[110]"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 shadow-2xl">
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
          </div>
        </div>
      )}
    </>
  );
}
