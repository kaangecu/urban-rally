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

/**
 * Get User Document
 * 
 * This function retrieves a user document from Firestore using Admin SDK,
 * avoiding client-side replication delays and permission issues.
 * 
 * The function implements retry logic to handle the scenario where a user
 * document was just created by createUserDocument but hasn't replicated yet.
 * 
 * @param data - User retrieval data
 * @param data.userId - User ID to fetch (optional, defaults to authenticated user)
 * 
 * @returns {success: boolean, user: object}
 * 
 * @throws {unauthenticated} - Caller must be authenticated
 * @throws {not-found} - User document not found
 * @throws {permission-denied} - User can only fetch their own document
 */
export const getUser = onCall(async (request) => {
  const {data, auth} = request;

  // 1. Verify caller is authenticated
  if (!auth) {
    logger.warn("Unauthenticated getUser attempt");
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to get user data."
    );
  }

  const requestedUserId = data.userId || auth.uid;

  // 2. Security: Users can only fetch their own document
  if (requestedUserId !== auth.uid) {
    logger.warn("User attempted to fetch another user's document", {
      requesterId: auth.uid,
      requestedUserId,
    });
    throw new HttpsError(
      "permission-denied",
      "You can only fetch your own user document."
    );
  }

  logger.info("Get user request", {userId: requestedUserId});

  // 3. Fetch user document with retry logic (for replication delay)
  const db = admin.firestore();
  const userRef = db.collection("users").doc(requestedUserId);
  
  const maxAttempts = 3;
  const delayMs = 300; // 300ms between attempts
  let attempts = 0;

  try {
    while (attempts < maxAttempts) {
      attempts++;
      logger.info(`Fetching user document, attempt ${attempts}/${maxAttempts}`, {userId: requestedUserId});

      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data()!;
        
        logger.info("User document fetched successfully", {
          userId: requestedUserId,
          attempts,
        });

        return {
          success: true,
          user: {
            id: userDoc.id,
            ...userData,
          },
        };
      }

      // If not found and more attempts remaining, wait before retry
      if (attempts < maxAttempts) {
        logger.info(`User document not found, retrying in ${delayMs}ms...`, {userId: requestedUserId});
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // User not found after all retries
    logger.warn("User document not found after retries", {
      userId: requestedUserId,
      attempts,
    });

    throw new HttpsError(
      "not-found",
      "User profile not found. Please try again or contact support."
    );
  } catch (error) {
    // Re-throw HttpsError
    if (error instanceof HttpsError) {
      throw error;
    }

    // Log and wrap unexpected errors
    logger.error("Failed to fetch user document", {
      userId: requestedUserId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      "internal",
      "Failed to fetch user profile. Please try again."
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
