import { useState } from 'react';
import { useAdminContext } from '../../../hooks/useAdminContext';
import { useAdminStore } from '../../../store/adminStore';
import { ContextSwitcher, StaffList, InviteModal } from '../components';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

/**
 * AdminDashboard Page - Phase 2 Implementation
 * 
 * Main dashboard for admin portal
 * 
 * Features:
 * - Context switcher in header
 * - Staff list with real-time updates
 * - Invite modal integration
 * - Loading/error states
 * - Permission-based rendering
 * 
 * Usage:
 * ```tsx
 * <Route path="/admin" element={<AdminDashboard />} />
 * ```
 * 
 * @version 1.0
 * @date December 30, 2025
 */

export function AdminDashboard() {
  const { loading, error } = useAdminContext();
  const { activeTenantId, availableTenants, getActiveRole } = useAdminStore();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const activeRole = getActiveRole();
  const activeTenant = availableTenants.find((t) => t.id === activeTenantId);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading admin context...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Admin Context
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // No tenants state
  if (!activeTenantId || availableTenants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Admin Access
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have admin permissions for any organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {activeTenant?.name} • {activeRole}
              </p>
            </div>
            <ContextSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StaffList onInvite={() => setShowInviteModal(true)} />
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          tenantId={activeTenantId}
          tenantName={activeTenant?.name}
        />
      )}
    </div>
  );
}
