import { Timestamp } from 'firebase-admin/firestore';
import { db } from './lib/admin';

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

        const docRef = await db.collection('teams').add(teamData);
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
