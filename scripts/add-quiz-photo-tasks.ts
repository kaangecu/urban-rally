import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUyPn4g1EL0r3SdXP1BgqT_d2mUTlzEi8",
  authDomain: "urban-rally-app.firebaseapp.com",
  projectId: "urban-rally-app",
  storageBucket: "urban-rally-app.firebasestorage.app",
  messagingSenderId: "598668246829",
  appId: "1:598668246829:web:1dc673ef69f93f96eb61a9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample tasks to add
const newTasks = [
  // PHOTO TASKS
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'Find a Red Door',
    description: 'Take a photo of a red door in your neighborhood',
    type: 'PHOTO',
    points: 50,
    difficulty: 'easy',
    requiresPhoto: true,
    requiresVideo: false,
    requiresText: false,
    isActive: true,
    order: 10,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'Street Art Discovery',
    description: 'Find and photograph interesting street art or graffiti',
    type: 'PHOTO',
    points: 75,
    difficulty: 'medium',
    requiresPhoto: true,
    requiresVideo: false,
    requiresText: false,
    isActive: true,
    order: 11,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'Team Selfie Challenge',
    description: 'Take a creative team selfie with all members',
    type: 'PHOTO',
    points: 100,
    difficulty: 'easy',
    requiresPhoto: true,
    requiresVideo: false,
    requiresText: false,
    isActive: true,
    order: 12,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'Historic Landmark',
    description: 'Find and photograph a historic building or monument',
    type: 'PHOTO',
    points: 80,
    difficulty: 'medium',
    requiresPhoto: true,
    requiresVideo: false,
    requiresText: false,
    isActive: true,
    order: 13,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },

  // QUIZ TASKS - Multiple Choice
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'Berlin Trivia: Brandenburg Gate',
    description: 'In which year was the Brandenburg Gate completed?',
    type: 'QUIZ',
    quizType: 'multiple-choice',
    quizOptions: ['1781', '1791', '1801', '1811'],
    quizCorrectAnswer: '1791',
    quizHint: 'It was completed in the late 18th century',
    points: 50,
    difficulty: 'medium',
    requiresPhoto: false,
    requiresVideo: false,
    requiresText: true,
    isActive: true,
    order: 20,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'Geography Quiz',
    description: 'Which river flows through Berlin?',
    type: 'QUIZ',
    quizType: 'multiple-choice',
    quizOptions: ['Rhine', 'Spree', 'Danube', 'Elbe'],
    quizCorrectAnswer: 'Spree',
    quizHint: 'It\'s a 4-letter word starting with S',
    points: 40,
    difficulty: 'easy',
    requiresPhoto: false,
    requiresVideo: false,
    requiresText: true,
    isActive: true,
    order: 21,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'ESN Knowledge',
    description: 'What does ESN stand for?',
    type: 'QUIZ',
    quizType: 'multiple-choice',
    quizOptions: [
      'European Student Network',
      'Erasmus Student Network',
      'Exchange Student Network',
      'Educational Student Network'
    ],
    quizCorrectAnswer: 'Erasmus Student Network',
    points: 30,
    difficulty: 'easy',
    requiresPhoto: false,
    requiresVideo: false,
    requiresText: true,
    isActive: true,
    order: 22,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },

  // QUIZ TASKS - Text Answer
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'Capital City Quiz',
    description: 'What is the capital city of Germany?',
    type: 'QUIZ',
    quizType: 'text',
    quizCorrectAnswer: 'Berlin',
    quizHint: 'It\'s the city you\'re in right now!',
    points: 25,
    difficulty: 'easy',
    requiresPhoto: false,
    requiresVideo: false,
    requiresText: true,
    isActive: true,
    order: 23,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'Movie Trivia',
    description: 'Name the famous spy movie series filmed in Berlin featuring Matt Damon.',
    type: 'QUIZ',
    quizType: 'text',
    quizCorrectAnswer: 'Bourne',
    quizHint: 'The Bourne ________',
    points: 60,
    difficulty: 'medium',
    requiresPhoto: false,
    requiresVideo: false,
    requiresText: true,
    isActive: true,
    order: 24,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },

  // QUIZ TASKS - Number
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'Math Challenge',
    description: 'How many sections was Berlin divided into after WWII?',
    type: 'QUIZ',
    quizType: 'number',
    quizCorrectAnswer: 4,
    quizHint: 'Think about the Allied powers',
    points: 45,
    difficulty: 'medium',
    requiresPhoto: false,
    requiresVideo: false,
    requiresText: true,
    isActive: true,
    order: 25,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'Year Challenge',
    description: 'In what year did the Berlin Wall fall?',
    type: 'QUIZ',
    quizType: 'number',
    quizCorrectAnswer: 1989,
    quizHint: 'Late 1980s',
    points: 50,
    difficulty: 'medium',
    requiresPhoto: false,
    requiresVideo: false,
    requiresText: true,
    isActive: true,
    order: 26,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },

  // Mix of PHOTO and QUIZ
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'Public Transport Photo',
    description: 'Take a photo inside a U-Bahn or S-Bahn train',
    type: 'PHOTO',
    points: 60,
    difficulty: 'easy',
    requiresPhoto: true,
    requiresVideo: false,
    requiresText: false,
    isActive: true,
    order: 14,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    tenantId: 'esn-berlin',
    eventId: 'winter-scavenger-hunt',
    title: 'Food Challenge',
    description: 'What is the traditional Berlin street food made with curry sauce?',
    type: 'QUIZ',
    quizType: 'text',
    quizCorrectAnswer: 'Currywurst',
    quizHint: 'Curry + German sausage',
    points: 35,
    difficulty: 'easy',
    requiresPhoto: false,
    requiresVideo: false,
    requiresText: true,
    isActive: true,
    order: 27,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

async function addTasksToFirestore() {
  console.log('🚀 Starting to add tasks to Firestore...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const task of newTasks) {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), task);
      console.log(`✅ Added: "${task.title}" (${task.type}) - ID: ${docRef.id}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error adding "${task.title}":`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully added: ${successCount} tasks`);
  console.log(`   ❌ Failed: ${errorCount} tasks`);
  console.log(`   📝 Total attempted: ${newTasks.length} tasks`);
  
  console.log(`\n🎯 Task breakdown:`);
  const photoTasks = newTasks.filter(t => t.type === 'PHOTO').length;
  const quizTasks = newTasks.filter(t => t.type === 'QUIZ').length;
  const multipleChoice = newTasks.filter(t => t.quizType === 'multiple-choice').length;
  const textAnswer = newTasks.filter(t => t.quizType === 'text').length;
  const numberAnswer = newTasks.filter(t => t.quizType === 'number').length;
  
  console.log(`   📸 Photo tasks: ${photoTasks}`);
  console.log(`   ❓ Quiz tasks: ${quizTasks}`);
  console.log(`      - Multiple choice: ${multipleChoice}`);
  console.log(`      - Text answer: ${textAnswer}`);
  console.log(`      - Number answer: ${numberAnswer}`);
}

// Run the script
addTasksToFirestore()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
