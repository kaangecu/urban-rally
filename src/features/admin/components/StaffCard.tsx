import { useState } from 'react';
import type { User } from '../../../types/schema';
import { ROLE_HIERARCHY } from '../../../types/schema';
import { MoreVertical, Shield, Clock, AlertTriangle, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { parseFirestoreDate } from '../../../utils/dateUtils';
import { DropdownMenu, DropdownMenuItem } from '../../../components/ui/DropdownMenu';

/**
 * StaffCard Component - Phase 2 Milestone 2.3 + Approach A Refactor v2
 * 
 * Displays user information with role-based actions
 * 
 * Features:
 * - User avatar, name, email
 * - Role badge with color coding
 * - "Granted by" information (for staff)
 * - Expiration countdown (if applicable)
 * - 3-dot action menu for ALL users (staff and players)
 * - Change Role option opens modal with role selector and expiration
 * - Mobile-optimized layout
 * 
 * Usage:
 * ```tsx
 * <StaffCard 
 *   user={user} 
 *   tenantId={activeTenantId}
 *   onChangeRole={(userId) => openRoleChangeModal(userId)}
 * />
 * ```
 * 
 * @version 2.1 - Unified action menu for all users
 * @date December 30, 2025
 */

interface StaffCardProps {
  user: User;
  tenantId: string;
  onChangeRole?: (user: User) => void;
  onRemove?: (user: User) => void;
  onManageExpiration?: (user: User) => void;
}

export function StaffCard({
  user,
  tenantId,
  onChangeRole,
  onRemove,
  onManageExpiration,
}: StaffCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Check if user is anonymous (cannot be assigned roles)
  const isAnonymous = user.accountType === 'anonymous';

  // Get user's role in this tenant
  const tenantRole = user.tenantRoles?.[tenantId];
  const isStaff = tenantRole && tenantRole.isActive;
  
  // For player users, show their global role
  const displayRole = isStaff ? tenantRole.role : user.role;
  const roleInfo = ROLE_HIERARCHY[displayRole] || { label: 'Player', level: 0, inherits: [] };
  
  // Calculate expiration status (only for staff with tenant roles)
  const expirationDate = isStaff ? parseFirestoreDate(tenantRole!.expiresAt) : null;
  const isValidExpiration = expirationDate !== null;
  
  const isExpiring =
    isValidExpiration &&
    expirationDate! < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const isExpired =
    isValidExpiration && expirationDate! < new Date();

  // Role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'organizer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'moderator':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'player':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
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

            {/* Actions - 3-dot menu for all users */}
            <DropdownMenu
              isOpen={showMenu}
              onClose={() => setShowMenu(false)}
              trigger={
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Actions"
                >
                  <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              }
            >
              <DropdownMenuItem
                onClick={() => {
                  setShowMenu(false);
                  onChangeRole?.(user);
                }}
                disabled={isAnonymous}
                icon={isAnonymous ? <Lock className="w-3 h-3" /> : undefined}
                title={isAnonymous ? 'Anonymous users cannot be assigned roles' : ''}
              >
                Change Role
              </DropdownMenuItem>

              {isStaff && (
                <DropdownMenuItem
                  onClick={() => {
                    setShowMenu(false);
                    onManageExpiration?.(user);
                  }}
                >
                  Manage Expiration
                </DropdownMenuItem>
              )}

              {isStaff && (
                <DropdownMenuItem
                  onClick={() => {
                    setShowMenu(false);
                    onRemove?.(user);
                  }}
                  variant="danger"
                >
                  Remove Access
                </DropdownMenuItem>
              )}
            </DropdownMenu>
          </div>

          {/* Role Badge */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(
                displayRole
              )}`}
            >
              <Shield className="w-3 h-3" />
              {roleInfo.label || displayRole}
            </span>

            {/* Anonymous Badge */}
            {isAnonymous && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-500">
                <Lock className="w-3 h-3" />
                Anonymous
              </span>
            )}

            {/* Expiration Warning (only for staff) */}
            {isStaff && isExpired && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <AlertTriangle className="w-3 h-3" />
                Expired
              </span>
            )}
            {isStaff && !isExpired && isExpiring && expirationDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="w-3 h-3" />
                Expires {formatDistanceToNow(expirationDate, { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Granted By (only for staff) */}
          {isStaff && tenantRole && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {(() => {
                  const grantedDate = parseFirestoreDate(tenantRole.grantedAt);
                  if (grantedDate) {
                    return `Granted ${formatDistanceToNow(grantedDate, { addSuffix: true })}`;
                  }
                  return 'Granted by system';
                })()}
              </span>
              {tenantRole.notes && (
                <span className="ml-2">• {tenantRole.notes}</span>
              )}
            </div>
          )}

          {/* Player Stats (for player users) */}
          {!isStaff && user.role === 'player' && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {user.eventsParticipated > 0 && (
                <span>
                  {user.eventsParticipated} event{user.eventsParticipated !== 1 ? 's' : ''} • {user.totalScore} points
                </span>
              )}
              {(!user.eventsParticipated || user.eventsParticipated === 0) && (
                <span>New user</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
