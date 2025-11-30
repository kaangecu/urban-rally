import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase.service';
import type { Task } from '../types/schema';

/**
 * Get all tasks for a specific event
 * Enforces multi-tenant isolation via tenantId
 */
export async function getTasksByEvent(
  eventId: string,
  tenantId: string
): Promise<Task[]> {
  try {
    const db = getFirebaseFirestore();
    const tasksRef = collection(db, 'tasks');
    
    // Query with multi-tenant filter (required by security rules)
    const q = query(
      tasksRef,
      where('tenantId', '==', tenantId),
      where('eventId', '==', eventId),
      where('isActive', '==', true),
      orderBy('points', 'desc') // Higher points first
    );
    
    const snapshot = await getDocs(q);
    
    const tasks: Task[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to Dates
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        unlockAt: data.unlockAt?.toDate(),
        expiresAt: data.expiresAt?.toDate(),
      } as Task;
    });
    
    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
}

/**
 * Get a single task by ID
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const db = getFirebaseFirestore();
    const taskRef = doc(db, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      return null;
    }
    
    const data = taskDoc.data();
    const task: Task = {
      id: taskDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      unlockAt: data.unlockAt?.toDate(),
      expiresAt: data.expiresAt?.toDate(),
    } as Task;
    
    return task;
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    throw new Error('Failed to fetch task');
  }
}

/**
 * Filter tasks that are currently available (unlocked and not expired)
 */
export function getAvailableTasks(tasks: Task[]): Task[] {
  const now = new Date();
  
  return tasks.filter(task => {
    // Check if task is unlocked
    const isUnlocked = !task.unlockAt || task.unlockAt <= now;
    
    // Check if task is not expired
    const isNotExpired = !task.expiresAt || task.expiresAt > now;
    
    return task.isActive && isUnlocked && isNotExpired;
  });
}

/**
 * Filter tasks by type
 */
export function getTasksByType(tasks: Task[], type: Task['type']): Task[] {
  return tasks.filter(task => task.type === type);
}

/**
 * Get tasks that haven't been completed by the team
 */
export function getIncompleteTasks(
  tasks: Task[],
  completedTaskIds: string[]
): Task[] {
  return tasks.filter(task => !completedTaskIds.includes(task.id));
}

/**
 * Get completed tasks
 */
export function getCompletedTasks(
  tasks: Task[],
  completedTaskIds: string[]
): Task[] {
  return tasks.filter(task => completedTaskIds.includes(task.id));
}

/**
 * Sort tasks by different criteria
 */
export function sortTasks(
  tasks: Task[],
  sortBy: 'points' | 'distance' | 'difficulty'
): Task[] {
  const sorted = [...tasks];
  
  switch (sortBy) {
    case 'points':
      return sorted.sort((a, b) => b.points - a.points);
    
    case 'difficulty':
      const difficultyOrder: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
      return sorted.sort((a, b) => {
        const aDiff = difficultyOrder[a.difficulty || 'medium'];
        const bDiff = difficultyOrder[b.difficulty || 'medium'];
        return aDiff - bDiff;
      });
    
    case 'distance':
      // Requires user location - will implement in map integration
      return sorted;
    
    default:
      return sorted;
  }
}

/**
 * Calculate task statistics
 */
export function getTaskStats(tasks: Task[], completedTaskIds: string[]) {
  const available = getAvailableTasks(tasks);
  const incomplete = getIncompleteTasks(available, completedTaskIds);
  const completed = getCompletedTasks(tasks, completedTaskIds);
  
  const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
  const earnedPoints = completed.reduce((sum, task) => sum + task.points, 0);
  
  return {
    total: tasks.length,
    available: available.length,
    incomplete: incomplete.length,
    completed: completed.length,
    totalPoints,
    earnedPoints,
    completionRate: tasks.length > 0 
      ? Math.round((completed.length / tasks.length) * 100)
      : 0,
  };
}
