/**
 * Migration Script: Add Event Codes to Existing Events
 * 
 * This script:
 * 1. Fetches all events from Firestore
 * 2. Generates unique event codes for events without one
 * 3. Updates Firestore with the new event codes
 * 
 * Run with: npm run migrate:event-codes
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  Timestamp,
  query,
  where 
} from 'firebase/firestore';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

// Firebase config from environment
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

interface EventDoc {
  id: string;
  name: string;
  eventCode?: string;
  tenantId: string;
  isActive: boolean;
  [key: string]: any;
}

/**
 * Generate event code from event name (standalone version for migration)
 */
function generateEventCodeFromName(eventName: string): string {
  // Remove common words and special chars
  const cleaned = eventName
    .replace(/\b(the|and|or|of|in|at|to|for|welcome|week|hunt|rally)\b/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim();

  // Extract year if present
  const yearMatch = eventName.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : '';

  // Get significant words
  const words = cleaned.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) {
    return year || 'EVENT';
  }

  // Strategy: First word + year, or first 2 words + year
  let code = '';
  
  if (words[0].length >= 4) {
    code = words[0];
  } else if (words.length >= 2) {
    code = words[0] + words[1].slice(0, 3);
  } else {
    code = words[0];
  }
  
  code = code + year;
  code = code.toUpperCase();
  
  // Ensure length is between 6-12
  if (code.length < 6) {
    code = code.padEnd(6, 'X');
  } else if (code.length > 12) {
    code = code.slice(0, 12);
  }
  
  return code;
}

/**
 * Check if event code is available (standalone version for migration)
 */
async function isEventCodeAvailable(code: string): Promise<boolean> {
  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, where('eventCode', '==', code.toUpperCase()));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

/**
 * Generate unique event code (standalone version for migration)
 */
async function generateUniqueEventCode(eventName: string): Promise<string> {
  let baseCode = generateEventCodeFromName(eventName);
  let code = baseCode;
  let suffix = 1;

  // Keep trying with numeric suffixes until we find an available code
  while (!(await isEventCodeAvailable(code))) {
    suffix++;
    const suffixStr = suffix.toString();
    code = baseCode.slice(0, 12 - suffixStr.length) + suffixStr;
  }

  return code;
}

async function migrateEventCodes() {
  console.log('🚀 Starting Event Code Migration...\n');

  try {
    // Fetch all events
    const eventsRef = collection(db, 'events');
    const eventsSnapshot = await getDocs(eventsRef);
    const totalEvents = eventsSnapshot.size;

    console.log(`📊 Found ${totalEvents} events in database\n`);

    if (totalEvents === 0) {
      console.log('✅ No events found. Migration complete.');
      return;
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each event
    for (const docSnapshot of eventsSnapshot.docs) {
      const eventData = docSnapshot.data() as EventDoc;
      const eventId = docSnapshot.id;
      const eventName = eventData.name || 'Unnamed Event';

      // Skip if event already has a code
      if (eventData.eventCode) {
        console.log(`⏭️  Skipping "${eventName}" (already has code: ${eventData.eventCode})`);
        skipped++;
        continue;
      }

      try {
        // Generate unique event code
        console.log(`🔧 Generating code for "${eventName}"...`);
        const eventCode = await generateUniqueEventCode(eventName);

        // Update Firestore
        const eventDocRef = doc(db, 'events', eventId);
        await updateDoc(eventDocRef, {
          eventCode: eventCode,
          updatedAt: Timestamp.now(),
        });

        console.log(`✅ Updated "${eventName}" with code: ${eventCode}\n`);
        updated++;

      } catch (error: any) {
        console.error(`❌ Error updating "${eventName}":`, error.message);
        errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Total Events:     ${totalEvents}`);
    console.log(`✅ Updated:       ${updated}`);
    console.log(`⏭️  Skipped:       ${skipped} (already had codes)`);
    console.log(`❌ Errors:        ${errors}`);
    console.log('='.repeat(50) + '\n');

    if (errors === 0) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with some errors. Please review above.');
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Clean up
    process.exit(0);
  }
}

// Run migration
migrateEventCodes().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
