# 👨‍🎓 Multi-Event User Story: Sarah's Semester Journey

**Date:** December 12, 2025  
**Scenario:** Student joins 3 ESN events during Fall semester  
**Purpose:** Demonstrate how multi-event authentication and user uniqueness works

---

## 📖 Sarah's Story: One Semester, Three Events

### **Background:**
- **User:** Sarah Martinez, exchange student from Spain
- **Organization:** ESN Berlin (Erasmus Student Network)
- **Semester:** Fall 2025 (September - December)
- **Device:** iPhone with Safari browser
- **Events:** 3 different urban rallies throughout the semester

---

## 🎬 Event 1: Welcome Week Rally (September 10, 2025)

### **Scene 1: Sarah's First Event**

```
📅 Date: September 10, 2025
📍 Location: ESN Berlin Orientation Day
👥 Participants: 200 new exchange students
```

**What Happens:**

1. **Sarah opens the app for the first time**
   ```
   URL: https://urbanrally.app
   Status: Not authenticated (no Firebase Auth UID)
   Browser: Clean slate (no cookies, no localStorage)
   ```

2. **Organizer gives Sarah an event code**
   ```
   Organizer: "Hey everyone! Enter this code: WELCOME2025"
   Sarah types: "WELCOME2025"
   ```

3. **System validates the code**
   ```typescript
   // Backend processes code
   const teamCode = "WELCOME2025";
   
   // Looks up team in database
   const team = await getTeamByCode(teamCode);
   
   // Result:
   {
     id: "team-red-001",
     eventId: "welcome-week-sept-2025",
     tenantId: "esn-berlin",
     teamName: "TEAM RED",
     accessCode: "WELCOME2025"
   }
   ```

4. **Sarah enters her name**
   ```
   Form shows:
   "Welcome to TEAM RED!"
   "Enter your name: [Sarah Martinez____]"
   "Email (optional): [sarah@example.com]"
   
   [✓] I accept Terms & Privacy Policy
   
   [Join Team →]
   ```

5. **System creates Sarah's account (FIRST TIME)**
   ```typescript
   // Step 1: Create Anonymous Firebase Auth user
   const userCredential = await signInAnonymously(auth);
   const uid = userCredential.user.uid;
   // Result: "user-sarah-abc123xyz"
   
   // Step 2: Cloud Function creates User document
   await createUserDocument({
     displayName: "Sarah Martinez",
     email: "sarah@example.com",
     tenantId: "esn-berlin",  // ← HOME TENANT (first tenant)
     accountType: "anonymous",
     totalScore: 0,
     eventsParticipated: 0,
     consentGiven: {
       terms: true,
       privacy: true,
       termsVersion: "1.0",
       privacyVersion: "1.0",
       termsAcceptedAt: new Date("2025-09-10T10:30:00Z"),
       privacyAcceptedAt: new Date("2025-09-10T10:30:00Z")
     },
     createdAt: new Date("2025-09-10T10:30:00Z"),
     updatedAt: new Date("2025-09-10T10:30:00Z")
   });
   
   // Step 3: Create TeamMember record
   await createTeamMember({
     id: "team-red-001-user-sarah-abc123xyz",
     userId: "user-sarah-abc123xyz",  // ← UNIQUE USER ID
     teamId: "team-red-001",
     eventId: "welcome-week-sept-2025",  // ← EVENT 1
     tenantId: "esn-berlin",
     displayName: "Sarah Martinez",  // Denormalized for search
     personalScore: 0,
     role: "member",
     isActive: true,
     joinedAt: new Date("2025-09-10T10:30:00Z")
   });
   ```

6. **What's stored in Sarah's browser?**
   ```javascript
   // Firebase Auth Session (in IndexedDB)
   {
     uid: "user-sarah-abc123xyz",  // ← THIS IS SARAH'S UNIQUE ID
     isAnonymous: true,
     providerData: []
   }
   
   // This UID is persisted in browser storage
   // It survives browser restarts
   // It's tied to this specific browser/device
   ```

7. **Sarah plays the event**
   ```
   - Completes 8 tasks
   - Earns 520 points
   - TEAM RED finishes 3rd place
   - Sarah has fun! 🎉
   ```

8. **Database state after Event 1:**
   ```typescript
   // Collection: users
   User {
     id: "user-sarah-abc123xyz",  // ← UNIQUE IDENTIFIER
     displayName: "Sarah Martinez",
     email: "sarah@example.com",
     tenantId: "esn-berlin",  // Home tenant
     accountType: "anonymous",
     totalScore: 520,  // From Event 1
     totalSubmissions: 8,
     eventsParticipated: 1,  // ← ONE event so far
   }
   
   // Collection: teamMembers
   TeamMember #1 {
     id: "team-red-001-user-sarah-abc123xyz",
     userId: "user-sarah-abc123xyz",  // ← Links to User
     eventId: "welcome-week-sept-2025",  // ← EVENT 1
     tenantId: "esn-berlin",
     personalScore: 520,
     tasksCompleted: ["task-1", "task-2", ..., "task-8"]
   }
   ```

---

## 🎃 Event 2: Halloween Hunt (October 31, 2025)

### **Scene 2: Sarah's Second Event (7 weeks later)**

```
📅 Date: October 31, 2025
📍 Location: Sarah's apartment (browsing on her phone)
👥 Participants: 150 students (mix of new + returning)
```

**What Happens:**

1. **Sarah gets a WhatsApp from her friend Anna**
   ```
   Anna: "Hey Sarah! ESN is doing a Halloween Hunt tonight! 
          Join my team 🎃
          Link: https://urbanrally.app/tenant/esn-berlin/event/
                halloween-hunt-2025/teams"
   ```

2. **Sarah clicks the link**
   ```
   URL: /tenant/esn-berlin/event/halloween-hunt-2025/teams
   
   System checks: Is user authenticated?
   → YES! Sarah's browser still has Firebase Auth session
   → UID: "user-sarah-abc123xyz" (same as Event 1)
   ```

3. **Sarah sees Browse Teams screen**
   ```
   ┌────────────────────────────────────────┐
   │  🎃 ESN Berlin Halloween Hunt          │
   │  📅 October 31, 2025                   │
   ├────────────────────────────────────────┤
   │                                        │
   │  🔴 TEAM VAMPIRE        👥 12/20       │
   │  🟣 TEAM WITCH          👥 15/20       │
   │  🟢 TEAM ZOMBIE         👥 8/20   ← Anna's team
   │  🟡 TEAM GHOST          👥 18/20       │
   │                                        │
   └────────────────────────────────────────┘
   
   Sarah taps: "TEAM ZOMBIE" (Anna's team)
   ```

4. **Sarah joins TEAM ZOMBIE**
   ```typescript
   // System detects:
   const currentUser = auth.currentUser;
   const userId = currentUser.uid;  // "user-sarah-abc123xyz"
   
   // System checks: Is Sarah already in this event?
   const existingMembership = await query(
     collection(db, "teamMembers"),
     where("userId", "==", "user-sarah-abc123xyz"),
     where("eventId", "==", "halloween-hunt-2025"),
     where("isActive", "==", true)
   );
   
   // Result: Empty (Sarah not in this event yet)
   
   // System creates NEW TeamMember record
   await createTeamMember({
     id: "team-zombie-002-user-sarah-abc123xyz",
     userId: "user-sarah-abc123xyz",  // ← SAME USER ID
     teamId: "team-zombie-002",
     eventId: "halloween-hunt-2025",  // ← EVENT 2 (different!)
     tenantId: "esn-berlin",  // ← SAME TENANT
     displayName: "Sarah Martinez",
     personalScore: 0,
     role: "member",
     isActive: true,
     joinedAt: new Date("2025-10-31T18:45:00Z")
   });
   
   // Update user stats
   await updateDoc(doc(db, "users", "user-sarah-abc123xyz"), {
     eventsParticipated: 2,  // ← Now 2 events!
     updatedAt: serverTimestamp()
   });
   ```

5. **Key Insight: No new User created!**
   ```
   ❓ Why not create a new User?
   ✅ Sarah's browser still has the Firebase Auth session
   ✅ Same UID: "user-sarah-abc123xyz"
   ✅ System recognizes her automatically
   ✅ Just creates a NEW TeamMember record
   
   Result:
   - 1 User document (shared across events)
   - 2 TeamMember documents (one per event)
   ```

6. **Sarah plays Event 2**
   ```
   - Completes 10 tasks
   - Earns 680 points
   - TEAM ZOMBIE finishes 1st place! 🏆
   ```

7. **Database state after Event 2:**
   ```typescript
   // Collection: users (SAME document, updated)
   User {
     id: "user-sarah-abc123xyz",  // ← UNCHANGED
     displayName: "Sarah Martinez",
     tenantId: "esn-berlin",
     totalScore: 1200,  // ← 520 + 680 (aggregated!)
     totalSubmissions: 18,  // ← 8 + 10
     eventsParticipated: 2,  // ← NOW 2 events
   }
   
   // Collection: teamMembers (NOW 2 records)
   TeamMember #1 {  // Event 1
     userId: "user-sarah-abc123xyz",
     eventId: "welcome-week-sept-2025",
     personalScore: 520
   }
   
   TeamMember #2 {  // Event 2 (NEW!)
     userId: "user-sarah-abc123xyz",  // ← SAME USER
     eventId: "halloween-hunt-2025",  // ← DIFFERENT EVENT
     personalScore: 680
   }
   ```

---

## 🎄 Event 3: Christmas Market Quest (December 15, 2025)

### **Scene 3: Sarah's Third Event (6 weeks later)**

```
📅 Date: December 15, 2025
📍 Location: ESN Berlin office
👥 Participants: 180 students
🆕 Twist: This time, Sarah scans a QR code!
```

**What Happens:**

1. **Sarah arrives at ESN office**
   ```
   Organizer has 5 tablets showing QR codes:
   
   Tablet 1: TEAM SNOWFLAKE (QR code)
   Tablet 2: TEAM REINDEER (QR code)
   Tablet 3: TEAM GINGERBREAD (QR code)
   Tablet 4: TEAM SANTA (QR code)
   Tablet 5: TEAM ELVES (QR code)
   ```

2. **Sarah scans QR code for TEAM SANTA**
   ```
   Sarah opens app → Tap "Scan QR" button
   Camera opens
   Points at TEAM SANTA QR code
   
   QR contains:
   {
     "teamId": "team-santa-003",
     "eventId": "christmas-market-2025",
     "tenantId": "esn-berlin",
     "accessCode": "SANTA2025"
   }
   ```

3. **System processes QR scan**
   ```typescript
   // Step 1: Parse QR data
   const qrData = {
     teamId: "team-santa-003",
     eventId: "christmas-market-2025",
     tenantId: "esn-berlin"
   };
   
   // Step 2: Check authentication
   const currentUser = auth.currentUser;
   const userId = currentUser.uid;  // "user-sarah-abc123xyz"
   
   // Step 3: Check if already in this event
   const existing = await getUserEventParticipation(
     "user-sarah-abc123xyz",
     "christmas-market-2025"
   );
   
   // Result: null (not in this event yet)
   
   // Step 4: Validate team has space
   const team = await getTeam("team-santa-003");
   const hasSpace = team.memberUserIds.length < team.maxMembers;
   // Result: true (14/20 members)
   
   // Step 5: Create TeamMember (third event!)
   await createTeamMember({
     id: "team-santa-003-user-sarah-abc123xyz",
     userId: "user-sarah-abc123xyz",  // ← SAME USER (3rd time)
     teamId: "team-santa-003",
     eventId: "christmas-market-2025",  // ← EVENT 3
     tenantId: "esn-berlin",  // ← STILL SAME TENANT
     displayName: "Sarah Martinez",
     personalScore: 0,
     role: "member",
     isActive: true,
     joinedAt: new Date("2025-12-15T14:20:00Z")
   });
   
   // Step 6: Update user stats
   await updateDoc(doc(db, "users", "user-sarah-abc123xyz"), {
     eventsParticipated: 3,  // ← NOW 3 events!
     updatedAt: serverTimestamp()
   });
   
   // Step 7: Auto-redirect (no confirmation needed for QR)
   navigate("/tenant/esn-berlin/event/christmas-market-2025/dashboard");
   ```

4. **Sarah plays Event 3**
   ```
   - Completes 12 tasks
   - Earns 840 points
   - TEAM SANTA finishes 2nd place 🎅
   ```

5. **Final database state (End of semester):**
   ```typescript
   // Collection: users (ONE document for Sarah)
   User {
     id: "user-sarah-abc123xyz",  // ← SAME ID all semester
     displayName: "Sarah Martinez",
     email: "sarah@example.com",
     tenantId: "esn-berlin",
     accountType: "anonymous",
     totalScore: 2040,  // ← 520 + 680 + 840 (all events!)
     totalSubmissions: 30,  // ← 8 + 10 + 12
     eventsParticipated: 3,  // ← THREE events
     createdAt: "2025-09-10T10:30:00Z",  // First event
     updatedAt: "2025-12-15T14:20:00Z"   // Last event
   }
   
   // Collection: teamMembers (THREE records for Sarah)
   TeamMember #1 {
     id: "team-red-001-user-sarah-abc123xyz",
     userId: "user-sarah-abc123xyz",
     eventId: "welcome-week-sept-2025",
     tenantId: "esn-berlin",
     personalScore: 520,
     joinedAt: "2025-09-10T10:30:00Z"
   }
   
   TeamMember #2 {
     id: "team-zombie-002-user-sarah-abc123xyz",
     userId: "user-sarah-abc123xyz",  // ← SAME USER
     eventId: "halloween-hunt-2025",
     tenantId: "esn-berlin",
     personalScore: 680,
     joinedAt: "2025-10-31T18:45:00Z"
   }
   
   TeamMember #3 {
     id: "team-santa-003-user-sarah-abc123xyz",
     userId: "user-sarah-abc123xyz",  // ← SAME USER
     eventId: "christmas-market-2025",
     tenantId: "esn-berlin",
     personalScore: 840,
     joinedAt: "2025-12-15T14:20:00Z"
   }
   ```

---

## 🔑 How User Uniqueness Is Determined

### **1. Primary Identifier: Firebase Auth UID**

```typescript
// When Sarah first joins (Event 1):
const userCredential = await signInAnonymously(auth);
const uid = userCredential.user.uid;
// Result: "user-sarah-abc123xyz"

// This UID is:
✅ Globally unique (Firebase guarantees)
✅ Persistent across app visits (stored in browser)
✅ Tied to this specific browser/device
✅ Used as primary key in Firestore
```

**What makes it unique:**
- Generated by Firebase Auth (cryptographically secure)
- 28-character alphanumeric string
- Probability of collision: ~1 in 10^50 (astronomically low)
- Example: `user-sarah-abc123xyz` vs `user-anna-def456uvw`

---

### **2. How the System Recognizes Sarah**

**Scenario: Sarah opens app on Day 1 vs Day 60**

```typescript
// Day 1 (Event 1 - September 10):
auth.currentUser  // → null (not authenticated)
→ System calls signInAnonymously()
→ Creates UID: "user-sarah-abc123xyz"
→ Stores in browser IndexedDB

// Day 60 (Event 2 - October 31):
auth.currentUser  // → { uid: "user-sarah-abc123xyz" }
→ System detects existing session
→ NO new UID created
→ Uses same UID: "user-sarah-abc123xyz"

// Day 95 (Event 3 - December 15):
auth.currentUser  // → { uid: "user-sarah-abc123xyz" }
→ Same session still valid
→ Uses same UID: "user-sarah-abc123xyz"
```

**Browser Storage:**
```javascript
// IndexedDB (Persistent)
firebaseLocalStorageDb: {
  "firebase:authUser:AIzaSy...": {
    uid: "user-sarah-abc123xyz",  // ← STORED HERE
    isAnonymous: true,
    stsTokenManager: {
      accessToken: "eyJhbGc...",
      expirationTime: 1733423999999  // Auto-refreshes
    }
  }
}

// This data persists:
✅ Across browser restarts
✅ Across app visits
✅ For weeks/months (until user clears browser data)
```

---

### **3. Multi-Event Linking Mechanism**

**How Sarah's 3 events are linked:**

```typescript
// Query: Get all of Sarah's events
const sarahsEvents = await query(
  collection(db, "teamMembers"),
  where("userId", "==", "user-sarah-abc123xyz"),
  orderBy("joinedAt", "desc")
);

// Result:
[
  {
    eventId: "christmas-market-2025",     // Event 3 (most recent)
    eventName: "Christmas Market Quest",
    joinedAt: "2025-12-15T14:20:00Z",
    personalScore: 840
  },
  {
    eventId: "halloween-hunt-2025",       // Event 2
    eventName: "Halloween Hunt",
    joinedAt: "2025-10-31T18:45:00Z",
    personalScore: 680
  },
  {
    eventId: "welcome-week-sept-2025",    // Event 1 (oldest)
    eventName: "Welcome Week Rally",
    joinedAt: "2025-09-10T10:30:00Z",
    personalScore: 520
  }
]

// All linked by: userId = "user-sarah-abc123xyz"
```

**Visual Representation:**

```
┌─────────────────────────────────────────┐
│ User: Sarah Martinez                    │
│ ID: user-sarah-abc123xyz                │ ← UNIQUE IDENTIFIER
│ Total Score: 2040                       │
│ Events: 3                               │
└─────────────────────────────────────────┘
           │
           ├──────────────────────────────┐
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│ TeamMember #1        │      │ TeamMember #2        │
│ Event: Welcome Week  │      │ Event: Halloween     │
│ Score: 520           │      │ Score: 680           │
│ Date: Sept 10        │      │ Date: Oct 31         │
└──────────────────────┘      └──────────────────────┘
                              
                              ┌──────────────────────┐
                              │ TeamMember #3        │
                              │ Event: Christmas     │
                              │ Score: 840           │
                              │ Date: Dec 15         │
                              └──────────────────────┘

All three TeamMember records share:
→ userId: "user-sarah-abc123xyz"
```

---

### **4. What if Sarah Uses a Different Device?**

**Scenario: Sarah switches from iPhone to laptop**

```
📱 Day 1-95: iPhone Safari
   → UID: "user-sarah-abc123xyz"
   → Joined 3 events

💻 Day 96: Laptop Chrome (first time)
   → No Firebase Auth session
   → auth.currentUser = null
   
What happens?
❌ System does NOT recognize Sarah
❌ Creates NEW UID: "user-sarah-def456uvw"
❌ Sarah has TWO accounts now!

Result:
- Old account (iPhone): "user-sarah-abc123xyz" (3 events, 2040 points)
- New account (Laptop): "user-sarah-def456uvw" (0 events, 0 points)
```

**This is WHY recovery codes are important:**

```typescript
// Before switching devices, Sarah should:
1. Open app on iPhone
2. Go to Settings → "Create Recovery Code"
3. System generates: "ABC123"
4. Sarah saves this code

// On new device (Laptop):
1. Open app → "Recover Account"
2. Enter code: "ABC123"
3. System finds user with recoveryCode="ABC123"
4. Links laptop to old account
5. Now same UID on both devices!
```

---

### **5. User Uniqueness Guarantees**

**What makes Sarah unique across the ENTIRE system:**

```typescript
// 1. Firebase Auth UID (Primary)
uid: "user-sarah-abc123xyz"
→ Globally unique across ALL users
→ Guaranteed by Firebase (cryptographic)
→ Never changes (permanent)

// 2. Browser Session (Secondary)
Browser IndexedDB stores UID
→ Persists across visits
→ Auto-refreshes authentication token
→ Lost if browser data cleared

// 3. Optional Email (Tertiary)
email: "sarah@example.com"
→ NOT used for uniqueness (optional field)
→ Multiple users can have no email
→ Used only for notifications

// 4. Display Name (NOT unique)
displayName: "Sarah Martinez"
→ Many users can have same name
→ Used for search/display only
→ NOT used for identification
```

**Example of Multiple Sarahs:**

```typescript
// Database can have:
User #1 {
  id: "user-sarah-abc123xyz",
  displayName: "Sarah Martinez",  // Spain
  email: "sarah@example.com"
}

User #2 {
  id: "user-sarah-def456uvw",
  displayName: "Sarah Martinez",  // USA (different person!)
  email: "sarah.m@other.com"
}

// System distinguishes by UID, NOT name
// Both can join same event, different teams
```

---

## 🎯 UI Features Enabled by Multi-Event

### **1. Event Switcher**

```
Sarah opens app → Sees dropdown:

┌────────────────────────────────────────┐
│ My Events ▼                            │
├────────────────────────────────────────┤
│ ✓ Christmas Market Quest (Active)     │ ← Current
│   Halloween Hunt (Ended)               │
│   Welcome Week Rally (Ended)           │
└────────────────────────────────────────┘

Sarah taps "Halloween Hunt" →
Navigates to: /tenant/esn-berlin/event/halloween-hunt-2025/dashboard
Shows: TEAM ZOMBIE, 680 points, 1st place 🏆
```

---

### **2. Event History**

```
Sarah's Profile:

┌────────────────────────────────────────┐
│ Sarah Martinez                         │
│ Member since: September 10, 2025       │
├────────────────────────────────────────┤
│ Total Stats:                           │
│ • 3 events participated                │
│ • 2040 total points                    │
│ • 30 tasks completed                   │
│                                        │
│ Events:                                │
│ 1. Christmas Market Quest (Dec 15)     │
│    TEAM SANTA • 840 pts • 2nd place    │
│                                        │
│ 2. Halloween Hunt (Oct 31)             │
│    TEAM ZOMBIE • 680 pts • 1st place   │
│                                        │
│ 3. Welcome Week Rally (Sept 10)        │
│    TEAM RED • 520 pts • 3rd place      │
└────────────────────────────────────────┘
```

---

### **3. Friend Discovery Across Events**

```
Sarah searches for "Anna" in Christmas event:

System queries:
- TeamMembers in "christmas-market-2025"
- displayName contains "Anna"

Results:
┌────────────────────────────────────────┐
│ Anna Weber                             │
│ 🎅 TEAM SANTA • Joined 2 hours ago     │
│ Previously: TEAM ZOMBIE (Halloween)    │ ← Cross-event!
│ [View Team →]                          │
└────────────────────────────────────────┘

Sarah can see:
✅ Anna is in TEAM SANTA (current event)
✅ Anna was in TEAM ZOMBIE (past event with Sarah!)
✅ Shared history: "You played together before"
```

---

## 🚨 Edge Cases & Solutions

### **Case 1: Sarah Tries to Join Two Teams in Same Event**

```typescript
// Sarah is in TEAM SANTA (Christmas event)
// Sarah tries to join TEAM ELVES (same event)

const existingMembership = await getUserEventParticipation(
  "user-sarah-abc123xyz",
  "christmas-market-2025"
);

if (existingMembership) {
  throw new Error(
    "You're already in TEAM SANTA for this event. " +
    "You can only join one team per event."
  );
}

// UI shows:
⚠️ Already in This Event
You're on TEAM SANTA. Leave that team first to join another.
[View My Team] [Stay Here]
```

---

### **Case 2: Sarah Clears Browser Data**

```
Sarah clears cookies/cache on Day 100
→ Loses Firebase Auth session
→ UID "user-sarah-abc123xyz" is lost

Next time Sarah opens app:
→ auth.currentUser = null
→ System thinks: "New user"
→ Creates NEW UID: "user-sarah-xyz789abc"

Result:
❌ Sarah has TWO accounts now
❌ Old account: 3 events, 2040 points (inaccessible)
❌ New account: 0 events, 0 points (active)

Solution: Recovery Codes
If Sarah had generated recovery code:
1. Enter code: "ABC123"
2. System finds old account
3. Links new session to old UID
4. All history restored!
```

---

### **Case 3: Sarah Joins Event in Different Tenant**

```
Sarah joins: ESN Munich event (different organization)

Event details:
- tenantId: "esn-munich" (NOT "esn-berlin")
- eventId: "munich-rally-2025"

System creates:
TeamMember {
  userId: "user-sarah-abc123xyz",  // ← SAME USER
  eventId: "munich-rally-2025",
  tenantId: "esn-munich"  // ← DIFFERENT TENANT!
}

User document:
User {
  tenantId: "esn-berlin"  // ← STILL "home tenant" (doesn't change)
}

Result:
✅ Sarah can participate in multiple tenants
✅ User.tenantId is semantic only (not a constraint)
✅ Multi-tenant participation via TeamMember records
```

---

## 📊 Database Queries for Sarah's Data

### **Query 1: Get Sarah's Profile**

```typescript
const sarah = await getDoc(doc(db, "users", "user-sarah-abc123xyz"));

// Returns:
{
  id: "user-sarah-abc123xyz",
  displayName: "Sarah Martinez",
  totalScore: 2040,
  eventsParticipated: 3
}
```

---

### **Query 2: Get All Sarah's Events**

```typescript
const sarahsEvents = await getDocs(
  query(
    collection(db, "teamMembers"),
    where("userId", "==", "user-sarah-abc123xyz"),
    orderBy("joinedAt", "desc")
  )
);

// Returns: 3 TeamMember records
// Each with different eventId
```

---

### **Query 3: Get Sarah's Current Event**

```typescript
const currentEvent = await getDocs(
  query(
    collection(db, "teamMembers"),
    where("userId", "==", "user-sarah-abc123xyz"),
    where("isActive", "==", true),
    orderBy("joinedAt", "desc"),
    limit(1)
  )
);

// Returns: TeamMember for Christmas event (most recent)
```

---

### **Query 4: Check if Sarah in Specific Event**

```typescript
const isInEvent = await getDocs(
  query(
    collection(db, "teamMembers"),
    where("userId", "==", "user-sarah-abc123xyz"),
    where("eventId", "==", "christmas-market-2025"),
    where("isActive", "==", true)
  )
);

// Returns: 1 record if Sarah in event, empty if not
```

---

## ✅ Summary: How It All Works

### **User Uniqueness:**
1. **Firebase Auth UID** is the ONLY source of truth
2. Generated once on first login (anonymous)
3. Stored in browser IndexedDB (persistent)
4. Used as foreign key in TeamMember records
5. Same UID across all events Sarah joins

### **Multi-Event Mechanism:**
1. **ONE User document** per person (shared across events)
2. **MULTIPLE TeamMember documents** (one per event participation)
3. TeamMember links: User ↔ Team ↔ Event
4. User stats aggregate across ALL events

### **Sarah's Journey:**
- **Day 1:** Creates account → UID assigned
- **Day 60:** Same UID → Joins Event 2
- **Day 95:** Same UID → Joins Event 3
- **Result:** 1 User, 3 TeamMembers, 2040 total points

### **What Makes Sarah Unique:**
```
Primary:   Firebase UID ("user-sarah-abc123xyz")
Secondary: Browser session (IndexedDB storage)
Tertiary:  Recovery code (optional, for account recovery)
NOT:       Display name (many "Sarah Martinez" can exist)
NOT:       Email (optional, can be null)
```

---

**The system is designed so that:**
- ✅ One person = One Firebase UID = One User document
- ✅ One person can join unlimited events (different TeamMember records)
- ✅ User identity persists across events (same UID)
- ✅ Stats aggregate globally (totalScore, eventsParticipated)
- ✅ Event-specific data isolated (TeamMember per event)

**This is the power of multi-event architecture!** 🚀
