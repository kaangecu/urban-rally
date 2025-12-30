import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import type { Role } from '../../types/schema';

/**
 * AdminRoute Guard - Phase 2 Implementation
 * 
 * Protects admin routes by checking user role
 * 
 * Features:
 * - Checks if user has minimum required role
 * - Uses Firebase Custom Claims (authoritative)
 * - Redirects to login if not authenticated
 * - Redirects to home if insufficient permissions
 * - Shows loading state while checking auth
 * 
 * Usage:
 * ```tsx
 * <Route 
 *   path="/admin/*" 
 *   element={
 *     <AdminRoute minRole="moderator">
 *       <AdminDashboard />
 *     </AdminRoute>
 *   } 
 * />
 * ```
 * 
 * @version 1.0
 * @date December 30, 2025
 */

interface AdminRouteProps {
  children: React.ReactNode;
  minRole?: Role;
}

export function AdminRoute({ children, minRole = 'moderator' }: AdminRouteProps) {
  const user = useAuthStore((state: { user: any }) => state.user);
  const isAuthenticated = useAuthStore((state: { isAuthenticated: boolean }) => state.isAuthenticated);
  const isLoading = useAuthStore((state: { isLoading: boolean }) => state.isLoading);
  const { hasRole } = useAdminStore();

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check if user has required role
  if (!hasRole(minRole)) {
    // User doesn't have sufficient permissions
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
