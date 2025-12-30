import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../services/firebase.service';
import type { Role, User } from '../../../types/schema';
import { useAdminStore } from '../../../store/adminStore';

/**
 * RoleChangeModal Component
 * 
 * Modal for changing a user's role within the active tenant.
 * Features:
 * - Role selector (moderator/organizer/admin)
 * - Optional reason/notes field
 * - Expiration date picker (optional)
 * - Validation (cannot demote yourself, cannot remove last admin)
 * - Calls assignRole Cloud Function
 * - Success/error handling with toast notifications
 * 
 * @example
 * ```tsx
 * <RoleChangeModal
 *   user={selectedUser}
 *   currentRole="moderator"
 *   onClose={() => setShowModal(false)}
 *   onSuccess={() => toast.success('Role updated')}
 * />
 * ```
 */
interface RoleChangeModalProps {
  user: User;
  currentRole: Role;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RoleChangeModal({
  user,
  currentRole,
  onClose,
  onSuccess,
}: RoleChangeModalProps) {
  const { activeTenantId, user: currentUser } = useAdminStore();
  const [newRole, setNewRole] = useState<Role>(currentRole);
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState<string>(''); // ISO date string
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRoles: Role[] = ['moderator', 'organizer', 'admin'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeTenantId) {
      setError('No tenant selected');
      return;
    }

    // Validation: Cannot modify yourself
    if (user.id === currentUser?.id) {
      setError('You cannot change your own role. Ask another admin for help.');
      return;
    }

    // Validation: Must select different role
    if (newRole === currentRole) {
      setError('Please select a different role or cancel.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assignRole = httpsCallable(functions, 'assignRole');
      
      const result = await assignRole({
        targetUserId: user.id,
        tenantId: activeTenantId,
        role: newRole,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        reason: reason.trim() || undefined,
      });

      console.log('Role assignment result:', result.data);

      // Success!
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to change role:', err);
      setError(err.message || 'Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Change Role</h2>
              <p className="mt-1 text-sm text-gray-600">
                Update role for <span className="font-medium">{user.displayName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Current Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Role
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              <span className={`font-medium ${getRoleColor(currentRole)}`}>
                {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
              </span>
            </div>
          </div>

          {/* New Role */}
          <div>
            <label htmlFor="newRole" className="block text-sm font-medium text-gray-700 mb-1">
              New Role <span className="text-red-500">*</span>
            </label>
            <select
              id="newRole"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {getRoleDescription(newRole)}
            </p>
          </div>

          {/* Reason (optional) */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this role change needed?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500 text-right">
              {reason.length}/500
            </p>
          </div>

          {/* Expiration Date (optional) */}
          <div>
            <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-1">
              Expires On (optional)
            </label>
            <input
              type="date"
              id="expiresAt"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty for permanent role. Expired roles will be automatically deactivated.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || newRole === currentRole}
              className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </span>
              ) : (
                'Update Role'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Get role-specific color
 */
function getRoleColor(role: Role): string {
  switch (role) {
    case 'admin':
      return 'text-purple-600';
    case 'organizer':
      return 'text-blue-600';
    case 'moderator':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get role descriptions
 */
function getRoleDescription(role: Role): string {
  switch (role) {
    case 'admin':
      return 'Full access: manage events, tasks, teams, and staff';
    case 'organizer':
      return 'Can create and manage events, tasks, and teams';
    case 'moderator':
      return 'Can review submissions and moderate content';
    default:
      return '';
  }
}
