/**
 * Dashboard Page
 * Main application view after user has joined a team
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTeamSync } from '../hooks/useTeamSync';
import { getUserParticipationInEvent, updateLastActive } from '../services/teamMember.service';
import { getTeamById } from '../services/team.service';
import { getTenantById } from '../services/tenant.service';
import { getFirebaseAuth } from '../services/firebase.service';
import { TaskList } from '../features/tasks/TaskList';
import { TaskDetail } from '../features/tasks/TaskDetail';
import { GameMap } from '../features/map/GameMap';
import { TeamMembersTab } from '../features/team/TeamMembersTab';
import { BottomNav } from '../components/navigation/BottomNav';
import { EventHeader } from '../components/events/EventHeader';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { applyTheme, isCyberpunkTheme } from '../utils/theme';

export function Dashboard() {
  const { tenantId, eventId } = useParams<{ tenantId: string; eventId: string }>();
  const navigate = useNavigate();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  
  // ⚡ OPTIMIZATION: Use selective subscriptions to reduce re-renders
  // Only subscribe to the specific fields this component needs
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const team = useAuthStore(state => state.team);
  const tenant = useAuthStore(state => state.tenant);
  const setTeam = useAuthStore(state => state.setTeam);
  const setTenant = useAuthStore(state => state.setTenant);
  
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'team'>('list');
  const [isValidating, setIsValidating] = useState(true);
  const [isLoadingEventData, setIsLoadingEventData] = useState(false);
  
  // Real-time sync team data with Firestore
  useTeamSync();
  
  // Check if current tenant uses cyberpunk theme
  const useCyberpunk = tenant ? isCyberpunkTheme(tenant) : false;

  useEffect(() => {
    // Apply tenant theme if already logged in
    if (tenant) {
      applyTheme(tenant);
      document.title = `${tenant.name} - UrbanRally`;
    }
  }, [tenant]);

  // Update last active timestamp when dashboard mounts
  useEffect(() => {
    if (user && team) {
      updateLastActive(team.id, user.uid);
    }
  }, [user, team]);

  // Redirect if not authenticated or no team
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // If no team but authenticated, redirect to events selection
    if (!team) {
      navigate('/events');
      return;
    }
  }, [isAuthenticated, team, navigate]);

  // Validate URL parameters and load team/tenant for new event
  useEffect(() => {
    async function validateAndLoadEvent() {
      if (!tenantId || !eventId) {
        console.warn('Missing tenantId or eventId in URL');
        navigate('/events');
        return;
      }

      // Check if we need to load new team/tenant data
      const needsTeamUpdate = !team || team.eventId !== eventId;
      const needsTenantUpdate = !tenant || tenant.id !== tenantId;

      if (needsTeamUpdate || needsTenantUpdate) {
        console.log('[Dashboard] Loading data for new event:', { tenantId, eventId });
        setIsLoadingEventData(true);

        try {
          // Load user's participation in this event
          if (user && needsTeamUpdate) {
            const participation = await getUserParticipationInEvent(user.uid, eventId);
            
            if (!participation) {
              console.warn('User not participating in this event');
              navigate('/events');
              return;
            }

            // Load full team data
            const teamData = await getTeamById(participation.teamId);
            if (teamData) {
              setTeam(teamData);
            }
          }

          // Load tenant data if needed
          if (needsTenantUpdate) {
            const tenantData = await getTenantById(tenantId);
            if (tenantData) {
              setTenant(tenantData);
            }
          }
        } catch (error) {
          console.error('[Dashboard] Error loading event data:', error);
          navigate('/events');
          return;
        } finally {
          setIsLoadingEventData(false);
        }
      }

      setIsValidating(false);
    }

    validateAndLoadEvent();
  }, [tenantId, eventId, user, team, tenant, setTeam, setTenant, navigate]);

  if (!isAuthenticated || !team || !tenant || isValidating || isLoadingEventData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative ${
      useCyberpunk 
        ? 'bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-[#000000]' 
        : 'bg-gray-100'
    }`}>
      {/* Event Header with Switcher */}
      <EventHeader
        tenant={tenant}
        team={team}
        currentEventId={eventId || ''}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-32">
        {viewMode === 'list' ? (
          <TaskList />
        ) : viewMode === 'map' ? (
          <div className="h-[calc(100vh-200px)] -mx-4 -my-6">
            <GameMap />
          </div>
        ) : (
          <TeamMembersTab />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        teamScore={team.score || 0}
        completedTasks={team.completedTaskIds?.length || 0}
      />

      {/* Task Detail Modal */}
      <TaskDetail />
    </div>
  );
}
