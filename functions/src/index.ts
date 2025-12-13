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
