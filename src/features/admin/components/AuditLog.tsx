import { useEffect, useState } from 'react';
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
import { parseFirestoreDate } from '../../../utils/dateUtils';

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

      // Deduplicate by ID to prevent duplicate keys in React
      setLogs((prev) => {
        const existingIds = new Set(prev.map(log => log.id));
        const uniqueNewLogs = newLogs.filter(log => !existingIds.has(log.id));
        return [...prev, ...uniqueNewLogs];
      });
      
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
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activity Log</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activity Log</h2>
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadMore();
            }}
            className="mt-2 text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider"
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
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activity Log</h2>
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-600"
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
          <h3 className="mt-4 text-sm font-bold text-slate-200 uppercase tracking-wide">No activity yet</h3>
          <p className="mt-2 text-xs text-slate-500">
            Role changes and invitations will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activity Log</h2>

      {Object.entries(groupedLogs).map(([dateLabel, logsForDate]) => (
        <div key={dateLabel} className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
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
            className="px-6 py-2 bg-[#1e293b] border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
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
    <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
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
              <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                {actionConfig.label}
              </p>
              <p className="text-sm text-slate-400 mt-0.5">
                <span className="font-medium text-slate-300">{log.assignerEmail || 'System'}</span>
                {' → '}
                <span className="font-medium text-slate-300">{log.targetUserEmail || log.targetUserId}</span>
                {log.roleAfter && (
                  <>
                    {' as '}
                    <span className={`font-bold uppercase ${getRoleBadgeColor(log.roleAfter)}`}>
                      {log.roleAfter}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Timestamp */}
            <time className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
              {(() => {
                const timestamp = parseFirestoreDate(log.timestamp);
                return timestamp ? format(timestamp, 'HH:mm') : '-';
              })()}
            </time>
          </div>

          {/* Reason/Notes */}
          {log.reason && (
            <p className="mt-2 text-xs text-slate-400 bg-[#0f172a] border border-slate-700 rounded px-2 py-1">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Reason:</span> {log.reason}
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
    const timestamp = parseFirestoreDate(log.timestamp);
    
    if (!timestamp) {
      grouped['Older'].push(log);
      continue;
    }

    if (isToday(timestamp)) {
      grouped['Today'].push(log);
    } else if (isYesterday(timestamp)) {
      grouped['Yesterday'].push(log);
    } else if (isThisWeek(timestamp)) {
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
        bgColor: 'bg-emerald-500/10 border border-emerald-500/20',
        icon: (
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ),
      };
    case 'revoke':
      return {
        label: 'Role Revoked',
        bgColor: 'bg-red-500/10 border border-red-500/20',
        icon: (
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      };
    case 'modify':
      return {
        label: 'Role Modified',
        bgColor: 'bg-blue-500/10 border border-blue-500/20',
        icon: (
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
      };
    case 'invite_sent':
      return {
        label: 'Invitation Sent',
        bgColor: 'bg-blue-500/10 border border-blue-500/20',
        icon: (
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      };
    case 'invite_accepted':
      return {
        label: 'Invitation Accepted',
        bgColor: 'bg-emerald-500/10 border border-emerald-500/20',
        icon: (
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    default:
      return {
        label: 'Action',
        bgColor: 'bg-slate-700/50 border border-slate-600',
        icon: (
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      return 'text-purple-400';
    case 'organizer':
      return 'text-blue-400';
    case 'moderator':
      return 'text-emerald-400';
    default:
      return 'text-slate-400';
  }
}
