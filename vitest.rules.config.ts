import { defineConfig } from 'vitest/config';

// Security rules and Cloud Functions tests. Run with `npm run test:rules`,
// which starts the Auth, Functions, Firestore and Storage emulators.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts', 'functions/test/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
