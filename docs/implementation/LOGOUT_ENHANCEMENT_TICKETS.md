# Logout Enhancement - Implementation Tickets

**Strategy:** Option 2 - Keep User in Team on Logout  
**Date:** December 13, 2025  
**Status:** In Progress

---

## 🎯 Overview

**Current Bug:**
- User joins team → Provides auth data → Logs out
- Logout clears Zustand store but doesn't call Firebase signOut()
- TeamMember record stays active in Firestore
- User shows as "joined" but can't access dashboard

**Solution:**
- Keep TeamMember record active on logout (preserves progress)
- Add Firebase signOut() to logout function
- Implement session restoration on login
- Add explicit "Leave Team" functionality
- Clear UI indicators for team status

---

## 📋 Tickets

### ✅ TICKET 1: Fix Logout to Call Firebase signOut()
**Priority:** P0 - Critical Bug Fix  
**Estimated Time:** 30 minutes  
**Files to Modify:**
- `src/store/authStore.ts`

**Current Code:**
```typescript
logout: () =>
  set({
    user: null,
    team: null,
    tenant: null,
    isAuthenticated: false,
    error: null,
    isLoading: false,
  }),
```

**Expected Code:**
```typescript
logout: async () => {
  try {
    const auth = getFirebaseAuth();
    
    // Sign out from Firebase
    await auth.signOut();
    
    console.log('✅ User signed out from Firebase');
  } catch (error) {
    console.error('Error signing out:', error);
  } finally {
    // Always clear local state
    set({
      user: null,
      team: null,
      tenant: null,
      isAuthenticated: false,
      error: null,
      isLoading: false,
    });
  }
},
```

**Import Required:**
```typescript
import { getFirebaseAuth } from '../services/firebase.service';
```

**Testing:**
1. Login with team code
2. Click logout
3. Check Firebase Auth console → User should be signed out
4. Check browser devtools → localStorage should be cleared
5. Refresh page → Should redirect to login (not auto-login)

**Success Criteria:**
- ✅ Firebase auth session cleared
- ✅ Zustand persisted state cleared
- ✅ No auto-login on refresh
- ✅ TeamMember record stays `isActive: true` in Firestore

---

### ✅ TICKET 2: Update Logout Call Sites (Make Async)
**Priority:** P0 - Critical  
**Estimated Time:** 15 minutes  
**Files to Modify:**
- `src/components/events/EventHeader.tsx`
- `src/pages/AccountSettings.tsx`
- Any other components calling `logout()`

**Current Code Example:**
```typescript
<button onClick={logout}>Logout</button>
```

**Expected Code:**
```typescript
<button onClick={async () => await logout()}>Logout</button>
```

**Or with handler:**
```typescript
const handleLogout = async () => {
  await logout();
  navigate('/login');
};

<button onClick={handleLogout}>Logout</button>
```

**Testing:**
1. Click logout from EventHeader
2. Click logout from AccountSettings
3. Verify async operation completes
4. Verify navigation works

**Success Criteria:**
- ✅ All logout calls are awaited
- ✅ No race conditions
- ✅ Navigation happens after logout completes

---

### ✅ TICKET 3: Add Session Restoration Logic
**Priority:** P1 - High  
**Estimated Time:** 1 hour  
**Files to Modify:**
- `src/hooks/useFirebaseAuthListener.ts`
- `src/pages/LoginMethodSelector.tsx`

**Current Behavior:**
- User logs in → Firebase auth restored
- User doc loaded
- Team/tenant loaded from persisted state
- **Bug:** Doesn't validate if user is still in that team

**Expected Enhancement:**
```typescript
// In useFirebaseAuthListener.ts

useEffect(() => {
  const auth = getFirebaseAuth();
  
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      logout();
      return;
    }

    try {
      setLoading(true);

      // 1. Get user document
      const userDoc = await getUserById(firebaseUser.uid);
      if (!userDoc) {
        logout();
        return;
      }
      setUser(userDoc);

      // 2. Check if user has active team memberships
      const userTeams = await getUserTeams(firebaseUser.uid);
      
      if (userTeams.length === 0) {
        // No active teams, clear team/tenant
        setTeam(null);
        setTenant(null);
        console.log('ℹ️ User has no active teams');
        return;
      }

      // 3. Try to restore last team from persisted state
      const persistedState = useAuthStore.getState();
      
      if (persistedState.team) {
        // Check if user is still in this team
        const membership = await getTeamMembership(
          persistedState.team.id,
          firebaseUser.uid
        );
        
        if (membership && membership.isActive) {
          // Refresh team and tenant data
          const [team, tenant] = await Promise.all([
            getTeamById(persistedState.team.id),
            getTenantById(persistedState.tenant.id),
          ]);

          if (team && tenant) {
            setTeam(team);
            setTenant(tenant);
            console.log('✅ Session restored for team:', team.teamName);
            return;
          }
        }
      }

      // 4. If can't restore, load first active team
      if (userTeams.length > 0) {
        const firstTeam = await getTeamById(userTeams[0].teamId);
        const tenant = await getTenantById(userTeams[0].tenantId);
        
        if (firstTeam && tenant) {
          setTeam(firstTeam);
          setTenant(tenant);
          console.log('✅ Loaded first active team:', firstTeam.teamName);
        }
      }

    } catch (error) {
      console.error('Error restoring session:', error);
      logout();
    } finally {
      setLoading(false);
    }
  });

  return () => unsubscribe();
}, []);
```

**New Imports Required:**
```typescript
import { getUserTeams, getTeamMembership } from '../services/teamMember.service';
```

**Testing:**
1. Login → Join team → Logout → Login again
   - Should auto-restore to same team
2. Login → Join team A → Leave team A → Join team B → Logout → Login
   - Should restore to team B (most recent)
3. Login → Join team → Admin deletes team → Logout → Login
   - Should handle gracefully (no team)

**Success Criteria:**
- ✅ Users auto-rejoin their team on login
- ✅ Handles edge cases (deleted teams, inactive teams)
- ✅ Falls back to first active team if persisted team unavailable
- ✅ No crashes if user has no teams

---

### ✅ TICKET 4: Add "Leave Team" Button in Team Tab
**Priority:** P1 - High  
**Estimated Time:** 1.5 hours  
**Files to Create:**
- `src/components/team/LeaveTeamButton.tsx`

**Files to Modify:**
- `src/features/team/TeamMembersTab.tsx`

**Component Implementation:**
```typescript
// src/components/team/LeaveTeamButton.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { leaveTeam } from '../../services/teamMember.service';

interface LeaveTeamButtonProps {
  teamId: string;
  teamName: string;
  eventId: string;
  isOwner?: boolean;
}

export function LeaveTeamButton({ 
  teamId, 
  teamName, 
  eventId,
  isOwner = false 
}: LeaveTeamButtonProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isLeaving, setIsLeaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleLeaveTeam = async () => {
    if (!user) return;

    try {
      setIsLeaving(true);

      // Call leaveTeam service
      await leaveTeam({
        userId: user.id,
        teamId,
        eventId,
      });

      console.log('✅ Left team successfully');

      // Logout and redirect to events page
      await logout();
      navigate('/events');

    } catch (error: any) {
      console.error('Error leaving team:', error);
      alert(error.message || 'Failed to leave team. Please try again.');
    } finally {
      setIsLeaving(false);
      setShowConfirmation(false);
    }
  };

  if (!showConfirmation) {
    return (
      <button
        onClick={() => setShowConfirmation(true)}
        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 
                   bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 
                   transition-colors font-medium"
      >
        <LogOut className="w-4 h-4" />
        Leave Team
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Leave Team?
        </h2>

        {/* Message */}
        <div className="text-gray-700 space-y-3 mb-6">
          <p className="text-center">
            Are you sure you want to leave{' '}
            <span className="font-semibold text-gray-900">"{teamName}"</span>?
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-red-900 text-sm">⚠️ Warning:</p>
            <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
              <li>Your personal score will be lost</li>
              <li>Your task completions will be removed</li>
              <li>You cannot rejoin if the team is full</li>
              {isOwner && (
                <li className="font-semibold">
                  As team owner, you must transfer ownership first
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmation(false)}
            disabled={isLeaving}
            className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 
                     text-gray-700 font-medium hover:bg-gray-50 transition-colors
                     disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLeaveTeam}
            disabled={isLeaving || isOwner}
            className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white 
                     font-medium hover:bg-red-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {isLeaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Leaving...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Leave Team
              </>
            )}
          </button>
        </div>

        {isOwner && (
          <p className="text-xs text-center text-red-600 mt-3">
            Team owners cannot leave. Transfer ownership first.
          </p>
        )}
      </div>
    </div>
  );
}
```

**Integration in TeamMembersTab.tsx:**
```typescript
// Add to imports
import { LeaveTeamButton } from '../../components/team/LeaveTeamButton';

// Add to render (bottom of member list)
<div className="mt-6 pt-6 border-t border-gray-200">
  <LeaveTeamButton
    teamId={team.id}
    teamName={team.teamName || 'Team'}
    eventId={team.eventId}
    isOwner={currentUserMembership?.role === 'owner'}
  />
</div>
```

**Testing:**
1. Join team as member → Click "Leave Team" → Confirm
   - Should leave team and redirect to /events
2. Join team as owner → Click "Leave Team"
   - Should show error (can't leave as owner)
3. Click "Leave Team" → Click "Cancel"
   - Should close modal without leaving
4. Leave team → Try to rejoin
   - Should work if team not full

**Success Criteria:**
- ✅ Confirmation modal shows warnings
- ✅ Team owners cannot leave (until ownership transferred)
- ✅ Successfully calls leaveTeam service
- ✅ Redirects to /events after leaving
- ✅ TeamMember record set to `isActive: false`
- ✅ Team memberCount decremented

---

### ✅ TICKET 5: Add Team Status Indicator on Login Page
**Priority:** P2 - Medium  
**Estimated Time:** 45 minutes  
**Files to Modify:**
- `src/pages/LoginMethodSelector.tsx`

**Feature:**
If user has active team memberships, show a banner:

```typescript
// Add to LoginMethodSelector component

import { getUserTeams } from '../services/teamMember.service';
import { getFirebaseAuth } from '../services/firebase.service';

const [activeTeams, setActiveTeams] = useState<any[]>([]);
const auth = getFirebaseAuth();

useEffect(() => {
  async function checkActiveTeams() {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const teams = await getUserTeams(user.uid);
      setActiveTeams(teams);
    } catch (error) {
      console.error('Error loading active teams:', error);
    }
  }

  checkActiveTeams();
}, []);

// In render, add before login options:

{activeTeams.length > 0 && (
  <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
    <div className="flex items-start gap-3">
      <div className="text-2xl">ℹ️</div>
      <div className="flex-1">
        <h3 className="font-semibold text-blue-900 mb-1">
          You're already in {activeTeams.length} team{activeTeams.length > 1 ? 's' : ''}
        </h3>
        <div className="space-y-2">
          {activeTeams.slice(0, 3).map((team) => (
            <button
              key={team.teamId}
              onClick={() => navigate(`/tenant/${team.tenantId}/event/${team.eventId}/dashboard`)}
              className="w-full text-left px-3 py-2 bg-white rounded-lg border border-blue-200 
                       hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <p className="font-medium text-blue-900">{team.teamName || team.accessCode}</p>
              <p className="text-xs text-blue-700">
                Personal Score: {team.personalScore} • Role: {team.role}
              </p>
            </button>
          ))}
        </div>
        {activeTeams.length > 3 && (
          <p className="text-xs text-blue-700 mt-2">
            +{activeTeams.length - 3} more teams
          </p>
        )}
      </div>
    </div>
  </div>
)}
```

**Testing:**
1. Login without teams → No banner shown
2. Login with 1 team → Banner shows with "Rejoin" option
3. Login with 3+ teams → Banner shows first 3 teams
4. Click team in banner → Navigate to that team's dashboard

**Success Criteria:**
- ✅ Shows active teams on login page
- ✅ Quick rejoin functionality
- ✅ Handles multiple teams gracefully
- ✅ Doesn't show if no active teams

---

### ✅ TICKET 6: Add "Last Active" Tracking
**Priority:** P2 - Medium  
**Estimated Time:** 30 minutes  
**Files to Modify:**
- `src/services/teamMember.service.ts`
- `src/types/schema.ts`

**Schema Update:**
```typescript
// In schema.ts TeamMember interface

export interface TeamMember {
  // ... existing fields
  lastActiveAt?: Date;  // NEW: Track when user was last active
}
```

**Service Update:**
```typescript
// In joinTeam function, add:
lastActiveAt: serverTimestamp(),

// NEW: Add updateLastActive function
export async function updateLastActive(
  teamId: string,
  userId: string
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const memberId = `${teamId}-${userId}`;
    const memberRef = doc(db, 'teamMembers', memberId);

    await updateDoc(memberRef, {
      lastActiveAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last active:', error);
    // Don't throw - this is non-critical
  }
}
```

**Integration:**
Call `updateLastActive()` in:
- Dashboard mount (useEffect)
- Task completion
- Score update

**Testing:**
1. Join team → Check Firestore → `lastActiveAt` set
2. Complete task → Check Firestore → `lastActiveAt` updated
3. Logout for 1 hour → Login → Check if still in team

**Success Criteria:**
- ✅ lastActiveAt field tracked
- ✅ Updates on user activity
- ✅ Can be used for cleanup jobs later

---

### 📝 TICKET 7: Add Admin Cleanup Job (Future)
**Priority:** P3 - Low (Future Enhancement)  
**Estimated Time:** 2 hours  
**Files to Create:**
- `scripts/cleanup-inactive-members.ts`

**Purpose:**
Remove users who haven't been active for 90+ days

**Implementation:**
```typescript
// Pseudo-code
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

const inactiveMembers = await getDocs(
  query(
    collection(db, 'teamMembers'),
    where('isActive', '==', true),
    where('lastActiveAt', '<', ninetyDaysAgo)
  )
);

// For each inactive member, call leaveTeam()
```

**Status:** Not started (future work)

---

## 🧪 Testing Checklist

### Bug Fix Validation
- [ ] User can logout without errors
- [ ] Firebase auth session cleared
- [ ] TeamMember record stays active
- [ ] User can rejoin same team

### Session Restoration
- [ ] Auto-login restores team
- [ ] Multiple teams handled gracefully
- [ ] Deleted teams handled without crash

### Leave Team Feature
- [ ] Members can leave team
- [ ] Owners cannot leave (until transfer)
- [ ] Confirmation modal shows warnings
- [ ] TeamMember set to inactive
- [ ] Can rejoin if team not full

### UI/UX
- [ ] Login page shows active teams
- [ ] Team status clear in UI
- [ ] Loading states during async operations
- [ ] Error messages user-friendly

---

## 📊 Success Metrics

**Before Fix:**
- Bug: Users logged out but stuck in "joined" state
- Can't access dashboard after logout/login

**After Fix:**
- ✅ Logout properly signs out from Firebase
- ✅ Session restoration works on login
- ✅ Users can explicitly leave teams
- ✅ Progress preserved across sessions
- ✅ Multi-device support enabled

---

## 🚀 Deployment Plan

1. **Phase 1 (Today):** TICKET 1-3 (Bug fixes)
2. **Phase 2 (Tomorrow):** TICKET 4-5 (Leave team feature + UI)
3. **Phase 3 (Next week):** TICKET 6 (Activity tracking)
4. **Phase 4 (Future):** TICKET 7 (Cleanup job)

---

**Total Estimated Time:** ~5 hours  
**Assignee:** Development Team  
**Reviewer:** Tech Lead
