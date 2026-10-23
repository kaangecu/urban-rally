import { create } from 'zustand';
import type { Task } from '../types/schema';

interface TaskState {
  // State
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;
  filter: 'all' | 'available' | 'completed';
  sortBy: 'points' | 'distance' | 'difficulty';
  /** Short confirmation shown on the list, e.g. after a task is sent */
  notice: string | null;

  // Actions
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: 'all' | 'available' | 'completed') => void;
  setSortBy: (sortBy: 'points' | 'distance' | 'difficulty') => void;
  clearTasks: () => void;
  setNotice: (notice: string | null) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  // Initial state
  tasks: [],
  selectedTask: null,
  // True until the first load finishes, so the list never flashes its empty state
  isLoading: true,
  error: null,
  filter: 'available',
  sortBy: 'points',
  notice: null,

  // Actions
  setTasks: (tasks) =>
    set({
      tasks,
      error: null,
    }),

  setSelectedTask: (selectedTask) =>
    set({
      selectedTask,
    }),

  setLoading: (isLoading) =>
    set({
      isLoading,
      error: isLoading ? null : undefined,
    }),

  setError: (error) =>
    set({
      error,
      isLoading: false,
    }),

  setFilter: (filter) =>
    set({
      filter,
    }),

  setSortBy: (sortBy) =>
    set({
      sortBy,
    }),

  setNotice: (notice) => set({ notice }),

  clearTasks: () =>
    set({
      tasks: [],
      selectedTask: null,
      error: null,
      isLoading: false,
    }),
}));
