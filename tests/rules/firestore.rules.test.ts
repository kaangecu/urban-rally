import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const PLAYER = 'player-uid';
const STRANGER = 'stranger-uid';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-urban-rally',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'tenants/esn-berlin'), { name: 'ESN Berlin' });
    await setDoc(doc(db, 'events/welcome-week'), { tenantId: 'esn-berlin' });
    await setDoc(doc(db, 'tasks/task-1'), {
      tenantId: 'esn-berlin',
      eventId: 'welcome-week',
      quizCorrectAnswer: 'Berlin',
    });
    await setDoc(doc(db, 'teams/team-a'), {
      uid: PLAYER,
      tenantId: 'esn-berlin',
      eventId: 'welcome-week',
      accessCode: 'TEAMA2025',
      score: 0,
      completedTaskIds: [],
    });
    await setDoc(doc(db, 'teams/team-b'), {
      uid: 'other-player',
      tenantId: 'esn-berlin',
      eventId: 'welcome-week',
      accessCode: 'TEAMB2025',
      score: 0,
      completedTaskIds: [],
    });
    await setDoc(doc(db, 'submissions/sub-b'), {
      teamId: 'team-b',
      tenantId: 'esn-berlin',
      status: 'pending',
    });
  });
});

const asPlayer = () => env.authenticatedContext(PLAYER).firestore();
const asStranger = () => env.authenticatedContext(STRANGER).firestore();
const asGuest = () => env.unauthenticatedContext().firestore();

describe('content collections', () => {
  test('tenants and events are publicly readable', async () => {
    await assertSucceeds(getDoc(doc(asGuest(), 'tenants/esn-berlin')));
    await assertSucceeds(getDoc(doc(asGuest(), 'events/welcome-week')));
  });

  test('tasks need a signed-in user', async () => {
    await assertFails(getDoc(doc(asGuest(), 'tasks/task-1')));
    await assertSucceeds(getDoc(doc(asStranger(), 'tasks/task-1')));
  });

  test('nobody can write tenants, events or tasks from a client', async () => {
    const db = asStranger();
    await assertFails(setDoc(doc(db, 'tenants/esn-berlin'), { name: 'Hacked' }));
    await assertFails(deleteDoc(doc(db, 'events/welcome-week')));
    await assertFails(setDoc(doc(db, 'tasks/evil'), { title: 'Spam' }));
  });
});

describe('teams', () => {
  test('a player can read their own team', async () => {
    await assertSucceeds(getDoc(doc(asPlayer(), 'teams/team-a')));
  });

  test('another team cannot be read', async () => {
    await assertFails(getDoc(doc(asPlayer(), 'teams/team-b')));
    await assertFails(getDoc(doc(asGuest(), 'teams/team-a')));
  });

  test('teams cannot be listed or looked up by access code', async () => {
    await assertFails(getDocs(collection(asStranger(), 'teams')));
    await assertFails(
      getDocs(query(collection(asStranger(), 'teams'), where('accessCode', '==', 'TEAMA2025')))
    );
  });

  test('a player can list only their own team', async () => {
    await assertSucceeds(
      getDocs(query(collection(asPlayer(), 'teams'), where('uid', '==', PLAYER)))
    );
  });

  test('a stranger cannot take over a team by writing their uid', async () => {
    await assertFails(updateDoc(doc(asStranger(), 'teams/team-a'), { uid: STRANGER }));
  });

  test('a player cannot hand their team to another uid', async () => {
    await assertFails(updateDoc(doc(asPlayer(), 'teams/team-a'), { uid: STRANGER }));
  });

  test('a player cannot change their own score or completed tasks', async () => {
    const db = asPlayer();
    await assertFails(updateDoc(doc(db, 'teams/team-a'), { score: increment(1000) }));
    await assertFails(updateDoc(doc(db, 'teams/team-a'), { completedTaskIds: ['task-1'] }));
  });

  test('a player cannot change identity fields', async () => {
    const db = asPlayer();
    await assertFails(updateDoc(doc(db, 'teams/team-a'), { accessCode: 'NEW' }));
    await assertFails(updateDoc(doc(db, 'teams/team-a'), { tenantId: 'other' }));
  });

  test('a player can update profile fields', async () => {
    await assertSucceeds(
      updateDoc(doc(asPlayer(), 'teams/team-a'), {
        teamDisplayName: 'The Explorers',
        currentLocation: { lat: 52.52, lng: 13.405 },
      })
    );
  });

  test('teams cannot be created or deleted from a client', async () => {
    await assertFails(
      setDoc(doc(asStranger(), 'teams/new-team'), { uid: STRANGER, accessCode: 'X' })
    );
    await assertFails(deleteDoc(doc(asPlayer(), 'teams/team-a')));
  });
});

describe('submissions', () => {
  const pending = {
    teamId: 'team-a',
    tenantId: 'esn-berlin',
    taskId: 'task-1',
    status: 'pending',
  };

  test('a player can submit for their own team as pending', async () => {
    await assertSucceeds(setDoc(doc(asPlayer(), 'submissions/sub-a'), pending));
  });

  test('a player cannot approve their own submission or award points', async () => {
    const db = asPlayer();
    await assertFails(setDoc(doc(db, 'submissions/sub-a'), { ...pending, status: 'approved' }));
    await assertFails(setDoc(doc(db, 'submissions/sub-a'), { ...pending, pointsAwarded: 50 }));
  });

  test('a player cannot submit for another team or tenant', async () => {
    const db = asPlayer();
    await assertFails(setDoc(doc(db, 'submissions/sub-x'), { ...pending, teamId: 'team-b' }));
    await assertFails(setDoc(doc(db, 'submissions/sub-y'), { ...pending, tenantId: 'other' }));
  });

  test("another team's submissions are private", async () => {
    await assertFails(getDoc(doc(asPlayer(), 'submissions/sub-b')));
  });

  test('submissions cannot be edited after creation', async () => {
    await assertFails(
      updateDoc(doc(asStranger(), 'submissions/sub-b'), { status: 'approved' })
    );
  });
});

describe('everything else', () => {
  test('leaderboard is public read, no client writes', async () => {
    await assertSucceeds(getDoc(doc(asGuest(), 'leaderboard/welcome-week/entries/team-a')));
    await assertFails(
      setDoc(doc(asPlayer(), 'leaderboard/welcome-week/entries/team-a'), { score: 9999 })
    );
  });

  test('unknown collections are denied', async () => {
    await assertFails(setDoc(doc(asPlayer(), 'anything/else'), { a: 1 }));
    await assertFails(getDoc(doc(asPlayer(), 'anything/else')));
  });
});
