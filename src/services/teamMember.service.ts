/**
 * Team Member Service
 * Manages team membership, roles, and individual contributions
 */

import {
  collection,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  increment,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase.service';
import type { TeamMember } from '../types/schema';
import { getUserById } from './user.service';

/**
 * Add user to team
 */
export async function addUserToTeam(
  teamId: string,
  userId: string,
  role: 'owner' | 'member' = 'member'
): Promise<TeamMember> {
  try {
    const db = getFirebaseFirestore();

    // 1. Check if team exists and has space
    const teamRef = doc(db, 'teams', teamId);
    const teamDoc = await getDoc(teamRef);

    if (!teamDoc.exists()) {
      throw new Error('Team not found');
    }

    const teamData = teamDoc.data();
    const currentMembers = teamData.memberUserIds || [];
    const maxMembers = teamData.maxMembers || 50;

    if (currentMembers.length >= maxMembers) {
      throw new Error(`Team is full (max ${maxMembers} members)`);
    }

    // 2. Check if user already in team
    if (currentMembers.includes(userId)) {
      throw new Error('User is already a member of this team');
    }

    // 3. Create team member record
    const memberId = `${teamId}-${userId}`;
    const memberRef = doc(db, 'teamMembers', memberId);
    const now = new Date();

    const teamMember: TeamMember = {
      id: memberId,
      teamId,
      userId,
      eventId: teamData.eventId,
      tenantId: teamData.tenantId,
      personalScore: 0,
      submissionIds: [],
      tasksCompleted: [],
      role,
      isActive: true,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // 4. Use batch write for atomicity
    const batch = writeBatch(db);

    // Add team member document
    batch.set(memberRef, {
      ...teamMember,
      joinedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update team's member list and count
    batch.update(teamRef, {
      memberUserIds: arrayUnion(userId),
      memberCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    // Update user's events participated count if first team in this event
    const userTeamsInEvent = await getUserTeamsInEvent(userId, teamData.eventId);
    if (userTeamsInEvent.length === 0) {
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        eventsParticipated: increment(1),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    console.log('✅ User added to team:', { teamId, userId, role });
    return teamMember;
  } catch (error) {
    console.error('Error adding user to team:', error);
    throw error;
  }
}

/**
 * Remove user from team
 */
export async function removeUserFromTeam(
  teamId: string,
  userId: string
): Promise<void> {
  try {
    const db = getFirebaseFirestore();

    // 1. Get team member record
    const memberId = `${teamId}-${userId}`;
    const memberRef = doc(db, 'teamMembers', memberId);
    const memberDoc = await getDoc(memberRef);

    if (!memberDoc.exists()) {
      throw new Error('Team membership not found');
    }

    const memberData = memberDoc.data();

    // 2. Check if user is the owner
    if (memberData.role === 'owner') {
      // Get team to check if there are other members
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);
      const teamData = teamDoc.data();
      const memberUserIds = teamData?.memberUserIds || [];

      if (memberUserIds.length > 1) {
        throw new Error(
          'Team owner cannot leave while there are other members. Transfer ownership first or remove all members.'
        );
      }
    }

    // 3. Use batch write
    const batch = writeBatch(db);

    // Mark member as inactive (soft delete for history)
    batch.update(memberRef, {
      isActive: false,
      leftAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Remove from team's member list
    const teamRef = doc(db, 'teams', teamId);
    batch.update(teamRef, {
      memberUserIds: arrayRemove(userId),
      memberCount: increment(-1),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    console.log('✅ User removed from team:', { teamId, userId });
  } catch (error) {
    console.error('Error removing user from team:', error);
    throw error;
  }
}

/**
 * Get all members of a team with user details
 */
export async function getTeamMembers(teamId: string): Promise<
  Array<{
    userId: string;
    displayName: string;
    email?: string;
    profilePhotoUrl?: string;
    personalScore: number;
    tasksCompleted: number;
    submissionCount: number;
    role: 'owner' | 'member';
    joinedAt: Date;
    isActive: boolean;
  }>
> {
  try {
    const db = getFirebaseFirestore();

    // 1. Get all team member records
    const membersRef = collection(db, 'teamMembers');
    const q = query(
      membersRef,
      where('teamId', '==', teamId),
      where('isActive', '==', true)
    );

    const memberSnapshots = await getDocs(q);

    if (memberSnapshots.empty) {
      return [];
    }

    // 2. Get user details for each member
    const memberPromises = memberSnapshots.docs.map(async (memberDoc) => {
      const memberData = memberDoc.data() as TeamMember;
      const user = await getUserById(memberData.userId);

      if (!user) {
        console.warn('User not found for member:', memberData.userId);
        return null;
      }

      return {
        userId: user.id,
        displayName: user.displayName,
        email: user.email,
        profilePhotoUrl: user.profilePhotoUrl,
        personalScore: memberData.personalScore,
        tasksCompleted: memberData.tasksCompleted.length,
        submissionCount: memberData.submissionIds.length,
        role: memberData.role,
        joinedAt: memberData.joinedAt,
        isActive: memberData.isActive,
      };
    });

    const members = await Promise.all(memberPromises);

    // Filter out null values and sort by score (highest first)
    return members
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => {
        // Owners first, then by score
        if (a.role === 'owner' && b.role !== 'owner') return -1;
        if (a.role !== 'owner' && b.role === 'owner') return 1;
        return b.personalScore - a.personalScore;
      });
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw new Error('Failed to fetch team members');
  }
}

/**
 * Get all teams a user is part of
 */
export async function getUserTeams(userId: string): Promise<
  Array<{
    teamId: string;
    teamName?: string;
    accessCode: string;
    eventId: string;
    personalScore: number;
    role: 'owner' | 'member';
    joinedAt: Date;
  }>
> {
  try {
    const db = getFirebaseFirestore();

    // 1. Get all team memberships
    const membersRef = collection(db, 'teamMembers');
    const q = query(
      membersRef,
      where('userId', '==', userId),
      where('isActive', '==', true)
    );

    const memberSnapshots = await getDocs(q);

    if (memberSnapshots.empty) {
      return [];
    }

    // 2. Get team details for each membership
    const teamPromises = memberSnapshots.docs.map(async (memberDoc) => {
      const memberData = memberDoc.data() as TeamMember;
      const teamRef = doc(db, 'teams', memberData.teamId);
      const teamDoc = await getDoc(teamRef);

      if (!teamDoc.exists()) {
        console.warn('Team not found:', memberData.teamId);
        return null;
      }

      const teamData = teamDoc.data();

      return {
        teamId: memberData.teamId,
        teamName: teamData.teamName || teamData.teamDisplayName,
        accessCode: teamData.accessCode,
        eventId: memberData.eventId,
        tenantId: teamData.tenantId, // Add tenantId
        personalScore: memberData.personalScore,
        role: memberData.role,
        joinedAt: memberData.joinedAt,
      };
    });

    const teams = await Promise.all(teamPromises);

    // Filter out null values
    return teams.filter((t): t is NonNullable<typeof t> => t !== null);
  } catch (error) {
    console.error('Error fetching user teams:', error);
    throw new Error('Failed to fetch user teams');
  }
}

/**
 * Get user teams in a specific event
 */
export async function getUserTeamsInEvent(
  userId: string,
  eventId: string
): Promise<TeamMember[]> {
  try {
    const db = getFirebaseFirestore();

    const membersRef = collection(db, 'teamMembers');
    const q = query(
      membersRef,
      where('userId', '==', userId),
      where('eventId', '==', eventId),
      where('isActive', '==', true),
      limit(100) // Required by security rules for list queries
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as TeamMember)
    );
  } catch (error) {
    console.error('Error fetching user teams in event:', error);
    return [];
  }
}

/**
 * Get team membership for a specific user and team
 */
export async function getTeamMembership(
  teamId: string,
  userId: string
): Promise<TeamMember | null> {
  try {
    const db = getFirebaseFirestore();
    const memberId = `${teamId}-${userId}`;
    const memberRef = doc(db, 'teamMembers', memberId);
    const memberDoc = await getDoc(memberRef);

    if (!memberDoc.exists()) {
      return null;
    }

    return {
      id: memberDoc.id,
      ...memberDoc.data(),
    } as TeamMember;
  } catch (error) {
    console.error('Error fetching team membership:', error);
    throw new Error('Failed to fetch team membership');
  }
}

/**
 * Update member statistics when they complete a task
 */
export async function updateMemberStats(
  teamId: string,
  userId: string,
  updates: {
    scoreIncrement?: number;
    submissionId?: string;
    taskId?: string;
  }
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const memberId = `${teamId}-${userId}`;
    const memberRef = doc(db, 'teamMembers', memberId);

    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (updates.scoreIncrement !== undefined) {
      updateData.personalScore = increment(updates.scoreIncrement);
    }

    if (updates.submissionId) {
      updateData.submissionIds = arrayUnion(updates.submissionId);
    }

    if (updates.taskId) {
      updateData.tasksCompleted = arrayUnion(updates.taskId);
    }

    await updateDoc(memberRef, updateData);

    console.log('✅ Member stats updated:', { teamId, userId, updates });
  } catch (error) {
    console.error('Error updating member stats:', error);
    throw new Error('Failed to update member stats');
  }
}

/**
 * Get member contribution statistics
 */
export async function getMemberStats(
  teamId: string,
  userId: string
): Promise<{
  personalScore: number;
  tasksCompleted: number;
  submissionCount: number;
  role: 'owner' | 'member';
} | null> {
  try {
    const membership = await getTeamMembership(teamId, userId);

    if (!membership || !membership.isActive) {
      return null;
    }

    return {
      personalScore: membership.personalScore,
      tasksCompleted: membership.tasksCompleted.length,
      submissionCount: membership.submissionIds.length,
      role: membership.role,
    };
  } catch (error) {
    console.error('Error fetching member stats:', error);
    throw new Error('Failed to fetch member stats');
  }
}

/**
 * Transfer team ownership to another member
 */
export async function transferOwnership(
  teamId: string,
  currentOwnerId: string,
  newOwnerId: string
): Promise<void> {
  try {
    const db = getFirebaseFirestore();

    // 1. Verify both users are team members
    const currentOwnerMembership = await getTeamMembership(teamId, currentOwnerId);
    const newOwnerMembership = await getTeamMembership(teamId, newOwnerId);

    if (!currentOwnerMembership || currentOwnerMembership.role !== 'owner') {
      throw new Error('Current user is not the team owner');
    }

    if (!newOwnerMembership || !newOwnerMembership.isActive) {
      throw new Error('New owner is not an active member of this team');
    }

    // 2. Use batch write
    const batch = writeBatch(db);

    // Update current owner to member
    const currentOwnerRef = doc(db, 'teamMembers', `${teamId}-${currentOwnerId}`);
    batch.update(currentOwnerRef, {
      role: 'member',
      updatedAt: serverTimestamp(),
    });

    // Update new owner
    const newOwnerRef = doc(db, 'teamMembers', `${teamId}-${newOwnerId}`);
    batch.update(newOwnerRef, {
      role: 'owner',
      updatedAt: serverTimestamp(),
    });

    // Update team's ownerUserId
    const teamRef = doc(db, 'teams', teamId);
    batch.update(teamRef, {
      ownerUserId: newOwnerId,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    console.log('✅ Ownership transferred:', {
      teamId,
      from: currentOwnerId,
      to: newOwnerId,
    });
  } catch (error) {
    console.error('Error transferring ownership:', error);
    throw error;
  }
}

/**
 * Check if user is team owner
 */
export async function isTeamOwner(
  teamId: string,
  userId: string
): Promise<boolean> {
  try {
    const membership = await getTeamMembership(teamId, userId);
    return membership !== null && membership.role === 'owner' && membership.isActive;
  } catch (error) {
    console.error('Error checking team ownership:', error);
    return false;
  }
}

/**
 * Check if user is team member
 */
export async function isTeamMember(
  teamId: string,
  userId: string
): Promise<boolean> {
  try {
    const membership = await getTeamMembership(teamId, userId);
    return membership !== null && membership.isActive;
  } catch (error) {
    console.error('Error checking team membership:', error);
    return false;
  }
}

// ============================================================================
// MULTI-EVENT SUPPORT FUNCTIONS (NEW in v2.0)
// ============================================================================

/**
 * Join team (creates TeamMember record)
 * Validates event uniqueness (user can only be in one team per event)
 * 
 * @param params - Join parameters
 * @returns Created TeamMember record
 * @throws Error if user already in event or team is full
 */
export async function joinTeam(params: {
  userId: string;
  teamId: string;
  eventId: string;
  tenantId: string;
  role: 'owner' | 'member';
}): Promise<TeamMember> {
  const db = getFirebaseFirestore();
  const { userId, teamId, eventId, tenantId, role } = params;
  
  try {
    // Check if user already in this event
    const existing = await getUserParticipationInEvent(userId, eventId);
    if (existing) {
      throw new Error(
        `You are already in a team for this event (Team: ${existing.teamId}). ` +
        `You can only join one team per event.`
      );
    }
    
    // Check if team has space
    const teamRef = doc(db, 'teams', teamId);
    const teamDoc = await getDoc(teamRef);
    
    if (!teamDoc.exists()) {
      throw new Error('Team not found');
    }
    
    const teamData = teamDoc.data();
    const currentMembers = teamData.memberUserIds?.length || 0;
    const maxMembers = teamData.maxMembers || 50;
    
    if (currentMembers >= maxMembers) {
      throw new Error('Team is full');
    }
    
    // Get user display name
    const userDoc = await getDoc(doc(db, 'users', userId));
    const displayName = userDoc.exists() ? userDoc.data().displayName : 'Unknown';
    
    // Create TeamMember record
    const memberId = `${teamId}-${userId}`;
    const memberData: TeamMember = {
      id: memberId,
      userId,
      teamId,
      eventId,
      tenantId,
      displayName, // Denormalized for search
      personalScore: 0,
      submissionIds: [],
      tasksCompleted: [],
      role,
      isActive: true,
      joinedAt: new Date(),
      lastActiveAt: new Date(), // NEW: Set initial activity
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Use batch write for atomicity
    const batch = writeBatch(db);
    
    // Add TeamMember document
    batch.set(doc(db, 'teamMembers', memberId), {
      ...memberData,
      joinedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(), // NEW: Set initial activity
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update team memberUserIds array
    batch.update(teamRef, {
      memberUserIds: arrayUnion(userId),
      memberCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    
    // Update user stats
    batch.update(doc(db, 'users', userId), {
      eventsParticipated: increment(1),
      updatedAt: serverTimestamp(),
    });
    
    await batch.commit();
    
    console.log(`✅ User ${userId} joined team ${teamId} in event ${eventId}`);
    return memberData;
  } catch (error) {
    console.error('Error joining team:', error);
    throw error;
  }
}

/**
 * Leave team (soft delete TeamMember record)
 * 
 * @param params - Leave parameters
 */
export async function leaveTeam(params: {
  userId: string;
  teamId: string;
  eventId: string;
}): Promise<void> {
  const db = getFirebaseFirestore();
  const { userId, teamId, eventId } = params;
  
  try {
    // Find TeamMember record
    const membersRef = collection(db, 'teamMembers');
    const q = query(
      membersRef,
      where('userId', '==', userId),
      where('teamId', '==', teamId),
      where('eventId', '==', eventId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error('Membership not found');
    }
    
    const memberDoc = snapshot.docs[0];
    
    // Use batch write
    const batch = writeBatch(db);
    
    // Soft delete (set isActive = false)
    batch.update(memberDoc.ref, {
      isActive: false,
      leftAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update team memberUserIds array
    const team = await getDoc(doc(db, 'teams', teamId));
    const teamData = team.data();
    const updatedMemberIds = (teamData?.memberUserIds || []).filter(
      (id: string) => id !== userId
    );
    
    batch.update(doc(db, 'teams', teamId), {
      memberUserIds: updatedMemberIds,
      memberCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
    
    await batch.commit();
    
    console.log(`✅ User ${userId} left team ${teamId}`);
  } catch (error) {
    console.error('Error leaving team:', error);
    throw error;
  }
}

/**
 * Get user's participation in specific event
 * Returns null if user is not in event
 * 
 * @param userId - User's Firebase UID
 * @param eventId - Event ID to check
 * @returns TeamMember record or null
 */
export async function getUserParticipationInEvent(
  userId: string,
  eventId: string
): Promise<TeamMember | null> {
  try {
    const db = getFirebaseFirestore();
    
    const q = query(
      collection(db, 'teamMembers'),
      where('userId', '==', userId),
      where('eventId', '==', eventId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as TeamMember;
  } catch (error) {
    console.error('Error fetching user participation:', error);
    return null;
  }
}

/**
 * Get all team members for event (with user details)
 * 
 * @param eventId - Event ID
 * @returns Array of TeamMembers with user data
 */
export async function getEventMembers(eventId: string): Promise<any[]> {
  try {
    const db = getFirebaseFirestore();
    
    const q = query(
      collection(db, 'teamMembers'),
      where('eventId', '==', eventId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Fetch user details for each member
    const membersWithUsers = await Promise.all(
      members.map(async (member: any) => {
        const userDoc = await getDoc(doc(db, 'users', member.userId));
        const user = userDoc.exists() ? userDoc.data() : null;
        
        return {
          ...member,
          user: user || { displayName: 'Unknown User' }
        };
      })
    );
    
    return membersWithUsers;
  } catch (error) {
    console.error('Error fetching event members:', error);
    throw new Error('Failed to fetch event members');
  }
}

/**
 * Search members by name in event (prefix search)
 * 
 * @param eventId - Event ID
 * @param searchTerm - Search query (name prefix)
 * @returns Filtered TeamMembers
 */
export async function searchMembersInEvent(
  eventId: string,
  searchTerm: string
): Promise<TeamMember[]> {
  try {
    const db = getFirebaseFirestore();
    
    const q = query(
      collection(db, 'teamMembers'),
      where('eventId', '==', eventId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const allMembers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TeamMember[];
    
    // Client-side filter (case-insensitive)
    const searchLower = searchTerm.toLowerCase();
    return allMembers.filter(member => 
      member.displayName?.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching members:', error);
    throw new Error('Failed to search members');
  }
}

/**
 * Update member personal score
 * 
 * @param memberId - TeamMember ID
 * @param scoreIncrement - Points to add
 */
export async function updateMemberScore(
  memberId: string,
  scoreIncrement: number
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    
    await updateDoc(doc(db, 'teamMembers', memberId), {
      personalScore: increment(scoreIncrement),
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Member ${memberId} score updated (+${scoreIncrement})`);
  } catch (error) {
    console.error('Error updating member score:', error);
    throw new Error('Failed to update member score');
  }
}

/**
 * Get team members for specific event
 * 
 * @param teamId - Team ID
 * @param eventId - Event ID
 * @returns Array of TeamMembers sorted by score
 */
export async function getTeamMembersByEvent(
  teamId: string,
  eventId: string
): Promise<TeamMember[]> {
  try {
    const db = getFirebaseFirestore();
    
    const q = query(
      collection(db, 'teamMembers'),
      where('teamId', '==', teamId),
      where('eventId', '==', eventId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TeamMember[];
    
    // Sort by personal score (descending)
    return members.sort((a, b) => b.personalScore - a.personalScore);
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw new Error('Failed to fetch team members');
  }
}

/**
 * Update last active timestamp for a team member
 * Call this whenever user performs an action (login, complete task, etc.)
 * 
 * @param teamId - Team ID
 * @param userId - User ID
 */
export async function updateLastActive(
  teamId: string,
  userId: string
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const memberId = `${teamId}-${userId}`;
    const memberRef = doc(db, 'teamMembers', memberId);

    await updateDoc(memberRef, {
      lastActiveAt: serverTimestamp(),
    });

    console.log(`📍 Updated lastActiveAt for user ${userId} in team ${teamId}`);
  } catch (error) {
    console.error('Error updating last active:', error);
    // Don't throw - this is non-critical tracking
    // We don't want to break the user's flow if this fails
  }
}
