import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../services/firebase.service';
import { useAuthStore } from '../store/authStore';

export type AuthStatus = 'loading' | 'join' | 'game';

/**
 * Firebase Auth decides whether the player is logged in. The store only holds
 * team data, so an expired session drops back to the join screen.
 */
export function useAuthSession() {
  const team = useAuthStore((state) => state.team);
  const clear = useAuthStore((state) => state.clear);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      setSignedIn(!!user);
      if (!user) clear();
    });
  }, [clear]);

  const logout = async () => {
    clear();
    await signOut(getFirebaseAuth());
  };

  let status: AuthStatus = 'loading';
  if (signedIn !== null) status = signedIn && team ? 'game' : 'join';

  return { status, logout };
}
