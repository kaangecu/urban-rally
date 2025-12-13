/**
 * BrowseTeams Component
 * Shows all teams in an event with ability to join
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToEventTeams, canJoinTeam } from '../../services/team.service';
import { joinTeam, getUserParticipationInEvent } from '../../services/teamMember.service';
import { getFirebaseAuth } from '../../services/firebase.service';
import { ParticipationBanner } from './ParticipationBanner';
import { LoadingState } from '../LoadingSpinner';
import { ErrorState } from '../ErrorState';
import type { Team, TeamMember } from '../../types/schema';

export function BrowseTeams() {
  const { tenantId, eventId } = useParams<{ tenantId: string; eventId: string }>();
  const navigate = useNavigate();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const [teams, setTeams] = useState<Team[]>([]);
  const [participation, setParticipation] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);

  // Validate URL parameters
  useEffect(() => {
    if (!tenantId || !eventId) {
      console.warn('Missing tenantId or eventId in URL');
      navigate('/events');
    }
  }, [tenantId, eventId, navigate]);

  useEffect(() => {
    if (!tenantId || !eventId) return;

    // Load user's participation status
    async function loadParticipation() {
      if (!user) return;
      try {
        const userParticipation = await getUserParticipationInEvent(user.uid, eventId!);
        setParticipation(userParticipation);
      } catch (err) {
        console.error('Error loading participation:', err);
        setError('Failed to load participation status');
      }
    }
    loadParticipation();

    try {
      const unsubscribe = subscribeToEventTeams(
        tenantId!,
        eventId!,
        (updatedTeams) => {
          setTeams(updatedTeams);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error subscribing to teams:', err);
      setError('Failed to load teams. Please try again.');
      setIsLoading(false);
    }
  }, [tenantId, eventId, user]);

  const handleJoinTeam = async (team: Team) => {
    if (!user) {
      alert('You must be logged in to join a team');
      return;
    }

    try {
      setJoiningTeamId(team.id);

      // Check if user can join
      const { canJoin, reason } = await canJoinTeam(team.id);
      if (!canJoin) {
        alert(reason || 'Cannot join this team');
        setJoiningTeamId(null);
        return;
      }

      // Join the team
      await joinTeam({
        userId: user.uid,
        teamId: team.id,
        eventId: eventId!,
        tenantId: tenantId!,
        role: 'member',
      });

      // Navigate to dashboard
      navigate(`/tenant/${tenantId}/event/${eventId}/dashboard`);
    } catch (error: any) {
      console.error('Error joining team:', error);
      alert(error.message || 'Failed to join team. Please try again.');
    } finally {
      setJoiningTeamId(null);
    }
  };

  const filteredTeams = teams.filter((team) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      team.teamName?.toLowerCase().includes(query) ||
      team.accessCode.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return <LoadingState message="Loading teams..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gray-50">
      {/* Participation Banner */}
      {participation && (
        <ParticipationBanner 
          participation={participation}
          currentEventId={eventId!}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Teams
          </h1>
          <p className="text-gray-600">
            Join an existing team or wait for your team to be created
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search teams by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-xl text-gray-600 mb-2">
              {searchQuery ? 'No teams found' : 'No teams available yet'}
            </p>
            <p className="text-gray-500">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Teams will appear here once they are created'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
              >
                {/* Team Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {team.teamName || team.accessCode}
                </h3>

                {/* Access Code */}
                <p className="text-sm text-gray-500 mb-4">
                  Code: <span className="font-mono font-semibold">{team.accessCode}</span>
                </p>

                {/* Team Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Members</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {team.memberCount || 0}
                      {team.maxMembers && (
                        <span className="text-sm text-gray-500">/{team.maxMembers}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Score</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {team.score}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Tasks</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {team.completedTaskIds.length}
                    </div>
                  </div>
                </div>

                {/* Join Button */}
                <button
                  onClick={() => handleJoinTeam(team)}
                  disabled={
                    joiningTeamId === team.id ||
                    (team.maxMembers ? (team.memberCount || 0) >= team.maxMembers : false)
                  }
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    joiningTeamId === team.id
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : team.maxMembers && (team.memberCount || 0) >= team.maxMembers
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {joiningTeamId === team.id
                    ? 'Joining...'
                    : team.maxMembers && (team.memberCount || 0) >= team.maxMembers
                    ? 'Team Full'
                    : 'Join Team'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
