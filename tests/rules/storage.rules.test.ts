import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { getBytes, ref, uploadBytes } from 'firebase/storage';

const PLAYER = 'player-uid';
const SUBMISSION_A = 'submissions/esn-berlin/welcome-week/team-a/task-1';
const SUBMISSION_B = 'submissions/esn-berlin/welcome-week/team-b/task-1';
const photo = new Uint8Array([0xff, 0xd8, 0xff]);
const asJpeg = { contentType: 'image/jpeg' };

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-urban-rally',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'teams/team-a'), { uid: PLAYER });
    await setDoc(doc(ctx.firestore(), 'teams/team-b'), { uid: 'other-player' });
    await uploadBytes(ref(ctx.storage(), SUBMISSION_B), photo, asJpeg);
  });
});

const asPlayer = () => env.authenticatedContext(PLAYER).storage();
const asStranger = () => env.authenticatedContext('stranger-uid').storage();

describe('submission media', () => {
  test('a team can upload and read its own photo', async () => {
    const storage = asPlayer();
    await assertSucceeds(uploadBytes(ref(storage, SUBMISSION_A), photo, asJpeg));
    await assertSucceeds(getBytes(ref(storage, SUBMISSION_A)));
  });

  test("other signed-in users cannot download a team's media", async () => {
    await assertFails(getBytes(ref(asStranger(), SUBMISSION_B)));
    await assertFails(getBytes(ref(asPlayer(), SUBMISSION_B)));
  });

  test("a team cannot upload into another team's folder", async () => {
    await assertFails(uploadBytes(ref(asPlayer(), SUBMISSION_B), photo, asJpeg));
  });

  test('non-media files are rejected', async () => {
    await assertFails(
      uploadBytes(ref(asPlayer(), SUBMISSION_A), photo, { contentType: 'text/html' })
    );
  });
});
