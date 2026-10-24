import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PROJECT_ID, callFunction, signInAnonymously } from './emulator';

interface JoinResult {
  teamId: string;
  tenantId: string;
  eventId: string;
}

let app: App;
let db: Firestore;

const now = new Date();
const later = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const join = (code: string, idToken?: string, extra: Record<string, unknown> = {}) =>
  callFunction<JoinResult>('joinTeam', { code, displayName: 'Ada', consentVersion: '2026-10', ...extra }, idToken);

async function seedTeam(id: string, code: string, overrides: Record<string, unknown> = {}) {
  await db.doc(`teams/${id}`).set({
    tenantId: 'join-org',
    eventId: 'join-event',
    accessCode: code,
    teamName: id,
    memberCount: 0,
    score: 0,
    completedTaskIds: [],
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

beforeAll(async () => {
  app = initializeApp({ projectId: PROJECT_ID }, 'joinTeam-test');
  db = getFirestore(app);
  const stamps = { tenantId: 'join-org', createdAt: now, updatedAt: now };
  await db.doc('tenants/join-org').set({ ...stamps, name: 'Join Org', slug: 'join-org', primaryColor: '#000000', isActive: true });
  await db.doc('events/join-event').set({
    ...stamps, name: 'Join Event', startDate: now, endDate: later, isActive: true, maxTeamSize: 2,
    mapCenter: { lat: 52.52, lng: 13.405 }, mapZoom: 13,
  });
  await db.doc('events/ended-event').set({
    ...stamps, name: 'Ended Event', startDate: now, endDate: later, isActive: false,
    mapCenter: { lat: 52.52, lng: 13.405 }, mapZoom: 13,
  });
  await seedTeam('team-open', 'OPENAAAA');
  await seedTeam('team-other', 'OTHERBBB');
  await seedTeam('team-repeat', 'REPEATCC');
  await seedTeam('team-claims', 'CLAIMSDD');
  await seedTeam('team-full', 'FULLEEEE', { memberCount: 2 });
  await seedTeam('team-ended', 'ENDEDFFF', { eventId: 'ended-event' });
  await seedTeam('team-locked', 'LOCKEDGG');
});

afterAll(async () => {
  await deleteApp(app);
});

describe('joinTeam', () => {
  it('rejects a signed-out caller', async () => {
    const response = await join('OPENAAAA');
    expect(response.body.error?.status).toBe('UNAUTHENTICATED');
  });

  it('rejects a missing display name', async () => {
    const { idToken } = await signInAnonymously();
    const response = await join('OPENAAAA', idToken, { displayName: '  ' });
    expect(response.body.error?.status).toBe('INVALID_ARGUMENT');
  });

  it('rejects a wrong code', async () => {
    const { idToken } = await signInAnonymously();
    const response = await join('NOSUCHHH', idToken);
    expect(response.body.error?.status).toBe('NOT_FOUND');
  });

  it('rejects a team whose event is not active', async () => {
    const { idToken } = await signInAnonymously();
    const response = await join('ENDEDFFF', idToken);
    expect(response.body.error?.status).toBe('FAILED_PRECONDITION');
    expect(response.body.error).toMatchObject({ details: { reason: 'event-inactive' } });
  });

  it('rejects a full team', async () => {
    const { idToken } = await signInAnonymously();
    const response = await join('FULLEEEE', idToken);
    expect(response.body.error?.status).toBe('FAILED_PRECONDITION');
    expect(response.body.error).toMatchObject({ details: { reason: 'team-full' } });
  });

  it('accepts lower-case codes with spaces around them', async () => {
    const { idToken } = await signInAnonymously();
    const response = await join('  openaaaa ', idToken);
    expect(response.body.result?.teamId).toBe('team-open');
  });

  it('adds the member and sets claims from the server, never from the caller', async () => {
    const { idToken, uid } = await signInAnonymously();

    const response = await join('CLAIMSDD', idToken, { tenantId: 'evil-org', staffRole: 'owner', teamId: 'team-other' });

    expect(response.body.result).toEqual({ teamId: 'team-claims', tenantId: 'join-org', eventId: 'join-event' });
    const user = await getAuth(app).getUser(uid);
    expect(user.customClaims).toEqual({ teamId: 'team-claims', tenantId: 'join-org' });
    const member = (await db.doc(`teams/team-claims/members/${uid}`).get()).data();
    expect(member).toMatchObject({ teamId: 'team-claims', tenantId: 'join-org', displayName: 'Ada', consentVersion: '2026-10' });
    expect(member?.consentAt).toBeDefined();
    expect(member).not.toHaveProperty('staffRole');
  });

  it('treats the same join twice as a no-op', async () => {
    const { idToken, uid } = await signInAnonymously();

    const first = await join('REPEATCC', idToken);
    const joinedAt = (await db.doc(`teams/team-repeat/members/${uid}`).get()).get('joinedAt');
    const second = await join('REPEATCC', idToken, { displayName: 'Someone else' });

    expect(second.body.result).toEqual(first.body.result);
    const team = (await db.doc('teams/team-repeat').get()).data();
    expect(team?.memberCount).toBe(1);
    const member = (await db.doc(`teams/team-repeat/members/${uid}`).get()).data();
    expect(member?.displayName).toBe('Ada');
    expect(member?.joinedAt).toEqual(joinedAt);
  });

  it('refuses a join to a second team', async () => {
    const { idToken, uid } = await signInAnonymously();
    await join('OPENAAAA', idToken);

    const response = await join('OTHERBBB', idToken);

    expect(response.body.error?.status).toBe('FAILED_PRECONDITION');
    expect(response.body.error).toMatchObject({ details: { reason: 'already-on-team' } });
    expect((await db.doc(`teams/team-other/members/${uid}`).get()).exists).toBe(false);
  });

  it('blocks the 6th wrong code in 10 minutes, and the right code too', async () => {
    const { idToken } = await signInAnonymously();
    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await join(`WRONG00${attempt}`, idToken);
      expect(response.body.error?.status).toBe('NOT_FOUND');
    }

    const sixth = await join('WRONG006', idToken);
    const right = await join('LOCKEDGG', idToken);

    expect(sixth.body.error?.status).toBe('RESOURCE_EXHAUSTED');
    expect(right.body.error?.status).toBe('RESOURCE_EXHAUSTED');
  });
});
