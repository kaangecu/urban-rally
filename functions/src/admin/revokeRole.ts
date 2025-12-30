/**
 * revokeRole Cloud Function
 * 
 * Revokes a user's role in a specific tenant (soft delete).
 * Marks the role as inactive instead of deleting it for audit trail.
 * 
 * Security:
 * - Cannot revoke last admin in tenant
 * - Cannot revoke own role if last admin
 * - Updates Custom Claims immediately
 * - Creates audit log entry
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

interface RevokeRoleRequest {
  targetUserId: string;
  tenantId: string;
  reason?: string;
}

export interface RevokeRoleResponse {
  success: boolean;
  message: string;
  highestRole: string;
}

export const revokeRole = onCall<RevokeRoleRequest>(
  {cors: true, region: "europe-west3"},
  async (request) => {
    // 1. Validate authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in to revoke roles");
    }

    // 2. Validate input
    const {targetUserId, tenantId, reason} = request.data;
    
    if (!targetUserId) {
      throw new HttpsError("invalid-argument", "targetUserId is required");
    }
    if (!tenantId) {
      throw new HttpsError("invalid-argument", "tenantId is required");
    }

    const revokerId = request.auth.uid;
    const revokerClaims = request.auth.token;

    // 3. Check permissions
    const isSuperadmin = revokerClaims.sa === true;
    const isAdminInTenant = revokerClaims.tr?.[tenantId] === "admin";

    if (!isSuperadmin && !isAdminInTenant) {
      throw new HttpsError(
        "permission-denied",
        "Only superadmins or tenant admins can revoke roles"
      );
    }

    try {
      // 4. Get target user document
      const userRef = db.collection("users").doc(targetUserId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new HttpsError("not-found", `User ${targetUserId} not found`);
      }

      const userData = userDoc.data()!;
      const tenantRoles = userData.tenantRoles || {};

      if (!tenantRoles[tenantId]) {
        throw new HttpsError("not-found", `User has no role in tenant ${tenantId}`);
      }

      const roleBeingRevoked = tenantRoles[tenantId].role;

      // 5. Check if this is the last admin (prevent orphaned tenant)
      if (roleBeingRevoked === "admin") {
        const tenantRef = db.collection("tenants").doc(tenantId);
        const tenantDoc = await tenantRef.get();
        
        if (tenantDoc.exists) {
          const adminCount = tenantDoc.data()?.adminCount || 0;
          
          if (adminCount <= 1) {
            throw new HttpsError(
              "failed-precondition",
              "Cannot revoke last admin role in tenant. Assign another admin first."
            );
          }
        }
      }

      // 6. Get revoker details for audit
      const revokerRef = db.collection("users").doc(revokerId);
      const revokerDoc = await revokerRef.get();
      const revokerData = revokerDoc.exists ? revokerDoc.data()! : null;

      // 7. Mark role as inactive (soft delete)
      tenantRoles[tenantId] = {
        ...tenantRoles[tenantId],
        isActive: false,
        revokedBy: revokerId,
        revokedAt: Timestamp.now(),
        revokeReason: reason || undefined,
      };

      // 8. Recalculate highestRole (excluding revoked roles)
      const highestRole = calculateHighestRole(tenantRoles, userData.isSuperadmin || false);

      // 9. Update Firestore
      await userRef.update({
        tenantRoles: tenantRoles,
        highestRole: highestRole,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 10. Update tenant.adminCount if was admin
      if (roleBeingRevoked === "admin") {
        const tenantRef = db.collection("tenants").doc(tenantId);
        await tenantRef.update({
          adminCount: FieldValue.increment(-1),
        });
      }

      // 11. Update Custom Claims
      const activeTenantIds = Object.keys(tenantRoles).filter(
        (tid) => tenantRoles[tid].isActive && 
                (!tenantRoles[tid].expiresAt || 
                 tenantRoles[tid].expiresAt.toDate() > new Date())
      );

      const trMap: {[key: string]: string} = {};
      activeTenantIds.forEach((tid) => {
        trMap[tid] = tenantRoles[tid].role;
      });

      await admin.auth().setCustomUserClaims(targetUserId, {
        role: highestRole,
        tenantIds: activeTenantIds,
        tr: trMap,
        sa: userData.isSuperadmin || false,
        iat: Date.now(),
      });

      // 12. Create audit log entry
      await db.collection("roleAssignments").add({
        assignerId: revokerId,
        assignerEmail: revokerData?.email || revokerClaims.email || "unknown",
        targetUserId: targetUserId,
        targetUserEmail: userData.email || "unknown",
        action: "revoke",
        roleBefore: roleBeingRevoked,
        roleAfter: null,
        tenantId: tenantId,
        timestamp: FieldValue.serverTimestamp(),
        reason: reason || null,
        ipAddress: request.rawRequest?.ip,
        userAgent: request.rawRequest?.headers["user-agent"],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 13. Return success
      return {
        success: true,
        message: `Role ${roleBeingRevoked} revoked successfully`,
        highestRole: highestRole,
      };
    } catch (error: any) {
      console.error("Error in revokeRole:", error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError("internal", `Failed to revoke role: ${error.message}`);
    }
  }
);

/**
 * Calculate highest role from tenantRoles map (excluding inactive)
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
