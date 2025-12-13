/**
 * RecoveryCodeLogin Component
 * Allows users to recover access using their recovery code
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateRecoveryCode, getUserEvents } from '../../services/user.service';
import { getUserParticipationInEvent } from '../../services/teamMember.service';
import { getTeamById } from '../../services/team.service';
import { getTenantById } from '../../services/tenant.service';
import { useAuthStore } from '../../store/authStore';

export function RecoveryCodeLogin() {
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setUser, setTeam, setTenant } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!recoveryCode.trim()) {
      setError('Please enter your recovery code');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validate recovery code and get user data
      const user = await validateRecoveryCode(recoveryCode);
      
      if (!user) {
        setError('Invalid or expired recovery code');
        return;
      }
      
      // Update auth store
      setUser(user);
      
      // Get user's events to determine navigation
      const events = await getUserEvents(user.id);
      
      if (events.length === 0) {
        // No events found - shouldn't happen but handle gracefully
        setError('No active events found. Please contact your organizer.');
        return;
      }
      
      if (events.length === 1) {
        // Single event - load team data and navigate directly to dashboard
        const event = events[0];
        const participation = await getUserParticipationInEvent(user.id, event.id);
        
        if (!participation) {
          setError('Could not find team membership. Please contact your organizer.');
          return;
        }
        
        const team = await getTeamById(participation.teamId);
        const tenant = await getTenantById(event.tenantId);
        
        if (!team || !tenant) {
          setError('Could not load team data. Please contact your organizer.');
          return;
        }
        
        setTeam(team);
        setTenant(tenant);
        
        // Navigate directly to the team's dashboard
        navigate(`/tenant/${tenant.id}/event/${event.id}/dashboard`);
        console.log('✅ User recovered access (single event) - navigating to dashboard');
      } else {
        // Multiple events - go to event selector
        navigate('/events');
        console.log(`✅ User recovered access (${events.length} events) - navigating to event selector`);
      }
      
    } catch (err) {
      console.error('Recovery code error:', err);
      setError('Failed to validate recovery code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔑</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Recover Access
        </h1>
        <p className="text-gray-600">
          Enter your recovery code to regain access to your account
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Recovery Code Input */}
        <div className="mb-6">
          <label htmlFor="recoveryCode" className="block text-sm font-medium text-gray-700 mb-2">
            Recovery Code
          </label>
          <input
            id="recoveryCode"
            type="text"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            placeholder="Enter your 12-character code"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-center text-lg tracking-wider"
            maxLength={12}
            disabled={isSubmitting}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Where's my recovery code?</strong>
          </p>
          <p className="text-sm text-blue-700 mt-1">
            You received your recovery code when you first joined. Check your email or saved notes.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !recoveryCode.trim()}
          className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Validating...' : 'Recover Access'}
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Need help? Contact your event organizer</p>
      </div>
    </div>
  );
}
