/**
 * Migration Script: Add Multi-Event Fields to Existing Users
 * 
 * This script updates existing User documents to include the new fields
 * required for multi-event authentication:
 * - accountType (defaults to 'anonymous')
 * - recoveryCode (initially null)
 * - recoveryCodeExpiresAt (initially null)
 * - recoveryCodeGeneratedAt (initially null)
 * 
 * Run with: npx tsx scripts/migration/migrateUsersToMultiEvent.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch, connectFirestoreEmulator } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase config (use your project config)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Validate config
if (!firebaseConfig.projectId) {
  console.error('❌ Firebase configuration missing!');
  console.error('Make sure your .env file contains all VITE_FIREBASE_* variables');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Use emulator if specified
if (process.env.FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, parseInt(port));
  console.log(`🔧 Using Firestore Emulator at ${host}:${port}\n`);
}

interface MigrationStats {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

async function migrateUsers(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  console.log('🔄 Starting User Migration for Multi-Event Support...\n');

  try {
    // Get all users
    const usersRef = collection(db, 'users');
    
    console.log('📡 Fetching users from Firestore...');
    const usersSnapshot = await getDocs(usersRef);
    
    stats.total = usersSnapshot.size;
    console.log(`📊 Found ${stats.total} users to process\n`);

    if (stats.total === 0) {
      console.log('⚠️  No users found in database');
      console.log('💡 Tip: Make sure you have users in your Firestore database');
      console.log('💡 Or run the seed script first to create test data\n');
      return stats;
    }

    // Process in batches of 500 (Firestore limit)
    const batchSize = 500;
    let batch = writeBatch(db);
    let operationCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Check if user already has multi-event fields
      if (userData.accountType !== undefined) {
        console.log(`⏭️  User ${userId} (${userData.displayName || 'Unknown'}) - Already migrated`);
        stats.skipped++;
        continue;
      }

      try {
        // Add new fields to existing user
        const updates = {
          accountType: 'anonymous' as const,
          recoveryCode: null,
          recoveryCodeExpiresAt: null,
          recoveryCodeGeneratedAt: null,
          updatedAt: new Date(),
        };

        const userRef = doc(db, 'users', userId);
        batch.update(userRef, updates);
        operationCount++;

        console.log(`✅ User ${userId} (${userData.displayName || 'Unknown'}) - Queued for migration`);
        stats.updated++;

        // Commit batch when it reaches the limit
        if (operationCount === batchSize) {
          await batch.commit();
          console.log(`\n💾 Committed batch of ${batchSize} updates\n`);
          batch = writeBatch(db);
          operationCount = 0;
        }
      } catch (error) {
        console.error(`❌ Error migrating user ${userId}:`, error);
        stats.errors++;
      }
    }

    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`\n💾 Committed final batch of ${operationCount} updates\n`);
    }

    console.log('\n✨ Migration Complete!\n');
    console.log('📊 Migration Statistics:');
    console.log(`   Total users: ${stats.total}`);
    console.log(`   ✅ Updated: ${stats.updated}`);
    console.log(`   ⏭️  Skipped: ${stats.skipped}`);
    console.log(`   ❌ Errors: ${stats.errors}`);

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error);
    if (error.code === 'invalid-argument') {
      console.error('\n💡 This might be a Firestore configuration issue');
      console.error('💡 Make sure your Firebase project is properly set up');
      console.error('💡 Try checking Firestore rules and indexes\n');
    }
    throw error;
  }

  return stats;
}

// Verify migration (optional check)
async function verifyMigration(): Promise<void> {
  console.log('\n🔍 Verifying migration...\n');

  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let verified = 0;
    let failed = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      if (userData.accountType !== undefined) {
        verified++;
      } else {
        console.log(`⚠️  User ${userDoc.id} missing accountType field`);
        failed++;
      }
    }

    console.log(`\n✅ Verified: ${verified} users have multi-event fields`);
    if (failed > 0) {
      console.log(`⚠️  Failed: ${failed} users still missing fields`);
    }
  } catch (error: any) {
    console.error('\n❌ Verification failed:', error.message);
    console.log('\n💡 Skipping verification - check Firestore manually');
  }
}

// Run migration
async function main() {
  try {
    const stats = await migrateUsers();
    
    if (stats.errors === 0) {
      await verifyMigration();
      console.log('\n🎉 All users successfully migrated!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review logs.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  }
}

// Dry run mode (optional)
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
  console.log('Remove --dry-run flag to execute migration\n');
  process.exit(0);
}

main();
