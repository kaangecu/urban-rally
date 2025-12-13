# Hybrid Login Flow Implementation Plan

**Date:** December 13, 2025  
**Developer:** Full Stack Implementation  
**Status:** 🚧 Phase 2 Complete - Frontend Landing & Entry Screens Done

---

## 📋 Overview

Implementing a hybrid login approach that supports three entry paths:
1. **Event Code** → Browse teams → Select team → Join
2. **Team Code** → Direct join (existing flow)
3. **QR Code** → Instant join (future)

---

## 🎯 Implementation Status

### ✅ Phase 1: Database & Services (COMPLETE)
- ✅ Updated Event schema with `eventCode` field
- ✅ Created `eventCodeGenerator.ts` utility
- ✅ Created `event.service.ts` with `validateEventCode()`
- ✅ Updated `team.service.ts` with `getTeamsForEvent()`
- ⏳ Unit tests (pending)

### ✅ Phase 2: Landing Screen & Event Entry (COMPLETE)
- ✅ Created `LoginMethodSelector` component (3-option landing)
- ✅ Created `EventCodeEntry` component (event code input)
- ✅ Updated `AppRoutes.tsx` with new routes
- ✅ Integrated all navigation flows

### 🚧 Phase 3: Team Browser (IN PROGRESS)
- ⏳ Create `TeamBrowser` component
- ⏳ Create `TeamCard` component
- ⏳ Create `TeamDetailModal` component
- ⏳ Add search functionality
- ⏳ Add filter chips

### ⏳ Phase 4: Integration & Testing (PENDING)
### ⏳ Phase 5: Migration & Deployment (PENDING)

---

## 🎯 Goals

- ✅ Maintain backward compatibility with existing team code flow
- ✅ Add event code + team browser capability
- ✅ Create unified landing screen for all entry methods
- ✅ Prepare infrastructure for QR code scanning
- ✅ Keep existing auth/user flow intact

---

## 📐 Architecture Design

### **Component Structure**

```
src/
├── pages/
│   └── Login.tsx                      # Main login page (NEW: landing screen)
├── features/
│   └── auth/
│       ├── LoginMethodSelector.tsx    # NEW: Choice screen
│       ├── EventCodeEntry.tsx         # NEW: Event code input
│       ├── TeamCodeLogin.tsx          # EXISTING: Keep as-is
│       └── RecoveryCodeLogin.tsx      # EXISTING: Keep as-is
├── features/
│   └── teams/
│       ├── TeamBrowser.tsx            # NEW: Browse teams in event
│       ├── TeamCard.tsx               # NEW: Team display card
│       ├── TeamDetailModal.tsx        # NEW: Team details bottom sheet
│       └── TeamSearch.tsx             # NEW: Search/filter teams
└── services/
    ├── event.service.ts               # UPDATE: Add event code validation
    └── team.service.ts                # UPDATE: Add getTeamsForEvent
```

### **Route Structure**

```typescript
// Current routes (keep):
/login                    → TeamCodeLogin (redirect to new landing)
/login/recovery          → RecoveryCodeLogin

// New routes:
/                        → LoginMethodSelector (landing)
/join/event              → EventCodeEntry
/join/team               → TeamCodeLogin
/join/qr                 → QRScanner (placeholder for future)

// After joining:
/tenant/:tenantId/event/:eventId/dashboard
```

### **Data Flow**

```
Landing Screen
    ↓
[Event Code Path]
    ↓
EventCodeEntry
    ↓ (validate event code)
event.service.validateEventCode()
    ↓ (fetch teams)
team.service.getTeamsForEvent()
    ↓
TeamBrowser (list + search + filters)
    ↓ (user selects team)
TeamDetailModal (confirm)
    ↓ (join team)
teamMember.service.joinTeam()
    ↓
Dashboard

[Team Code Path - Existing]
    ↓
TeamCodeLogin
    ↓ (same as before)
Dashboard
```

---

## 🗄️ Database Schema Changes

### **Events Collection - Add Event Code**

```typescript
// src/types/schema.ts - UPDATE Event interface

export interface Event extends MultiTenantEntity {
  id: string;
  tenantId: string;
  name: string;
  
  // NEW FIELD
  eventCode?: string;              // Unique 8-10 char code (e.g., "BERLIN2025")
  
  // Existing fields
  description: string;
  location: EventLocation;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  settings: EventSettings;
  createdAt: Date;
  updatedAt: Date;
}
```

### **Validation Rules**

```typescript
// Event code format:
// - 6-12 characters
// - Alphanumeric only
// - Uppercase
// - Unique across ALL events (not just per tenant)
// Examples: "BERLIN2025", "RALLY2025", "XMASMUC25"
```

---

## 🔧 Implementation Phases

### **Phase 1: Database & Services (Backend)**
**Time:** 2-3 hours

**Tasks:**
1. ✅ Update Event schema with eventCode field
2. ✅ Create validateEventCode service
3. ✅ Create getTeamsForEvent service
4. ✅ Add event code generation utility
5. ✅ Update Firestore security rules
6. ✅ Write unit tests

---

### **Phase 2: Landing Screen (Frontend)**
**Time:** 2-3 hours

**Tasks:**
1. ✅ Create LoginMethodSelector component
2. ✅ Design card-based selection UI
3. ✅ Add routing logic
4. ✅ Update main Login page
5. ✅ Add animations/transitions

---

### **Phase 3: Event Code Entry (Frontend)**
**Time:** 1-2 hours

**Tasks:**
1. ✅ Create EventCodeEntry component
2. ✅ Add validation UI
3. ✅ Connect to validateEventCode service
4. ✅ Add error handling
5. ✅ Add loading states

---

### **Phase 4: Team Browser (Frontend)**
**Time:** 4-6 hours

**Tasks:**
1. ✅ Create TeamBrowser component
2. ✅ Create TeamCard component
3. ✅ Create TeamDetailModal component
4. ✅ Add search functionality
5. ✅ Add filter chips (All, Available, Top Ranked)
6. ✅ Add real-time member count updates
7. ✅ Add skeleton loading states

---

### **Phase 5: Integration & Testing**
**Time:** 2-3 hours

**Tasks:**
1. ✅ Connect all components
2. ✅ Test event code → team selection flow
3. ✅ Test backward compatibility with team code
4. ✅ Test error scenarios
5. ✅ Add E2E tests

---

### **Phase 6: Migration & Deployment**
**Time:** 1-2 hours

**Tasks:**
1. ✅ Generate event codes for existing events
2. ✅ Update Firestore security rules
3. ✅ Deploy to staging
4. ✅ Test with real data
5. ✅ Deploy to production

---

## 🚀 Phase 1: Database & Services

### **Step 1.1: Update Event Schema**

**File:** `src/types/schema.ts`

```typescript
export interface Event extends MultiTenantEntity {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  
  // NEW: Event code for easy joining
  eventCode?: string;              // e.g., "BERLIN2025"
  
  location: EventLocation;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  settings: EventSettings;
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

### **Step 1.2: Event Code Utilities**

**File:** `src/utils/eventCodeGenerator.ts` (NEW)

```typescript
/**
 * Event Code Generator
 * Generates unique, human-readable event codes
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseFirestore } from '../services/firebase.service';

/**
 * Generate event code from event name
 * 
 * @param eventName - Event name (e.g., "Berlin Winter Hunt 2025")
 * @returns Suggested event code (e.g., "BERLIN2025")
 */
export function generateEventCodeFromName(eventName: string): string {
  // Remove common words
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at'];
  
  // Split into words
  const words = eventName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => !stopWords.includes(word) && word.length > 0);
  
  // Take first 2-3 significant words
  const codeWords = words.slice(0, 3);
  
  // Build code
  let code = '';
  
  // Strategy: First word (up to 6 chars) + Year (4 chars)
  if (codeWords.length > 0) {
    code = codeWords[0].substring(0, 6).toUpperCase();
  }
  
  // Add year if found
  const yearMatch = eventName.match(/20\d{2}/);
  if (yearMatch) {
    code += yearMatch[0];
  }
  
  // Fallback: Random suffix
  if (code.length < 6) {
    code += Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  return code.substring(0, 12); // Max 12 chars
}

/**
 * Check if event code is available
 */
export async function isEventCodeAvailable(code: string): Promise<boolean> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, 'events'),
    where('eventCode', '==', code.toUpperCase())
  );
  
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

/**
 * Generate unique event code
 * Tries suggested code, adds suffix if taken
 */
export async function generateUniqueEventCode(eventName: string): Promise<string> {
  let baseCode = generateEventCodeFromName(eventName);
  let code = baseCode;
  let suffix = 1;
  
  // Try base code
  if (await isEventCodeAvailable(code)) {
    return code;
  }
  
  // Try with numeric suffix
  while (suffix <= 99) {
    code = `${baseCode}${suffix}`;
    if (code.length > 12) {
      // Trim base to fit suffix
      baseCode = baseCode.substring(0, 12 - suffix.toString().length);
      code = `${baseCode}${suffix}`;
    }
    
    if (await isEventCodeAvailable(code)) {
      return code;
    }
    
    suffix++;
  }
  
  // Fallback: Random code
  return `EVT${Date.now().toString(36).toUpperCase().substring(0, 8)}`;
}

/**
 * Validate event code format
 */
export function validateEventCodeFormat(code: string): boolean {
  // 6-12 characters, alphanumeric only
  const regex = /^[A-Z0-9]{6,12}$/;
  return regex.test(code.toUpperCase());
}
```

---

### **Step 1.3: Event Service Updates**

**File:** `src/services/event.service.ts` (UPDATE)

```typescript
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  limit 
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase.service';
import type { Event } from '../types/schema';

// ... existing code ...

/**
 * Validate event code and return event data
 * 
 * @param code - Event code (e.g., "BERLIN2025")
 * @returns Event data if valid, null if invalid/not found
 */
export async function validateEventCode(code: string): Promise<Event | null> {
  try {
    const db = getFirebaseFirestore();
    
    // Normalize code
    const normalizedCode = code.trim().toUpperCase();
    
    // Query by event code
    const q = query(
      collection(db, 'events'),
      where('eventCode', '==', normalizedCode),
      where('status', '==', 'active'),  // Only active events
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`❌ Event code not found: ${normalizedCode}`);
      return null;
    }
    
    const eventDoc = snapshot.docs[0];
    const event = { id: eventDoc.id, ...eventDoc.data() } as Event;
    
    console.log(`✅ Event code validated: ${normalizedCode} → ${event.name}`);
    return event;
    
  } catch (error) {
    console.error('Error validating event code:', error);
    throw new Error('Failed to validate event code');
  }
}

/**
 * Get event by code (includes inactive events)
 * Used by organizers to manage events
 */
export async function getEventByCode(code: string): Promise<Event | null> {
  try {
    const db = getFirebaseFirestore();
    
    const q = query(
      collection(db, 'events'),
      where('eventCode', '==', code.toUpperCase()),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const eventDoc = snapshot.docs[0];
    return { id: eventDoc.id, ...eventDoc.data() } as Event;
    
  } catch (error) {
    console.error('Error getting event by code:', error);
    throw new Error('Failed to get event by code');
  }
}
```

---

### **Step 1.4: Team Service Updates**

**File:** `src/services/team.service.ts` (UPDATE)

```typescript
// ... existing imports ...

/**
 * Get all teams for an event
 * Returns teams ordered by member count (teams with space first)
 * 
 * @param eventId - Event ID
 * @param tenantId - Tenant ID (for security)
 * @returns Array of teams with member counts
 */
export async function getTeamsForEvent(
  eventId: string, 
  tenantId: string
): Promise<Team[]> {
  try {
    const db = getFirebaseFirestore();
    
    // Query teams for this event
    const q = query(
      collection(db, 'teams'),
      where('eventId', '==', eventId),
      where('tenantId', '==', tenantId),
      orderBy('memberCount', 'asc')  // Show teams with space first
    );
    
    const snapshot = await getDocs(q);
    
    const teams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Team));
    
    console.log(`✅ Found ${teams.length} teams for event ${eventId}`);
    
    return teams;
    
  } catch (error) {
    console.error('Error fetching teams for event:', error);
    throw new Error('Failed to fetch teams');
  }
}

/**
 * Get team with real-time member count
 * Includes current member list for display
 */
export async function getTeamWithMembers(teamId: string): Promise<{
  team: Team;
  members: any[];
  isFull: boolean;
}> {
  try {
    const db = getFirebaseFirestore();
    
    // Get team
    const teamDoc = await getDoc(doc(db, 'teams', teamId));
    if (!teamDoc.exists()) {
      throw new Error('Team not found');
    }
    
    const team = { id: teamDoc.id, ...teamDoc.data() } as Team;
    
    // Get members
    const membersQuery = query(
      collection(db, 'teamMembers'),
      where('teamId', '==', teamId),
      where('isActive', '==', true)
    );
    
    const membersSnapshot = await getDocs(membersQuery);
    const members = membersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const isFull = members.length >= (team.maxCapacity || 20);
    
    return { team, members, isFull };
    
  } catch (error) {
    console.error('Error fetching team with members:', error);
    throw new Error('Failed to fetch team details');
  }
}
```

---

## 🎨 Phase 2: Landing Screen

### **Step 2.1: LoginMethodSelector Component**

**File:** `src/features/auth/LoginMethodSelector.tsx` (NEW)

```typescript
import { useNavigate } from 'react-router-dom';

export function LoginMethodSelector() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚡</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Urban Rally
          </h1>
          <p className="text-gray-600">
            How would you like to join?
          </p>
        </div>

        {/* Method Cards */}
        <div className="space-y-4">
          {/* Event Code - Browse Teams */}
          <button
            onClick={() => navigate('/join/event')}
            className="w-full bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className="text-4xl group-hover:scale-110 transition-transform">
                🎪
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Browse Event
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Enter event code to see all teams and choose
                </p>
                <div className="flex items-center text-blue-600 font-medium text-sm">
                  Enter Event Code
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>

          {/* Team Code - Direct Join */}
          <button
            onClick={() => navigate('/join/team')}
            className="w-full bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className="text-4xl group-hover:scale-110 transition-transform">
                👥
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Join Specific Team
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Enter team code if you already know which team
                </p>
                <div className="flex items-center text-blue-600 font-medium text-sm">
                  Enter Team Code
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>

          {/* QR Code - Placeholder for Future */}
          <button
            disabled
            className="w-full bg-gray-100 rounded-xl shadow p-6 text-left opacity-60 cursor-not-allowed"
          >
            <div className="flex items-start space-x-4">
              <div className="text-4xl">📷</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-700 mb-1">
                  Scan QR Code
                </h3>
                <p className="text-gray-500 text-sm mb-2">
                  Instant join (coming soon)
                </p>
                <div className="flex items-center text-gray-500 font-medium text-sm">
                  Coming Soon
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Recovery Login Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/login/recovery')}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Already joined? Use recovery code
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### **Step 2.2: Update Main Login Page**

**File:** `src/pages/Login.tsx` (UPDATE)

```typescript
import { LoginMethodSelector } from '../features/auth/LoginMethodSelector';

export function Login() {
  return <LoginMethodSelector />;
}
```

---

## 📝 Next Steps

This document outlines the complete implementation plan. I'll now begin implementing each phase systematically.

**Current Status:**
- ✅ Documentation complete
- 🚧 Phase 1: Starting implementation

**Time Estimate:**
- Total: 12-16 hours
- Phase 1 (Backend): 2-3 hours
- Phase 2 (Landing): 2-3 hours
- Phase 3 (Event Entry): 1-2 hours
- Phase 4 (Team Browser): 4-6 hours
- Phase 5 (Testing): 2-3 hours
- Phase 6 (Deployment): 1-2 hours

---

**Developer Notes:**
- Maintaining backward compatibility with existing team code flow
- All new code follows existing patterns and conventions
- Type-safe implementation throughout
- Comprehensive error handling
- Real-time updates for team member counts
- Mobile-first responsive design
