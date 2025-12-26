/**
 * Authentication Context
 * 
 * Manages authentication lifecycle with a state machine to prevent race conditions.
 * 
 * States:
 * - idle: No auth operation in progress
 * - creating: User is being created (skip auth listener)
 * - restoring: Session is being restored (normal auth listener operation)
 * - authenticated: User is authenticated and ready
 * - error: Authentication error occurred
 */

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from '../services/firebase.service';
import { useAuthStore } from '../store/authStore';
import { getUserById } from '../services/user.service';
import { getTeamById } from '../services/team.service';
import { getTenantById } from '../services/tenant.service';
import { getUserTeams, getTeamMembership } from '../services/teamMember.service';

// Auth lifecycle states
export type AuthState = 
  | 'idle'           // No auth operation in progress
  | 'creating'       // User creation in progress (skip listener)
  | 'restoring'      // Session restoration in progress
  | 'authenticated'  // User authenticated and ready
  | 'error';         // Authentication error

interface AuthContextValue {
  authState: AuthState;
  setAuthState: (state: AuthState) => void;
  firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const { setUser, setTeam, setTenant, setLoading, logout } = useAuthStore();
  
  // Use ref to track current auth state without causing re-renders
  const authStateRef = useRef<AuthState>('idle');
  
  // Update ref whenever state changes
  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    
    console.log('🔵 Auth listener initialized');
    
    // Subscribe to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (!user) {
        // User signed out
        console.log('🔴 User signed out, clearing state');
        await logout();
        setAuthState('idle');
        return;
      }

      // CRITICAL: Skip listener if user is being created
      // Use ref to get current state without causing effect re-run
      if (authStateRef.current === 'creating') {
        console.log('⏭️  Auth listener skipped - user creation in progress');
        return;
      }

      try {
        // Set state to restoring (normal session restoration)
        setAuthState('restoring');
        setLoading(true);

        console.log('🔄 Restoring session for user:', user.uid);

        // 1. Fetch user document from Firestore
        const userDoc = await getUserById(user.uid);
        
        if (!userDoc) {
          console.warn('⚠️  Firebase user exists but no Firestore document found');
          await logout();
          setAuthState('error');
          return;
        }

        // Set user in store
        setUser(userDoc);

        // 2. Check if user has active team memberships
        const userTeams = await getUserTeams(user.uid);
        
        if (userTeams.length === 0) {
          // No active teams - check if team/tenant were just set programmatically
          const currentState = useAuthStore.getState();
          
          if (!currentState.team && !currentState.tenant) {
            // No teams at all
            setTeam(null);
            setTenant(null);
            console.log('ℹ️  User authenticated but has no active teams');
          } else {
            // Team/tenant already set (user just joined)
            console.log('ℹ️  User has no teams yet, but team/tenant already set');
          }
          
          setAuthState('authenticated');
          setLoading(false);
          return;
        }

        // 3. Try to restore last team from persisted state
        const persistedState = useAuthStore.getState();
        
        if (persistedState.team) {
          // Check if user is still in this team
          const membership = await getTeamMembership(
            persistedState.team.id,
            user.uid
          );
          
          if (membership && membership.isActive) {
            // Refresh team and tenant data
            const [team, tenant] = await Promise.all([
              getTeamById(persistedState.team.id),
              getTenantById(persistedState.tenant?.id || ''),
            ]);

            if (team && tenant) {
              setTeam(team);
              setTenant(tenant);
              console.log('✅ Session restored for team:', team.teamName || team.accessCode);
              setAuthState('authenticated');
              setLoading(false);
              return;
            }
          }
        }

        // 4. If can't restore persisted team, load first active team
        if (userTeams.length > 0) {
          const firstTeamData = userTeams[0];
          const [firstTeam, tenant] = await Promise.all([
            getTeamById(firstTeamData.teamId),
            getTenantById(firstTeamData.eventId),
          ]);
          
          if (firstTeam && tenant) {
            setTeam(firstTeam);
            setTenant(tenant);
            console.log('✅ Loaded first active team:', firstTeam.teamName || firstTeam.accessCode);
          } else {
            console.warn('⚠️  Could not load first team data');
          }
        }

        console.log('✅ Auth session restored for user:', user.uid);
        setAuthState('authenticated');
      } catch (error) {
        console.error('❌ Error restoring auth session:', error);
        setAuthState('error');
        await logout();
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔴 Auth listener cleaned up');
      unsubscribe();
    };
  }, [setUser, setTeam, setTenant, setLoading, logout]); // ← authState removed from dependencies!

  const value: AuthContextValue = {
    authState,
    setAuthState,
    firebaseUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
