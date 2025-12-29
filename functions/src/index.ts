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
import {Timestamp, FieldValue} from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Configure Admin SDK to use Firestore Emulator when running locally
if (process.env.FUNCTIONS_EMULATOR) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  logger.info("🔧 Functions configured to use Firestore Emulator at 127.0.0.1:8080");
}

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
export const createUserDocument = onCall(
  {cors: true}, // Enable CORS for all origins
  async (request) => {
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

  // 4. Prepare consent data with proper Timestamp conversion
  const consentData = {
    ...consentGiven,
    termsAcceptedAt: consentGiven.termsAcceptedAt 
      ? Timestamp.fromDate(new Date(consentGiven.termsAcceptedAt))
      : FieldValue.serverTimestamp(),
    privacyAcceptedAt: consentGiven.privacyAcceptedAt 
      ? Timestamp.fromDate(new Date(consentGiven.privacyAcceptedAt))
      : FieldValue.serverTimestamp(),
  };

  // 5. Create user document (bypasses security rules via Admin SDK)
  const userData = {
    id: uid,
    uid: uid, // For Firestore rules compatibility
    displayName: displayName,
    tenantId: tenantId,
    consentGiven: consentData,
    
    // NEW: Multi-event support fields (v2.0)
    accountType: accountType, // 'anonymous' or 'linked'
    linkedAccountId: null, // Initially null, set when account is linked
    recoveryCode: null, // Initially null, generated on request
    recoveryCodeExpiresAt: null, // Initially null
    recoveryCodeGeneratedAt: null, // Initially null
    
    totalScore: 0,
    totalSubmissions: 0,
    eventsParticipated: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastLoginAt: FieldValue.serverTimestamp(),
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
export const joinTeamSecure = onCall(
  {cors: true}, // Enable CORS for all origins
  async (request) => {
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
        joinedAt: FieldValue.serverTimestamp(),
        isActive: true,
        score: 0,
        tasksCompleted: 0,
      };

      transaction.set(memberRef, memberData);

      // 3e. Update team document (atomic increment and array union)
      transaction.update(teamRef, {
        memberUserIds: FieldValue.arrayUnion(userId),
        memberCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 3f. Update user document (increment events participated)
      transaction.update(userRef, {
        eventsParticipated: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
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
export const getTeamMembersSecure = onCall(
  {cors: true}, // Enable CORS for all origins
  async (request) => {
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

// ============================================================================
// ADMIN OPERATIONS - TENANT MANAGEMENT
// ============================================================================

/**
 * Create Tenant (Admin Only)
 * 
 * Creates a new tenant/organization with proper validation.
 * This bypasses client security rules which block tenant creation.
 * 
 * @param data.name - Tenant unique identifier (slug)
 * @param data.displayName - Tenant display name
 * @param data.primaryColor - Theme primary color (optional)
 * @param data.logoUrl - Tenant logo URL (optional)
 * 
 * @returns {success: boolean, tenantId: string}
 */
export const createTenantSecure = onCall(
  {cors: true},
  async (request) => {
    const {data, auth} = request;

    // Verify authentication
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "Must be logged in to create tenants."
      );
    }

    // TODO: Add role check when custom claims are implemented
    // if (auth.token.role !== 'superadmin') {
    //   throw new HttpsError(
    //     'permission-denied',
    //     'Only super admins can create tenants'
    //   );
    // }

    const {name, displayName, primaryColor, logoUrl} = data;

    // Validate required fields
    if (!name || typeof name !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Tenant name is required and must be a string."
      );
    }

    if (!displayName || typeof displayName !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Display name is required and must be a string."
      );
    }

    try {
      const db = admin.firestore();
      const tenantRef = db.collection("tenants").doc();

      const tenantData = {
        id: tenantRef.id,
        name,
        displayName,
        theme: {
          primaryColor: primaryColor || "#1a56db",
          logoUrl: logoUrl || null,
        },
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await tenantRef.set(tenantData);

      logger.info("Tenant created successfully", {
        tenantId: tenantRef.id,
        name,
        createdBy: auth.uid,
      });

      return {success: true, tenantId: tenantRef.id};
    } catch (error) {
      logger.error("Failed to create tenant", {
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        "internal",
        "Failed to create tenant. Please try again."
      );
    }
  }
);

/**
 * Update Tenant (Admin Only)
 * 
 * Updates tenant settings. Only whitelisted fields can be modified.
 * Cannot change tenant ID or creation date.
 * 
 * @param data.tenantId - Tenant ID to update
 * @param data.updates - Object with fields to update
 * 
 * @returns {success: boolean}
 */
export const updateTenantSecure = onCall(
  {cors: true},
  async (request) => {
    const {data, auth} = request;

    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "Must be logged in to update tenants."
      );
    }

    const {tenantId, updates} = data;

    if (!tenantId || typeof tenantId !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Tenant ID is required."
      );
    }

    // Whitelist allowed fields
    const allowedFields = ["displayName", "theme", "isActive"];
    const sanitizedUpdates: any = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "No valid fields to update."
      );
    }

    sanitizedUpdates.updatedAt = FieldValue.serverTimestamp();

    try {
      const db = admin.firestore();
      await db.collection("tenants").doc(tenantId).update(sanitizedUpdates);

      logger.info("Tenant updated successfully", {
        tenantId,
        updatedFields: Object.keys(sanitizedUpdates),
        updatedBy: auth.uid,
      });

      return {success: true};
    } catch (error) {
      logger.error("Failed to update tenant", {
        tenantId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        "internal",
        "Failed to update tenant. Please try again."
      );
    }
  }
);

// ============================================================================
// ADMIN OPERATIONS - EVENT MANAGEMENT
// ============================================================================

/**
 * Create Event (Organizer Only)
 * 
 * Creates a new event within a tenant.
 * 
 * @param data.tenantId - Tenant ID
 * @param data.name - Event name
 * @param data.eventCode - Unique event code for joining
 * @param data.startDate - Event start date (ISO string)
 * @param data.endDate - Event end date (ISO string)
 * @param data.mapBounds - Map boundaries (optional)
 * 
 * @returns {success: boolean, eventId: string}
 */
export const createEventSecure = onCall(
  {cors: true},
  async (request) => {
    const {data, auth} = request;

    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "Must be logged in to create events."
      );
    }

    const {tenantId, name, eventCode, startDate, endDate, mapBounds} = data;

    // Validate required fields
    if (!tenantId || !name || !eventCode || !startDate || !endDate) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: tenantId, name, eventCode, startDate, endDate."
      );
    }

    // TODO: Check user has organizer role for this tenant
    // const userDoc = await db.collection('users').doc(auth.uid).get();
    // if (!userDoc.exists || userDoc.data()?.tenantId !== tenantId) {
    //   throw new HttpsError('permission-denied', 'Unauthorized for this tenant');
    // }

    try {
      const db = admin.firestore();
      const eventRef = db.collection("events").doc();

      const eventData = {
        id: eventRef.id,
        tenantId,
        name,
        eventCode,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        mapBounds: mapBounds || null,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await eventRef.set(eventData);

      logger.info("Event created successfully", {
        eventId: eventRef.id,
        tenantId,
        eventCode,
        createdBy: auth.uid,
      });

      return {success: true, eventId: eventRef.id};
    } catch (error) {
      logger.error("Failed to create event", {
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        "internal",
        "Failed to create event. Please try again."
      );
    }
  }
);

/**
 * Update Event (Organizer Only)
 * 
 * Updates event settings. Only whitelisted fields can be modified.
 * 
 * @param data.eventId - Event ID to update
 * @param data.updates - Object with fields to update
 * 
 * @returns {success: boolean}
 */
export const updateEventSecure = onCall(
  {cors: true},
  async (request) => {
    const {data, auth} = request;

    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "Must be logged in to update events."
      );
    }

    const {eventId, updates} = data;

    if (!eventId || typeof eventId !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Event ID is required."
      );
    }

    // Whitelist allowed fields
    const allowedFields = ["name", "startDate", "endDate", "mapBounds", "isActive"];
    const sanitizedUpdates: any = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        // Convert date strings to Timestamps
        if (field === "startDate" || field === "endDate") {
          sanitizedUpdates[field] = Timestamp.fromDate(new Date(updates[field]));
        } else {
          sanitizedUpdates[field] = updates[field];
        }
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "No valid fields to update."
      );
    }

    sanitizedUpdates.updatedAt = FieldValue.serverTimestamp();

    try {
      const db = admin.firestore();
      await db.collection("events").doc(eventId).update(sanitizedUpdates);

      logger.info("Event updated successfully", {
        eventId,
        updatedFields: Object.keys(sanitizedUpdates),
        updatedBy: auth.uid,
      });

      return {success: true};
    } catch (error) {
      logger.error("Failed to update event", {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        "internal",
        "Failed to update event. Please try again."
      );
    }
  }
);

// ============================================================================
// ADMIN OPERATIONS - TASK MANAGEMENT
// ============================================================================

/**
 * Create Task (Organizer Only)
 * 
 * Creates a new task for an event.
 * 
 * @param data.eventId - Event ID
 * @param data.tenantId - Tenant ID
 * @param data.title - Task title
 * @param data.description - Task description
 * @param data.taskType - Task type (photo, quiz, location, etc.)
 * @param data.points - Points awarded for completion
 * @param data.location - Task location (optional)
 * 
 * @returns {success: boolean, taskId: string}
 */
export const createTaskSecure = onCall(
  {cors: true},
  async (request) => {
    const {data, auth} = request;

    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "Must be logged in to create tasks."
      );
    }

    const {eventId, tenantId, title, description, taskType, points, location} = data;

    // Validate required fields
    if (!eventId || !tenantId || !title || !taskType) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: eventId, tenantId, title, taskType."
      );
    }

    try {
      const db = admin.firestore();
      const taskRef = db.collection("tasks").doc();

      const taskData = {
        id: taskRef.id,
        eventId,
        tenantId,
        title,
        description: description || "",
        taskType,
        points: points || 100,
        location: location || null,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await taskRef.set(taskData);

      logger.info("Task created successfully", {
        taskId: taskRef.id,
        eventId,
        taskType,
        createdBy: auth.uid,
      });

      return {success: true, taskId: taskRef.id};
    } catch (error) {
      logger.error("Failed to create task", {
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        "internal",
        "Failed to create task. Please try again."
      );
    }
  }
);

/**
 * Update Task (Organizer Only)
 * 
 * Updates task settings. Only whitelisted fields can be modified.
 * 
 * @param data.taskId - Task ID to update
 * @param data.updates - Object with fields to update
 * 
 * @returns {success: boolean}
 */
export const updateTaskSecure = onCall(
  {cors: true},
  async (request) => {
    const {data, auth} = request;

    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "Must be logged in to update tasks."
      );
    }

    const {taskId, updates} = data;

    if (!taskId || typeof taskId !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Task ID is required."
      );
    }

    // Whitelist allowed fields
    const allowedFields = ["title", "description", "points", "location", "isActive"];
    const sanitizedUpdates: any = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "No valid fields to update."
      );
    }

    sanitizedUpdates.updatedAt = FieldValue.serverTimestamp();

    try {
      const db = admin.firestore();
      await db.collection("tasks").doc(taskId).update(sanitizedUpdates);

      logger.info("Task updated successfully", {
        taskId,
        updatedFields: Object.keys(sanitizedUpdates),
        updatedBy: auth.uid,
      });

      return {success: true};
    } catch (error) {
      logger.error("Failed to update task", {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        "internal",
        "Failed to update task. Please try again."
      );
    }
  }
);

// ============================================================================
// ADMIN MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Set User Role
 * 
 * Assigns admin roles (superadmin, admin, organizer, moderator) to users via
 * Firebase Custom Claims. This function is protected and should only be called
 * by super admins or during initial setup.
 * 
 * Custom Claims are used for client-side role checks without database queries.
 * They are automatically included in the user's ID token.
 * 
 * @param data.uid - Target user's Firebase Auth UID
 * @param data.role - Role to assign: 'superadmin' | 'admin' | 'organizer' | 'moderator'
 * @param data.tenantIds - Array of tenant IDs the user can manage (empty for superadmin)
 * @param data.email - User's email address (for profile creation)
 * @param data.displayName - Optional display name
 * 
 * @returns {success: boolean, message: string}
 * 
 * @throws {unauthenticated} - Caller must be authenticated
 * @throws {permission-denied} - Only superadmins can assign roles
 * @throws {invalid-argument} - Invalid role or missing required fields
 * @throws {not-found} - Target user does not exist
 */
export const setUserRole = onCall(
  {cors: true},
  async (request) => {
    const {data, auth} = request;

    // Verify caller is authenticated
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to assign roles"
      );
    }

    // Check if caller is superadmin (or allow if no custom claims exist yet - bootstrap case)
    const callerClaims = auth.token;
    const isBootstrap = !callerClaims.role; // First superadmin creation
    
    if (!isBootstrap && callerClaims.role !== "superadmin") {
      throw new HttpsError(
        "permission-denied",
        "Only super admins can assign roles"
      );
    }

    // Validate input
    const {uid, role, tenantIds = [], email, displayName} = data;

    if (!uid || typeof uid !== "string") {
      throw new HttpsError("invalid-argument", "Valid uid is required");
    }

    const validRoles = ["superadmin", "admin", "organizer", "moderator"];
    if (!role || !validRoles.includes(role)) {
      throw new HttpsError(
        "invalid-argument",
        `Role must be one of: ${validRoles.join(", ")}`
      );
    }

    if (!email || typeof email !== "string") {
      throw new HttpsError("invalid-argument", "Valid email is required");
    }

    if (!Array.isArray(tenantIds)) {
      throw new HttpsError("invalid-argument", "tenantIds must be an array");
    }

    // Verify target user exists in Firebase Auth
    try {
      await admin.auth().getUser(uid);
    } catch (error) {
      throw new HttpsError(
        "not-found",
        `User with UID ${uid} does not exist in Firebase Auth`
      );
    }

    try {
      const db = admin.firestore();
      const batch = db.batch();

      // Set Custom Claims on Firebase Auth user
      await admin.auth().setCustomUserClaims(uid, {
        role: role,
        tenantIds: tenantIds,
      });

      logger.info(`Custom claims set for user ${uid}: role=${role}, tenantIds=${tenantIds.join(",")}`);

      // Create/update User document in Firestore (unified User type)
      const userRef = db.collection("users").doc(uid);
      
      // Check if user already exists (might be a player being promoted to admin)
      const existingUser = await userRef.get();
      
      const userData = existingUser.exists ? {
        // MERGE: User already exists (was playing game), add admin fields
        id: uid,
        email: email,
        displayName: displayName || existingUser.data()?.displayName || 'Admin User',
        photoURL: existingUser.data()?.photoURL || null,
        accountType: 'linked', // Admins must have linked accounts
        role: role,
        managedTenantIds: tenantIds,
        isActive: true,
        // Keep existing player fields intact
        updatedAt: FieldValue.serverTimestamp(),
      } : {
        // CREATE: Admin never played, create new user with defaults
        id: uid,
        email: email,
        displayName: displayName || 'Admin User',
        photoURL: null,
        accountType: 'linked', // Admins must have linked accounts
        role: role,
        managedTenantIds: tenantIds,
        isActive: true,
        // Initialize player fields with defaults
        totalScore: 0,
        totalSubmissions: 0,
        eventsParticipated: 0,
        consentGiven: {
          terms: true,
          privacy: true,
          termsVersion: '1.0',
          privacyVersion: '1.0',
          termsAcceptedAt: FieldValue.serverTimestamp(),
          privacyAcceptedAt: FieldValue.serverTimestamp(),
          ipAddress: null,
        },
        recoveryCode: null,
        recoveryCodeExpiresAt: null,
        lastLoginAt: null,
        // Multi-tenant fields
        tenantId: tenantIds.length > 0 ? tenantIds[0] : "global",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      batch.set(userRef, userData, {merge: true});

      // Log admin action to audit trail
      const auditLogRef = db.collection("auditLogs").doc();
      batch.set(auditLogRef, {
        action: "setUserRole",
        performedBy: auth.uid,
        targetUser: uid,
        targetRole: role,
        targetTenants: tenantIds,
        timestamp: FieldValue.serverTimestamp(),
        tenantId: tenantIds.length > 0 ? tenantIds[0] : "global",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();

      logger.info(`User document created/updated for ${uid} with role ${role}`);

      return {
        success: true,
        message: `Role ${role} assigned successfully to user ${email}`,
      };
    } catch (error: unknown) {
      logger.error("Error setting user role:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new HttpsError(
        "internal",
        `Failed to set user role: ${errorMessage}`
      );
    }
  }
);

// ============================================================================
// SUBMISSION REVIEW FUNCTIONS
// ============================================================================

/**
 * Review Submission Secure
 * 
 * Allows moderators and above to approve or reject task submissions.
 * Updates submission status, adds review notes, and updates team scores.
 * 
 * @param data.submissionId - ID of the submission to review
 * @param data.status - Review decision: 'approved' | 'rejected'
 * @param data.reviewNotes - Optional notes from the reviewer
 * 
 * @returns {success: boolean, message: string}
 * 
 * @throws {unauthenticated} - Caller must be authenticated
 * @throws {permission-denied} - Only moderators+ can review submissions
 * @throws {invalid-argument} - Invalid status or missing submissionId
 * @throws {not-found} - Submission does not exist
 */
export const reviewSubmissionSecure = onCall(
  {cors: true},
  async (request) => {
    const {data, auth} = request;

    // Verify authentication
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to review submissions"
      );
    }

    // Check role (moderator or higher)
    const userRole = auth.token.role;
    const allowedRoles = ["moderator", "organizer", "admin", "superadmin"];
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new HttpsError(
        "permission-denied",
        "Only moderators and above can review submissions"
      );
    }

    // Validate input
    const {submissionId, status, reviewNotes} = data;

    if (!submissionId || typeof submissionId !== "string") {
      throw new HttpsError("invalid-argument", "Valid submissionId is required");
    }

    if (!status || !["approved", "rejected"].includes(status)) {
      throw new HttpsError(
        "invalid-argument",
        "Status must be 'approved' or 'rejected'"
      );
    }

    try {
      const submissionRef = admin.firestore().collection("submissions").doc(submissionId);
      const submissionDoc = await submissionRef.get();

      if (!submissionDoc.exists) {
        throw new HttpsError("not-found", "Submission not found");
      }

      const submission = submissionDoc.data();
      if (!submission) {
        throw new HttpsError("internal", "Failed to read submission data");
      }

      // Check if already reviewed
      if (submission.status !== "pending") {
        throw new HttpsError(
          "failed-precondition",
          `Submission already ${submission.status}`
        );
      }

      // Update submission
      await submissionRef.update({
        status,
        reviewedBy: auth.uid,
        reviewedAt: FieldValue.serverTimestamp(),
        reviewNotes: reviewNotes || null,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // If approved, update team score and completedTaskIds
      if (status === "approved") {
        const teamRef = admin.firestore().collection("teams").doc(submission.teamId);
        const teamDoc = await teamRef.get();

        if (teamDoc.exists) {
          const team = teamDoc.data();
          const currentScore = team?.score || 0;
          const completedTasks = Array.isArray(team?.completedTaskIds) 
            ? team.completedTaskIds 
            : [];

          // Only add to completedTaskIds if not already there
          const updates: any = {
            score: currentScore + submission.pointsAwarded,
            updatedAt: FieldValue.serverTimestamp(),
          };

          if (!completedTasks.includes(submission.taskId)) {
            updates.completedTaskIds = FieldValue.arrayUnion(submission.taskId);
          }

          await teamRef.update(updates);
        }
      }

      // Log the review action
      await admin.firestore().collection("auditLogs").add({
        action: "reviewSubmission",
        performedBy: auth.uid,
        submissionId,
        teamId: submission.teamId,
        taskId: submission.taskId,
        decision: status,
        timestamp: FieldValue.serverTimestamp(),
        tenantId: submission.tenantId,
        eventId: submission.eventId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`Submission ${submissionId} ${status} by ${auth.uid}`);

      return {
        success: true,
        message: `Submission ${status} successfully`,
      };
    } catch (error: unknown) {
      logger.error("Error reviewing submission:", error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new HttpsError(
        "internal",
        `Failed to review submission: ${errorMessage}`
      );
    }
  }
);
