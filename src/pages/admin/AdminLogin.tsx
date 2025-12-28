import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase.service';
import { useAdminAuth } from '../../hooks/useAdminAuth';

/**
 * Admin Login Page
 * 
 * Email/password authentication for admin users.
 * Uses Tactical Ops theme (slate/zinc palette).
 * 
 * Only users with Custom Claims (role: admin/organizer/moderator) can access admin portal.
 */

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminProfile, loading: authLoading } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (!authLoading && adminProfile) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [adminProfile, authLoading, navigate, location]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Sign in with email/password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user has admin role in custom claims
      const idTokenResult = await user.getIdTokenResult();
      const claims = idTokenResult.claims;

      if (!claims.role) {
        // User exists but is not an admin
        await auth.signOut();
        setError('This account does not have admin privileges. Please use the player app.');
        setIsLoading(false);
        return;
      }

      // Valid admin user - useAdminAuth hook will handle profile loading
      // Navigation happens via useEffect above
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      if (err instanceof Error) {
        // Firebase Auth error codes
        const errorCode = (err as { code?: string }).code;
        
        switch (errorCode) {
          case 'auth/user-not-found':
            setError('No admin account found with this email.');
            break;
          case 'auth/wrong-password':
            setError('Incorrect password. Please try again.');
            break;
          case 'auth/invalid-email':
            setError('Invalid email format.');
            break;
          case 'auth/too-many-requests':
            setError('Too many failed attempts. Please try again later.');
            break;
          default:
            setError('Login failed. Please check your credentials.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  // Show loading state during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-400 font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-600/10 border border-blue-600/50 mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-sm text-slate-400 font-mono uppercase tracking-widest">Mission Control</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setError(null)}
                required
                disabled={isLoading}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                placeholder="admin@organization.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setError(null)}
                required
                disabled={isLoading}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center font-mono">
              🔒 Secure admin access • Contact your organization for credentials
            </p>
          </div>
        </div>

        {/* Back to Player App */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-400 hover:text-slate-300 underline decoration-slate-600 hover:decoration-slate-400 transition-colors"
          >
            ← Back to Player App
          </button>
        </div>
      </div>
    </div>
  );
}
