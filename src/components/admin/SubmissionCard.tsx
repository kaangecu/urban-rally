import type { TaskSubmission, Task, Team } from '../../types/schema';

interface EnrichedSubmission extends TaskSubmission {
  task?: Task;
  team?: Team;
}

interface SubmissionCardProps {
  submission: EnrichedSubmission;
  onClick: () => void;
}

export function SubmissionCard({ submission, onClick }: SubmissionCardProps) {
  const getStatusBadge = () => {
    const badges = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
      approved: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Approved' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
    };

    const badge = badges[submission.status];
    return (
      <span className={`${badge.bg} ${badge.text} px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider`}>
        {badge.label}
      </span>
    );
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'GPS':
      case 'GPS_LOCATION':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        );
      case 'PHOTO':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
        );
      case 'VIDEO':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'QUIZ':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div
      onClick={onClick}
      className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 hover:border-blue-500/50 active:border-blue-500 transition-all cursor-pointer touch-manipulation"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">
            {submission.task?.title || 'Unknown Task'}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-1">
            {submission.team?.teamName || submission.team?.accessCode || 'Unknown Team'}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Preview */}
      <div className="mb-3">
        {submission.photoUrls && submission.photoUrls.length > 0 && (
          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden mb-2">
            <img
              src={submission.photoUrls[0]}
              alt="Submission"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {submission.videoUrl && (
          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}

        {submission.textResponse && (
          <div className="bg-slate-900 rounded-lg p-3 mb-2">
            <p className="text-sm text-slate-300 line-clamp-2">{submission.textResponse}</p>
          </div>
        )}
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
        <div className="flex items-center gap-1">
          {submission.task && getTaskTypeIcon(submission.task.type)}
          <span className="capitalize">{submission.task?.type.toLowerCase() || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDate(submission.submittedAt)}
        </div>
      </div>

      {/* Points */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700">
        <span className="text-xs text-slate-400">Points</span>
        <span className="text-sm font-bold text-blue-400">{submission.pointsAwarded}</span>
      </div>
    </div>
  );
}
