import { useState } from 'react';
import { X, Copy, Check, Mail, Loader2, ExternalLink } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../services/firebase.service';

/**
 * InviteModal Component - Phase 2 Milestone 2.4
 * 
 * Generates magic link invitations for new staff members
 * 
 * Features:
 * - Email input with validation
 * - Role selector (moderator/organizer/admin)
 * - Expiration selector (24h/48h/1week/1month/never)
 * - Magic link generation via Cloud Function
 * - Copy to clipboard functionality
 * - Optional email sending (future)
 * - Toast notifications
 * - Loading/error states
 * 
 * Cloud Function:
 * - Calls: inviteUserToTenant({ email, tenantId, role, expiresIn })
 * - Returns: { inviteLink, token, expiresAt }
 * 
 * Usage:
 * ```tsx
 * <InviteModal 
 *   isOpen={showModal} 
 *   onClose={() => setShowModal(false)} 
 *   tenantId={activeTenantId} 
 * />
 * ```
 * 
 * @version 1.0
 * @date December 30, 2025
 */

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName?: string;
}

interface InviteResponse {
  success: boolean;
  inviteLink: string;
  token: string;
  expiresAt: string;
  roleExpiresAt: string | null;
}

export function InviteModal({
  isOpen,
  onClose,
  tenantId,
  tenantName,
}: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'moderator' | 'organizer' | 'admin'>('moderator');
  const [expiresIn, setExpiresIn] = useState<'24h' | '48h' | '1week' | '1month' | 'never'>('1week');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Note: tenantName is available but not currently used in the UI
  // Could be used for customizing the invitation message in future

  // Validate email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Generate invite link
  const handleGenerateLink = async () => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use shared Functions instance (has correct region + emulator setup)
      const functions = getFirebaseFunctions();
      const inviteUserToTenant = httpsCallable<
        {
          email: string;
          tenantId: string;
          role: string;
          expiresIn: string;
        },
        InviteResponse
      >(functions, 'inviteUserToTenant');

      const result = await inviteUserToTenant({
        email,
        tenantId,
        role,
        expiresIn,
      });

      if (result.data.success) {
        setInviteLink(result.data.inviteLink);
        setError(null);
      } else {
        setError('Failed to generate invitation link');
      }
    } catch (err: any) {
      console.error('Failed to generate invite link:', err);
      setError(err.message || 'Failed to generate invitation link');
    } finally {
      setLoading(false);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy to clipboard');
    }
  };

  // Reset form and close
  const handleClose = () => {
    setEmail('');
    setRole('moderator');
    setExpiresIn('1week');
    setInviteLink('');
    setError(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Invite Team Member
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="moderator">Moderator - Review submissions</option>
              <option value="organizer">Organizer - Manage events and tasks</option>
              <option value="admin">Admin - Full tenant management</option>
            </select>
          </div>

          {/* Expiration Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Access expires in
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="24h">24 hours</option>
              <option value="48h">48 hours</option>
              <option value="1week">1 week</option>
              <option value="1month">1 month</option>
              <option value="never">Never (permanent access)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Access will automatically expire after this period
            </p>
          </div>

          {/* Generated Link */}
          {inviteLink && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invitation Link
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  aria-label="Copy link"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Share this link with {email}. It expires in 7 days.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateLink}
            disabled={!email || !isValidEmail(email) || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : inviteLink ? (
              <>
                <ExternalLink className="w-4 h-4" />
                Generate New Link
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Generate Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
