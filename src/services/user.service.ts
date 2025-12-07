/**
 * User Service
 * Manages user accounts, profiles, and GDPR compliance
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { signInAnonymously, deleteUser as deleteAuthUser } from 'firebase/auth';
import { getFirebaseFirestore, getFirebaseAuth } from './firebase.service';
import type { User } from '../types/schema';

/**
 * Create a new user
 */
export async function createUser(data: {
  displayName: string;
  email?: string;
  tenantId: string;
  consentGiven: {
    terms: boolean;
    privacy: boolean;
    termsVersion: string;
    privacyVersion: string;
    termsAcceptedAt: Date;
    privacyAcceptedAt: Date;
    ipAddress?: string;
  };
}): Promise<User> {
  try {
    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();

    // 1. Create Firebase Anonymous Auth user
    const userCredential = await signInAnonymously(auth);
    const uid = userCredential.user.uid;

    // 2. Create user document
    const userRef = doc(db, 'users', uid);
    const now = new Date();

    const user: User = {
      id: uid,
      tenantId: data.tenantId,
      displayName: data.displayName,
      email: data.email,
      consentGiven: data.consentGiven,
      totalScore: 0,
      totalSubmissions: 0,
      eventsParticipated: 0,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    await setDoc(userRef, {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });

    console.log('✅ User created:', uid);
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const db = getFirebaseFirestore();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    } as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user');
  }
}

/**
 * Find user by email
 */
export async function getUserByEmail(
  email: string,
  tenantId: string
): Promise<User | null> {
  try {
    const db = getFirebaseFirestore();
    const usersRef = collection(db, 'users');

    const q = query(
      usersRef,
      where('email', '==', email.toLowerCase().trim()),
      where('tenantId', '==', tenantId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const userDoc = snapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data(),
    } as User;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw new Error('Failed to find user');
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: {
    displayName?: string;
    email?: string;
    profilePhotoUrl?: string;
  }
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ User profile updated:', userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

/**
 * Update user statistics
 */
export async function updateUserStats(
  userId: string,
  updates: {
    scoreIncrement?: number;
    submissionsIncrement?: number;
    eventsIncrement?: number;
  }
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const userRef = doc(db, 'users', userId);

    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (updates.scoreIncrement !== undefined) {
      updateData.totalScore = increment(updates.scoreIncrement);
    }
    if (updates.submissionsIncrement !== undefined) {
      updateData.totalSubmissions = increment(updates.submissionsIncrement);
    }
    if (updates.eventsIncrement !== undefined) {
      updateData.eventsParticipated = increment(updates.eventsIncrement);
    }

    await updateDoc(userRef, updateData);

    console.log('✅ User stats updated:', userId);
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw new Error('Failed to update user stats');
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<{
  totalScore: number;
  totalSubmissions: number;
  eventsParticipated: number;
} | null> {
  try {
    const user = await getUserById(userId);

    if (!user) {
      return null;
    }

    return {
      totalScore: user.totalScore,
      totalSubmissions: user.totalSubmissions,
      eventsParticipated: user.eventsParticipated,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw new Error('Failed to fetch user stats');
  }
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Delete user and all associated data (GDPR compliance)
 * This is a critical operation that removes:
 * - User document
 * - All team memberships
 * - Anonymizes submissions (keeps points but removes identity)
 * - Firebase Auth account
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const auth = getFirebaseAuth();

    console.log('🗑️ Starting GDPR user deletion:', userId);

    // 1. Get all team memberships
    const membersRef = collection(db, 'teamMembers');
    const memberQuery = query(membersRef, where('userId', '==', userId));
    const memberSnapshots = await getDocs(memberQuery);

    console.log(`Found ${memberSnapshots.size} team memberships to remove`);

    // 2. Remove user from all teams
    for (const memberDoc of memberSnapshots.docs) {
      await deleteDoc(memberDoc.ref);
    }

    // 3. Anonymize all submissions (keep points but remove user identity)
    const submissionsRef = collection(db, 'submissions');
    const submissionQuery = query(submissionsRef, where('userId', '==', userId));
    const submissionSnapshots = await getDocs(submissionQuery);

    console.log(`Anonymizing ${submissionSnapshots.size} submissions`);

    for (const submissionDoc of submissionSnapshots.docs) {
      await updateDoc(submissionDoc.ref, {
        userId: 'deleted-user',
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Delete user document
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);

    // 5. Delete Firebase Auth account
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await deleteAuthUser(auth.currentUser);
    }

    console.log('✅ User deletion completed:', userId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user data');
  }
}

/**
 * Check if user exists
 */
export async function userExists(userId: string): Promise<boolean> {
  try {
    const user = await getUserById(userId);
    return user !== null;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}

/**
 * Get or create user
 * Useful for login flows where user might already exist
 */
export async function getOrCreateUser(data: {
  displayName: string;
  email?: string;
  tenantId: string;
  consentGiven: {
    terms: boolean;
    privacy: boolean;
    termsVersion: string;
    privacyVersion: string;
    termsAcceptedAt: Date;
    privacyAcceptedAt: Date;
    ipAddress?: string;
  };
}): Promise<User> {
  try {
    // Try to find existing user by email
    if (data.email) {
      const existingUser = await getUserByEmail(data.email, data.tenantId);
      if (existingUser) {
        // Update last login
        await updateLastLogin(existingUser.id);
        console.log('✅ Existing user found:', existingUser.id);
        return existingUser;
      }
    }

    // Create new user
    return await createUser(data);
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Failed to get or create user');
  }
}
