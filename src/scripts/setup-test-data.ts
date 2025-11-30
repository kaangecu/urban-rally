/**
 * Test Data Setup Script
 * 
 * Populates Firebase Firestore with test data for development:
 * - 1 Tenant (ESN Berlin)
 * - 1 Event (Welcome Week 2025)
 * - 1 Test Team (Access Code: BERLIN2025)
 * - 15 Tasks across Berlin
 * 
 * Usage: npm run setup-test-data
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration - matches your .env file
const firebaseConfig = {
  apiKey: 'AIzaSyDP4KYxYee3DR7dfTKg0NQsEj2SmPI6LQY',
  authDomain: 'urban-rally-539bd.firebaseapp.com',
  projectId: 'urban-rally-539bd',
  storageBucket: 'urban-rally-539bd.firebasestorage.app',
  messagingSenderId: '677929293692',
  appId: '1:677929293692:web:68a2c5424174891cdbb6f9',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupTestData() {
  console.log('🚀 Starting test data setup...\n');

  try {
    // 1. Create Tenant
    console.log('📦 Creating tenant...');
    await setDoc(doc(db, 'tenants', 'esn-berlin'), {
      id: 'esn-berlin',
      name: 'ESN Berlin',
      primaryColor: '#1a56db',
      secondaryColor: '#7e3af2',
      logoUrl: '',
      website: 'https://esn-berlin.de',
      contactEmail: 'info@esn-berlin.de',
      subscriptionTier: 'premium',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ Tenant created: ESN Berlin\n');

    // 2. Create Event
    console.log('📅 Creating event...');
    await setDoc(doc(db, 'events', 'welcome-week-2025'), {
      id: 'welcome-week-2025',
      tenantId: 'esn-berlin',
      name: 'Welcome Week 2025',
      description: 'Explore Berlin and complete challenges to earn points!',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-09-07'),
      isActive: true,
      maxTeams: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ Event created: Welcome Week 2025\n');

    // 3. Create Test Team
    console.log('👥 Creating test team...');
    await setDoc(doc(db, 'teams', 'team-test-01'), {
      id: 'team-test-01',
      tenantId: 'esn-berlin',
      eventId: 'welcome-week-2025',
      accessCode: 'BERLIN2025',
      teamName: 'The Explorers',
      memberCount: 4,
      score: 0,
      completedTaskIds: [],
      purchasedHintIds: [],
      inventory: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ Team created with access code: BERLIN2025\n');

    // 4. Create Tasks
    console.log('📍 Creating tasks...');
    
    const tasks = [
      // GPS Location Tasks
      {
        id: 'task-brandenburg-gate',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '🏛️ Brandenburg Gate',
        description: 'Visit the iconic Brandenburg Gate, Berlin\'s most famous landmark and symbol of German reunification.',
        type: 'GPS',
        points: 50,
        difficulty: 'easy',
        coordinates: { lat: 52.5163, lng: 13.3777 },
        radius: 30,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-reichstag',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '🏛️ Reichstag Building',
        description: 'Find the historic Reichstag building, home to the German parliament. Don\'t miss the glass dome!',
        type: 'GPS',
        points: 80,
        difficulty: 'medium',
        coordinates: { lat: 52.5186, lng: 13.3761 },
        radius: 30,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab3',
        isActive: true,
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-checkpoint-charlie',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '🛂 Checkpoint Charlie',
        description: 'Visit the famous Cold War border crossing point between East and West Berlin.',
        type: 'GPS',
        points: 50,
        difficulty: 'easy',
        coordinates: { lat: 52.5075, lng: 13.3903 },
        radius: 30,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047',
        isActive: true,
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-victory-column',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '🏆 Victory Column',
        description: 'Find the Siegessäule (Victory Column) in the heart of Tiergarten park.',
        type: 'GPS',
        points: 60,
        difficulty: 'medium',
        coordinates: { lat: 52.5145, lng: 13.3501 },
        radius: 30,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1587564441024-e48a8a90e5d1',
        isActive: true,
        order: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Photo Tasks
      {
        id: 'task-museum-island',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '🏛️ Museum Island',
        description: 'Take a creative photo at Museum Island, a UNESCO World Heritage site with five world-class museums.',
        type: 'PHOTO',
        points: 75,
        difficulty: 'medium',
        coordinates: { lat: 52.5211, lng: 13.3987 },
        radius: 50,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1566404791232-af9fe0ae8f8b',
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-east-side-gallery',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '🎨 East Side Gallery',
        description: 'Visit the longest remaining section of the Berlin Wall, now covered in artistic murals.',
        type: 'PHOTO',
        points: 60,
        difficulty: 'easy',
        coordinates: { lat: 52.5058, lng: 13.4394 },
        radius: 50,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1559564484-e48ea1e2f80d',
        isActive: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-tv-tower',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '📡 TV Tower',
        description: 'Capture the iconic Fernsehturm (TV Tower), Berlin\'s tallest structure at 368 meters.',
        type: 'PHOTO',
        points: 40,
        difficulty: 'easy',
        coordinates: { lat: 52.5208, lng: 13.4094 },
        radius: 40,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047',
        isActive: true,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-berlin-cathedral',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '⛪ Berlin Cathedral',
        description: 'Photograph the magnificent Berlin Cathedral (Berliner Dom) on Museum Island.',
        type: 'PHOTO',
        points: 70,
        difficulty: 'medium',
        coordinates: { lat: 52.5191, lng: 13.4013 },
        radius: 30,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab3',
        isActive: true,
        order: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-gendarmenmarkt',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '🎭 Gendarmenmarkt',
        description: 'Visit Gendarmenmarkt, considered one of the most beautiful squares in Europe.',
        type: 'PHOTO',
        points: 65,
        difficulty: 'medium',
        coordinates: { lat: 52.5134, lng: 13.3926 },
        radius: 30,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc',
        isActive: true,
        order: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-currywurst',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '🌭 Currywurst Challenge',
        description: 'Try authentic Berlin Currywurst and take a photo of your meal!',
        type: 'PHOTO',
        points: 45,
        difficulty: 'easy',
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc',
        isActive: true,
        order: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-street-art',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '🎨 Street Art Hunt',
        description: 'Find and photograph an interesting piece of street art anywhere in Berlin.',
        type: 'PHOTO',
        points: 55,
        difficulty: 'easy',
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1559564484-e48ea1e2f80d',
        isActive: true,
        order: 11,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-public-transport',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '🚇 Public Transport Pro',
        description: 'Take a selfie on Berlin\'s U-Bahn, S-Bahn, or tram.',
        type: 'PHOTO',
        points: 30,
        difficulty: 'easy',
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047',
        isActive: true,
        order: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-coffee-shop',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '☕ Coffee Shop Discovery',
        description: 'Find a cozy local coffee shop and share your discovery with a photo.',
        type: 'PHOTO',
        points: 40,
        difficulty: 'easy',
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab3',
        isActive: true,
        order: 13,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Quiz Task
      {
        id: 'task-trivia',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '🧠 Berlin Trivia',
        description: 'Test your knowledge about Berlin\'s history and culture!',
        type: 'QUIZ',
        points: 35,
        difficulty: 'easy',
        requiresPhoto: false,
        requiresVideo: false,
        requiresText: true,
        imageUrl: 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc',
        isActive: true,
        order: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Video Task
      {
        id: 'task-team-video',
        tenantId: 'esn-berlin',
        eventId: 'welcome-week-2025',
        title: '🎥 Team Introduction',
        description: 'Record a creative 30-second team introduction video. Be creative!',
        type: 'VIDEO',
        points: 100,
        difficulty: 'hard',
        requiresPhoto: false,
        requiresVideo: true,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047',
        isActive: true,
        order: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Create all tasks
    for (const task of tasks) {
      await setDoc(doc(db, 'tasks', task.id), task);
      console.log(`  ✅ ${task.title}`);
    }

    console.log(`\n✅ Created ${tasks.length} tasks\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Test Environment Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Summary:');
    console.log('  • Tenant: ESN Berlin');
    console.log('  • Event: Welcome Week 2025');
    console.log('  • Team Access Code: BERLIN2025');
    console.log('  • Tasks Created: 15');
    console.log('  • Total Points: 895\n');
    console.log('🚀 Next Steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Login with code: BERLIN2025');
    console.log('  3. Start testing!\n');
    console.log('📚 Documentation:');
    console.log('  • docs/TEST_ENV_SETUP.md');
    console.log('  • docs/TEST_ENV_COMPLETE.md\n');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  }
}

// Run the setup
setupTestData()
  .then(() => {
    console.log('✅ Script completed successfully');
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    throw error;
  });
