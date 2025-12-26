/**
 * LeaveTeamButton Component
 * Allows users to leave their current team with confirmation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { leaveTeam } from '../../services/teamMember.service';

interface LeaveTeamButtonProps {
  teamId: string;
  teamName: string;
  eventId: string;
  isOwner?: boolean;
}

export function LeaveTeamButton({ 
  teamId, 
  teamName, 
  eventId,
  isOwner = false 
}: LeaveTeamButtonProps) {
  const navigate = useNavigate();
  const { user, setTeam } = useAuthStore();
  const [isLeaving, setIsLeaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleLeaveTeam = async () => {
    if (!user) return;

    try {
      setIsLeaving(true);

      // Call leaveTeam service
      await leaveTeam({
        userId: user.id,
        teamId,
        eventId,
      });

      console.log('✅ Left team successfully');

      // Clear team from state (but keep user session!)
      setTeam(null);
      
      // Redirect to events page to join another team
      navigate('/events');

    } catch (error: any) {
      console.error('Error leaving team:', error);
      alert(error.message || 'Failed to leave team. Please try again.');
    } finally {
      setIsLeaving(false);
      setShowConfirmation(false);
    }
  };

  if (!showConfirmation) {
    return (
      <button
        onClick={() => setShowConfirmation(true)}
        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 
                   bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 
                   transition-colors font-medium"
      >
        <LogOut className="w-4 h-4" />
        Leave Team
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Leave Team?
        </h2>

        {/* Message */}
        <div className="text-gray-700 space-y-3 mb-6">
          <p className="text-center">
            Are you sure you want to leave{' '}
            <span className="font-semibold text-gray-900">"{teamName}"</span>?
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-amber-900 text-sm">ℹ️ What happens:</p>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>You'll be removed from this team</li>
              <li>Your account and progress will be saved</li>
              <li>You can join another team immediately</li>
              {isOwner && (
                <li className="font-semibold text-red-800">
                  As team owner, you must transfer ownership first
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmation(false)}
            disabled={isLeaving}
            className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 
                     text-gray-700 font-medium hover:bg-gray-50 transition-colors
                     disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLeaveTeam}
            disabled={isLeaving || isOwner}
            className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white 
                     font-medium hover:bg-red-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {isLeaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Leaving...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Leave Team
              </>
            )}
          </button>
        </div>

        {isOwner && (
          <p className="text-xs text-center text-red-600 mt-3">
            Team owners cannot leave. Transfer ownership first.
          </p>
        )}
      </div>
    </div>
  );
}
