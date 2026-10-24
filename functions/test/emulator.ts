// Helpers for tests that run against the emulators (npm run test:rules).
// Callables are plain HTTPS requests, so no client SDK is needed.

export const PROJECT_ID = 'demo-urban-rally';
const REGION = 'europe-west3';
const AUTH_HOST = 'http://127.0.0.1:9099';
const FUNCTIONS_HOST = 'http://127.0.0.1:5001';

export interface CallableResponse<T = unknown> {
  status: number;
  body: { result?: T; error?: { status: string; message: string } };
}

export async function signInAnonymously(): Promise<{ idToken: string; uid: string }> {
  const response = await fetch(
    `${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) },
  );
  const body = (await response.json()) as { idToken: string; localId: string };
  return { idToken: body.idToken, uid: body.localId };
}

export async function callFunction<T = unknown>(
  name: string,
  data: unknown,
  idToken?: string,
): Promise<CallableResponse<T>> {
  const response = await fetch(`${FUNCTIONS_HOST}/${PROJECT_ID}/${REGION}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken && { Authorization: `Bearer ${idToken}` }),
    },
    body: JSON.stringify({ data }),
  });
  return { status: response.status, body: (await response.json()) as CallableResponse<T>['body'] };
}
