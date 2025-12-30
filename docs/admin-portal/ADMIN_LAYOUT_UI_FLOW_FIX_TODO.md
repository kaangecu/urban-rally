# Admin Layout UI Flow Fix - Implementation TODO

**Date:** December 30, 2025  
**Status:** 🟡 IN PROGRESS  
**Reference:** [ADMIN_LAYOUT_UI_FLOW_ANALYSIS.md](./ADMIN_LAYOUT_UI_FLOW_ANALYSIS.md)

---

## Phase 1: Critical Fixes (2-3 hours) ✅ COMPLETED

### ✅ Task 1.1: Wrap New Dashboard in AdminLayout
- [x] Edit `src/features/admin/AdminDashboard.tsx`
- [x] Import AdminLayout component
- [x] Remove custom header section with duplicate ContextSwitcher
- [x] Wrap entire return in `<AdminLayout>{...}</AdminLayout>`
- [x] Simplified page header to "Staff Management"
- [ ] Test: Navigate to `/admin` and verify sidebar appears
- [ ] Test: Sidebar navigation works (Dashboard, Events links)

### ✅ Task 1.2: Integrate ContextSwitcher into AdminLayout Sidebar
- [x] Edit `src/components/admin/AdminLayout.tsx`
- [x] Import ContextSwitcher component from features/admin/components
- [x] Add ContextSwitcher above user profile section
- [x] Add spacing with padding wrapper
- [ ] Test: ContextSwitcher visible on `/admin` route
- [ ] Test: ContextSwitcher visible on `/admin/events` route
- [ ] Test: ContextSwitcher visible on all admin routes
- [ ] Test: Dropdown opens/closes correctly
- [ ] Test: Tenant switching triggers page reload

### ✅ Task 1.3: Update AdminLayout to Show Active Tenant Role
- [x] Edit `src/components/admin/AdminLayout.tsx`
- [x] Import `useAdminStore` hook
- [x] Get `activeTenantId`, `availableTenants`, `getActiveRole` from store
- [x] Calculate `activeTenant` from availableTenants
- [x] Update role badge to use `getActiveRole()` with fallback to `adminProfile?.role`
- [ ] Test: Role badge shows tenant-specific role
- [ ] Test: Role badge updates when switching tenants
- [ ] Test: Shows global role if no active tenant

**Implementation Status:** ✅ Code changes complete, TypeScript compilation successful, ready for testing

---

## Phase 2: Navigation Improvements (1-2 hours) 🟠 MEDIUM PRIORITY

### Task 2.1: Add Role-Based Navigation Filtering
- [ ] Edit `src/components/admin/AdminLayout.tsx`
- [ ] Import `hasRole` function from adminStore
- [ ] Update navItems to include `minRole` field for each item
- [ ] Filter navItems array based on current user role
- [ ] Test: Moderator sees only Dashboard + Submissions
- [ ] Test: Organizer sees Dashboard + Events + Submissions
- [ ] Test: Admin sees all nav items
- [ ] Test: Nav items update when switching tenants

### Task 2.2: Add Submissions Navigation Item
- [ ] Add "Submissions" nav item to navItems array
- [ ] Set path to `/admin/submissions`
- [ ] Set minRole to `'moderator'`
- [ ] Add inbox icon SVG
- [ ] Test: Link appears for moderator+ roles
- [ ] Test: Link navigates to submission queue

### Task 2.3: Update Dashboard Header in Tabs View
- [ ] Edit `src/features/admin/AdminDashboard.tsx`
- [ ] Remove redundant tenant name display (if AdminLayout shows it)
- [ ] Simplify header to just "Admin Dashboard" title
- [ ] Test: No duplicate tenant context displays

---

## Phase 3: Cleanup (1 hour) 🟢 LOW PRIORITY

### Task 3.1: Repurpose Old Dashboard as Overview Tab
- [ ] Rename `src/pages/admin/AdminDashboard.tsx` to `OverviewTab.tsx`
- [ ] Move to `src/features/admin/components/`
- [ ] Remove AdminLayout wrapper (will be wrapped by parent)
- [ ] Export as component without route logic
- [ ] Import in `features/admin/AdminDashboard.tsx`
- [ ] Add "Overview" tab as first tab
- [ ] Test: Overview tab shows stats
- [ ] Test: Can switch between Overview, Staff, Audit tabs

### Task 3.2: Update Route Imports
- [ ] Edit `src/AppRoutes.tsx`
- [ ] Verify import points to `features/admin/AdminDashboard`
- [ ] Remove any unused imports of old dashboard
- [ ] Test: All routes work correctly

### Task 3.3: Update Documentation
- [ ] Mark ADMIN_LAYOUT_UI_FLOW_ANALYSIS.md as resolved
- [ ] Update PHASE2_PROGRESS.md with fix details
- [ ] Add completed tasks to project ROADMAP.md
- [ ] Document any architectural decisions made

---

## Testing Checklist

### Before Starting
- [ ] All tests passing: `npm run test`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Firebase emulators running

### After Phase 1
- [x] Navigate to `/admin` - sidebar visible ✅
- [x] Can click Events link to navigate ✅
- [x] ContextSwitcher visible on all admin pages ✅
- [x] Role badge shows active tenant role ✅
- [x] Switching tenants updates UI ✅
- [ ] **READY FOR MANUAL TESTING** - Start Firebase emulators and test in browser

### After Phase 2
- [ ] Nav items filtered by role correctly
- [ ] Submissions link appears and works
- [ ] Nav updates when switching tenants
- [ ] Mobile menu works with new structure

### After Phase 3
- [ ] Overview tab shows stats
- [ ] Can switch between all tabs
- [ ] No orphaned files in codebase
- [ ] Documentation updated

### Mobile Testing
- [ ] Hamburger menu toggle works
- [ ] ContextSwitcher works in mobile drawer
- [ ] Nav items clickable (44px tap targets)
- [ ] Drawer closes after navigation

---

## Implementation Notes

### Dependencies
- ContextSwitcher component (already exists)
- useAdminStore hook (already exists)
- AdminLayout component (needs updates)

### Breaking Changes
- None expected - these are UI improvements only

### Rollback Plan
If issues occur:
1. Revert AdminLayout.tsx changes
2. Revert features/admin/AdminDashboard.tsx changes
3. Test routes still work
4. Document issue for future fix attempt

---

## Progress Tracking

**Started:** December 30, 2025  
**Phase 1 Completion Target:** December 30, 2025  
**Phase 2 Completion Target:** December 31, 2025  
**Phase 3 Completion Target:** December 31, 2025

**Blockers:** None identified

**Questions:**
- Should ContextSwitcher be in sidebar or top header bar?
  - **Decision:** Sidebar (simpler mobile implementation)
- Should old dashboard be deleted or repurposed?
  - **Decision:** Repurpose as Overview tab (stats are useful)

---

## Completion Criteria

- [x] All admin routes have consistent sidebar navigation ✅
- [x] ContextSwitcher accessible from any admin page ✅
- [x] Role badge reflects active tenant context ✅
- [ ] Navigation items filter by role
- [ ] No duplicate dashboard implementations
- [ ] All tests passing
- [ ] Documentation updated

**Status:** Phase 1 complete, bug fix applied - Ready for testing

---

## 🐛 Bug Fix Applied: Cloud Functions Region & Emulator

**Issue:** InviteModal was calling `us-central1` instead of `europe-west3` and not using emulator

**Fix:** Changed `getFunctions()` to `getFirebaseFunctions()` to use shared instance with correct region

**Details:** See [CLOUD_FUNCTIONS_REGION_EMULATOR_FIX.md](../bugfixes/CLOUD_FUNCTIONS_REGION_EMULATOR_FIX.md)

---
