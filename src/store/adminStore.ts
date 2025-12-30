import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Tenant, TenantRoleAssignment, Role } from '../types/schema';
import { hasMinimumRole, calculateHighestRole } from '../types/schema';

/**
 * Admin Store - Phase 2 Implementation
 * 
 * Manages admin-specific state for multi-tenant role management system
 * 
 * Features:
 * - Hybrid Expanded User schema (tenantRoles instead of managedTenantIds)
 * - Active tenant context switching
 * - Available tenants list with roles
 * - Permission checking helpers
 * - Persistent state across sessions
 * 
 * Architecture:
 * - Single User document with tenantRoles map
 * - Role-based access control per tenant
 * - Superadmin can access all tenants
 * - Auto-reload on tenant switch to prevent state leakage
 * 
 * @version 2.0 - Updated for Hybrid schema
 * @date December 30, 2025
 */

/**
 * Tenant context with role information
 * Used in Context Switcher dropdown
 */
export interface TenantContext extends Tenant {
  userRole: 'admin' | 'organizer' | 'moderator';
  expiresAt: Date | null;
}

interface AdminState {
  // Admin User Profile
  adminProfile: User | null;
  isAdminMode: boolean; // Toggle between player/admin views
  
  // Multi-Tenant Context
  activeTenantId: string | null; // Currently selected tenant
  availableTenants: TenantContext[]; // Tenants user can manage
  
  // Actions
  setAdminProfile: (profile: User | null) => void;
  setAdminMode: (isAdmin: boolean) => void;
  setActiveTenant: (tenantId: string) => void;
  switchTenant: (tenantId: string) => void; // Switches and reloads
  setAvailableTenants: (tenants: TenantContext[]) => void;
  clearAdminState: () => void;
  
  // Permission Helpers
  hasRole: (role: Role) => boolean;
  hasRoleInTenant: (tenantId: string, role: Role) => boolean;
  canManageTenant: (tenantId: string) => boolean;
  getActiveRole: () => Role | null;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // Initial State
      adminProfile: null,
      isAdminMode: false,
      activeTenantId: null,
      availableTenants: [],
      
      // Actions
      setAdminProfile: (profile) => {
        if (!profile) {
          set({ 
            adminProfile: null,
            activeTenantId: null,
            availableTenants: [],
          });
          return;
        }
        
        // Auto-select first tenant if admin has any active roles
        const tenantRoles = profile.tenantRoles || {};
        const activeTenantIds = Object.keys(tenantRoles).filter(
          tid => tenantRoles[tid].isActive
        );
        
        set({ 
          adminProfile: profile,
          activeTenantId: activeTenantIds[0] || null,
        });
      },
      
      setAdminMode: (isAdmin) => {
        set({ isAdminMode: isAdmin });
      },
      
      setActiveTenant: (tenantId) => {
        const { adminProfile } = get();
        
        // Validate admin can manage this tenant
        if (tenantId && adminProfile) {
          const canManage = get().canManageTenant(tenantId);
          
          if (canManage) {
            set({ activeTenantId: tenantId });
          } else {
            console.error(`Admin cannot manage tenant ${tenantId}`);
          }
        } else {
          set({ activeTenantId: tenantId });
        }
      },
      
      switchTenant: (tenantId) => {
        const { canManageTenant } = get();
        
        if (!canManageTenant(tenantId)) {
          console.error(`Cannot switch to tenant ${tenantId} - access denied`);
          return;
        }
        
        // Update state
        set({ activeTenantId: tenantId });
        
        // Reload page to prevent state leakage between tenants
        // This ensures clean slate for the new tenant context
        window.location.reload();
      },
      
      setAvailableTenants: (tenants) => {
        set({ availableTenants: tenants });
      },
      
      clearAdminState: () => {
        set({
          adminProfile: null,
          isAdminMode: false,
          activeTenantId: null,
          availableTenants: [],
        });
      },
      
      // Permission Helpers
      hasRole: (role) => {
        const { adminProfile, activeTenantId } = get();
        if (!adminProfile) return false;
        
        // Superadmin has all roles everywhere
        if (adminProfile.isSuperadmin) return true;
        
        // If checking within active tenant context, use tenant-specific role
        if (activeTenantId) {
          const tenantRole = adminProfile.tenantRoles?.[activeTenantId];
          if (tenantRole && tenantRole.isActive) {
            // Check expiration
            if (tenantRole.expiresAt && new Date(tenantRole.expiresAt) < new Date()) {
              return false;
            }
            // Admin role inherits all lower roles (organizer, moderator)
            return hasMinimumRole(tenantRole.role, role);
          }
        }
        
        // Fallback: Check global highest role across all tenants
        const highestRole = adminProfile.highestRole || calculateHighestRole(adminProfile.tenantRoles, adminProfile.isSuperadmin);
        return hasMinimumRole(highestRole, role);
      },
      
      hasRoleInTenant: (tenantId, role) => {
        const { adminProfile } = get();
        if (!adminProfile) return false;
        
        // Superadmin has all roles in all tenants
        if (adminProfile.isSuperadmin) return true;
        
        // Check specific tenant role
        const tenantRole = adminProfile.tenantRoles?.[tenantId];
        if (!tenantRole || !tenantRole.isActive) return false;
        
        // Check expiration
        if (tenantRole.expiresAt && new Date(tenantRole.expiresAt) < new Date()) {
          return false;
        }
        
        // Admin role inherits all lower roles (organizer, moderator)
        return hasMinimumRole(tenantRole.role, role);
      },
      
      canManageTenant: (tenantId) => {
        const { adminProfile } = get();
        if (!adminProfile) return false;
        
        // Superadmin can manage all tenants
        if (adminProfile.isSuperadmin) return true;
        
        // Check if user has active role in this tenant
        const tenantRole = adminProfile.tenantRoles?.[tenantId];
        if (!tenantRole || !tenantRole.isActive) return false;
        
        // Check expiration
        if (tenantRole.expiresAt && new Date(tenantRole.expiresAt) < new Date()) {
          return false;
        }
        
        return true;
      },
      
      getActiveRole: () => {
        const { adminProfile, activeTenantId } = get();
        if (!adminProfile || !activeTenantId) return null;
        
        // Superadmin always has admin role
        if (adminProfile.isSuperadmin) return 'admin';
        
        // Get role from active tenant
        const tenantRole = adminProfile.tenantRoles?.[activeTenantId];
        if (!tenantRole || !tenantRole.isActive) return null;
        
        // Check expiration
        if (tenantRole.expiresAt && new Date(tenantRole.expiresAt) < new Date()) {
          return null;
        }
        
        return tenantRole.role;
      },
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        // Only persist admin profile and active tenant
        adminProfile: state.adminProfile,
        activeTenantId: state.activeTenantId,
        // Don't persist isAdminMode - always start in player mode
        // Don't persist availableTenants - refetch on load
      }),
    }
  )
);
