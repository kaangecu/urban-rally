# User Flow Improvement Plan: Profile-First Experience

## Current Architecture Analysis

### ✅ Already Implemented

1. **IdentityUplinkModal Component** (`src/components/auth/IdentityUplinkModal.tsx`)
   - Full-featured user creation modal
   - Collects: First Name, Last Name, Email (optional), GDPR Consent
   - Calls `createUser()` service function
   - Handles auth state management with `setAuthState`

2. **User Creation Service** (`src/services/user.service.ts`)
   - `createUser()` function
   - Creates anonymous Firebase Auth user
   - Calls `createUserDocument` Cloud Function
   - Manages auth lifecycle states: 'creating' → 'authenticated'

3. **Cloud Function** (`functions/src/index.ts`)
   - `createUserDocument` - Creates Firestore user profile via Admin SDK
   - Bypasses security rules
   - Already tested and working in emulator

4. **Auth Context** (`src/contexts/AuthContext.tsx`)
   - Global auth state machine
   - States: idle, creating, restoring, authenticated, error
   - Auth listener with race condition prevention
   - Skips listener during user creation to prevent conflicts

5. **Current User Flow**
   ```
   User enters Event Code → Browse Teams → Click "Join Team"
   ↓
   If NOT authenticated:
     → Show IdentityUplinkModal
     → Create user
     → Join team
   ↓
   If authenticated:
     → Join team directly
   ```

---

## Problem Statement

**Current Issue:** User creates profile **mid-flow** when trying to join a team, which feels like an error/blocker rather than natural onboarding.

**Error Observed:**
```
POST .../joinTeamSecure 404 (Not Found)
Error: User profile not found. Please create your profile first.
```

**Why This Happens:**
- User enters event code → Browses teams (no auth required)
- Clicks "Join Team" → IdentityUplinkModal shows
- User creates profile → Cloud Function creates user document
- **BUT** there's a timing issue where `joinTeamSecure` might be called before Firestore sync completes

---

## Proposed Solution: Profile-First Flow

### Option A: Mandatory Profile on App Launch (Recommended)

**New Flow:**
```
App Opens
↓
Check Auth State (AuthContext)
↓
If NOT authenticated:
  → Show IdentityUplinkModal IMMEDIATELY
  → User creates profile
  → Continue to app
↓
If authenticated:
  → Continue to app (normal flow)
```

**User Experience:**
- First-time users see profile modal immediately when opening app
- Returning users skip straight to their events/teams
- No mid-flow interruptions

**Advantages:**
- ✅ Zero "profile not found" errors
- ✅ Feels like proper onboarding
- ✅ User can browse/join teams freely after profile creation
- ✅ Minimal code changes (leverage existing components)

**Disadvantages:**
- ❌ User can't browse before deciding to create profile
- ❌ Slightly higher barrier to entry

---

### Option B: Optional Browse + Profile Prompt

**New Flow:**
```
App Opens
↓
Check Auth State
↓
If NOT authenticated:
  → Show "Browse" or "Create Profile" choice
  → If Browse: Show EventCodeEntry with "Sign up to join" reminders
  → If Create Profile: Show IdentityUplinkModal
↓
Protected actions (Join Team, Submit Task):
  → Require profile, show modal if missing
```

**Advantages:**
- ✅ Low barrier to entry (can explore first)
- ✅ Feels less "forced"

**Disadvantages:**
- ❌ Still has mid-flow profile creation (current problem)
- ❌ More complex state management
- ❌ Requires new UI components

---

## Implementation: Option A (Profile-First)

### Changes Required

#### 1. Update `AppRoutes.tsx` - Global Profile Check

**File:** `src/AppRoutes.tsx`

**Current:**
```tsx
export function AppRoutes() {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={!isAuthenticated ? <LoginMethodSelector /> : <Navigate to="/events" />} />
          ...
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

**New:**
```tsx
export function AppRoutes() {
  const { isAuthenticated } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user has profile on mount
  useEffect(() => {
    const checkProfile = async () => {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      
      if (!user) {
        // No Firebase Auth user - show onboarding
        setShowOnboarding(true);
      } else {
        // Has Firebase Auth - check Firestore profile
        const userProfile = await getUserById(user.uid);
        
        if (!userProfile) {
          // Auth exists but no Firestore profile - show onboarding
          setShowOnboarding(true);
        }
      }
      
      setIsCheckingAuth(false);
    };
    
    checkProfile();
  }, []);

  if (isCheckingAuth) {
    return <PageLoading message="Checking your profile..." />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global onboarding modal */}
        <IdentityUplinkModal
          isOpen={showOnboarding}
          onClose={() => {}} // Don't allow closing
          onSuccess={() => setShowOnboarding(false)}
          tenantId="default" // Use a default tenant or get from URL
        />
        
        <Routes>
          {/* Rest of routes */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

#### 2. Update `IdentityUplinkModal` - Make Backdrop Non-Dismissible

**File:** `src/components/auth/IdentityUplinkModal.tsx`

**Current:**
```tsx
const handleBackdropClick = (e: React.MouseEvent) => {
  if (e.target === e.currentTarget && !isLoading) {
    onClose();
  }
};
```

**New:**
```tsx
interface IdentityUplinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  teamName?: string;
  tenantId: string;
  teamId?: string;
  required?: boolean; // NEW: If true, modal can't be dismissed
}

const handleBackdropClick = (e: React.MouseEvent) => {
  if (e.target === e.currentTarget && !isLoading && !required) {
    onClose();
  }
};
```

**Add UI Hint:**
```tsx
{required && (
  <p className="text-sm text-gray-500 text-center mt-2">
    Create your profile to get started 🎯
  </p>
)}
```

---

#### 3. Simplify `TeamDetailModal` - Remove Conditional Auth

**File:** `src/features/teams/TeamDetailModal.tsx`

**Current (lines 63-68):**
```tsx
const handleJoinTeam = async () => {
  if (!user) {
    // Not authenticated - show auth modal instead of redirecting
    setShowAuthModal(true);
    return;
  }
```

**New:**
```tsx
const handleJoinTeam = async () => {
  // User guaranteed to be authenticated by global profile check
  if (!user) {
    console.error('User not authenticated - this should never happen');
    alert('Session error. Please refresh the page.');
    return;
  }
```

**Remove:**
- `const [showAuthModal, setShowAuthModal] = useState(false);` (line 32)
- `handleAuthSuccess` function (lines 102-137)
- `<IdentityUplinkModal>` component at bottom (lines 360-371)

---

#### 4. Fix `joinTeamSecure` Cloud Function 404 Error

**Problem:** Function returns 404, need to investigate why.

**Investigation Steps:**

1. **Check Function Export**
   ```bash
   cd functions
   grep "export const joinTeamSecure" src/index.ts
   ```

2. **Verify Compiled JS**
   ```bash
   npm run build
   grep "joinTeamSecure" lib/index.js
   ```

3. **Check Emulator Logs**
   - Look for: `✔  functions[europe-west3-joinTeamSecure]: http function initialized`
   - If missing, function not registered

4. **Verify Client Call**
   ```tsx
   // In teamMember.service.ts
   const joinTeamSecure = httpsCallable(functions, 'joinTeamSecure');
   ```

5. **Check Region**
   - Ensure function deployed to correct region
   - Client should use same region

**Likely Issue:** Function not exported or not compiled. Run `npm run build` in `functions/` directory.

---

#### 5. Update Landing Page (`LoginMethodSelector`)

**Current:** Shows "Browse Event" and "Team Code" buttons

**New:** Add prominent "Get Started" or "Create Profile" CTA above other options

**File:** `src/features/auth/LoginMethodSelector.tsx`

```tsx
<div className="space-y-4">
  {/* NEW: Primary CTA for first-time users */}
  <button
    onClick={handleGetStarted}
    className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
  >
    🎉 Get Started
  </button>
  
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300"></div>
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white text-gray-500">or</span>
    </div>
  </div>
  
  {/* Existing options */}
  <button onClick={() => navigate('/join/event')}>
    Browse Event
  </button>
  
  <button onClick={() => navigate('/join/team')}>
    Team Code
  </button>
</div>
```

---

## Alternative: Global Profile Guard Hook

**Create:** `src/hooks/useProfileGuard.ts`

```typescript
import { useEffect, useState } from 'react';
import { getFirebaseAuth } from '../services/firebase.service';
import { getUserById } from '../services/user.service';

export function useProfileGuard() {
  const [needsProfile, setNeedsProfile] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      
      if (!user) {
        setNeedsProfile(true);
        setIsChecking(false);
        return;
      }
      
      // Check Firestore profile
      const profile = await getUserById(user.uid);
      setNeedsProfile(!profile);
      setIsChecking(false);
    };
    
    checkProfile();
  }, []);

  return { needsProfile, isChecking };
}
```

**Usage in App.tsx:**
```tsx
function App() {
  const { needsProfile, isChecking } = useProfileGuard();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isChecking && needsProfile) {
      setShowModal(true);
    }
  }, [isChecking, needsProfile]);

  if (isChecking) {
    return <PageLoading />;
  }

  return (
    <>
      <IdentityUplinkModal
        isOpen={showModal}
        onClose={() => {}}
        onSuccess={() => setShowModal(false)}
        tenantId="default"
        required={true}
      />
      <AppRoutes />
    </>
  );
}
```

---

## Testing Plan

### Unit Tests

1. **useProfileGuard Hook**
   - New user (no auth) → `needsProfile = true`
   - Auth without profile → `needsProfile = true`
   - Auth with profile → `needsProfile = false`

2. **TeamDetailModal**
   - Join team without checking auth (assumes user exists)
   - Error handling if user somehow missing

### Integration Tests

1. **First-Time User Flow**
   - Open app → See profile modal immediately
   - Fill form → Submit → Modal closes
   - Navigate to EventCodeEntry → Works
   - Browse teams → Works
   - Join team → No errors

2. **Returning User Flow**
   - Open app → No profile modal
   - Direct access to events/teams

### E2E Tests

```typescript
describe('Profile-First Onboarding', () => {
  it('shows profile modal to new users', async () => {
    // Clear auth
    await clearAuth();
    
    // Visit app
    await page.goto('/');
    
    // Should see modal
    await expect(page.locator('[data-testid="identity-modal"]')).toBeVisible();
    
    // Try to close - should not close (required)
    await page.click('body', { position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="identity-modal"]')).toBeVisible();
  });
  
  it('allows joining team after profile creation', async () => {
    // Start fresh
    await clearAuth();
    await page.goto('/');
    
    // Create profile
    await page.fill('[data-testid="first-name"]', 'Test');
    await page.fill('[data-testid="last-name"]', 'User');
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="submit-button"]');
    
    // Wait for modal to close
    await expect(page.locator('[data-testid="identity-modal"]')).not.toBeVisible();
    
    // Enter event code
    await page.goto('/join/event');
    await page.fill('[data-testid="event-code"]', 'TEST123');
    await page.click('[data-testid="submit-button"]');
    
    // Join team - should work without showing modal again
    await page.click('[data-testid="join-team-button"]');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });
});
```

---

## Implementation Checklist

### Sprint 1: Core Changes (3-4 days)

- [ ] **Day 1: Global Profile Check**
  - [ ] Create `useProfileGuard` hook
  - [ ] Update `App.tsx` to show modal on mount
  - [ ] Test: New user sees modal immediately

- [ ] **Day 2: Modal Updates**
  - [ ] Add `required` prop to IdentityUplinkModal
  - [ ] Make modal non-dismissible when required
  - [ ] Update UI with "Get started" messaging
  - [ ] Test: Modal can't be closed prematurely

- [ ] **Day 3: Simplify Team Join**
  - [ ] Remove conditional auth from TeamDetailModal
  - [ ] Remove IdentityUplinkModal from TeamDetailModal
  - [ ] Assume user always exists
  - [ ] Test: Team join works without errors

- [ ] **Day 4: Fix joinTeamSecure 404**
  - [ ] Investigate Cloud Function export
  - [ ] Rebuild functions if needed
  - [ ] Verify in emulator
  - [ ] Test: joinTeamSecure returns 200

### Sprint 2: Polish & Testing (2-3 days)

- [ ] **Day 5: Update Landing Page**
  - [ ] Add "Get Started" CTA to LoginMethodSelector
  - [ ] Update copy/messaging
  - [ ] Test: Clear user flow

- [ ] **Day 6: Testing**
  - [ ] Write unit tests
  - [ ] Write integration tests
  - [ ] Write E2E tests
  - [ ] Manual QA on mobile

- [ ] **Day 7: Documentation**
  - [ ] Update architecture docs
  - [ ] Update README with new flow
  - [ ] Create troubleshooting guide

---

## Success Metrics

### Technical
- ✅ Zero "User profile not found" errors
- ✅ 100% of users have profile before accessing protected features
- ✅ < 2s from app open to profile modal showing

### User Experience
- ✅ < 30s to complete profile creation
- ✅ 90%+ profile completion rate
- ✅ Zero mid-flow interruptions after initial onboarding

### Business
- ✅ 20%+ increase in team join success rate
- ✅ Reduced support tickets related to "profile not found"

---

## Rollout Plan

### Phase 1: Development (Week 1)
- Implement core changes
- Test in emulator
- Internal dogfooding

### Phase 2: Beta Testing (Week 2)
- Deploy to staging
- 10-20 beta testers
- Gather feedback

### Phase 3: Production (Week 3)
- Deploy to production
- Monitor error rates
- Watch completion metrics

---

## Rollback Plan

If issues arise:

1. **Quick Fix:** Revert `App.tsx` changes, restore conditional auth in `TeamDetailModal`
2. **Database State:** No changes needed (users already created)
3. **User Impact:** Minimal - returns to previous flow

---

## Additional Considerations

### Multi-Tenant Support

Currently using `tenantId="default"` in global modal. 

**Options:**
1. Use first available tenant from config
2. Let user select tenant in modal
3. Extract tenant from URL if available

**Recommended:** Use config-based default tenant, allow override via URL param.

```tsx
const getTenantId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('tenantId') || APP_CONFIG.defaultTenantId;
};
```

### Offline Support

Profile creation already handles offline via:
- `createUser()` queues operation
- Syncs when online
- User can continue using app

No additional changes needed.

### Analytics

Track these events:
- `onboarding_modal_shown` - User sees modal
- `onboarding_started` - User starts filling form
- `onboarding_completed` - Profile created successfully
- `onboarding_abandoned` - User closes app before completing

---

## Conclusion

**Recommendation:** Implement **Option A (Profile-First)** with mandatory profile on app launch.

**Why:**
- ✅ Solves the core problem (no mid-flow errors)
- ✅ Minimal code changes (reuses 90% of existing code)
- ✅ Clear, predictable user experience
- ✅ Easy to test and maintain

**Effort:** 5-7 days for complete implementation and testing

**Risk:** Low - can easily rollback if issues arise

**Next Step:** Fix `joinTeamSecure` 404 error (blocker), then implement global profile check.
