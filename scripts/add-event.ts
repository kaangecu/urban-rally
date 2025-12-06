import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc, Timestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Validate configuration
if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase configuration missing!');
  console.error('   Please create a .env file with your Firebase credentials.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Authenticate with Firebase
async function authenticate() {
  try {
    console.log('🔐 Authenticating with Firebase...');
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Authenticated successfully! UID:', userCredential.user.uid);
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    return false;
  }
}

// Event data
const event = {
  tenantId: 'esn-berlin',
  id: 'winter-scavenger-hunt',
  name: 'Winter Scavenger Hunt',
  description: 'Explore Berlin this winter and complete exciting challenges!',
  
  // Timing
  startDate: Timestamp.fromDate(new Date('2024-12-01T00:00:00Z')),
  endDate: Timestamp.fromDate(new Date('2025-03-31T23:59:59Z')),
  
  // Location
  location: {
    city: 'Berlin',
    country: 'Germany',
    bounds: {
      north: 52.6755,
      south: 52.3382,
      east: 13.7614,
      west: 13.0883
    }
  },
  
  // Settings
  maxTeams: 100,
  minTeamSize: 2,
  maxTeamSize: 6,
  
  // Status
  isActive: true,
  isPublished: true,
  
  // Metadata
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  createdBy: 'setup-script'
};

async function addEventToFirestore() {
  console.log('🚀 Starting to add event to Firestore...\n');
  
  // Authenticate first
  const authenticated = await authenticate();
  if (!authenticated) {
    console.error('❌ Cannot proceed without authentication');
    return;
  }
  
  console.log('');

  try {
    // Use setDoc with the event ID as the document ID
    await setDoc(doc(db, 'events', event.id), event);
    console.log(`✅ Added event: "${event.name}" - ID: ${event.id}`);
    
    console.log(`\n📋 Event Details:`);
    console.log(`   Name: ${event.name}`);
    console.log(`   Tenant: ${event.tenantId}`);
    console.log(`   ID: ${event.id}`);
    console.log(`   Location: ${event.location.city}, ${event.location.country}`);
    console.log(`   Start: ${event.startDate.toDate().toLocaleDateString()}`);
    console.log(`   End: ${event.endDate.toDate().toLocaleDateString()}`);
    console.log(`   Max Teams: ${event.maxTeams}`);
    console.log(`   Team Size: ${event.minTeamSize}-${event.maxTeamSize} members`);
    console.log(`   Status: ${event.isActive ? 'Active' : 'Inactive'}`);
    
  } catch (error) {
    console.error(`❌ Error adding event:`, error);
  }
}

// Run the script
addEventToFirestore()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
