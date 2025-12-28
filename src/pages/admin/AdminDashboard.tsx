import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useAdminStore } from '../../store/adminStore';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase.service';
import { useNavigate } from 'react-router-dom';

/**
 * Admin Dashboard
 * 
 * Main landing page for admin portal.
 * Shows welcome message and basic stats (placeholder for Phase 5).
 */

export function AdminDashboard() {
  const navigate = useNavigate();
  const { adminProfile } = useAdminAuth();
  const { clearAdminState } = useAdminStore();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearAdminState();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!adminProfile) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-sm text-slate-400 font-mono uppercase tracking-widest">Mission Control</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Welcome Card */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-blue-600/10 border border-blue-600/50 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-500 font-mono">
                  {adminProfile.displayName?.charAt(0) || adminProfile.email.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                Welcome, {adminProfile.displayName || adminProfile.email}
              </h2>
              <div className="flex items-center gap-3 text-sm">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  adminProfile.role === 'superadmin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  adminProfile.role === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  adminProfile.role === 'organizer' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  adminProfile.role === 'moderator' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {adminProfile.role}
                </span>
                <span className="text-slate-400 font-mono">
                  {adminProfile.managedTenantIds.length > 0 
                    ? `Managing ${adminProfile.managedTenantIds.length} tenant(s)`
                    : 'All tenants access'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Stats (shown if admin has played) */}
        {adminProfile.eventsParticipated > 0 && (
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <h3 className="text-sm font-bold text-purple-300 uppercase tracking-widest">Your Player Stats</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                You're also a player!
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Score</p>
                <p className="text-2xl font-mono font-bold text-white">{adminProfile.totalScore || 0}</p>
                <p className="text-xs text-purple-400 mt-1">Points earned</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Submissions</p>
                <p className="text-2xl font-mono font-bold text-white">{adminProfile.totalSubmissions || 0}</p>
                <p className="text-xs text-purple-400 mt-1">Tasks completed</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Events Played</p>
                <p className="text-2xl font-mono font-bold text-white">{adminProfile.eventsParticipated}</p>
                <p className="text-xs text-purple-400 mt-1">Hunts joined</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats (Placeholder) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Events</h3>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            <p className="text-3xl font-mono font-bold text-white mb-2">0</p>
            <p className="text-xs text-slate-500">Coming in Phase 2</p>
          </div>

          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tasks</h3>
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
            <p className="text-3xl font-mono font-bold text-white mb-2">0</p>
            <p className="text-xs text-slate-500">Coming in Phase 3</p>
          </div>

          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Submissions</h3>
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
            </div>
            <p className="text-3xl font-mono font-bold text-white mb-2">0</p>
            <p className="text-xs text-slate-500">Coming in Phase 4</p>
          </div>
        </div>

        {/* Status Panel */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <span className="text-sm text-slate-300">Authentication</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-mono text-emerald-400">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <span className="text-sm text-slate-300">Cloud Functions</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-mono text-emerald-400">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-300">Firestore</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-mono text-emerald-400">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 1 Complete Notice */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-bold text-blue-400 mb-1">Phase 1 Complete ✅</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Admin authentication and RBAC system is now active. 
                Event Management (Phase 2), Task Management (Phase 3), and Submission Review (Phase 4) coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
