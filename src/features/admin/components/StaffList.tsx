import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { collection, query, where, orderBy, limit, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../../../services/firebase.service';
import type { User } from '../../../types/schema';
import { StaffCard } from './StaffCard';
import { Search, UserPlus, Loader2, Users, Shield } from 'lucide-react';

/**
 * StaffList Component - Phase 2 Milestone 2.3 + Approach A Refactor
 * 
 * Displays staff members and all users with tab switching
 * 
 * Features:
 * - Two tabs: Staff (admin roles) and All Users (any role)
 * - Real-time updates via Firestore onSnapshot
 * - Search/filter by name and email
 * - Role-based actions (promote players, change admin roles)
 * - Loading skeletons
 * - Empty state
 * - Mobile-responsive card layout
 * 
 * Query Strategy:
 * - Staff Tab: users where tenantRoles.{activeTenantId}.isActive == true
 * - All Users Tab: all users ordered by createdAt (paginated)
 * 
 * Usage:
 * ```tsx
 * <StaffList onChangeRole={handleRoleChange} />
 * ```
 * 
 * @version 2.0 - Added All Users tab (Approach A)
 * @date December 30, 2025
 */

type TabType = 'staff' | 'all';

interface StaffListProps {
  onChangeRole?: (user: User) => void;
  onRemove?: (user: User) => void;
  onManageExpiration?: (user: User) => void;
}

export function StaffList({ onChangeRole, onRemove, onManageExpiration }: StaffListProps) {
  const { activeTenantId } = useAdminStore();
  const [activeTab, setActiveTab] = useState<TabType>('staff');
  const [staff, setStaff] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
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

    // Query all users and filter client-side for tenant roles
    // NOTE: Firestore cannot query nested maps like tenantRoles.{tenantId}.isActive
    // So we fetch all users with any tenant roles and filter in memory
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(500) // Reasonable limit for staff members
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
            // Client-side filter for active roles in this tenant
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

  // Load all users from Firestore with real-time updates
  useEffect(() => {
    setLoading(true);

    // Query all users (paginated for performance)
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(100) // Show latest 100 users
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as User));

        setAllUsers(users);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load all users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Get active list based on selected tab
  const activeList = activeTab === 'staff' ? staff : allUsers;

  // Filter users by search term
  const filteredUsers = activeList.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'staff'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Staff</span>
              {!loading && <span className="text-xs">({staff.length})</span>}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>All Users</span>
              {!loading && <span className="text-xs">({allUsers.length})</span>}
            </div>
          </button>
        </nav>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeTab === 'staff' ? 'Staff Members' : 'All Users'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeTab === 'staff'
              ? 'Users with admin roles in this tenant'
              : 'All registered users in the system'}
          </p>
        </div>
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
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm
              ? 'No users found'
              : activeTab === 'staff'
              ? 'No staff members yet'
              : 'No users yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm
              ? 'Try a different search term'
              : activeTab === 'staff'
              ? 'Assign roles to users from the All Users tab'
              : 'Users will appear here once they join events'}
          </p>
        </div>
      )}

      {/* User Cards */}
      {!loading && filteredUsers.length > 0 && (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <StaffCard
              key={user.id}
              user={user}
              tenantId={activeTenantId!}
              onChangeRole={onChangeRole}
              onRemove={onRemove}
              onManageExpiration={onManageExpiration}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && filteredUsers.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Showing {filteredUsers.length} of {activeList.length} users
        </p>
      )}
    </div>
  );
}
