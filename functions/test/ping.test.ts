import { describe, expect, it } from 'vitest';
import { callFunction, signInAnonymously } from './emulator';

describe('ping', () => {
  it('rejects a signed-out caller', async () => {
    const response = await callFunction('ping', {});

    expect(response.status).toBe(401);
    expect(response.body.error?.status).toBe('UNAUTHENTICATED');
  });

  it('answers a signed-in caller with their uid', async () => {
    const { idToken, uid } = await signInAnonymously();

    const response = await callFunction('ping', {}, idToken);

    expect(response.status).toBe(200);
    expect(response.body.result).toEqual({ uid });
  });
});
