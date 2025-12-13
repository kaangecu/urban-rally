/**
 * Simplified Team Code Login
 * Users enter team code, then authenticate via IdentityUplinkModal
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getTeamByAccessCode, isTeamFull } from '../../services/team.service';
import { getTenantById } from '../../services/tenant.service';
import { joinTeam } from '../../services/teamMember.service';
import { IdentityUplinkModal } from '../../components/auth/IdentityUplinkModal';
import type { Team, User } from '../../types/schema';

export function TeamCodeLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // useAuthStore imported but no selectors needed - we use setState() directly
  
  const [code, setCode] = useState('');
  const [validatedTeam, setValidatedTeam] = useState<Team | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Pre-fill code from URL if present
  useEffect(() => {
    const prefilledCode = searchParams.get('code');
    if (prefilledCode) {
      setCode(prefilledCode);
      // Auto-validate if code looks valid
      if (prefilledCode.length >= 3) {
        handleValidateCode(prefilledCode);
      }
    }
  }, [searchParams]);

  const handleValidateCode = async (codeToValidate?: string) => {
    const teamCode = codeToValidate || code;
    
    if (!teamCode || teamCode.trim().length < 3) {
      setError('Please enter a valid team code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Find team by access code
      const team = await getTeamByAccessCode(teamCode.trim());
      
      if (!team) {
        setError('Invalid team code. Please check and try again.');
        setValidatedTeam(null);
        return;
      }
      
      // Check if team is active
      if (!team.isActive) {
        setError('This team is currently inactive');
        setValidatedTeam(null);
        return;
      }
      
      // Check if team is full
      const isFull = await isTeamFull(team.id);
      if (isFull) {
        setError('This team is full. Please try a different team.');
        setValidatedTeam(null);
        return;
      }

      // Get tenant info
      const tenant = await getTenantById(team.tenantId);
      if (!tenant) {
        setError('Could not load team information. Please try again.');
        setValidatedTeam(null);
        return;
      }

      // Success - store team and show auth modal
      setValidatedTeam(team);
      setTenantId(tenant.id);
      setShowAuthModal(true);
      
    } catch (err) {
      console.error('Error validating team code:', err);
      setError('An error occurred. Please try again.');
      setValidatedTeam(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleValidateCode();
  };

  const handleAuthSuccess = async (user: User) => {
    if (!validatedTeam || !tenantId) {
      setError('Missing team information. Please try again.');
      return;
    }

    try {
      console.log('🎯 Starting team join process...', {
        userId: user.id,
        teamId: validatedTeam.id,
        eventId: validatedTeam.eventId,
        tenantId: tenantId,
      });

      // Join the team FIRST (this creates the TeamMember record)
      await joinTeam({
        userId: user.id,
        teamId: validatedTeam.id,
        eventId: validatedTeam.eventId,
        tenantId: tenantId,
        role: 'member',
      });

      console.log('✅ Team join successful - TeamMember record created');

      // Get tenant data
      const tenant = await getTenantById(tenantId);
      
      if (!tenant) {
        throw new Error('Failed to load tenant information');
      }

      // ⚡ OPTIMIZATION: Batch state updates to reduce re-renders from 3 to 1
      // Instead of: setAuthTeam() → re-render #1, setTenant() → re-render #2
      // We do: Single setState() → re-render #1
      useAuthStore.setState({
        team: validatedTeam,
        tenant: tenant,
        isAuthenticated: true,
        error: null,
      });
      
      console.log('✅ Auth store updated (batched):', {
        team: validatedTeam.teamName || validatedTeam.accessCode,
        tenant: tenant.name,
      });
      
      // Close modal (optimistically - happens immediately)
      setShowAuthModal(false);
      
      // Navigate to dashboard
      console.log('🚀 Navigating to dashboard...');
      navigate(`/tenant/${tenantId}/event/${validatedTeam.eventId}/dashboard`);
      
    } catch (err: any) {
      console.error('❌ Error in handleAuthSuccess:', err);
      setError(err.message || 'Failed to join team. Please try again.');
      setShowAuthModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Trophy className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Your Team
          </h1>
          <p className="text-gray-600">
            Enter your team code to get started
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Team Code Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="teamCode" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Team Code
            </label>
            <input
              id="teamCode"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="e.g., NEON-42"
              disabled={isValidating}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-mono text-lg uppercase"
              autoFocus
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Your team captain should have shared this code with you
            </p>
          </div>

          <button
            type="submit"
            disabled={isValidating || code.trim().length < 3}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Validating...
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        {/* Back to Login Methods */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to login options
          </button>
        </div>
      </div>

      {/* Identity Uplink Modal */}
      {validatedTeam && tenantId && (
        <IdentityUplinkModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setValidatedTeam(null);
          }}
          onSuccess={handleAuthSuccess}
          teamName={validatedTeam.teamDisplayName || validatedTeam.teamName || validatedTeam.accessCode}
          tenantId={tenantId}
          teamId={validatedTeam.id}
        />
      )}
    </div>
  );
}
