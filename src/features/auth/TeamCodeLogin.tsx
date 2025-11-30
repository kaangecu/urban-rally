import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getTeamByAccessCode, linkTeamToUser } from '../../services/team.service';
import { getTenantById } from '../../services/tenant.service';
import { applyTenantTheme } from '../../services/tenant.service';

export function TeamCodeLogin() {
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { setTeam, setTenant, setError, setLoading, error, isLoading } = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      setError('Please enter your team code');
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      // 1. Find team by access code
      const team = await getTeamByAccessCode(accessCode);
      
      if (!team) {
        setError('Invalid team code. Please check and try again.');
        setIsSubmitting(false);
        return;
      }
      
      // 2. Check if team is active
      if (!team.isActive) {
        setError('This team has been deactivated. Contact your organizer.');
        setIsSubmitting(false);
        return;
      }
      
      // 3. Get tenant/organization info
      const tenant = await getTenantById(team.tenantId);
      
      if (!tenant || !tenant.isActive) {
        setError('Event is not currently active.');
        setIsSubmitting(false);
        return;
      }
      
      // 4. Link team to Firebase Anonymous Auth
      await linkTeamToUser(team.id);
      
      // 5. Apply tenant branding
      applyTenantTheme(tenant);
      
      // 6. Update auth store
      setTenant(tenant);
      setTeam(team);
      
      // Success! User will be redirected by routing logic
      console.log('✅ Team logged in:', team.teamName || team.accessCode);
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            UrbanRally
          </h1>
          <p className="text-gray-600">
            Enter your team code to start
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Code Input */}
            <div>
              <label 
                htmlFor="accessCode" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Team Access Code
              </label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="e.g., BER-42"
                className="w-full px-4 py-3 text-lg font-mono tracking-wider uppercase border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isLoading}
                autoComplete="off"
                maxLength={20}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting || !accessCode.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 min-h-[44px] text-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </span>
              ) : (
                'Join Game'
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Don't have a code?</p>
            <p className="mt-1">Contact your event organizer</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Powered by UrbanRally</p>
        </div>
      </div>
    </div>
  );
}
