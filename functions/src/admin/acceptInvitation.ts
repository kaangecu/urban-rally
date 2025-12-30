/**
 * acceptInvitation Cloud Function
 * 
 * Accepts a pending invitation and moves it from pendingInvitations to tenantRoles.
 * Creates Firebase Auth account if user doesn't have one.
 * Returns custom token for auto-login.
 * 
 * Flow:
 * 1. User clicks magic link with token
 * 2. Function finds user by pendingInvitations[token]
 * 3. Validates invitation not expired
 * 4. Moves invitation to tenantRoles
 * 5. Creates/links Firebase Auth account
 * 6. Updates Custom Claims
 * 7. Returns custom token for auto-login
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

interface AcceptInvitationRequest {
  token: string;
  displayName?: string; // For new users
}

export interface AcceptInvitationResponse {
  success: boolean;
  customToken: string;
  userId: string;
  tenantId: string;
  role: string;
  tenantName: string;
}

export const acceptInvitation = onCall<AcceptInvitationRequest>(
  {cors: true},
  async (request) => {
    // Note: No auth required - this is for new users who don't have accounts yet

    // 1. Validate input
    const {token, displayName} = request.data;
    
    if (!token || token.length !== 64) { // 32 bytes = 64 hex chars
      throw new HttpsError("invalid-argument", "Invalid invitation token");
    }

    try {
      // 2. Find user by pendingInvitations[token]
      const usersQuery = await db.collection("users")
        .where(`pendingInvitations.${token}.status`, "==", "pending")
        .limit(1)
        .get();

      if (usersQuery.empty) {
        throw new HttpsError("not-found", "Invitation not found or already used");
      }

      const userDoc = usersQuery.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data()!;
      const invitation = userData.pendingInvitations?.[token];

      if (!invitation) {
        throw new HttpsError("not-found", "Invitation not found");
      }

      // 3. Verify invitation not expired
      const now = new Date();
      const expiresAt = invitation.expiresAt.toDate();

      if (expiresAt < now) {
        // Mark as expired
        await userDoc.ref.update({
          [`pendingInvitations.${token}.status`]: "expired",
          updatedAt: FieldValue.serverTimestamp(),
        });

        throw new HttpsError("failed-precondition", "Invitation has expired");
      }

      // 4. Get tenant details
      const tenantRef = db.collection("tenants").doc(invitation.tenantId);
      const tenantDoc = await tenantRef.get();

      if (!tenantDoc.exists) {
        throw new HttpsError("not-found", "Tenant not found");
      }

      const tenantData = tenantDoc.data()!;

      // 5. Move invitation to tenantRoles
      const tenantRoles = userData.tenantRoles || {};
      tenantRoles[invitation.tenantId] = {
        role: invitation.role,
        grantedBy: invitation.invitedBy,
        grantedAt: Timestamp.now(),
        expiresAt: invitation.roleExpiresAt || null,
        isActive: true,
        notes: `Accepted invitation from ${invitation.invitedByName}`,
      };

      // 6. Mark invitation as accepted
      const updatedInvitations = {...userData.pendingInvitations};
      updatedInvitations[token].status = "accepted";

      // 7. Recalculate highestRole
      const highestRole = calculateHighestRole(tenantRoles, userData.isSuperadmin || false);

      // 8. Update user document
      const updateData: any = {
        tenantRoles: tenantRoles,
        pendingInvitations: updatedInvitations,
        highestRole: highestRole,
        isActive: true,
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Update display name if provided (for new users)
      if (displayName) {
        updateData.displayName = displayName;
      }

      await userDoc.ref.update(updateData);

      // 9. Update tenant.adminCount if role is admin
      if (invitation.role === "admin") {
        await tenantRef.update({
          adminCount: FieldValue.increment(1),
        });
      }

      // 10. Create or get Firebase Auth account
      let firebaseUid = userId;
      let customToken: string;

      try {
        // Check if user already has Firebase Auth account
        const userRecord = await admin.auth().getUser(userId);
        firebaseUid = userRecord.uid;
      } catch (error: any) {
        if (error.code === "auth/user-not-found") {
          // Create new Firebase Auth user
          const newUser = await admin.auth().createUser({
            uid: userId,
            email: userData.email,
            displayName: displayName || userData.displayName,
            emailVerified: false,
          });
          firebaseUid = newUser.uid;
        } else {
          throw error;
        }
      }

      // 11. Update Custom Claims
      const activeTenantIds = Object.keys(tenantRoles).filter(
        (tid) => tenantRoles[tid].isActive && 
                (!tenantRoles[tid].expiresAt || 
                 tenantRoles[tid].expiresAt.toDate() > now)
      );

      const trMap: {[key: string]: string} = {};
      activeTenantIds.forEach((tid) => {
        trMap[tid] = tenantRoles[tid].role;
      });

      await admin.auth().setCustomUserClaims(firebaseUid, {
        role: highestRole,
        tenantIds: activeTenantIds,
        tr: trMap,
        sa: userData.isSuperadmin || false,
        iat: Date.now(),
      });

      // 12. Generate custom token for auto-login
      customToken = await admin.auth().createCustomToken(firebaseUid);

      // 13. Create audit log
      await db.collection("roleAssignments").add({
        assignerId: invitation.invitedBy,
        assignerEmail: invitation.invitedByName,
        targetUserId: userId,
        targetUserEmail: userData.email,
        action: "invite_accepted",
        roleBefore: null,
        roleAfter: invitation.role,
        tenantId: invitation.tenantId,
        timestamp: FieldValue.serverTimestamp(),
        reason: "Invitation accepted",
        ipAddress: request.rawRequest?.ip,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 14. Return success
      return {
        success: true,
        customToken: customToken,
        userId: userId,
        tenantId: invitation.tenantId,
        role: invitation.role,
        tenantName: tenantData.name || "Unknown",
      };
    } catch (error: any) {
      console.error("Error in acceptInvitation:", error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError("internal", `Failed to accept invitation: ${error.message}`);
    }
  }
);

/**
 * Calculate highest role from tenantRoles map
 */
function calculateHighestRole(
  tenantRoles: Record<string, any>,
  isSuperadmin: boolean
): string {
  if (isSuperadmin) return "superadmin";

  const hierarchy = ["player", "moderator", "organizer", "admin"];
  let highest = "player";

  for (const tenantId in tenantRoles) {
    const assignment = tenantRoles[tenantId];
    if (
      assignment.isActive &&
      (!assignment.expiresAt || assignment.expiresAt.toDate() > new Date())
    ) {
      const roleIndex = hierarchy.indexOf(assignment.role);
      const currentIndex = hierarchy.indexOf(highest);
      if (roleIndex > currentIndex) {
        highest = assignment.role;
      }
    }
  }

  return highest;
}
