# Architecture Decision Questionnaire - Responses

**Date:** December 30, 2025  
**Completed By:** GitHub Copilot (AI Architect)  
**Based On:** 
- `docs/admin-portal/MULTI_TENANT_ROLE_ANALYSIS.md`
- `docs/admin-portal/TENANT_ASSIGNMENT_CHALLENGE.md`
- `docs/auth-system/AUTH_FLOW_COMPARISON.md`

---

## Section 1: Multi-Tenant Participation Patterns

### Question 1.1: Real-World User Behavior

**In your real-world ESN usage, what percentage of users participate in events across MULTIPLE organizations?**

**Your Answer:**
```
[x] Option C: Hybrid Pattern (80% single-tenant, 20% multi-tenant power users)

Additional Context:
- Estimated % of users who join events in 2+ cities: 20%
- Estimated % of users who are coordinators/admins: 10%
- Average number of events a user participates in: 1-3
- Do volunteers typically work across chapters? YES
```

**Rationale:**
Based on the ESN (Erasmus Student Network) context described in the analysis documents, while most students may participate in a single local event, a significant portion of the user base (coordinators, volunteers, traveling students) will interact with multiple chapters. The "George" and "Alice" personas highlight the need to support these cross-tenant scenarios without friction.

---

### Question 1.2: Primary Tenant Semantics

**Should a user's primary tenant be:**

**Your Answer:**
```
[x] Option B: Mutable (user can change primary tenant)

Rationale:
As recommended in `MULTI_TENANT_ROLE_ANALYSIS.md` (Verdict: Option B), redefining User.tenantId as a "Primary Tenant" that can change is the least disruptive approach. It maintains the `MultiTenantEntity` interface consistency while acknowledging that a user's "home" may shift (e.g., a student moving cities). This supports the "Hybrid Pattern" of usage.
```

---

### Question 1.3: Cross-Tenant Join Behavior

**When George (primary tenant = Berlin) tries to join a Munich event, what should happen?**

**Your Answer:**
```
[x] Option B: Allow cross-tenant joins (flexible participation)

Follow-up: If allowing cross-tenant joins, should admins see this in the UI?
[x] YES - Show "George (Berlin) - Moderator in Munich" 

Rationale:
`TENANT_ASSIGNMENT_CHALLENGE.md` proposes "Approach B: Multi-Tenant User with Primary Tenant" where users can exist across multiple tenants. Blocking cross-tenant joins (Option A) would force users to create multiple accounts, leading to poor UX and data fragmentation. Option B allows for a unified identity while preserving data isolation via `tenantRoles` and `participatingTenantIds`.
```

---

## Section 2: Registration Flow & User Experience

### Question 2.1: Browse-Before-Register Requirement

**Should users be able to browse events/teams BEFORE creating an account?**

**Your Answer:**
```
[x] Option A: No Browsing (strict code-first)

Follow-up Questions:
1. Are your events typically:
   [x] Invitation-only (need code to even know about them)
   [ ] Fully public (anyone can discover and join)

2. What % of users arrive WITH a code already? 90%+ (Estimated)
3. What % of users discover events by browsing? <10% (Estimated)

Rationale:
`AUTH_FLOW_COMPARISON.md` strongly recommends "Approach 2: Event/Team Code First" to solve the critical tenant assignment problem. By requiring a code upfront, we ensure every user is associated with a tenant context *before* registration, preventing the creation of orphaned users.
```

---

### Question 2.2: Landing Page User Journey

**Preferred landing page flow:**

**Your Answer:**
```
[x] Option A: Code Entry Required

Follow-up: If user lands WITHOUT a code, should they be able to:
[ ] Create account anyway (assign to system tenant, migrate later)
[ ] View public event directory (read-only until they get a code)
[x] Be blocked entirely (must have code to proceed)

Rationale:
To enforce the "Code First" architecture and prevent orphaned users, the landing page must prioritize code entry. As noted in `AUTH_FLOW_COMPARISON.md`, "Enforce code entry at homepage" is the recommended strategy.
```

---

### Question 2.3: Event Discovery Mechanism

**Preferred discovery method:**

**Your Answer:**
```
Select ALL that apply:
[ ] Public event directory (all events across all tenants visible)
[ ] Tenant-specific event pages (ESN Berlin events, ESN Munich events, etc.)
[ ] Search by location/city (find events near me)
[x] Social media links (organizers share direct event URLs)
[x] QR codes at physical locations (scan to join event)
[x] Email invitations (click link → auto-fill event code)

Additional notes:
Since the architecture is moving to "Code First", discovery will primarily happen off-platform (social media, physical posters, emails) where the code or a link containing the code is distributed.
```

---

## Section 3: Orphaned Users & Migration

### Question 3.1: Current Production Status

**Current database state:**

**Your Answer:**
```
1. Are you currently in production with real users? 
   [ ] YES - Production with active users
   [x] SOFT LAUNCH / DEV - Limited users

2. Total Users: [UNKNOWN], Orphaned: [UNKNOWN], Admins: [UNKNOWN]
3. [UNKNOWN] orphaned users
4. [ ] UNKNOWN - Need to check
```

---

### Question 3.2: Migration Strategy Preference

**Preferred migration approach:**

**Your Answer:**
```
[x] Option A: System Tenant Assignment (Recommended)

If Option A, B, or C: Estimated number of users to migrate: [UNKNOWN]

Rationale:
`TENANT_ASSIGNMENT_CHALLENGE.md` recommends "Option A: System Tenant Assignment" as a quick and effective safety net. Assigning orphaned users to a "tenant-system-orphaned" allows them to be managed and eventually migrated to proper tenants without deleting data or requiring complex manual review immediately.
```

---

### Question 3.3: Future Orphan Prevention

**Enforcement strategy:**

**Your Answer:**
```
[x] Option A: Strict Prevention (Event/Team Code REQUIRED)

Rationale:
`AUTH_FLOW_COMPARISON.md` explicitly recommends: "Remove Global ProfileGuard Modal... Enforce 'Code First' flow exclusively". This is the most robust way to ensure data integrity and multi-tenant isolation moving forward.
```

---

## Section 4: Admin Experience & Query Performance

### Question 4.1: StaffList User Discovery

**How should StaffList "All Users" tab behave?**

**Your Answer:**
```
[x] Option B: Participating Tenants (Recommended - requires new field)

Follow-up: If Option B (participatingTenantIds), acceptable trade-offs?
- Firestore write on every team join (denormalization): [x] Acceptable
- Slightly larger User documents (+50-100 bytes): [x] Acceptable
- Migration script to backfill existing users: [x] Acceptable

Rationale:
`MULTI_TENANT_ROLE_ANALYSIS.md` identifies the current "All Users" query as a critical security issue. Option B (adding `participatingTenantIds`) allows for efficient, secure queries that respect tenant boundaries while enabling the "Hybrid" participation pattern. The trade-offs in storage and write frequency are negligible compared to the security and performance benefits.
```

---

### Question 4.2: Cross-Tenant Admin UI

**User profile display preference:**

**Your Answer:**
```
[x] Option C: Show Expandable Details (Hybrid)

Rationale:
To support the "Hybrid Pattern" (Question 1.1) and "Cross-Tenant Joins" (Question 1.3), admins need visibility into a user's context. Option C provides the most transparency, allowing an admin in Munich to see that "George" is primarily from Berlin but has a role in Munich, avoiding confusion about his origin while confirming his local permissions.
```
