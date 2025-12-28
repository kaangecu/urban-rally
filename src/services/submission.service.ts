import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  increment,
  arrayUnion,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase.service';
import { calculateDistance } from '../utils/geo.utils';
import type { TaskSubmission, GeoLocation } from '../types/schema';
import { updateMemberStats } from './teamMember.service';
import { updateUserStats } from './user.service';

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
 * NOW TRACKS INDIVIDUAL USER AND UPDATES BOTH TEAM AND USER STATS
 */
export async function createSubmission(
  taskId: string,
  teamId: string,
  userId: string, // NEW: Who is submitting
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
  console.log('🚀 Creating submission...', { taskId, teamId, userId, tenantId, eventId, dataType: data.type });
  
  try {
    const db = getFirebaseFirestore();
    const submissionId = `sub-${teamId}-${taskId}-${Date.now()}`;
    const submissionRef = doc(db, 'submissions', submissionId);
    console.log('📝 Generated submission ID:', submissionId);

    const submission: Omit<TaskSubmission, 'id'> & { id?: string } = {
      id: submissionId,
      taskId,
      teamId,
      userId, // NEW: Track who submitted
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

    // Use batch write for atomicity
    const batch = writeBatch(db);
    console.log('📦 Creating batch write for submission and team update...');

    // 1. Create submission
    batch.set(submissionRef, {
      ...submission,
      submittedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Update team (check if task already completed)
    const teamRef = doc(db, 'teams', teamId);
    console.log('🔍 Fetching team document...', teamId);
    const teamDoc = await getDoc(teamRef);
    
    if (!teamDoc.exists()) {
      console.error('❌ Team not found:', teamId);
      throw new Error('Team not found');
    }

    const team = teamDoc.data();
    console.log('✅ Team found. Current score:', team.score, 'Completed tasks:', team.completedTaskIds?.length || 0);
    
    // Defensive array handling - ensure completedTaskIds is an array
    const completedTaskIds = Array.isArray(team.completedTaskIds) 
      ? team.completedTaskIds 
      : [];
    
    if (completedTaskIds.includes(taskId)) {
      console.warn('⚠️ Task already completed:', taskId);
      throw new Error('Task already completed');
    }

    console.log('✏️ Adding task to team batch update...', { taskId, points: data.points });
    batch.update(teamRef, {
      score: increment(data.points),
      completedTaskIds: arrayUnion(taskId),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    console.log('✅ Batch committed: submission and team updated');

    // 3. Update team member stats (separate from batch to avoid conflicts)
    console.log('📊 Updating member stats...', { teamId, userId, points: data.points });
    await updateMemberStats(teamId, userId, {
      scoreIncrement: data.points,
      submissionId,
      taskId,
    });
    console.log('✅ Member stats updated');

    // 4. Update user stats
    console.log('📊 Updating user stats...', { userId, points: data.points });
    await updateUserStats(userId, {
      scoreIncrement: data.points,
      submissionsIncrement: 1,
    });
    console.log('✅ User stats updated');

    console.log('✅ Submission flow completed successfully');
    return submissionId;
  } catch (error) {
    console.error('❌ Error creating submission:', error);
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

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate() || new Date(),
        reviewedAt: data.reviewedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as TaskSubmission;
    });
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

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate() || new Date(),
        reviewedAt: data.reviewedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as TaskSubmission;
    });
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

    const data = submissionDoc.data();
    return {
      id: submissionDoc.id,
      ...data,
      submittedAt: data.submittedAt?.toDate() || new Date(),
      reviewedAt: data.reviewedAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as TaskSubmission;
  } catch (error) {
    console.error('Error fetching submission:', error);
    throw new Error('Failed to fetch submission');
  }
}
