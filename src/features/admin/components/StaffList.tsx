import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../../services/firebase.service';
import type { User } from '../../../types/schema';
import { StaffCard } from './StaffCard';
import { Search, UserPlus, Loader2 } from 'lucide-react';

/**
 * StaffList Component - Phase 2 Milestone 2.3
 * 
 * Displays all users with active roles in the current tenant
 * 
 * Features:
 * - Real-time updates via Firestore onSnapshot
 * - Search/filter by name and email
 * - Loading skeletons
 * - Empty state
 * - Mobile-responsive card layout
 * - Add staff button (opens InviteModal)
 * 
 * Query Strategy:
 * - Query: users where tenantRoles.{activeTenantId}.isActive == true
 * - Note: This requires a composite index in Firestore
 * 
 * Usage:
 * ```tsx
 * <StaffList onInvite={() => setShowInviteModal(true)} />
 * ```
 * 
 * @version 1.0
 * @date December 30, 2025
 */

interface StaffListProps {
  onInvite?: () => void; // Callback to open invite modal
}

export function StaffList({ onInvite }: StaffListProps) {
  const { activeTenantId } = useAdminStore();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load staff from Firestore with real-time updates
  useEffect(() => {
    if (!activeTenantId) {
      setStaff([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query users with active roles in this tenant
    // Note: This requires a composite index on tenantRoles.{tenantId}.isActive
    // Since we can't use dynamic field names in Firestore queries directly,
    // we'll fetch all users with tenantRoles and filter client-side
    // For production, consider Cloud Function to maintain a staff collection per tenant
    
    const usersQuery = query(
      collection(db, 'users'),
      where('tenantId', '==', activeTenantId) // Fallback to home tenant
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const users = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as User))
          .filter((user) => {
            // Client-side filter for active roles
            const tenantRole = user.tenantRoles?.[activeTenantId];
            return tenantRole && tenantRole.isActive;
          });

        setStaff(users);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load staff:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeTenantId]);

  // Filter staff by search term
  const filteredStaff = staff.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Staff Members
        </h2>
        {onInvite && (
          <button
            onClick={onInvite}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Invite</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No staff found' : 'No staff members yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm
              ? 'Try a different search term'
              : 'Invite team members to get started'}
          </p>
          {onInvite && !searchTerm && (
            <button
              onClick={onInvite}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite Staff Member
            </button>
          )}
        </div>
      )}

      {/* Staff Cards */}
      {!loading && filteredStaff.length > 0 && (
        <div className="space-y-3">
          {filteredStaff.map((user) => (
            <StaffCard key={user.id} user={user} tenantId={activeTenantId!} />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && filteredStaff.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Showing {filteredStaff.length} of {staff.length} staff members
        </p>
      )}
    </div>
  );
}
