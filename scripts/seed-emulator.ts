/**
 * Seeds the local emulators with one playable game: a tenant, an event,
 * 8 tasks (2 of each v1 type), 6 teams with random join codes and one
 * organiser. Wipes the emulator data first, so it can be run again.
 *
 * Usage: `npm run emulators`, then `npm run seed:emulator` in a second terminal.
 * Refuses to run unless both emulator hosts are set (see emulatorGuard.ts).
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { taskConverter, teamConverter } from '../shared/converters';
import { generateJoinCode } from '../shared/joinCode';
import type { Event, Task, Team, Tenant } from '../shared/schema';
import { assertEmulatorOnly } from './lib/emulatorGuard';

const PROJECT_ID = 'demo-urban-rally';
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';
const TENANT_ID = 'demo-org';
const EVENT_ID = 'demo-rally';
const ORGANISER_EMAIL = 'organiser@example.com';

try {
  assertEmulatorOnly(process.env, PROJECT_ID);
} catch (error) {
  console.error(`❌ ${(error as Error).message}`);
  process.exit(1);
}

const app = initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(app);
const auth = getAuth(app);

const now = new Date();
const hours = (n: number) => new Date(now.getTime() + n * 60 * 60 * 1000);
const stamps = { tenantId: TENANT_ID, createdAt: now, updatedAt: now };

const tenant: Omit<Tenant, 'id'> = {
  ...stamps,
  name: 'Demo Student Org',
  slug: TENANT_ID,
  primaryColor: '#e0267a',
  isActive: true,
};

const event: Omit<Event, 'id'> = {
  ...stamps,
  name: 'Demo Rally',
  description: 'Seeded by npm run seed:emulator',
  startDate: hours(-1),
  endDate: hours(24 * 7),
  isActive: true,
  maxTeams: 50,
  mapCenter: { lat: 52.52, lng: 13.405 },
  mapZoom: 14,
};

type TaskSeed = Pick<Task, 'title' | 'description' | 'type' | 'points'> & Partial<Task>;

const taskSeeds: TaskSeed[] = [
  { type: 'GPS', title: 'Brandenburg Gate', description: 'Get within 50 m of the gate.', points: 10, coordinates: { lat: 52.5163, lng: 13.3777 }, radius: 50 },
  { type: 'GPS', title: 'Museum Island', description: 'Find the Lustgarten fountain.', points: 10, coordinates: { lat: 52.5186, lng: 13.3990 }, radius: 50 },
  { type: 'PHOTO', title: 'Team at the TV tower', description: 'A team photo with the TV tower behind you.', points: 20, coordinates: { lat: 52.5208, lng: 13.4094 }, radius: 100, requiresPhoto: true },
  { type: 'PHOTO', title: 'Street art', description: 'Photograph your favourite mural.', points: 20, requiresPhoto: true },
  { type: 'VIDEO', title: 'Team chant', description: 'Record a 10-second team chant.', points: 30, requiresVideo: true },
  { type: 'VIDEO', title: 'Busker duet', description: 'Film your team singing along with a busker.', points: 30, coordinates: { lat: 52.5219, lng: 13.4132 }, radius: 150, requiresVideo: true },
  { type: 'QUIZ', title: 'River name', description: 'Which river flows through Berlin?', points: 15, quizType: 'text', quizCorrectAnswer: 'Spree', quizHint: 'Starts with S', requiresText: true },
  { type: 'QUIZ', title: 'Wall year', description: 'In which year did the Berlin Wall fall?', points: 15, quizType: 'multiple-choice', quizOptions: ['1961', '1989', '1990', '1991'], quizCorrectAnswer: '1989', requiresText: true },
];

const tasks: Task[] = taskSeeds.map((seed, index) => ({
  ...stamps,
  id: `task-${index + 1}`,
  eventId: EVENT_ID,
  requiresPhoto: false,
  requiresVideo: false,
  requiresText: false,
  order: index + 1,
  isActive: true,
  ...seed,
}));

const teamNames = ['Spree Squad', 'Kiez Crew', 'Late Trains', 'Currywurst Club', 'Tempelhof Kites', 'Späti Stars'];
const codes = new Set<string>();
while (codes.size < teamNames.length) codes.add(generateJoinCode());

const teams: Team[] = [...codes].map((accessCode, index) => ({
  ...stamps,
  id: `team-${index + 1}`,
  eventId: EVENT_ID,
  accessCode,
  teamName: teamNames[index],
  memberCount: 0,
  score: 0,
  completedTaskIds: [],
  isActive: true,
}));

/** Emulator-only endpoints that delete every document and every user. */
async function wipeEmulators() {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const wipes = [
    `http://${firestoreHost}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    `http://${authHost}/emulator/v1/projects/${PROJECT_ID}/accounts`,
  ];
  for (const url of wipes) {
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Could not reset ${url}: ${response.status}. Are the emulators running?`);
  }
}

async function seed() {
  await wipeEmulators();

  const batch = db.batch();
  batch.set(db.doc(`tenants/${TENANT_ID}`), tenant);
  batch.set(db.doc(`events/${EVENT_ID}`), event);
  for (const task of tasks) batch.set(db.doc(`tasks/${task.id}`), taskConverter.toFirestore(task));
  for (const team of teams) batch.set(db.doc(`teams/${team.id}`), teamConverter.toFirestore(team));
  await batch.commit();

  const organiser = await auth.createUser({ email: ORGANISER_EMAIL, emailVerified: true });
  await auth.setCustomUserClaims(organiser.uid, { staffTenantId: TENANT_ID, staffRole: 'owner' });

  console.log(`✅ Seeded ${PROJECT_ID}: tenant ${TENANT_ID}, event ${EVENT_ID}, ${tasks.length} tasks`);
  console.log(`   Organiser (owner): ${ORGANISER_EMAIL}\n`);
  console.log('   Join links:');
  for (const team of teams) {
    console.log(`   ${(team.teamName ?? '').padEnd(16)} ${team.accessCode}  ${APP_URL}/join/${team.accessCode}`);
  }
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
