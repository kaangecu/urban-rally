import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../services/firebase.service';
import type { Role, User } from '../../../types/schema';
import { useAdminStore } from '../../../store/adminStore';
import { format, addDays, addMonths } from 'date-fns';

/**
 * ExpirationModal Component
 * 
 * Modal for managing role expiration dates.
 * Features:
 * - Quick presets (7 days, 30 days, 3 months, Never)
 * - Custom date picker
 * - Shows current expiration status
 * - Calls assignRole Cloud Function to update expiration
 * - Success/error handling
 * 
 * @example
 * ```tsx
 * <ExpirationModal
 *   user={selectedUser}
 *   currentRole="organizer"
 *   currentExpiration={new Date('2025-12-31')}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={() => toast.success('Expiration updated')}
 * />
 * ```
 */
interface ExpirationModalProps {
  user: User;
  currentRole: Role;
  currentExpiration: Date | null;
  onClose: () => void;
  onSuccess?: () => void;
}

type ExpirationPreset = '7days' | '30days' | '3months' | 'never' | 'custom';

export function ExpirationModal({
  user,
  currentRole,
  currentExpiration,
  onClose,
  onSuccess,
}: ExpirationModalProps) {
  const { activeTenantId } = useAdminStore();
  const [preset, setPreset] = useState<ExpirationPreset>('30days');
  const [customDate, setCustomDate] = useState<string>(
    currentExpiration ? format(currentExpiration, 'yyyy-MM-dd') : ''
  );
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetOptions: { value: ExpirationPreset; label: string; description: string }[] = [
    { value: '7days', label: '7 Days', description: 'Temporary access' },
    { value: '30days', label: '30 Days', description: 'Short-term project' },
    { value: '3months', label: '3 Months', description: 'Seasonal event' },
    { value: 'never', label: 'Never', description: 'Permanent access' },
    { value: 'custom', label: 'Custom Date', description: 'Choose specific date' },
  ];

  const getExpirationDate = (): Date | null => {
    switch (preset) {
      case '7days':
        return addDays(new Date(), 7);
      case '30days':
        return addDays(new Date(), 30);
      case '3months':
        return addMonths(new Date(), 3);
      case 'never':
        return null;
      case 'custom':
        return customDate ? new Date(customDate) : null;
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeTenantId) {
      setError('No tenant selected');
      return;
    }

    // Validation for custom date
    if (preset === 'custom' && !customDate) {
      setError('Please select a custom date or choose a preset');
      return;
    }

    const expirationDate = getExpirationDate();

    // Validation: Custom date must be in the future
    if (expirationDate && expirationDate <= new Date()) {
      setError('Expiration date must be in the future');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assignRole = httpsCallable(functions, 'assignRole');

      const result = await assignRole({
        targetUserId: user.id,
        tenantId: activeTenantId,
        role: currentRole, // Keep same role, just update expiration
        expiresAt: expirationDate ? expirationDate.toISOString() : null,
        reason: reason.trim() || `Updated expiration to ${preset === 'never' ? 'never' : format(expirationDate!, 'MMM d, yyyy')}`,
      });

      console.log('Expiration update result:', result.data);

      // Success!
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to update expiration:', err);
      setError(err.message || 'Failed to update expiration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedExpiration = getExpirationDate();

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
              <h2 className="text-lg font-semibold text-gray-900">Manage Expiration</h2>
              <p className="mt-1 text-sm text-gray-600">
                Set when <span className="font-medium">{user.displayName}</span>'s access expires
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
          {/* Current Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Current expiration:</span>{' '}
              {currentExpiration ? (
                <span className="text-amber-600 font-semibold">
                  {format(currentExpiration, 'MMM d, yyyy')}
                </span>
              ) : (
                <span className="text-green-600 font-semibold">Never (Permanent)</span>
              )}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Role:</span>{' '}
              <span className={`font-semibold ${getRoleColor(currentRole)}`}>
                {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
              </span>
            </p>
          </div>

          {/* Preset Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Set Expiration
            </label>
            <div className="space-y-2">
              {presetOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    preset === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="preset"
                    value={option.value}
                    checked={preset === option.value}
                    onChange={(e) => setPreset(e.target.value as ExpirationPreset)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Date Picker */}
          {preset === 'custom' && (
            <div>
              <label htmlFor="customDate" className="block text-sm font-medium text-gray-700 mb-1">
                Custom Expiration Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="customDate"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
              />
            </div>
          )}

          {/* Preview */}
          {selectedExpiration && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">New expiration:</span>{' '}
                <span className="font-semibold">{format(selectedExpiration, 'MMMM d, yyyy')}</span>
              </p>
            </div>
          )}

          {preset === 'never' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <span className="font-medium">Access will never expire</span> - User will have permanent access
                unless manually removed.
              </p>
            </div>
          )}

          {/* Reason (optional) */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this change needed?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              maxLength={200}
            />
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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </span>
              ) : (
                'Update Expiration'
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
