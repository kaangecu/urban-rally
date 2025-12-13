# 🏢 Multi-Tenant Team Browsing Architecture

**Date:** December 11, 2025  
**Author:** Product & Engineering  
**Status:** 📋 Design Specification

---

## 🎯 Problem Statement

**Challenge:** Users need to browse teams, but the system supports:
- Multiple **events** running simultaneously (e.g., Berlin Rally, Munich Rally)
- Multiple **tenants** (e.g., Company A's event, Company B's event)
- Users may participate in multiple events
- Teams are scoped to specific events within specific tenants

**Goal:** Design a team browsing flow that:
1. Shows only relevant teams (correct event + tenant)
2. Handles event/tenant context automatically
3. Prevents users from seeing/joining wrong events
4. Scales to 100+ events, 1000+ teams

---

## 🗂️ Data Model

### **Hierarchy:**
```
Tenant (Organization)
  └─ Event (Berlin Rally 2025)
      └─ Team (TEAM RED)
          └─ Team Members (Alice, Bob, Charlie)
```

### **Firestore Schema:**

```typescript
// Collection: tenants
tenants/{tenantId}
  - name: "Urban Rally Berlin GmbH"
  - createdAt: timestamp
  - settings: { ... }

// Collection: events
events/{eventId}
  - tenantId: "tenant-berlin-123"  ← Links to tenant
  - name: "Berlin Urban Rally 2025"
  - date: "2025-12-11"
  - status: "active" | "upcoming" | "completed"
  - createdAt: timestamp

// Collection: teams
teams/{teamId}
  - eventId: "event-berlin-456"    ← Links to event
  - tenantId: "tenant-berlin-123"  ← Denormalized for queries
  - name: "TEAM RED"
  - color: "#EF4444"
  - memberCount: 15
  - maxCapacity: 20
  - createdAt: timestamp

// Collection: teamMembers
teamMembers/{memberId}
  - teamId: "team-red-789"
  - eventId: "event-berlin-456"    ← Denormalized
  - tenantId: "tenant-berlin-123"  ← Denormalized
  - userId: "user-alice-001"
  - displayName: "Alice K."
  - joinedAt: timestamp
```

### **Key Design Decisions:**

1. **Denormalization:** Store `tenantId` in teams/teamMembers for efficient queries
2. **Event Scoping:** All teams belong to exactly one event
3. **Tenant Scoping:** All events belong to exactly one tenant
4. **User Context:** Users can be in multiple events across different tenants

---

## 🔐 Context Management

### **Option 1: URL-Based Context (Recommended)** ✅

**URL Structure:**
```
/tenant/{tenantId}/event/{eventId}/teams
/tenant/berlin-123/event/rally-2025/teams

Example URLs:
- Berlin Event:  /tenant/berlin-123/event/rally-2025/teams
- Munich Event:  /tenant/munich-456/event/rally-2025/teams
- Company A:     /tenant/company-a-789/event/teambuilding/teams
```

**Pros:**
- ✅ Explicit context (no ambiguity)
- ✅ Shareable links (send to participants)
- ✅ Browser back/forward works correctly
- ✅ SEO-friendly (if public events)
- ✅ Easy debugging (URL shows full context)

**Cons:**
- ⚠️ Long URLs
- ⚠️ Must validate tenant/event exist

**Implementation:**
```typescript
// Route definition
<Route path="/tenant/:tenantId/event/:eventId/teams" 
       element={<BrowseTeamsScreen />} />

// In component
const BrowseTeamsScreen = () => {
  const { tenantId, eventId } = useParams();
  
  // Query teams for this specific event
  const { data: teams } = useFirestoreQuery(
    query(
      collection(db, 'teams'),
      where('eventId', '==', eventId),
      where('tenantId', '==', tenantId),
      orderBy('memberCount', 'asc')
    )
  );
  
  return <TeamList teams={teams} />;
};
```

---

### **Option 2: Code-Based Context (Alternative)**

**User Flow:**
```
1. User enters event code: "BERLIN2025"
2. Backend resolves: eventId + tenantId
3. Store in session/local storage
4. All queries use stored context
```

**URL Structure:**
```
/join?code=BERLIN2025
   ↓
Redirects to: /teams (context stored in state)
```

**Pros:**
- ✅ Short, simple URLs
- ✅ Familiar pattern (current system uses codes)
- ✅ No sensitive IDs in URL

**Cons:**
- ❌ Context lost on refresh (unless persisted)
- ❌ Can't share direct links to teams
- ❌ Must handle session management

**Implementation:**
```typescript
// Code entry screen
const EnterCodeScreen = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = async () => {
    // Lookup event by code
    const eventSnap = await getDocs(
      query(
        collection(db, 'events'),
        where('code', '==', code.toUpperCase())
      )
    );
    
    if (eventSnap.empty) {
      toast.error('Invalid event code');
      return;
    }
    
    const event = eventSnap.docs[0].data();
    
    // Store context
    sessionStorage.setItem('eventId', eventSnap.docs[0].id);
    sessionStorage.setItem('tenantId', event.tenantId);
    
    // Navigate to teams
    navigate('/teams');
  };
  
  return (
    <input 
      value={code}
      onChange={e => setCode(e.target.value)}
      placeholder="Enter event code"
    />
  );
};

// Teams screen
const BrowseTeamsScreen = () => {
  const eventId = sessionStorage.getItem('eventId');
  const tenantId = sessionStorage.getItem('tenantId');
  
  // Query teams
  const { data: teams } = useFirestoreQuery(
    query(
      collection(db, 'teams'),
      where('eventId', '==', eventId),
      where('tenantId', '==', tenantId)
    )
  );
  
  return <TeamList teams={teams} />;
};
```

---

### **Option 3: Hybrid Approach (Best of Both Worlds)** ⭐

**Combine URL-based + Code-based:**

```
Flow A: Direct Link (URL-based)
/tenant/berlin-123/event/rally-2025/teams
   ↓
Show teams immediately (context from URL)

Flow B: Code Entry (Code-based)
User enters: "BERLIN2025"
   ↓
Resolve to: tenantId + eventId
   ↓
Redirect to: /tenant/berlin-123/event/rally-2025/teams
```

**Benefits:**
- ✅ Organizers can share direct links
- ✅ Users can also use codes (flexible)
- ✅ All routes end up with explicit context (URL)
- ✅ Browser history/bookmarks work

---

## 📱 Complete User Flow (Hybrid Approach)

### **Flow 1: First-Time User (Code Entry)**

```
┌────────────────────────────────────────┐
│  Welcome to Urban Rally!               │
│                                        │
│  Enter your event code:                │
│  ┌──────────────────────────────────┐ │
│  │ BERLIN2025                       │ │ ← User types code
│  └──────────────────────────────────┘ │
│                                        │
│  [Continue]                            │
│                                        │
└────────────────────────────────────────┘
           ↓
    Backend Lookup
    (events where code='BERLIN2025')
           ↓
    Found: eventId=rally-2025, tenantId=berlin-123
           ↓
    Redirect to:
    /tenant/berlin-123/event/rally-2025/teams
           ↓
┌────────────────────────────────────────┐
│  ⚡ Berlin Urban Rally 2025            │ ← Event name from DB
│  📅 December 11, 2025                  │
│                                        │
│  🔍 Search teams or friends...         │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🔴 TEAM RED          👥 15/20    │ │ ← Only Berlin teams
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🔵 TEAM BLUE         👥 18/20    │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

---

### **Flow 2: Returning User (Direct Link)**

```
Organizer sends SMS/Email:
"Join our event: https://urbanrally.app/tenant/berlin-123/event/rally-2025/teams"

User clicks link
    ↓
App opens directly to Browse Teams screen
    ↓
URL params: tenantId=berlin-123, eventId=rally-2025
    ↓
Query teams where eventId='rally-2025' AND tenantId='berlin-123'
    ↓
Show teams (no code entry needed)
```

---

### **Flow 3: Multi-Event User**

**Scenario:** Alice participates in 2 events:
1. Berlin Rally (December 11)
2. Munich Rally (December 18)

**Implementation:**

```
User Profile:
┌────────────────────────────────────────┐
│  Alice K.                              │
│                                        │
│  Your Events:                          │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ ⚡ Berlin Urban Rally             │ │
│  │ 📅 Dec 11 • TEAM RED              │ │
│  │ [View Event]                      │ │ ← Links to Berlin teams
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ ⚡ Munich Urban Rally             │ │
│  │ 📅 Dec 18 • Not joined yet        │ │
│  │ [Browse Teams]                    │ │ ← Links to Munich teams
│  └──────────────────────────────────┘ │
│                                        │
│  [+ Join Another Event]                │
│                                        │
└────────────────────────────────────────┘
```

**Database Query:**
```typescript
// Get user's events
const { data: userEvents } = useFirestoreQuery(
  query(
    collection(db, 'teamMembers'),
    where('userId', '==', currentUser.uid),
    orderBy('joinedAt', 'desc')
  )
);

// Fetch event details for each
const events = await Promise.all(
  userEvents.map(async (member) => {
    const eventDoc = await getDoc(doc(db, 'events', member.eventId));
    return { ...eventDoc.data(), id: eventDoc.id };
  })
);
```

**Navigation:**
- Tap "View Event" → `/tenant/berlin-123/event/rally-2025/teams`
- Tap "Browse Teams" → `/tenant/munich-456/event/rally-2025/teams`
- Each link has correct tenant + event context

---

## 🔍 Query Optimization

### **Firestore Composite Indexes**

**Required indexes:**
```javascript
// Index 1: Browse teams by event + tenant
Collection: teams
Fields: 
  - tenantId (Ascending)
  - eventId (Ascending)
  - memberCount (Ascending)

// Index 2: Search members by event
Collection: teamMembers
Fields:
  - eventId (Ascending)
  - displayName (Ascending)

// Index 3: User's events
Collection: teamMembers
Fields:
  - userId (Ascending)
  - joinedAt (Descending)
```

**Create indexes:**
```bash
# Via Firebase CLI
firebase firestore:indexes

# Or automatically via error messages
# (Firestore suggests index when query fails)
```

---

### **Query Performance**

**Scenario 1: Browse teams (single event)**
```typescript
const { data: teams } = useFirestoreQuery(
  query(
    collection(db, 'teams'),
    where('eventId', '==', eventId),
    where('tenantId', '==', tenantId),  // Extra safety
    orderBy('memberCount', 'asc')
  )
);

// Performance:
// - 15 teams: ~50ms
// - 100 teams: ~100ms
// - 1000 teams: ~200ms (unlikely scenario)
```

**Scenario 2: Search members (single event)**
```typescript
const searchMembers = async (query: string) => {
  const membersSnap = await getDocs(
    query(
      collection(db, 'teamMembers'),
      where('eventId', '==', eventId),
      where('displayName', '>=', query),
      where('displayName', '<=', query + '\uf8ff'),
      limit(20)  // Limit results
    )
  );
  
  return membersSnap.docs.map(doc => doc.data());
};

// Performance:
// - 200 members: ~80ms
// - 1000 members: ~150ms
```

---

## 🛡️ Security Rules

### **Firestore Rules (Multi-Tenant)**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isTenantMember(tenantId) {
      // Check if user belongs to this tenant
      return exists(/databases/$(database)/documents/tenantMembers/$(request.auth.uid + '_' + tenantId));
    }
    
    function isEventActive(eventId) {
      let event = get(/databases/$(database)/documents/events/$(eventId));
      return event.data.status == 'active';
    }
    
    // Teams: Read only within your event
    match /teams/{teamId} {
      allow read: if isAuthenticated() 
                  && resource.data.eventId == request.resource.data.eventId;
                  // Users can only see teams from events they're accessing
      
      allow create, update, delete: if isOrganizer(resource.data.tenantId);
    }
    
    // Team Members: Join only active events
    match /teamMembers/{memberId} {
      allow read: if isAuthenticated();
      
      allow create: if isAuthenticated()
                    && request.auth.uid == request.resource.data.userId
                    && isEventActive(request.resource.data.eventId);
      
      allow delete: if isAuthenticated()
                    && request.auth.uid == resource.data.userId;
    }
    
    // Events: Anyone can read active events
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow write: if isOrganizer(resource.data.tenantId);
    }
  }
}
```

### **Security Considerations:**

1. **Tenant Isolation:**
   - Users in Tenant A cannot see Tenant B's teams
   - Enforced by `where('tenantId', '==', tenantId)` in queries
   - Security rules double-check tenant membership

2. **Event Isolation:**
   - Teams scoped to specific events
   - Cannot join teams from past/future events (unless organizer allows)

3. **Cross-Event Contamination:**
   - Search results filtered by current event
   - Member lists only show users in same event

---

## 🎨 UI Context Indicators

### **Show Current Event in Header**

```
┌────────────────────────────────────────┐
│  ⚡ Berlin Urban Rally 2025       [⋮]  │ ← Event name always visible
│  📅 December 11, 2025 • 156 joined     │
├────────────────────────────────────────┤
│                                        │
│  🔍 Search teams or friends...         │
│                                        │
│  [All] [Available] [Top Ranked]        │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🔴 TEAM RED          👥 15/20    │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

**Header Menu (⋮):**
```
┌────────────────────────────────┐
│  Event: Berlin Urban Rally     │
│                                │
│  📋 Event Details              │
│  📊 Leaderboard                │
│  🎯 My Team                    │
│  ─────────────────────         │
│  🔄 Switch Event               │ ← If user in multiple events
│  🚪 Leave Event                │
│                                │
└────────────────────────────────┘
```

---

### **Multi-Event Switcher**

**If user participates in multiple events:**

```
Tap "Switch Event" →

┌────────────────────────────────────────┐
│  Your Events                           │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ ⚡ Berlin Urban Rally        ✓   │ │ ← Current event
│  │ 📅 Dec 11 • TEAM RED             │ │
│  │ 📍 Active Now                    │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ ⚡ Munich Urban Rally             │ │
│  │ 📅 Dec 18 • TEAM BLUE            │ │
│  │ 📍 Starts in 7 days              │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [+ Join Another Event]                │
│                                        │
└────────────────────────────────────────┘

Tap Munich event →
Navigates to: /tenant/munich-456/event/rally-2025/teams
```

---

## 🚀 Implementation Checklist

### **Phase 1: Single-Tenant, Single-Event (MVP)** ✅
- [x] URL-based context (`/event/{eventId}/teams`)
- [x] Query teams by `eventId`
- [x] Hard-coded `tenantId` (single tenant)

### **Phase 2: Multi-Tenant Support**
- [ ] Add `tenantId` to URL (`/tenant/{tenantId}/event/{eventId}/teams`)
- [ ] Update queries to include `tenantId`
- [ ] Create Firestore composite indexes
- [ ] Add tenant validation (check tenant exists)

### **Phase 3: Code-Based Entry**
- [ ] Build code entry screen
- [ ] Backend: Lookup event by code
- [ ] Redirect to URL with context
- [ ] Handle invalid codes

### **Phase 4: Multi-Event Users**
- [ ] Build event switcher UI
- [ ] Query user's events
- [ ] Show event list in profile
- [ ] Handle navigation between events

### **Phase 5: Security Hardening**
- [ ] Update Firestore security rules
- [ ] Add tenant membership checks
- [ ] Test cross-tenant isolation
- [ ] Audit query performance

---

## 📊 Edge Cases

### **Case 1: User Tries to Access Wrong Event**

**URL:** `/tenant/berlin-123/event/munich-456/teams`  
(Event belongs to Munich tenant, not Berlin)

**Solution:**
```typescript
const BrowseTeamsScreen = () => {
  const { tenantId, eventId } = useParams();
  
  // Validate event belongs to tenant
  const { data: event, error } = useFirestoreQuery(
    doc(db, 'events', eventId)
  );
  
  if (error || event?.tenantId !== tenantId) {
    return <ErrorScreen message="Event not found or access denied" />;
  }
  
  // Proceed with teams query...
};
```

---

### **Case 2: User in Multiple Teams (Same Event)**

**Scenario:** Alice accidentally joins TEAM RED and TEAM BLUE

**Solution:**
```typescript
// Prevent multiple team joins
const joinTeam = async (teamId: string) => {
  // Check if user already in a team for this event
  const existingMembership = await getDocs(
    query(
      collection(db, 'teamMembers'),
      where('userId', '==', currentUser.uid),
      where('eventId', '==', eventId)
    )
  );
  
  if (!existingMembership.empty) {
    toast.error('You are already in a team for this event');
    return;
  }
  
  // Proceed with join...
};
```

**UI:**
```
Browse Teams screen:
┌────────────────────────────────────────┐
│  You're already on TEAM RED            │ ← Banner at top
│  [View My Team]  [Leave Team]          │
│                                        │
│  Other teams are shown in gray         │
│  (can't join unless you leave RED)     │
└────────────────────────────────────────┘
```

---

### **Case 3: Event Code Collision**

**Scenario:** Two tenants both use code "RALLY2025"

**Solution 1: Enforce Unique Codes (Recommended)**
```typescript
// Cloud Function: Validate code uniqueness
export const createEvent = onCall(async (request) => {
  const { code, tenantId, name } = request.data;
  
  // Check if code already exists
  const existingEvent = await getDocs(
    query(
      collection(db, 'events'),
      where('code', '==', code.toUpperCase())
    )
  );
  
  if (!existingEvent.empty) {
    throw new Error('Event code already in use. Please choose another.');
  }
  
  // Create event...
});
```

**Solution 2: Tenant-Scoped Codes**
```typescript
// Code only unique within tenant
const existingEvent = await getDocs(
  query(
    collection(db, 'events'),
    where('code', '==', code.toUpperCase()),
    where('tenantId', '==', tenantId)  // Scoped to tenant
  )
);
```

---

### **Case 4: User Joins Event After It Ends**

**Scenario:** Event ended yesterday, user tries to browse teams

**Solution:**
```typescript
const BrowseTeamsScreen = () => {
  const { data: event } = useFirestoreQuery(doc(db, 'events', eventId));
  
  if (event?.status === 'completed') {
    return (
      <InfoScreen 
        title="Event Completed"
        message="This event has ended. You can view results but cannot join teams."
        actions={[
          { label: 'View Leaderboard', onClick: () => navigate('/leaderboard') },
          { label: 'Find Active Events', onClick: () => navigate('/events') }
        ]}
      />
    );
  }
  
  // Show teams...
};
```

---

## 🎯 Recommended Architecture

### **Final Decision: Hybrid Approach** ⭐

**Why:**
1. **Flexibility:** Supports both URL links and code entry
2. **Explicit Context:** URL always contains tenant + event
3. **Scalability:** Works with 100+ tenants, 1000+ events
4. **User-Friendly:** Simple codes for first-time users, direct links for returning users
5. **Developer-Friendly:** Context in URL = easy debugging

**Implementation Priority:**
1. ✅ **Phase 1:** URL-based context (tenant + event in URL)
2. ✅ **Phase 2:** Team browsing with proper scoping
3. 🔄 **Phase 3:** Code entry (redirect to URL-based)
4. 🔜 **Phase 4:** Multi-event support
5. 🔜 **Phase 5:** Security hardening

---

**Document Version:** 1.0  
**Last Updated:** December 11, 2025  
**Next Review:** January 11, 2026  
**Owner:** Product & Engineering Teams
