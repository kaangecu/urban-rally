# Urban Rally - Comprehensive Testing Strategy

**Date:** December 7, 2025  
**Version:** 1.0  
**Status:** 📋 Implementation Plan

---

## 🎯 Executive Summary

This document outlines a comprehensive testing strategy for the Urban Rally application to ensure safe refactoring, prevent regressions, and maintain high code quality. The strategy covers unit tests, integration tests, E2E tests, and follows industry best practices.

### Goals
- ✅ Enable confident refactoring
- ✅ Prevent regressions
- ✅ Improve code quality
- ✅ Reduce production bugs
- ✅ Speed up development cycle

### Target Coverage
- **Unit Tests:** 80%+ coverage
- **Integration Tests:** Critical user flows
- **E2E Tests:** Main user journeys
- **Total Time to Implement:** 60-80 hours

---

## 📊 Current State Analysis

### Existing Tests
```
✅ src/utils/quizValidation.test.ts (created, needs test runner)
✅ src/utils/quizValidation.manual-test.ts (manual testing script)
```

### Missing Test Infrastructure
- ❌ No test runner configured (Vitest recommended)
- ❌ No testing utilities (@testing-library/react)
- ❌ No mocking libraries (vi, @testing-library/user-event)
- ❌ No E2E framework (Playwright/Cypress)
- ❌ No CI/CD testing pipeline
- ❌ No test coverage reporting

---

## 🏗️ Recommended Folder Structure

### Option A: Co-located Tests (Recommended)
```
src/
├── components/
│   ├── navigation/
│   │   ├── BottomNav.tsx
│   │   ├── BottomNav.test.tsx           # Unit test
│   │   └── BottomNav.stories.tsx        # Storybook (optional)
│   └── legal/
│       ├── LegalModal.tsx
│       └── LegalModal.test.tsx
├── features/
│   ├── auth/
│   │   ├── TeamCodeLogin.tsx
│   │   ├── TeamCodeLogin.test.tsx       # Unit test
│   │   └── __tests__/
│   │       └── auth-flow.integration.test.tsx  # Integration
│   ├── tasks/
│   │   ├── TaskList.tsx
│   │   ├── TaskList.test.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskCard.test.tsx
│   │   └── __tests__/
│   │       └── task-completion.integration.test.tsx
│   ├── submissions/
│   │   ├── TaskSubmission.tsx
│   │   ├── TaskSubmission.test.tsx
│   │   ├── QuizInput.tsx
│   │   ├── QuizInput.test.tsx
│   │   └── __tests__/
│   │       └── quiz-validation.integration.test.tsx
│   └── map/
│       ├── GameMap.tsx
│       └── GameMap.test.tsx
├── services/
│   ├── firebase.service.ts
│   ├── firebase.service.test.ts         # Unit test with mocks
│   ├── task.service.ts
│   ├── task.service.test.ts
│   ├── submission.service.ts
│   ├── submission.service.test.ts
│   └── __tests__/
│       └── services.integration.test.ts # Integration with Firebase
├── store/
│   ├── authStore.ts
│   ├── authStore.test.ts
│   ├── taskStore.ts
│   ├── taskStore.test.ts
│   ├── mapStore.ts
│   └── mapStore.test.ts
├── utils/
│   ├── quizValidation.ts
│   ├── quizValidation.test.ts           # Already exists
│   ├── geospatial.ts
│   ├── geospatial.test.ts
│   ├── image.utils.ts
│   └── image.utils.test.ts
├── hooks/
│   ├── useTeamSync.ts
│   └── useTeamSync.test.ts
└── __tests__/                           # E2E and global tests
    ├── e2e/
    │   ├── auth.e2e.test.ts
    │   ├── task-completion.e2e.test.ts
    │   ├── quiz-submission.e2e.test.ts
    │   └── leaderboard.e2e.test.ts
    ├── integration/
    │   ├── user-journey.test.ts
    │   └── multi-tenant.test.ts
    └── setup/
        ├── test-setup.ts
        ├── mock-data.ts
        ├── firebase-mock.ts
        └── test-utils.tsx

tests/                                   # Alternative: separate folder
├── unit/
├── integration/
├── e2e/
└── fixtures/
```

**Advantages of Co-location:**
- ✅ Tests are next to the code they test
- ✅ Easy to find and maintain
- ✅ Clear ownership
- ✅ Easier to refactor (move file + test together)

---

## 🛠️ Testing Stack Setup

### Phase 1: Install Testing Dependencies

#### Core Testing Framework
```bash
npm install --save-dev vitest @vitest/ui
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev jsdom happy-dom
```

#### Firebase Testing
```bash
npm install --save-dev @firebase/rules-unit-testing
npm install --save-dev firebase-tools  # If not already installed
```

#### E2E Testing (Choose one)
```bash
# Option A: Playwright (Recommended)
npm install --save-dev @playwright/test

# Option B: Cypress
npm install --save-dev cypress @cypress/code-coverage
```

#### Coverage & Utilities
```bash
npm install --save-dev @vitest/coverage-v8
npm install --save-dev msw  # Mock Service Worker for API mocking
npm install --save-dev @faker-js/faker  # Generate test data
```

### Phase 2: Configure Vitest

**`vitest.config.ts`** (create new file)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup/test-setup.ts'],
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
      ],
      include: ['src/**/*.{ts,tsx}'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Phase 3: Update package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:firebase": "firebase emulators:exec --only firestore 'npm run test:run'",
    "test:all": "npm run test:run && npm run test:e2e"
  }
}
```

---

## 📝 Test Categories & Priorities

### Priority 1: Critical Path (HIGH) 🔴

#### 1. Authentication Flow
**Files to Test:**
- `src/features/auth/TeamCodeLogin.tsx`
- `src/services/team.service.ts`
- `src/store/authStore.ts`

**Test Cases:**
```typescript
// TeamCodeLogin.test.tsx
describe('TeamCodeLogin', () => {
  it('should render login form');
  it('should validate team code format');
  it('should show error for invalid code');
  it('should authenticate with valid code');
  it('should store team data in authStore');
  it('should redirect after successful login');
  it('should handle network errors');
  it('should handle missing tenant');
});
```

#### 2. Quiz Validation (CRITICAL - Already partially done)
**Files to Test:**
- `src/utils/quizValidation.ts` ✅
- `src/features/submissions/QuizInput.tsx`
- `src/features/submissions/TaskSubmission.tsx`

**Test Cases:**
```typescript
// QuizInput.test.tsx
describe('QuizInput', () => {
  it('should render quiz question');
  it('should handle text input');
  it('should handle multiple choice');
  it('should handle number input');
  it('should disable submit when empty');
  it('should call onSubmit with answer');
  it('should show attempt counter');
  it('should show progressive hints');
  it('should display remaining attempts');
});

// TaskSubmission.test.tsx
describe('TaskSubmission - Quiz Logic', () => {
  it('should enforce 3-attempt limit');
  it('should calculate tiered points correctly');
  it('should award 0 points for wrong answers');
  it('should use fuzzy matching for typos');
  it('should increment attempt counter');
  it('should fail task after max attempts');
  it('should combine fuzzy + attempt multipliers');
});
```

#### 3. Task Completion Flow
**Files to Test:**
- `src/features/submissions/TaskSubmission.tsx`
- `src/services/submission.service.ts`
- `src/features/tasks/TaskDetail.tsx`

**Test Cases:**
```typescript
// submission.service.test.ts
describe('Submission Service', () => {
  it('should create photo submission');
  it('should create video submission');
  it('should create quiz submission');
  it('should validate GPS location');
  it('should prevent duplicate submissions');
  it('should calculate points correctly');
  it('should update team progress');
  it('should handle offline submissions');
});
```

### Priority 2: Core Features (MEDIUM) 🟡

#### 4. Task Management
**Files to Test:**
- `src/features/tasks/TaskList.tsx`
- `src/features/tasks/TaskCard.tsx`
- `src/services/task.service.ts`
- `src/store/taskStore.ts`

#### 5. Geolocation & GPS
**Files to Test:**
- `src/utils/geospatial.ts`
- `src/utils/geo.utils.ts`
- GPS validation in TaskSubmission

#### 6. Map Functionality
**Files to Test:**
- `src/features/map/GameMap.tsx`
- `src/store/mapStore.ts`

#### 7. Team Sync & Real-time Updates
**Files to Test:**
- `src/hooks/useTeamSync.ts`
- `src/store/authStore.ts`

### Priority 3: Supporting Features (LOW) 🟢

#### 8. Image/Video Processing
**Files to Test:**
- `src/utils/image.utils.ts`
- `src/features/submissions/CameraCapture.tsx`
- `src/features/submissions/VideoCapture.tsx`

#### 9. UI Components
**Files to Test:**
- `src/components/navigation/BottomNav.tsx`
- `src/components/legal/LegalModal.tsx`

#### 10. Configuration & Utilities
**Files to Test:**
- `src/config/app.config.ts`
- `src/utils/theme.ts`

---

## 🧪 Test Template Examples

### Unit Test Template

**`src/utils/__template__.test.ts`**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { functionToTest } from './module';

describe('ModuleName', () => {
  // Setup and teardown
  beforeEach(() => {
    // Reset state before each test
  });

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks();
  });

  describe('functionToTest', () => {
    it('should handle normal case', () => {
      const result = functionToTest('input');
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      expect(functionToTest('')).toBe('');
      expect(functionToTest(null)).toThrow();
    });

    it('should handle errors gracefully', () => {
      expect(() => functionToTest('invalid')).toThrow('Error message');
    });
  });
});
```

### React Component Test Template

**`src/components/__template__.test.tsx`**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  const defaultProps = {
    prop1: 'value1',
    onAction: vi.fn(),
  };

  it('should render correctly', () => {
    render(<ComponentName {...defaultProps} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    
    render(<ComponentName {...defaultProps} onAction={onAction} />);
    
    const button = screen.getByRole('button', { name: 'Submit' });
    await user.click(button);
    
    expect(onAction).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should show error state', () => {
    render(<ComponentName {...defaultProps} error="Error message" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    const { container } = render(<ComponentName {...defaultProps} />);
    expect(container.querySelector('[aria-label]')).toBeInTheDocument();
  });
});
```

### Integration Test Template

**`src/features/__tests__/feature.integration.test.tsx`**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupFirebaseMocks } from '../../__tests__/setup/firebase-mock';
import { FeatureComponent } from '../FeatureComponent';

describe('Feature Integration Tests', () => {
  beforeEach(() => {
    setupFirebaseMocks();
  });

  it('should complete full user flow', async () => {
    const user = userEvent.setup();
    
    // Render component
    render(<FeatureComponent />);
    
    // Step 1: Initial state
    expect(screen.getByText('Initial State')).toBeInTheDocument();
    
    // Step 2: User action
    await user.click(screen.getByRole('button', { name: 'Start' }));
    
    // Step 3: Loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Step 4: Success state
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

### E2E Test Template (Playwright)

**`tests/e2e/user-journey.e2e.test.ts`**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should complete task from start to finish', async ({ page }) => {
    // 1. Login
    await page.fill('[data-testid="team-code-input"]', 'TEAM001');
    await page.click('[data-testid="login-button"]');
    
    // 2. Wait for redirect
    await expect(page).toHaveURL(/.*tasks/);
    
    // 3. Select task
    await page.click('[data-testid="task-card-1"]');
    
    // 4. Complete quiz
    await page.fill('[data-testid="quiz-answer"]', 'Berlin');
    await page.click('[data-testid="quiz-submit"]');
    
    // 5. Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

---

## 🧩 Test Utilities & Helpers

### Create Test Setup File

**`src/__tests__/setup/test-setup.ts`**
```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;
```

### Create Test Utilities

**`src/__tests__/setup/test-utils.tsx`**
```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock stores provider
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { renderWithProviders as render };
```

### Create Firebase Mocks

**`src/__tests__/setup/firebase-mock.ts`**
```typescript
import { vi } from 'vitest';

export function setupFirebaseMocks() {
  // Mock Firestore
  const mockFirestore = {
    collection: vi.fn(() => mockFirestore),
    doc: vi.fn(() => mockFirestore),
    get: vi.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
    set: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    where: vi.fn(() => mockFirestore),
    orderBy: vi.fn(() => mockFirestore),
    limit: vi.fn(() => mockFirestore),
    onSnapshot: vi.fn((callback) => {
      callback({ docs: [] });
      return vi.fn(); // Unsubscribe function
    }),
  };

  // Mock Storage
  const mockStorage = {
    ref: vi.fn(() => mockStorage),
    put: vi.fn(() => Promise.resolve({ ref: mockStorage })),
    getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.jpg')),
  };

  return { mockFirestore, mockStorage };
}

export const mockTeamData = {
  id: 'team-123',
  name: 'Test Team',
  code: 'TEST001',
  tenantId: 'tenant-1',
  eventId: 'event-1',
  points: 100,
  tasksCompleted: 5,
};

export const mockTaskData = {
  id: 'task-123',
  type: 'QUIZ',
  description: 'What is the capital of Germany?',
  points: 100,
  quizCorrectAnswer: 'Berlin',
  quizHint: 'It starts with B',
};

export const mockSubmissionData = {
  id: 'submission-123',
  taskId: 'task-123',
  teamId: 'team-123',
  points: 100,
  timestamp: new Date(),
};
```

### Create Mock Data Generator

**`src/__tests__/setup/mock-data.ts`**
```typescript
import { faker } from '@faker-js/faker';
import { Task, Team, Submission } from '../../types/schema';

export function generateMockTeam(overrides?: Partial<Team>): Team {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    code: faker.string.alphanumeric(6).toUpperCase(),
    tenantId: faker.string.uuid(),
    eventId: faker.string.uuid(),
    points: faker.number.int({ min: 0, max: 1000 }),
    tasksCompleted: faker.number.int({ min: 0, max: 20 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

export function generateMockTask(overrides?: Partial<Task>): Task {
  return {
    id: faker.string.uuid(),
    type: 'QUIZ',
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    points: faker.number.int({ min: 10, max: 200 }),
    eventId: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    quizCorrectAnswer: 'Test Answer',
    quizHint: faker.lorem.sentence(),
    ...overrides,
  };
}

export function generateMockSubmission(overrides?: Partial<Submission>): Submission {
  return {
    id: faker.string.uuid(),
    taskId: faker.string.uuid(),
    teamId: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    eventId: faker.string.uuid(),
    type: 'text',
    textResponse: faker.lorem.sentence(),
    points: faker.number.int({ min: 0, max: 100 }),
    timestamp: faker.date.recent(),
    ...overrides,
  };
}
```

---

## 📋 Implementation Checklist

### Phase 1: Setup (4-6 hours)
- [ ] Install Vitest and testing libraries
- [ ] Create vitest.config.ts
- [ ] Create test setup files
- [ ] Create test utilities
- [ ] Create Firebase mocks
- [ ] Create mock data generators
- [ ] Update package.json scripts
- [ ] Test basic setup with sample test

### Phase 2: Unit Tests - Utils (6-8 hours)
- [ ] `src/utils/quizValidation.test.ts` ✅ (already exists, needs runner)
- [ ] `src/utils/geospatial.test.ts`
- [ ] `src/utils/geo.utils.test.ts`
- [ ] `src/utils/image.utils.test.ts`
- [ ] `src/utils/theme.test.ts`

### Phase 3: Unit Tests - Services (8-12 hours)
- [ ] `src/services/firebase.service.test.ts`
- [ ] `src/services/task.service.test.ts`
- [ ] `src/services/submission.service.test.ts`
- [ ] `src/services/team.service.test.ts`
- [ ] `src/services/storage.service.test.ts`
- [ ] `src/services/tenant.service.test.ts`

### Phase 4: Unit Tests - Stores (4-6 hours)
- [ ] `src/store/authStore.test.ts`
- [ ] `src/store/taskStore.test.ts`
- [ ] `src/store/mapStore.test.ts`

### Phase 5: Unit Tests - Hooks (2-4 hours)
- [ ] `src/hooks/useTeamSync.test.ts`

### Phase 6: Component Tests - Features (12-16 hours)
- [ ] `src/features/auth/TeamCodeLogin.test.tsx`
- [ ] `src/features/tasks/TaskList.test.tsx`
- [ ] `src/features/tasks/TaskCard.test.tsx`
- [ ] `src/features/tasks/TaskDetail.test.tsx`
- [ ] `src/features/submissions/TaskSubmission.test.tsx`
- [ ] `src/features/submissions/QuizInput.test.tsx`
- [ ] `src/features/submissions/CameraCapture.test.tsx`
- [ ] `src/features/submissions/VideoCapture.test.tsx`
- [ ] `src/features/map/GameMap.test.tsx`

### Phase 7: Component Tests - UI (4-6 hours)
- [ ] `src/components/navigation/BottomNav.test.tsx`
- [ ] `src/components/legal/LegalModal.test.tsx`
- [ ] `src/components/legal/PrivacyPolicy.test.tsx`
- [ ] `src/components/legal/TermsOfService.test.tsx`

### Phase 8: Integration Tests (8-12 hours)
- [ ] Auth flow integration test
- [ ] Task completion flow test
- [ ] Quiz submission flow test
- [ ] GPS validation flow test
- [ ] Team sync integration test

### Phase 9: E2E Tests (12-16 hours)
- [ ] Install and configure Playwright
- [ ] Create E2E test for auth flow
- [ ] Create E2E test for task completion
- [ ] Create E2E test for quiz submission
- [ ] Create E2E test for leaderboard
- [ ] Create E2E test for multi-tenant scenarios

### Phase 10: CI/CD Integration (4-6 hours)
- [ ] Create GitHub Actions workflow
- [ ] Add test coverage reporting
- [ ] Add PR checks
- [ ] Add deployment gates
- [ ] Configure Firebase emulators for CI

**Total Estimated Time: 60-80 hours**

---

## 🎯 Test Coverage Goals

### Coverage Targets by Module

| Module | Unit Tests | Integration | E2E | Target Coverage |
|--------|-----------|-------------|-----|-----------------|
| **Utils** | ✅ High | ⚠️ Medium | ❌ Low | 90%+ |
| **Services** | ✅ High | ✅ High | ⚠️ Medium | 85%+ |
| **Stores** | ✅ High | ✅ High | ❌ Low | 85%+ |
| **Features** | ✅ High | ✅ High | ✅ High | 80%+ |
| **Components** | ✅ High | ⚠️ Medium | ❌ Low | 75%+ |
| **Hooks** | ✅ High | ✅ High | ❌ Low | 85%+ |

### What to Test vs What to Skip

**✅ MUST Test:**
- Business logic (quiz validation, points calculation)
- Critical user flows (auth, task submission)
- Data transformations
- Error handling
- Edge cases
- Security validations

**⚠️ SHOULD Test:**
- UI components (user interactions)
- State management
- API integrations
- Geolocation features
- Image/video processing

**❌ CAN Skip:**
- Third-party library internals
- Simple getters/setters
- Pure presentation components (no logic)
- Configuration files
- Type definitions

---

## 🚀 CI/CD Integration

### GitHub Actions Workflow

**`.github/workflows/test.yml`** (create new file)
```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.16.0'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Archive test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            coverage/
            playwright-report/
```

---

## 📊 Success Metrics

### KPIs to Track

1. **Code Coverage**
   - Target: 80%+ overall
   - Critical paths: 90%+
   
2. **Test Execution Time**
   - Unit tests: < 30 seconds
   - Integration tests: < 2 minutes
   - E2E tests: < 5 minutes
   - Total: < 10 minutes

3. **Test Reliability**
   - Flaky test rate: < 1%
   - False positive rate: < 0.5%

4. **Bug Detection**
   - % of bugs caught by tests before production: 80%+
   - Regression rate: < 5%

5. **Developer Experience**
   - Time to write test: < 2x implementation time
   - Time to debug failed test: < 10 minutes avg

---

## 🔄 Maintenance & Best Practices

### Testing Best Practices

1. **AAA Pattern** (Arrange, Act, Assert)
```typescript
it('should calculate points correctly', () => {
  // Arrange
  const quiz = { points: 100, correctAnswer: 'Berlin' };
  const answer = 'Berlin';
  
  // Act
  const result = calculatePoints(quiz, answer, 1);
  
  // Assert
  expect(result).toBe(100);
});
```

2. **Test Isolation**
- Each test should be independent
- Use beforeEach/afterEach for setup/cleanup
- Don't rely on test execution order

3. **Descriptive Names**
```typescript
// ❌ Bad
it('test1', () => {});

// ✅ Good
it('should award 0 points for wrong quiz answer', () => {});
```

4. **Test One Thing**
```typescript
// ❌ Bad - testing multiple things
it('should handle quiz submission', () => {
  expect(submitQuiz()).toBe(true);
  expect(calculatePoints()).toBe(100);
  expect(updateLeaderboard()).toBe(true);
});

// ✅ Good - separate tests
it('should submit quiz successfully', () => {});
it('should calculate points correctly', () => {});
it('should update leaderboard after submission', () => {});
```

5. **Avoid Implementation Details**
```typescript
// ❌ Bad - testing implementation
expect(component.state.loading).toBe(true);

// ✅ Good - testing behavior
expect(screen.getByText('Loading...')).toBeInTheDocument();
```

### When to Update Tests

- ✅ When adding new features
- ✅ When fixing bugs (add regression test)
- ✅ When refactoring (tests should pass)
- ✅ When changing behavior
- ❌ Never "fix" tests to pass - fix the code or behavior

### Code Review Checklist

- [ ] Tests are written for new code
- [ ] Tests follow naming conventions
- [ ] Tests are isolated and independent
- [ ] Tests cover edge cases
- [ ] Tests are fast and reliable
- [ ] Mock external dependencies
- [ ] Coverage meets threshold
- [ ] Tests are readable and maintainable

---

## 🎓 Learning Resources

### Recommended Reading
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Test Driven Development (TDD)](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)

### Example Repositories
- [React Testing Examples](https://github.com/testing-library/react-testing-library/tree/main/examples)
- [Vitest Examples](https://github.com/vitest-dev/vitest/tree/main/examples)

---

## 📝 Next Steps

### Immediate Actions (Week 1)
1. Install testing dependencies
2. Configure Vitest
3. Create test setup files
4. Write first 5 unit tests

### Short Term (Month 1)
1. Complete all util tests
2. Complete all service tests
3. Complete critical component tests
4. Achieve 50%+ coverage

### Long Term (Month 2-3)
1. Complete all component tests
2. Add integration tests
3. Add E2E tests
4. Achieve 80%+ coverage
5. Integrate with CI/CD

---

## ✅ Conclusion

This comprehensive testing strategy provides a roadmap to build a robust test suite that enables confident refactoring and prevents regressions. Start with high-priority tests (auth, quiz validation, task submission) and gradually expand coverage.

**Key Takeaways:**
- Co-locate tests with code
- Use Vitest for speed and DX
- Mock external dependencies (Firebase, geolocation)
- Aim for 80%+ coverage
- Integrate with CI/CD early
- Make testing part of the development workflow

---

**Status:** 📋 Ready for Implementation  
**Owner:** Development Team  
**Review Date:** Monthly  
**Next Update:** After Phase 1 completion

