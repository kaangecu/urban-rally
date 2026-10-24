import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase.service';
import { calculateDistance } from '../utils/geo.utils';
import type { TaskSubmission, GeoLocation } from '../../shared/schema';
import { submissionConverter } from '../../shared/converters';

/**
 * Verify if user is within GPS radius of task location
 */
export function verifyGPSLocation(
  userLocation: GeoLocation,
  taskLocation: GeoLocation,
  radiusInMeters: number
): { isValid: boolean; distance: number } {
  const distance = calculateDistance(userLocation, taskLocation);

  return {
    isValid: distance <= radiusInMeters,
    distance: Math.round(distance),
  };
}

/**
 * Create a new task submission
 */
export async function createSubmission(
  taskId: string,
  teamId: string,
  tenantId: string,
  eventId: string,
  data: {
    type: 'photo' | 'video' | 'gps' | 'text';
    photoUrls?: string[];
    videoUrl?: string;
    textResponse?: string;
    submittedLocation?: {
      lat: number;
      lng: number;
      accuracy: number;
    };
    points: number;
  }
): Promise<string> {
  try {
    const db = getFirebaseFirestore();
    const submissionId = `sub-${teamId}-${taskId}-${Date.now()}`;
    const submissionRef = doc(db, 'submissions', submissionId);

    const submission: Omit<TaskSubmission, 'id'> & { id?: string } = {
      id: submissionId,
      taskId,
      teamId,
      tenantId,
      eventId,
      ...(data.photoUrls && { photoUrls: data.photoUrls }),
      ...(data.videoUrl && { videoUrl: data.videoUrl }),
      ...(data.textResponse && { textResponse: data.textResponse }),
      ...(data.submittedLocation && { submittedLocation: data.submittedLocation }),
      status: 'approved', // Auto-approve for now, can add manual review later
      pointsAwarded: data.points,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(submissionRef, submission);

    // Update team score and completed tasks
    await updateTeamScore(teamId, taskId, data.points);

    return submissionId;
  } catch (error) {
    console.error('Error creating submission:', error);
    throw new Error('Failed to create submission');
  }
}

/**
 * Update team score and mark task as completed
 */
async function updateTeamScore(
  teamId: string,
  taskId: string,
  points: number
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const teamRef = doc(db, 'teams', teamId);

    // Check if task is already completed
    const teamDoc = await getDoc(teamRef);
    if (!teamDoc.exists()) {
      throw new Error('Team not found');
    }

    const team = teamDoc.data();
    if (team.completedTaskIds?.includes(taskId)) {
      throw new Error('Task already completed');
    }

    // Update team document
    await updateDoc(teamRef, {
      score: increment(points),
      completedTaskIds: arrayUnion(taskId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating team score:', error);
    throw error;
  }
}

/**
 * Get all submissions for a team
 */
export async function getSubmissionsByTeam(
  teamId: string,
  tenantId: string
): Promise<TaskSubmission[]> {
  try {
    const db = getFirebaseFirestore();
    const submissionsRef = collection(db, 'submissions');

    const q = query(
      submissionsRef,
      where('teamId', '==', teamId),
      where('tenantId', '==', tenantId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => submissionConverter.fromFirestore(doc.id, doc.data()));
  } catch (error) {
    console.error('Error fetching team submissions:', error);
    throw new Error('Failed to fetch submissions');
  }
}

/**
 * Get all submissions for a specific task
 */
export async function getSubmissionsByTask(
  taskId: string,
  tenantId: string
): Promise<TaskSubmission[]> {
  try {
    const db = getFirebaseFirestore();
    const submissionsRef = collection(db, 'submissions');

    const q = query(
      submissionsRef,
      where('taskId', '==', taskId),
      where('tenantId', '==', tenantId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => submissionConverter.fromFirestore(doc.id, doc.data()));
  } catch (error) {
    console.error('Error fetching task submissions:', error);
    throw new Error('Failed to fetch submissions');
  }
}

/**
 * Get a single submission by ID
 */
export async function getSubmissionById(
  submissionId: string
): Promise<TaskSubmission | null> {
  try {
    const db = getFirebaseFirestore();
    const submissionRef = doc(db, 'submissions', submissionId);
    const submissionDoc = await getDoc(submissionRef);

    if (!submissionDoc.exists()) {
      return null;
    }

    return submissionConverter.fromFirestore(submissionDoc.id, submissionDoc.data());
  } catch (error) {
    console.error('Error fetching submission:', error);
    throw new Error('Failed to fetch submission');
  }
}
