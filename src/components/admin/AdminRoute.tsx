import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';

/**
 * Admin Route Guard
 * 
 * Protects admin routes from unauthorized access.
 * Checks if user has admin role via Custom Claims.
 * 
 * Usage:
 * ```tsx
 * <Route path="/admin/*" element={
 *   <AdminRoute requiredRole="organizer">
 *     <AdminDashboard />
 *   </AdminRoute>
 * } />
 * ```
 */

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'superadmin' | 'admin' | 'organizer' | 'moderator';
  requiredTenant?: string; // Optional: Require access to specific tenant
}

export function AdminRoute({ children, requiredRole = 'moderator', requiredTenant }: AdminRouteProps) {
  const { adminProfile, loading, hasRole, canManageTenant } = useAdminAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-400 font-mono">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or not an admin
  if (!adminProfile) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check role requirement
  if (!hasRole(requiredRole)) {
    console.log('[AdminRoute] Access denied:', {
      requiredRole,
      userRole: adminProfile.role,
      highestRole: adminProfile.highestRole,
      isSuperadmin: adminProfile.isSuperadmin,
      tenantRoles: adminProfile.tenantRoles,
    });
    
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-8 max-w-md text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-500/10 border border-red-500/50 mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-slate-400 mb-6">
            You need <span className="text-blue-400 font-mono">{requiredRole}</span> role or higher to access this page.
          </p>
          <p className="text-xs text-slate-500 font-mono mb-2">
            Your role: <span className="text-slate-300">{adminProfile.role}</span>
          </p>
          {adminProfile.highestRole && (
            <p className="text-xs text-slate-500 font-mono">
              Highest role: <span className="text-slate-300">{adminProfile.highestRole}</span>
            </p>
          )}
          <button
            onClick={() => window.history.back()}
            className="mt-6 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check tenant requirement
  if (requiredTenant && !canManageTenant(requiredTenant)) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-8 max-w-md text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-orange-500/10 border border-orange-500/50 mb-4">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Tenant Access Required</h2>
          <p className="text-sm text-slate-400 mb-6">
            You don't have permission to manage this organization.
          </p>
          <p className="text-xs text-slate-500 font-mono">
            Tenant ID: <span className="text-slate-300">{requiredTenant}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // User has required permissions
  return <>{children}</>;
}
