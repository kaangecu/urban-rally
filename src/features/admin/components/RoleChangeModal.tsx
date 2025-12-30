import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../services/firebase.service';
import type { Role, User } from '../../../types/schema';
import { useAdminStore } from '../../../store/adminStore';
import { useAuthStore } from '../../../store/authStore';

/**
 * Role duration options
 */
export type RoleDuration = '24h' | '48h' | '1week' | '1month' | 'never';

/**
 * Convert duration string to ISO date string
 */
function calculateExpirationDate(duration: RoleDuration): string | null {
  if (duration === 'never') return null;
  
  const now = new Date();
  switch (duration) {
    case '24h':
      now.setHours(now.getHours() + 24);
      break;
    case '48h':
      now.setHours(now.getHours() + 48);
      break;
    case '1week':
      now.setDate(now.getDate() + 7);
      break;
    case '1month':
      now.setMonth(now.getMonth() + 1);
      break;
  }
  return now.toISOString();
}

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
  currentRole?: Role; // Optional - undefined for player promotions
  onClose: () => void;
  onSuccess?: () => void;
}

export function RoleChangeModal({
  user,
  currentRole,
  onClose,
  onSuccess,
}: RoleChangeModalProps) {
  const { activeTenantId } = useAdminStore();
  const currentUser = useAuthStore((state) => state.user);
  const [newRole, setNewRole] = useState<Role>(currentRole || 'moderator');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<RoleDuration>('1week');
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

    // Validation: Must select different role (skip for player promotions)
    if (currentRole && newRole === currentRole) {
      setError('Please select a different role or cancel.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assignRole = httpsCallable(functions, 'assignRole');
      
      const expiresAt = calculateExpirationDate(duration);
      const trimmedReason = reason.trim();
      
      const result = await assignRole({
        targetUserId: user.id,
        tenantId: activeTenantId,
        role: newRole,
        expiresAt: expiresAt,
        reason: trimmedReason || undefined,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1e293b] border border-slate-700 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-[#0f172a]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Change Role</h2>
              <p className="mt-1 text-sm text-slate-200">
                Update role for <span className="font-medium font-mono">{user.displayName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300 transition-colors"
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
          {currentRole && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Current Role
              </label>
              <div className="px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm">
                <span className={`font-bold uppercase ${getRoleColor(currentRole)}`}>
                  {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                </span>
              </div>
            </div>
          )}

          {/* New Role */}
          <div>
            <label htmlFor="newRole" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              New Role <span className="text-red-500">*</span>
            </label>
            <select
              id="newRole"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {availableRoles.map((role) => (
                <option key={role} value={role} className="bg-[#0f172a]">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {getRoleDescription(newRole)}
            </p>
          </div>

          {/* Reason (optional) */}
          <div>
            <label htmlFor="reason" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Reason (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this role change needed?"
              rows={3}
              className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-slate-600"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-slate-500 text-right font-mono">
              {reason.length}/500
            </p>
          </div>

          {/* Duration Selector */}
          <div>
            <label htmlFor="duration" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Access Duration
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value as RoleDuration)}
              className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="24h" className="bg-[#0f172a]">24 hours</option>
              <option value="48h" className="bg-[#0f172a]">48 hours</option>
              <option value="1week" className="bg-[#0f172a]">1 week</option>
              <option value="1month" className="bg-[#0f172a]">1 month</option>
              <option value="never" className="bg-[#0f172a]">Never (permanent access)</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Access will automatically expire after this period
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (currentRole && newRole === currentRole)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {currentRole ? 'Updating...' : 'Assigning...'}
                </span>
              ) : (
                currentRole ? 'Update Role' : 'Assign Role'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Get role-specific color (Tactical Ops theme)
 */
function getRoleColor(role: Role): string {
  switch (role) {
    case 'admin':
      return 'text-purple-400';
    case 'organizer':
      return 'text-blue-400';
    case 'moderator':
      return 'text-emerald-400';
    default:
      return 'text-slate-400';
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
