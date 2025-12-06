/**
 * Database Migration Script
 * Migrates existing tasks to optimized schema with:
 * - Geohash generation for GPS tasks
 * - Stats field initialization
 * - Hints migration to subcollections (optional)
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  GeoPoint,
  writeBatch,
  addDoc,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import * as dotenv from 'dotenv';
import { generateGeohash } from '../src/utils/geospatial';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

interface MigrationStats {
  total: number;
  geohashAdded: number;
  statsAdded: number;
  hintsMigrated: number;
  errors: number;
  errorDetails: Array<{ id: string; error: string }>;
}

/**
 * Main migration function
 */
async function migrateDatabase(dryRun: boolean = true) {
  console.log('🚀 Starting database migration...\n');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes will be made)' : '✍️  LIVE MODE'}\n`);

  try {
    // Authenticate
    console.log('🔐 Authenticating with Firebase...');
    await signInAnonymously(auth);
    console.log('✅ Authenticated successfully!\n');

    const stats: MigrationStats = {
      total: 0,
      geohashAdded: 0,
      statsAdded: 0,
      hintsMigrated: 0,
      errors: 0,
      errorDetails: [],
    };

    // Get all tasks
    console.log('📥 Fetching all tasks...');
    const tasksRef = collection(db, 'tasks');
    const tasksSnapshot = await getDocs(tasksRef);
    stats.total = tasksSnapshot.size;
    console.log(`Found ${stats.total} tasks\n`);

    // Process tasks in batches
    const batchSize = 500; // Firestore batch limit
    let batch = writeBatch(db);
    let batchCount = 0;

    for (const taskDoc of tasksSnapshot.docs) {
      const taskData = taskDoc.data();
      const updates: any = {};
      let needsUpdate = false;

      // 1. Add geohash for GPS tasks
      if (taskData.coordinates && !taskData.geohash) {
        try {
          let lat: number, lng: number;

          // Handle both GeoPoint and plain object
          if (taskData.coordinates instanceof GeoPoint) {
            lat = taskData.coordinates.latitude;
            lng = taskData.coordinates.longitude;
          } else if (taskData.coordinates.lat !== undefined) {
            lat = taskData.coordinates.lat;
            lng = taskData.coordinates.lng;
            // Also convert to GeoPoint
            updates.coordinates = new GeoPoint(lat, lng);
          } else {
            throw new Error('Invalid coordinates format');
          }

          updates.geohash = generateGeohash(lat, lng);
          stats.geohashAdded++;
          needsUpdate = true;

          console.log(`  ✅ Geohash added for task: ${taskDoc.id} (${taskData.title})`);
        } catch (error) {
          console.error(`  ❌ Failed to add geohash for task ${taskDoc.id}:`, error);
          stats.errors++;
          stats.errorDetails.push({
            id: taskDoc.id,
            error: `Geohash generation failed: ${error}`,
          });
        }
      }

      // 2. Initialize stats if missing
      if (!taskData.stats) {
        updates.stats = {
          totalSubmissions: 0,
          approvedSubmissions: 0,
          rejectedSubmissions: 0,
          successRate: 0,
          averageTimeToComplete: 0,
          uniqueTeamsAttempted: 0,
          uniqueTeamsCompleted: 0,
        };
        stats.statsAdded++;
        needsUpdate = true;

        console.log(`  ✅ Stats initialized for task: ${taskDoc.id} (${taskData.title})`);
      }

      // 3. Migrate hints to subcollection (if enabled)
      if (taskData.hints && Array.isArray(taskData.hints) && taskData.hints.length > 0) {
        if (!dryRun) {
          try {
            await migrateHintsToSubcollection(taskDoc.id, taskData.hints, taskData);
            // Remove hints array from task
            updates.hints = null; // Will be deleted
            stats.hintsMigrated += taskData.hints.length;
            needsUpdate = true;

            console.log(`  ✅ Migrated ${taskData.hints.length} hints for task: ${taskDoc.id}`);
          } catch (error) {
            console.error(`  ❌ Failed to migrate hints for task ${taskDoc.id}:`, error);
            stats.errors++;
            stats.errorDetails.push({
              id: taskDoc.id,
              error: `Hint migration failed: ${error}`,
            });
          }
        } else {
          console.log(`  🔍 Would migrate ${taskData.hints.length} hints for task: ${taskDoc.id}`);
          stats.hintsMigrated += taskData.hints.length;
        }
      }

      // Apply updates
      if (needsUpdate && Object.keys(updates).length > 0) {
        updates.updatedAt = Timestamp.now();

        if (!dryRun) {
          const taskRef = doc(db, 'tasks', taskDoc.id);
          batch.update(taskRef, updates);
          batchCount++;

          // Commit batch if limit reached
          if (batchCount >= batchSize) {
            await batch.commit();
            batch = writeBatch(db);
            batchCount = 0;
            console.log(`  💾 Batch committed (${batchSize} operations)`);
          }
        }
      }
    }

    // Commit remaining batch
    if (!dryRun && batchCount > 0) {
      await batch.commit();
      console.log(`  💾 Final batch committed (${batchCount} operations)\n`);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total tasks processed: ${stats.total}`);
    console.log(`Geohashes added: ${stats.geohashAdded}`);
    console.log(`Stats fields initialized: ${stats.statsAdded}`);
    console.log(`Hints migrated: ${stats.hintsMigrated}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.errorDetails.length > 0) {
      console.log('\n❌ Error Details:');
      stats.errorDetails.forEach(({ id, error }) => {
        console.log(`   - Task ${id}: ${error}`);
      });
    }

    if (dryRun) {
      console.log('\n🔍 DRY RUN COMPLETE - No changes were made');
      console.log('Run with --live flag to apply changes');
    } else {
      console.log('\n✅ MIGRATION COMPLETE!');
    }

    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Migrate hints from task array to subcollection
 */
async function migrateHintsToSubcollection(
  taskId: string,
  hints: any[],
  taskData: any
) {
  const hintsRef = collection(db, 'tasks', taskId, 'hints');

  for (let i = 0; i < hints.length; i++) {
    const hint = hints[i];
    await addDoc(hintsRef, {
      taskId,
      eventId: taskData.eventId,
      tenantId: taskData.tenantId,
      hintLevel: i + 1,
      text: hint.text || hint,
      cost: hint.cost || 10 * (i + 1), // Progressive cost
      revealedCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

/**
 * Rollback function (emergency use)
 */
async function rollbackMigration() {
  console.log('⚠️  Starting rollback...\n');

  try {
    await signInAnonymously(auth);

    const tasksRef = collection(db, 'tasks');
    const tasksSnapshot = await getDocs(tasksRef);

    let batch = writeBatch(db);
    let count = 0;

    for (const taskDoc of tasksSnapshot.docs) {
      const taskRef = doc(db, 'tasks', taskDoc.id);
      batch.update(taskRef, {
        geohash: null,
        stats: null,
        updatedAt: Timestamp.now(),
      });
      count++;

      if (count >= 500) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    console.log('✅ Rollback complete!\n');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isLive = args.includes('--live');
const isRollback = args.includes('--rollback');

if (isRollback) {
  rollbackMigration();
} else {
  migrateDatabase(!isLive);
}
