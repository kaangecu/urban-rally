import { useState } from 'react';
import { useAdminContext } from '../../hooks/useAdminContext';
import { useAdminStore } from '../../store/adminStore';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  StaffList,
  RoleChangeModal,
  RemoveAccessModal,
  ExpirationModal,
  AuditLog,
} from './components';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import type { User } from '../../types/schema';

/**
 * AdminDashboard Page - Phase 3 Enhancement + Approach A Refactor
 * 
 * Main dashboard for admin portal with self-service role management
 * 
 * Features:
 * - Context switcher in header
 * - Staff list with real-time updates
 * - All Users tab for promoting players
 * - Role change modal
 * - Remove access confirmation
 * - Expiration management
 * - Audit log viewer
 * - Loading/error states
 * - Permission-based rendering
 * 
 * Usage:
 * ```tsx
 * <Route path="/admin" element={<AdminDashboard />} />
 * ```
 * 
 * @version 2.0 - Phase 3
 * @date December 30, 2025
 */

type ModalState =
  | { type: 'none' }
  | { type: 'changeRole'; user: User }
  | { type: 'remove'; user: User }
  | { type: 'expiration'; user: User };

export function AdminDashboard() {
  const { loading, error } = useAdminContext();
  const { activeTenantId, availableTenants, getActiveRole } = useAdminStore();
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });
  const [activeTab, setActiveTab] = useState<'staff' | 'audit'>('staff');

  const activeRole = getActiveRole();
  const activeTenant = availableTenants.find((t: { id: string }) => t.id === activeTenantId);

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
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have admin permissions for any organization. Contact your organization administrator to request access.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-left">
            <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">For Testing:</p>
            <p className="text-blue-800 dark:text-blue-400">
              Login with one of these test admin accounts:
            </p>
            <ul className="mt-2 space-y-1 text-blue-700 dark:text-blue-500 font-mono text-xs">
              <li>• superadmin@test.com / admin123</li>
              <li>• admin@test.com / admin123</li>
              <li>• organizer@test.com / admin123</li>
              <li>• moderator@test.com / admin123</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-full bg-gray-50 dark:bg-gray-900">
        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Staff Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage roles and permissions for your team
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('staff')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'staff'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Staff Management
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'audit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activity Log
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'staff' && (
          <StaffList
            onChangeRole={(user: User) => {
              setModalState({ type: 'changeRole', user });
            }}
            onRemove={(user: User) => {
              setModalState({ type: 'remove', user });
            }}
            onManageExpiration={(user: User) => {
              setModalState({ type: 'expiration', user });
            }}
          />
        )}

        {activeTab === 'audit' && <AuditLog />}
      </main>

      {/* Modals */}
      {modalState.type === 'changeRole' && (
        <RoleChangeModal
          user={modalState.user}
          currentRole={
            modalState.user.tenantRoles?.[activeTenantId!]?.role
          }
          onClose={() => setModalState({ type: 'none' })}
          onSuccess={() => {
            setModalState({ type: 'none' });
            // Refresh staff list (real-time updates should handle this)
          }}
        />
      )}

      {modalState.type === 'removeAccess' && (
        <RemoveAccessModal
          user={modalState.user}
          currentRole={
            modalState.user.tenantRoles?.[activeTenantId!]?.role || 'moderator'
          }
          onClose={() => setModalState({ type: 'none' })}
          onSuccess={() => {
            setModalState({ type: 'none' });
            // Refresh staff list (real-time updates should handle this)
          }}
        />
      )}

      {modalState.type === 'manageExpiration' && (
        <ExpirationModal
          user={modalState.user}
          currentRole={
            modalState.user.tenantRoles?.[activeTenantId!]?.role || 'moderator'
          }
          currentExpiration={
            modalState.user.tenantRoles?.[activeTenantId!]?.expiresAt
              ? new Date(modalState.user.tenantRoles[activeTenantId!].expiresAt!)
              : null
          }
          onClose={() => setModalState({ type: 'none' })}
          onSuccess={() => {
            setModalState({ type: 'none' });
            // Refresh staff list (real-time updates should handle this)
          }}
        />
      )}
      </div>
    </AdminLayout>
  );
}
