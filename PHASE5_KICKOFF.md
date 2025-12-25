# Phase 5: Testing & Quality Assurance - KICKOFF

**Started**: December 13, 2025  
**Status**: 🚀 In Progress  
**Priority**: 🔴 CRITICAL  
**Estimated Duration**: 2-3 weeks

---

## 🎯 Phase 5 Objectives

1. **Achieve 80% test coverage** across services, hooks, and components
2. **Setup E2E testing** with Playwright for critical user journeys
3. **Security audit** of Firestore rules and authentication
4. **Performance testing** and optimization
5. **Production readiness** checklist completion

---

## ✅ Infrastructure Setup Complete

### Testing Libraries Installed ✅
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

**Installed Packages**:
- `vitest` - Test runner (Vite-native)
- `@vitest/ui` - Visual test UI
- `@testing-library/react` - React component testing
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - DOM matchers
- `jsdom` - DOM environment for tests

### Configuration Files ✅
- **`vitest.config.ts`** - Test configuration with coverage settings
- **`src/__tests__/setup/test-setup.ts`** - Test setup with mocks

### Existing Tests ✅
- ✅ `src/services/__tests__/user.service.test.ts` (comprehensive)
- ✅ `src/utils/quizValidation.test.ts` (some failures to fix)
- ✅ Test setup with Firebase mocks

---

## 📋 Phase 5.1: Unit Testing (Week 1)

### Service Layer Tests (Priority 1)

#### ✅ Completed
- [x] **user.service.ts** - Already has comprehensive tests (455 lines)
  - createUser
  - getUserById
  - getUserByEmail
  - updateUserProfile
  - updateUserStats
  - getUserEvents (needs test)
  - generateRecoveryCode (needs test)

#### 🔄 In Progress
- [ ] **team.service.ts** - Core team management functions
  - [ ] canJoinTeam
  - [ ] subscribeToEventTeams
  - [ ] getTeamById
  - [ ] createTeam
  - [ ] updateTeamStats
  - [ ] deleteTeam

#### ⏳ Pending
- [ ] **teamMember.service.ts** - Critical for multi-event logic
  - [ ] joinTeam
  - [ ] getUserParticipationInEvent
  - [ ] getUserTeamInEvent
  - [ ] checkMultiEventRule
  - [ ] leaveTeam
  - [ ] updateMemberRole

### Test Coverage Targets
- **Services**: 80% line coverage
- **Critical paths**: 100% coverage (auth, team joining, multi-event logic)
- **Edge cases**: Error handling, validation failures

---

## 📋 Phase 5.2: Component Testing (Week 1-2)

### Common Components
- [ ] **ErrorBoundary.tsx**
  - [ ] Test error catching
  - [ ] Test fallback UI rendering
  - [ ] Test "Try Again" functionality
  - [ ] Test custom fallback prop

- [ ] **LoadingSpinner.tsx**
  - [ ] Test size variants (small, medium, large)
  - [ ] Test with/without text
  - [ ] Test fullScreen mode
  - [ ] Test LoadingState component
  - [ ] Test PageLoading component

- [ ] **ErrorState.tsx**
  - [ ] Test title and message rendering
  - [ ] Test retry button functionality
  - [ ] Test home button visibility
  - [ ] Test PageError variant

### Auth Components
- [ ] **LoginPage.tsx**
  - [ ] Test anonymous login flow
  - [ ] Test loading states
  - [ ] Test error handling
  - [ ] Test navigation after login

- [ ] **RecoveryCodeLogin.tsx**
  - [ ] Test code input validation
  - [ ] Test invalid code handling
  - [ ] Test successful recovery
  - [ ] Test error messages

### Event Components
- [ ] **EventSwitcher.tsx**
  - [ ] Test event list rendering
  - [ ] Test event selection
  - [ ] Test navigation on switch
  - [ ] Test loading states

- [ ] **EventHeader.tsx**
  - [ ] Test event info display
  - [ ] Test settings button navigation
  - [ ] Test event switcher integration

- [ ] **BrowseTeams.tsx**
  - [ ] Test team list rendering
  - [ ] Test team filtering/search
  - [ ] Test join team functionality
  - [ ] Test loading and error states
  - [ ] Test participation banner

### Pages
- [ ] **EventSelector.tsx**
  - [ ] Test event loading
  - [ ] Test auto-navigation (single event)
  - [ ] Test event selection
  - [ ] Test error handling

- [ ] **Dashboard.tsx**
  - [ ] Test route validation
  - [ ] Test component rendering
  - [ ] Test view mode switching
  - [ ] Test loading states

- [ ] **AccountSettings.tsx**
  - [ ] Test account info display
  - [ ] Test recovery code generation
  - [ ] Test code copying
  - [ ] Test account deletion
  - [ ] Test events list

---

## 📋 Phase 5.3: End-to-End Testing (Week 2)

### Setup
- [ ] Install Playwright
  ```bash
  npm install -D @playwright/test
  npx playwright install
  ```

- [ ] Create `e2e/` directory structure
- [ ] Configure Playwright (`playwright.config.ts`)

### Critical User Journeys

#### Journey 1: New User Flow
```gherkin
Feature: New user joins event and team
  Scenario: First-time user
    Given I visit the app
    When I click "Get Started"
    Then I should be logged in anonymously
    And I should see event selector
    
    When I select an event
    Then I should see browse teams page
    
    When I join a team
    Then I should see the dashboard
    And I should be part of the team
```

#### Journey 2: Multi-Event Flow
```gherkin
Feature: User joins multiple events
  Scenario: User already in Event A joins Event B
    Given I am logged in and in Event A
    When I navigate to Event B teams
    And I join a team in Event B
    Then I should be in a different team than Event A
    And I should be able to switch between events
```

#### Journey 3: Recovery Code Flow
```gherkin
Feature: User uses recovery code
  Scenario: User logs in with recovery code
    Given I have a recovery code
    When I enter my recovery code
    Then I should be logged in
    And I should see my events
```

#### Journey 4: Account Management
```gherkin
Feature: User manages account
  Scenario: User views and manages account
    Given I am logged in
    When I click settings
    Then I should see my account info
    
    When I generate a recovery code
    Then I should see a 6-digit code
    And I should be able to copy it
```

### Error Scenarios
- [ ] Invalid recovery code
- [ ] Team full (can't join)
- [ ] Already in team (try join another)
- [ ] Invalid URL parameters
- [ ] Network errors

---

## 📋 Phase 5.4: Security Audit (Week 2-3)

### Firestore Security Rules
- [ ] **users collection**
  - [ ] Test: Users can only read/write own document
  - [ ] Test: Recovery code properly secured
  - [ ] Test: Prevent data leakage

- [ ] **teams collection**
  - [ ] Test: Anyone can read active teams
  - [ ] Test: Only authorized users can create teams
  - [ ] Test: Team updates properly restricted

- [ ] **teamMembers collection**
  - [ ] Test: Users can only modify own memberships
  - [ ] Test: Multi-event rule enforced at DB level
  - [ ] Test: Prevent duplicate memberships

### Authentication Security
- [ ] **Recovery Code Generation**
  - [ ] Test: Sufficient entropy (6 digits = 10^6 combinations)
  - [ ] Recommendation: Consider 8+ digits or alphanumeric
  - [ ] Test: Codes expire after 30 days
  - [ ] Test: Codes can be regenerated

- [ ] **Session Management**
  - [ ] Test: Session persists securely
  - [ ] Test: No XSS vulnerabilities
  - [ ] Test: CSRF protection

### Input Validation
- [ ] Test all user inputs for:
  - [ ] XSS (script injection)
  - [ ] SQL injection (Firestore)
  - [ ] Path traversal
  - [ ] Command injection

---

## 📋 Phase 5.5: Performance Testing (Week 3)

### Lighthouse Audits
- [ ] Run Lighthouse on all pages
  - [ ] Performance score >90
  - [ ] Accessibility score >90
  - [ ] Best practices score >90
  - [ ] SEO score >90

### Load Testing
- [ ] Test with 100 concurrent users
- [ ] Test with 1,000 teams in event
- [ ] Test with 100 events per user
- [ ] Measure Firestore costs

### Bundle Size
- [ ] Analyze bundle with `vite-bundle-visualizer`
- [ ] Current size: ~500KB (target: <500KB gzipped)
- [ ] Enable code splitting if needed
- [ ] Remove unused dependencies

---

## 📊 Current Test Status

### Test Run Summary (Initial)
```
Test Files: 7 failed | 5 passed (12)
Tests: 23 failed | 72 passed (95)
```

### Issues to Fix
1. **Node modules tests failing** - Excluded from config ✅
2. **Quiz validation tests** - Need to review fuzzy matching logic
3. **user.service.test.ts** - File not being picked up (investigate)

### Next Steps
1. ✅ Update vitest.config to exclude node_modules tests
2. ⏳ Fix user.service.test.ts import issue
3. ⏳ Create team.service.test.ts
4. ⏳ Create teamMember.service.test.ts
5. ⏳ Run tests with coverage report

---

## 🎯 Success Metrics

### Technical Metrics
- [ ] **Test Coverage**: >80% overall
- [ ] **Service Coverage**: >90%
- [ ] **Critical Path Coverage**: 100%
- [ ] **E2E Coverage**: All critical journeys
- [ ] **Performance Score**: >90 (Lighthouse)
- [ ] **Zero Critical Security Issues**

### Quality Gates
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings in src/
- [ ] Coverage thresholds met
- [ ] E2E tests passing

---

## 📝 Commands Reference

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest src/services/__tests__/team.service.test.ts
```

### E2E Tests (After Playwright setup)
```bash
# Run E2E tests
npx playwright test

# Run E2E tests with UI
npx playwright test --ui

# Run specific test
npx playwright test e2e/user-journey.spec.ts
```

### Coverage
```bash
# Generate coverage report
npm run test:coverage

# Open coverage report
open coverage/index.html
```

---

## 🚧 Blockers & Risks

### Current Blockers
1. **user.service.test.ts not running** - Need to investigate
2. **Firebase mocking strategy** - Need consistent approach
3. **E2E environment setup** - Need Firebase emulator or test project

### Risks
- **Time estimate**: May take longer than 2-3 weeks
- **Firebase costs**: Test data could incur costs (use emulator)
- **Flaky tests**: E2E tests can be unreliable
- **Coverage gaps**: Some code may be hard to test

### Mitigation
- Use Firebase emulator for E2E tests
- Mock Firestore aggressively in unit tests
- Use test utilities and helpers
- Prioritize critical paths

---

## 📅 Timeline

### Week 1 (Dec 13-20)
- Days 1-2: Unit tests for services
- Days 3-4: Component tests
- Day 5: Fix failing tests, improve coverage

### Week 2 (Dec 21-27)
- Days 1-2: E2E testing setup
- Days 3-4: Write E2E tests
- Day 5: Security audit start

### Week 3 (Dec 28 - Jan 3)
- Days 1-2: Security audit completion
- Days 3-4: Performance testing
- Day 5: Documentation & handoff

---

## ✅ Definition of Done

Phase 5 is complete when:
- [x] Testing infrastructure set up
- [ ] 80%+ test coverage achieved
- [ ] All critical user journeys have E2E tests
- [ ] Security audit complete with no critical issues
- [ ] Performance benchmarks met (>90 Lighthouse)
- [ ] All tests passing in CI
- [ ] Documentation updated

---

**Next Immediate Actions**:
1. Fix user.service.test.ts not being discovered
2. Create team.service.test.ts with proper mocks
3. Create teamMember.service.test.ts
4. Run coverage report
5. Create first component test

**Started by**: GitHub Copilot  
**Date**: December 13, 2025  
**Status**: Phase 5.1 in progress
