/**
 * assignRole Cloud Function
 * 
 * Assigns or updates a user's role in a specific tenant.
 * Can only be called by superadmins or tenant admins.
 * 
 * Security:
 * - Superadmins can assign any role to any user
 * - Admins can only assign roles within their own tenants
 * - Admins cannot assign superadmin role
 * - Creates audit log for all changes
 * - Updates Firebase Custom Claims immediately
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

interface AssignRoleRequest {
  targetUserId: string;
  tenantId: string;
  role: 'admin' | 'organizer' | 'moderator';
  expiresAt?: string | null; // ISO date string or null
  reason?: string;
}

export interface AssignRoleResponse {
  success: boolean;
  newRole: string;
  expiresAt: Date | null;
  highestRole: string;
}

export const assignRole = onCall<AssignRoleRequest>(
  {cors: true, region: "europe-west3"},
  async (request) => {
    // 1. Validate authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in to assign roles");
    }

    // 2. Validate input
    const {targetUserId, tenantId, role, expiresAt, reason} = request.data;
    
    if (!targetUserId) {
      throw new HttpsError("invalid-argument", "targetUserId is required");
    }
    if (!tenantId) {
      throw new HttpsError("invalid-argument", "tenantId is required");
    }
    if (!role || !["admin", "organizer", "moderator"].includes(role)) {
      throw new HttpsError("invalid-argument", "role must be admin, organizer, or moderator");
    }

    const assignerId = request.auth.uid;
    const assignerClaims = request.auth.token;

    // 3. Check permissions
    const isSuperadmin = assignerClaims.sa === true;
    const isAdminInTenant = assignerClaims.tr?.[tenantId] === "admin";

    if (!isSuperadmin && !isAdminInTenant) {
      throw new HttpsError(
        "permission-denied",
        "Only superadmins or tenant admins can assign roles"
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

      // Prevent role assignment to anonymous users
      if (userData.accountType === 'anonymous') {
        throw new HttpsError(
          "failed-precondition",
          "Cannot assign roles to anonymous users. User must link their account with email first."
        );
      }

      // 5. Get assigner details for audit
      const assignerRef = db.collection("users").doc(assignerId);
      const assignerDoc = await assignerRef.get();
      const assignerData = assignerDoc.exists ? assignerDoc.data()! : null;

      // 6. Calculate expiration
      let expirationDate: Date | null = null;
      if (expiresAt) {
        expirationDate = new Date(expiresAt);
        // Validate the date
        if (isNaN(expirationDate.getTime())) {
          throw new HttpsError("invalid-argument", "Invalid expiresAt date format");
        }
      }

      // 7. Update tenantRoles[tenantId]
      const tenantRoles = userData.tenantRoles || {};
      const previousRole = tenantRoles[tenantId]?.role || null;

      const roleAssignment: any = {
        role: role,
        grantedBy: assignerId,
        grantedAt: Timestamp.now(),
        expiresAt: expirationDate ? Timestamp.fromDate(expirationDate) : null,
        isActive: true,
      };
      
      // Only add notes if reason is provided (avoid undefined values)
      if (reason) {
        roleAssignment.notes = reason;
      }
      
      tenantRoles[tenantId] = roleAssignment;

      // 8. Recalculate highestRole
      const highestRole = calculateHighestRole(tenantRoles, userData.isSuperadmin || false);

      // 9. Update Firestore
      await userRef.update({
        tenantRoles: tenantRoles,
        highestRole: highestRole,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 10. Update tenant.adminCount if role is admin
      if (role === "admin") {
        const tenantRef = db.collection("tenants").doc(tenantId);
        const tenantDoc = await tenantRef.get();
        
        if (tenantDoc.exists) {
          const wasAlreadyAdmin = previousRole === "admin";
          if (!wasAlreadyAdmin) {
            await tenantRef.update({
              adminCount: FieldValue.increment(1),
            });
          }
        }
      } else if (previousRole === "admin") {
        // Demoted from admin - decrement count
        const tenantRef = db.collection("tenants").doc(tenantId);
        await tenantRef.update({
          adminCount: FieldValue.increment(-1),
        });
      }

      // 11. Update Custom Claims
      const activeTenantIds = Object.keys(tenantRoles).filter(
        (tid) => tenantRoles[tid].isActive && 
                (!tenantRoles[tid].expiresAt || 
                 tenantRoles[tid].expiresAt!.toDate() > new Date())
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
      });

      // 12. Create audit log entry
      await db.collection("roleAssignments").add({
        assignerId: assignerId,
        assignerEmail: assignerData?.email || assignerClaims.email || "unknown",
        targetUserId: targetUserId,
        targetUserEmail: userData.email || "unknown",
        action: previousRole ? "modify" : "grant",
        roleBefore: previousRole,
        roleAfter: role,
        tenantId: tenantId,
        timestamp: FieldValue.serverTimestamp(),
        reason: reason || null,
        ipAddress: request.rawRequest?.ip || "unknown",
        userAgent: request.rawRequest?.headers["user-agent"],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 13. Return success
      return {
        success: true,
        newRole: role,
        expiresAt: expirationDate,
        highestRole: highestRole,
      };
    } catch (error: any) {
      console.error("Error in assignRole:", error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError("internal", `Failed to assign role: ${error.message}`);
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
