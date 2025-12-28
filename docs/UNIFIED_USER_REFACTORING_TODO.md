# Unified User Schema Refactoring - Implementation Checklist

**Branch:** `refactor/unified-user-schema`  
**Estimated Time:** 5 hours  
**Status:** 🔄 IN PROGRESS

---

## Phase 1: Update Schema (30 min) ⏳

### 1.1 Update User Interface in schema.ts
- [ ] Read current User interface (lines 86-127)
- [ ] Read current UserProfile interface (lines 369-382)
- [ ] Merge interfaces into unified User type
- [ ] Add `role` field: `'player' | 'moderator' | 'organizer' | 'admin' | 'superadmin'`
- [ ] Change `email` from optional to required
- [ ] Rename `profilePhotoUrl` → `photoURL`
- [ ] Add optional `managedTenantIds?: string[]`
- [ ] Add optional `isActive?: boolean`
- [ ] Remove `linkedAccountId` field (deprecated)
- [ ] Update accountType to be required (not optional)

### 1.2 Remove UserProfile Interface
- [ ] Delete UserProfile interface completely
- [ ] Remove from exports

### 1.3 Update JSDoc Comments
- [ ] Add comprehensive documentation explaining unified model
- [ ] Document role hierarchy
- [ ] Explain optional fields (managedTenantIds, isActive)
- [ ] Add @see references to setUserRole function

### 1.4 Commit Changes
```bash
git checkout -b refactor/unified-user-schema
git add src/types/schema.ts
git commit -m "refactor: merge User and UserProfile into unified User type"
```

**Status:** ⏹️ NOT STARTED  
**Blockers:** None

---

## Phase 2: Update Code References (2 hours) ⏳

### 2.1 Update Admin Store
**File:** `src/store/adminStore.ts`
- [ ] Change import from `UserProfile` to `User`
- [ ] Update `adminProfile: UserProfile | null` → `adminProfile: User | null`
- [ ] Test TypeScript compilation

### 2.2 Update Admin Auth Hook
**File:** `src/hooks/useAdminAuth.ts`
- [ ] Change import from `UserProfile` to `User`
- [ ] Update return type to `User | null`
- [ ] Change Firestore query: `userProfiles` → `users`
- [ ] Update field access (uid → id if needed)

### 2.3 Update Admin Components
**Files:**
- [ ] `src/components/admin/AdminRoute.tsx` - Update imports
- [ ] `src/pages/admin/AdminLogin.tsx` - Update imports and Firestore refs
- [ ] `src/pages/admin/AdminDashboard.tsx` - Update imports and display logic

### 2.4 Update Cloud Functions
**File:** `functions/src/index.ts`
- [ ] Update `setUserRole` function
- [ ] Change collection: `userProfiles` → `users`
- [ ] Update document structure to match unified User
- [ ] Add player field defaults (totalScore, totalSubmissions, etc.)
- [ ] Set accountType: 'linked' for admins
- [ ] Add consentGiven defaults
- [ ] Change `uid` → `id` field
- [ ] Change `photoURL` field (already correct)
- [ ] Test function with curl

### 2.5 Update Seed Script
**File:** `scripts/seed-emulator.ts`
- [ ] Change collection: `userProfiles` → `users`
- [ ] Update admin document structure
- [ ] Add player field defaults
- [ ] Set accountType: 'linked'
- [ ] Test seed script

### 2.6 Run TypeScript Compiler
```bash
npm run type-check
```
- [ ] Fix all TypeScript errors
- [ ] Verify no UserProfile references remain

### 2.7 Commit Changes
```bash
git add .
git commit -m "refactor: update all UserProfile references to unified User type"
```

**Status:** ⏹️ NOT STARTED  
**Depends On:** Phase 1

---

## Phase 3: Database Migration (1 hour) ⏳

### 3.1 Create Migration Script
**File:** `scripts/migrate-unified-user.ts`
- [ ] Create new migration script file
- [ ] Implement Step 1: Migrate userProfiles → users
  - [ ] Check if user exists in users collection
  - [ ] MERGE: Add admin fields to existing user (if playing game)
  - [ ] CREATE: New user with defaults (if admin never played)
- [ ] Implement Step 2: Update existing users
  - [ ] Add `role: 'player'` if missing
  - [ ] Add accountType if missing
  - [ ] Standardize photoURL
  - [ ] Remove linkedAccountId (deprecated)
- [ ] Implement Step 3: Verify migration
  - [ ] Count total users
  - [ ] Count admin users by role
  - [ ] Log summary
- [ ] Implement Step 4: Delete userProfiles collection (emulator only)

### 3.2 Test Migration
```bash
# Backup current data
firebase emulators:export ./backup-pre-migration

# Run migration
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
ts-node scripts/migrate-unified-user.ts
```
- [ ] Verify all users have role field
- [ ] Verify admins have managedTenantIds, isActive
- [ ] Verify no userProfiles collection exists
- [ ] Verify Custom Claims still work

### 3.3 Commit Script
```bash
git add scripts/migrate-unified-user.ts
git commit -m "feat: add migration script for unified user schema"
```

**Status:** ⏹️ NOT STARTED  
**Depends On:** Phase 2

---

## Phase 4: Update Security Rules (30 min) ⏳

### 4.1 Update firestore.rules
**File:** `firestore.rules`
- [ ] Update users collection rules
  - [ ] Keep: allow read (own profile)
  - [ ] Add: allow list for admins (hasAdminRole())
  - [ ] Keep: allow write: if false (Cloud Functions only)
- [ ] Remove userProfiles collection rules completely
- [ ] Test rules with emulator

### 4.2 Test Security Rules
```bash
# Start emulator with new rules
firebase emulators:start

# Test scenarios:
# - Player can read own profile
# - Player cannot read other profiles
# - Admin can list all users
# - No client writes allowed
```

### 4.3 Commit Changes
```bash
git add firestore.rules
git commit -m "refactor: update security rules for unified user collection"
```

**Status:** ⏹️ NOT STARTED  
**Depends On:** Phase 3

---

## Phase 5: Update Admin UI (1 hour) ⏳

### 5.1 Update Admin Dashboard
**File:** `src/pages/admin/AdminDashboard.tsx`
- [ ] Add role badge display
- [ ] Add game stats section (if eventsParticipated > 0)
  - [ ] Show totalScore
  - [ ] Show totalSubmissions
  - [ ] Show eventsParticipated
- [ ] Test UI with admin user

### 5.2 Test Admin Workflows
- [ ] Admin login at /admin/login
- [ ] Admin dashboard displays correctly
- [ ] Role badge shows correct role
- [ ] Game stats section appears (if applicable)

### 5.3 Test Admin Gameplay (NEW CAPABILITY)
- [ ] Admin can visit /dashboard (player dashboard)
- [ ] Admin can see events list
- [ ] Admin can browse teams
- [ ] Admin can join a team
- [ ] Admin can submit tasks
- [ ] Admin stats update correctly

### 5.4 Commit Changes
```bash
git add src/pages/admin/
git commit -m "feat: show admin game stats and enable gameplay"
```

**Status:** ⏹️ NOT STARTED  
**Depends On:** Phase 4

---

## Phase 6: Testing & Documentation (1 hour) ⏳

### 6.1 Run Test Suite
```bash
npm test
npm run test:e2e
```
- [ ] Fix any failing tests
- [ ] Verify all player flows work
- [ ] Verify all admin flows work
- [ ] Verify admin gameplay works

### 6.2 Update Documentation
**Files:**
- [ ] `README.md` - Update schema description
- [ ] `.github/copilot-instructions.md` - Remove UserProfile references
- [ ] `ARCHITECT_MEMORY.md` - Document unified model
- [ ] Add migration history note

### 6.3 Manual Testing Checklist
**Player Flows:**
- [ ] Anonymous user creates account
- [ ] User links email/password
- [ ] User joins team
- [ ] User submits task
- [ ] User sees dashboard stats

**Admin Flows:**
- [ ] Admin logs in
- [ ] Admin sees dashboard
- [ ] Admin role check works
- [ ] Admin can query users

**Admin Gameplay:**
- [ ] Admin joins team
- [ ] Admin submits task
- [ ] Admin stats update
- [ ] TeamMember created correctly

### 6.4 Commit Documentation
```bash
git add docs/ README.md .github/copilot-instructions.md
git commit -m "docs: update for unified user schema"
```

**Status:** ⏹️ NOT STARTED  
**Depends On:** Phase 5

---

## Phase 7: Finalization (30 min) ⏳

### 7.1 Create Pull Request
```bash
gh pr create \
  --title "Refactor: Unified User Schema (Admins Can Play)" \
  --body "Merges User and UserProfile into single User type. Enables admins to play game while maintaining role-based permissions via Custom Claims. Closes #XXX"
```

### 7.2 Re-seed Emulator
```bash
# Clear old data
rm -rf .firebase-emulator-data

# Start fresh
firebase emulators:start

# (In new terminal) Re-seed with unified schema
npm run seed:emulator
```

### 7.3 Final Verification
- [ ] Admin can login (admin@test.com / admin123)
- [ ] Admin has role: 'superadmin'
- [ ] Admin can access admin dashboard
- [ ] Admin can play game (join team, submit tasks)
- [ ] Custom Claims work correctly
- [ ] No TypeScript errors
- [ ] No console errors

### 7.4 Merge to Main
```bash
# After PR approval
git checkout main
git merge refactor/unified-user-schema
git push origin main
```

**Status:** ⏹️ NOT STARTED  
**Depends On:** Phase 6

---

## Rollback Plan 🔄

### If Issues Occur in Phase 1-2 (Code Changes)
```bash
git reset --hard HEAD~1  # Undo last commit
```

### If Issues Occur in Phase 3 (Migration)
```bash
# Restore emulator data
rm -rf .firebase-emulator-data
firebase emulators:start --import ./backup-pre-migration
```

### If Issues Occur After Merge
```bash
git revert <commit-hash>
git push origin main
```

---

## Progress Tracking

| Phase | Status | Duration | Started | Completed |
|-------|--------|----------|---------|-----------|
| Phase 1: Schema | ⏹️ Not Started | 30 min | - | - |
| Phase 2: Code | ⏹️ Not Started | 2 hours | - | - |
| Phase 3: Migration | ⏹️ Not Started | 1 hour | - | - |
| Phase 4: Rules | ⏹️ Not Started | 30 min | - | - |
| Phase 5: UI | ⏹️ Not Started | 1 hour | - | - |
| Phase 6: Testing | ⏹️ Not Started | 1 hour | - | - |
| Phase 7: Finalize | ⏹️ Not Started | 30 min | - | - |

**Total Progress:** 0% (0/7 phases complete)

---

## Notes & Decisions

### Key Decisions Made
1. ✅ Unified User type (Option A) chosen over separate types
2. ✅ Role stored in both Custom Claims (authoritative) and Firestore (convenience)
3. ✅ accountType remains required field
4. ✅ linkedAccountId removed (no longer needed)
5. ✅ photoURL standardized (not profilePhotoUrl)

### Risk Mitigation
- ✅ Not in production - zero risk to real users
- ✅ Emulator only - easy to reset
- ✅ Git versioned - full rollback capability
- ✅ TypeScript - catches most issues at compile time
- ✅ Incremental commits - can revert any phase

### Success Criteria
- [x] All TypeScript errors resolved
- [ ] All tests passing
- [ ] Admin can login and access dashboard
- [ ] Admin can play game (join team, submit tasks)
- [ ] Custom Claims work correctly
- [ ] Documentation updated
- [ ] Zero console errors

---

**Last Updated:** 28 December 2025  
**Updated By:** Development Team  
**Next Action:** Begin Phase 1 (Update Schema)
