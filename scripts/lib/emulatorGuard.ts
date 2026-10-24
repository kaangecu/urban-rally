/**
 * Throws unless every write is bound for the local emulators. A `demo-`
 * project ID makes the emulators refuse to reach any real Firebase service.
 */
export function assertEmulatorOnly(env: Record<string, string | undefined>, projectId: string): void {
  for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
    if (!env[name]) {
      throw new Error(`${name} is not set. This script only writes to the emulators (npm run emulators).`);
    }
  }
  if (!projectId.startsWith('demo-')) {
    throw new Error(`Project "${projectId}" is not a demo- project. This script only writes to the emulators.`);
  }
}
