import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../services/firebase.service';
import type { Role, User } from '../../../types/schema';
import { useAdminStore } from '../../../store/adminStore';

/**
 * RemoveAccessModal Component
 * 
 * Confirmation modal for revoking a user's role in the active tenant.
 * Features:
 * - Danger-styled confirmation UI
 * - Optional reason field
 * - Validation (cannot remove yourself, cannot remove last admin)
 * - Calls revokeRole Cloud Function
 * - Success/error handling
 * 
 * @example
 * ```tsx
 * <RemoveAccessModal
 *   user={selectedUser}
 *   currentRole="moderator"
 *   onClose={() => setShowModal(false)}
 *   onSuccess={() => toast.success('Access removed')}
 * />
 * ```
 */
interface RemoveAccessModalProps {
  user: User;
  currentRole: Role;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RemoveAccessModal({
  user,
  currentRole,
  onClose,
  onSuccess,
}: RemoveAccessModalProps) {
  const { activeTenantId, user: currentUser, availableTenants } = useAdminStore();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTenant = availableTenants.find((t) => t.id === activeTenantId);

  const handleConfirm = async () => {
    if (!activeTenantId) {
      setError('No tenant selected');
      return;
    }

    // Validation: Cannot remove yourself
    if (user.id === currentUser?.id) {
      setError('You cannot remove your own access. Ask another admin for help.');
      return;
    }

    // Warning: Check if removing last admin (Cloud Function will enforce this)
    if (currentRole === 'admin' && activeTenant) {
      // Note: We can't reliably check adminCount here because it might be stale
      // The Cloud Function will handle this validation server-side
      console.warn('Attempting to remove admin role - Cloud Function will validate');
    }

    setLoading(true);
    setError(null);

    try {
      const revokeRole = httpsCallable(functions, 'revokeRole');
      
      const result = await revokeRole({
        targetUserId: user.id,
        tenantId: activeTenantId,
        reason: reason.trim() || undefined,
      });

      console.log('Role revocation result:', result.data);

      // Success!
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to revoke role:', err);
      
      // Handle specific error cases
      if (err.message?.includes('last admin')) {
        setError('Cannot remove the last admin. Assign another admin first.');
      } else if (err.message?.includes('permission')) {
        setError('You do not have permission to remove this role.');
      } else {
        setError(err.message || 'Failed to remove access. Please try again.');
      }
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
        <div className="px-6 py-4 border-b border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            {/* Warning Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900">Remove Access</h2>
              <p className="mt-1 text-sm text-red-700">
                This action will revoke all permissions for{' '}
                <span className="font-medium">{user.displayName}</span> in this tenant.
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-500 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Current Role Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Current role:</span>{' '}
              <span className={`font-semibold ${getRoleColor(currentRole)}`}>
                {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">User:</span> {user.email || user.displayName}
            </p>
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex gap-2">
              <svg
                className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-amber-800">
                <p className="font-medium">This action cannot be undone</p>
                <p className="mt-1">
                  The user will lose access immediately. You can re-invite them later if needed.
                </p>
              </div>
            </div>
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
              placeholder="Why are you removing this user's access?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500 text-right">
              {reason.length}/500
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
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Removing...
                </span>
              ) : (
                'Remove Access'
              )}
            </button>
          </div>
        </div>
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
