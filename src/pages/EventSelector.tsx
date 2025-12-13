/**
 * EventSelector Page
 * Shows user's events and allows selecting which one to view
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserEvents } from '../services/user.service';
import { getUserTeamInEvent } from '../services/user.service';
import { getFirebaseAuth } from '../services/firebase.service';
import { LoadingState } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import type { Event } from '../types/schema';

export function EventSelector() {
  const navigate = useNavigate();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const userEvents = await getUserEvents(user.uid);
      setEvents(userEvents as Event[]);
      
      // If only one event, auto-navigate to it
      if (userEvents.length === 1) {
        const event = userEvents[0] as Event;
        const team = await getUserTeamInEvent(user.uid, event.id);
        
        if (team) {
          // User already in team -> go to dashboard
          navigate(`/tenant/${event.tenantId}/event/${event.id}/dashboard`);
        } else {
          // User not in team -> show browse teams
          navigate(`/tenant/${event.tenantId}/event/${event.id}/teams`);
        }
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load your events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user, navigate]);

  const handleEventSelect = async (event: Event) => {
    if (!user) return;
    
    const team = await getUserTeamInEvent(user.uid, event.id);
    
    if (team) {
      // User already in team -> go to dashboard
      navigate(`/tenant/${event.tenantId}/event/${event.id}/dashboard`);
    } else {
      // User not in team -> show browse teams
      navigate(`/tenant/${event.tenantId}/event/${event.id}/teams`);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your events..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <ErrorState 
          title="Failed to load events"
          message={error}
          onRetry={loadEvents}
          showHomeButton={true}
        />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Events Found
          </h1>
          <p className="text-gray-600 mb-6">
            You haven't joined any events yet. Contact your organizer to get a team code.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Select an Event
          </h1>
          <p className="text-gray-600">
            You're participating in {events.length} event{events.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => handleEventSelect(event)}
              className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {event.name}
                  </h3>
                  {event.isActive ? (
                    <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                      🟢 Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-gray-500 font-medium">
                      🔴 Ended
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📅</span>
                  <span>
                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-semibold">
                    View Event →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
