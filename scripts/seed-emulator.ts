/**
 * Seed Script: Populate Firebase Emulator with Test Data
 * 
 * This script creates comprehensive test data for local development:
 * - Tenants (ESN organizations)
 * - Events (scavenger hunts)
 * - Users (players with profiles)
 * - Teams (with multiple members)
 * - TeamMembers (user-team relationships)
 * - Tasks (challenges to complete)
 * - Submissions (completed tasks)
 * 
 * Usage:
 *   npm run seed:emulator
 * 
 * Prerequisites:
 *   - Firebase emulators must be running (firebase emulators:start)
 *   - Run from project root directory
 * 
 * Note: Uses Admin SDK to bypass security rules in emulator
 */

import admin from 'firebase-admin';

// ============================================================================
// CONFIGURATION
// ============================================================================

const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_PORT = 8080;
const PROJECT_ID = 'urban-rally-539bd';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SeedTenant {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  isActive: boolean;
}

interface SeedEvent {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  eventCode: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  maxTeams: number;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
}

interface SeedUser {
  id: string;
  tenantId: string;
  displayName: string;
  email?: string;
  accountType: 'anonymous' | 'linked';
  totalScore: number;
  totalSubmissions: number;
  eventsParticipated: number;
  consentGiven: {
    terms: boolean;
    privacy: boolean;
    termsVersion: string;
    privacyVersion: string;
    termsAcceptedAt: Date;
    privacyAcceptedAt: Date;
  };
}

interface SeedTeam {
  id: string;
  tenantId: string;
  eventId: string;
  ownerUserId: string;
  accessCode: string;
  teamName: string;
  teamDisplayName: string;
  memberUserIds: string[];
  maxMembers: number;
  memberCount: number;
  score: number;
  completedTaskIds: string[];
  isActive: boolean;
}

interface SeedTeamMember {
  id: string;
  teamId: string;
  userId: string;
  eventId: string;
  tenantId: string;
  displayName: string;
  role: 'owner' | 'member';
  personalScore: number;
  submissionIds: string[];
  tasksCompleted: string[];
  isActive: boolean;
  joinedAt: Date;
}

interface SeedTask {
  id: string;
  tenantId: string;
  eventId: string;
  title: string;
  description: string;
  type: 'PHOTO' | 'QUIZ' | 'GPS_LOCATION';
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  order: number;
  coordinates?: { lat: number; lng: number };
  radius?: number;
  requiresPhoto: boolean;
  requiresVideo: boolean;
  requiresText: boolean;
  quizCorrectAnswer?: string;
  quizOptions?: string[];
}

interface SeedSubmission {
  id: string;
  tenantId: string;
  eventId: string;
  teamId: string;
  userId: string;
  taskId: string;
  type: 'photo' | 'quiz' | 'location';
  status: 'pending' | 'approved' | 'rejected';
  pointsAwarded: number;
  submittedAt: Date;
  photoUrl?: string;
  answer?: string;
}

// ============================================================================
// TEST DATA
// ============================================================================

const TENANTS: SeedTenant[] = [
  {
    id: 'esn-berlin',
    name: 'ESN Berlin',
    slug: 'esn-berlin',
    primaryColor: '#1a56db',
    isActive: true,
  },
  {
    id: 'esn-munich',
    name: 'ESN Munich',
    slug: 'esn-munich',
    primaryColor: '#dc2626',
    isActive: true,
  },
];

const EVENTS: SeedEvent[] = [
  {
    id: 'berlin-winter-2025',
    tenantId: 'esn-berlin',
    name: 'Berlin Winter Hunt 2025',
    description: 'Explore Berlin in winter! Complete challenges across the city.',
    eventCode: 'BERLIN25',
    startDate: new Date('2025-12-15'),
    endDate: new Date('2026-01-15'),
    isActive: true,
    maxTeams: 50,
    mapCenter: { lat: 52.5200, lng: 13.4050 },
    mapZoom: 12,
  },
  {
    id: 'munich-christmas-2025',
    tenantId: 'esn-munich',
    name: 'Munich Christmas Rally 2025',
    description: 'Discover Munich during the Christmas markets season.',
    eventCode: 'MUNICH25',
    startDate: new Date('2025-12-18'),
    endDate: new Date('2026-01-10'),
    isActive: true,
    maxTeams: 40,
    mapCenter: { lat: 48.1351, lng: 11.5820 },
    mapZoom: 12,
  },
];

const USERS: SeedUser[] = [
  {
    id: 'user-alice',
    tenantId: 'esn-berlin',
    displayName: 'Alice Anderson',
    email: 'alice@example.com',
    accountType: 'linked',
    totalScore: 450,
    totalSubmissions: 8,
    eventsParticipated: 1,
    consentGiven: {
      terms: true,
      privacy: true,
      termsVersion: '1.0',
      privacyVersion: '1.0',
      termsAcceptedAt: new Date('2025-12-10'),
      privacyAcceptedAt: new Date('2025-12-10'),
    },
  },
  {
    id: 'user-bob',
    tenantId: 'esn-berlin',
    displayName: 'Bob Builder',
    accountType: 'anonymous',
    totalScore: 320,
    totalSubmissions: 6,
    eventsParticipated: 1,
    consentGiven: {
      terms: true,
      privacy: true,
      termsVersion: '1.0',
      privacyVersion: '1.0',
      termsAcceptedAt: new Date('2025-12-11'),
      privacyAcceptedAt: new Date('2025-12-11'),
    },
  },
  {
    id: 'user-charlie',
    tenantId: 'esn-berlin',
    displayName: 'Charlie Chen',
    email: 'charlie@example.com',
    accountType: 'linked',
    totalScore: 280,
    totalSubmissions: 5,
    eventsParticipated: 1,
    consentGiven: {
      terms: true,
      privacy: true,
      termsVersion: '1.0',
      privacyVersion: '1.0',
      termsAcceptedAt: new Date('2025-12-11'),
      privacyAcceptedAt: new Date('2025-12-11'),
    },
  },
  {
    id: 'user-diana',
    tenantId: 'esn-munich',
    displayName: 'Diana Davis',
    email: 'diana@example.com',
    accountType: 'linked',
    totalScore: 520,
    totalSubmissions: 10,
    eventsParticipated: 1,
    consentGiven: {
      terms: true,
      privacy: true,
      termsVersion: '1.0',
      privacyVersion: '1.0',
      termsAcceptedAt: new Date('2025-12-12'),
      privacyAcceptedAt: new Date('2025-12-12'),
    },
  },
  {
    id: 'user-emma',
    tenantId: 'esn-munich',
    displayName: 'Emma Evans',
    accountType: 'anonymous',
    totalScore: 380,
    totalSubmissions: 7,
    eventsParticipated: 1,
    consentGiven: {
      terms: true,
      privacy: true,
      termsVersion: '1.0',
      privacyVersion: '1.0',
      termsAcceptedAt: new Date('2025-12-13'),
      privacyAcceptedAt: new Date('2025-12-13'),
    },
  },
];

const TEAMS: SeedTeam[] = [
  {
    id: 'team-explorers',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-2025',
    ownerUserId: 'user-alice',
    accessCode: 'BER-EXP-001',
    teamName: 'City Explorers',
    teamDisplayName: 'City Explorers',
    memberUserIds: ['user-alice', 'user-bob', 'user-charlie'],
    maxMembers: 50,
    memberCount: 3,
    score: 1050,
    completedTaskIds: ['task-1', 'task-2', 'task-3', 'task-4'],
    isActive: true,
  },
  {
    id: 'team-adventurers',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-2025',
    ownerUserId: 'user-bob',
    accessCode: 'BER-ADV-002',
    teamName: 'Berlin Adventurers',
    teamDisplayName: 'Berlin Adventurers',
    memberUserIds: ['user-bob'],
    maxMembers: 50,
    memberCount: 1,
    score: 320,
    completedTaskIds: ['task-1', 'task-2'],
    isActive: true,
  },
  {
    id: 'team-bavarians',
    tenantId: 'esn-munich',
    eventId: 'munich-christmas-2025',
    ownerUserId: 'user-diana',
    accessCode: 'MUN-BAV-001',
    teamName: 'Bavarian Hunters',
    teamDisplayName: 'Bavarian Hunters',
    memberUserIds: ['user-diana', 'user-emma'],
    maxMembers: 50,
    memberCount: 2,
    score: 900,
    completedTaskIds: ['task-5', 'task-6', 'task-7'],
    isActive: true,
  },
];

const TEAM_MEMBERS: SeedTeamMember[] = [
  // Team: City Explorers
  {
    id: 'team-explorers-user-alice',
    teamId: 'team-explorers',
    userId: 'user-alice',
    eventId: 'berlin-winter-2025',
    tenantId: 'esn-berlin',
    displayName: 'Alice Anderson',
    role: 'owner',
    personalScore: 450,
    submissionIds: ['sub-1', 'sub-2', 'sub-3'],
    tasksCompleted: ['task-1', 'task-2', 'task-3'],
    isActive: true,
    joinedAt: new Date('2025-12-15T10:00:00Z'),
  },
  {
    id: 'team-explorers-user-bob',
    teamId: 'team-explorers',
    userId: 'user-bob',
    eventId: 'berlin-winter-2025',
    tenantId: 'esn-berlin',
    displayName: 'Bob Builder',
    role: 'member',
    personalScore: 320,
    submissionIds: ['sub-4', 'sub-5'],
    tasksCompleted: ['task-2', 'task-4'],
    isActive: true,
    joinedAt: new Date('2025-12-15T11:30:00Z'),
  },
  {
    id: 'team-explorers-user-charlie',
    teamId: 'team-explorers',
    userId: 'user-charlie',
    eventId: 'berlin-winter-2025',
    tenantId: 'esn-berlin',
    displayName: 'Charlie Chen',
    role: 'member',
    personalScore: 280,
    submissionIds: ['sub-6'],
    tasksCompleted: ['task-3'],
    isActive: true,
    joinedAt: new Date('2025-12-15T14:00:00Z'),
  },
  // Team: Berlin Adventurers
  {
    id: 'team-adventurers-user-bob',
    teamId: 'team-adventurers',
    userId: 'user-bob',
    eventId: 'berlin-winter-2025',
    tenantId: 'esn-berlin',
    displayName: 'Bob Builder',
    role: 'owner',
    personalScore: 320,
    submissionIds: ['sub-7', 'sub-8'],
    tasksCompleted: ['task-1', 'task-2'],
    isActive: true,
    joinedAt: new Date('2025-12-16T09:00:00Z'),
  },
  // Team: Bavarian Hunters
  {
    id: 'team-bavarians-user-diana',
    teamId: 'team-bavarians',
    userId: 'user-diana',
    eventId: 'munich-christmas-2025',
    tenantId: 'esn-munich',
    displayName: 'Diana Davis',
    role: 'owner',
    personalScore: 520,
    submissionIds: ['sub-9', 'sub-10', 'sub-11'],
    tasksCompleted: ['task-5', 'task-6', 'task-7'],
    isActive: true,
    joinedAt: new Date('2025-12-18T10:00:00Z'),
  },
  {
    id: 'team-bavarians-user-emma',
    teamId: 'team-bavarians',
    userId: 'user-emma',
    eventId: 'munich-christmas-2025',
    tenantId: 'esn-munich',
    displayName: 'Emma Evans',
    role: 'member',
    personalScore: 380,
    submissionIds: ['sub-12', 'sub-13'],
    tasksCompleted: ['task-6', 'task-7'],
    isActive: true,
    joinedAt: new Date('2025-12-18T11:00:00Z'),
  },
];

const TASKS: SeedTask[] = [
  // Berlin Event Tasks
  {
    id: 'task-1',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-2025',
    title: 'Brandenburg Gate Photo',
    description: 'Take a creative photo at the Brandenburg Gate',
    type: 'PHOTO',
    points: 100,
    difficulty: 'easy',
    isActive: true,
    order: 1,
    coordinates: { lat: 52.5163, lng: 13.3777 },
    radius: 30,
    requiresPhoto: true,
    requiresVideo: false,
    requiresText: false,
  },
  {
    id: 'task-2',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-2025',
    title: 'Berlin History Quiz',
    description: 'In which year did the Berlin Wall fall?',
    type: 'QUIZ',
    points: 50,
    difficulty: 'easy',
    isActive: true,
    order: 2,
    requiresPhoto: false,
    requiresVideo: false,
    requiresText: false,
    quizCorrectAnswer: '1989',
    quizOptions: ['1987', '1989', '1991', '1993'],
  },
  {
    id: 'task-3',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-2025',
    title: 'Reichstag Visit',
    description: 'Visit the Reichstag building',
    type: 'GPS_LOCATION',
    points: 150,
    difficulty: 'medium',
    isActive: true,
    order: 3,
    coordinates: { lat: 52.5186, lng: 13.3761 },
    radius: 50,
    requiresPhoto: false,
    requiresVideo: false,
    requiresText: false,
  },
  {
    id: 'task-4',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-2025',
    title: 'TV Tower Challenge',
    description: 'Take a photo with the TV Tower in the background',
    type: 'PHOTO',
    points: 200,
    difficulty: 'hard',
    isActive: true,
    order: 4,
    coordinates: { lat: 52.5208, lng: 13.4094 },
    radius: 30,
    requiresPhoto: true,
    requiresVideo: false,
    requiresText: false,
  },
  // Munich Event Tasks
  {
    id: 'task-5',
    tenantId: 'esn-munich',
    eventId: 'munich-christmas-2025',
    title: 'Marienplatz Market',
    description: 'Find and photograph the Christmas market at Marienplatz',
    type: 'PHOTO',
    points: 100,
    difficulty: 'easy',
    isActive: true,
    order: 1,
    coordinates: { lat: 48.1374, lng: 11.5755 },
    radius: 30,
    requiresPhoto: true,
    requiresVideo: false,
    requiresText: false,
  },
  {
    id: 'task-6',
    tenantId: 'esn-munich',
    eventId: 'munich-christmas-2025',
    title: 'Munich Culture Quiz',
    description: 'What is the name of Munich\'s famous beer festival?',
    type: 'QUIZ',
    points: 50,
    difficulty: 'easy',
    isActive: true,
    order: 2,
    requiresPhoto: false,
    requiresVideo: false,
    requiresText: false,
    quizCorrectAnswer: 'Oktoberfest',
    quizOptions: ['Oktoberfest', 'Winterfest', 'Beerfest', 'Christkindl'],
  },
  {
    id: 'task-7',
    tenantId: 'esn-munich',
    eventId: 'munich-christmas-2025',
    title: 'Nymphenburg Palace',
    description: 'Visit the stunning Nymphenburg Palace',
    type: 'GPS_LOCATION',
    points: 150,
    difficulty: 'medium',
    isActive: true,
    order: 3,
    coordinates: { lat: 48.1580, lng: 11.5032 },
    radius: 50,
    requiresPhoto: false,
    requiresVideo: false,
    requiresText: false,
  },
];

const SUBMISSIONS: SeedSubmission[] = [
  {
    id: 'sub-1',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-2025',
    teamId: 'team-explorers',
    userId: 'user-alice',
    taskId: 'task-1',
    type: 'photo',
    status: 'approved',
    pointsAwarded: 100,
    submittedAt: new Date('2025-12-15T12:30:00Z'),
    photoUrl: 'https://example.com/photos/alice-brandenburg.jpg',
  },
  {
    id: 'sub-2',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-2025',
    teamId: 'team-explorers',
    userId: 'user-alice',
    taskId: 'task-2',
    type: 'quiz',
    status: 'approved',
    pointsAwarded: 50,
    submittedAt: new Date('2025-12-15T13:00:00Z'),
    answer: '1989',
  },
  {
    id: 'sub-3',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-2025',
    teamId: 'team-explorers',
    userId: 'user-alice',
    taskId: 'task-3',
    type: 'location',
    status: 'approved',
    pointsAwarded: 150,
    submittedAt: new Date('2025-12-15T14:30:00Z'),
  },
  {
    id: 'sub-4',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-2025',
    teamId: 'team-explorers',
    userId: 'user-bob',
    taskId: 'task-2',
    type: 'quiz',
    status: 'approved',
    pointsAwarded: 50,
    submittedAt: new Date('2025-12-15T13:15:00Z'),
    answer: '1989',
  },
  {
    id: 'sub-5',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-2025',
    teamId: 'team-explorers',
    userId: 'user-bob',
    taskId: 'task-4',
    type: 'photo',
    status: 'pending',
    pointsAwarded: 0,
    submittedAt: new Date('2025-12-15T15:00:00Z'),
    photoUrl: 'https://example.com/photos/bob-tvtower.jpg',
  },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedCollection<T>(
  collectionName: string,
  data: T[],
  getId: (item: T) => string,
  transform: (item: T) => any
): Promise<void> {
  console.log(`\n📝 Seeding ${collectionName}...`);
  
  const batch = db.batch();
  
  for (const item of data) {
    const docId = getId(item);
    const docRef = db.collection(collectionName).doc(docId);
    const docData = transform(item);
    batch.set(docRef, docData);
  }
  
  await batch.commit();
  console.log(`✅ Created ${data.length} ${collectionName}`);
}

function addTimestamps(data: any): any {
  const now = admin.firestore.Timestamp.now();
  return {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
}

function convertDatesToTimestamps(obj: any): any {
  const result = { ...obj };
  
  for (const key in result) {
    if (result[key] instanceof Date) {
      result[key] = admin.firestore.Timestamp.fromDate(result[key]);
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = convertDatesToTimestamps(result[key]);
    }
  }
  
  return result;
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedEmulator(): Promise<void> {
  console.log('🌱 Starting Firebase Emulator Seed Script\n');
  console.log('=' .repeat(60));
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Emulator: ${EMULATOR_HOST}:${EMULATOR_PORT}`);
  console.log('=' .repeat(60));

  try {
    // ========================================================================
    // CREATE ADMIN USER IN FIREBASE AUTH
    // ========================================================================
    console.log('\n👤 Creating Admin User...');
    
    const adminEmail = 'admin@test.com';
    const adminPassword = 'admin123';
    const adminDisplayName = 'Test Admin';
    
    let adminUser;
    try {
      // Try to get existing user
      adminUser = await admin.auth().getUserByEmail(adminEmail);
      console.log(`   ✅ Admin user already exists: ${adminUser.uid}`);
    } catch (error) {
      // User doesn't exist, create it
      adminUser = await admin.auth().createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: adminDisplayName,
        emailVerified: true,
      });
      console.log(`   ✅ Created admin user: ${adminUser.uid}`);
    }
    
    // Set custom claims for superadmin role
    await admin.auth().setCustomUserClaims(adminUser.uid, {
      role: 'superadmin',
      tenantIds: [],
    });
    console.log(`   ✅ Set custom claims: role=superadmin`);
    
    // Create User document in Firestore (unified User type)
    const userRef = db.collection('users').doc(adminUser.uid);
    await userRef.set({
      id: adminUser.uid,
      email: adminEmail,
      displayName: adminDisplayName,
      photoURL: null,
      accountType: 'linked', // Admin is linked account
      role: 'superadmin',
      managedTenantIds: [],
      isActive: true,
      // Initialize player fields with defaults (admin can play!)
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
        termsAcceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        privacyAcceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: null,
      },
      tenantId: 'global',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`   ✅ Created User document (unified type)`);
    console.log(`   📧 Login: ${adminEmail} / ${adminPassword}`);
    
    // ========================================================================
    // SEED COLLECTIONS
    // ========================================================================
    
    // Seed Tenants
    await seedCollection(
      'tenants',
      TENANTS,
      (t) => t.id,
      (t) => addTimestamps(convertDatesToTimestamps(t))
    );

    // Seed Events
    await seedCollection(
      'events',
      EVENTS,
      (e) => e.id,
      (e) => addTimestamps(convertDatesToTimestamps(e))
    );

    // Seed Users
    await seedCollection(
      'users',
      USERS,
      (u) => u.id,
      (u) => addTimestamps(convertDatesToTimestamps(u))
    );

    // Seed Teams
    await seedCollection(
      'teams',
      TEAMS,
      (t) => t.id,
      (t) => ({
        ...addTimestamps(convertDatesToTimestamps(t)),
        inventory: [],
      })
    );

    // Seed Team Members
    await seedCollection(
      'teamMembers',
      TEAM_MEMBERS,
      (tm) => tm.id,
      (tm) => addTimestamps(convertDatesToTimestamps(tm))
    );

    // Seed Tasks
    await seedCollection(
      'tasks',
      TASKS,
      (t) => t.id,
      (t) => addTimestamps(convertDatesToTimestamps(t))
    );

    // Seed Submissions
    await seedCollection(
      'submissions',
      SUBMISSIONS,
      (s) => s.id,
      (s) => addTimestamps(convertDatesToTimestamps(s))
    );

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETED SUCCESSFULLY!\n');
    console.log('📊 Summary:');
    console.log(`   • 1 admin user (superadmin)`);
    console.log(`   • ${TENANTS.length} tenants`);
    console.log(`   • ${EVENTS.length} events`);
    console.log(`   • ${USERS.length} users`);
    console.log(`   • ${TEAMS.length} teams`);
    console.log(`   • ${TEAM_MEMBERS.length} team members`);
    console.log(`   • ${TASKS.length} tasks`);
    console.log(`   • ${SUBMISSIONS.length} submissions`);
    console.log('\n🎮 Ready for testing!');
    console.log('   • Emulator UI: http://127.0.0.1:4000');
    console.log('   • Your App: http://localhost:5173');
    console.log('   • Admin Portal: http://localhost:5173/admin/login');
    console.log('\n🔐 Admin Credentials:');
    console.log('   • Email: admin@test.com');
    console.log('   • Password: admin123');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// RUN SCRIPT
// ============================================================================

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

// Run seed
seedEmulator()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
