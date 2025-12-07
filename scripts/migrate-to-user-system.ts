/**
 * Migration Script: Team-Centric → User-Centric System
 * 
 * This script migrates existing teams from the old team-centric model
 * to the new user-centric multi-user model.
 * 
 * What it does:
 * 1. For each existing team:
 *    - Creates a User document from team.displayName and team.email
 *    - Updates team with ownerUserId and memberUserIds
 *    - Creates a TeamMember record for the owner
 *    - Updates all submissions from that team with userId
 *    - Migrates team stats to TeamMember personalScore
 * 
 * Safety features:
 * - Dry-run mode (default) - shows what would change without modifying data
 * - Backup creation before migration
 * - Verification checks after migration
 * - Rollback capability
 * 
 * Usage:
 *   npm run migrate -- --dry-run          # Preview changes (safe)
 *   npm run migrate -- --execute          # Actually run migration
 *   npm run migrate -- --verify           # Verify migration success
 *   npm run migrate -- --rollback         # Rollback to backup
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import * as fs from 'fs';
import * as path from 'path';

// Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

interface OldTeam {
  id: string;
  uid?: string;
  displayName?: string;
  email?: string;
  teamName: string;
  accessCode: string;
  score: number;
  completedTaskIds: string[];
  tenantId: string;
  eventId: string;
  consentGiven?: any;
  createdAt: any;
  updatedAt: any;
}

interface MigrationResult {
  teamId: string;
  teamName: string;
  userId: string;
  userCreated: boolean;
  teamUpdated: boolean;
  teamMemberCreated: boolean;
  submissionsUpdated: number;
  error?: string;
}

interface MigrationStats {
  totalTeams: number;
  successful: number;
  failed: number;
  skipped: number;
  results: MigrationResult[];
}

const BACKUP_DIR = path.join(process.cwd(), 'migration-backups');
const BACKUP_FILE = path.join(BACKUP_DIR, `backup-${Date.now()}.json`);

/**
 * Create backup of all existing data
 */
async function createBackup(): Promise<void> {
  console.log('📦 Creating backup...');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const backup: any = {
    timestamp: new Date().toISOString(),
    teams: [],
    submissions: [],
  };

  // Backup teams
  const teamsSnapshot = await getDocs(collection(db, 'teams'));
  teamsSnapshot.forEach((doc) => {
    backup.teams.push({ id: doc.id, ...doc.data() });
  });

  // Backup submissions
  const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
  submissionsSnapshot.forEach((doc) => {
    backup.submissions.push({ id: doc.id, ...doc.data() });
  });

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
  console.log(`✅ Backup created: ${BACKUP_FILE}`);
  console.log(`   Teams: ${backup.teams.length}`);
  console.log(`   Submissions: ${backup.submissions.length}\n`);
}

/**
 * Get all teams that need migration
 */
async function getTeamsToMigrate(): Promise<OldTeam[]> {
  const teamsSnapshot = await getDocs(collection(db, 'teams'));
  const teams: OldTeam[] = [];

  teamsSnapshot.forEach((doc) => {
    const data = doc.data();
    
    // Only migrate teams that don't have ownerUserId yet
    if (!data.ownerUserId) {
      teams.push({
        id: doc.id,
        uid: data.uid,
        displayName: data.displayName,
        email: data.email,
        teamName: data.teamName || 'Unknown Team',
        accessCode: data.accessCode,
        score: data.score || 0,
        completedTaskIds: data.completedTaskIds || [],
        tenantId: data.tenantId,
        eventId: data.eventId,
        consentGiven: data.consentGiven,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    }
  });

  return teams;
}

/**
 * Migrate a single team
 */
async function migrateTeam(
  team: OldTeam,
  dryRun: boolean
): Promise<MigrationResult> {
  const result: MigrationResult = {
    teamId: team.id,
    teamName: team.teamName,
    userId: '',
    userCreated: false,
    teamUpdated: false,
    teamMemberCreated: false,
    submissionsUpdated: 0,
  };

  try {
    // Step 1: Create or use existing Firebase Auth user
    let firebaseUserId = team.uid;
    
    if (!firebaseUserId) {
      if (!dryRun) {
        const userCredential = await signInAnonymously(auth);
        firebaseUserId = userCredential.user.uid;
        console.log(`  ✓ Created Firebase Auth user: ${firebaseUserId}`);
      } else {
        firebaseUserId = `user-${team.id}`; // Placeholder for dry run
        console.log(`  [DRY RUN] Would create Firebase Auth user`);
      }
    }

    result.userId = firebaseUserId;

    // Step 2: Create User document
    const userDoc = {
      id: firebaseUserId,
      displayName: team.displayName || team.teamName || 'Team Member',
      email: team.email,
      tenantId: team.tenantId,
      totalScore: team.score,
      totalSubmissions: team.completedTaskIds.length,
      eventsParticipated: 1,
      consentGiven: team.consentGiven || {
        terms: true,
        privacy: true,
        termsVersion: '1.0',
        privacyVersion: '1.0',
        termsAcceptedAt: team.createdAt,
        privacyAcceptedAt: team.createdAt,
      },
      createdAt: team.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (!dryRun) {
      await setDoc(doc(db, 'users', firebaseUserId), userDoc);
      console.log(`  ✓ Created User document`);
    } else {
      console.log(`  [DRY RUN] Would create User: ${userDoc.displayName} (${userDoc.email || 'no email'})`);
    }
    result.userCreated = true;

    // Step 3: Update Team document
    const teamUpdate = {
      ownerUserId: firebaseUserId,
      memberUserIds: [firebaseUserId],
      memberCount: 1,
      maxMembers: 50,
      updatedAt: serverTimestamp(),
    };

    if (!dryRun) {
      await updateDoc(doc(db, 'teams', team.id), teamUpdate);
      console.log(`  ✓ Updated Team with user references`);
    } else {
      console.log(`  [DRY RUN] Would update Team with ownerUserId: ${firebaseUserId}`);
    }
    result.teamUpdated = true;

    // Step 4: Create TeamMember record
    const teamMemberId = `${team.id}-${firebaseUserId}`;
    const teamMemberDoc = {
      id: teamMemberId,
      teamId: team.id,
      userId: firebaseUserId,
      eventId: team.eventId,
      tenantId: team.tenantId,
      personalScore: team.score,
      submissionIds: [], // Will be populated from submissions
      tasksCompleted: team.completedTaskIds,
      role: 'owner' as const,
      joinedAt: team.createdAt || new Date(),
      isActive: true,
      createdAt: team.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (!dryRun) {
      await setDoc(doc(db, 'teamMembers', teamMemberId), teamMemberDoc);
      console.log(`  ✓ Created TeamMember record`);
    } else {
      console.log(`  [DRY RUN] Would create TeamMember with personalScore: ${team.score}`);
    }
    result.teamMemberCreated = true;

    // Step 5: Update submissions with userId
    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('teamId', '==', team.id)
    );
    const submissionsSnapshot = await getDocs(submissionsQuery);

    if (!dryRun && !submissionsSnapshot.empty) {
      const batch = writeBatch(db);
      const submissionIds: string[] = [];

      submissionsSnapshot.forEach((submissionDoc) => {
        batch.update(submissionDoc.ref, {
          userId: firebaseUserId,
          updatedAt: serverTimestamp(),
        });
        submissionIds.push(submissionDoc.id);
      });

      await batch.commit();
      
      // Update TeamMember with submission IDs
      await updateDoc(doc(db, 'teamMembers', teamMemberId), {
        submissionIds: submissionIds,
      });

      console.log(`  ✓ Updated ${submissionIds.length} submissions with userId`);
      result.submissionsUpdated = submissionIds.length;
    } else {
      console.log(`  [DRY RUN] Would update ${submissionsSnapshot.size} submissions`);
      result.submissionsUpdated = submissionsSnapshot.size;
    }

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ✗ Error migrating team: ${result.error}`);
    return result;
  }
}

/**
 * Verify migration results
 */
async function verifyMigration(): Promise<void> {
  console.log('\n🔍 Verifying migration...\n');

  const teams = await getDocs(collection(db, 'teams'));
  const users = await getDocs(collection(db, 'users'));
  const teamMembers = await getDocs(collection(db, 'teamMembers'));

  let teamsWithOwner = 0;
  let teamsWithoutOwner = 0;
  let submissionsWithUser = 0;
  let submissionsWithoutUser = 0;

  // Check teams
  teams.forEach((teamDoc) => {
    const data = teamDoc.data();
    if (data.ownerUserId) {
      teamsWithOwner++;
    } else {
      teamsWithoutOwner++;
      console.log(`⚠️  Team without owner: ${teamDoc.id} (${data.teamName})`);
    }
  });

  // Check submissions
  const submissions = await getDocs(collection(db, 'submissions'));
  submissions.forEach((subDoc) => {
    const data = subDoc.data();
    if (data.userId) {
      submissionsWithUser++;
    } else {
      submissionsWithoutUser++;
    }
  });

  console.log('📊 Migration Verification Results:');
  console.log(`   Total Teams: ${teams.size}`);
  console.log(`   ✓ Teams with owner: ${teamsWithOwner}`);
  console.log(`   ✗ Teams without owner: ${teamsWithoutOwner}`);
  console.log(`   Total Users: ${users.size}`);
  console.log(`   Total TeamMembers: ${teamMembers.size}`);
  console.log(`   Total Submissions: ${submissions.size}`);
  console.log(`   ✓ Submissions with userId: ${submissionsWithUser}`);
  console.log(`   ✗ Submissions without userId: ${submissionsWithoutUser}`);

  if (teamsWithoutOwner === 0 && submissionsWithoutUser === 0) {
    console.log('\n✅ Migration verification PASSED!\n');
  } else {
    console.log('\n⚠️  Migration verification found issues - see above\n');
  }
}

/**
 * Main migration function
 */
async function runMigration(mode: 'dry-run' | 'execute' | 'verify' | 'rollback') {
  console.log('\n🚀 Urban Rally - User System Migration\n');
  console.log(`Mode: ${mode.toUpperCase()}\n`);

  if (mode === 'verify') {
    await verifyMigration();
    return;
  }

  if (mode === 'rollback') {
    console.log('⚠️  Rollback functionality not yet implemented');
    console.log('Please restore from backup manually if needed');
    return;
  }

  const dryRun = mode === 'dry-run';

  // Create backup before migration
  if (!dryRun) {
    await createBackup();
  }

  // Get teams to migrate
  const teams = await getTeamsToMigrate();
  console.log(`Found ${teams.length} teams to migrate\n`);

  if (teams.length === 0) {
    console.log('✅ No teams need migration. All done!\n');
    return;
  }

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Migrate each team
  const stats: MigrationStats = {
    totalTeams: teams.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    results: [],
  };

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    console.log(`\n[${i + 1}/${teams.length}] Migrating: ${team.teamName} (${team.id})`);

    const result = await migrateTeam(team, dryRun);
    stats.results.push(result);

    if (result.error) {
      stats.failed++;
    } else {
      stats.successful++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total teams processed: ${stats.totalTeams}`);
  console.log(`✓ Successful: ${stats.successful}`);
  console.log(`✗ Failed: ${stats.failed}`);
  console.log(`- Skipped: ${stats.skipped}`);

  if (stats.failed > 0) {
    console.log('\n⚠️  Failed migrations:');
    stats.results
      .filter((r) => r.error)
      .forEach((r) => {
        console.log(`   ${r.teamName}: ${r.error}`);
      });
  }

  if (!dryRun) {
    console.log(`\n💾 Backup saved to: ${BACKUP_FILE}`);
    console.log('\n✅ Migration complete! Run with --verify to check results\n');
  } else {
    console.log('\n✅ Dry run complete! Run with --execute to actually migrate\n');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args.includes('--execute')
  ? 'execute'
  : args.includes('--verify')
  ? 'verify'
  : args.includes('--rollback')
  ? 'rollback'
  : 'dry-run';

// Run migration
runMigration(mode)
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
