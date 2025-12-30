/**
 * expireRoles Scheduled Function
 * 
 * Runs daily at 2 AM Berlin time to automatically expire roles.
 * Marks expired roles as inactive and recalculates user permissions.
 * 
 * Flow:
 * 1. Query all users with admin/organizer/moderator roles
 * 2. Check each tenantRoles[*].expiresAt timestamp
 * 3. Mark expired roles as inactive
 * 4. Recalculate highestRole for affected users
 * 5. Update Custom Claims
 * 6. Create audit log entries
 * 7. Use batched writes (500 operations per batch)
 */

import {onSchedule} from "firebase-functions/v2/scheduler";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

export const expireRoles = onSchedule(
  {
    schedule: "0 2 * * *", // Daily at 2 AM
    timeZone: "Europe/Berlin",
    region: "europe-west3",
  },
  async (event) => {
    logger.info("🕒 Starting daily role expiration job...");

    try {
      const now = Timestamp.now();
      const nowDate = now.toDate();
      let totalExpiredCount = 0;

      // Query users who have any tenant roles (admin/organizer/moderator)
      // We need to check all users with tenantRoles field
      const usersSnapshot = await db.collection("users")
        .where("highestRole", "in", ["admin", "organizer", "moderator"])
        .get();

      logger.info(`Found ${usersSnapshot.size} users with admin roles to check`);

      if (usersSnapshot.empty) {
        logger.info("No users with admin roles found. Exiting.");
        return;
      }

      // Process users in batches
      const BATCH_SIZE = 500;
      let batch = db.batch();
      let operationCount = 0;
      const affectedUsers: Array<{userId: string; expiredRoles: string[]}> = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const tenantRoles = userData.tenantRoles || {};
        const userId = userDoc.id;
        
        let hasExpiredRoles = false;
        const expiredTenantIds: string[] = [];

        // Check each tenant role for expiration
        for (const tenantId in tenantRoles) {
          const assignment = tenantRoles[tenantId];
          
          if (
            assignment.isActive &&
            assignment.expiresAt &&
            assignment.expiresAt.toDate() <= nowDate
          ) {
            // Mark as expired
            tenantRoles[tenantId] = {
              ...assignment,
              isActive: false,
              revokedBy: "system",
              revokedAt: now,
              revokeReason: "expired",
            };
            
            hasExpiredRoles = true;
            expiredTenantIds.push(tenantId);
            totalExpiredCount++;

            // Create audit log entry
            const auditLogRef = db.collection("roleAssignments").doc();
            batch.set(auditLogRef, {
              assignerId: "system",
              assignerEmail: "system",
              targetUserId: userId,
              targetUserEmail: userData.email || "unknown",
              action: "revoke",
              roleBefore: assignment.role,
              roleAfter: null,
              tenantId: tenantId,
              timestamp: now,
              reason: `Role expired at ${assignment.expiresAt.toDate().toISOString()}`,
              createdAt: now,
              updatedAt: now,
            });
            operationCount++;

            // Update tenant.adminCount if was admin
            if (assignment.role === "admin") {
              const tenantRef = db.collection("tenants").doc(tenantId);
              batch.update(tenantRef, {
                adminCount: FieldValue.increment(-1),
              });
              operationCount++;
            }

            // Commit batch if reaching limit
            if (operationCount >= BATCH_SIZE) {
              await batch.commit();
              logger.info(`Committed batch of ${operationCount} operations`);
              batch = db.batch();
              operationCount = 0;
            }
          }
        }

        if (hasExpiredRoles) {
          // Recalculate highestRole
          const newHighestRole = calculateHighestRole(tenantRoles, userData.isSuperadmin || false);

          // Update user document
          batch.update(userDoc.ref, {
            tenantRoles: tenantRoles,
            highestRole: newHighestRole,
            updatedAt: now,
          });
          operationCount++;

          affectedUsers.push({
            userId: userId,
            expiredRoles: expiredTenantIds,
          });

          // Commit batch if reaching limit
          if (operationCount >= BATCH_SIZE) {
            await batch.commit();
            logger.info(`Committed batch of ${operationCount} operations`);
            batch = db.batch();
            operationCount = 0;
          }
        }
      }

      // Commit remaining operations
      if (operationCount > 0) {
        await batch.commit();
        logger.info(`Committed final batch of ${operationCount} operations`);
      }

      // Update Custom Claims for affected users
      logger.info(`Updating Custom Claims for ${affectedUsers.length} affected users...`);
      
      for (const {userId, expiredRoles} of affectedUsers) {
        try {
          // Re-fetch user to get updated tenantRoles
          const userDoc = await db.collection("users").doc(userId).get();
          if (!userDoc.exists) continue;

          const userData = userDoc.data()!;
          const tenantRoles = userData.tenantRoles || {};

          // Calculate active tenant IDs and roles
          const activeTenantIds = Object.keys(tenantRoles).filter(
            (tid) => tenantRoles[tid].isActive && 
                    (!tenantRoles[tid].expiresAt || 
                     tenantRoles[tid].expiresAt.toDate() > nowDate)
          );

          const trMap: {[key: string]: string} = {};
          activeTenantIds.forEach((tid) => {
            trMap[tid] = tenantRoles[tid].role;
          });

          // Update Custom Claims
          await admin.auth().setCustomUserClaims(userId, {
            role: userData.highestRole || "player",
            tenantIds: activeTenantIds,
            tr: trMap,
            sa: userData.isSuperadmin || false,
            iat: Date.now(),
          });

          logger.info(`Updated Custom Claims for user ${userId}. Expired roles in tenants: ${expiredRoles.join(", ")}`);
        } catch (error) {
          logger.error(`Failed to update Custom Claims for user ${userId}:`, error);
        }
      }

      logger.info(`✅ Role expiration job complete. Expired ${totalExpiredCount} roles across ${affectedUsers.length} users.`);
    } catch (error) {
      logger.error("❌ Error in expireRoles job:", error);
      throw error;
    }
  }
);

/**
 * Calculate highest role from tenantRoles map (excluding inactive/expired)
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
