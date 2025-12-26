/**
 * Urban Rally Cloud Functions
 * 
 * This module contains server-side functions that bypass client-side
 * security rules by using Firebase Admin SDK.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set global options for cost control
setGlobalOptions({
  maxInstances: 10,
  region: "europe-west3", // Same region as Firestore database
});

// ============================================================================
// USER MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Create User Document
 * 
 * This function creates a user document in Firestore using Admin SDK,
 * bypassing client-side security rules that cause permission errors.
 * 
 * Called after anonymous authentication to create the user profile.
 * 
 * @param data - User creation data
 * @param data.displayName - User's display name (required, 2-50 chars)
 * @param data.email - User's email (optional)
 * @param data.tenantId - Organization/tenant ID (required)
 * @param data.consentGiven - GDPR consent object (required)
 * @param data.accountType - Account type: 'anonymous' or 'linked' (optional, defaults to 'anonymous')
 * 
 * @returns {success: boolean, userId: string}
 * 
 * @throws {unauthenticated} - Caller must be authenticated
 * @throws {invalid-argument} - Invalid input data
 * @throws {already-exists} - User document already exists
 */
export const createUserDocument = onCall(async (request) => {
  const {data, auth} = request;

  // 1. Verify caller is authenticated
  if (!auth) {
    logger.warn("Unauthenticated user creation attempt");
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to create a user profile."
    );
  }

  const uid = auth.uid;
  logger.info("User creation request", {uid, hasEmail: !!data.email});

  // 2. Validate input data
  const {
    displayName,
    email,
    tenantId,
    consentGiven,
    accountType = "anonymous", // NEW: Default to 'anonymous'
  } = data;

  if (!displayName || typeof displayName !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Display name is required and must be a string."
    );
  }

  if (displayName.length < 2 || displayName.length > 50) {
    throw new HttpsError(
      "invalid-argument",
      "Display name must be between 2 and 50 characters."
    );
  }

  if (email && typeof email !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Email must be a string if provided."
    );
  }

  if (!tenantId || typeof tenantId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Tenant ID is required."
    );
  }

  if (!consentGiven || typeof consentGiven !== "object") {
    throw new HttpsError(
      "invalid-argument",
      "Consent data is required."
    );
  }

  // NEW: Validate accountType if provided
  if (accountType && !["anonymous", "linked"].includes(accountType)) {
    throw new HttpsError(
      "invalid-argument",
      "Account type must be 'anonymous' or 'linked'."
    );
  }

  // 3. Check if user document already exists
  const db = admin.firestore();
  const userRef = db.collection("users").doc(uid);
  const existingUser = await userRef.get();

  if (existingUser.exists) {
    logger.warn("User document already exists", {uid});
    throw new HttpsError(
      "already-exists",
      "User profile already exists."
    );
  }

  // 4. Create user document (bypasses security rules via Admin SDK)
  const userData = {
    id: uid,
    uid: uid, // For Firestore rules compatibility
    displayName: displayName,
    tenantId: tenantId,
    consentGiven: consentGiven,
    
    // NEW: Multi-event support fields (v2.0)
    accountType: accountType, // 'anonymous' or 'linked'
    linkedAccountId: null, // Initially null, set when account is linked
    recoveryCode: null, // Initially null, generated on request
    recoveryCodeExpiresAt: null, // Initially null
    recoveryCodeGeneratedAt: null, // Initially null
    
    totalScore: 0,
    totalSubmissions: 0,
    eventsParticipated: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Only add email if provided (Firestore rejects null values)
  if (email && email.trim() !== "") {
    Object.assign(userData, {email: email.trim()});
  }

  try {
    await userRef.set(userData);

    logger.info("User document created successfully", {
      uid,
      displayName,
      tenantId,
      accountType, // NEW: Log account type
      hasEmail: !!email,
    });

    return {
      success: true,
      userId: uid,
      user: userData,
    };
  } catch (error) {
    logger.error("Failed to create user document", {
      uid,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      "internal",
      "Failed to create user profile. Please try again."
    );
  }
});

// ============================================================================
// TEAM MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Join Team Secure
 * 
 * Server-side team join function with atomic transactions, capacity validation,
 * and security checks. Prevents race conditions and unauthorized access.
 * 
 * @param data - Team join data
 * @param data.teamId - Team ID to join (required)
 * @param data.eventId - Event ID (required)
 * @param data.tenantId - Tenant ID (required)
 * @param data.role - User role: 'owner' or 'member' (optional, defaults to 'member')
 * 
 * @returns {success: boolean, memberId: string}
 * 
 * @throws {unauthenticated} - Caller must be authenticated
 * @throws {invalid-argument} - Invalid input data
 * @throws {not-found} - Team or user not found
 * @throws {resource-exhausted} - Team is full
 * @throws {already-exists} - User already in a team for this event
 * @throws {failed-precondition} - Team is inactive or deleted
 */
export const joinTeamSecure = onCall(async (request) => {
  const {data, auth} = request;

  // 1. Verify caller is authenticated
  if (!auth) {
    logger.warn("Unauthenticated team join attempt");
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to join a team."
    );
  }

  const userId = auth.uid;
  logger.info("Team join request", {userId, teamId: data.teamId, eventId: data.eventId});

  // 2. Validate input data
  const {teamId, eventId, tenantId, role = "member"} = data;

  if (!teamId || typeof teamId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Team ID is required and must be a string."
    );
  }

  if (!eventId || typeof eventId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Event ID is required and must be a string."
    );
  }

  if (!tenantId || typeof tenantId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Tenant ID is required and must be a string."
    );
  }

  if (role && !["owner", "member"].includes(role)) {
    throw new HttpsError(
      "invalid-argument",
      "Role must be 'owner' or 'member'."
    );
  }

  // 3. Use atomic transaction to prevent race conditions
  const db = admin.firestore();
  const teamRef = db.collection("teams").doc(teamId);
  const userRef = db.collection("users").doc(userId);
  const memberId = `${teamId}-${userId}`;
  const memberRef = db.collection("teamMembers").doc(memberId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      // 3a. Check if user already in a team for this event
      const existingMemberships = await transaction.get(
        db.collection("teamMembers")
          .where("userId", "==", userId)
          .where("eventId", "==", eventId)
          .where("isActive", "==", true)
      );

      if (!existingMemberships.empty) {
        logger.warn("User already in team for event", {userId, eventId});
        throw new HttpsError(
          "already-exists",
          "You are already in a team for this event. Leave your current team first."
        );
      }

      // 3b. Get team document and validate
      const teamDoc = await transaction.get(teamRef);
      
      if (!teamDoc.exists) {
        logger.warn("Team not found", {teamId});
        throw new HttpsError(
          "not-found",
          "Team not found."
        );
      }

      const teamData = teamDoc.data()!;

      // Validate team is active
      if (!teamData.isActive || teamData.isDeleted) {
        logger.warn("Team is inactive or deleted", {teamId});
        throw new HttpsError(
          "failed-precondition",
          "This team is no longer active."
        );
      }

      // Validate team belongs to correct event
      if (teamData.eventId !== eventId) {
        logger.warn("Team event mismatch", {teamId, eventId, teamEventId: teamData.eventId});
        throw new HttpsError(
          "invalid-argument",
          "Team does not belong to this event."
        );
      }

      // Check capacity
      const currentMemberCount = teamData.memberCount || 0;
      const maxMembers = teamData.maxMembers || 4;

      if (currentMemberCount >= maxMembers) {
        logger.warn("Team is full", {teamId, currentMemberCount, maxMembers});
        throw new HttpsError(
          "resource-exhausted",
          `Team is full (${currentMemberCount}/${maxMembers} members).`
        );
      }

      // 3c. Get user document for displayName
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        logger.warn("User not found", {userId});
        throw new HttpsError(
          "not-found",
          "User profile not found. Please create your profile first."
        );
      }

      const userData = userDoc.data()!;

      // 3d. Create team member document
      const memberData = {
        id: memberId,
        teamId: teamId,
        userId: userId,
        eventId: eventId,
        tenantId: tenantId,
        role: role,
        displayName: userData.displayName,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        score: 0,
        tasksCompleted: 0,
      };

      transaction.set(memberRef, memberData);

      // 3e. Update team document (atomic increment and array union)
      transaction.update(teamRef, {
        memberUserIds: admin.firestore.FieldValue.arrayUnion(userId),
        memberCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3f. Update user document (increment events participated)
      transaction.update(userRef, {
        eventsParticipated: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {memberId, teamName: teamData.name};
    });

    logger.info("Team join successful", {
      userId,
      teamId,
      eventId,
      memberId: result.memberId,
    });

    return {
      success: true,
      memberId: result.memberId,
      teamName: result.teamName,
    };
  } catch (error) {
    // Re-throw HttpsError (already logged above)
    if (error instanceof HttpsError) {
      throw error;
    }

    // Log and wrap unexpected errors
    logger.error("Team join failed", {
      userId,
      teamId,
      eventId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      "internal",
      "Failed to join team. Please try again."
    );
  }
});

// ============================================================================
// TEAM MEMBER FUNCTIONS
// ============================================================================

/**
 * Get Team Members Securely
 * 
 * Fetches all active members of a team with their user details.
 * Uses Admin SDK to bypass client-side security rules.
 * 
 * @param data - Request data
 * @param data.teamId - Team ID to fetch members for
 * 
 * @returns Array of team members with user details
 * 
 * @throws {unauthenticated} - Caller must be authenticated
 * @throws {invalid-argument} - Invalid team ID
 * @throws {not-found} - Team not found
 */
export const getTeamMembersSecure = onCall(async (request) => {
  const {data, auth} = request;
  const db = admin.firestore();

  // 1. Verify caller is authenticated
  if (!auth || !auth.uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to view team members."
    );
  }

  const userId = auth.uid;
  const {teamId} = data;

  // 2. Validate input
  if (!teamId || typeof teamId !== "string") {
    throw new HttpsError("invalid-argument", "Valid team ID is required");
  }

  logger.info("Fetching team members", {userId, teamId});

  try {
    // 3. Verify team exists
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) {
      throw new HttpsError("not-found", "Team not found");
    }

    // 4. Get all active team members
    const membersSnapshot = await db
      .collection("teamMembers")
      .where("teamId", "==", teamId)
      .where("isActive", "==", true)
      .get();

    if (membersSnapshot.empty) {
      logger.info("No members found for team", {teamId});
      return {members: []};
    }

    // 5. Fetch user details for each member
    const memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
      const memberData = memberDoc.data();
      const userDoc = await db.collection("users").doc(memberData.userId).get();

      if (!userDoc.exists) {
        logger.warn("User not found for member", {
          memberId: memberDoc.id,
          userId: memberData.userId,
        });
        return null;
      }

      const userData = userDoc.data()!;

      return {
        userId: memberData.userId,
        displayName: userData.displayName || "Unknown",
        email: userData.email || null,
        profilePhotoUrl: userData.profilePhotoUrl || null,
        personalScore: memberData.personalScore || 0,
        tasksCompleted: memberData.tasksCompleted?.length || 0,
        submissionCount: memberData.submissionIds?.length || 0,
        role: memberData.role || "member",
        joinedAt: memberData.joinedAt?.toDate() || new Date(),
        isActive: memberData.isActive,
      };
    });

    const members = await Promise.all(memberPromises);

    // Filter out null values (users not found)
    const validMembers = members.filter(
      (m): m is NonNullable<typeof m> => m !== null
    );

    // Sort by role (owner first) and then by score
    validMembers.sort((a, b) => {
      if (a.role === "owner" && b.role !== "owner") return -1;
      if (a.role !== "owner" && b.role === "owner") return 1;
      return b.personalScore - a.personalScore;
    });

    logger.info("Team members fetched successfully", {
      teamId,
      memberCount: validMembers.length,
    });

    return {members: validMembers};
  } catch (error) {
    // Re-throw HttpsError
    if (error instanceof HttpsError) {
      throw error;
    }

    // Log and wrap unexpected errors
    logger.error("Failed to fetch team members", {
      userId,
      teamId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      "internal",
      "Failed to fetch team members. Please try again."
    );
  }
});
