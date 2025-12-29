import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase.service';
import type { TaskSubmission, Task, Team } from '../../types/schema';

interface EnrichedSubmission extends TaskSubmission {
  task?: Task;
  team?: Team;
}

interface SubmissionDetailModalProps {
  submission: EnrichedSubmission;
  isOpen: boolean;
  onClose: () => void;
  onReviewComplete: () => void;
}

export function SubmissionDetailModal({
  submission,
  isOpen,
  onClose,
  onReviewComplete,
}: SubmissionDetailModalProps) {
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  if (!isOpen) return null;

  const handleReview = async (decision: 'approved' | 'rejected') => {
    setReviewing(true);
    setError(null);

    try {
      const reviewSubmissionSecure = httpsCallable(functions, 'reviewSubmissionSecure');
      await reviewSubmissionSecure({
        submissionId: submission.id,
        status: decision,
        reviewNotes: reviewNotes.trim() || undefined,
      });

      onReviewComplete();
    } catch (err: any) {
      console.error('Error reviewing submission:', err);
      setError(err.message || 'Failed to review submission');
      setReviewing(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const getStatusColor = () => {
    switch (submission.status) {
      case 'approved':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-[#1e293b] border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[#1e293b] border-b border-slate-700 p-4 md:p-6 flex items-start justify-between z-10">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                {submission.task?.title || 'Submission Review'}
              </h2>
              <p className="text-sm text-slate-400">
                Team: <span className="text-white font-medium">{submission.team?.name || 'Unknown'}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Submitted {formatDate(submission.submittedAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors ml-4 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Status Badge */}
            <div>
              <span className={`${getStatusColor()} text-sm font-bold uppercase tracking-wider`}>
                Status: {submission.status}
              </span>
            </div>

            {/* Task Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-2">Task Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-white capitalize">{submission.task?.type.toLowerCase() || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Points:</span>
                  <span className="text-white">{submission.pointsAwarded}</span>
                </div>
                {submission.task?.description && (
                  <div className="pt-2 border-t border-slate-700">
                    <span className="text-slate-400 block mb-1">Description:</span>
                    <p className="text-white">{submission.task.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Submission */}
            {submission.photoUrls && submission.photoUrls.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Photo Submission</h3>
                <div className="bg-slate-900 rounded-lg overflow-hidden">
                  <img
                    src={submission.photoUrls[selectedImage]}
                    alt={`Submission ${selectedImage + 1}`}
                    className="w-full aspect-video object-contain"
                  />
                </div>
                {submission.photoUrls.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {submission.photoUrls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`
                          ${selectedImage === index ? 'ring-2 ring-blue-500' : 'opacity-60'}
                          flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all touch-manipulation
                        `}
                      >
                        <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Video Submission */}
            {submission.videoUrl && (
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Video Submission</h3>
                <div className="bg-slate-900 rounded-lg overflow-hidden">
                  <video
                    src={submission.videoUrl}
                    controls
                    className="w-full aspect-video"
                  />
                </div>
              </div>
            )}

            {/* Text Response */}
            {submission.textResponse && (
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Text Answer</h3>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <p className="text-white">{submission.textResponse}</p>
                </div>
                {submission.task?.type === 'QUIZ' && submission.task.quizCorrectAnswer && (
                  <div className="mt-2 flex items-start gap-2 text-sm">
                    <span className="text-slate-400">Correct Answer:</span>
                    <span className="text-green-400 font-medium">{String(submission.task.quizCorrectAnswer)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Location Data */}
            {submission.submittedLocation && (
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Location Data</h3>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latitude:</span>
                    <span className="text-white font-mono">{submission.submittedLocation.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Longitude:</span>
                    <span className="text-white font-mono">{submission.submittedLocation.lng.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">GPS Accuracy:</span>
                    <span className="text-white">{submission.submittedLocation.accuracy.toFixed(1)}m</span>
                  </div>
                  {submission.task?.coordinates && (
                    <>
                      <div className="border-t border-slate-700 pt-2 mt-2" />
                      <div className="flex justify-between">
                        <span className="text-slate-400">Task Location:</span>
                        <span className="text-white font-mono">
                          {submission.task.coordinates.lat.toFixed(6)}, {submission.task.coordinates.lng.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Accepted Radius:</span>
                        <span className="text-white">{submission.task.radius || 50}m</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Review Notes (if already reviewed) */}
            {submission.reviewNotes && (
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Review Notes</h3>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-300">{submission.reviewNotes}</p>
                  {submission.reviewedAt && (
                    <p className="text-xs text-slate-500 mt-2">
                      Reviewed {formatDate(submission.reviewedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Review Section (only for pending) */}
            {submission.status === 'pending' && (
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Review Decision</h3>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add review notes (optional)..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none mb-4"
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleReview('approved')}
                    disabled={reviewing}
                    className="flex-1 bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:bg-green-600/50 text-white py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
                  >
                    {reviewing ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleReview('rejected')}
                    disabled={reviewing}
                    className="flex-1 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-red-600/50 text-white py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
                  >
                    {reviewing ? 'Processing...' : '✗ Reject'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
