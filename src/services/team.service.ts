import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  increment,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { getFirebaseFirestore, getFirebaseAuth } from './firebase.service';
import type { Team } from '../types/schema';
import { getTeamMembers } from './teamMember.service';

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

/**
 * Update team profile with user information and GDPR consent
 * @param teamId - Team document ID
 * @param data - Profile data including displayName, email, and consent
 */
export async function updateTeamProfile(
  teamId: string,
  data: {
    displayName?: string;
    email?: string;
    profilePhotoUrl?: string;
    teamDisplayName?: string;
    consentGiven?: {
      terms: boolean;
      privacy: boolean;
      termsVersion: string;
      privacyVersion: string;
      termsAcceptedAt?: Date;
      privacyAcceptedAt?: Date;
      ipAddress?: string;
    };
  }
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const teamRef = doc(db, 'teams', teamId);
    
    // Filter out undefined values - Firestore doesn't accept them
    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };
    
    // Only add fields that are defined
    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName;
    }
    if (data.email !== undefined && data.email !== '') {
      updateData.email = data.email;
    }
    if (data.profilePhotoUrl !== undefined) {
      updateData.profilePhotoUrl = data.profilePhotoUrl;
    }
    if (data.teamDisplayName !== undefined) {
      updateData.teamDisplayName = data.teamDisplayName;
    }
    if (data.consentGiven !== undefined) {
      updateData.consentGiven = data.consentGiven;
    }
    
    await updateDoc(teamRef, updateData);
    
    console.log('✅ Team profile updated:', data.displayName);
  } catch (error) {
    console.error('Error updating team profile:', error);
    throw new Error('Failed to update profile');
  }
}

/**
 * Get team with all member details
 * Returns team data along with full member information
 */
export async function getTeamWithMembers(teamId: string): Promise<{
  team: Team;
  members: Array<{
    userId: string;
    displayName: string;
    email?: string;
    personalScore: number;
    tasksCompleted: number;
    role: 'owner' | 'member';
    joinedAt: Date;
  }>;
} | null> {
  try {
    // Get team data
    const team = await getTeamById(teamId);
    if (!team) {
      return null;
    }

    // Get all members with details
    const members = await getTeamMembers(teamId);

    return {
      team,
      members,
    };
  } catch (error) {
    console.error('Error fetching team with members:', error);
    throw new Error('Failed to fetch team with members');
  }
}

/**
 * Update team score by incrementing
 * Used when a submission is approved
 */
export async function incrementTeamScore(
  teamId: string,
  pointsToAdd: number
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const teamRef = doc(db, 'teams', teamId);

    await updateDoc(teamRef, {
      score: increment(pointsToAdd),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Team score incremented by ${pointsToAdd} points:`, teamId);
  } catch (error) {
    console.error('Error incrementing team score:', error);
    throw new Error('Failed to update team score');
  }
}

/**
 * Check if team has reached maximum member capacity
 */
export async function isTeamFull(teamId: string): Promise<boolean> {
  try {
    const team = await getTeamById(teamId);
    if (!team) {
      return true; // Consider non-existent team as "full"
    }

    const currentMembers = team.memberUserIds?.length || 0;
    const maxMembers = team.maxMembers || 50;

    return currentMembers >= maxMembers;
  } catch (error) {
    console.error('Error checking team capacity:', error);
    return true; // Fail safe - consider full if error
  }
}

/**
 * Get team member count
 */
export async function getTeamMemberCount(teamId: string): Promise<number> {
  try {
    const team = await getTeamById(teamId);
    if (!team) {
      return 0;
    }

    return team.memberUserIds?.length || 0;
  } catch (error) {
    console.error('Error getting team member count:', error);
    return 0;
  }
}

// ============================================================================
// MULTI-EVENT SUPPORT FUNCTIONS (NEW in v2.0)
// ============================================================================

/**
 * Subscribe to teams for specific event (real-time updates)
 * Returns teams ordered by availability (fewest members first)
 * 
 * @param tenantId - Tenant/organization ID
 * @param eventId - Event ID to filter teams
 * @param callback - Function called with updated teams array
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToEventTeams(
  tenantId: string,
  eventId: string,
  callback: (teams: Team[]) => void
): () => void {
  const db = getFirebaseFirestore();
  
  const q = query(
    collection(db, 'teams'),
    where('tenantId', '==', tenantId),
    where('eventId', '==', eventId),
    where('isActive', '==', true),
    orderBy('memberCount', 'asc') // Show teams with space first
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const teams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Team[];
    
    callback(teams);
  }, (error) => {
    console.error('Error in teams subscription:', error);
  });
  
  return unsubscribe;
}

/**
 * Check if team has space and can accept new members
 * 
 * @param teamId - Team ID to check
 * @returns Object with canJoin boolean and optional reason
 */
export async function canJoinTeam(teamId: string): Promise<{
  canJoin: boolean;
  reason?: string;
}> {
  try {
    const team = await getTeamById(teamId);
    
    if (!team) {
      return { canJoin: false, reason: 'Team not found' };
    }
    
    if (!team.isActive) {
      return { canJoin: false, reason: 'Team is inactive' };
    }
    
    const currentMembers = team.memberUserIds?.length || 0;
    const maxMembers = team.maxMembers || 50;
    
    if (currentMembers >= maxMembers) {
      return { canJoin: false, reason: 'Team is full' };
    }
    
    return { canJoin: true };
  } catch (error) {
    console.error('Error checking if can join team:', error);
    return { canJoin: false, reason: 'Error checking team capacity' };
  }
}

/**
 * Get accurate team member count from TeamMember collection
 * 
 * @param teamId - Team ID
 * @param eventId - Event ID (for scoping)
 * @returns Number of active members
 */
export async function getTeamMemberCountFromMembers(
  teamId: string,
  eventId: string
): Promise<number> {
  try {
    const db = getFirebaseFirestore();
    
    const q = query(
      collection(db, 'teamMembers'),
      where('teamId', '==', teamId),
      where('eventId', '==', eventId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting team member count:', error);
    return 0;
  }
}

/**
 * Update team's cached member count
 * Should be called after adding/removing members
 * 
 * @param teamId - Team ID
 * @param eventId - Event ID (for scoping)
 */
export async function updateTeamMemberCount(
  teamId: string,
  eventId: string
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const count = await getTeamMemberCountFromMembers(teamId, eventId);
    
    await updateDoc(doc(db, 'teams', teamId), {
      memberCount: count,
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Team ${teamId} member count updated: ${count}`);
  } catch (error) {
    console.error('Error updating team member count:', error);
    throw new Error('Failed to update team member count');
  }
}

/**
 * Get team with all member details (multi-event aware)
 * 
 * @param teamId - Team ID
 * @param eventId - Event ID (for scoping members)
 * @returns Team with members array, or null if not found
 */
export async function getTeamWithMembersByEvent(
  teamId: string,
  eventId: string
): Promise<{ team: Team; members: any[] } | null> {
  try {
    const db = getFirebaseFirestore();
    
    // Get team
    const team = await getTeamById(teamId);
    if (!team) return null;
    
    // Get members for this specific event
    const q = query(
      collection(db, 'teamMembers'),
      where('teamId', '==', teamId),
      where('eventId', '==', eventId),
      where('isActive', '==', true),
      orderBy('joinedAt', 'asc')
    );
    
    const memberSnapshot = await getDocs(q);
    const members = memberSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { team, members };
  } catch (error) {
    console.error('Error fetching team with members:', error);
    throw new Error('Failed to fetch team with members');
  }
}

/**
 * Search teams by name in specific event
 * Client-side filtering (Firestore has no full-text search)
 * 
 * @param tenantId - Tenant ID
 * @param eventId - Event ID
 * @param searchTerm - Search query
 * @returns Filtered teams array
 */
export async function searchTeams(
  tenantId: string,
  eventId: string,
  searchTerm: string
): Promise<Team[]> {
  try {
    const db = getFirebaseFirestore();
    
    const q = query(
      collection(db, 'teams'),
      where('tenantId', '==', tenantId),
      where('eventId', '==', eventId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const allTeams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Team[];
    
    // Client-side filter (case-insensitive)
    const searchLower = searchTerm.toLowerCase();
    return allTeams.filter(team => 
      team.teamName?.toLowerCase().includes(searchLower) ||
      team.teamDisplayName?.toLowerCase().includes(searchLower) ||
      team.accessCode?.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching teams:', error);
    throw new Error('Failed to search teams');
  }
}

/**
 * Get all teams for an event
 * Returns teams ordered by member count (teams with space first)
 * 
 * @param eventId - Event ID
 * @param tenantId - Tenant ID (for security)
 * @returns Array of teams with member counts
 * 
 * @example
 * const teams = await getTeamsForEvent('berlin-winter-2025', 'esn-berlin');
 * // Returns: [Team Green (8/20), Team Red (15/20), Team Blue (18/20), Team Yellow (20/20)]
 */
export async function getTeamsForEvent(
  eventId: string, 
  tenantId: string
): Promise<Team[]> {
  try {
    const db = getFirebaseFirestore();
    
    // Query teams for this event
    const q = query(
      collection(db, 'teams'),
      where('eventId', '==', eventId),
      where('tenantId', '==', tenantId)
      // Note: orderBy removed to avoid composite index requirement
      // We'll sort in memory instead
    );
    
    const snapshot = await getDocs(q);
    
    const teams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Team));
    
    // Sort teams by memberCount in memory (teams with space first)
    const sortedTeams = teams.sort((a, b) => {
      const aCount = a.memberCount || 0;
      const bCount = b.memberCount || 0;
      return aCount - bCount;
    });
    
    console.log(`✅ Found ${sortedTeams.length} teams for event ${eventId}`);
    
    return sortedTeams;
    
  } catch (error) {
    console.error('Error fetching teams for event:', error);
    throw new Error('Failed to fetch teams');
  }
}
