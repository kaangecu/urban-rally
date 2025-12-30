import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team, Tenant, User } from '../types/schema';
import { getFirebaseAuth } from '../services/firebase.service';

interface AuthState {
  // State
  user: User | null; // NEW: Current authenticated user
  team: Team | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTeam: (team: Team | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null, // NEW
      team: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null, // ← FIX: Set isAuthenticated based on user presence
          error: null,
        }),

      setTeam: (team) =>
        set({
          team,
          isAuthenticated: team !== null,
          error: null,
        }),

      setTenant: (tenant) =>
        set({
          tenant,
          error: null,
        }),

      setError: (error) =>
        set({
          error,
          isLoading: false,
        }),

      setLoading: (isLoading) =>
        set({
          isLoading,
          error: null,
        }),

      logout: async () => {
        // ⚠️ WARNING: Logout destroys anonymous sessions permanently!
        // Users cannot log back in. Use with extreme caution.
        // Consider using "Leave Team" instead to preserve the account.
        
        console.warn('⚠️  LOGOUT CALLED: Anonymous session will be destroyed permanently!');
        console.warn('⚠️  User will NOT be able to log back in.');
        console.warn('⚠️  Consider using "Leave Team" instead.');
        
        try {
          const auth = getFirebaseAuth();
          
          // Sign out from Firebase Auth
          await auth.signOut();
          
          console.log('✅ User signed out from Firebase');
        } catch (error) {
          console.error('❌ Error signing out from Firebase:', error);
          // Continue with logout even if Firebase signOut fails
        } finally {
          // Always clear local state (Zustand store + localStorage)
          set({
            user: null,
            team: null,
            tenant: null,
            isAuthenticated: false,
            error: null,
            isLoading: false,
          });
          
          console.log('🔴 User session destroyed (cannot be recovered)');
        }
      },
    }),
    {
      name: 'urban-rally-auth', // Storage key
      partialize: (state) => ({
        user: state.user, // NEW: Persist user
        team: state.team,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
