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
