import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase.service';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import type { Event } from '../../types/schema';
import { AdminLayout } from '../../components/admin/AdminLayout';

export function EventList() {
  const navigate = useNavigate();
  const { adminProfile } = useAdminAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, [adminProfile]);

  const loadEvents = async () => {
    if (!adminProfile) return;

    try {
      setLoading(true);
      setError(null);

      let q;

      // Super admins see all events, others see only their tenant's events
      if (adminProfile.role === 'superadmin') {
        q = query(
          collection(db, 'events'),
          orderBy('createdAt', 'desc')
        );
      } else if (adminProfile.managedTenantIds && adminProfile.managedTenantIds.length > 0) {
        q = query(
          collection(db, 'events'),
          where('tenantId', 'in', adminProfile.managedTenantIds),
          orderBy('createdAt', 'desc')
        );
      } else {
        setEvents([]);
        setLoading(false);
        return;
      }

      const snapshot = await getDocs(q);
      const eventsList = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Event[];

      setEvents(eventsList);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (event: Event) => {
    const now = new Date();
    const start = event.startDate.toDate ? event.startDate.toDate() : new Date(event.startDate);
    const end = event.endDate.toDate ? event.endDate.toDate() : new Date(event.endDate);

    if (!event.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">
          Inactive
        </span>
      );
    }

    if (now < start) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Upcoming
        </span>
      );
    }

    if (now > end) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">
          Ended
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Active
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Events</h1>
            <p className="text-xs md:text-sm text-slate-400 font-mono uppercase tracking-widest">
              Event Management
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/events/new')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">No Events Yet</h3>
            <p className="text-sm md:text-base text-slate-400 mb-6">
              Get started by creating your first event.
            </p>
            <button
              onClick={() => navigate('/admin/events/new')}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 min-h-[44px] touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create First Event
            </button>
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 md:p-6 hover:border-blue-500/50 active:border-blue-500 transition-all cursor-pointer touch-manipulation"
                onClick={() => navigate(`/admin/events/${event.id}`)}
              >
                {/* Event Code Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30 text-xs font-mono font-bold uppercase">
                    {event.eventCode}
                  </span>
                  {getStatusBadge(event)}
                </div>

                {/* Event Name */}
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                  {event.name}
                </h3>

                {/* Description */}
                {event.description && (
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {/* Dates */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/events/${event.id}/edit`);
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/events/${event.id}/tasks`);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
                    >
                      Tasks
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/events/${event.id}/submissions`);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
                  >
                    Review Submissions
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
