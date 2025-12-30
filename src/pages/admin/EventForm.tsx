import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, functions } from '../../services/firebase.service';
import { httpsCallable } from 'firebase/functions';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { AdminLayout } from '../../components/admin/AdminLayout';
import type { Event } from '../../types/schema';

export function EventForm() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { adminProfile } = useAdminAuth();
  const isEditMode = !!eventId;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventCode: '',
    tenantId: adminProfile?.managedTenantIds?.[0] || '',
    startDate: '',
    endDate: '',
    isActive: true,
    maxTeams: 50,
    mapCenter: { lat: 52.52, lng: 13.405 }, // Berlin default
    mapZoom: 12,
  });

  useEffect(() => {
    if (isEditMode && eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const eventDoc = await getDoc(doc(db, 'events', eventId));

      if (!eventDoc.exists()) {
        setError('Event not found');
        return;
      }

      const eventData = eventDoc.data() as Event;

      // Convert Firestore timestamps to date inputs
      const startDate = (eventData.startDate as any)?.toDate
        ? (eventData.startDate as any).toDate().toISOString().split('T')[0]
        : new Date(eventData.startDate).toISOString().split('T')[0];

      const endDate = (eventData.endDate as any)?.toDate
        ? (eventData.endDate as any).toDate().toISOString().split('T')[0]
        : new Date(eventData.endDate).toISOString().split('T')[0];

      setFormData({
        name: eventData.name,
        description: eventData.description || '',
        eventCode: eventData.eventCode || '',
        tenantId: eventData.tenantId,
        startDate,
        endDate,
        isActive: eventData.isActive,
        maxTeams: eventData.maxTeams || 50,
        mapCenter: eventData.mapCenter || { lat: 52.52, lng: 13.405 },
        mapZoom: eventData.mapZoom || 12,
      });
    } catch (err) {
      console.error('Failed to load event:', err);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (isEditMode) {
        // Update event
        const updateEventSecure = httpsCallable(functions, 'updateEventSecure');
        await updateEventSecure({
          eventId,
          updates: {
            name: formData.name,
            description: formData.description,
            startDate: formData.startDate,
            endDate: formData.endDate,
            isActive: formData.isActive,
            maxTeams: formData.maxTeams,
            mapCenter: formData.mapCenter,
            mapZoom: formData.mapZoom,
          },
        });
      } else {
        // Create event
        const createEventSecure = httpsCallable(functions, 'createEventSecure');
        await createEventSecure({
          ...formData,
        });
      }

      navigate('/admin/events');
    } catch (err: any) {
      console.error('Failed to save event:', err);
      setError(err.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const generateEventCode = () => {
    // Generate code from event name (first word + random 2 digits)
    const words = formData.name.trim().split(' ');
    const firstWord = words[0].toUpperCase().substring(0, 6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    setFormData({ ...formData, eventCode: `${firstWord}${random}` });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
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
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {isEditMode ? 'Edit Event' : 'Create Event'}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-mono uppercase tracking-widest">
            Event Configuration
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Basic Information</h2>

            {/* Event Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Berlin Winter Hunt 2025"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Explore Berlin and complete challenges..."
              />
            </div>

            {/* Event Code */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Event Code *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.eventCode}
                  onChange={(e) =>
                    setFormData({ ...formData, eventCode: e.target.value.toUpperCase() })
                  }
                  required
                  disabled={isEditMode}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase disabled:opacity-50"
                  placeholder="BERLIN25"
                  maxLength={10}
                />
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={generateEventCode}
                    className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
                  >
                    Generate
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Teams use this code to join the event
              </p>
            </div>

            {/* Tenant ID (for superadmins) */}
            {adminProfile?.role === 'superadmin' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tenant ID *
                </label>
                <input
                  type="text"
                  value={formData.tenantId}
                  onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                  required
                  disabled={isEditMode}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-50"
                  placeholder="esn-berlin"
                />
              </div>
            )}
          </div>

          {/* Dates Section */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Event Dates</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  min={formData.startDate}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Settings</h2>

            {/* Max Teams */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Maximum Teams
              </label>
              <input
                type="number"
                value={formData.maxTeams}
                onChange={(e) =>
                  setFormData({ ...formData, maxTeams: parseInt(e.target.value) })
                }
                min={1}
                max={500}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-300">
                Event is active (teams can join and play)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-600/50 text-white py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/events')}
              disabled={saving}
              className="w-full sm:flex-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:bg-slate-800/50 text-white py-3 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
