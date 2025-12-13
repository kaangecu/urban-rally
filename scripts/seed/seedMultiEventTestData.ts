/**
 * Seed Script: Create Test Data for Multi-Event Testing
 * 
 * This script creates test events and teams to validate the multi-event
 * authentication system:
 * - Creates 3 events across 2 tenants
 * - Creates multiple teams per event
 * - Sets up test scenarios for user flows
 * 
 * Run with: npx tsx scripts/seed/seedMultiEventTestData.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch, Timestamp, connectFirestoreEmulator } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase config
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

// Test data structures
interface TestEvent {
  id: string;
  tenantId: string;
  tenantName: string;
  eventName: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

interface TestTeam {
  id: string;
  tenantId: string;
  eventId: string;
  teamName: string;
  accessCode: string;
  maxSize: number;
  memberCount: number;
  description: string;
  isActive: boolean;
}

// Test Events Data
const testEvents: TestEvent[] = [
  {
    id: 'berlin-winter-hunt-2025',
    tenantId: 'esn-berlin',
    tenantName: 'ESN Berlin',
    eventName: 'Winter Scavenger Hunt 2025',
    description: 'Explore Berlin in winter! Complete challenges across the city.',
    startDate: new Date('2025-12-15'),
    endDate: new Date('2025-12-22'),
    isActive: true,
  },
  {
    id: 'munich-christmas-rally-2025',
    tenantId: 'esn-munich',
    tenantName: 'ESN Munich',
    eventName: 'Christmas City Rally 2025',
    description: 'Discover Munich during the Christmas markets season.',
    startDate: new Date('2025-12-18'),
    endDate: new Date('2025-12-25'),
    isActive: true,
  },
  {
    id: 'berlin-new-year-2026',
    tenantId: 'esn-berlin',
    tenantName: 'ESN Berlin',
    eventName: 'New Year City Challenge 2026',
    description: 'Ring in the new year with an epic city-wide scavenger hunt!',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-07'),
    isActive: true,
  },
];

// Test Teams Data
const testTeams: TestTeam[] = [
  // Event 1: Berlin Winter Hunt (3 teams)
  {
    id: 'berlin-winter-team-red',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-hunt-2025',
    teamName: 'Team Red Explorers',
    accessCode: 'REDWTR25',
    maxSize: 8,
    memberCount: 0,
    description: 'The adventurous red team ready to conquer Berlin!',
    isActive: true,
  },
  {
    id: 'berlin-winter-team-blue',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-hunt-2025',
    teamName: 'Team Blue Wanderers',
    accessCode: 'BLUWTR25',
    maxSize: 8,
    memberCount: 0,
    description: 'Cool as ice, hot on challenges - Team Blue!',
    isActive: true,
  },
  {
    id: 'berlin-winter-team-green',
    tenantId: 'esn-berlin',
    eventId: 'berlin-winter-hunt-2025',
    teamName: 'Team Green Giants',
    accessCode: 'GRNWTR25',
    maxSize: 6,
    memberCount: 0,
    description: 'Eco-friendly explorers taking on the city!',
    isActive: true,
  },

  // Event 2: Munich Christmas Rally (3 teams)
  {
    id: 'munich-christmas-team-gold',
    tenantId: 'esn-munich',
    eventId: 'munich-christmas-rally-2025',
    teamName: 'Team Golden Stars',
    accessCode: 'GOLDXMS25',
    maxSize: 10,
    memberCount: 0,
    description: 'Shining bright through the Christmas markets!',
    isActive: true,
  },
  {
    id: 'munich-christmas-team-silver',
    tenantId: 'esn-munich',
    eventId: 'munich-christmas-rally-2025',
    teamName: 'Team Silver Bells',
    accessCode: 'SLVRXMS25',
    maxSize: 10,
    memberCount: 0,
    description: 'Ringing in the holiday spirit with every challenge!',
    isActive: true,
  },
  {
    id: 'munich-christmas-team-red',
    tenantId: 'esn-munich',
    eventId: 'munich-christmas-rally-2025',
    teamName: 'Team Santa Squad',
    accessCode: 'SANTAXMS25',
    maxSize: 8,
    memberCount: 0,
    description: 'Ho ho ho! The jolliest team in Munich!',
    isActive: true,
  },

  // Event 3: Berlin New Year (4 teams)
  {
    id: 'berlin-newyear-team-fireworks',
    tenantId: 'esn-berlin',
    eventId: 'berlin-new-year-2026',
    teamName: 'Team Fireworks',
    accessCode: 'FIRENY26',
    maxSize: 12,
    memberCount: 0,
    description: 'Starting 2026 with a bang!',
    isActive: true,
  },
  {
    id: 'berlin-newyear-team-champagne',
    tenantId: 'esn-berlin',
    eventId: 'berlin-new-year-2026',
    teamName: 'Team Champagne',
    accessCode: 'CHAMPNY26',
    maxSize: 12,
    memberCount: 0,
    description: 'Popping bottles and completing challenges!',
    isActive: true,
  },
  {
    id: 'berlin-newyear-team-midnight',
    tenantId: 'esn-berlin',
    eventId: 'berlin-new-year-2026',
    teamName: 'Team Midnight',
    accessCode: 'MIDNY26',
    maxSize: 10,
    memberCount: 0,
    description: 'Counting down to victory!',
    isActive: true,
  },
  {
    id: 'berlin-newyear-team-resolution',
    tenantId: 'esn-berlin',
    eventId: 'berlin-new-year-2026',
    teamName: 'Team Resolution',
    accessCode: 'RESOLNY26',
    maxSize: 8,
    memberCount: 0,
    description: 'Our resolution: Win this scavenger hunt!',
    isActive: true,
  },
];

async function seedEvents(): Promise<number> {
  console.log('📅 Seeding Events...\n');
  
  let count = 0;
  const batch = writeBatch(db);

  for (const event of testEvents) {
    const eventRef = doc(db, 'events', event.id);
    
    batch.set(eventRef, {
      id: event.id,
      tenantId: event.tenantId,
      eventName: event.eventName,
      description: event.description,
      startDate: Timestamp.fromDate(event.startDate),
      endDate: Timestamp.fromDate(event.endDate),
      isActive: event.isActive,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Event: ${event.eventName} (${event.tenantId})`);
    console.log(`   ID: ${event.id}`);
    console.log(`   Dates: ${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`);
    console.log(`   Status: ${event.isActive ? '🟢 Active' : '🔴 Ended'}\n`);
    
    count++;
  }

  await batch.commit();
  console.log(`✨ Created ${count} events\n`);
  
  return count;
}

async function seedTeams(): Promise<number> {
  console.log('👥 Seeding Teams...\n');
  
  let count = 0;
  const batch = writeBatch(db);

  for (const team of testTeams) {
    const teamRef = doc(db, 'teams', team.id);
    
    batch.set(teamRef, {
      id: team.id,
      tenantId: team.tenantId,
      eventId: team.eventId,
      teamName: team.teamName,
      accessCode: team.accessCode,
      maxSize: team.maxSize,
      memberCount: team.memberCount,
      score: 0,
      tasksCompleted: 0,
      description: team.description,
      isActive: team.isActive,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Team: ${team.teamName}`);
    console.log(`   Event: ${team.eventId}`);
    console.log(`   Access Code: ${team.accessCode}`);
    console.log(`   Max Size: ${team.maxSize}\n`);
    
    count++;
  }

  await batch.commit();
  console.log(`✨ Created ${count} teams\n`);
  
  return count;
}

async function printTestingSummary(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 MULTI-EVENT TESTING SUMMARY');
  console.log('='.repeat(60) + '\n');

  console.log('📊 Test Data Created:\n');
  
  // Group teams by event
  const eventTeamsMap = new Map<string, TestTeam[]>();
  testTeams.forEach(team => {
    if (!eventTeamsMap.has(team.eventId)) {
      eventTeamsMap.set(team.eventId, []);
    }
    eventTeamsMap.get(team.eventId)!.push(team);
  });

  // Print each event with its teams
  testEvents.forEach(event => {
    console.log(`\n🎪 Event: ${event.eventName}`);
    console.log(`   Tenant: ${event.tenantName} (${event.tenantId})`);
    console.log(`   Event ID: ${event.id}`);
    console.log(`   Dates: ${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`);
    console.log(`   Teams:`);
    
    const teams = eventTeamsMap.get(event.id) || [];
    teams.forEach(team => {
      console.log(`     • ${team.teamName} - Code: ${team.accessCode} (Max: ${team.maxSize})`);
    });
  });

  console.log('\n' + '-'.repeat(60));
  console.log('🧪 TEST SCENARIOS:');
  console.log('-'.repeat(60) + '\n');

  console.log('1️⃣  Multi-Event Participation:');
  console.log('   - Join Team Red in Berlin Winter Hunt');
  console.log('   - Join Team Golden Stars in Munich Christmas Rally');
  console.log('   - Join Team Fireworks in Berlin New Year');
  console.log('   ✅ User should be in 3 different teams across 3 events\n');

  console.log('2️⃣  1-Team-Per-Event Validation:');
  console.log('   - Join Team Red in Berlin Winter Hunt');
  console.log('   - Try to join Team Blue in same event');
  console.log('   ❌ Should be blocked (already in Team Red)\n');

  console.log('3️⃣  Event Switching:');
  console.log('   - Navigate to Berlin Winter Hunt dashboard');
  console.log('   - Use EventSwitcher to switch to Munich Christmas Rally');
  console.log('   ✅ Should see different team and context\n');

  console.log('4️⃣  Cross-Tenant Testing:');
  console.log('   - Join teams in both ESN Berlin and ESN Munich');
  console.log('   - Verify tenant isolation (can\'t see other tenant\'s data)');
  console.log('   ✅ Should maintain separate contexts\n');

  console.log('5️⃣  Recovery Code Testing:');
  console.log('   - Generate recovery code in Account Settings');
  console.log('   - Logout and login with recovery code');
  console.log('   ✅ Should restore all event memberships\n');

  console.log('-'.repeat(60));
  console.log('📝 TESTING URLS:');
  console.log('-'.repeat(60) + '\n');

  console.log('Login Page:');
  console.log('   http://localhost:5173/login\n');

  console.log('Event Selector:');
  console.log('   http://localhost:5173/events\n');

  console.log('Browse Teams (Berlin Winter):');
  console.log('   http://localhost:5173/tenant/esn-berlin/event/berlin-winter-hunt-2025/teams\n');

  console.log('Browse Teams (Munich Christmas):');
  console.log('   http://localhost:5173/tenant/esn-munich/event/munich-christmas-rally-2025/teams\n');

  console.log('Browse Teams (Berlin New Year):');
  console.log('   http://localhost:5173/tenant/esn-berlin/event/berlin-new-year-2026/teams\n');

  console.log('-'.repeat(60));
  console.log('🔑 TEAM ACCESS CODES:');
  console.log('-'.repeat(60) + '\n');

  testTeams.forEach(team => {
    console.log(`${team.teamName.padEnd(30)} → ${team.accessCode}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  try {
    console.log('\n🚀 Starting Multi-Event Test Data Seeding...\n');
    console.log('='.repeat(60) + '\n');

    const eventCount = await seedEvents();
    const teamCount = await seedTeams();

    await printTestingSummary();

    console.log('✨ Seeding Complete!');
    console.log(`   📅 Events created: ${eventCount}`);
    console.log(`   👥 Teams created: ${teamCount}\n`);
    console.log('🎉 Ready for multi-event testing!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Dry run mode
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - Showing what would be created:\n');
  printTestingSummary().then(() => {
    console.log('\nRemove --dry-run flag to execute seeding\n');
    process.exit(0);
  });
} else {
  main();
}
