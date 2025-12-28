/**
 * EventHeader Component
 * Shows current event context with EventSwitcher and team info
 */

import { useNavigate } from 'react-router-dom';
import { EventSwitcher } from './EventSwitcher';
import type { Team, Tenant } from '../../types/schema';

interface EventHeaderProps {
  tenant: Tenant;
  team: Team;
  currentEventId: string;
}

export function EventHeader({ 
  tenant, 
  team, 
  currentEventId,
}: EventHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Top Row: Tenant Name & Event Switcher */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {tenant?.name || 'UrbanRally'}
            </h1>
          </div>
          
          {/* Event Switcher */}
          <EventSwitcher 
            currentEventId={currentEventId}
            className="w-64"
          />
        </div>

        {/* Bottom Row: Team Info & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Team Name */}
            <div>
              <div className="text-xs text-blue-200 uppercase tracking-wide">
                Your Team
              </div>
              <div className="text-lg font-semibold">
                {team.teamName || team.accessCode}
              </div>
            </div>
            
            {/* Team Score */}
            <div>
              <div className="text-xs text-blue-200 uppercase tracking-wide">
                Score
              </div>
              <div className="text-lg font-semibold">
                {team.score} pts
              </div>
            </div>
            
            {/* Tasks Completed */}
            <div>
              <div className="text-xs text-blue-200 uppercase tracking-wide">
                Tasks
              </div>
              <div className="text-lg font-semibold">
                {Array.isArray(team.completedTaskIds) ? team.completedTaskIds.length : 0} completed
              </div>
            </div>
          </div>
          
          {/* Settings Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium"
              title="Account Settings"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
