import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { getFirebaseFirestore, getFirebaseAuth } from './firebase.service';
import type { Team } from '../types/schema';

/**
 * Find a team by their access code
 */
export async function getTeamByAccessCode(accessCode: string): Promise<Team | null> {
  try {
    const db = getFirebaseFirestore();
    const teamsRef = collection(db, 'teams');
    
    // Query for team with matching access code
    const q = query(
      teamsRef,
      where('accessCode', '==', accessCode.toUpperCase().trim())
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const teamDoc = snapshot.docs[0];
    return {
      id: teamDoc.id,
      ...teamDoc.data(),
    } as Team;
  } catch (error) {
    console.error('Error fetching team:', error);
    throw new Error('Failed to fetch team');
  }
}

/**
 * Link Firebase Anonymous Auth user to team
 */
export async function linkTeamToUser(teamId: string): Promise<string> {
  try {
    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();
    
    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    const uid = userCredential.user.uid;
    
    // Update team with user ID
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      uid,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return uid;
  } catch (error) {
    console.error('Error linking team to user:', error);
    throw new Error('Failed to authenticate');
  }
}

/**
 * Get team by ID
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  try {
    const db = getFirebaseFirestore();
    const teamRef = doc(db, 'teams', teamId);
    const teamDoc = await getDoc(teamRef);
    
    if (!teamDoc.exists()) {
      return null;
    }
    
    return {
      id: teamDoc.id,
      ...teamDoc.data(),
    } as Team;
  } catch (error) {
    console.error('Error fetching team by ID:', error);
    throw new Error('Failed to fetch team');
  }
}

/**
 * Update team's current location
 */
export async function updateTeamLocation(
  teamId: string,
  location: { lat: number; lng: number }
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const teamRef = doc(db, 'teams', teamId);
    
    await updateDoc(teamRef, {
      currentLocation: location,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating team location:', error);
    throw new Error('Failed to update location');
  }
}

/**
 * Update team score
 */
export async function updateTeamScore(
  teamId: string,
  pointsToAdd: number
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const teamRef = doc(db, 'teams', teamId);
    const teamDoc = await getDoc(teamRef);
    
    if (!teamDoc.exists()) {
      throw new Error('Team not found');
    }
    
    const currentScore = teamDoc.data().score || 0;
    
    await updateDoc(teamRef, {
      score: currentScore + pointsToAdd,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating team score:', error);
    throw new Error('Failed to update score');
  }
}
