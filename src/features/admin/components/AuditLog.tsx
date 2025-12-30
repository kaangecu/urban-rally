import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../../services/firebase.service';
import { useAdminStore } from '../../../store/adminStore';
import type { RoleAssignment } from '../../../types/schema';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

/**
 * AuditLog Component
 * 
 * Displays a timeline of role management actions in the active tenant.
 * Features:
 * - Infinite scroll pagination (20 items per page)
 * - Date grouping (Today, Yesterday, Last 7 days, etc.)
 * - Action icons (grant, revoke, modify, expire)
 * - Actor and target user names
 * - Reason/notes display
 * - Real-time updates
 * 
 * @example
 * ```tsx
 * <AuditLog />
 * ```
 */
export function AuditLog() {
  const { activeTenantId } = useAdminStore();
  const [logs, setLogs] = useState<RoleAssignment[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = async () => {
    if (!activeTenantId || loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      let q = query(
        collection(db, 'roleAssignments'),
        where('tenantId', '==', activeTenantId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const newLogs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RoleAssignment[];

      setLogs((prev) => [...prev, ...newLogs]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 20);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load activity log. Please try again.');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    // Reset state when tenant changes
    setLogs([]);
    setLastDoc(null);
    setHasMore(true);
    setInitialLoad(true);
    loadMore();
  }, [activeTenantId]);

  const groupedLogs = groupLogsByDate(logs);

  if (initialLoad && loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Activity Log</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Activity Log</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadMore();
            }}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (logs.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Activity Log</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-gray-900">No activity yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Role changes and invitations will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Activity Log</h2>

      {Object.entries(groupedLogs).map(([dateLabel, logsForDate]) => (
        <div key={dateLabel} className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {dateLabel}
          </h3>
          <div className="space-y-2">
            {logsForDate.map((log) => (
              <AuditLogEntry key={log.id} log={log} />
            ))}
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                Loading...
              </span>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * AuditLogEntry Component
 * 
 * Individual audit log entry with icon, action details, and timestamp.
 */
interface AuditLogEntryProps {
  log: RoleAssignment;
}

function AuditLogEntry({ log }: AuditLogEntryProps) {
  const actionConfig = getActionConfig(log.action);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${actionConfig.bgColor}`}
        >
          {actionConfig.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {actionConfig.label}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                <span className="font-medium">{log.actorName || 'System'}</span>
                {' → '}
                <span className="font-medium">{log.targetUserName || log.targetUserId}</span>
                {log.role && (
                  <>
                    {' as '}
                    <span className={`font-semibold ${getRoleBadgeColor(log.role)}`}>
                      {log.role}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Timestamp */}
            <time className="text-xs text-gray-500 whitespace-nowrap">
              {log.timestamp ? format(log.timestamp.toDate(), 'h:mm a') : '-'}
            </time>
          </div>

          {/* Reason/Notes */}
          {log.reason && (
            <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded px-2 py-1">
              <span className="font-medium">Reason:</span> {log.reason}
            </p>
          )}

          {/* Expiration Info */}
          {log.expiresAt && log.action === 'grant' && (
            <p className="mt-2 text-xs text-gray-500">
              Expires: {format(log.expiresAt.toDate(), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Group logs by date categories
 */
function groupLogsByDate(logs: RoleAssignment[]): Record<string, RoleAssignment[]> {
  const grouped: Record<string, RoleAssignment[]> = {
    Today: [],
    Yesterday: [],
    'Last 7 days': [],
    'Older': [],
  };

  for (const log of logs) {
    if (!log.timestamp) {
      grouped['Older'].push(log);
      continue;
    }

    const date = log.timestamp.toDate();

    if (isToday(date)) {
      grouped['Today'].push(log);
    } else if (isYesterday(date)) {
      grouped['Yesterday'].push(log);
    } else if (isThisWeek(date)) {
      grouped['Last 7 days'].push(log);
    } else {
      grouped['Older'].push(log);
    }
  }

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(grouped).filter(([_, logs]) => logs.length > 0)
  );
}

/**
 * Get action-specific styling and labels
 */
function getActionConfig(action: RoleAssignment['action']) {
  switch (action) {
    case 'grant':
      return {
        label: 'Role Granted',
        bgColor: 'bg-green-100',
        icon: (
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ),
      };
    case 'revoke':
      return {
        label: 'Role Revoked',
        bgColor: 'bg-red-100',
        icon: (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      };
    case 'modify':
      return {
        label: 'Role Modified',
        bgColor: 'bg-blue-100',
        icon: (
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
      };
    case 'expire':
      return {
        label: 'Role Expired',
        bgColor: 'bg-amber-100',
        icon: (
          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    default:
      return {
        label: 'Action',
        bgColor: 'bg-gray-100',
        icon: (
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
  }
}

/**
 * Get role-specific text color
 */
function getRoleBadgeColor(role: string): string {
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
