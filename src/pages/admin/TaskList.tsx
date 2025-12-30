import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase.service';
import { useAuthStore } from '../../store/authStore';
import { AdminLayout } from '../../components/admin/AdminLayout';
import type { Task } from '../../types/schema';

export function TaskList() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>('');

  useEffect(() => {
    if (!eventId) return;

    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load event details
        const eventDoc = await getDocs(
          query(collection(db, 'events'), where('__name__', '==', eventId))
        );
        if (!eventDoc.empty) {
          setEventName(eventDoc.docs[0].data().name);
        }

        // Load tasks for this event
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('eventId', '==', eventId)
        );

        const snapshot = await getDocs(tasksQuery);
        const tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Task[];

        // Sort in memory: by order (if exists), then by createdAt
        tasksData.sort((a, b) => {
          // Tasks with order field come first, sorted by order
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          // Tasks without order field sorted by createdAt (newest first)
          return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
        });

        setTasks(tasksData);
      } catch (err: any) {
        console.error('Error loading tasks:', err);
        setError(err.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [eventId]);

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'GPS':
      case 'GPS_LOCATION':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'PHOTO':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'VIDEO':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'QUIZ':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  const getTaskTypeBadge = (type: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      GPS: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'GPS' },
      GPS_LOCATION: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'GPS' },
      PHOTO: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Photo' },
      VIDEO: { bg: 'bg-pink-500/20', text: 'text-pink-400', label: 'Video' },
      QUIZ: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Quiz' },
      QR_CODE: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'QR Code' },
    };

    const badge = badges[type] || { bg: 'bg-slate-500/20', text: 'text-slate-400', label: type };
    return (
      <span className={`${badge.bg} ${badge.text} px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider`}>
        {badge.label}
      </span>
    );
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Tasks</h1>
              <p className="text-xs md:text-sm text-slate-400 font-mono uppercase tracking-widest">
                {eventName || 'Loading...'}
              </p>
            </div>
            <button
              onClick={() => navigate(`/admin/events/${eventId}/tasks/new`)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </button>
          </div>
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">No Tasks Yet</h3>
            <p className="text-sm md:text-base text-slate-400 mb-6">
              Create your first task to get started with this event.
            </p>
            <button
              onClick={() => navigate(`/admin/events/${eventId}/tasks/new`)}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 min-h-[44px] touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create First Task
            </button>
          </div>
        )}

        {/* Tasks Grid */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 md:p-6 hover:border-blue-500/50 active:border-blue-500 transition-all cursor-pointer touch-manipulation"
                onClick={() => navigate(`/admin/events/${eventId}/tasks/${task.id}/edit`)}
              >
                {/* Task Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    {getTaskTypeIcon(task.type)}
                  </div>
                  {getTaskTypeBadge(task.type)}
                </div>

                {/* Task Info */}
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{task.title}</h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-3">{task.description}</p>

                {/* Task Meta */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {task.points} pts
                  </div>
                  <div className={`flex items-center gap-1 ${task.isActive ? 'text-green-400' : 'text-slate-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${task.isActive ? 'bg-green-400' : 'bg-slate-500'}`} />
                    {task.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/events/${eventId}/tasks/${task.id}/edit`);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: View submissions
                      console.log('View submissions for task:', task.id);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
                  >
                    Submissions
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
