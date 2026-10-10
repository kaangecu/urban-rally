/**
 * Firestore Admin SDK connection for seed and maintenance scripts.
 *
 * Security rules block all client writes to content and teams, so scripts
 * use the Admin SDK instead of the web SDK:
 *  - Emulator: run inside `firebase emulators:exec` (or set
 *    FIRESTORE_EMULATOR_HOST) and no credentials are needed.
 *  - Real project: authenticate once with
 *    `gcloud auth application-default login`.
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const projectId =
  process.env.FIREBASE_PROJECT_ID ??
  process.env.GCLOUD_PROJECT ??
  process.env.VITE_FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error('❌ No Firebase project ID. Set VITE_FIREBASE_PROJECT_ID in .env.');
  process.exit(1);
}

const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const app = initializeApp(
  usingEmulator ? { projectId } : { projectId, credential: applicationDefault() }
);

export const db = getFirestore(app);

console.log(
  usingEmulator
    ? `🔧 Firestore emulator (${process.env.FIRESTORE_EMULATOR_HOST}), project ${projectId}`
    : `☁️  Firestore project ${projectId}`
);
