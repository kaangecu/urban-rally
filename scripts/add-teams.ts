import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import * as dotenv from 'dotenv';

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

// Validate configuration
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please ensure your .env file contains all required variables.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

interface Team {
  tenantId: string;
  eventId: string;
  accessCode: string;
  score: number;
  completedTaskIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const teams: Omit<Team, 'createdAt' | 'updatedAt'>[] = [
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    accessCode: 'ARCTIC2024',
    score: 0,
    completedTaskIds: [],
    isActive: true,
  },
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    accessCode: 'WINTER2024',
    score: 0,
    completedTaskIds: [],
    isActive: true,
  },
];

async function addTeams() {
  console.log('🚀 Starting to add teams to Firestore...\n');

  try {
    // Authenticate with Firebase
    console.log('🔐 Authenticating with Firebase...');
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Authenticated successfully! UID:', userCredential.user.uid);
    console.log();

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { team: string; error: string }[],
    };

    for (const team of teams) {
      try {
        const now = Timestamp.now();
        const teamData = {
          ...team,
          createdAt: now,
          updatedAt: now,
        };

        const docRef = await addDoc(collection(db, 'teams'), teamData);
        console.log(`✅ Added team with access code: ${team.accessCode} - ID: ${docRef.id}`);
        results.success++;
      } catch (error) {
        console.error(`❌ Failed to add team with code "${team.accessCode}":`, error);
        results.failed++;
        results.errors.push({
          team: team.accessCode,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully added: ${results.success} teams`);
    console.log(`   ❌ Failed: ${results.failed} teams`);

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(({ team, error }) => {
        console.log(`   - ${team}: ${error}`);
      });
    }

    console.log('\n🎮 Test Teams Created:');
    console.log('   1. Team with Access Code: ARCTIC2024');
    console.log('   2. Team with Access Code: WINTER2024');
    console.log('\n💡 You can now login with these access codes to test the app!');

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTeams();
