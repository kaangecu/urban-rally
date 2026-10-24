import { HttpsError, onCall } from 'firebase-functions/v2/https';

/** Proves the functions wiring: answers signed-in callers with their uid. */
export const ping = onCall((request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in first.');
  }
  return { uid: request.auth.uid };
});
