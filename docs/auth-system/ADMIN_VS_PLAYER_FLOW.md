# Admin vs Player Authentication Flow

**Date:** December 30, 2025  
**Context:** Clarification of "Event Code First" approach  
**Key Insight:** Different user types have different registration flows

---

## Executive Summary

The "Event Code First" approach applies **ONLY to PLAYERS**, not to admins/organizers. The system already supports two parallel authentication flows:

1. **Admin/Organizer Flow** - Traditional email/password login, NO event code required
2. **Player Flow** - Event/Team code first, then profile creation

This document clarifies how both flows coexist without conflict.

---

## Two Distinct User Types

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER TYPE DISTINCTION                        │
└─────────────────────────────────────────────────────────────────┘

ADMINS/ORGANIZERS                    PLAYERS
├─ Create events                     ├─ Join events
├─ Manage teams                      ├─ Join teams
├─ Assign roles                      ├─ Submit tasks
├─ View analytics                    ├─ Earn points
├─ Access admin portal               ├─ Use player app
└─ Email/password auth ✅            └─ Event code → profile ✅

Registration Path:                   Registration Path:
1. Admin registers via platform      1. Organizer creates event
2. Platform assigns admin role       2. Organizer shares event code
3. Admin creates events              3. Player enters event code
4. Events generate event codes       4. Player creates profile
5. Admin shares codes with players   5. Player joins team
```

---

## Flow 1: Admin/Organizer Registration (Current Implementation)

### How Admins Get Created

```
┌─────────────────────────────────────────────────────────────────┐
│              ADMIN/ORGANIZER ONBOARDING FLOW                     │
└─────────────────────────────────────────────────────────────────┘

Step 1: Platform Superadmin Creates Admin Account
├─ Superadmin logs into admin portal
├─ Goes to Staff Management
├─ Clicks "Invite Staff Member"
├─ Fills form:
│   ├─ Email: organizer@esn-berlin.org
│   ├─ Display Name: "Sarah Berlin"
│   ├─ Role: Organizer
│   └─ Tenant: ESN Berlin
└─ Cloud Function creates User + assigns Custom Claims

Step 2: Admin Document Created
├─ User.id = Firebase Auth UID
├─ User.email = "organizer@esn-berlin.org" ✅ REQUIRED for admins
├─ User.tenantId = "tenant-berlin" ✅ Known at creation
├─ User.role = "organizer"
├─ User.tenantRoles = { "tenant-berlin": { role: "organizer", ... } }
└─ Custom Claims = { role: "organizer", tr: { "tenant-berlin": "organizer" } }

Step 3: Admin Receives Email (Future)
├─ Email with login credentials or magic link
├─ Admin sets password
└─ Admin logs into admin portal

Step 4: Admin Can Create Events WITHOUT Event Code
├─ Navigates to /admin/events/new
├─ Fills EventForm:
│   ├─ Event Name: "Berlin City Quest 2025"
│   ├─ Description: "..."
│   ├─ Dates: Jan 15-20
│   ├─ Generate Event Code → "BERLIN2025" ✅
│   └─ tenantId: "tenant-berlin" (inherited from admin's tenant)
└─ Event created via createEventSecure Cloud Function

Step 5: Event Code Generated
├─ Event.eventCode = "BERLIN2025" (6-12 characters)
├─ Admin shares code with players via:
│   ├─ Social media posts
│   ├─ Email newsletters
│   ├─ Physical flyers with QR codes
│   └─ Website announcements
```

### Key Points for Admins

✅ **Email Required** - Admins MUST have email (not anonymous)  
✅ **Tenant Known** - Admin's tenantId set by superadmin at creation  
✅ **No Event Code Needed** - Admins register via platform, not via event  
✅ **Role-Based Access** - Custom Claims grant access to admin portal  
✅ **Can Create Events** - Admins generate event codes, not consume them  

---

## Flow 2: Player Registration (Event Code First)

### How Players Get Created

```
┌─────────────────────────────────────────────────────────────────┐
│                  PLAYER ONBOARDING FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Step 1: Player Receives Event Code
├─ Sees social media post: "Join our Berlin City Quest! Code: BERLIN2025"
├─ Sees flyer with QR code
├─ Friend tells them about event
└─ No platform account yet

Step 2: Player Opens Urban Rally App
├─ Lands on homepage
├─ Sees: "I Have an Event Code" button
└─ Clicks to EventCodeEntry page

Step 3: Player Enters Event Code
├─ Types "BERLIN2025"
├─ System validates code → finds event
├─ Event.tenantId = "tenant-berlin" ✅ Captured
├─ Event.id = "evt_123"
└─ Navigates to /tenant/tenant-berlin/event/evt_123/teams

Step 4: Player Browses Teams (Optional)
├─ Sees list of teams in Berlin event
├─ Can read team descriptions
├─ No authentication required yet
└─ Decides which team to join

Step 5: Player Clicks "Join Team Alpha"
├─ System checks: User authenticated? NO
├─ IdentityUplinkModal opens
├─ Modal shows:
│   ├─ "You're joining: Berlin City Quest"
│   ├─ "Team: Team Alpha"
│   └─ Guest/Email/Google login options
└─ ⚠️ CRITICAL: tenantId already known from Step 3

Step 6: Player Creates Profile
├─ Fills: First Name, Last Name, Email (optional)
├─ Accepts terms & privacy policy
├─ System calls createUser({
│     displayName: "Alice",
│     email: "alice@example.com" (optional),
│     tenantId: "tenant-berlin", ✅ From event context
│     accountType: "anonymous" or "linked"
│   })
└─ User document created with correct tenant

Step 7: Player Joins Team
├─ TeamMember record created
├─ Player redirected to dashboard
└─ Can now submit tasks, earn points, etc.
```

### Key Points for Players

✅ **Event Code FIRST** - Must enter code before profile creation  
✅ **Tenant Captured** - tenantId extracted from event at Step 3  
✅ **Email Optional** - Players can be anonymous (guest accounts)  
✅ **No Admin Access** - Players only see player-facing app  
✅ **Cannot Create Events** - Players join existing events only  

---

## Side-by-Side Comparison

| Aspect | Admin/Organizer | Player |
|--------|----------------|--------|
| **Registration Entry Point** | Platform admin portal | Event code entry |
| **Email Required?** | ✅ YES | ❌ NO (optional) |
| **Tenant Assignment** | By superadmin/platform | By event code validation |
| **Account Type** | Email/password | Anonymous or linked |
| **Can Create Events?** | ✅ YES | ❌ NO |
| **Can Join Teams?** | ❌ NO (admin-only) | ✅ YES |
| **Access Admin Portal?** | ✅ YES | ❌ NO |
| **Firebase Custom Claims?** | ✅ YES (role: organizer) | ❌ NO (role: player) |
| **Bypass ProfileGuard?** | ✅ YES | ❌ NO |

---

## Code Evidence: System Already Supports This

### 1. ProfileGuard Skips Admins

```typescript
// useProfileGuard.ts (lines 56-63)
const tokenResult = await firebaseUser.getIdTokenResult();
const userRole = tokenResult.claims.role as string | undefined;

// Admins don't need to join teams - bypass profile guard
if (userRole && ['moderator', 'organizer', 'admin', 'superadmin'].includes(userRole)) {
  console.log('👑 ProfileGuard: Admin user detected - bypassing profile check');
  setNeedsProfile(false);
  setIsChecking(false);
  return;
}
```

**What this means:** Admins can navigate directly to admin portal without triggering "create profile" modal.

---

### 2. Admin Routes Protected by Role

```typescript
// AppRoutes.tsx (lines 129-147)
<AdminRoute minRole="organizer">
  <EventForm />
</AdminRoute>

<AdminRoute minRole="organizer">
  <EventList />
</AdminRoute>
```

**What this means:** Only users with organizer/admin role (via Custom Claims) can create events.

---

### 3. EventForm Uses Admin's Tenant

```typescript
// EventForm.tsx (lines 19-28)
const [formData, setFormData] = useState({
  name: '',
  description: '',
  eventCode: '',
  tenantId: adminProfile?.managedTenantIds?.[0] || '', // ✅ Admin's tenant
  startDate: '',
  endDate: '',
  isActive: true,
  maxTeams: 50,
  mapCenter: { lat: 52.52, lng: 13.405 },
  mapZoom: 12,
});
```

**What this means:** When admin creates event, tenantId is pre-filled from admin's profile, NOT from event code.

---

### 4. TeamCodeLogin Uses Event Tenant

```typescript
// TeamCodeLogin.tsx (lines 69-82)
const team = await getTeamByAccessCode(teamCode.trim());

if (!team) {
  setError('Invalid team code. Please check and try again.');
  return;
}

// Get tenant info
const tenant = await getTenantById(team.tenantId); // ✅ Tenant from team

// Success - store team and show auth modal
setValidatedTeam(team);
setTenantId(tenant.id); // ✅ Tenant passed to IdentityUplinkModal
setShowAuthModal(true);
```

**What this means:** Player's tenant comes from team/event code validation, NOT from their account.

---

## Resolving the Chicken-and-Egg Problem

### The Question

> "If players need event code to register, how do admins create events before event codes exist?"

### The Answer

**Different flows for different user types:**

```
ADMIN FLOW (Platform-First):
Platform → Admin Account → Create Event → Generate Code → Share with Players
   ↓           ↓               ↓             ↓              ↓
Superadmin  Email/Pass     Event Form    BERLIN2025    Social Media
creates     authentication  with tenant   auto-         marketing
                           context       generated      

PLAYER FLOW (Event-First):
Event Code → Validate → Create Profile → Join Team → Play
    ↓           ↓            ↓              ↓          ↓
BERLIN2025  Find event   Inherit tenant   TeamMember  Dashboard
            tenantId     from event       record      

NO CIRCULAR DEPENDENCY ✅
```

---

## Why This Works

### 1. Admins Bootstrap the System

- **First action:** Platform superadmin creates tenant (e.g., "ESN Berlin")
- **Second action:** Superadmin creates organizer account for Sarah
- **Third action:** Sarah logs in with email/password (NO event code)
- **Fourth action:** Sarah creates "Berlin City Quest 2025" event
- **Fifth action:** Event auto-generates code "BERLIN2025"
- **Sixth action:** Sarah shares code on Instagram

**Result:** Event exists BEFORE any players register.

---

### 2. Players Discover via Code

- **First action:** Alice sees Instagram post with "BERLIN2025"
- **Second action:** Alice visits urbanrally.app, enters code
- **Third action:** System validates code → captures tenantId
- **Fourth action:** Alice creates profile with correct tenant
- **Fifth action:** Alice joins team and plays

**Result:** Alice's tenant is correctly assigned from event.

---

### 3. No Orphaned Admins

Admins are created by superadmins with explicit tenant assignment:

```typescript
// Cloud Function: createAdminUser (hypothetical)
export const createAdminUser = onCall(async (request) => {
  const { email, displayName, role, tenantId } = request.data;
  
  // Create Firebase Auth user
  const userRecord = await admin.auth().createUser({
    email: email,
    password: generateRandomPassword(),
    displayName: displayName,
  });
  
  // Create Firestore user document
  await admin.firestore().collection('users').doc(userRecord.uid).set({
    id: userRecord.uid,
    email: email,
    displayName: displayName,
    tenantId: tenantId, // ✅ Explicit assignment by superadmin
    role: role,
    accountType: 'linked',
    tenantRoles: {
      [tenantId]: {
        role: role,
        grantedBy: request.auth.uid,
        grantedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
      }
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Set Custom Claims
  await admin.auth().setCustomUserClaims(userRecord.uid, {
    role: role,
    tr: { [tenantId]: role },
    tenantIds: [tenantId],
  });
  
  return { success: true, userId: userRecord.uid };
});
```

**No orphaned admins possible** because superadmin explicitly provides tenantId.

---

### 4. No Orphaned Players

Players register via event code, which ALWAYS provides tenantId:

```typescript
// EventCodeEntry.tsx
const handleSubmit = async (e: FormEvent) => {
  const eventData = await validateEventCode(eventCode);
  
  if (!eventData) {
    setError('Invalid event code');
    return;
  }
  
  // Store event in context (includes tenantId)
  setEventContext(eventData); // ✅ Tenant captured here
  
  // Navigate to team browser
  navigate(`/tenant/${eventData.tenantId}/event/${eventData.id}/teams`);
};

// Later, when player creates profile:
const handleJoinTeam = () => {
  const { activeEvent } = useEventContext();
  
  createUser({
    displayName: name,
    tenantId: activeEvent.tenantId, // ✅ Tenant from event context
    // ...
  });
};
```

**No orphaned players possible** because event code validation always provides tenantId.

---

## Updated Architecture Decision

### Event Code First = Players Only

The "Event Code First" recommendation in `AUTH_FLOW_COMPARISON.md` and `TENANT_ASSIGNMENT_CHALLENGE.md` applies **ONLY to players**, not to admins/organizers.

**Clarified Strategy:**

```
USER ONBOARDING STRATEGY (HYBRID)

For Players:
✅ Event/Team Code First (REQUIRED)
   - Cannot register without event code
   - Prevents orphaned players
   - Ensures tenant assignment from day one

For Admins:
✅ Platform-First (Email/Password)
   - Created by superadmin via admin portal
   - Tenant assigned explicitly during creation
   - No event code needed
   - Can create events and generate codes
```

---

## Implementation Checklist

### What Already Works ✅

- [x] Admin bypass ProfileGuard (useProfileGuard.ts)
- [x] Admin routes protected by role (AppRoutes.tsx)
- [x] EventForm pre-fills admin's tenant (EventForm.tsx)
- [x] TeamCodeLogin captures tenant from team (TeamCodeLogin.tsx)
- [x] IdentityUplinkModal accepts tenantId prop (IdentityUplinkModal.tsx)

### What Needs Implementation 🔨

- [ ] **EventContext Provider** - Store validated event globally
- [ ] **Remove Global ProfileGuard Modal** - Only trigger in specific contexts
- [ ] **Add "Join Team" Button to Team Browser** - Complete event code → join flow
- [ ] **Admin Creation Cloud Function** - Formalize admin onboarding
- [ ] **System Tenant for Edge Cases** - Fallback for any missed scenarios

---

## FAQ

### Q1: Can admins also be players?

**A:** Yes! An organizer can join an event as a player:

```
Sarah's Dual Role:
├─ User.tenantId = "tenant-berlin" (primary - admin tenant)
├─ User.role = "organizer" (highest role)
├─ User.tenantRoles = {
│     "tenant-berlin": { role: "organizer", ... }
│   }
└─ TeamMember records:
    ├─ TeamMember 1: { userId: sarah_id, teamId: team_alpha, tenantId: "tenant-berlin" }
    └─ TeamMember 2: { userId: sarah_id, teamId: team_beta, tenantId: "tenant-munich" }

When Sarah uses admin portal → sees organizer dashboard
When Sarah opens player app → sees her team, can submit tasks
```

This is the **multi-tenant participation** scenario (George's story) from `TENANT_ASSIGNMENT_CHALLENGE.md`.

---

### Q2: What if player wants to become admin later?

**A:** Promotion flow:

```
Alice's Journey:
T=0: Alice joins as player via event code BERLIN2025
     └─ User.tenantId = "tenant-berlin"
     └─ User.role = "player"

T=1: Berlin organizer promotes Alice to moderator
     └─ assignRole({ userId: alice_id, tenantId: "tenant-berlin", role: "moderator" })
     └─ User.role = "moderator" (cached)
     └─ User.tenantRoles["tenant-berlin"] = { role: "moderator", ... }
     └─ Custom Claims updated: { role: "moderator", ... }

T=2: Alice can now access admin portal
     └─ Admin routes check: hasAdminRole() → true
     └─ Alice sees staff management, can create events
```

No conflict - player account seamlessly becomes admin account.

---

### Q3: Can admins create events in OTHER tenants?

**A:** Only if they have roles in multiple tenants:

```
Sarah's Multi-Tenant Scenario:
├─ User.tenantId = "tenant-berlin" (primary)
├─ User.tenantRoles = {
│     "tenant-berlin": { role: "organizer", ... },
│     "tenant-munich": { role: "moderator", ... }
│   }
└─ When creating event in EventForm:
    ├─ Tenant selector shows: Berlin (organizer), Munich (moderator)
    ├─ Sarah chooses Munich
    └─ Event.tenantId = "tenant-munich" ✅

Sarah can create events in BOTH tenants because she has roles in both.
```

This requires the **ContextSwitcher** component (already implemented) for tenant selection.

---

### Q4: What about the global ProfileGuard modal issue?

**A:** Remove it for admins, keep for players:

```typescript
// AppRoutes.tsx - BEFORE (BROKEN):
<IdentityUplinkModal
  isOpen={needsProfile}
  tenantId={???} // ❌ Unknown at root level
  onSuccess={handleProfileCreated}
  required={true}
/>

// AppRoutes.tsx - AFTER (FIXED):
// Remove global modal entirely
// Admins: bypass ProfileGuard (already implemented)
// Players: modal triggered in EventCodeEntry → TeamBrowser → Join Team
```

Players trigger modal in **context-aware locations** where tenantId is known.

---

## Conclusion

### Key Takeaways

1. **Two Parallel Flows** - Admins and players have completely separate registration paths
2. **No Chicken-and-Egg** - Admins create events BEFORE players register
3. **Event Code First = Players Only** - Admins register via platform, not via event codes
4. **System Already Supports This** - Code already has admin bypass logic
5. **Minor Refactoring Needed** - Add EventContext, remove global modal, complete join flow

### Recommendation

✅ **Proceed with "Event Code First" for players**  
✅ **Keep current admin onboarding via platform**  
✅ **Remove global ProfileGuard modal**  
✅ **Add EventContext provider for tenant capture**  
✅ **Document both flows clearly for developers**  

**No architectural conflict.** The two flows coexist harmoniously because they serve different user types with different needs.

---

**Document Version:** 1.0  
**Last Updated:** December 30, 2025  
**Related Documents:**
- `AUTH_FLOW_COMPARISON.md` - Overall authentication strategy
- `TENANT_ASSIGNMENT_CHALLENGE.md` - Multi-tenant participation analysis
- `ARCHITECTURE_DECISION_QUESTIONNAIRE.md` - Decision framework

---

## Appendix: Complete User Journeys

### Admin Journey (End-to-End)

```
DAY 1: Platform Setup
├─ Superadmin creates tenant "ESN Berlin"
├─ Superadmin creates organizer account: sarah@esn-berlin.org
├─ Sarah receives email with login link
└─ Sarah sets password, logs into admin portal

DAY 2: Event Creation
├─ Sarah navigates to /admin/events/new
├─ Fills EventForm:
│   ├─ Name: "Berlin City Quest 2025"
│   ├─ Description: "Explore Berlin with fun challenges!"
│   ├─ Dates: Jan 15-20, 2025
│   ├─ Generate Event Code → "BERLIN2025"
│   └─ Tenant: ESN Berlin (pre-filled)
├─ Clicks "Create Event"
└─ Event created with code BERLIN2025

DAY 3: Marketing
├─ Sarah posts on Instagram: "Join our quest! Code: BERLIN2025"
├─ Sarah adds QR code to physical flyers
├─ Sarah sends email newsletter with code
└─ Players start registering

DAY 4-10: Event Management
├─ Sarah creates teams via admin portal
├─ Sarah creates tasks (take photo at Brandenburg Gate, etc.)
├─ Sarah monitors player progress in analytics dashboard
└─ Sarah promotes active players to moderators
```

### Player Journey (End-to-End)

```
JAN 10: Discovery
├─ Alice sees Instagram post: "Join BERLIN2025!"
└─ Alice clicks link to urbanrally.app

JAN 10: Registration
├─ Alice lands on homepage
├─ Clicks "I Have an Event Code"
├─ Enters "BERLIN2025"
├─ System validates → shows "Berlin City Quest 2025"
├─ Alice navigates to team browser
├─ Sees: Team Alpha, Team Beta, Team Gamma
└─ Clicks "Join Team Alpha"

JAN 10: Profile Creation
├─ IdentityUplinkModal opens
├─ Modal shows: "You're joining Berlin City Quest → Team Alpha"
├─ Alice fills: First Name, Last Name, Email (optional)
├─ Alice accepts terms & privacy
├─ System creates user with tenantId = "tenant-berlin"
└─ Alice joins Team Alpha, redirected to dashboard

JAN 15-20: Gameplay
├─ Alice opens player app
├─ Sees task: "Take photo at Brandenburg Gate"
├─ Alice goes to gate, takes photo
├─ Submits task via app
├─ Earns 50 points
├─ Sees team leaderboard: Team Alpha in 2nd place
└─ Alice continues completing tasks

JAN 21: Event Ends
├─ Alice sees final scores: Team Alpha wins!
├─ Alice receives completion certificate
└─ Alice rated 5 stars, leaves feedback
```

**Both journeys work simultaneously without conflict.** ✅
