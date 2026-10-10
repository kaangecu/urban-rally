import { Timestamp } from 'firebase-admin/firestore';
import { db } from './lib/admin';

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
  
  try {
    // Use the event ID as the document ID
    await db.collection('events').doc(event.id).set(event);
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
