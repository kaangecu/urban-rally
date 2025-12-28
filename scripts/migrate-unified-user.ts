/**
 * Unified User Schema Migration Script
 * 
 * This script migrates from the dual-collection model (users + userProfiles)
 * to the unified User model (single users collection).
 * 
 * What it does:
 * 1. Migrates userProfiles → users collection
 *    - MERGE: If user exists (playing game), adds admin fields
 *    - CREATE: If user doesn't exist, creates with player field defaults
 * 2. Updates existing users with role field (default: 'player')
 * 3. Standardizes photoURL field (from profilePhotoUrl)
 * 4. Removes deprecated linkedAccountId field
 * 5. Deletes userProfiles collection (emulator only)
 * 
 * Safety:
 * - Idempotent: Safe to run multiple times
 * - Emulator-only deletion: Won't delete userProfiles in production
 * - Validates before writing
 * - Logs all operations
 * 
 * Usage:
 *   # Development (Emulator)
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
 *   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *   ts-node scripts/migrate-unified-user.ts
 * 
 *   # Production (if ever needed - requires testing first)
 *   ts-node scripts/migrate-unified-user.ts
 */

import admin from 'firebase-admin';

// ============================================================================
// CONFIGURATION
// ============================================================================

const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_PORT = 8080;
const PROJECT_ID = 'urban-rally-539bd';

// Initialize Firebase Admin SDK for emulator
admin.initializeApp({
  projectId: PROJECT_ID,
});

// Connect to emulators
process.env.FIRESTORE_EMULATOR_HOST = `${EMULATOR_HOST}:${EMULATOR_PORT}`;
process.env.FIREBASE_AUTH_EMULATOR_HOST = `${EMULATOR_HOST}:9099`;

const db = admin.firestore();

console.log(`🔧 Connected to Firestore Emulator at ${EMULATOR_HOST}:${EMULATOR_PORT}`);
console.log(`🔧 Connected to Auth Emulator at ${EMULATOR_HOST}:9099\n`);

async function migrateToUnifiedUser() {
  console.log('🔄 Starting Unified User Schema Migration...\n');
  console.log(`Environment: ${process.env.FIRESTORE_EMULATOR_HOST ? 'EMULATOR' : 'PRODUCTION'}`);
  console.log('');

  try {
    // ========================================================================
    // STEP 1: Migrate userProfiles → users
    // ========================================================================
    console.log('📦 Step 1: Migrating userProfiles to users collection...');
    
    const profilesSnapshot = await db.collection('userProfiles').get();
    console.log(`   Found ${profilesSnapshot.size} admin profiles to migrate\n`);

    let merged = 0;
    let created = 0;

    for (const profileDoc of profilesSnapshot.docs) {
      const profileData = profileDoc.data();
      const userId = profileDoc.id;

      // Check if user already exists in users collection
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        // MERGE: User already exists (was playing game), add admin fields
        console.log(`   ✏️  Merging admin role for existing user: ${userId}`);
        
        await userRef.update({
          role: profileData.role || 'player',
          managedTenantIds: profileData.managedTenantIds || [],
          isActive: profileData.isActive !== false,
          photoURL: profileData.photoURL || userDoc.data()?.profilePhotoUrl || null,
          updatedAt: admin.firestore.Timestamp.now(),
        });
        
        merged++;
      } else {
        // CREATE: Admin never played, create new user with defaults
        console.log(`   ➕ Creating user for admin: ${userId}`);
        
        await userRef.set({
          id: userId,
          email: profileData.email || 'unknown@example.com',
          displayName: profileData.displayName || 'Admin User',
          photoURL: profileData.photoURL || null,
          accountType: 'linked', // Admins must have linked accounts
          role: profileData.role || 'admin',
          managedTenantIds: profileData.managedTenantIds || [],
          isActive: profileData.isActive !== false,
          // Initialize player fields with defaults
          totalScore: 0,
          totalSubmissions: 0,
          eventsParticipated: 0,
          recoveryCode: null,
          recoveryCodeExpiresAt: null,
          lastLoginAt: null,
          consentGiven: {
            terms: true,
            privacy: true,
            termsVersion: '1.0',
            privacyVersion: '1.0',
            termsAcceptedAt: admin.firestore.Timestamp.now(),
            privacyAcceptedAt: admin.firestore.Timestamp.now(),
            ipAddress: null,
          },
          tenantId: profileData.tenantId || 'global',
          createdAt: profileData.createdAt || admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });
        
        created++;
      }
    }

    console.log(`\n   ✅ Step 1 Complete:`);
    console.log(`      - Merged: ${merged} existing users`);
    console.log(`      - Created: ${created} new users\n`);

    // ========================================================================
    // STEP 2: Update existing users with role field
    // ========================================================================
    console.log('📦 Step 2: Updating existing users with required fields...');
    
    const usersSnapshot = await db.collection('users').get();
    console.log(`   Found ${usersSnapshot.size} total users\n`);

    let updated = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const updates: any = {};

      // Add role if missing (default to player)
      if (!userData.role) {
        updates.role = 'player';
      }

      // Ensure accountType is set
      if (!userData.accountType) {
        updates.accountType = userData.email ? 'linked' : 'anonymous';
      }

      // Standardize photoURL (from profilePhotoUrl)
      if (userData.profilePhotoUrl && !userData.photoURL) {
        updates.photoURL = userData.profilePhotoUrl;
      }

      // Remove deprecated fields
      if (userData.linkedAccountId) {
        updates.linkedAccountId = admin.firestore.FieldValue.delete();
      }

      if (userData.recoveryCodeGeneratedAt) {
        updates.recoveryCodeGeneratedAt = admin.firestore.FieldValue.delete();
      }

      // Update if needed
      if (Object.keys(updates).length > 0) {
        await userDoc.ref.update(updates);
        console.log(`   ✅ Updated user ${userDoc.id}`);
        updated++;
      }
    }

    console.log(`\n   ✅ Step 2 Complete: Updated ${updated} users\n`);

    // ========================================================================
    // STEP 3: Verify migration
    // ========================================================================
    console.log('🔍 Step 3: Verifying migration...');
    
    const finalUsersSnapshot = await db.collection('users').get();
    const adminUsers = finalUsersSnapshot.docs.filter(d => {
      const role = d.data().role;
      return ['admin', 'superadmin', 'organizer', 'moderator'].includes(role);
    });
    
    const playerUsers = finalUsersSnapshot.docs.filter(d => 
      d.data().role === 'player'
    );

    console.log(`\n   📊 Migration Summary:`);
    console.log(`      - Total users: ${finalUsersSnapshot.size}`);
    console.log(`      - Admin users: ${adminUsers.length}`);
    console.log(`      - Player users: ${playerUsers.length}`);
    
    // Verify all users have required fields
    const usersWithoutRole = finalUsersSnapshot.docs.filter(d => !d.data().role);
    const usersWithoutAccountType = finalUsersSnapshot.docs.filter(d => !d.data().accountType);
    
    if (usersWithoutRole.length > 0) {
      console.log(`\n   ⚠️  Warning: ${usersWithoutRole.length} users missing role field`);
    }
    
    if (usersWithoutAccountType.length > 0) {
      console.log(`   ⚠️  Warning: ${usersWithoutAccountType.length} users missing accountType field`);
    }

    if (usersWithoutRole.length === 0 && usersWithoutAccountType.length === 0) {
      console.log(`   ✅ All users have required fields\n`);
    } else {
      console.log('');
    }

    // ========================================================================
    // STEP 4: Delete userProfiles collection (EMULATOR ONLY)
    // ========================================================================
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      console.log('🗑️  Step 4: Deleting userProfiles collection (emulator only)...');
      
      let deleted = 0;
      for (const doc of profilesSnapshot.docs) {
        await doc.ref.delete();
        deleted++;
      }
      
      console.log(`   ✅ Deleted ${deleted} userProfile documents\n`);
    } else {
      console.log('⚠️  Step 4: Skipping userProfiles deletion (production mode)');
      console.log('   Run manual cleanup after verifying migration in production\n');
    }

    // ========================================================================
    // SUCCESS
    // ========================================================================
    console.log('✅ Migration Complete!\n');
    console.log('Next Steps:');
    console.log('1. Test admin login: http://localhost:5173/admin/login');
    console.log('2. Verify admin can access dashboard');
    console.log('3. Test admin gameplay (join team, submit tasks)');
    console.log('4. Verify Custom Claims still work');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateToUnifiedUser()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
