import { useState, useEffect } from 'react';
import { auth } from '../services/firebase.service';
import { useAdminStore } from '../store/adminStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase.service';
import type { User } from '../types/schema';

/**
 * Admin Authentication Hook
 * 
 * Manages admin user authentication state and role-based access control.
 * Checks Firebase Custom Claims for role and fetches User from Firestore.
 * 
 * Usage:
 * ```tsx
 * const { adminProfile, loading, hasRole, canManageTenant } = useAdminAuth();
 * 
 * if (hasRole('admin')) {
 *   // Show admin UI
 * }
 * ```
 */

interface UseAdminAuthReturn {
  adminProfile: User | null;
  loading: boolean;
  error: string | null;
  hasRole: (role: 'superadmin' | 'admin' | 'organizer' | 'moderator') => boolean;
  canManageTenant: (tenantId: string) => boolean;
  isAuthenticated: boolean;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { adminProfile, setAdminProfile, clearAdminState, hasRole, canManageTenant } = useAdminStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // User logged out
        clearAdminState();
        setLoading(false);
        return;
      }

      try {
        // Get ID token with custom claims
        const idTokenResult = await user.getIdTokenResult();
        const claims = idTokenResult.claims;

        // Check if user has admin role in custom claims
        if (!claims.role) {
          // Regular player, not an admin
          clearAdminState();
          setLoading(false);
          return;
        }

        // Fetch User from Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // User not found - claims exist but profile missing
          console.error('User not found for admin user:', user.uid);
          setError('Admin profile not found. Please contact support.');
          clearAdminState();
          setLoading(false);
          return;
        }

        const profileData = userSnap.data() as User;

        // Convert Firestore Timestamps to Dates
        const profile: User = {
          ...profileData,
          createdAt: profileData.createdAt instanceof Object && 'toDate' in profileData.createdAt
            ? (profileData.createdAt as { toDate: () => Date }).toDate()
            : new Date(profileData.createdAt),
          updatedAt: profileData.updatedAt instanceof Object && 'toDate' in profileData.updatedAt
            ? (profileData.updatedAt as { toDate: () => Date }).toDate()
            : new Date(profileData.updatedAt),
        };

        // Check if profile is active (for admin users only)
        if (profile.isActive === false) {
          setError('Admin account is deactivated. Please contact support.');
          clearAdminState();
          setLoading(false);
          return;
        }

        // Set admin profile in store
        setAdminProfile(profile);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admin profile:', err);
        setError('Failed to load admin profile. Please try again.');
        clearAdminState();
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [setAdminProfile, clearAdminState]);

  return {
    adminProfile,
    loading,
    error,
    hasRole,
    canManageTenant,
    isAuthenticated: !!adminProfile,
  };
}
