import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team, Tenant } from '../types/schema';
import { useTaskStore } from './taskStore';

interface AuthState {
  // State
  team: Team | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTeam: (team: Team) => void;
  setTenant: (tenant: Tenant) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  /** Optimistic update after a saved submission; useTeamSync brings the server's numbers */
  recordCompletion: (taskId: string, points: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      team: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
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

      // Starting a load clears the last error; finishing one must not wipe an error set by the load
      setLoading: (isLoading) => set(isLoading ? { isLoading, error: null } : { isLoading }),

      recordCompletion: (taskId, points) =>
        set((state) => {
          if (!state.team || state.team.completedTaskIds.includes(taskId)) return {};
          return {
            team: {
              ...state.team,
              score: state.team.score + points,
              completedTaskIds: [...state.team.completedTaskIds, taskId],
            },
          };
        }),

      logout: () => {
        // The next team on this phone starts clean: no tasks, quiz attempts or notices from this one
        useTaskStore.getState().clearTasks();
        set({
          team: null,
          tenant: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });
      },
    }),
    {
      name: 'urban-rally-auth', // Storage key
      partialize: (state) => ({
        team: state.team,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
