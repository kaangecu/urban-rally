import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/schema';

/**
 * Admin Store
 * 
 * Manages admin-specific state including:
 * - Admin user profile with role and permissions
 * - Admin mode toggle (dual-mode navigation)
 * - Selected tenant for multi-tenant admins
 */

interface AdminState {
  // Admin User (unified User type with admin role)
  adminProfile: User | null;
  isAdminMode: boolean; // Toggle between player/admin views
  
  // Multi-tenant Management
  selectedTenantId: string | null; // Current tenant context
  
  // Actions
  setAdminProfile: (profile: User | null) => void;
  setAdminMode: (isAdmin: boolean) => void;
  setSelectedTenant: (tenantId: string | null) => void;
  clearAdminState: () => void;
  
  // Getters
  hasRole: (role: 'superadmin' | 'admin' | 'organizer' | 'moderator') => boolean;
  canManageTenant: (tenantId: string) => boolean;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // Initial State
      adminProfile: null,
      isAdminMode: false,
      selectedTenantId: null,
      
      // Actions
      setAdminProfile: (profile) => {
        set({ 
          adminProfile: profile,
          // Auto-select first tenant if admin has any
          selectedTenantId: profile?.managedTenantIds?.[0] || null,
        });
      },
      
      setAdminMode: (isAdmin) => {
        set({ isAdminMode: isAdmin });
      },
      
      setSelectedTenant: (tenantId) => {
        const { adminProfile } = get();
        // Validate admin can manage this tenant
        if (tenantId && adminProfile) {
          const canManage = 
            adminProfile.role === 'superadmin' || 
            adminProfile.managedTenantIds.includes(tenantId);
          
          if (canManage) {
            set({ selectedTenantId: tenantId });
          } else {
            console.error(`Admin cannot manage tenant ${tenantId}`);
          }
        } else {
          set({ selectedTenantId: tenantId });
        }
      },
      
      clearAdminState: () => {
        set({
          adminProfile: null,
          isAdminMode: false,
          selectedTenantId: null,
        });
      },
      
      // Getters
      hasRole: (role) => {
        const { adminProfile } = get();
        if (!adminProfile) return false;
        
        // Role hierarchy check
        const roles = ['moderator', 'organizer', 'admin', 'superadmin'];
        const userRoleIndex = roles.indexOf(adminProfile.role);
        const requiredRoleIndex = roles.indexOf(role);
        
        return userRoleIndex >= requiredRoleIndex;
      },
      
      canManageTenant: (tenantId) => {
        const { adminProfile } = get();
        if (!adminProfile) return false;
        
        // Superadmin can manage all tenants
        if (adminProfile.role === 'superadmin') return true;
        
        // Check if tenant is in managed list
        return adminProfile.managedTenantIds.includes(tenantId);
      },
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        // Only persist admin profile and selected tenant
        adminProfile: state.adminProfile,
        selectedTenantId: state.selectedTenantId,
        // Don't persist isAdminMode - always start in player mode
      }),
    }
  )
);
