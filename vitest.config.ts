import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // TEMPORARY: no unit tests exist yet. Remove once the new tests-first suite lands.
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'scripts/',
        'src/test-firebase.ts',
        'src/scripts/',
        '**/*.manual-test.ts',
      ],
      include: ['src/**/*.{ts,tsx}'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      '**/*.manual-test.ts',
      'src/__tests__/examples/**', // Exclude example/template tests
      'tests/rules/**', // Needs the emulator: npm run test:rules
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
