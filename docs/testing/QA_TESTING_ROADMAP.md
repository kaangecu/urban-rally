# Urban Rally - QA Testing Roadmap
## Comprehensive Test Coverage Strategy

**Created by**: QA Engineering Team  
**Date**: December 13, 2025  
**App**: Urban Rally (Multi-Event Scavenger Hunt Platform)  
**Current Phase**: Phase 5 - Testing & QA  
**Test Coverage Goal**: 90%+

---

## 📊 Executive Summary

### Application Overview
- **Type**: Multi-tenant, multi-event scavenger hunt web application
- **Tech Stack**: React, TypeScript, Firebase (Firestore, Auth, Functions)
- **Key Features**: 
  - Multi-event participation (1 team per event)
  - Anonymous authentication with recovery codes
  - Real-time team collaboration
  - Location-based tasks
  - Event switching

### Testing Scope
- **Lines of Code**: ~2,500+ production code
- **Services**: 3 services, 19 functions
- **Components**: 15+ React components
- **Pages**: 4 main pages
- **Critical Flows**: 8 user journeys

---

## 🎯 Testing Strategy

### Test Pyramid

```
        /\
       /  \         E2E Tests (10%)
      /____\        Integration Tests (30%)
     /      \       Unit Tests (60%)
    /________\
```

### Coverage Targets

| Layer | Target Coverage | Priority |
|-------|----------------|----------|
| **Unit Tests** | 85%+ | 🔴 Critical |
| **Integration Tests** | 75%+ | 🟡 High |
| **E2E Tests** | 100% critical paths | 🔴 Critical |
| **Security Tests** | 100% attack vectors | 🔴 Critical |
| **Performance Tests** | All pages <3s load | 🟡 High |
| **Accessibility** | WCAG 2.1 AA | 🟢 Medium |

---

## 📋 PHASE 1: Unit Testing (Week 1-2)

### 1.1 Service Layer Testing

#### **user.service.ts** (Priority: 🔴 Critical)
- [x] ✅ `createUser()` - Already tested (455 lines exist)
- [x] ✅ `getUserById()` - Already tested
- [x] ✅ `getUserByEmail()` - Already tested
- [ ] ⏳ `getUserEvents()` - NEW TEST NEEDED
  - [ ] Test: Returns all events user is in
  - [ ] Test: Returns empty array for new user
  - [ ] Test: Filters by active/ended events
  - [ ] Test: Handles Firestore errors
  - [ ] Test: Pagination (if >50 events)
- [ ] ⏳ `generateRecoveryCode()` - NEW TEST NEEDED
  - [ ] Test: Generates 6-digit code
  - [ ] Test: Code is unique (collision detection)
  - [ ] Test: Sets expiration to 30 days
  - [ ] Test: Overwrites existing code
  - [ ] Test: Updates user document
  - [ ] Test: Handles Firestore errors
- [ ] ⏳ `validateRecoveryCode()`
  - [ ] Test: Accepts valid code
  - [ ] Test: Rejects invalid code
  - [ ] Test: Rejects expired code
  - [ ] Test: Case-insensitive matching
  - [ ] Test: Handles missing user
- [ ] ⏳ `deleteUser()`
  - [ ] Test: Deletes user document
  - [ ] Test: Does NOT delete teamMember records (audit trail)
  - [ ] Test: Handles Firebase auth deletion
  - [ ] Test: Handles errors gracefully

#### **team.service.ts** (Priority: 🔴 Critical)
- [ ] ⏳ `createTeam()`
  - [ ] Test: Creates team with all required fields
  - [ ] Test: Sets default values (memberCount: 0, isActive: true)
  - [ ] Test: Generates unique teamId
  - [ ] Test: Associates with correct tenant/event
  - [ ] Test: Validates maxSize > 0
  - [ ] Test: Handles duplicate team names
- [ ] ⏳ `getTeamById()`
  - [ ] Test: Returns team when exists
  - [ ] Test: Returns null when not found
  - [ ] Test: Includes all team fields
  - [ ] Test: Handles Firestore errors
- [ ] ⏳ `canJoinTeam(teamId)`
  - [ ] Test: Returns true when team has space
  - [ ] Test: Returns false when team is full
  - [ ] Test: Returns false when team is inactive
  - [ ] Test: Returns true for unlimited team (no maxSize)
  - [ ] Test: Handles non-existent team
- [ ] ⏳ `subscribeToEventTeams()`
  - [ ] Test: Sets up Firestore listener
  - [ ] Test: Filters by tenantId and eventId
  - [ ] Test: Only returns active teams
  - [ ] Test: Orders by memberCount (teams with space first)
  - [ ] Test: Calls callback on snapshot update
  - [ ] Test: Returns unsubscribe function
  - [ ] Test: Handles Firestore errors
- [ ] ⏳ `updateTeamStats()`
  - [ ] Test: Increments memberCount
  - [ ] Test: Decrements memberCount
  - [ ] Test: Updates task completion count
  - [ ] Test: Updates team score
  - [ ] Test: Handles concurrent updates (race conditions)
- [ ] ⏳ `deleteTeam()`
  - [ ] Test: Sets isActive to false (soft delete)
  - [ ] Test: Does NOT hard delete team (audit trail)
  - [ ] Test: Updates all team members
  - [ ] Test: Handles errors

#### **teamMember.service.ts** (Priority: 🔴 CRITICAL - Multi-Event Logic)
- [ ] ⏳ `joinTeam()`
  - [ ] Test: Creates teamMember document
  - [ ] Test: Increments team memberCount
  - [ ] Test: Sets correct role (member/captain)
  - [ ] Test: Validates team is not full
  - [ ] Test: CRITICAL: Enforces 1-team-per-event rule
  - [ ] Test: Allows joining different teams in different events
  - [ ] Test: Prevents joining if already in team for that event
  - [ ] Test: Handles race conditions (2 users join simultaneously)
  - [ ] Test: Rolls back on error (transaction)
- [ ] ⏳ `getUserParticipationInEvent()`
  - [ ] Test: Returns teamMember if user in event
  - [ ] Test: Returns null if user not in event
  - [ ] Test: Includes team details
  - [ ] Test: Handles multiple events correctly
- [ ] ⏳ `getUserTeamInEvent()`
  - [ ] Test: Returns team object
  - [ ] Test: Returns null if not in event
  - [ ] Test: Includes all team details
- [ ] ⏳ `checkMultiEventRule(userId, eventId)`
  - [ ] Test: Returns false if no participation
  - [ ] Test: Returns true if already in a team for that event
  - [ ] Test: Returns false for different event
  - [ ] Test: Handles edge cases (deleted teams)
- [ ] ⏳ `leaveTeam()`
  - [ ] Test: Removes teamMember document
  - [ ] Test: Decrements team memberCount
  - [ ] Test: Allows re-joining later
  - [ ] Test: Handles last member leaving (team cleanup)
  - [ ] Test: Transaction rollback on error
- [ ] ⏳ `updateMemberRole()`
  - [ ] Test: Updates role (member → captain)
  - [ ] Test: Validates role values
  - [ ] Test: Prevents removing last captain
  - [ ] Test: Handles non-existent member

#### **firebase.service.ts** (Priority: 🟡 High)
- [ ] ⏳ `getFirebaseAuth()`
  - [ ] Test: Returns auth instance
  - [ ] Test: Singleton pattern (same instance)
- [ ] ⏳ `getFirebaseFirestore()`
  - [ ] Test: Returns firestore instance
  - [ ] Test: Singleton pattern
- [ ] ⏳ `getFirebaseFunctions()`
  - [ ] Test: Returns functions instance
  - [ ] Test: Correct region (europe-west3)

### 1.2 Hook Testing

#### **useTeamSync.ts** (Priority: 🔴 Critical)
- [ ] ⏳ Test: Subscribes to team data on mount
- [ ] ⏳ Test: Updates Zustand store on team changes
- [ ] ⏳ Test: Unsubscribes on unmount
- [ ] ⏳ Test: Handles team not found
- [ ] ⏳ Test: Real-time updates work correctly

#### **useFirebaseAuthListener.ts** (Priority: 🔴 Critical)
- [ ] ⏳ Test: Listens to auth state changes
- [ ] ⏳ Test: Restores user on page refresh
- [ ] ⏳ Test: Sets loading state correctly
- [ ] ⏳ Test: Fetches user document from Firestore
- [ ] ⏳ Test: Handles user not found
- [ ] ⏳ Test: Unsubscribes on unmount

### 1.3 Utility Testing

#### **theme.ts** (Priority: 🟢 Medium)
- [ ] ⏳ `applyTheme()`
  - [ ] Test: Applies cyberpunk theme
  - [ ] Test: Applies default theme
  - [ ] Test: Updates CSS variables
- [ ] ⏳ `isCyberpunkTheme()`
  - [ ] Test: Returns true for cyberpunk tenant
  - [ ] Test: Returns false for default tenant

#### **validation helpers** (Priority: 🟡 High)
- [ ] ⏳ `validateEmail()`
  - [ ] Test: Accepts valid emails
  - [ ] Test: Rejects invalid emails
  - [ ] Test: Handles edge cases
- [ ] ⏳ `validateRecoveryCode()`
  - [ ] Test: Accepts 6-digit codes
  - [ ] Test: Rejects invalid formats
  - [ ] Test: Case-insensitive

### 1.4 Store Testing (Zustand)

#### **authStore.ts** (Priority: 🔴 Critical)
- [ ] ⏳ Test: `setUser()` updates state
- [ ] ⏳ Test: `logout()` clears user
- [ ] ⏳ Test: `setTeam()` updates team
- [ ] ⏳ Test: `setTenant()` updates tenant
- [ ] ⏳ Test: `isAuthenticated` computed correctly
- [ ] ⏳ Test: Persist middleware saves to localStorage
- [ ] ⏳ Test: Hydration from localStorage works

---

## 📋 PHASE 2: Component Testing (Week 2-3)

### 2.1 Common Components

#### **ErrorBoundary.tsx** (Priority: 🔴 Critical)
- [ ] ⏳ Test: Renders children when no error
- [ ] ⏳ Test: Catches error and shows fallback
- [ ] ⏳ Test: "Try Again" button resets error
- [ ] ⏳ Test: "Go Home" navigates to /
- [ ] ⏳ Test: Shows error details in dev mode only
- [ ] ⏳ Test: Custom fallback prop works
- [ ] ⏳ Test: onError callback is called
- [ ] ⏳ Test: Logs errors to console

#### **LoadingSpinner.tsx** (Priority: 🟡 High)
- [ ] ⏳ Test: Renders spinner with correct size (small/medium/large)
- [ ] ⏳ Test: Displays optional text
- [ ] ⏳ Test: Full-screen mode works
- [ ] ⏳ Test: LoadingState component renders
- [ ] ⏳ Test: PageLoading component renders
- [ ] ⏳ Test: Accessibility (role="status", aria-label)

#### **ErrorState.tsx** (Priority: 🟡 High)
- [ ] ⏳ Test: Renders title and message
- [ ] ⏳ Test: "Try Again" button calls onRetry
- [ ] ⏳ Test: "Go Home" button shows when enabled
- [ ] ⏳ Test: PageError variant renders
- [ ] ⏳ Test: Default props work
- [ ] ⏳ Test: Accessibility (semantic HTML)

### 2.2 Authentication Components

#### **LoginPage.tsx** (Priority: 🔴 Critical)
- [ ] ⏳ Test: Renders login form
- [ ] ⏳ Test: "Get Started" button triggers anonymous login
- [ ] ⏳ Test: Shows loading state during login
- [ ] ⏳ Test: Redirects to /events on success
- [ ] ⏳ Test: Shows error message on failure
- [ ] ⏳ Test: "Login with Recovery Code" link works
- [ ] ⏳ Test: Keyboard navigation (Enter key)
- [ ] ⏳ Test: Accessibility (labels, focus management)

#### **RecoveryCodeLogin.tsx** (Priority: 🔴 Critical)
- [ ] ⏳ Test: Renders code input field
- [ ] ⏳ Test: Accepts 6-digit code
- [ ] ⏳ Test: Validates code format
- [ ] ⏳ Test: Shows error for invalid code
- [ ] ⏳ Test: Shows error for expired code
- [ ] ⏳ Test: Successful login redirects to /events
- [ ] ⏳ Test: "Back to Login" link works
- [ ] ⏳ Test: Auto-formats input (uppercase, no spaces)
- [ ] ⏳ Test: Keyboard navigation

### 2.3 Event Components

#### **EventSwitcher.tsx** (Priority: 🔴 Critical)
- [ ] ⏳ Test: Renders list of user's events
- [ ] ⏳ Test: Highlights current event
- [ ] ⏳ Test: Click event navigates to dashboard
- [ ] ⏳ Test: Shows tenant name and event name
- [ ] ⏳ Test: Shows event status (Active/Ended)
- [ ] ⏳ Test: Loading state while fetching events
- [ ] ⏳ Test: Error state on fetch failure
- [ ] ⏳ Test: Empty state (no events)

#### **EventHeader.tsx** (Priority: 🟡 High)
- [ ] ⏳ Test: Displays event name and tenant name
- [ ] ⏳ Test: Settings button navigates to /settings
- [ ] ⏳ Test: EventSwitcher dropdown works
- [ ] ⏳ Test: Responsive layout (mobile vs desktop)
- [ ] ⏳ Test: Accessibility (semantic headings)

#### **BrowseTeams.tsx** (Priority: 🔴 CRITICAL)
- [ ] ⏳ Test: Renders list of teams
- [ ] ⏳ Test: Search/filter teams by name or access code
- [ ] ⏳ Test: "Join Team" button works
- [ ] ⏳ Test: Disabled button when team is full
- [ ] ⏳ Test: Shows memberCount / maxSize
- [ ] ⏳ Test: Navigates to dashboard after joining
- [ ] ⏳ Test: Shows ParticipationBanner if already in team
- [ ] ⏳ Test: CRITICAL: Prevents joining if already in event
- [ ] ⏳ Test: Loading state while fetching teams
- [ ] ⏳ Test: Error state on fetch failure
- [ ] ⏳ Test: Real-time updates (new team appears)
- [ ] ⏳ Test: URL validation (redirects if invalid params)

#### **ParticipationBanner.tsx** (Priority: 🟡 High)
- [ ] ⏳ Test: Shows message when already in team
- [ ] ⏳ Test: "Go to Dashboard" button navigates
- [ ] ⏳ Test: Displays current team name
- [ ] ⏳ Test: Dismissible (if applicable)

### 2.4 Page Components

#### **EventSelector.tsx** (Priority: 🔴 Critical)
- [ ] ⏳ Test: Fetches and displays user's events
- [ ] ⏳ Test: Auto-navigates if only 1 event
- [ ] ⏳ Test: Click event navigates to /teams or /dashboard
- [ ] ⏳ Test: Shows team status (in team / not in team)
- [ ] ⏳ Test: Loading state while fetching
- [ ] ⏳ Test: Error state with retry
- [ ] ⏳ Test: Empty state (no events joined)
- [ ] ⏳ Test: Event cards show tenant, event name, date
- [ ] ⏳ Test: Active vs Ended badge

#### **Dashboard.tsx** (Priority: 🔴 Critical)
- [ ] ⏳ Test: Validates URL params (tenantId, eventId)
- [ ] ⏳ Test: Redirects if params missing
- [ ] ⏳ Test: Redirects if team doesn't match URL
- [ ] ⏳ Test: Shows EventHeader
- [ ] ⏳ Test: Renders TaskList in list view
- [ ] ⏳ Test: Renders GameMap in map view
- [ ] ⏳ Test: Renders TeamMembersTab in team view
- [ ] ⏳ Test: View mode switching (bottom nav)
- [ ] ⏳ Test: Loading state during validation
- [ ] ⏳ Test: Applies tenant theme correctly

#### **AccountSettings.tsx** (Priority: 🔴 Critical)
- [ ] ⏳ Test: Displays user account info
- [ ] ⏳ Test: "Generate Recovery Code" button works
- [ ] ⏳ Test: Shows recovery code after generation
- [ ] ⏳ Test: "Copy Code" button copies to clipboard
- [ ] ⏳ Test: Shows code expiration warning
- [ ] ⏳ Test: Displays list of joined events
- [ ] ⏳ Test: "Go to Event" buttons navigate correctly
- [ ] ⏳ Test: "Delete Account" requires double confirmation
- [ ] ⏳ Test: Account deletion works
- [ ] ⏳ Test: "Back to Dashboard" button works
- [ ] ⏳ Test: Loading state while fetching data
- [ ] ⏳ Test: Error state with retry
- [ ] ⏳ Test: Loading state during code generation

---

## 📋 PHASE 3: Integration Testing (Week 3-4)

### 3.1 Multi-Event Flow Integration
- [ ] ⏳ Test: User joins Event A, Team 1
- [ ] ⏳ Test: User joins Event B, Team 2 (different team)
- [ ] ⏳ Test: User CANNOT join Team 3 in Event A (already in Team 1)
- [ ] ⏳ Test: User can switch between Event A and Event B
- [ ] ⏳ Test: Each event maintains separate team context

### 3.2 Team Joining Flow Integration
- [ ] ⏳ Test: Browse teams → Join team → Dashboard (happy path)
- [ ] ⏳ Test: Team becomes full → Join button disabled
- [ ] ⏳ Test: User tries to join full team → Error shown
- [ ] ⏳ Test: Real-time: Another user joins → memberCount updates

### 3.3 Authentication Flow Integration
- [ ] ⏳ Test: Anonymous login → Join event → Generate code
- [ ] ⏳ Test: Logout → Login with code → Session restored
- [ ] ⏳ Test: Invalid code → Error → Retry with valid code
- [ ] ⏳ Test: Expired code → Error message shown

### 3.4 Navigation Flow Integration
- [ ] ⏳ Test: Login → Events → Teams → Dashboard (full flow)
- [ ] ⏳ Test: Dashboard → Settings → Events → Dashboard
- [ ] ⏳ Test: Dashboard → Event Switcher → Different event
- [ ] ⏳ Test: Browser back button works correctly
- [ ] ⏳ Test: Direct URL navigation works
- [ ] ⏳ Test: Invalid URL → Redirect to /events

---

## 📋 PHASE 4: End-to-End Testing (Week 4-5)

### 4.1 Critical User Journeys

#### **Journey 1: New User Onboarding** (Priority: 🔴 Critical)
```gherkin
Feature: New User Complete Flow
  
  Scenario: First-time user joins event and team
    Given I open the app for the first time
    When I click "Get Started"
    Then I should be logged in anonymously
    And I should see the event selector page
    
    When I select "Berlin Scavenger Hunt 2025"
    Then I should be redirected to browse teams page
    And I should see a list of available teams
    
    When I search for "Team Awesome"
    And I click "Join Team"
    Then I should see a success message
    And I should be redirected to the dashboard
    And I should see "Team Awesome" in the header
    And I should see my teammates
    
    When I navigate to settings
    And I click "Generate Recovery Code"
    Then I should see a 6-digit code
    And I should be able to copy it
```

**Tests**:
- [ ] ⏳ Anonymous login works
- [ ] ⏳ Event selector shows available events
- [ ] ⏳ Clicking event navigates to teams
- [ ] ⏳ Team search works
- [ ] ⏳ Join team succeeds
- [ ] ⏳ Dashboard loads with team data
- [ ] ⏳ Settings page loads
- [ ] ⏳ Recovery code generation works
- [ ] ⏳ Copy to clipboard works

#### **Journey 2: Multi-Event Participation** (Priority: 🔴 CRITICAL)
```gherkin
Feature: User Joins Multiple Events
  
  Scenario: User already in Event A joins Event B
    Given I am logged in
    And I am in "Team Alpha" in "Berlin Hunt"
    When I navigate to "Munich Hunt" event
    Then I should see browse teams page
    
    When I join "Team Beta"
    Then I should be in "Team Beta"
    And I should NOT be removed from "Team Alpha"
    
    When I try to join "Team Gamma" in "Munich Hunt"
    Then I should see an error "Already in a team for this event"
    And I should remain in "Team Beta"
    
    When I use the event switcher
    Then I should see both "Berlin Hunt" and "Munich Hunt"
    When I switch to "Berlin Hunt"
    Then I should be in "Team Alpha" context
    When I switch back to "Munich Hunt"
    Then I should be in "Team Beta" context
```

**Tests**:
- [ ] ⏳ User can join multiple events
- [ ] ⏳ Each event has separate team
- [ ] ⏳ 1-team-per-event rule enforced
- [ ] ⏳ Error shown on duplicate join attempt
- [ ] ⏳ Event switcher shows all events
- [ ] ⏳ Context switches correctly

#### **Journey 3: Recovery Code Flow** (Priority: 🔴 Critical)
```gherkin
Feature: Recovery Code Authentication
  
  Scenario: User logs in with recovery code
    Given I have a recovery code "ABC123"
    And I am logged out
    When I click "Login with Recovery Code"
    And I enter "ABC123"
    And I click "Login"
    Then I should be logged in
    And I should see my events
    And I should be in my previous teams
    
  Scenario: Invalid recovery code
    Given I am logged out
    When I enter an invalid code "WRONG1"
    And I click "Login"
    Then I should see "Invalid recovery code"
    And I should remain on the login page
```

**Tests**:
- [ ] ⏳ Valid code logs in successfully
- [ ] ⏳ Invalid code shows error
- [ ] ⏳ Expired code shows specific error
- [ ] ⏳ Session restored with correct data
- [ ] ⏳ Events and teams loaded correctly

#### **Journey 4: Team Full Scenario** (Priority: 🟡 High)
```gherkin
Feature: Team Capacity Enforcement
  
  Scenario: User tries to join full team
    Given "Team Awesome" has maxSize of 5
    And "Team Awesome" has 5 members
    When I try to join "Team Awesome"
    Then the "Join" button should be disabled
    And I should see "Team Full (5/5)"
    
  Scenario: Team becomes full while browsing
    Given "Team Beta" has 4/5 members
    And I am viewing the browse teams page
    When another user joins "Team Beta" (real-time)
    Then I should see "Team Beta" update to 5/5
    And the "Join" button should become disabled
```

**Tests**:
- [ ] ⏳ Full teams show disabled button
- [ ] ⏳ Join attempt on full team fails
- [ ] ⏳ Real-time updates reflect capacity changes
- [ ] ⏳ Error message clear and helpful

#### **Journey 5: Account Deletion** (Priority: 🟡 High)
```gherkin
Feature: Account Deletion
  
  Scenario: User deletes account
    Given I am logged in
    When I navigate to settings
    And I click "Delete Account"
    Then I should see a confirmation dialog
    
    When I check "I understand this is permanent"
    And I click "Delete My Account"
    Then my user document should be deleted
    But my teamMember records should remain (audit trail)
    And I should be logged out
    And I should be redirected to login page
```

**Tests**:
- [ ] ⏳ Double confirmation required
- [ ] ⏳ Account deletion succeeds
- [ ] ⏳ TeamMember records NOT deleted
- [ ] ⏳ User logged out
- [ ] ⏳ Redirect to login

#### **Journey 6: Error Recovery** (Priority: 🟡 High)
```gherkin
Feature: Error Handling and Recovery
  
  Scenario: Network error while joining team
    Given I am on browse teams page
    When the network fails
    And I try to join a team
    Then I should see "Network error. Please try again."
    And I should see a "Retry" button
    
    When the network recovers
    And I click "Retry"
    Then the join should succeed
    
  Scenario: Invalid URL parameters
    Given I navigate to /tenant/INVALID/event/INVALID/dashboard
    Then I should be redirected to /events
    And I should see a helpful message
```

**Tests**:
- [ ] ⏳ Network errors handled gracefully
- [ ] ⏳ Retry functionality works
- [ ] ⏳ Invalid URLs redirect correctly
- [ ] ⏳ Error boundaries catch React errors
- [ ] ⏳ User can recover without refresh

#### **Journey 7: Mobile Responsive Flow** (Priority: 🟢 Medium)
```gherkin
Feature: Mobile User Experience
  
  Scenario: User completes flow on mobile device
    Given I am on a mobile device (375px width)
    When I complete the onboarding flow
    Then all pages should be responsive
    And touch targets should be >=44px
    And text should be readable
    And no horizontal scrolling
```

**Tests**:
- [ ] ⏳ Test on mobile viewport (375px)
- [ ] ⏳ Test on tablet viewport (768px)
- [ ] ⏳ Touch targets adequate size
- [ ] ⏳ No layout breakage

#### **Journey 8: Session Persistence** (Priority: 🔴 Critical)
```gherkin
Feature: Session Persistence
  
  Scenario: User refreshes page
    Given I am logged in and on the dashboard
    When I refresh the page
    Then I should remain logged in
    And I should still be on the dashboard
    And my team context should be preserved
    
  Scenario: User closes and reopens browser
    Given I am logged in
    When I close the browser
    And I reopen it and navigate to the app
    Then I should still be logged in
    And my session should be restored
```

**Tests**:
- [ ] ⏳ Page refresh preserves session
- [ ] ⏳ Browser close/reopen preserves session
- [ ] ⏳ localStorage persists auth state
- [ ] ⏳ Firebase listener restores user data

### 4.2 E2E Test Implementation

#### **Test Environment Setup**
- [ ] ⏳ Install Playwright
  ```bash
  npm install -D @playwright/test
  npx playwright install
  ```
- [ ] ⏳ Create `playwright.config.ts`
- [ ] ⏳ Setup Firebase emulator for E2E tests
- [ ] ⏳ Create test data seeding scripts
- [ ] ⏳ Setup CI/CD for E2E tests

#### **Test Organization**
```
e2e/
├── fixtures/
│   ├── testData.ts          # Test users, events, teams
│   └── helpers.ts            # Reusable test helpers
├── journeys/
│   ├── 01-new-user-onboarding.spec.ts
│   ├── 02-multi-event-participation.spec.ts
│   ├── 03-recovery-code-flow.spec.ts
│   ├── 04-team-full-scenario.spec.ts
│   ├── 05-account-deletion.spec.ts
│   ├── 06-error-recovery.spec.ts
│   ├── 07-mobile-responsive.spec.ts
│   └── 08-session-persistence.spec.ts
└── visual-regression/
    ├── login-page.spec.ts
    ├── dashboard.spec.ts
    └── settings-page.spec.ts
```

---

## 📋 PHASE 5: Security Testing (Week 5-6)

### 5.1 Firestore Security Rules Testing

#### **users Collection**
- [ ] ⏳ Test: User can read own document
- [ ] ⏳ Test: User CANNOT read other user's document
- [ ] ⏳ Test: User can write own document
- [ ] ⏳ Test: User CANNOT write other user's document
- [ ] ⏳ Test: Recovery code not exposed in queries
- [ ] ⏳ Test: Email privacy enforced
- [ ] ⏳ Test: Unauthenticated users cannot read users

#### **teams Collection**
- [ ] ⏳ Test: Anyone can read active teams
- [ ] ⏳ Test: Authenticated users can create teams
- [ ] ⏳ Test: Only team members can update team
- [ ] ⏳ Test: Team deletion restricted to captains
- [ ] ⏳ Test: Inactive teams not queryable by default
- [ ] ⏳ Test: maxSize cannot be reduced below memberCount

#### **teamMembers Collection**
- [ ] ⏳ Test: User can read own memberships
- [ ] ⏳ Test: User can read teammates in same team
- [ ] ⏳ Test: User CANNOT read unrelated memberships
- [ ] ⏳ Test: User can create own membership (join team)
- [ ] ⏳ Test: User CANNOT create membership for others
- [ ] ⏳ Test: 1-team-per-event rule enforced at DB level
- [ ] ⏳ Test: User can delete own membership (leave team)
- [ ] ⏳ Test: Captain can update member roles

### 5.2 Authentication Security

#### **Recovery Code Security**
- [ ] ⏳ Test: Recovery code entropy (6 digits = 1M possibilities)
  - [ ] Recommendation: Upgrade to 8+ alphanumeric
- [ ] ⏳ Test: Codes stored securely (hashed?)
- [ ] ⏳ Test: Rate limiting on code verification
- [ ] ⏳ Test: Brute force protection (max 5 attempts)
- [ ] ⏳ Test: Code expiration enforced
- [ ] ⏳ Test: Old codes invalidated after regeneration

#### **Session Security**
- [ ] ⏳ Test: Sessions expire after inactivity
- [ ] ⏳ Test: No session fixation vulnerabilities
- [ ] ⏳ Test: Logout clears all session data
- [ ] ⏳ Test: localStorage security (XSS prevention)

### 5.3 Input Validation & Injection Testing

#### **XSS (Cross-Site Scripting)**
- [ ] ⏳ Test: Team name with `<script>alert('xss')</script>`
- [ ] ⏳ Test: User display name with malicious HTML
- [ ] ⏳ Test: Event name with JavaScript
- [ ] ⏳ Test: All user inputs sanitized
- [ ] ⏳ Test: React escaping works correctly

#### **Firestore Injection**
- [ ] ⏳ Test: Team search with special characters
- [ ] ⏳ Test: User email with SQL-like syntax
- [ ] ⏳ Test: Access code with wildcards
- [ ] ⏳ Test: Firestore queries parameterized

#### **Path Traversal**
- [ ] ⏳ Test: URL with `../../` sequences
- [ ] ⏳ Test: tenantId with special chars
- [ ] ⏳ Test: eventId validation

### 5.4 Authorization Testing

#### **Horizontal Privilege Escalation**
- [ ] ⏳ Test: User A cannot modify User B's data
- [ ] ⏳ Test: User A cannot join team on behalf of User B
- [ ] ⏳ Test: User A cannot access User B's recovery code

#### **Vertical Privilege Escalation**
- [ ] ⏳ Test: Member cannot promote to captain
- [ ] ⏳ Test: Non-tenant-admin cannot create events
- [ ] ⏳ Test: Regular user cannot delete teams

### 5.5 OWASP Top 10 Coverage

- [ ] ⏳ **A01: Broken Access Control**
  - URL manipulation
  - Force browsing
  - Missing function level access control

- [ ] ⏳ **A02: Cryptographic Failures**
  - Recovery code storage
  - Sensitive data exposure

- [ ] ⏳ **A03: Injection**
  - XSS, Firestore injection (covered above)

- [ ] ⏳ **A04: Insecure Design**
  - Multi-event logic flaws
  - Race conditions

- [ ] ⏳ **A05: Security Misconfiguration**
  - Firebase security rules
  - CORS policies

- [ ] ⏳ **A06: Vulnerable Components**
  - npm audit
  - Dependency scanning

- [ ] ⏳ **A07: Identification & Authentication Failures**
  - Recovery code weakness (covered)
  - Session management (covered)

- [ ] ⏳ **A08: Software & Data Integrity Failures**
  - Client-side validation only
  - Missing server-side validation

- [ ] ⏳ **A09: Security Logging Failures**
  - No audit trail for sensitive operations
  - Error logging exposes sensitive info

- [ ] ⏳ **A10: Server-Side Request Forgery**
  - Not applicable (no server-side HTTP requests)

---

## 📋 PHASE 6: Performance Testing (Week 6)

### 6.1 Lighthouse Audits

#### **All Pages**
- [ ] ⏳ Login Page
  - [ ] Performance: >90
  - [ ] Accessibility: >90
  - [ ] Best Practices: >90
  - [ ] SEO: >90
  - [ ] First Contentful Paint: <1.5s
  - [ ] Time to Interactive: <3s

- [ ] ⏳ Event Selector Page
  - [ ] Same metrics as above
  - [ ] Test with 1, 10, 50, 100 events

- [ ] ⏳ Browse Teams Page
  - [ ] Test with 1, 10, 50, 100 teams
  - [ ] Real-time updates performance

- [ ] ⏳ Dashboard Page
  - [ ] Largest Contentful Paint: <2.5s
  - [ ] Cumulative Layout Shift: <0.1

- [ ] ⏳ Account Settings Page
  - [ ] Same metrics

### 6.2 Load Testing

#### **Firestore Read/Write Performance**
- [ ] ⏳ Measure: Average query time
- [ ] ⏳ Measure: 95th percentile query time
- [ ] ⏳ Test: 100 concurrent users browsing teams
- [ ] ⏳ Test: 1,000 teams in single event
- [ ] ⏳ Test: 100 events per user
- [ ] ⏳ Estimate: Firestore costs at scale

#### **Real-Time Updates**
- [ ] ⏳ Test: Subscription latency
- [ ] ⏳ Test: 10 users joining team simultaneously
- [ ] ⏳ Test: 100 users viewing same team list

### 6.3 Bundle Size Optimization

- [ ] ⏳ Run bundle analyzer
  ```bash
  npm run build -- --analyze
  ```
- [ ] ⏳ Current bundle size: ____ KB gzipped
- [ ] ⏳ Target: <500KB gzipped
- [ ] ⏳ Identify largest dependencies
- [ ] ⏳ Enable code splitting
- [ ] ⏳ Lazy load routes
- [ ] ⏳ Tree-shake unused code
- [ ] ⏳ Optimize images (WebP, lazy loading)

### 6.4 Memory Leak Testing

- [ ] ⏳ Test: No memory leaks on page navigation
- [ ] ⏳ Test: Firestore listeners unsubscribed
- [ ] ⏳ Test: No zombie timers/intervals
- [ ] ⏳ Test: Component cleanup on unmount

---

## 📋 PHASE 7: Accessibility Testing (Week 7)

### 7.1 WCAG 2.1 Level AA Compliance

#### **Perceivable**
- [ ] ⏳ **1.1 Text Alternatives**
  - All images have alt text
  - Icons have aria-labels
  - Decorative images use alt=""

- [ ] ⏳ **1.2 Time-based Media**
  - Not applicable (no video/audio)

- [ ] ⏳ **1.3 Adaptable**
  - Semantic HTML (headings, landmarks, lists)
  - Correct heading hierarchy (h1 → h2 → h3)
  - Form labels properly associated

- [ ] ⏳ **1.4 Distinguishable**
  - Color contrast: 4.5:1 for text, 3:1 for UI
  - Text resizable up to 200%
  - No content lost when zoomed

#### **Operable**
- [ ] ⏳ **2.1 Keyboard Accessible**
  - All functionality via keyboard
  - No keyboard traps
  - Logical tab order

- [ ] ⏳ **2.2 Enough Time**
  - No time limits on tasks
  - Session timeout warnings

- [ ] ⏳ **2.3 Seizures**
  - No flashing content >3 times/second

- [ ] ⏳ **2.4 Navigable**
  - Skip links
  - Page titles descriptive
  - Focus indicators visible
  - Link text descriptive

- [ ] ⏳ **2.5 Input Modalities**
  - Touch targets >=44x44px
  - No motion-only inputs

#### **Understandable**
- [ ] ⏳ **3.1 Readable**
  - Page language declared (`<html lang="en">`)
  - Jargon explained

- [ ] ⏳ **3.2 Predictable**
  - Consistent navigation
  - No unexpected context changes

- [ ] ⏳ **3.3 Input Assistance**
  - Form errors identified
  - Error suggestions provided
  - Labels or instructions

#### **Robust**
- [ ] ⏳ **4.1 Compatible**
  - Valid HTML
  - ARIA used correctly
  - Status messages announced

### 7.2 Screen Reader Testing

- [ ] ⏳ Test with VoiceOver (macOS/iOS)
- [ ] ⏳ Test with NVDA (Windows)
- [ ] ⏳ Test with JAWS (Windows)
- [ ] ⏳ All content accessible
- [ ] ⏳ Focus management correct
- [ ] ⏳ Dynamic updates announced

### 7.3 Keyboard Navigation

- [ ] ⏳ Tab through entire app
- [ ] ⏳ Enter/Space activate buttons
- [ ] ⏳ Escape closes modals
- [ ] ⏳ Arrow keys in lists (optional)
- [ ] ⏳ No keyboard traps

---

## 📋 PHASE 8: Cross-Browser & Device Testing (Week 7-8)

### 8.1 Browser Compatibility

#### **Desktop Browsers**
- [ ] ⏳ Chrome (latest 2 versions)
- [ ] ⏳ Firefox (latest 2 versions)
- [ ] ⏳ Safari (latest 2 versions)
- [ ] ⏳ Edge (latest 2 versions)

#### **Mobile Browsers**
- [ ] ⏳ Safari iOS (latest)
- [ ] ⏳ Chrome Android (latest)
- [ ] ⏳ Samsung Internet

### 8.2 Device Testing

#### **Desktop Resolutions**
- [ ] ⏳ 1920x1080 (Full HD)
- [ ] ⏳ 1366x768 (Common laptop)
- [ ] ⏳ 2560x1440 (2K)

#### **Tablet Resolutions**
- [ ] ⏳ iPad (768x1024)
- [ ] ⏳ iPad Pro (1024x1366)

#### **Mobile Resolutions**
- [ ] ⏳ iPhone SE (375x667) - Smallest
- [ ] ⏳ iPhone 12/13/14 (390x844)
- [ ] ⏳ iPhone 14 Pro Max (430x932)
- [ ] ⏳ Android (360x740)

### 8.3 Network Conditions

- [ ] ⏳ Fast 4G
- [ ] ⏳ Slow 3G
- [ ] ⏳ Offline mode (PWA)
- [ ] ⏳ Connection interruption

---

## 📋 PHASE 9: Regression Testing (Ongoing)

### 9.1 Automated Regression Suite

- [ ] ⏳ Setup CI to run all tests on every PR
- [ ] ⏳ Run E2E tests nightly
- [ ] ⏳ Visual regression with Playwright screenshots
- [ ] ⏳ Performance budget checks

### 9.2 Manual Smoke Tests (Pre-Release)

**Critical Path Checklist** (15 minutes):
- [ ] ⏳ Login works
- [ ] ⏳ Can join event
- [ ] ⏳ Can join team
- [ ] ⏳ Dashboard loads
- [ ] ⏳ Can generate recovery code
- [ ] ⏳ Can logout and login with code
- [ ] ⏳ Event switcher works
- [ ] ⏳ Settings page works
- [ ] ⏳ No console errors

---

## 📋 PHASE 10: Test Automation & CI/CD (Week 8)

### 10.1 GitHub Actions Setup

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run lint
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
      - uses: treosh/lighthouse-ci-action@v9
```

### 10.2 Test Coverage Gates

- [ ] ⏳ Block PR merge if coverage <80%
- [ ] ⏳ Block PR merge if E2E tests fail
- [ ] ⏳ Block PR merge if lint errors
- [ ] ⏳ Block PR merge if build fails

---

## 📊 Test Metrics & Reporting

### Key Metrics to Track

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Unit Test Coverage** | 85% | __% | ⏳ |
| **Integration Coverage** | 75% | __% | ⏳ |
| **E2E Coverage** | 100% critical | __% | ⏳ |
| **Test Execution Time** | <5 min | __ min | ⏳ |
| **Flaky Test Rate** | <5% | __% | ⏳ |
| **Defect Escape Rate** | <2% | __% | ⏳ |
| **Mean Time to Detect (MTTD)** | <1 day | __ days | ⏳ |
| **Mean Time to Repair (MTTR)** | <4 hours | __ hours | ⏳ |

### Test Reporting

- [ ] ⏳ Generate HTML coverage report
- [ ] ⏳ Publish Playwright test report
- [ ] ⏳ Track test metrics in dashboard
- [ ] ⏳ Weekly test health report

---

## 🚨 Risk Assessment

### High-Risk Areas (Extra Testing)

1. **Multi-Event Logic** 🔴
   - 1-team-per-event enforcement
   - Event context switching
   - Race conditions

2. **Real-Time Updates** 🔴
   - Firestore listeners
   - Subscription cleanup
   - Concurrent modifications

3. **Authentication** 🔴
   - Session persistence
   - Recovery code security
   - Auth state restoration

4. **Team Joining** 🟡
   - Team capacity
   - Race conditions
   - Transaction rollbacks

5. **Data Integrity** 🟡
   - Firestore transactions
   - Optimistic updates
   - Error recovery

---

## ✅ Definition of Done (Testing)

Testing phase is complete when:

- [ ] ⏳ 85%+ unit test coverage
- [ ] ⏳ 75%+ integration test coverage
- [ ] ⏳ 100% critical path E2E coverage
- [ ] ⏳ All security tests passing
- [ ] ⏳ Zero critical vulnerabilities
- [ ] ⏳ Performance benchmarks met
- [ ] ⏳ WCAG 2.1 AA compliant
- [ ] ⏳ Cross-browser tested
- [ ] ⏳ Mobile responsive verified
- [ ] ⏳ CI/CD pipeline operational
- [ ] ⏳ Test documentation complete

---

## 📅 Timeline Summary

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Unit Tests | 2 weeks | Week 1 | Week 2 |
| Phase 2: Component Tests | 1-2 weeks | Week 2 | Week 3 |
| Phase 3: Integration Tests | 1 week | Week 3 | Week 4 |
| Phase 4: E2E Tests | 1-2 weeks | Week 4 | Week 5 |
| Phase 5: Security Tests | 1-2 weeks | Week 5 | Week 6 |
| Phase 6: Performance Tests | 1 week | Week 6 | Week 6 |
| Phase 7: Accessibility Tests | 1 week | Week 7 | Week 7 |
| Phase 8: Cross-Browser Tests | 1 week | Week 7 | Week 8 |
| Phase 9: Regression Suite | Ongoing | Week 1 | Ongoing |
| Phase 10: CI/CD Setup | 1 week | Week 8 | Week 8 |

**Total Duration**: 8 weeks for comprehensive coverage

---

## 🎯 Priority Matrix

### Must Have (P0) - Before Production
- ✅ Unit tests for services (multi-event logic)
- ✅ E2E tests for critical journeys
- ✅ Security audit (Firestore rules, auth)
- ✅ Performance testing (Lighthouse >90)

### Should Have (P1) - Shortly After Launch
- ✅ Component tests
- ✅ Integration tests
- ✅ Accessibility audit
- ✅ Cross-browser testing

### Nice to Have (P2) - Ongoing Improvement
- Visual regression tests
- Internationalization testing
- Advanced performance optimization
- Load testing at scale

---

**Document Owner**: QA Engineering Team  
**Last Updated**: December 13, 2025  
**Next Review**: Weekly during testing phase

---

## 📞 Testing Support

**Questions?** Contact:
- QA Lead: [Your Name]
- Dev Team: [Dev Lead]
- Product: [Product Manager]

**Resources**:
- Test Reports: `/coverage/index.html`
- E2E Reports: `/playwright-report/index.html`
- CI Dashboard: [GitHub Actions URL]
