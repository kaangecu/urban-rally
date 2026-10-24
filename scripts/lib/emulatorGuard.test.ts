import { describe, expect, it } from 'vitest';
import { assertEmulatorOnly } from './emulatorGuard';

const emulatorEnv = {
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
};

describe('assertEmulatorOnly', () => {
  it('passes with both emulator hosts and a demo- project', () => {
    expect(() => assertEmulatorOnly(emulatorEnv, 'demo-urban-rally')).not.toThrow();
  });

  it('refuses without the Firestore emulator host', () => {
    expect(() =>
      assertEmulatorOnly({ FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099' }, 'demo-urban-rally'),
    ).toThrow(/FIRESTORE_EMULATOR_HOST/);
  });

  it('refuses without the Auth emulator host', () => {
    expect(() =>
      assertEmulatorOnly({ FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' }, 'demo-urban-rally'),
    ).toThrow(/FIREBASE_AUTH_EMULATOR_HOST/);
  });

  it('refuses a real project ID even with the emulator hosts set', () => {
    expect(() => assertEmulatorOnly(emulatorEnv, 'urban-rally-539bd')).toThrow(/demo-/);
  });

  it('refuses empty host values', () => {
    expect(() =>
      assertEmulatorOnly({ ...emulatorEnv, FIRESTORE_EMULATOR_HOST: '' }, 'demo-urban-rally'),
    ).toThrow(/FIRESTORE_EMULATOR_HOST/);
  });
});
