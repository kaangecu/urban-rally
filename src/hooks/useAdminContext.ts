import { useEffect, useState } from 'react';
import { useAdminStore, type TenantContext } from '../store/adminStore';
import { useAuthStore } from '../store/authStore';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase.service';
import type { Tenant } from '../types/schema';

/**
 * useAdminContext Hook - Phase 2 Implementation
 * 
 * Manages admin context by:
 * 1. Loading user's available tenants from Firestore
 * 2. Populating availableTenants with role information
 * 3. Auto-selecting first tenant if none selected
 * 
 * Usage:
 * ```tsx
 * function AdminDashboard() {
 *   const { loading, error } = useAdminContext();
 *   const { activeTenantId, availableTenants } = useAdminStore();
 *   
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage message={error} />;
 *   
 *   return <div>Active Tenant: {activeTenantId}</div>;
 * }
 * ```
 * 
 * @version 1.0
 * @date December 30, 2025
 */

interface UseAdminContextReturn {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAdminContext(): UseAdminContextReturn {
  const user = useAuthStore((state) => state.user);
  const { 
    adminProfile, 
    activeTenantId, 
    setAdminProfile, 
    setAvailableTenants, 
    setActiveTenant 
  } = useAdminStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAvailableTenants = async () => {
    if (!user?.id) {
      setError('No authenticated user');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch fresh user document from Firestore
      const userDocRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const tenantRoles = userData.tenantRoles || {};

      // If superadmin, they can access all tenants
      if (userData.isSuperadmin) {
        const tenantsQuery = query(
          collection(db, 'tenants'),
          where('isActive', '==', true)
        );
        const tenantsSnapshot = await getDocs(tenantsQuery);
        
        const tenants: TenantContext[] = tenantsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          userRole: 'admin' as const,
          expiresAt: null,
        } as TenantContext));

        setAdminProfile(userData as any);
        setAvailableTenants(tenants);
        
        // Auto-select first tenant if none selected
        if (!activeTenantId && tenants.length > 0) {
          setActiveTenant(tenants[0].id);
        }
        
        setLoading(false);
        return;
      }

      // For non-superadmins, load only their assigned tenants
      const activeTenantIds = Object.keys(tenantRoles).filter(
        tid => tenantRoles[tid].isActive
      );

      if (activeTenantIds.length === 0) {
        // User has no active roles
        setAvailableTenants([]);
        setLoading(false);
        return;
      }

      // Fetch tenant documents
      const tenantPromises = activeTenantIds.map(async (tenantId) => {
        const tenantDocRef = doc(db, 'tenants', tenantId);
        const tenantDoc = await getDoc(tenantDocRef);
        
        if (!tenantDoc.exists()) {
          console.warn(`Tenant ${tenantId} not found`);
          return null;
        }

        const tenantData = tenantDoc.data() as Tenant;
        const roleAssignment = tenantRoles[tenantId];

        return {
          id: tenantDoc.id,
          ...tenantData,
          userRole: roleAssignment.role,
          expiresAt: roleAssignment.expiresAt,
        } as TenantContext;
      });

      const tenants = (await Promise.all(tenantPromises)).filter(
        (t): t is TenantContext => t !== null
      );

      // Update store
      setAdminProfile(userData as any);
      setAvailableTenants(tenants);
      
      // Auto-select first tenant if none selected
      if (!activeTenantId && tenants.length > 0) {
        setActiveTenant(tenants[0].id);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load admin context:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin context');
      setLoading(false);
    }
  };

  // Load on mount and when user changes
  useEffect(() => {
    loadAvailableTenants();
  }, [user?.id]);

  return {
    loading,
    error,
    refresh: loadAvailableTenants,
  };
}
