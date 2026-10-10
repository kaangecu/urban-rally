import { defineConfig } from 'vitest/config';

// Security rules tests. Run with `npm run test:rules`, which starts the
// Firestore and Storage emulators around this suite.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
