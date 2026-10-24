import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { memberConverter } from '../../shared/converters';
import type { Event, Member, Team, Tenant } from '../../shared/schema';

// See docs/specs/data-model.md and login decisions 1 to 7.
const MAX_WRONG_CODES = 5;
const WRONG_CODE_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_MAX_TEAM_SIZE = 6;
const MAX_NAME_LENGTH = 50;

interface JoinTeamRequest {
  code: string;
  displayName: string;
  consentVersion: string;
}

export interface JoinTeamResult {
  teamId: string;
  tenantId: string;
  eventId: string;
}

type Reason = 'already-on-team' | 'team-inactive' | 'event-inactive' | 'tenant-inactive' | 'team-full';

const refuse = (reason: Reason, message: string) => new HttpsError('failed-precondition', message, { reason });

function parseRequest(data: unknown): JoinTeamRequest {
  const { code, displayName, consentVersion } = (data ?? {}) as Partial<Record<keyof JoinTeamRequest, unknown>>;
  if (typeof code !== 'string' || !code.trim() || code.length > 32) {
    throw new HttpsError('invalid-argument', 'Enter your team code.');
  }
  if (typeof displayName !== 'string' || !displayName.trim() || displayName.trim().length > MAX_NAME_LENGTH) {
    throw new HttpsError('invalid-argument', `Enter a name of 1 to ${MAX_NAME_LENGTH} characters.`);
  }
  if (typeof consentVersion !== 'string' || !consentVersion.trim()) {
    throw new HttpsError('invalid-argument', 'Accept the terms and privacy policy first.');
  }
  return { code: code.trim().toUpperCase(), displayName: displayName.trim(), consentVersion: consentVersion.trim() };
}

/**
 * Adds the signed-in player to the team with this code. Everything the
 * rules trust (team, tenant, claims) comes from the server; the caller only
 * supplies the code, their name and the consent version they accepted.
 */
export const joinTeam = onCall<unknown, Promise<JoinTeamResult>>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in first.');
  }
  const uid = request.auth.uid;
  const { code, displayName, consentVersion } = parseRequest(request.data);
  const db = getFirestore();
  const auth = getAuth();

  // Rate limit: once a uid has 5 wrong codes in 10 minutes, every attempt is
  // refused until the window ends, so the 6th guess can't succeed either.
  // The check, lookup and count share one transaction, so parallel guesses
  // from one uid are serialised instead of all passing the check at once.
  const attemptsRef = db.doc(`joinAttempts/${uid}`);
  const lookup = await db.runTransaction(async (tx) => {
    const attempts = (await tx.get(attemptsRef)).data() as { failures: number; windowStart: number } | undefined;
    const inWindow = attempts !== undefined && Date.now() - attempts.windowStart < WRONG_CODE_WINDOW_MS;
    if (inWindow && attempts.failures >= MAX_WRONG_CODES) return 'blocked';

    const matches = await tx.get(db.collection('teams').where('accessCode', '==', code).limit(1));
    if (!matches.empty) return matches.docs[0].ref;

    tx.set(attemptsRef, inWindow ? { failures: attempts.failures + 1, windowStart: attempts.windowStart } : { failures: 1, windowStart: Date.now() });
    return 'not-found';
  });
  if (lookup === 'blocked') {
    throw new HttpsError('resource-exhausted', 'Too many wrong codes. Try again in 10 minutes.');
  }
  if (lookup === 'not-found') {
    throw new HttpsError('not-found', 'No team has this code.');
  }

  const teamRef = lookup;
  const teamId = teamRef.id;
  const claims = (await auth.getUser(uid)).customClaims ?? {};
  if (claims.teamId && claims.teamId !== teamId) {
    throw refuse('already-on-team', 'You are already on another team. Ask an organiser to move you.');
  }

  const memberRef = teamRef.collection('members').doc(uid);
  const result = await db.runTransaction(async (tx) => {
    const team = (await tx.get(teamRef)).data() as Omit<Team, 'id'>;
    const result: JoinTeamResult = { teamId, tenantId: team.tenantId, eventId: team.eventId };

    // Joining again is a no-op, so a retry after a lost response is safe
    if ((await tx.get(memberRef)).exists) return result;

    // The claims check above can't see a join to another team that is still
    // running, so the uid's team is also kept here, inside the transaction
    const joinedTeamId = (await tx.get(attemptsRef)).get('teamId') as string | undefined;
    if (joinedTeamId && joinedTeamId !== teamId) {
      throw refuse('already-on-team', 'You are already on another team. Ask an organiser to move you.');
    }

    const [event, tenant] = await Promise.all([
      tx.get(db.doc(`events/${team.eventId}`)).then((snap) => snap.data() as Omit<Event, 'id'> | undefined),
      tx.get(db.doc(`tenants/${team.tenantId}`)).then((snap) => snap.data() as Omit<Tenant, 'id'> | undefined),
    ]);
    if (!team.isActive) throw refuse('team-inactive', 'This team is not active.');
    if (!event?.isActive) throw refuse('event-inactive', 'This event is not running.');
    if (!tenant?.isActive) throw refuse('tenant-inactive', 'This organisation is not active.');
    if ((team.memberCount ?? 0) >= (event.maxTeamSize ?? DEFAULT_MAX_TEAM_SIZE)) {
      throw refuse('team-full', 'This team is full.');
    }

    const now = new Date();
    const member: Member = {
      id: uid,
      tenantId: team.tenantId,
      teamId,
      displayName,
      consentVersion,
      consentAt: now,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    tx.create(memberRef, memberConverter.toFirestore(member));
    tx.update(teamRef, { memberCount: FieldValue.increment(1), updatedAt: now });
    tx.set(attemptsRef, { teamId }, { merge: true });
    return result;
  });

  // Set every time, so a retry repairs a join whose claims write failed.
  // Only these two keys are written: a player token never carries staff claims.
  await auth.setCustomUserClaims(uid, { teamId: result.teamId, tenantId: result.tenantId });
  return result;
});
