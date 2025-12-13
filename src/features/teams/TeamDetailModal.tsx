/**
 * TeamDetailModal Component
 * Bottom sheet modal showing team details and join button
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTeamWithMembers } from '../../services/team.service';
import { joinTeam } from '../../services/teamMember.service';
import { getFirebaseAuth } from '../../services/firebase.service';
import { useAuthStore } from '../../store/authStore';
import { IdentityUplinkModal } from '../../components/auth/IdentityUplinkModal';
import type { Team, User } from '../../types/schema';

interface TeamDetailModalProps {
  team: Team;
  onClose: () => void;
  useCyberpunk: boolean;
  isJoined: boolean;
}

export function TeamDetailModal({ team, onClose, useCyberpunk, isJoined }: TeamDetailModalProps) {
  const { tenantId, eventId } = useParams<{ tenantId: string; eventId: string }>();
  const navigate = useNavigate();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const { setTeam: setAuthTeam } = useAuthStore();
  
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const teamDisplayName = team.teamDisplayName || team.teamName || `Team ${team.accessCode}`;
  const teamEmoji = team.teamName?.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '👥';
  
  // Calculate team status
  const memberCount = team.memberCount || 0;
  const maxMembers = team.maxMembers || 20;
  const isFull = memberCount >= maxMembers;
  const availableSlots = Math.max(0, maxMembers - memberCount);

  // Load team members
  useEffect(() => {
    async function loadTeamDetails() {
      try {
        const result = await getTeamWithMembers(team.id);
        if (result) {
          setMembers(result.members);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading team details:', error);
        setIsLoading(false);
      }
    }
    
    loadTeamDetails();
  }, [team.id]);

  const handleJoinTeam = async () => {
    if (!user) {
      // Not authenticated - show auth modal instead of redirecting
      setShowAuthModal(true);
      return;
    }
    
    if (!tenantId || !eventId) {
      alert('Missing event information');
      return;
    }

    if (isFull) {
      alert('This team is full');
      return;
    }

    try {
      setIsJoining(true);

      // Join the team
      await joinTeam({
        userId: user.uid,
        teamId: team.id,
        eventId: eventId!,
        tenantId: tenantId!,
        role: 'member',
      });

      // Update auth store
      setAuthTeam(team);
      
      // Navigate to dashboard
      navigate(`/tenant/${tenantId}/event/${eventId}/dashboard`);
    } catch (error: any) {
      console.error('Error joining team:', error);
      alert(error.message || 'Failed to join team. Please try again.');
      setIsJoining(false);
    }
  };

  const handleAuthSuccess = async (authenticatedUser: User) => {
    // User has been authenticated, now join the team
    if (!tenantId || !eventId) {
      alert('Missing event information');
      return;
    }

    try {
      setIsJoining(true);
      
      // Join the team with newly created user
      await joinTeam({
        userId: authenticatedUser.id,
        teamId: team.id,
        eventId: eventId!,
        tenantId: tenantId!,
        role: 'member',
      });

      // Update auth store
      setAuthTeam(team);
      
      // Close modals
      setShowAuthModal(false);
      onClose();
      
      // Navigate to dashboard
      navigate(`/tenant/${tenantId}/event/${eventId}/dashboard`);
    } catch (error: any) {
      console.error('Error joining team:', error);
      alert(error.message || 'Failed to join team. Please try again.');
      setIsJoining(false);
      setShowAuthModal(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (useCyberpunk) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={handleBackdropClick}
      >
        <div className="relative rounded-t-3xl border-t border-white/10 bg-gray-900/90 p-6 backdrop-blur-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)] max-w-md w-full mx-auto animate-slideUp">
          
          {/* Drag Handle */}
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8"></div>

          {/* Team Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full rounded-[15px] bg-gray-900 flex items-center justify-center text-3xl">
                {teamEmoji}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">
                {teamDisplayName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {!isFull && !isJoined && (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span className="text-xs font-mono text-cyan-400">OPEN TO JOIN</span>
                  </>
                )}
                {isJoined && (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400"></span>
                    <span className="text-xs font-mono text-green-400">YOUR TEAM</span>
                  </>
                )}
                {isFull && !isJoined && (
                  <span className="text-xs font-mono text-red-400">FULL SQUAD</span>
                )}
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
              <span>Squad Capacity</span>
              <span className="text-white">{team.memberCount || 0}/{team.maxMembers || 20}</span>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <div 
                style={{ width: `${Math.min((team.memberCount || 0) / (team.maxMembers || 20) * 100, 100)}%` }}
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
              ></div>
            </div>
          </div>

          {/* Members Preview */}
          {!isLoading && members.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                Squad Members ({members.length})
              </h3>
              <div className="space-y-2">
                {members.slice(0, 3).map((member, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-cyan-300 font-bold">
                      {member.displayName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-gray-300">{member.displayName || 'Anonymous'}</span>
                  </div>
                ))}
                {members.length > 3 && (
                  <p className="text-xs text-gray-500 ml-11">
                    ...and {members.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          {isJoined ? (
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg"
            >
              Close
            </button>
          ) : isFull ? (
            <button
              disabled
              className="w-full rounded-xl bg-gray-800 py-4 text-sm font-black uppercase tracking-widest text-gray-500 cursor-not-allowed"
            >
              Squad Full
            </button>
          ) : (
            <button
              onClick={handleJoinTeam}
              disabled={isJoining}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-900/50 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? 'Joining...' : `Join Squad (${availableSlots} slots left)`}
            </button>
          )}
        </div>
        
        {/* Identity Uplink Modal (Auth) */}
        <IdentityUplinkModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          teamName={teamDisplayName}
          tenantId={tenantId!}
          teamId={team.id}
        />
      </div>
    );
  }

  // Light Theme Modal
  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fadeIn"
        onClick={handleBackdropClick}
      >
      <div className="relative rounded-t-3xl bg-white p-6 shadow-2xl max-w-md w-full mx-auto animate-slideUp">
        
        {/* Drag Handle */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

        {/* Team Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl shadow-lg">
            {teamEmoji}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {teamDisplayName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {!isFull && !isJoined && (
                <span className="text-sm text-green-600 font-medium">Open to join</span>
              )}
              {isJoined && (
                <span className="text-sm text-blue-600 font-medium">Your team</span>
              )}
              {isFull && !isJoined && (
                <span className="text-sm text-red-600 font-medium">Full</span>
              )}
            </div>
          </div>
        </div>

        {/* Capacity */}
        <div className="mb-6">
          <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
            <span>Capacity</span>
            <span className="text-gray-900">{team.memberCount || 0}/{team.maxMembers || 20} members</span>
          </div>
          <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min((team.memberCount || 0) / (team.maxMembers || 20) * 100, 100)}%` }}
              className="h-full bg-blue-500"
            ></div>
          </div>
        </div>

        {/* Members Preview */}
        {!isLoading && members.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Team Members ({members.length})
            </h3>
            <div className="space-y-2">
              {members.slice(0, 3).map((member, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                    {member.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-gray-700">{member.displayName || 'Anonymous'}</span>
                </div>
              ))}
              {members.length > 3 && (
                <p className="text-xs text-gray-500 ml-11">
                  ...and {members.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        {isJoined ? (
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gray-600 py-4 text-sm font-bold uppercase tracking-wide text-white hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        ) : isFull ? (
          <button
            disabled
            className="w-full rounded-xl bg-gray-300 py-4 text-sm font-bold uppercase tracking-wide text-gray-500 cursor-not-allowed"
          >
            Team Full
          </button>
        ) : (
          <button
            onClick={handleJoinTeam}
            disabled={isJoining}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold uppercase tracking-wide text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining...' : `Join Team (${availableSlots} slots available)`}
          </button>
        )}
      </div>
    </div>
      
    {/* Identity Uplink Modal (Auth) */}
    <IdentityUplinkModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      onSuccess={handleAuthSuccess}
      teamName={teamDisplayName}
      tenantId={tenantId!}
      teamId={team.id}
    />
    </>
  );
}
