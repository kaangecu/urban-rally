/**
 * TeamBrowser Component
 * Browse all teams in an event with cyberpunk/modern UI
 * Shows team capacity, status, and allows filtering/search
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeamsForEvent } from '../../services/team.service';
import { getEventById } from '../../services/event.service';
import { getTenantById } from '../../services/tenant.service';
import { getUserParticipationInEvent } from '../../services/teamMember.service';
import { getFirebaseAuth } from '../../services/firebase.service';
import { useAuthStore } from '../../store/authStore';
import { isCyberpunkTheme } from '../../utils/theme';
import { TeamCard } from './TeamCard';
import { TeamDetailModal } from './TeamDetailModal';
import { LoadingState } from '../../components/LoadingSpinner';
import { ErrorState } from '../../components/ErrorState';
import type { Team, Event, TeamMember } from '../../types/schema';

type FilterType = 'all' | 'available' | 'friends';

export function TeamBrowser() {
  const { tenantId, eventId } = useParams<{ tenantId: string; eventId: string }>();
  const navigate = useNavigate();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const { tenant, setTenant } = useAuthStore();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [participation, setParticipation] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  const useCyberpunk = tenant ? isCyberpunkTheme(tenant) : false;

  // Load data
  useEffect(() => {
    if (!tenantId || !eventId) {
      navigate('/');
      return;
    }

    async function loadData() {
      try {
        setIsLoading(true);
        
        // Load tenant if not in store (for unauthenticated users)
        if (!tenant || tenant.id !== tenantId) {
          const tenantData = await getTenantById(tenantId!);
          if (tenantData) {
            setTenant(tenantData);
          }
        }
        
        // Load event details
        const eventData = await getEventById(eventId!);
        if (!eventData) {
          setError('Event not found');
          return;
        }
        setEvent(eventData);
        
        // Load teams
        const teamsData = await getTeamsForEvent(eventId!, tenantId!);
        setTeams(teamsData);
        
        // Check if user already joined
        if (user) {
          const userParticipation = await getUserParticipationInEvent(user.uid, eventId!);
          setParticipation(userParticipation);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading teams:', err);
        setError('Failed to load teams. Please try again.');
        setIsLoading(false);
      }
    }

    loadData();
  }, [tenantId, eventId, user, tenant, setTenant, navigate]);

  // Filter and search teams
  const filteredTeams = teams.filter((team) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        team.teamName?.toLowerCase().includes(query) ||
        team.teamDisplayName?.toLowerCase().includes(query) ||
        team.accessCode.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (activeFilter === 'available') {
      const memberCount = team.memberCount || 0;
      const maxMembers = team.maxMembers || 20;
      return memberCount < maxMembers;
    }
    
    // TODO: friends filter requires member name lookup
    
    return true;
  });

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
  };

  const handleCloseModal = () => {
    setSelectedTeam(null);
  };

  if (isLoading) {
    return <LoadingState message="Loading teams..." />;
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        useCyberpunk 
          ? 'bg-[#050505] bg-gradient-to-br from-indigo-950 via-[#050505] to-[#000000]'
          : 'bg-gray-50'
      }`}>
        <ErrorState 
          title="Failed to load teams"
          message={error}
          onRetry={() => window.location.reload()}
          showHomeButton={true}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center p-6 gap-8 pb-24 ${
      useCyberpunk 
        ? 'bg-[#050505] bg-gradient-to-br from-indigo-950 via-[#050505] to-[#000000]'
        : 'bg-gray-50'
    }`}>
      
      {/* Back Button */}
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 font-medium transition-colors ${
            useCyberpunk
              ? 'text-cyan-400 hover:text-cyan-300'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Header */}
      <div className="w-full max-w-md">
        {useCyberpunk ? (
          <>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 italic uppercase tracking-tighter">
              Squad Select
            </h1>
            <p className="text-cyan-300/70 text-xs font-mono uppercase tracking-widest animate-pulse mt-1">
              &gt; {filteredTeams.length} Squad{filteredTeams.length !== 1 ? 's' : ''} Available
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {event?.name || 'Browse Teams'}
            </h1>
            <p className="text-gray-600">
              {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''} available
            </p>
          </>
        )}
      </div>

      {/* Search & Filter */}
      <div className="w-full max-w-md space-y-4 relative z-10">
        {/* Search Bar */}
        <div className={`flex items-center rounded-xl px-4 py-3 shadow-lg group transition-colors ${
          useCyberpunk
            ? 'bg-white/5 border border-white/10 backdrop-blur-xl focus-within:bg-white/10'
            : 'bg-white border border-gray-200 focus-within:border-blue-500'
        }`}>
          <svg 
            className={`w-5 h-5 transition-colors ${
              useCyberpunk
                ? 'text-pink-400 group-focus-within:text-pink-300'
                : 'text-gray-400 group-focus-within:text-blue-500'
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            type="text" 
            placeholder="Find team name..." 
            className={`w-full bg-transparent border-none focus:outline-none ml-3 font-medium ${
              useCyberpunk
                ? 'text-white placeholder-white/30'
                : 'text-gray-900 placeholder-gray-400'
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`ml-2 p-1 rounded-full transition-colors ${
                useCyberpunk
                  ? 'text-white/50 hover:text-white hover:bg-white/10'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Filter Chips */}
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
              useCyberpunk
                ? activeFilter === 'all'
                  ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                : activeFilter === 'all'
                  ? 'bg-blue-100 border border-blue-500 text-blue-700'
                  : 'bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Teams
          </button>
          <button 
            onClick={() => setActiveFilter('available')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
              useCyberpunk
                ? activeFilter === 'available'
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                : activeFilter === 'available'
                  ? 'bg-green-100 border border-green-500 text-green-700'
                  : 'bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Space Available
          </button>
        </div>
      </div>

      {/* Team List */}
      <div className="w-full max-w-md space-y-4 relative z-10">
        {filteredTeams.length === 0 ? (
          <div className={`text-center py-12 ${
            useCyberpunk ? 'text-white/50' : 'text-gray-500'
          }`}>
            <p className="text-lg font-medium mb-2">No teams found</p>
            <p className="text-sm">
              {searchQuery ? 'Try a different search term' : 'Teams will appear here when created'}
            </p>
          </div>
        ) : (
          filteredTeams.map((team) => (
            <TeamCard 
              key={team.id} 
              team={team} 
              onClick={() => handleTeamClick(team)}
              useCyberpunk={useCyberpunk}
              isJoined={participation?.teamId === team.id}
            />
          ))
        )}
      </div>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <TeamDetailModal
          team={selectedTeam}
          onClose={handleCloseModal}
          useCyberpunk={useCyberpunk}
          isJoined={participation?.teamId === selectedTeam.id}
        />
      )}
    </div>
  );
}
