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
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
