/**
 * useProfileGuard Hook
 * 
 * Checks if the current user has both Firebase Auth and Firestore profile.
 * Used for global profile-first onboarding flow.
 * 
 * Returns:
 * - needsProfile: true if user needs to create a profile
 * - isChecking: true while checking auth/profile state
 * 
 * States:
 * 1. No Firebase Auth user → needsProfile = true
 * 2. Firebase Auth exists, but no Firestore profile → needsProfile = true
 * 3. Both exist → needsProfile = false
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../services/firebase.service';
import { getUserById } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';

interface ProfileGuardState {
  needsProfile: boolean;
  isChecking: boolean;
}

export function useProfileGuard(): ProfileGuardState {
  const [needsProfile, setNeedsProfile] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { authState } = useAuth();

  useEffect(() => {
    const auth = getFirebaseAuth();
    
    console.log('🛡️ ProfileGuard: Starting profile check');

    // Subscribe to auth state changes to handle real-time updates
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Skip check if user is being created (handled by AuthContext)
      if (authState === 'creating') {
        console.log('⏭️  ProfileGuard: Skipped - user creation in progress');
        return;
      }

      if (!firebaseUser) {
        // No Firebase Auth user - needs profile
        console.log('❌ ProfileGuard: No Firebase Auth user found');
        setNeedsProfile(true);
        setIsChecking(false);
        return;
      }

      try {
        // Firebase Auth exists - check Firestore profile
        console.log('🔍 ProfileGuard: Checking Firestore profile for', firebaseUser.uid);
        const userProfile = await getUserById(firebaseUser.uid);
        
        if (!userProfile) {
          // Auth exists but no Firestore profile (edge case)
          console.warn('⚠️  ProfileGuard: Firebase Auth exists but no Firestore profile');
          setNeedsProfile(true);
        } else {
          // Both exist - user is good to go
          console.log('✅ ProfileGuard: User profile found');
          setNeedsProfile(false);
        }
      } catch (error) {
        console.error('❌ ProfileGuard: Error checking profile', error);
        // On error, assume needs profile to be safe
        setNeedsProfile(true);
      } finally {
        setIsChecking(false);
      }
    });

    // Cleanup subscription
    return () => {
      console.log('🔴 ProfileGuard: Cleanup');
      unsubscribe();
    };
  }, [authState]); // Re-run when authState changes

  return { needsProfile, isChecking };
}
