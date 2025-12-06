/**
 * Enhanced Task Service with Type Safety and Optimization
 * Implements efficient queries using composite indexes and geohashing
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Query,
  GeoPoint,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase.service';
import type {
  Task,
  GPSTask,
  PhotoTask,
  VideoTask,
  TaskHint,
  PurchasedHint,
  TaskStats,
} from '../types/schema.enhanced';
import {
  generateGeohash,
  getGeohashQueryBounds,
  calculateDistance,
  isWithinRadius,
} from '../utils/geospatial';

const db = getFirebaseFirestore();

/**
 * Get all tasks for an event (optimized with index)
 */
export async function getTasksByEvent(
  eventId: string,
  options?: {
    onlyActive?: boolean;
    orderByField?: 'order' | 'points' | 'difficulty';
    limitCount?: number;
  }
): Promise<Task[]> {
  const tasksRef = collection(db, 'tasks');
  
  let q: Query = query(
    tasksRef,
    where('eventId', '==', eventId)
  );

  if (options?.onlyActive) {
    q = query(q, where('isActive', '==', true));
  }

  if (options?.orderByField) {
    const order = options.orderByField === 'points' ? 'desc' : 'asc';
    q = query(q, orderBy(options.orderByField, order));
  } else {
    q = query(q, orderBy('order', 'asc'));
  }

  if (options?.limitCount) {
    q = query(q, limit(options.limitCount));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Task));
}

/**
 * Get tasks by type (uses composite index)
 */
export async function getTasksByType<T extends Task['type']>(
  eventId: string,
  taskType: T,
  onlyActive: boolean = true
): Promise<Task[]> {
  const tasksRef = collection(db, 'tasks');
  
  let q: Query = query(
    tasksRef,
    where('eventId', '==', eventId),
    where('type', '==', taskType)
  );

  if (onlyActive) {
    q = query(q, where('isActive', '==', true));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Task));
}

/**
 * Get tasks near a location (uses geohash index)
 */
export async function getTasksNearLocation(
  eventId: string,
  center: GeoPoint,
  radiusMeters: number
): Promise<(GPSTask | PhotoTask | VideoTask)[]> {
  const bounds = getGeohashQueryBounds(center, radiusMeters);
  const tasksRef = collection(db, 'tasks');
  
  // Query each geohash range
  const queries = bounds.map(([start, end]) =>
    query(
      tasksRef,
      where('eventId', '==', eventId),
      where('geohash', '>=', start),
      where('geohash', '<=', end),
      where('isActive', '==', true)
    )
  );

  // Execute all queries in parallel
  const snapshots = await Promise.all(queries.map(q => getDocs(q)));
  
  // Merge results and filter by actual distance
  const tasks: (GPSTask | PhotoTask | VideoTask)[] = [];
  const seenIds = new Set<string>();

  for (const snapshot of snapshots) {
    for (const doc of snapshot.docs) {
      if (seenIds.has(doc.id)) continue;
      
      const task = { id: doc.id, ...doc.data() } as Task;
      
      // Filter to only location-based tasks
      if (task.type === 'GPS' || 
          task.type === 'GPS_LOCATION' || 
          (task.type === 'PHOTO' && task.coordinates) ||
          (task.type === 'VIDEO' && task.coordinates)) {
        
        const locationTask = task as GPSTask | PhotoTask | VideoTask;
        if (locationTask.coordinates && 
            isWithinRadius(center, locationTask.coordinates, radiusMeters)) {
          tasks.push(locationTask);
          seenIds.add(doc.id);
        }
      }
    }
  }

  return tasks;
}

/**
 * Get task by ID
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  const taskRef = doc(db, 'tasks', taskId);
  const taskSnap = await getDoc(taskRef);
  
  if (!taskSnap.exists()) {
    return null;
  }

  return {
    id: taskSnap.id,
    ...taskSnap.data(),
  } as Task;
}

/**
 * Create a new task with proper geohash
 */
export async function createTask(task: Omit<Task, 'id'>): Promise<string> {
  const tasksRef = collection(db, 'tasks');
  
  // Add geohash for location-based tasks
  let taskData: any = {
    ...task,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Generate geohash if task has coordinates
  if ('coordinates' in task && task.coordinates instanceof GeoPoint) {
    taskData.geohash = generateGeohash(
      task.coordinates.latitude,
      task.coordinates.longitude
    );
  }

  // Initialize stats
  if (!taskData.stats) {
    taskData.stats = {
      totalSubmissions: 0,
      approvedSubmissions: 0,
      rejectedSubmissions: 0,
      successRate: 0,
      averageTimeToComplete: 0,
      uniqueTeamsAttempted: 0,
      uniqueTeamsCompleted: 0,
    };
  }

  const docRef = await addDoc(tasksRef, taskData);
  return docRef.id;
}

/**
 * Update task
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  
  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };

  // Regenerate geohash if coordinates changed
  if ('coordinates' in updates && updates.coordinates) {
    updateData.geohash = generateGeohash(
      updates.coordinates.latitude,
      updates.coordinates.longitude
    );
  }

  await updateDoc(taskRef, updateData);
}

/**
 * Delete task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskRef);
}

/**
 * Get hints for a task (subcollection)
 */
export async function getTaskHints(taskId: string): Promise<TaskHint[]> {
  const hintsRef = collection(db, 'tasks', taskId, 'hints');
  const q = query(hintsRef, orderBy('hintLevel', 'asc'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as TaskHint));
}

/**
 * Add hint to task (subcollection)
 */
export async function addTaskHint(
  taskId: string,
  hint: Omit<TaskHint, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const hintsRef = collection(db, 'tasks', taskId, 'hints');
  
  const hintData = {
    ...hint,
    taskId,
    revealedCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(hintsRef, hintData);
  return docRef.id;
}

/**
 * Purchase hint for team
 */
export async function purchaseHint(
  teamId: string,
  taskId: string,
  hintId: string,
  cost: number
): Promise<string> {
  const batch = writeBatch(db);

  // 1. Add to team's purchased hints
  const purchaseRef = doc(collection(db, 'teams', teamId, 'purchasedHints'));
  batch.set(purchaseRef, {
    teamId,
    taskId,
    hintId,
    cost,
    purchasedAt: Timestamp.now(),
    revealed: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // 2. Increment hint's revealed count
  const hintRef = doc(db, 'tasks', taskId, 'hints', hintId);
  batch.update(hintRef, {
    revealedCount: (await getDoc(hintRef)).data()?.revealedCount + 1 || 1,
  });

  // 3. Deduct points from team
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  const currentScore = teamSnap.data()?.score || 0;
  batch.update(teamRef, {
    score: Math.max(0, currentScore - cost),
  });

  await batch.commit();
  return purchaseRef.id;
}

/**
 * Get team's purchased hints
 */
export async function getTeamPurchasedHints(
  teamId: string,
  taskId?: string
): Promise<PurchasedHint[]> {
  const hintsRef = collection(db, 'teams', teamId, 'purchasedHints');
  
  let q: Query = query(hintsRef);
  if (taskId) {
    q = query(q, where('taskId', '==', taskId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as PurchasedHint));
}

/**
 * Update task statistics (called by Cloud Function)
 */
export async function updateTaskStats(
  taskId: string,
  stats: Partial<TaskStats>
): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    stats,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get unlocked tasks (time-based activation)
 */
export async function getUnlockedTasks(eventId: string): Promise<Task[]> {
  const now = Timestamp.now();
  const tasksRef = collection(db, 'tasks');
  
  const q = query(
    tasksRef,
    where('eventId', '==', eventId),
    where('isActive', '==', true),
    where('unlockAt', '<=', now)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Task));
}

/**
 * Check if team has completed task
 */
export async function hasTeamCompletedTask(
  teamId: string,
  taskId: string
): Promise<boolean> {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  
  if (!teamSnap.exists()) {
    return false;
  }

  const completedTaskIds = teamSnap.data()?.completedTaskIds || [];
  return completedTaskIds.includes(taskId);
}

/**
 * Validate GPS submission
 */
export function validateGPSSubmission(
  task: GPSTask,
  userLocation: GeoPoint,
  accuracy: number
): {
  valid: boolean;
  distance: number;
  message?: string;
} {
  // Check GPS accuracy
  if (accuracy > 100) {
    return {
      valid: false,
      distance: 0,
      message: 'GPS accuracy too low. Please try again with better signal.',
    };
  }

  const distance = calculateDistance(userLocation, task.coordinates);

  if (distance <= task.radius) {
    return {
      valid: true,
      distance,
    };
  }

  return {
    valid: false,
    distance,
    message: `You are ${Math.round(distance - task.radius)}m away from the target location.`,
  };
}
