/**
 * inviteUserToTenant Cloud Function
 * 
 * Creates a magic link invitation for a user to join a tenant with a specific role.
 * Stores invitation in User.pendingInvitations[token] map.
 * 
 * Flow:
 * 1. Admin enters email + role + expiration
 * 2. Function generates secure token
 * 3. Creates/updates User document with pendingInvitations
 * 4. Returns magic link for admin to share
 * 5. (Optional) Sends email notification
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

const db = admin.firestore();

interface InviteUserRequest {
  email: string;
  tenantId: string;
  role: 'admin' | 'organizer' | 'moderator';
  expiresIn?: '24h' | '48h' | '1week' | '1month' | 'never';
  sendEmail?: boolean;
}

export interface InviteUserResponse {
  success: boolean;
  inviteLink: string;
  inviteToken: string;
  expiresAt: Date;
  userExists: boolean;
}

export const inviteUserToTenant = onCall<InviteUserRequest>(
  {cors: true, region: "europe-west3"},
  async (request) => {
    // 1. Validate authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in to invite users");
    }

    // 2. Validate input
    const {email, tenantId, role, expiresIn, sendEmail} = request.data;
    
    if (!email || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "Valid email is required");
    }
    if (!tenantId) {
      throw new HttpsError("invalid-argument", "tenantId is required");
    }
    if (!role || !["admin", "organizer", "moderator"].includes(role)) {
      throw new HttpsError("invalid-argument", "role must be admin, organizer, or moderator");
    }

    const inviterId = request.auth.uid;
    const inviterClaims = request.auth.token;

    // 3. Check permissions
    const isSuperadmin = inviterClaims.sa === true;
    const isAdminInTenant = inviterClaims.tr?.[tenantId] === "admin";

    if (!isSuperadmin && !isAdminInTenant) {
      throw new HttpsError(
        "permission-denied",
        "Only superadmins or tenant admins can invite users"
      );
    }

    try {
      // 4. Get tenant details
      const tenantRef = db.collection("tenants").doc(tenantId);
      const tenantDoc = await tenantRef.get();

      if (!tenantDoc.exists) {
        throw new HttpsError("not-found", `Tenant ${tenantId} not found`);
      }

      const tenantData = tenantDoc.data()!;

      // 5. Get inviter details
      const inviterRef = db.collection("users").doc(inviterId);
      const inviterDoc = await inviterRef.get();
      const inviterData = inviterDoc.exists ? inviterDoc.data()! : null;

      // 6. Generate secure invitation token (32 bytes = 64 hex chars)
      const inviteToken = crypto.randomBytes(32).toString("hex");

      // 7. Calculate expiration dates
      const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const roleExpiresAt = calculateExpiration(expiresIn || "never");

      // 8. Find or create user by email
      let userId: string | null = null;
      let userExists = false;

      // Query for existing user by email
      const usersQuery = await db.collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (!usersQuery.empty) {
        // Existing user
        userId = usersQuery.docs[0].id;
        userExists = true;
      } else {
        // New user - create placeholder document
        const newUserRef = db.collection("users").doc();
        userId = newUserRef.id;
        userExists = false;

        await newUserRef.set({
          id: userId,
          email: email,
          displayName: email.split("@")[0], // Temporary display name
          accountType: "linked",
          role: "player",
          tenantId: tenantId, // Home tenant
          totalScore: 0,
          totalSubmissions: 0,
          eventsParticipated: 0,
          consentGiven: {
            terms: false,
            privacy: false,
            termsVersion: "1.0",
            privacyVersion: "1.0",
            termsAcceptedAt: FieldValue.serverTimestamp(),
            privacyAcceptedAt: FieldValue.serverTimestamp(),
          },
          isActive: false, // Not active until invitation accepted
          pendingInvitations: {},
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // 9. Add invitation to user document
      const userRef = db.collection("users").doc(userId);
      await userRef.update({
        [`pendingInvitations.${inviteToken}`]: {
          tenantId: tenantId,
          tenantName: tenantData.name || "Unknown Tenant",
          role: role,
          invitedBy: inviterId,
          invitedByName: inviterData?.displayName || "Unknown",
          invitedAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(inviteExpiresAt),
          roleExpiresAt: roleExpiresAt ? Timestamp.fromDate(roleExpiresAt) : null,
          status: "pending",
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 10. Create audit log
      await db.collection("roleAssignments").add({
        assignerId: inviterId,
        assignerEmail: inviterData?.email || inviterClaims.email || "unknown",
        targetUserId: userId,
        targetUserEmail: email,
        action: "invite_sent",
        roleBefore: null,
        roleAfter: role,
        tenantId: tenantId,
        timestamp: FieldValue.serverTimestamp(),
        reason: `Invitation sent (expires: ${inviteExpiresAt.toISOString()})`,
        ipAddress: request.rawRequest?.ip,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 11. Generate magic link
      const baseUrl = process.env.FUNCTIONS_EMULATOR 
        ? "http://localhost:5173"
        : "https://urbanrally.app";
      const inviteLink = `${baseUrl}/invite/accept?token=${inviteToken}`;

      // 12. (Optional) Send email notification
      if (sendEmail) {
        // TODO: Integrate with SendGrid or Firebase Email Extension
        console.log(`Email would be sent to ${email} with link: ${inviteLink}`);
      }

      // 13. Return success
      return {
        success: true,
        inviteLink: inviteLink,
        inviteToken: inviteToken,
        expiresAt: inviteExpiresAt,
        userExists: userExists,
      };
    } catch (error: any) {
      console.error("Error in inviteUserToTenant:", error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError("internal", `Failed to create invitation: ${error.message}`);
    }
  }
);

/**
 * Calculate expiration date based on duration string
 */
function calculateExpiration(expiresIn: string): Date | null {
  const now = new Date();
  
  switch (expiresIn) {
    case "24h":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "48h":
      return new Date(now.getTime() + 48 * 60 * 60 * 1000);
    case "1week":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "1month":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case "never":
      return null;
    default:
      return null;
  }
}
