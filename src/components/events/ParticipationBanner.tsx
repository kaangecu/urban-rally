/**
 * ParticipationBanner Component
 * Shows user's event participation status
 * Enforces 1 team per event rule
 */

import { useNavigate } from 'react-router-dom';
import type { TeamMember } from '../../types/schema';

interface ParticipationBannerProps {
  participation: TeamMember;
  currentEventId: string;
}

export function ParticipationBanner({ 
  participation, 
  currentEventId 
}: ParticipationBannerProps) {
  const navigate = useNavigate();
  
  if (participation.eventId === currentEventId) {
    // User is viewing their current event
    return (
      <div className="mb-4 rounded-lg bg-green-50 border-2 border-green-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-900">
                You're in this event
              </p>
              <p className="text-sm text-green-700">
                Team: {participation.teamId}
              </p>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-lg bg-white border-2 border-green-300 text-green-900 font-medium hover:bg-green-50 transition-colors"
            onClick={() => navigate(`/tenant/${participation.tenantId}/event/${participation.eventId}/dashboard`)}
          >
            View My Team
          </button>
        </div>
      </div>
    );
  }
  
  // User is viewing a different event
  return (
    <div className="mb-4 rounded-lg bg-yellow-50 border-2 border-yellow-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-yellow-900">
              You're already in another event
            </p>
            <p className="text-sm text-yellow-700">
              You can only be in one team per event. You're currently in: {participation.eventId}
            </p>
          </div>
        </div>
        <button
          className="px-4 py-2 rounded-lg bg-white border-2 border-yellow-300 text-yellow-900 font-medium hover:bg-yellow-50 transition-colors whitespace-nowrap"
          onClick={() => navigate(`/tenant/${participation.tenantId}/event/${participation.eventId}/dashboard`)}
        >
          Go to My Event
        </button>
      </div>
    </div>
  );
}
