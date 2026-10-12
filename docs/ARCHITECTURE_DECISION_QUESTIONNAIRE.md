# Architecture Decision Questionnaire

**Date:** December 30, 2025  
**Purpose:** Determine architectural direction for tenant assignment and multi-tenant participation  
**Context:** Critical refactoring decisions based on AUTH_FLOW_COMPARISON.md, TENANT_ASSIGNMENT_CHALLENGE.md, and MULTI_TENANT_ROLE_ANALYSIS.md  
**Status:** ⏳ AWAITING STAKEHOLDER INPUT

---

## Instructions

Please answer each question with as much detail as possible. Your answers will determine:
- Registration flow architecture (Event/Team Code First vs Registration First)
- Multi-tenant participation strategy (single vs cross-tenant users)
- Schema refactoring scope (breaking changes vs incremental updates)
- Implementation timeline (2-4 weeks of development effort)

**Format:** Copy this document, fill in your answers under each question, and save/share the completed version.

---

## Section 1: Multi-Tenant Participation Patterns

### Question 1.1: Real-World User Behavior

**Context:** George's story (TENANT_ASSIGNMENT_CHALLENGE.md) illustrates the cross-tenant participation dilemma. Understanding typical usage patterns is critical for architecture decisions.

**In your real-world ESN usage, what percentage of users participate in events across MULTIPLE organizations?**

```
Select ONE:
[ ] Option A: Single-Tenant Only (95%+ users stay with one ESN chapter)
    - Example: Berlin student joins Berlin events only, never travels
    - Implication: Simple architecture, User.tenantId = primary tenant forever
    - Trade-off: Limited flexibility for power users

[ ] Option B: Multi-Tenant Common (50%+ users join 2-3 chapters)
    - Example: Student studies in Berlin, does Erasmus in Munich, volunteers in both
    - Implication: Complex architecture, need participatingTenantIds field
    - Trade-off: Harder queries, but matches real-world usage

[ ] Option C: Hybrid Pattern (80% single-tenant, 20% multi-tenant power users)
    - Example: Most students stay local, but coordinators/volunteers travel
    - Implication: Optimize for single-tenant, support multi-tenant gracefully
    - Trade-off: Balanced complexity
```

**Your Answer:**
```
[ ] Option ___

Additional Context:
- Estimated % of users who join events in 2+ cities: _____%
- Estimated % of users who are coordinators/admins: _____%
- Average number of events a user participates in: ____
- Do volunteers typically work across chapters? YES / NO
```

---

### Question 1.2: Primary Tenant Semantics

**Context:** If users CAN join multiple tenants, what does `User.tenantId` (primary tenant) represent?

**Should a user's primary tenant be:**

```
Select ONE:
[ ] Option A: Immutable (first tenant joined, never changes)
    - Example: George joins Berlin → tenantId = "berlin" forever, even if he moves to Munich
    - Pros: Simple, no migration logic needed, clear data ownership
    - Cons: May not reflect current affiliation, confusing if user relocates permanently
    - GDPR: Original tenant remains data controller

[ ] Option B: Mutable (user can change primary tenant)
    - Example: George joins Berlin → later "migrates" to Munich as primary
    - Pros: Accurate representation of current affiliation
    - Cons: Complex migration logic, audit logs needed, risk of data confusion
    - GDPR: Data controller can change (requires proper transfer mechanism)

[ ] Option C: No Primary Tenant (User doesn't have tenantId field)
    - Example: George is a "global" user, tracked only via TeamMembers + tenantRoles
    - Pros: Cleanest multi-tenant model, no "home tenant" confusion
    - Cons: Breaking change, violates MultiTenantEntity pattern, complex queries
    - GDPR: Platform is data controller (not ideal for independent organizations)
```

**Your Answer:**
```
[ ] Option ___

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 1.3: Cross-Tenant Join Behavior

**Context:** When George (primary tenant = Berlin) tries to join a Munich event, what should happen?

**Should the system:**

```
Select ONE:
[ ] Option A: Block cross-tenant joins (strict isolation)
    - Behavior: Error message "You belong to Berlin. Please use your Berlin account."
    - User workaround: Create separate accounts per tenant
    - Pros: Simplest architecture, strict data isolation
    - Cons: Poor UX, users maintain multiple accounts, email conflicts

[ ] Option B: Allow cross-tenant joins (flexible participation)
    - Behavior: George joins Munich team, User.tenantId stays "berlin"
    - Tracking: TeamMember records show both Berlin and Munich participation
    - Pros: Better UX, matches real-world volunteer behavior
    - Cons: Complex queries (need participatingTenantIds or TeamMember joins)

[ ] Option C: Prompt user to choose (one-time decision)
    - Behavior: Modal asks "Join Munich as new account or link to Berlin account?"
    - Result: User decides whether to merge or keep separate
    - Pros: User control, transparent
    - Cons: Extra friction, requires complex account linking logic
```

**Your Answer:**
```
[ ] Option ___

Follow-up: If allowing cross-tenant joins, should admins see this in the UI?
[ ] YES - Show "George (Berlin) - Moderator in Munich" 
[ ] NO - Just show "George - Moderator"

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

## Section 2: Registration Flow & User Experience

### Question 2.1: Browse-Before-Register Requirement

**Context:** Event/Team Code First (Approach 2) requires code BEFORE registration, but limits discovery.

**Should users be able to browse events/teams BEFORE creating an account?**

```
Select ONE:
[ ] Option A: No Browsing (strict code-first)
    - Flow: Landing page → "Enter Event Code" → Create Profile → Browse Teams
    - Pros: Solves tenant assignment perfectly, secure
    - Cons: Can't "window shop", needs invitation from organizer
    - Use Case: Private events, invitation-only

[ ] Option B: Browse Public Events (hybrid)
    - Flow: Landing page → "Explore Events" (no auth) → Click event → "Enter Code to Join"
    - Pros: Discoverable, users can see what's available
    - Cons: Still requires code to actually join
    - Use Case: Semi-public events with team codes

[ ] Option C: Full Public Access (registration-first)
    - Flow: Landing page → "Sign Up" → Browse all events → Join any team
    - Pros: Lowest friction, best discoverability
    - Cons: Orphaned users problem (what's their tenantId?)
    - Use Case: Fully public events
```

**Your Answer:**
```
[ ] Option ___

Follow-up Questions:
1. Are your events typically:
   [ ] Invitation-only (need code to even know about them)
   [ ] Semi-public (advertised on social media, but need code to join)
   [ ] Fully public (anyone can discover and join)

2. What % of users arrive WITH a code already? _____%

3. What % of users discover events by browsing? _____%

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 2.2: Landing Page User Journey

**Context:** The first impression matters. What should users see when they visit urbanrally.app?

**Preferred landing page flow:**

```
Select ONE:
[ ] Option A: Code Entry Required
    Landing Page:
    ┌─────────────────────────────────────┐
    │   Welcome to Urban Rally            │
    │                                     │
    │   [Enter Event Code]                │
    │   [Enter Team Code]                 │
    │                                     │
    │   Don't have a code? Contact        │
    │   your event organizer.             │
    └─────────────────────────────────────┘
    - Pros: Enforces tenant assignment from start
    - Cons: No way to "just look around"

[ ] Option B: Browse + Code Entry
    Landing Page:
    ┌─────────────────────────────────────┐
    │   Welcome to Urban Rally            │
    │                                     │
    │   [Explore Public Events]           │
    │   [I Have a Code]                   │
    │                                     │
    │   Featured: Berlin City Quest      │
    │   Next: Munich Adventure (Dec 15)   │
    └─────────────────────────────────────┘
    - Pros: Discoverable, marketing-friendly
    - Cons: More complex tenant tracking

[ ] Option C: Sign Up First
    Landing Page:
    ┌─────────────────────────────────────┐
    │   Welcome to Urban Rally            │
    │                                     │
    │   [Sign Up Free]                    │
    │   [Log In]                          │
    │                                     │
    │   Join thousands of players in      │
    │   scavenger hunts worldwide!        │
    └─────────────────────────────────────┘
    - Pros: Standard SaaS flow, familiar
    - Cons: Creates orphaned users
```

**Your Answer:**
```
[ ] Option ___

Follow-up: If user lands WITHOUT a code, should they be able to:
[ ] Create account anyway (assign to system tenant, migrate later)
[ ] View public event directory (read-only until they get a code)
[ ] Be blocked entirely (must have code to proceed)

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 2.3: Event Discovery Mechanism

**Context:** If allowing browsing, how should users discover events?

**Preferred discovery method:**

```
Select ALL that apply:
[ ] Public event directory (all events across all tenants visible)
[ ] Tenant-specific event pages (ESN Berlin events, ESN Munich events, etc.)
[ ] Search by location/city (find events near me)
[ ] Social media links (organizers share direct event URLs)
[ ] QR codes at physical locations (scan to join event)
[ ] Email invitations (click link → auto-fill event code)

Additional notes:
___________________________________________________________________________
___________________________________________________________________________
```

---

## Section 3: Orphaned Users & Migration

### Question 3.1: Current Production Status

**Context:** Need to understand if orphaned users already exist in your system.

**Current database state:**

```
1. Are you currently in production with real users? 
   [ ] YES - Production with active users
   [ ] SOFT LAUNCH - Small test group
   [ ] PRE-LAUNCH - Only development/test data
   [ ] GREENFIELD - No database yet

2. If YES or SOFT LAUNCH, approximately how many users do you have?
   Total Users: ______
   Users with tenantId = undefined/null: ______ (if known)
   Admins across all tenants: ______

3. Can you run this query to check for orphaned users?
   ```
   Firestore Console → users collection → Filter: tenantId == null
   ```
   Result: ______ orphaned users found

4. Are there users who have been promoted to admin WITHOUT a tenantId?
   [ ] YES - Found admins with tenantId = undefined
   [ ] NO - All admins have proper tenantId
   [ ] UNKNOWN - Need to check
```

**Your Answers:**
```
1. ___________
2. Total: ______, Orphaned: ______, Admins: ______
3. ______ orphaned users
4. [ ] ___
```

---

### Question 3.2: Migration Strategy Preference

**Context:** If orphaned users exist, we need to assign them to tenants. Different strategies have different trade-offs.

**Preferred migration approach:**

```
Select ONE:
[ ] Option A: System Tenant Assignment (Recommended)
    - Assign all orphaned users to "tenant-system-orphaned"
    - Auto-migrate to real tenant when they join their first event
    - Pros: Safe, reversible, handles edge cases
    - Cons: Temporary state, requires migration logic
    - Timeline: 1 day implementation

[ ] Option B: Infer from TeamMember History
    - Query TeamMembers to find first event user joined
    - Backfill User.tenantId based on that event's tenant
    - Pros: Accurate historical assignment
    - Cons: What if user has no TeamMember records? What if multiple tenants?
    - Timeline: 2 days (needs data analysis + script)

[ ] Option C: Manual Review Per User
    - Export list of orphaned users
    - Manually research each user's affiliation
    - Assign tenantId based on investigation
    - Pros: Most accurate, human verification
    - Cons: Time-consuming, not scalable
    - Timeline: Depends on user count

[ ] Option D: Delete Orphaned Users
    - Assume orphaned users are test accounts
    - Delete users with tenantId = undefined
    - Force them to re-register properly
    - Pros: Clean slate, simplest
    - Cons: Loses user data, may affect real users
    - Timeline: 1 hour

[ ] Option E: No Migration Needed
    - No orphaned users exist (pre-launch or already clean)
    - Skip migration, focus on prevention
    - Timeline: 0 days
```

**Your Answer:**
```
[ ] Option ___

If Option A, B, or C: Estimated number of users to migrate: ______

If Option D: Confirmed all orphaned users are test accounts? [ ] YES / [ ] NO

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 3.3: Future Orphan Prevention

**Context:** After migration, should we ALLOW or PREVENT future orphaned users?

**Enforcement strategy:**

```
Select ONE:
[ ] Option A: Strict Prevention (Event/Team Code REQUIRED)
    - Remove global ProfileGuard modal
    - Only allow registration via EventCodeEntry or TeamCodeLogin
    - No way to create account without tenant context
    - Pros: Cleanest, no future orphans
    - Cons: Slightly more friction

[ ] Option B: Graceful Fallback (System Tenant as Safety Net)
    - Allow registration without code (rare cases)
    - Assign to "tenant-system-orphaned" automatically
    - Auto-migrate on first event join
    - Pros: Handles edge cases, robust
    - Cons: System tenant is permanent fixture

[ ] Option C: Allow Orphans (Keep Current Behavior)
    - Users can register without tenant
    - Admin manually assigns tenant later
    - Pros: Maximum flexibility
    - Cons: Ongoing orphan management needed
```

**Your Answer:**
```
[ ] Option ___

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

## Section 4: Admin Experience & Query Performance

### Question 4.1: StaffList User Discovery

**Context:** Munich admin needs to find George (primary tenant = Berlin) when he joins Munich event. Current query only shows primary tenant users.

**How should StaffList "All Users" tab behave?**

```
Select ONE:
[ ] Option A: Primary Tenant Only (Strict Isolation)
    - Query: where('tenantId', '==', activeTenantId)
    - Result: Munich admin sees ONLY users with primary tenant = Munich
    - George (Berlin primary) is HIDDEN from Munich admin
    - Pros: Strict isolation, simple query
    - Cons: Can't manage cross-tenant participants

[ ] Option B: Participating Tenants (Recommended - requires new field)
    - Add User.participatingTenantIds: string[] field
    - Query: where('participatingTenantIds', 'array-contains', activeTenantId)
    - Result: Munich admin sees George because he joined Munich event
    - Pros: Efficient (1 query), shows all relevant users
    - Cons: Denormalized data, must update on team join

[ ] Option C: TeamMember Join Query (Complex)
    - Query TeamMembers for userIds in this tenant
    - Then fetch User documents for those IDs
    - Result: Munich admin sees George via join
    - Pros: Normalized data, no schema changes
    - Cons: 2-3 queries needed, slower, complex code

[ ] Option D: Show All Users (Current Broken Behavior)
    - Query: orderBy('createdAt') with no tenant filter
    - Result: Munich admin sees ALL users from ALL tenants
    - Pros: None
    - Cons: CRITICAL SECURITY ISSUE, privacy violation
```

**Your Answer:**
```
[ ] Option ___

Follow-up: If Option B (participatingTenantIds), acceptable trade-offs?
- Firestore write on every team join (denormalization): [ ] Acceptable / [ ] Concern
- Slightly larger User documents (+50-100 bytes): [ ] Acceptable / [ ] Concern
- Migration script to backfill existing users: [ ] Acceptable / [ ] Concern

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 4.2: Cross-Tenant Admin UI

**Context:** When Munich admin looks at George's profile, should they see he's from Berlin?

**User profile display preference:**

```
Select ONE:
[ ] Option A: Show Primary Tenant (Transparent)
    UI Display:
    ┌─────────────────────────────────────────┐
    │ George Mueller                          │
    │ Primary Organization: ESN Berlin        │
    │ Role in Munich: Moderator              │
    │ Also participates in: Berlin, Prague   │
    └─────────────────────────────────────────┘
    - Pros: Full transparency, admins understand context
    - Cons: Might confuse admins ("Why does Munich moderator show Berlin?")

[ ] Option B: Show Current Context Only (Simplified)
    UI Display:
    ┌─────────────────────────────────────────┐
    │ George Mueller                          │
    │ Role: Moderator                        │
    │ Member since: Dec 15, 2025             │
    └─────────────────────────────────────────┘
    - Pros: Cleaner, less confusing
    - Cons: Hides multi-tenant participation

[ ] Option C: Show Expandable Details (Hybrid)
    UI Display:
    ┌─────────────────────────────────────────┐
    │ George Mueller                          │
    │ Role in Munich: Moderator              │
    │ [View Full Profile] (shows all tenants) │
    └─────────────────────────────────────────┘
    - Pros: Clean by default, details on demand
    - Cons: Slightly more complex UI
```

**Your Answer:**
```
[ ] Option ___

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 4.3: Superadmin Cross-Tenant Access

**Context:** Should superadmins be able to view users from ALL tenants, or must they select a context?

**Superadmin permissions:**

```
Select ONE:
[ ] Option A: Global Access (See All Tenants Simultaneously)
    - Superadmin dashboard shows aggregated data across all tenants
    - Can search for users across all organizations
    - Use case: Platform support, debugging, data cleanup
    - Security: Requires superadmin audit logging

[ ] Option B: Context-Required (Must Select Tenant)
    - Superadmin must choose "View as: ESN Berlin" before seeing data
    - Can switch contexts, but always filtered by one tenant
    - Use case: Stricter isolation, prevents accidental cross-tenant actions
    - Security: Lower risk of data leaks

[ ] Option C: Hybrid (Global Read, Contextual Write)
    - Superadmin can VIEW all tenants aggregated
    - Must SELECT tenant before modifying data
    - Use case: Best of both worlds
    - Security: Read-only global, write requires confirmation
```

**Your Answer:**
```
[ ] Option ___

Follow-up: Should superadmin actions be logged?
[ ] YES - Full audit trail (who, what, when, which tenant)
[ ] NO - Trust superadmins

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

## Section 5: Schema Refactoring Scope

### Question 5.1: Legacy Field Removal (managedTenantIds)

**Context:** System currently uses BOTH `managedTenantIds` (legacy) and `tenantRoles` (new). This dual schema causes inconsistencies.

**Should we remove the legacy `managedTenantIds` field?**

```
Impact Analysis:
- Files affected: EventList.tsx, AdminDashboard.tsx, TaskForm.tsx (3 files)
- Lines of code to refactor: ~150 lines
- Estimated effort: 2-3 days (refactor + test)
- Risk level: Medium (may break admin UI temporarily)
- Rollback: Keep legacy field but mark as deprecated

Select ONE:
[ ] Option A: Remove Immediately (Clean Slate)
    - Delete managedTenantIds field from schema
    - Refactor all UI components to use tenantRoles
    - Migration script to backfill tenantRoles from managedTenantIds
    - Pros: Single source of truth, cleaner codebase
    - Cons: 2-3 days work, potential for regression bugs

[ ] Option B: Deprecate Gradually (Safer)
    - Mark managedTenantIds as @deprecated in schema
    - Refactor UI components one by one over time
    - Keep both fields for 1-2 months
    - Remove legacy field in future release
    - Pros: Lower risk, incremental changes
    - Cons: Dual schema persists temporarily

[ ] Option C: Keep Both Indefinitely (No Refactor)
    - Accept dual schema as technical debt
    - Maintain both fields going forward
    - Pros: No refactoring needed, zero risk
    - Cons: Confusing for developers, maintenance burden
```

**Your Answer:**
```
[ ] Option ___

Risk tolerance: [ ] Low (gradual changes) / [ ] Medium (planned refactor) / [ ] High (move fast)

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 5.2: User Schema Breaking Change

**Context:** Should `User` extend `MultiTenantEntity` (thus having `tenantId` field)?

**Schema architecture preference:**

```
Select ONE:
[ ] Option A: Keep Current (User extends MultiTenantEntity)
    interface User extends MultiTenantEntity {
      tenantId: string; // Primary tenant
      tenantRoles?: { [tenantId]: TenantRoleAssignment };
      // ... other fields
    }
    - Pros: Consistent with other entities, clear primary tenant
    - Cons: "Home tenant" concept needs clear documentation
    - Migration: None needed

[ ] Option B: Remove MultiTenantEntity (Breaking Change)
    interface User {
      id: string;
      // NO tenantId field
      tenantRoles?: { [tenantId]: TenantRoleAssignment };
      // ... other fields
    }
    - Pros: Cleaner semantics, User is truly global entity
    - Cons: MAJOR breaking change, complex migration, breaks queries
    - Migration: 5-7 days effort

[ ] Option C: Hybrid (tenantId optional)
    interface User extends Partial<MultiTenantEntity> {
      tenantId?: string; // Optional primary tenant
      tenantRoles?: { [tenantId]: TenantRoleAssignment };
      // ... other fields
    }
    - Pros: Backward compatible, flexible
    - Cons: Ambiguous (is tenantId optional or required?)
    - Migration: 1-2 days (update validation)
```

**Your Answer:**
```
[ ] Option ___

Breaking change tolerance:
[ ] NOT ACCEPTABLE - Must remain backward compatible
[ ] ACCEPTABLE IF CRITICAL - Only if no other solution
[ ] ACCEPTABLE - We can handle migration

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 5.3: participatingTenantIds Field Addition

**Context:** Adding `User.participatingTenantIds: string[]` enables efficient cross-tenant queries (see George's story).

**Should we add the participatingTenantIds field?**

```
Trade-off Analysis:
✅ Pros:
- Efficient StaffList queries (1 Firestore read instead of 3-5)
- Munich admin can find George immediately
- Clear cross-tenant participation tracking
- Enables future features (user activity dashboard across tenants)

⚠️ Cons:
- Denormalized data (must update on every team join)
- Firestore write overhead (+1 field update per team join)
- Migration needed to backfill existing users
- Potential for data inconsistency if logic has bugs

Cost Estimate:
- Implementation: 1 day (schema + joinTeamSecure update)
- Migration: 1 day (backfill script)
- Testing: 1 day
Total: 3 days

Select ONE:
[ ] Option A: Add Field (Recommended for Multi-Tenant Support)
    - Implement participatingTenantIds tracking
    - Update joinTeamSecure to maintain array
    - Refactor StaffList to use array-contains query
    - Timeline: 3 days

[ ] Option B: Use TeamMember Joins Instead (Normalized)
    - Keep schema normalized (no new field)
    - Query TeamMembers first, then fetch User docs
    - Pros: No denormalization, cleaner data model
    - Cons: Slower queries (2-3 reads), more complex code
    - Timeline: 2 days

[ ] Option C: Skip (Single-Tenant Optimization)
    - Assume most users are single-tenant
    - Accept that cross-tenant users are hard to query
    - Rely on primary tenant only
    - Pros: Simplest, no changes needed
    - Cons: George problem unsolved
    - Timeline: 0 days
```

**Your Answer:**
```
[ ] Option ___

If Option A: Acceptable to denormalize? [ ] YES / [ ] NO / [ ] CONCERNS (explain below)

Concerns about denormalization:
___________________________________________________________________________
___________________________________________________________________________

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

## Section 6: Implementation Timeline & Priorities

### Question 6.1: Project Timeline

**Context:** Different solutions require different implementation timelines. Understanding your deadline is critical.

**What's your target launch date or refactoring deadline?**

```
Select ONE:
[ ] Option A: Urgent (1 week)
    - Need production-ready solution ASAP
    - Willing to take shortcuts
    - Priority: Fix critical security issue fast
    - Accept: Some technical debt for speed

[ ] Option B: Normal (2-4 weeks)
    - Standard development sprint
    - Balanced approach (quality + speed)
    - Priority: Solid implementation, reasonable timeline
    - Accept: Some features postponed to v2

[ ] Option C: Flexible (1-2 months)
    - No hard deadline
    - Can take time to do it right
    - Priority: Best long-term architecture
    - Accept: Longer development cycle

[ ] Option D: Exploratory (No deadline)
    - Still evaluating feasibility
    - Multiple prototypes acceptable
    - Priority: Find optimal solution
    - Accept: Iteration and experimentation
```

**Your Answer:**
```
[ ] Option ___

Target Date (if applicable): _______________

Context/Constraints:
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 6.2: Priority Ranking

**Context:** Cannot do everything at once. Need to prioritize based on business impact.

**Rank these tasks from 1 (highest priority) to 8 (lowest priority):**

```
[ ] Fix tenant assignment (prevent orphaned users)
    - Impact: Security, GDPR compliance
    - Effort: 2-3 days

[ ] Remove managedTenantIds dual schema
    - Impact: Code quality, maintainability
    - Effort: 2-3 days

[ ] Implement cross-tenant participation (participatingTenantIds)
    - Impact: Multi-tenant user experience
    - Effort: 3 days

[ ] Add primary tenant migration function
    - Impact: User flexibility (can change home tenant)
    - Effort: 2 days

[ ] Refactor admin UI (StaffList, EventList, Dashboard)
    - Impact: Admin experience, query performance
    - Effort: 3-4 days

[ ] Create EventContext provider for tenant capture
    - Impact: Registration flow improvement
    - Effort: 1 day

[ ] Migrate existing orphaned users
    - Impact: Data cleanup, production readiness
    - Effort: 1-2 days (depends on user count)

[ ] Update Firestore security rules
    - Impact: Security enforcement
    - Effort: 1 day
```

**Your Ranking:**
```
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
4. _______________________________________________
5. _______________________________________________
6. _______________________________________________
7. _______________________________________________
8. _______________________________________________

Rationale for top 3 priorities:
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 6.3: Deployment Strategy

**Context:** How should we roll out these changes?

**Preferred deployment approach:**

```
Select ONE:
[ ] Option A: Big Bang (All Changes at Once)
    - Implement all features in one PR
    - Deploy to production in single release
    - Pros: Consistent state, complete solution
    - Cons: Higher risk, harder to test, long review cycle
    - Rollback: Full revert if anything breaks

[ ] Option B: Incremental (Feature Flags)
    - Deploy changes behind feature flags
    - Enable features gradually (10% → 50% → 100% rollout)
    - Pros: Lower risk, can revert individual features
    - Cons: More complex code (flag management)
    - Rollback: Disable feature flag

[ ] Option C: Phased (Multiple Releases)
    Phase 1: Fix critical security (orphaned users, firestore rules)
    Phase 2: Add cross-tenant support (participatingTenantIds)
    Phase 3: Refactor admin UI (remove dual schema)
    - Pros: Incremental value, easier testing, clear milestones
    - Cons: Multiple deployments, temporary inconsistent state
    - Rollback: Revert individual phases

[ ] Option D: Parallel Development (Blue-Green)
    - Build new system alongside old
    - Migrate users gradually
    - Cutover when ready
    - Pros: Zero downtime, thorough testing
    - Cons: Most complex, resource-intensive
    - Rollback: Switch back to old system
```

**Your Answer:**
```
[ ] Option ___

Downtime tolerance:
[ ] Zero downtime required (production users affected)
[ ] Brief downtime acceptable (5-10 minutes during off-peak)
[ ] Extended downtime OK (can schedule maintenance window)

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

## Section 7: Business Context & Constraints

### Question 7.1: Organizational Structure

**Context:** Understanding your business model helps guide architectural decisions.

**How is your platform structured?**

```
Select ONE:
[ ] Option A: Single Organization (One ESN Network)
    - Example: ESN Germany manages all chapters
    - Tenants represent: Local chapters (Berlin, Munich, etc.)
    - Billing: Central organization pays
    - Implications: Simpler model, centralized control

[ ] Option B: Independent Organizations (Multi-Tenant SaaS)
    - Example: ESN Berlin, ESN Munich are separate legal entities
    - Tenants represent: Independent organizations
    - Billing: Each organization pays separately
    - Implications: Strict isolation needed, tenant = customer

[ ] Option C: Franchise Model (Semi-Independent)
    - Example: Chapters operate independently but under ESN brand
    - Tenants represent: Franchises with some autonomy
    - Billing: Hybrid (some shared, some per-chapter)
    - Implications: Balance between isolation and shared resources

[ ] Option D: Platform (White-Label)
    - Example: Any organization can use Urban Rally
    - Tenants represent: Completely separate customer organizations
    - Billing: Per-tenant subscription
    - Implications: Multi-tenant SaaS architecture, strictest isolation
```

**Your Answer:**
```
[ ] Option ___

Additional Context:
- Total number of tenants/organizations: ______
- Expected growth in next 6 months: ______
- Are tenants aware of each other? [ ] YES / [ ] NO
- Do tenants share resources (admins, events)? [ ] YES / [ ] NO

Rationale:
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 7.2: GDPR & Data Privacy Requirements

**Context:** Multi-tenant architecture has legal implications, especially in EU.

**Data privacy requirements:**

```
Answer each:
1. Are you subject to GDPR? [ ] YES / [ ] NO / [ ] UNSURE

2. Who is the data controller for user data?
   [ ] Platform/Urban Rally (you)
   [ ] Individual tenant organizations (ESN chapters)
   [ ] Hybrid (depends on context)

3. Can users request data export? [ ] YES / [ ] NO / [ ] PLANNED

4. Can users request data deletion (right to be forgotten)? [ ] YES / [ ] NO / [ ] PLANNED

5. Do you need to support data portability between tenants?
   [ ] YES - Users can move from Berlin to Munich with data
   [ ] NO - Data stays with original tenant
   [ ] PARTIAL - User can delete old data and start fresh

6. Are there data residency requirements (data must stay in specific region)?
   [ ] YES - Specify: _______________
   [ ] NO - Firestore global deployment OK

7. Should orphaned users (system tenant) be auto-deleted after period of inactivity?
   [ ] YES - Delete after ___ days
   [ ] NO - Keep indefinitely
   [ ] MANUAL - Admin reviews and decides
```

**Your Answers:**
```
1. [ ] ___
2. [ ] ___
3. [ ] ___
4. [ ] ___
5. [ ] ___
6. [ ] ___
7. [ ] ___

Additional Context:
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 7.3: Technical Constraints

**Context:** Existing technical limitations or requirements.

**Technical environment:**

```
1. Firestore quota limits:
   [ ] Free tier (limited reads/writes) - Must optimize queries
   [ ] Paid tier (can handle more complex queries)
   [ ] Enterprise (no practical limits)

2. Development team size:
   [ ] Solo developer (just you)
   [ ] Small team (2-3 developers)
   [ ] Medium team (4-10 developers)
   [ ] Large team (10+ developers)

3. Testing infrastructure:
   [ ] Manual testing only
   [ ] Unit tests (Vitest)
   [ ] E2E tests (Playwright)
   [ ] CI/CD pipeline with automated tests

4. Monitoring & Observability:
   [ ] None - Rely on user reports
   [ ] Firebase Console monitoring
   [ ] Custom logging/alerting (e.g., Sentry)
   [ ] Full observability stack (logs, metrics, traces)

5. Can you run data migrations during maintenance window?
   [ ] YES - Can take site offline for 1-2 hours
   [ ] PARTIAL - Max 10-15 minutes downtime
   [ ] NO - Must be zero-downtime

6. Firestore migration approach:
   [ ] Admin SDK scripts (one-time batch update)
   [ ] Cloud Functions (gradual migration triggered by events)
   [ ] Dual-write (write to both old and new schema during transition)
```

**Your Answers:**
```
1. [ ] ___
2. [ ] ___
3. [ ] ___
4. [ ] ___
5. [ ] ___
6. [ ] ___

Additional Context:
___________________________________________________________________________
___________________________________________________________________________
```

---

## Section 8: Open-Ended Questions

### Question 8.1: Biggest Pain Point

**What is the single biggest problem you're trying to solve with this refactoring?**

```
Your Answer:
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 8.2: Success Criteria

**How will you know this refactoring was successful? What are your success metrics?**

```
Examples:
- Zero orphaned users in database
- StaffList query time < 500ms
- Admin can find cross-tenant users easily
- Zero security rule violations in logs
- Clean data model (no technical debt)

Your Answer:
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 8.3: Concerns & Risks

**What are your biggest concerns or fears about this refactoring?**

```
Examples:
- Breaking production for existing users
- Migration script failing halfway
- Performance degradation
- Complex code that's hard to maintain
- Timeline slipping due to unforeseen issues

Your Answer:
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
```

---

### Question 8.4: Future Features

**What features might you want to add in the next 6-12 months?**

```
Examples:
- User-to-user messaging across tenants
- Global leaderboards (all tenants combined)
- Tenant marketplace (share events between organizations)
- User profiles with friend connections
- Social login (Google, Facebook)

Your Answer:
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
```

---

## Submission

**Once completed, please:**

1. Save this file as `ARCHITECTURE_DECISIONS_ANSWERED.md`
2. Share with the development team for review
3. Schedule a meeting to discuss any unclear answers
4. Approve final architectural approach based on responses

**Next Steps After Submission:**

Based on your answers, I will provide:
1. **Detailed Refactoring Plan** - Step-by-step implementation guide
2. **Code Changes** - Specific files and functions to modify
3. **Migration Scripts** - Firestore data migration code
4. **Testing Strategy** - What to test and how
5. **Rollback Plan** - How to revert if issues arise
6. **Timeline Estimate** - Realistic timeline with milestones

---

**Document Status:** ⏳ Awaiting Completion  
**Estimated Completion Time:** 30-45 minutes  
**Last Updated:** December 30, 2025

---

## Quick Reference: Recommended Answers (Default Path)

If you're unsure, these are sensible defaults for most use cases:

```
1.1: [ ] Option C - Hybrid (80% single, 20% multi-tenant)
1.2: [ ] Option A - Immutable primary tenant
1.3: [ ] Option B - Allow cross-tenant joins
2.1: [ ] Option B - Browse public events (hybrid)
2.2: [ ] Option B - Browse + code entry
3.1: Check your production database
3.2: [ ] Option A - System tenant assignment
3.3: [ ] Option B - Graceful fallback (system tenant)
4.1: [ ] Option B - participatingTenantIds (requires new field)
4.2: [ ] Option A - Show primary tenant (transparent)
4.3: [ ] Option C - Hybrid (global read, contextual write)
5.1: [ ] Option B - Deprecate gradually (safer)
5.2: [ ] Option A - Keep current (User extends MultiTenantEntity)
5.3: [ ] Option A - Add participatingTenantIds field
6.1: [ ] Option B - Normal (2-4 weeks)
6.2: Rank based on security first, UX second, refactoring last
6.3: [ ] Option C - Phased (multiple releases)
7.1: Answer based on your actual business model
7.2: Answer based on your legal requirements
7.3: Answer based on your actual technical setup
```

This default path implements **Approach D (Hybrid)** from TENANT_ASSIGNMENT_CHALLENGE.md.
