/**
 * Test Data Setup Script
 * 
 * Populates Firebase Firestore with test data for development:
 * - 2 Tenants (ESN Berlin + Urban Chase Cyberpunk)
 * - 2 Events (Welcome Week 2025 + Night Chase 2025)
 * - 2 Test Teams (BERLIN2025 + CHASE2025)
 * - 15 Tasks for each event
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
    // ========================================
    // TENANT 1: ESN Berlin (Existing Light Theme)
    // ========================================
    console.log('📦 Creating Tenant 1: ESN Berlin...');
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
    console.log('✅ Tenant created: ESN Berlin (Light Theme)\n');

    // ========================================
    // TENANT 2: Urban Chase (Cyberpunk Theme)
    // ========================================
    console.log('📦 Creating Tenant 2: Urban Chase...');
    await setDoc(doc(db, 'tenants', 'urban-chase'), {
      id: 'urban-chase',
      name: 'Urban Chase',
      primaryColor: '#ec4899',      // Neon Pink
      secondaryColor: '#06b6d4',    // Cyan
      logoUrl: '',
      website: 'https://urban-chase.app',
      contactEmail: 'info@urban-chase.app',
      subscriptionTier: 'premium',
      isActive: true,
      themeStyle: 'cyberpunk',      // Custom field to trigger cyberpunk UI
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ Tenant created: Urban Chase (Cyberpunk Theme)\n');

    // ========================================
    // EVENT 1: ESN Berlin - Welcome Week 2025
    // ========================================
    console.log('📅 Creating Event 1: Welcome Week 2025...');
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

    // ========================================
    // EVENT 2: Urban Chase - Night Chase 2025
    // ========================================
    console.log('📅 Creating Event 2: Night Chase 2025...');
    await setDoc(doc(db, 'events', 'night-chase-2025'), {
      id: 'night-chase-2025',
      tenantId: 'urban-chase',
      name: 'Night Chase 2025',
      description: 'Navigate the neon-lit streets and complete cyberpunk missions!',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
      maxTeams: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ Event created: Night Chase 2025\n');

    // ========================================
    // TEAM 1: ESN Berlin Test Team
    // ========================================
    console.log('👥 Creating Team 1: The Explorers...');
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

    // ========================================
    // TEAM 2: Urban Chase Test Team
    // ========================================
    console.log('👥 Creating Team 2: Neon Runners...');
    await setDoc(doc(db, 'teams', 'team-test-02'), {
      id: 'team-test-02',
      tenantId: 'urban-chase',
      eventId: 'night-chase-2025',
      accessCode: 'CHASE2025',
      teamName: 'Neon Runners',
      memberCount: 3,
      score: 0,
      completedTaskIds: [],
      purchasedHintIds: [],
      inventory: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ Team created with access code: CHASE2025\n');

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

    // Cyberpunk tasks for Urban Chase
    const cyberpunkTasks = [
      // GPS Location Tasks with Cyberpunk flavor
      {
        id: 'task-alex-tower',
        tenantId: 'urban-chase',
        eventId: 'night-chase-2025',
        title: '🌃 Alexanderplatz Nexus',
        description: 'Scan the neon-lit hub where East meets West in the digital age.',
        type: 'GPS',
        points: 75,
        difficulty: 'easy',
        coordinates: { lat: 52.5219, lng: 13.4132 },
        radius: 40,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-hacker-bridge',
        tenantId: 'urban-chase',
        eventId: 'night-chase-2025',
        title: '⚡ Oberbaum Data Bridge',
        description: 'Cross the iconic bridge where data streams flow between districts.',
        type: 'GPS',
        points: 60,
        difficulty: 'easy',
        coordinates: { lat: 52.5016, lng: 13.4453 },
        radius: 35,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc',
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-checkpoint-charlie',
        tenantId: 'urban-chase',
        eventId: 'night-chase-2025',
        title: '🔒 Checkpoint Charlie Terminal',
        description: 'Access the historic security checkpoint in the heart of the city.',
        type: 'GPS',
        points: 55,
        difficulty: 'easy',
        coordinates: { lat: 52.5075, lng: 13.3903 },
        radius: 25,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc',
        isActive: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-east-side-gallery',
        tenantId: 'urban-chase',
        eventId: 'night-chase-2025',
        title: '🎨 Digital Wall Gallery',
        description: 'Document the largest open-air cyber-graffiti installation.',
        type: 'GPS_LOCATION',
        points: 80,
        difficulty: 'medium',
        coordinates: { lat: 52.5053, lng: 13.4397 },
        radius: 50,
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047',
        isActive: true,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Photo Tasks
      {
        id: 'task-neon-street',
        tenantId: 'urban-chase',
        eventId: 'night-chase-2025',
        title: '💫 Neon Street Art',
        description: 'Capture urban street art glowing in the night. Extra points for creative angles!',
        type: 'PHOTO',
        points: 65,
        difficulty: 'easy',
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047',
        isActive: true,
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-cyber-food',
        tenantId: 'urban-chase',
        eventId: 'night-chase-2025',
        title: '🍜 Cyber Cuisine',
        description: 'Find and photograph futuristic street food in the neon district.',
        type: 'PHOTO',
        points: 50,
        difficulty: 'easy',
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047',
        isActive: true,
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Quiz Task
      {
        id: 'task-berlin-tech',
        tenantId: 'urban-chase',
        eventId: 'night-chase-2025',
        title: '💻 Tech Capital Trivia',
        description: 'Prove your knowledge of Berlin\'s tech scene and digital culture!',
        type: 'QUIZ',
        points: 45,
        difficulty: 'medium',
        requiresPhoto: false,
        requiresVideo: false,
        requiresText: true,
        imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047',
        isActive: true,
        order: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Video Task
      {
        id: 'task-team-glitch',
        tenantId: 'urban-chase',
        eventId: 'night-chase-2025',
        title: '📹 Glitch Team Intro',
        description: 'Record a 30-second team intro with maximum cyberpunk energy!',
        type: 'VIDEO',
        points: 120,
        difficulty: 'hard',
        requiresPhoto: false,
        requiresVideo: true,
        requiresText: false,
        imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047',
        isActive: true,
        order: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Create all tasks for both events
    console.log('  ESN Berlin Tasks:');
    for (const task of tasks) {
      await setDoc(doc(db, 'tasks', task.id), task);
      console.log(`  ✅ ${task.title}`);
    }

    console.log('\n  Urban Chase Tasks:');
    for (const task of cyberpunkTasks) {
      await setDoc(doc(db, 'tasks', task.id), task);
      console.log(`  ✅ ${task.title}`);
    }

    console.log(`\n✅ Created ${tasks.length + cyberpunkTasks.length} tasks total\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Test Environment Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Summary:');
    console.log('\n  TENANT 1: ESN Berlin (Light Theme)');
    console.log('    • Event: Welcome Week 2025');
    console.log('    • Team Access Code: BERLIN2025');
    console.log('    • Tasks: 15');
    console.log('    • Total Points: 895');
    console.log('    • Style: Classic light UI\n');
    console.log('  TENANT 2: Urban Chase (Cyberpunk Theme)');
    console.log('    • Event: Night Chase 2025');
    console.log('    • Team Access Code: CHASE2025');
    console.log('    • Tasks: 8');
    console.log('    • Total Points: 550');
    console.log('    • Style: Neon cyberpunk dark UI\n');
    console.log('🚀 Next Steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Test ESN Berlin: Login with BERLIN2025');
    console.log('  3. Test Urban Chase: Login with CHASE2025');
    console.log('  4. Compare UI themes!\n');
    console.log('📚 Documentation:');
    console.log('  • docs/TEST_ENV_SETUP.md');
    console.log('  • docs/THEME_IMPLEMENTATION_ANALYSIS.md\n');

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
