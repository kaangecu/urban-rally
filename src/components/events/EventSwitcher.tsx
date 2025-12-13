/**
 * EventSwitcher Component
 * Dropdown showing all user's events with ability to switch between them
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserEvents } from '../../services/user.service';
import { getFirebaseAuth } from '../../services/firebase.service';

interface Event {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  tenantId: string;
}

interface EventSwitcherProps {
  currentEventId: string;
  className?: string;
}

export function EventSwitcher({ 
  currentEventId,
  className = ''
}: EventSwitcherProps) {
  const navigate = useNavigate();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const [events, setEvents] = useState<Event[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadEvents() {
      try {
        setIsLoading(true);
        const userEvents = await getUserEvents(user!.uid);
        setEvents(userEvents as Event[]);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, [user]);

  const currentEvent = events.find(e => e.id === currentEventId);

  const handleEventSwitch = (eventId: string, tenantId: string) => {
    setIsOpen(false);
    navigate(`/tenant/${tenantId}/event/${eventId}/dashboard`);
  };

  const handleLeaveEvent = async (eventId: string) => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to leave this event? You will lose access to this team.'
    );
    
    if (!confirmed) return;
    
    try {
      // Get user's team in this event
      const participation = events.find(e => e.id === eventId);
      if (!participation) return;
      
      // Leave team (this will handle the TeamMember soft delete)
      // Note: We'd need to pass teamId here - this is simplified
      // await leaveTeam({ userId: user.uid, teamId: '...', eventId });
      
      // Reload events
      const userEvents = await getUserEvents(user.uid);
      setEvents(userEvents as Event[]);
      
      // If leaving current event, switch to first available event
      if (eventId === currentEventId && userEvents.length > 0) {
        const firstEvent = userEvents[0] as Event;
        navigate(`/tenant/${firstEvent.tenantId}/event/${firstEvent.id}/dashboard`);
      }
    } catch (error) {
      console.error('Error leaving event:', error);
      alert('Failed to leave event. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="px-4 py-2 text-sm text-gray-500">Loading events...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  // If only one event, show simple display
  if (events.length === 1) {
    return (
      <div className={`${className}`}>
        <div className="px-4 py-2 rounded-lg bg-white border-2 border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span className="font-medium text-gray-900">
              {currentEvent?.name || 'Event'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 rounded-lg bg-white border-2 border-gray-200 hover:border-gray-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span className="font-medium text-gray-900">
              {currentEvent?.name || 'Select Event'}
            </span>
          </div>
          <span className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-20">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              My Events ({events.length})
            </div>
            
            {events.map((event) => (
              <div key={event.id}>
                <button
                  onClick={() => handleEventSwitch(event.id, event.tenantId)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {event.name}
                        </span>
                        {event.id === currentEventId && (
                          <span className="text-green-600">✓</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {event.isActive ? '🟢 Active' : '🔴 Ended'}
                      </div>
                    </div>
                    
                    {/* Leave Event Button */}
                    {events.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveEvent(event.id);
                        }}
                        className="ml-3 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Leave this event"
                      >
                        Leave
                      </button>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
