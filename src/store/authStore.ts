import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team, Tenant, User } from '../types/schema';

interface AuthState {
  // State
  user: User | null; // NEW: Current authenticated user
  team: Team | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void; // NEW: Set current user
  setTeam: (team: Team) => void;
  setTenant: (tenant: Tenant) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
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
      setUser: (user) => // NEW
        set({
          user,
          error: null,
        }),

      setTeam: (team) =>
        set({
          team,
          isAuthenticated: true,
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

      logout: () =>
        set({
          user: null, // NEW: Clear user on logout
          team: null,
          tenant: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        }),
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
