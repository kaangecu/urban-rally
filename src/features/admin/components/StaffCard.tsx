import { useState } from 'react';
import type { User } from '../../../types/schema';
import { ROLE_HIERARCHY } from '../../../types/schema';
import { MoreVertical, Shield, Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * StaffCard Component - Phase 2 Milestone 2.3
 * 
 * Displays individual staff member information
 * 
 * Features:
 * - User avatar, name, email
 * - Role badge with color coding
 * - "Granted by" information
 * - Expiration countdown (if applicable)
 * - Action menu (change role, remove)
 * - Mobile-optimized layout
 * 
 * Usage:
 * ```tsx
 * <StaffCard user={user} tenantId={activeTenantId} />
 * ```
 * 
 * @version 1.0
 * @date December 30, 2025
 */

interface StaffCardProps {
  user: User;
  tenantId: string;
  onChangeRole?: (userId: string) => void;
  onRemove?: (userId: string) => void;
  onManageExpiration?: (userId: string) => void;
}

export function StaffCard({
  user,
  tenantId,
  onChangeRole,
  onRemove,
  onManageExpiration,
}: StaffCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Get user's role in this tenant
  const tenantRole = user.tenantRoles?.[tenantId];
  
  if (!tenantRole || !tenantRole.isActive) {
    return null; // Should not happen, but defensive
  }

  const roleInfo = ROLE_HIERARCHY[tenantRole.role];
  
  // Calculate expiration status
  const isExpiring =
    tenantRole.expiresAt &&
    new Date(tenantRole.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const isExpired =
    tenantRole.expiresAt && new Date(tenantRole.expiresAt) < new Date();

  // Role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'organizer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'moderator':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                {user.displayName?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                {user.displayName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>

            {/* Action Menu */}
            {(onChangeRole || onRemove || onManageExpiration) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Actions"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
                    {onChangeRole && (
                      <button
                        onClick={() => {
                          onChangeRole(user.id);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        Change Role
                      </button>
                    )}
                    {onManageExpiration && (
                      <button
                        onClick={() => {
                          onManageExpiration(user.id);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        Manage Expiration
                      </button>
                    )}
                    {onRemove && (
                      <button
                        onClick={() => {
                          onRemove(user.id);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-red-600 dark:text-red-400"
                      >
                        Remove Access
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Role Badge */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(
                tenantRole.role
              )}`}
            >
              <Shield className="w-3 h-3" />
              {roleInfo.label}
            </span>

            {/* Expiration Warning */}
            {isExpired && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <AlertTriangle className="w-3 h-3" />
                Expired
              </span>
            )}
            {!isExpired && isExpiring && tenantRole.expiresAt && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="w-3 h-3" />
                Expires {formatDistanceToNow(new Date(tenantRole.expiresAt), { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Granted By */}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              Granted {formatDistanceToNow(new Date(tenantRole.grantedAt), { addSuffix: true })}
            </span>
            {tenantRole.notes && (
              <span className="ml-2">• {tenantRole.notes}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
