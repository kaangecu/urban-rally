/**
 * User Service
 * Manages user accounts, profiles, and GDPR compliance
 */

import {
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { signInAnonymously, deleteUser as deleteAuthUser } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseFirestore, getFirebaseAuth } from './firebase.service';
import type { User } from '../types/schema';

/**
 * Create a new user
 * 
 * This function now uses a Cloud Function to create the user document,
 * which bypasses client-side security rules and fixes the permission error.
 * 
 * Flow:
 * 1. Sign in anonymously to get Firebase Auth UID
 * 2. Call Cloud Function to create user document (uses Admin SDK)
 * 3. Fetch and return the created user document
 */
export async function createUser(data: {
  displayName: string;
  email?: string;
  tenantId: string;
  accountType?: 'anonymous' | 'linked'; // NEW: Multi-event support
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
  const auth = getFirebaseAuth();
  const db = getFirebaseFirestore();
  // Specify europe-west3 region to match deployed function
  const functions = getFunctions(undefined, 'europe-west3');
  let uid: string | undefined;

  try {
    console.log('🔵 Starting user creation process (via Cloud Function)...');
    console.log('📋 Input data:', {
      displayName: data.displayName,
      hasEmail: !!data.email,
      email: data.email,
      tenantId: data.tenantId,
    });

    // 1. Create Firebase Anonymous Auth user
    console.log('🔐 Creating anonymous auth user...');
    const userCredential = await signInAnonymously(auth);
    uid = userCredential.user.uid;
    console.log('✅ Auth user created, UID:', uid);

    // 2. Call Cloud Function to create user document
    console.log('☁️ Calling Cloud Function to create user document...');
    const createUserDocument = httpsCallable(functions, 'createUserDocument');
    
    const result = await createUserDocument({
      displayName: data.displayName,
      email: data.email || undefined,
      tenantId: data.tenantId,
      accountType: data.accountType || 'anonymous', // NEW: Pass accountType
      consentGiven: data.consentGiven,
    });

    console.log('✅ Cloud Function response:', result.data);

    // 3. Fetch the created user document (with retry for replication delay)
    console.log('📖 Fetching created user document...');
    const userRef = doc(db, 'users', uid);
    
    // Retry logic: Cloud Function creates document, but there might be a slight delay
    // before Firestore replicates it to the client's region
    let userDoc;
    let attempts = 0;
    const maxAttempts = 5;
    const delayMs = 500; // 500ms between attempts
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`📖 Attempt ${attempts}/${maxAttempts} to fetch user document...`);
      
      userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        break;
      }
      
      if (attempts < maxAttempts) {
        console.log(`⏳ User document not found yet, waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    if (!userDoc || !userDoc.exists()) {
      console.error('❌ User document not found after', maxAttempts, 'attempts');
      throw new Error('User document was not created by Cloud Function. Please try again.');
    }

    const userData = userDoc.data() as User;
    console.log('✅ User created successfully:', {
      uid,
      displayName: userData.displayName,
      hasEmail: !!userData.email,
    });

    return userData;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    
    // Log Firebase-specific error details
    if ((error as any).code) {
      console.error('Firebase error code:', (error as any).code);
    }
    
    // Handle specific Cloud Function errors
    if ((error as any).code === 'functions/unauthenticated') {
      throw new Error('Authentication failed. Please try again.');
    }
    
    if ((error as any).code === 'functions/already-exists') {
      // User document already exists - fetch and return it instead of failing
      console.log('⚠️ User already exists, fetching existing document...');
      
      if (!uid) {
        throw new Error('Cannot fetch existing user without UID');
      }
      
      try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          console.log('✅ Fetched existing user:', {
            uid,
            displayName: userData.displayName,
          });
          return userData;
        }
        
        // User should exist but doesn't - this is an inconsistent state
        throw new Error('User profile exists in auth but not in database. Please contact support.');
      } catch (fetchError) {
        console.error('Failed to fetch existing user:', fetchError);
        throw new Error('User profile already exists. Please reload the page.');
      }
    }
    
    if ((error as any).code === 'functions/invalid-argument') {
      throw new Error('Invalid user data. Please check your inputs.');
    }
    
    throw new Error('Failed to create user profile. Please try again.');
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
 * For anonymous auth: Always creates a new user
 * Email is optional and only used for notifications
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
    // For anonymous auth, we always create a new user
    // Email lookup is not possible before authentication due to security rules
    // Each anonymous session gets a new user ID
    
    console.log('Creating new user with:', {
      displayName: data.displayName,
      hasEmail: !!data.email,
      tenantId: data.tenantId
    });
    
    return await createUser(data);
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Failed to get or create user');
  }
}

// ============================================================================
// MULTI-EVENT SUPPORT FUNCTIONS (NEW in v2.0)
// ============================================================================

/**
 * Get all events user participates in
 * Queries TeamMember collection to find all events user has joined
 * 
 * @param userId - User's Firebase UID
 * @returns Array of Event objects user participates in
 */
export async function getUserEvents(userId: string): Promise<any[]> {
  try {
    const db = getFirebaseFirestore();
    
    // Step 1: Get all TeamMember records for user
    const q = query(
      collection(db, 'teamMembers'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const memberSnapshot = await getDocs(q);
    
    // Step 2: Extract unique eventIds
    const eventIds = [...new Set(
      memberSnapshot.docs.map(doc => doc.data().eventId)
    )];
    
    if (eventIds.length === 0) {
      return [];
    }
    
    // Step 3: Fetch event details
    const events = await Promise.all(
      eventIds.map(async (eventId) => {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (!eventDoc.exists()) return null;
        return { id: eventDoc.id, ...eventDoc.data() };
      })
    );
    
    const validEvents = events.filter(e => e !== null);
    
    console.log(`✅ Found ${validEvents.length} events for user ${userId}`);
    return validEvents;
  } catch (error) {
    console.error('Error fetching user events:', error);
    throw new Error('Failed to fetch user events');
  }
}

/**
 * Check if user is in specific event
 * 
 * @param userId - User's Firebase UID
 * @param eventId - Event ID to check
 * @returns true if user has active membership in event
 */
export async function isUserInEvent(
  userId: string,
  eventId: string
): Promise<boolean> {
  try {
    const db = getFirebaseFirestore();
    
    const q = query(
      collection(db, 'teamMembers'),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking user event participation:', error);
    return false;
  }
}

/**
 * Get user's team in specific event
 * Returns both team details and membership record
 * 
 * @param userId - User's Firebase UID
 * @param eventId - Event ID to check
 * @returns Team and membership info, or null if not in event
 */
export async function getUserTeamInEvent(
  userId: string,
  eventId: string
): Promise<{ team: any; membership: any } | null> {
  try {
    const db = getFirebaseFirestore();
    
    // Get TeamMember record
    const memberQuery = query(
      collection(db, 'teamMembers'),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
      where('isActive', '==', true)
    );
    
    const memberSnapshot = await getDocs(memberQuery);
    if (memberSnapshot.empty) return null;
    
    const membershipData = memberSnapshot.docs[0].data();
    const membership = {
      id: memberSnapshot.docs[0].id,
      ...membershipData
    };
    
    // Get Team document
    const teamDoc = await getDoc(doc(db, 'teams', membershipData.teamId as string));
    if (!teamDoc.exists()) return null;
    
    const team = { id: teamDoc.id, ...teamDoc.data() };
    
    return { team, membership };
  } catch (error) {
    console.error('Error fetching user team in event:', error);
    throw new Error('Failed to fetch user team');
  }
}

/**
 * Generate recovery code for account recovery
 * Creates a 6-digit alphanumeric code that expires in 30 days
 * 
 * @param userId - User's Firebase UID
 * @returns The generated recovery code
 */
export async function generateRecoveryCode(userId: string): Promise<string> {
  try {
    const db = getFirebaseFirestore();
    
    // Generate 6-digit alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Set expiration (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Update user document
    await updateDoc(doc(db, 'users', userId), {
      recoveryCode: code,
      recoveryCodeExpiresAt: expiresAt,
      recoveryCodeGeneratedAt: new Date(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Recovery code generated for user ${userId}: ${code}`);
    return code;
  } catch (error) {
    console.error('Error generating recovery code:', error);
    throw new Error('Failed to generate recovery code');
  }
}

/**
 * Validate recovery code and find user
 * 
 * @param code - Recovery code entered by user
 * @returns User document if code is valid, null otherwise
 */
export async function validateRecoveryCode(code: string): Promise<User | null> {
  try {
    const db = getFirebaseFirestore();
    
    // Find user with this recovery code (not expired)
    const q = query(
      collection(db, 'users'),
      where('recoveryCode', '==', code.toUpperCase()),
      where('recoveryCodeExpiresAt', '>', new Date())
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log('❌ Invalid or expired recovery code');
      return null;
    }
    
    const user = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User;
    console.log(`✅ Valid recovery code for user: ${user.id}`);
    return user;
  } catch (error) {
    console.error('Error validating recovery code:', error);
    throw new Error('Failed to validate recovery code');
  }
}

/**
 * Invalidate recovery code (after successful use)
 * 
 * @param userId - User's Firebase UID
 */
export async function invalidateRecoveryCode(userId: string): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    
    await updateDoc(doc(db, 'users', userId), {
      recoveryCode: null,
      recoveryCodeExpiresAt: null,
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Recovery code invalidated for user ${userId}`);
  } catch (error) {
    console.error('Error invalidating recovery code:', error);
    throw new Error('Failed to invalidate recovery code');
  }
}
