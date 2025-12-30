import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase.service';
import { useAuthStore } from '../../store/authStore';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { SubmissionCard } from '../../components/admin/SubmissionCard';
import { SubmissionDetailModal } from '../../components/admin/SubmissionDetailModal';
import type { TaskSubmission, Task, Team } from '../../types/schema';

type SubmissionFilter = 'all' | 'pending' | 'approved' | 'rejected';

interface EnrichedSubmission extends TaskSubmission {
  task?: Task;
  team?: Team;
}

export function SubmissionQueue() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [submissions, setSubmissions] = useState<EnrichedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SubmissionFilter>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<EnrichedSubmission | null>(null);
  const [eventName, setEventName] = useState<string>('');

  useEffect(() => {
    if (!eventId) return;
    loadSubmissions();
  }, [eventId, filter]);

  const loadSubmissions = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);

      // Load event details
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        setEventName(eventDoc.data().name);
      }

      // Build query based on filter
      let q = query(
        collection(db, 'submissions'),
        where('eventId', '==', eventId),
        orderBy('submittedAt', 'desc')
      );

      if (filter !== 'all') {
        q = query(
          collection(db, 'submissions'),
          where('eventId', '==', eventId),
          where('status', '==', filter),
          orderBy('submittedAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const submissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        reviewedAt: doc.data().reviewedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as EnrichedSubmission[];

      // Enrich with task and team data
      const enrichedSubmissions = await Promise.all(
        submissionsData.map(async (submission) => {
          try {
            const [taskDoc, teamDoc] = await Promise.all([
              getDoc(doc(db, 'tasks', submission.taskId)),
              getDoc(doc(db, 'teams', submission.teamId)),
            ]);

            return {
              ...submission,
              task: taskDoc.exists() ? { id: taskDoc.id, ...taskDoc.data() } as Task : undefined,
              team: teamDoc.exists() ? { id: teamDoc.id, ...teamDoc.data() } as Team : undefined,
            };
          } catch (err) {
            console.error('Error enriching submission:', err);
            return submission;
          }
        })
      );

      setSubmissions(enrichedSubmissions);
    } catch (err: any) {
      console.error('Error loading submissions:', err);
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewComplete = () => {
    setSelectedSubmission(null);
    loadSubmissions(); // Reload to reflect changes
  };

  const filterCounts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
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

  if (error) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-6">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
            {error}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/events')}
            className="text-blue-400 hover:text-blue-300 active:text-blue-500 text-sm font-medium mb-4 flex items-center gap-2 min-h-[44px] py-2 touch-manipulation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </button>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Submission Review</h1>
          <p className="text-xs md:text-sm text-slate-400 font-mono uppercase tracking-widest">
            {eventName}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as SubmissionFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`
                ${filter === status ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
                px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors
                min-h-[44px] touch-manipulation active:scale-[0.98]
              `}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
                {status === 'all' ? submissions.length : filterCounts[status]}
              </span>
            </button>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">{filterCounts.pending}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Pending Review</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400 mb-1">{filterCounts.approved}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Approved</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400 mb-1">{filterCounts.rejected}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Rejected</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400 mb-1">{filterCounts.all}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Total</div>
          </div>
        </div>

        {/* Empty State */}
        {submissions.length === 0 && (
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-8 md:p-12 text-center">
            <svg
              className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">No Submissions</h3>
            <p className="text-sm md:text-base text-slate-400">
              {filter === 'pending' 
                ? 'No pending submissions to review.'
                : `No ${filter} submissions found.`}
            </p>
          </div>
        )}

        {/* Submissions Grid */}
        {submissions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onClick={() => setSelectedSubmission(submission)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onReviewComplete={handleReviewComplete}
        />
      )}
    </AdminLayout>
  );
}
