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
  /** The task whose photo or video is being sent, which keeps running after the player leaves */
  uploadingTaskId: string | null;
  /** Quiz misses per task, kept here so closing and reopening a quiz doesn't reset its attempts */
  quizProgress: Record<string, { attempts: number; wrong: (string | number)[] }>;

  // Actions
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: 'all' | 'available' | 'completed') => void;
  setSortBy: (sortBy: 'points' | 'distance' | 'difficulty') => void;
  setUploadingTaskId: (uploadingTaskId: string | null) => void;
  recordQuizMiss: (taskId: string, answer: string | number) => void;
  clearTasks: () => void;
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
  uploadingTaskId: null,
  quizProgress: {},

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

  // Starting a load clears the last error; finishing one must not wipe an error set by the load
  setLoading: (isLoading) => set(isLoading ? { isLoading, error: null } : { isLoading }),

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

  setUploadingTaskId: (uploadingTaskId) => set({ uploadingTaskId }),

  recordQuizMiss: (taskId, answer) =>
    set((state) => {
      const current = state.quizProgress[taskId] ?? { attempts: 0, wrong: [] };
      return {
        quizProgress: {
          ...state.quizProgress,
          [taskId]: { attempts: current.attempts + 1, wrong: [...current.wrong, answer] },
        },
      };
    }),

  clearTasks: () =>
    set({
      tasks: [],
      selectedTask: null,
      quizProgress: {},
      error: null,
      isLoading: false,
    }),
}));
