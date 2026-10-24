import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team, Tenant } from '../types/schema';

interface AuthState {
  // State
  team: Team | null;
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTeam: (team: Team) => void;
  setTenant: (tenant: Tenant) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      team: null,
      tenant: null,
      isLoading: false,
      error: null,

      // Actions
      setTeam: (team) =>
        set({
          team,
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

      clear: () =>
        set({
          team: null,
          tenant: null,
          error: null,
          isLoading: false,
        }),
    }),
    {
      name: 'urban-rally-auth', // Storage key
      partialize: (state) => ({
        team: state.team,
        tenant: state.tenant,
      }),
    }
  )
);
