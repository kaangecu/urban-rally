# User Flow Refactor: Profile-First Onboarding
## Epic: Implement Seamless Profile-First User Experience

**Epic Goal:** Ensure all users have a complete profile before accessing team features, eliminating mid-flow errors and improving conversion rates.

**Success Metrics:**
- ✅ Zero "User profile not found" errors during team join
- ✅ 90%+ completion rate on onboarding flow
- ✅ < 30 seconds average time to complete profile creation
- ✅ Support for all user types (new, returning, anonymous-to-named)

**Epic Owner:** Development Team  
**Priority:** P0 (Critical - Blocks core functionality)  
**Sprint:** 2-week sprint

---

## User Stories Covered

### US-1: First-Time User (Happy Path)
**As a** new ESN student  
**I want to** quickly create my profile when I first open the app  
**So that** I can immediately join scavenger hunts without errors

**Acceptance Criteria:**
- Profile creation modal appears on first app launch
- Takes < 30 seconds to complete
- Only asks for essential info (name + consent)
- Clear value proposition ("Join the hunt!")
- Works offline (with sync when online)

---

### US-2: Returning User with Profile
**As a** returning user with an existing profile  
**I want to** skip onboarding and go straight to my teams  
**So that** I can quickly resume playing

**Acceptance Criteria:**
- No onboarding modal shown
- Instant access to dashboard
- Profile loaded from cache (offline-ready)
- < 2 seconds to "ready" state

---

### US-3: Anonymous Browser → Profile Creator
**As a** curious visitor  
**I want to** browse events before committing to create a profile  
**So that** I can see if the event interests me

**Acceptance Criteria:**
- Optional "Browse first" link in onboarding
- Can view events and teams anonymously
- Persistent "Create profile" CTA visible
- Seamless upgrade when clicking "Join Team"
- Anonymous data preserved after profile creation

---

### US-4: User with Auth but No Firestore Profile (Edge Case)
**As a** user whose profile creation previously failed  
**I want to** be prompted to complete my profile  
**So that** I don't encounter "profile not found" errors

**Acceptance Criteria:**
- Detects auth user without Firestore document
- Shows "Complete your profile" modal
- Handles partial data gracefully
- Logs incident for monitoring

---

### US-5: Multi-Device User
**As a** user who switches between phone and laptop  
**I want to** create profile once and access it everywhere  
**So that** I don't have to re-enter information

**Acceptance Criteria:**
- Profile synced to Firestore
- Cached locally on each device
- Works offline with eventual consistency
- Same experience across devices

---

### US-6: User Who Closes Onboarding
**As a** user who accidentally closes the onboarding  
**I want to** easily restart it  
**So that** I can complete my profile without confusion

**Acceptance Criteria:**
- Onboarding can be reopened
- Profile menu shows "Complete Profile" if incomplete
- Data from partial completion preserved
- Clear path back to onboarding

---

### US-7: Offline User
**As a** user with no internet connection  
**I want to** create my profile offline  
**So that** I can start playing immediately

**Acceptance Criteria:**
- Profile creation works offline
- Auth token cached
- Syncs to server when online
- User notified of sync status

---

### US-8: GDPR-Conscious User
**As a** privacy-conscious user  
**I want to** understand what data is collected and why  
**So that** I can make informed consent decisions

**Acceptance Criteria:**
- Clear explanation of data usage
- Links to Terms and Privacy Policy
- Explicit consent checkboxes
- Cannot proceed without consent
- Consent version tracked

---

## Implementation Tickets

---

### 🎫 Ticket #1: Create Global Onboarding System
**Type:** Feature  
**Priority:** P0  
**Story Points:** 8  
**Sprint:** Sprint 1  
**Dependencies:** None

#### Description
Implement a global authentication and profile check system that runs on app initialization and determines whether to show onboarding.

#### Technical Requirements
- Add global auth state listener in `App.tsx`
- Check for both Firebase Auth user AND Firestore profile
- Handle 4 states: 
  1. No auth user
  2. Auth user, no profile
  3. Auth user + profile (complete)
  4. Auth user + partial profile

#### Acceptance Criteria
- [ ] Auth check runs before any route rendering
- [ ] Loading screen shown during auth check
- [ ] All 4 auth states handled correctly
- [ ] Profile existence cached for performance
- [ ] Works offline with cached auth state

#### Implementation Details
```typescript
// src/App.tsx
interface AuthState {
  checked: boolean;
  user: User | null;
  hasProfile: boolean;
  needsOnboarding: boolean;
}

const useAuthCheck = () => {
  const [authState, setAuthState] = useState<AuthState>({
    checked: false,
    user: null,
    hasProfile: false,
    needsOnboarding: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // No auth user - needs onboarding
        setAuthState({
          checked: true,
          user: null,
          hasProfile: false,
          needsOnboarding: true,
        });
        return;
      }

      // Check Firestore profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      setAuthState({
        checked: true,
        user,
        hasProfile: userDoc.exists(),
        needsOnboarding: !userDoc.exists(),
      });
    });

    return unsubscribe;
  }, []);

  return authState;
};
```

#### Testing
- [ ] Unit test: useAuthCheck hook returns correct state for each scenario
- [ ] Integration test: App.tsx shows correct component based on auth state
- [ ] E2E test: First-time user sees onboarding immediately

#### Files to Modify
- `src/App.tsx`
- `src/hooks/useAuthCheck.ts` (new)
- `src/contexts/AuthContext.tsx` (update)

---

### 🎫 Ticket #2: Design & Build Onboarding Modal
**Type:** Feature  
**Priority:** P0  
**Story Points:** 5  
**Sprint:** Sprint 1  
**Dependencies:** None

#### Description
Create a visually appealing, mobile-friendly onboarding modal that collects essential user information with minimal friction.

#### Design Requirements
- **Branding:** ESN colors, Urban Rally logo
- **Tone:** Friendly, energetic, game-like
- **Copy:** "Welcome to Urban Rally! 🎉" not "Create Account"
- **Fields:** Name (required), Email (optional), Consent (required)
- **CTA:** "Start Hunting!" (not "Submit")
- **Skip Option:** "Browse events first" (small, bottom)

#### UI/UX Requirements
- Mobile-first design
- Auto-focus on name input
- Real-time validation
- Enter key submits form
- Loading state during submission
- Success animation on completion
- Error handling with user-friendly messages

#### Acceptance Criteria
- [ ] Modal covers full screen on mobile, centered on desktop
- [ ] Form validated before submission
- [ ] Shows loading spinner during async operations
- [ ] Displays error messages inline
- [ ] Success state transitions smoothly to main app
- [ ] Accessible (keyboard navigation, screen readers)

#### Component Structure
```typescript
// src/components/onboarding/OnboardingModal.tsx
<OnboardingModal>
  <OnboardingHeader />
  <OnboardingForm>
    <NameInput required />
    <EmailInput optional />
    <ConsentCheckbox required />
    <SubmitButton />
  </OnboardingForm>
  <SkipLink />
</OnboardingModal>
```

#### Testing
- [ ] Visual regression tests (Chromatic/Percy)
- [ ] Accessibility audit (axe-core)
- [ ] Mobile responsive test (iPhone, Android)
- [ ] Keyboard navigation test
- [ ] Form validation test (all scenarios)

#### Files to Create
- `src/components/onboarding/OnboardingModal.tsx`
- `src/components/onboarding/OnboardingHeader.tsx`
- `src/components/onboarding/OnboardingForm.tsx`
- `src/components/onboarding/styles.css`

---

### 🎫 Ticket #3: Implement Profile Creation Logic
**Type:** Feature  
**Priority:** P0  
**Story Points:** 5  
**Sprint:** Sprint 1  
**Dependencies:** #1, #2

#### Description
Implement the backend logic for creating user profiles, including anonymous auth creation, Firestore document creation, and error handling.

#### Technical Requirements
- Create anonymous Firebase Auth user if none exists
- Call `createUserDocument` Cloud Function
- Handle all error states gracefully
- Support offline profile creation with sync
- Emit analytics event on successful creation

#### Flow
```
1. User submits form
2. Check if Firebase Auth user exists
   - No: Create anonymous auth user
   - Yes: Use existing
3. Call createUserDocument Cloud Function
   - Pass: displayName, email, tenantId, consent
4. Wait for Firestore sync
5. Update global auth state
6. Close modal & show success message
```

#### Error Handling
- Network error → Retry with exponential backoff
- Cloud Function error → Show user-friendly message
- Firestore permission error → Log and show generic error
- Validation error → Show inline field error

#### Acceptance Criteria
- [ ] Profile created in Firestore on successful submission
- [ ] Anonymous auth user created if needed
- [ ] Works offline (queued for sync)
- [ ] All errors handled gracefully
- [ ] Analytics event fired
- [ ] Loading state shown during operation

#### Implementation Details
```typescript
// src/services/onboarding.service.ts
export const completeOnboarding = async (data: OnboardingData) => {
  try {
    // 1. Ensure auth user exists
    let user = auth.currentUser;
    if (!user) {
      const authResult = await signInAnonymously(auth);
      user = authResult.user;
    }

    // 2. Create Firestore profile
    await createUserDocument({
      displayName: data.name,
      email: data.email,
      tenantId: data.tenantId,
      consentGiven: {
        terms: data.acceptedTerms,
        privacy: data.acceptedPrivacy,
        termsVersion: '1.0',
        privacyVersion: '1.0',
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
      accountType: 'anonymous',
    });

    // 3. Analytics
    logEvent(analytics, 'onboarding_completed', {
      user_id: user.uid,
      has_email: !!data.email,
    });

    return { success: true, userId: user.uid };
  } catch (error) {
    logger.error('Onboarding failed', error);
    throw new Error('Failed to create profile. Please try again.');
  }
};
```

#### Testing
- [ ] Unit test: completeOnboarding success path
- [ ] Unit test: completeOnboarding error handling
- [ ] Integration test: Profile appears in Firestore
- [ ] E2E test: Full onboarding flow end-to-end

#### Files to Create/Modify
- `src/services/onboarding.service.ts` (new)
- `src/services/user.service.ts` (update)
- `src/hooks/useOnboarding.ts` (new)

---

### 🎫 Ticket #4: Add Anonymous Browsing Mode
**Type:** Feature  
**Priority:** P1  
**Story Points:** 3  
**Sprint:** Sprint 1  
**Dependencies:** #1, #2

#### Description
Implement optional anonymous browsing mode that allows users to explore events and teams before creating a profile.

#### Requirements
- "Browse first" link in onboarding modal
- Set flag: `isAnonymousBrowsing: true`
- Persistent floating CTA: "Create profile to join teams"
- Intercept protected actions (join team, submit task)
- Show "Create profile" modal when action blocked

#### User Flow
```
1. User clicks "Browse events first"
2. Close onboarding modal
3. Show main app with limitations:
   ✅ Can view events
   ✅ Can view teams
   ✅ Can view tasks
   ❌ Cannot join teams (shows upgrade modal)
   ❌ Cannot submit tasks (shows upgrade modal)
4. Floating CTA always visible
5. Click CTA → Show onboarding modal
```

#### Acceptance Criteria
- [ ] Browse mode flag persisted to localStorage
- [ ] Protected actions intercepted
- [ ] Upgrade modal shows clear benefits
- [ ] Seamless transition from browse → profiled
- [ ] Anonymous data preserved after upgrade

#### Implementation Details
```typescript
// src/contexts/BrowsingModeContext.tsx
interface BrowsingModeContext {
  isAnonymous: boolean;
  canJoinTeams: boolean;
  canSubmitTasks: boolean;
  upgradeToProfile: () => void;
}

// src/components/FloatingProfileCTA.tsx
{isAnonymous && (
  <FloatingButton onClick={showOnboarding}>
    🎯 Create profile to join teams
  </FloatingButton>
)}

// src/guards/ProfileGuard.tsx
export const requireProfile = (action: () => void) => {
  if (isAnonymousBrowsing) {
    showUpgradeModal();
    return;
  }
  action();
};
```

#### Testing
- [ ] Unit test: BrowsingMode context
- [ ] E2E test: Browse mode flow
- [ ] E2E test: Upgrade from browse to profiled

#### Files to Create/Modify
- `src/contexts/BrowsingModeContext.tsx` (new)
- `src/components/FloatingProfileCTA.tsx` (new)
- `src/guards/ProfileGuard.tsx` (new)
- `src/components/modals/UpgradeModal.tsx` (new)

---

### 🎫 Ticket #5: Remove Mid-Flow Profile Checks
**Type:** Refactor  
**Priority:** P0  
**Story Points:** 3  
**Sprint:** Sprint 1  
**Dependencies:** #1, #3

#### Description
Remove all redundant "check if user exists" logic from team joining, task submission, and other protected actions, since profile is now guaranteed to exist.

#### Files to Modify
- `src/components/TeamDetailModal.tsx` - Remove `IdentityUplinkModal` trigger
- `src/services/teamMember.service.ts` - Remove user existence checks
- `src/services/submission.service.ts` - Remove user existence checks
- `src/components/TaskSubmissionModal.tsx` - Simplify flow

#### Current Code (TO REMOVE)
```typescript
// TeamDetailModal.tsx - BEFORE
const handleJoinTeam = async () => {
  try {
    await joinTeam(teamId, eventId, 'member');
  } catch (error) {
    if (error.message.includes('User profile not found')) {
      setShowIdentityModal(true); // ← REMOVE THIS
    }
  }
};
```

#### New Code
```typescript
// TeamDetailModal.tsx - AFTER
const handleJoinTeam = async () => {
  // User guaranteed to exist by global auth check
  await joinTeam(teamId, eventId, 'member');
  toast.success('Welcome to the team! 🎉');
};
```

#### Acceptance Criteria
- [ ] No "User profile not found" error possible
- [ ] `IdentityUplinkModal` only used for profile editing (not creation)
- [ ] All join/submit actions work immediately
- [ ] Simplified error handling (fewer code paths)

#### Testing
- [ ] Unit test: Join team without profile check
- [ ] E2E test: Full join flow with new user
- [ ] Regression test: Ensure no other features broken

#### Files to Modify
- `src/components/TeamDetailModal.tsx`
- `src/services/teamMember.service.ts`
- `src/services/submission.service.ts`
- `src/components/TaskSubmissionModal.tsx`

---

### 🎫 Ticket #6: Fix Cloud Function 404 Error
**Type:** Bug  
**Priority:** P0 (Blocker)  
**Story Points:** 2  
**Sprint:** Sprint 1  
**Dependencies:** None

#### Description
Investigate and fix the 404 error when calling `joinTeamSecure` Cloud Function from the emulator.

#### Error
```
POST http://127.0.0.1:5001/.../joinTeamSecure 404 (Not Found)
```

#### Root Cause Analysis
Possible causes:
1. Function not exported in `functions/src/index.ts`
2. TypeScript not compiled (`npm run build` not run)
3. Emulator not reloaded after code changes
4. Function name mismatch (client vs server)
5. Region mismatch (client vs server)

#### Investigation Steps
- [ ] Verify function exported: `export const joinTeamSecure = ...`
- [ ] Check compiled JS exists: `functions/lib/index.js`
- [ ] Check emulator logs for function registration
- [ ] Verify client uses correct function name
- [ ] Verify region matches (`europe-west3`)

#### Acceptance Criteria
- [ ] `joinTeamSecure` returns 200 OK (or appropriate error code, not 404)
- [ ] Function listed in emulator UI
- [ ] Function logs appear in emulator console
- [ ] Integration test passes

#### Implementation
```bash
# 1. Rebuild functions
cd functions
npm run build

# 2. Check function exists in compiled JS
grep "joinTeamSecure" lib/index.js

# 3. Restart emulators (if needed)
firebase emulators:start

# 4. Verify in emulator UI
# Visit http://127.0.0.1:4000/functions
# Should see: europe-west3-joinTeamSecure
```

#### Testing
- [ ] Manual test: Join team in UI
- [ ] Check emulator logs for function execution
- [ ] E2E test: Full join team flow

#### Files to Check
- `functions/src/index.ts`
- `functions/lib/index.js`
- `firebase.json` (emulator config)

---

### 🎫 Ticket #7: Add Profile Completeness Indicator
**Type:** Enhancement  
**Priority:** P2  
**Story Points:** 3  
**Sprint:** Sprint 2  
**Dependencies:** #1, #3

#### Description
Add a visual indicator showing profile completeness percentage and encourage users to add optional information.

#### Requirements
- Show percentage: "Profile 60% complete"
- Visual progress bar
- List missing fields: "Add email", "Add photo"
- Link to profile edit page
- Dismissible tooltip

#### Profile Completeness Formula
```typescript
const calculateCompleteness = (user: User) => {
  const fields = {
    displayName: 20,    // Required
    email: 20,          // Optional
    profilePhotoUrl: 20, // Optional
    recoveryCode: 20,   // Optional (generated)
    linkedAccount: 20,  // Optional (upgrade)
  };
  
  let total = 0;
  if (user.displayName) total += fields.displayName;
  if (user.email) total += fields.email;
  if (user.profilePhotoUrl) total += fields.profilePhotoUrl;
  if (user.recoveryCode) total += fields.recoveryCode;
  if (user.accountType === 'linked') total += fields.linkedAccount;
  
  return total;
};
```

#### UI Locations
- User menu dropdown (top-right)
- Profile page (prominent)
- Dashboard card (optional)

#### Acceptance Criteria
- [ ] Percentage calculated correctly
- [ ] Updates in real-time as fields added
- [ ] Clicking opens profile edit page
- [ ] Can be dismissed (localStorage)
- [ ] Shows specific missing fields

#### Testing
- [ ] Unit test: Completeness calculation
- [ ] Visual test: UI component
- [ ] E2E test: Add field → percentage updates

#### Files to Create
- `src/hooks/useProfileCompleteness.ts`
- `src/components/ProfileCompleteness.tsx`

---

### 🎫 Ticket #8: Add Onboarding Analytics
**Type:** Enhancement  
**Priority:** P2  
**Story Points:** 2  
**Sprint:** Sprint 2  
**Dependencies:** #1, #2, #3

#### Description
Implement comprehensive analytics tracking for the onboarding funnel to measure success and identify drop-off points.

#### Events to Track
1. `onboarding_started` - User sees modal
2. `onboarding_name_entered` - Name field filled
3. `onboarding_email_entered` - Email field filled (optional)
4. `onboarding_consent_given` - Checkboxes checked
5. `onboarding_submitted` - Form submitted
6. `onboarding_completed` - Profile created successfully
7. `onboarding_failed` - Error occurred
8. `onboarding_skipped` - User clicked "Browse first"
9. `onboarding_reopened` - User came back to complete

#### Metrics to Track
- Completion rate: `completed / started`
- Time to complete: `completed_time - started_time`
- Skip rate: `skipped / started`
- Failure rate: `failed / submitted`
- Field completion: `email_entered / started`

#### Implementation
```typescript
// src/services/analytics.service.ts
export const trackOnboardingEvent = (
  eventName: OnboardingEvent,
  properties?: Record<string, any>
) => {
  logEvent(analytics, eventName, {
    timestamp: Date.now(),
    ...properties,
  });
};

// Usage in OnboardingModal.tsx
useEffect(() => {
  trackOnboardingEvent('onboarding_started');
  const startTime = Date.now();
  
  return () => {
    const duration = Date.now() - startTime;
    trackOnboardingEvent('onboarding_closed', { duration });
  };
}, []);
```

#### Acceptance Criteria
- [ ] All 9 events tracked correctly
- [ ] Events visible in Firebase Analytics dashboard
- [ ] Funnel report created in Analytics
- [ ] Custom dashboard with key metrics
- [ ] No PII logged (names, emails hashed)

#### Testing
- [ ] Manual test: Complete onboarding, verify events in Analytics
- [ ] Automated test: Mock analytics calls

#### Files to Modify
- `src/services/analytics.service.ts`
- `src/components/onboarding/OnboardingModal.tsx`
- `docs/ANALYTICS.md` (documentation)

---

### 🎫 Ticket #9: Offline Onboarding Support
**Type:** Enhancement  
**Priority:** P1  
**Story Points:** 5  
**Sprint:** Sprint 2  
**Dependencies:** #1, #3

#### Description
Enable users to complete onboarding while offline, with automatic sync when connection is restored.

#### Requirements
- Detect offline state during onboarding
- Store profile data locally (IndexedDB)
- Queue Cloud Function call for when online
- Show "Syncing..." indicator when online
- Handle sync failures gracefully

#### User Experience
```
[Offline]
1. User fills onboarding form
2. Clicks "Start Hunting!"
3. Shows: "✅ Profile created! (Will sync when online)"
4. User can browse/join teams
5. Actions queued for sync

[Back Online]
6. Auto-sync triggered
7. Toast: "✅ Profile synced to cloud"
8. All queued actions processed
```

#### Technical Approach
```typescript
// src/services/offlineQueue.service.ts
interface QueuedAction {
  id: string;
  type: 'createProfile' | 'joinTeam' | 'submitTask';
  data: any;
  timestamp: number;
  retries: number;
}

export const queueAction = async (action: QueuedAction) => {
  await db.offlineQueue.add(action);
};

export const processQueue = async () => {
  const actions = await db.offlineQueue.toArray();
  
  for (const action of actions) {
    try {
      await executeAction(action);
      await db.offlineQueue.delete(action.id);
    } catch (error) {
      action.retries++;
      if (action.retries > 3) {
        await db.offlineQueue.delete(action.id);
        await db.failedActions.add(action);
      }
    }
  }
};
```

#### Acceptance Criteria
- [ ] Onboarding works completely offline
- [ ] Profile syncs when connection restored
- [ ] User notified of sync status
- [ ] Failed syncs logged for debugging
- [ ] Queued actions processed in order

#### Testing
- [ ] E2E test: Complete onboarding offline
- [ ] E2E test: Sync when back online
- [ ] E2E test: Handle sync failure
- [ ] Manual test: Airplane mode scenarios

#### Files to Create/Modify
- `src/services/offlineQueue.service.ts` (new)
- `src/hooks/useOfflineSync.ts` (new)
- `src/contexts/OnlineStatusContext.tsx` (new)

---

### 🎫 Ticket #10: Update Documentation
**Type:** Documentation  
**Priority:** P2  
**Story Points:** 2  
**Sprint:** Sprint 2  
**Dependencies:** #1-9

#### Description
Create comprehensive documentation for the new onboarding flow, including architecture decisions, user flows, and developer guides.

#### Documents to Create/Update

1. **USER_FLOW_ARCHITECTURE.md**
   - System architecture diagram
   - State machine diagram
   - Sequence diagrams for each flow

2. **ONBOARDING_DEV_GUIDE.md**
   - How to modify onboarding
   - How to add new fields
   - How to customize UI

3. **TESTING_GUIDE.md**
   - How to test onboarding
   - E2E test scenarios
   - Manual QA checklist

4. **ANALYTICS_DASHBOARD.md**
   - Key metrics explained
   - How to interpret funnel
   - Alert thresholds

5. **TROUBLESHOOTING.md**
   - Common issues & fixes
   - Error codes explained
   - Debug mode instructions

#### Acceptance Criteria
- [ ] All documents created/updated
- [ ] Diagrams included (Mermaid or images)
- [ ] Code examples included
- [ ] Links to related docs
- [ ] Reviewed by team

#### Files to Create
- `docs/USER_FLOW_ARCHITECTURE.md`
- `docs/ONBOARDING_DEV_GUIDE.md`
- `docs/TESTING_GUIDE.md`
- `docs/ANALYTICS_DASHBOARD.md`
- `docs/TROUBLESHOOTING.md`

---

## Sprint Plan

### Sprint 1 (Week 1-2): Core Implementation
**Goal:** Implement profile-first flow and remove mid-flow errors

**Tickets:**
- #1: Global Onboarding System (8 pts) - 3 days
- #2: Onboarding Modal UI (5 pts) - 2 days
- #3: Profile Creation Logic (5 pts) - 2 days
- #4: Anonymous Browsing (3 pts) - 1 day
- #5: Remove Mid-Flow Checks (3 pts) - 1 day
- #6: Fix 404 Error (2 pts) - 0.5 days

**Total:** 26 story points

**Capacity:** 30 points (2 developers × 15 points/sprint)

**Buffer:** 4 points for unexpected issues

---

### Sprint 2 (Week 3-4): Enhancements & Polish
**Goal:** Add progressive enhancements and complete documentation

**Tickets:**
- #7: Profile Completeness (3 pts) - 1.5 days
- #8: Analytics (2 pts) - 1 day
- #9: Offline Support (5 pts) - 2.5 days
- #10: Documentation (2 pts) - 1 day

**Total:** 12 story points

**Capacity:** 30 points

**Buffer:** 18 points for additional polish, bug fixes, user testing

---

## Testing Strategy

### Unit Tests
- All service functions
- All hooks
- All utility functions

### Integration Tests
- Auth flow end-to-end
- Profile creation + Firestore sync
- Offline queue processing

### E2E Tests
```typescript
describe('Onboarding Flow', () => {
  it('should show onboarding to new users', async () => {
    // Visit app
    await page.goto('/');
    
    // Should see onboarding modal
    await expect(page.locator('[data-testid="onboarding-modal"]')).toBeVisible();
    
    // Fill form
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.check('[data-testid="terms-checkbox"]');
    await page.check('[data-testid="privacy-checkbox"]');
    
    // Submit
    await page.click('[data-testid="submit-button"]');
    
    // Should close and show dashboard
    await expect(page.locator('[data-testid="onboarding-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  it('should allow anonymous browsing', async () => {
    await page.goto('/');
    await page.click('[data-testid="browse-link"]');
    
    // Should see main app
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    
    // Should see floating CTA
    await expect(page.locator('[data-testid="profile-cta"]')).toBeVisible();
    
    // Try to join team - should show upgrade modal
    await page.click('[data-testid="join-team-button"]');
    await expect(page.locator('[data-testid="upgrade-modal"]')).toBeVisible();
  });

  it('should skip onboarding for returning users', async () => {
    // Simulate existing user
    await setupExistingUser();
    
    await page.goto('/');
    
    // Should NOT see onboarding
    await expect(page.locator('[data-testid="onboarding-modal"]')).not.toBeVisible();
    
    // Should see dashboard immediately
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });
});
```

### Manual QA Checklist
- [ ] New user sees onboarding immediately
- [ ] Returning user skips onboarding
- [ ] Anonymous browsing works
- [ ] Upgrade from anonymous works
- [ ] Offline onboarding works
- [ ] All error states handled
- [ ] Mobile responsive
- [ ] Accessibility (keyboard, screen reader)
- [ ] Cross-browser (Chrome, Safari, Firefox)
- [ ] Cross-device (iPhone, Android, Desktop)

---

## Risk Assessment

### High Risk
🔴 **Offline sync complexity** (#9)
- Mitigation: Extensive testing, feature flag, gradual rollout

🔴 **User abandonment during onboarding** (#2)
- Mitigation: A/B test different copy, track drop-off points

### Medium Risk
🟡 **Anonymous browsing confusion** (#4)
- Mitigation: Clear UI indicators, tooltips, user testing

🟡 **Cloud Function failures** (#3, #6)
- Mitigation: Robust error handling, retry logic, fallbacks

### Low Risk
🟢 **Profile completeness spam** (#7)
- Mitigation: Dismissible, limit frequency, A/B test

---

## Success Criteria

### Technical Metrics
- ✅ Zero "User profile not found" errors in production
- ✅ < 1% onboarding failure rate
- ✅ 100% unit test coverage for onboarding logic
- ✅ < 2s time to "ready" state for returning users

### User Metrics
- ✅ 90%+ onboarding completion rate
- ✅ < 30s average onboarding duration
- ✅ 10% anonymous browsing adoption
- ✅ 4.5+ user rating (post-implementation survey)

### Business Metrics
- ✅ 20% increase in team join rate
- ✅ 15% decrease in support tickets
- ✅ 25% increase in user retention (Day 7)

---

## Rollout Plan

### Phase 1: Development (Week 1-2)
- Implement core tickets (#1-6)
- Internal testing

### Phase 2: Beta (Week 3)
- Deploy to staging
- Internal dogfooding
- Selected beta testers (10-20 users)

### Phase 3: Soft Launch (Week 4)
- Feature flag: 10% of users
- Monitor metrics closely
- Fix critical issues

### Phase 4: Full Rollout (Week 5)
- Feature flag: 50% of users
- A/B test variants
- Monitor conversion rates

### Phase 5: Complete (Week 6)
- Feature flag: 100% of users
- Remove old code paths
- Publish case study

---

## Monitoring & Alerts

### Dashboards
1. **Onboarding Funnel** (Firebase Analytics)
   - Started → Completed rate
   - Time to complete
   - Field completion rates

2. **Error Monitoring** (Sentry)
   - Onboarding errors
   - Cloud Function failures
   - Offline sync failures

3. **Performance** (Firebase Performance)
   - Time to interactive
   - Auth check duration
   - Profile load duration

### Alerts
- 🚨 Onboarding completion rate < 80%
- 🚨 Onboarding error rate > 5%
- 🚨 Average completion time > 60s
- ⚠️ Offline sync failure rate > 10%

---

## Post-Launch

### Week 1 After Launch
- Monitor all metrics 24/7
- Daily stand-ups to review issues
- Hot-fix any critical bugs

### Week 2-4 After Launch
- Analyze funnel drop-off points
- User interviews (5-10 users)
- Iterate on copy/UI based on feedback

### Month 2+
- A/B test variations
- Add progressive enhancements (#7, #9)
- Optimize conversion rate

---

## Conclusion

This epic transforms the user experience from:
❌ **Browse → Error → Forced Profile Creation**

To:
✅ **Profile First → Seamless Experience**

With optional anonymous browsing for cautious users.

**Expected Impact:**
- 🎯 90%+ onboarding completion
- 🚀 20%+ increase in team joins
- 💯 Zero mid-flow errors
- 😊 Improved user satisfaction

Ready to implement! 🚀
