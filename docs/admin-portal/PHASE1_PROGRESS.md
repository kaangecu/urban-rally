# Phase 1 Implementation Progress

> **Started:** December 30, 2025  
> **Status:** IN PROGRESS  
> **Target:** Week 1 - Foundation & Backend (32 hours)

---

## ✅ Completed Milestones

### Milestone 1.1: Schema Definition (8 hours) - **COMPLETE**

**Deliverables:**
- ✅ Updated `src/types/schema.ts` with Hybrid User schema
- ✅ Added `TenantRoleAssignment` interface
- ✅ Added `PendingInvitation` interface
- ✅ Added `RoleAssignment` interface (audit log)
- ✅ Exported `ROLE_HIERARCHY` constant
- ✅ Added helper functions: `hasMinimumRole()`, `calculateHighestRole()`
- ✅ Updated `Tenant` interface with `primaryAdminId`, `adminCount`, `features`
- ✅ Marked `managedTenantIds` as `@deprecated`
- ✅ Type check passes: `npm run type-check` ✅

**Key Changes:**
```typescript
// User interface additions
interface User {
  // ... existing fields ...
  
  tenantRoles?: {
    [tenantId: string]: TenantRoleAssignment;
  };
  
  pendingInvitations?: {
    [token: string]: PendingInvitation;
  };
  
  highestRole?: 'superadmin' | 'admin' | 'organizer' | 'moderator' | 'player';
  isSuperadmin?: boolean;
  
  /** @deprecated Use tenantRoles instead */
  managedTenantIds?: string[];
}
```

---

### Milestone 1.2: Cloud Functions - Core (16 hours) - **80% COMPLETE**

**Status:** 4 out of 5 functions implemented

#### ✅ Function 1: `assignRole` (4 hours) - **COMPLETE**

**Location:** `functions/src/admin/assignRole.ts`

**Features:**
- Validates authentication and permissions
- Checks if user is superadmin or tenant admin
- Prevents non-superadmin from assigning superadmin role
- Updates `tenantRoles[tenantId]` with new role
- Supports role expiration (24h, 48h, 1week, 1month, never)
- Recalculates `highestRole` across all tenants
- Updates Firebase Custom Claims immediately
- Updates `tenant.adminCount` when assigning/removing admin role
- Creates audit log entry with reason
- Returns: `{ success, newRole, expiresAt, highestRole }`

**Testing Checklist:**
- [ ] Superadmin can assign any role to any user
- [ ] Admin can assign roles only in their tenant
- [ ] Admin cannot assign superadmin role
- [ ] Cannot assign role without authentication
- [ ] Custom claims updated correctly
- [ ] Audit log created
- [ ] Error handling works (invalid tenantId, user not found)

---

#### ✅ Function 2: `revokeRole` (4 hours) - **COMPLETE**

**Location:** `functions/src/admin/revokeRole.ts`

**Features:**
- Validates permissions (superadmin or tenant admin)
- Prevents last admin removal in tenant
- Marks role as inactive (soft delete) instead of deleting
- Preserves audit trail with `revokedBy`, `revokedAt`, `revokeReason`
- Recalculates `highestRole` excluding revoked roles
- Updates Firebase Custom Claims
- Decrements `tenant.adminCount` if was admin
- Creates audit log entry
- Returns: `{ success, message, highestRole }`

**Testing Checklist:**
- [ ] Cannot revoke last admin in tenant
- [ ] Role marked as inactive (not deleted)
- [ ] Custom claims refreshed
- [ ] Audit log shows "revoke" action

---

#### ✅ Function 3: `inviteUserToTenant` (4 hours) - **COMPLETE**

**Location:** `functions/src/admin/inviteUserToTenant.ts`

**Features:**
- Generates secure 32-byte invitation token (64 hex chars)
- Calculates role expiration based on `expiresIn` parameter
- Calculates invite expiration (7 days)
- Finds existing user by email or creates placeholder document
- Adds invitation to `user.pendingInvitations[token]`
- Returns magic link: `https://urbanrally.app/invite/accept?token=xyz`
- Optional email sending (integration pending)
- Creates audit log entry (action: 'invite_sent')
- Returns: `{ success, inviteLink, inviteToken, expiresAt, userExists }`

**Testing Checklist:**
- [ ] Magic link generated with 32-byte token
- [ ] Existing user gets invitation added to doc
- [ ] New user document created with invitation
- [ ] Email sent successfully (when implemented)
- [ ] Invite expires after 7 days
- [ ] Returns valid invite link

---

#### ✅ Function 4: `acceptInvitation` (4 hours) - **COMPLETE**

**Location:** `functions/src/admin/acceptInvitation.ts`

**Features:**
- No authentication required (for new users)
- Finds user by querying `pendingInvitations.{token}.status == 'pending'`
- Validates invitation not expired
- Moves invitation from `pendingInvitations` to `tenantRoles[tenantId]`
- Marks invitation status as 'accepted'
- Creates Firebase Auth account if user doesn't have one
- Updates Firebase Custom Claims with new role
- Increments `tenant.adminCount` if role is admin
- Generates `customToken` for auto-login
- Creates audit log entry (action: 'invite_accepted')
- Returns: `{ success, customToken, userId, tenantId, role, tenantName }`

**Testing Checklist:**
- [ ] Token validation works
- [ ] Expired invitations rejected
- [ ] Role moved from pendingInvitations to tenantRoles
- [ ] Firebase Auth account created for new users
- [ ] Custom token enables auto-login
- [ ] Audit log created

---

#### ⏳ Function 5: `expireRoles` (Scheduled) - **PENDING**

**Status:** Not yet implemented

**Requirements:**
- Scheduled function runs daily at 2 AM Berlin time
- Queries users with admin/organizer/moderator roles
- Checks each `tenantRoles[*].expiresAt` timestamp
- Marks expired roles as inactive
- Recalculates `highestRole` for affected users
- Updates Custom Claims for each affected user
- Creates audit log entries (action: 'revoke', reason: 'expired')
- Uses batched writes (500 per batch)
- Logs expiration count to Cloud Logging

**Next Steps:**
1. Create `functions/src/scheduled/expireRoles.ts`
2. Import `schedule` from `firebase-functions/v2/scheduler`
3. Implement batch processing logic
4. Test with mock expired roles in emulator

---

## 🔄 In Progress

### Milestone 1.3: Firestore Security Rules (8 hours) - **NOT STARTED**

**Tasks:**
- [ ] Update `firestore.rules` with new helper functions
- [ ] Add `isSuperadmin()` helper
- [ ] Add `hasRoleInTenant(tenantId, minRole)` helper
- [ ] Add rules for `users` collection (read-only for admins)
- [ ] Add rules for `tenants` collection (role-based access)
- [ ] Add rules for `roleAssignments` collection (audit log)
- [ ] Test rules with emulator
- [ ] Test unauthorized access attempts

**Target File:** `firestore.rules`

---

## 📊 Progress Summary

| Milestone | Status | Hours | Progress |
|-----------|--------|-------|----------|
| 1.1 Schema Definition | ✅ Complete | 8/8 | 100% |
| 1.2 Cloud Functions | 🔄 In Progress | 16/16 | 80% (4/5 functions) |
| 1.3 Security Rules | ⏳ Not Started | 0/8 | 0% |
| **Phase 1 Total** | **🔄 In Progress** | **24/32** | **75%** |

---

## 🧪 Testing Status

### Unit Tests
- [ ] `assignRole.test.ts` - Not created
- [ ] `revokeRole.test.ts` - Not created
- [ ] `inviteUserToTenant.test.ts` - Not created
- [ ] `acceptInvitation.test.ts` - Not created
- [ ] `expireRoles.test.ts` - Not created

### Integration Tests
- [ ] Test invite flow end-to-end
- [ ] Test role assignment with Custom Claims
- [ ] Test last admin prevention
- [ ] Test role expiration

### Manual Testing
- [ ] Test assignRole with curl
- [ ] Test revokeRole with curl
- [ ] Test inviteUserToTenant with curl
- [ ] Test acceptInvitation with magic link
- [ ] Verify Custom Claims in Firebase Console

---

## 🐛 Known Issues

None yet - functions compile successfully.

---

## 📝 Next Actions

1. **Implement `expireRoles` scheduled function** (4 hours)
   - Create file: `functions/src/scheduled/expireRoles.ts`
   - Import schedule from v2/scheduler
   - Implement batch processing logic
   - Test with emulator

2. **Update Firestore Security Rules** (8 hours)
   - Add helper functions
   - Implement per-collection rules
   - Test with emulator
   - Document edge cases

3. **Write Unit Tests** (8 hours)
   - Set up Vitest in functions/
   - Write tests for each function
   - Mock Firestore and Auth
   - Achieve >80% coverage

4. **Manual Testing** (4 hours)
   - Start emulators
   - Test with curl commands
   - Verify in Emulator UI
   - Document test results

---

## 🔗 Related Documents

- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Full 4-week plan
- [Architecture](./ROLE_MANAGEMENT_ARCHITECTURE.md) - Design decisions
- [Schema Migration Analysis](./SCHEMA_MIGRATION_ANALYSIS.md) - Why Hybrid approach

---

**Last Updated:** December 30, 2025  
**Next Review:** After completing expireRoles function
