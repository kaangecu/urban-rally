# Week 1 Backend Tickets - Authentication & Role Management

**Agent:** Backend Proxy  
**Sprint:** Week 1 (Foundation & Auth)  
**Total Story Points:** 8

---

## Ticket BE-001: Enable Email/Password Authentication

**Priority:** P0 (Blocking)  
**Story Points:** 1  
**Estimated Time:** 30 minutes  
**Dependencies:** None

### Description
Enable email/password authentication in Firebase Console to allow admin users to log in with credentials (separate from anonymous player auth).

### Acceptance Criteria
- [ ] Email/Password provider enabled in Firebase Console
- [ ] Provider shows "Enabled" status in Authentication > Sign-in method
- [ ] Test account created successfully via Console
- [ ] Login works in development environment

### Implementation Steps
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Authentication > Sign-in method
3. Find "Email/Password" provider
4. Toggle to "Enabled"
5. Click Save
6. Verify status shows "Enabled"

### Testing
```bash
# Test with curl
curl -X POST 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=[API_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@admin.com",
    "password": "Test123!",
    "returnSecureToken": true
  }'
```

### References
- `FIRST_ADMIN_SETUP_GUIDE.md` - Step 1
- Firebase Auth Documentation: https://firebase.google.com/docs/auth/web/password-auth

---

## Ticket BE-002: Implement `setUserRole` Cloud Function

**Priority:** P0 (Blocking)  
**Story Points:** 3  
**Estimated Time:** 4 hours  
**Dependencies:** None

### Description
Create Cloud Function to set Firebase Custom Claims for user roles. This function allows super admins to grant admin/organizer/moderator roles to users.

### Acceptance Criteria
- [ ] Function accepts `{uid, role, tenantId}` parameters
- [ ] Validates caller has permission to set roles
- [ ] Sets custom claims via Admin SDK
- [ ] Returns success/error response
- [ ] Includes comprehensive error handling
- [ ] Function deployed to Firebase
- [ ] Function logs actions to `auditLogs` collection

### Implementation

**File:** `functions/src/index.ts`

```typescript
import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore, Timestamp} from 'firebase-admin/firestore';

interface SetUserRoleRequest {
  uid: string;
  role: 'superadmin' | 'admin' | 'organizer' | 'moderator' | 'player';
  tenantId: string;
}

export const setUserRole = onCall<SetUserRoleRequest>({
  cors: true,
  region: 'europe-west3',
}, async (request) => {
  const {data, auth} = request;
  const db = getFirestore();

  // Validation: Must be authenticated
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in to set roles');
  }

  // Get caller's custom claims
  const caller = await getAuth().getUser(auth.uid);
  const callerRole = caller.customClaims?.role as string;

  // Permission check: Only superadmin and admin can set roles
  if (!['superadmin', 'admin'].includes(callerRole)) {
    throw new HttpsError('permission-denied', 'Insufficient permissions to set roles');
  }

  // Validation: Role hierarchy
  const roleHierarchy = ['player', 'moderator', 'organizer', 'admin', 'superadmin'];
  const callerLevel = roleHierarchy.indexOf(callerRole);
  const targetLevel = roleHierarchy.indexOf(data.role);

  if (callerRole !== 'superadmin' && targetLevel >= callerLevel) {
    throw new HttpsError(
      'permission-denied',
      'Cannot assign role equal to or higher than your own'
    );
  }

  // Validation: Tenant access
  if (callerRole === 'admin') {
    const callerTenantId = caller.customClaims?.tenantId as string;
    if (data.tenantId !== callerTenantId) {
      throw new HttpsError(
        'permission-denied',
        'Admin can only set roles for their own tenant'
      );
    }
  }

  // Validation: Required fields
  if (!data.uid || !data.role || !data.tenantId) {
    throw new HttpsError('invalid-argument', 'uid, role, and tenantId are required');
  }

  // Validate target user exists
  let targetUser;
  try {
    targetUser = await getAuth().getUser(data.uid);
  } catch (error) {
    throw new HttpsError('not-found', `User with UID ${data.uid} not found`);
  }

  // Set custom claims
  try {
    await getAuth().setCustomUserClaims(data.uid, {
      role: data.role,
      tenantId: data.tenantId,
    });

    // Update user document in Firestore
    await db.collection('users').doc(data.uid).update({
      role: data.role,
      tenantId: data.tenantId,
      updatedAt: Timestamp.now(),
    });

    // Log to audit trail
    await db.collection('auditLogs').add({
      action: 'SET_USER_ROLE',
      actorId: auth.uid,
      actorRole: callerRole,
      targetUserId: data.uid,
      targetUserEmail: targetUser.email,
      oldRole: targetUser.customClaims?.role || 'player',
      newRole: data.role,
      tenantId: data.tenantId,
      timestamp: Timestamp.now(),
      metadata: {
        callerEmail: caller.email,
      },
    });

    return {
      success: true,
      message: `Role set to ${data.role} for user ${data.uid}`,
      user: {
        uid: data.uid,
        email: targetUser.email,
        role: data.role,
        tenantId: data.tenantId,
      },
    };
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new HttpsError('internal', 'Failed to set user role');
  }
});
```

### Testing

**Test Case 1: Super Admin Sets Admin Role**
```bash
# Via emulator
curl -X POST http://127.0.0.1:5001/urban-rally-dev/europe-west3/setUserRole \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [SUPERADMIN_TOKEN]" \
  -d '{
    "data": {
      "uid": "test-user-123",
      "role": "admin",
      "tenantId": "tenant-esn-berlin"
    }
  }'
```

**Test Case 2: Permission Denied (Non-Admin)**
```bash
# Should fail with permission-denied error
curl -X POST http://127.0.0.1:5001/urban-rally-dev/europe-west3/setUserRole \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [PLAYER_TOKEN]" \
  -d '{
    "data": {
      "uid": "test-user-123",
      "role": "admin",
      "tenantId": "tenant-esn-berlin"
    }
  }'
```

**Test Case 3: Verify Custom Claims**
```javascript
// In browser console after role set
firebase.auth().currentUser.getIdTokenResult(true).then(result => {
  console.log('Custom Claims:', result.claims);
  // Should show: { role: 'admin', tenantId: 'tenant-esn-berlin' }
});
```

### Deployment
```bash
cd functions
npm run build
cd ..
firebase deploy --only functions:setUserRole
```

### References
- `docs/FIREBASE_EMULATOR_INITIALIZATION_FIX.md`
- Firebase Custom Claims: https://firebase.google.com/docs/auth/admin/custom-claims
- Existing pattern: `functions/src/index.ts` - `createUserDocument`

---

## Ticket BE-003: Update Auth System for Dual Authentication

**Priority:** P0 (Blocking)  
**Story Points:** 2  
**Estimated Time:** 3 hours  
**Dependencies:** BE-001

### Description
Update Firebase initialization and auth service to support both anonymous auth (for players) and email/password auth (for admins) without conflicts.

### Acceptance Criteria
- [ ] Anonymous auth still works for players
- [ ] Email/password auth works for admins
- [ ] Auth state persists correctly for both types
- [ ] No emulator connection errors on refresh
- [ ] Custom claims loaded correctly for admin users

### Implementation

**File:** `src/services/firebase.service.ts`

Add email auth helper:

```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/firestore';

// ... existing code ...

/**
 * Sign in admin user with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Force token refresh to get latest custom claims
    await userCredential.user.getIdToken(true);
    
    return userCredential.user;
  } catch (error) {
    console.error('Email sign-in error:', error);
    throw error;
  }
}

/**
 * Create admin user with email and password
 * Note: Role must be set separately via setUserRole Cloud Function
 */
export async function createAdminAccount(
  email: string,
  password: string
): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Admin account creation error:', error);
    throw error;
  }
}

/**
 * Sign out current user (works for both anonymous and email auth)
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get custom claims for current user
 */
export async function getUserRole(): Promise<{
  role: string;
  tenantId: string;
} | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const idTokenResult = await user.getIdTokenResult();
    return {
      role: idTokenResult.claims.role as string || 'player',
      tenantId: idTokenResult.claims.tenantId as string || '',
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}
```

**File:** `src/contexts/AuthContext.tsx`

Update to handle role loading:

```typescript
// Add to AuthContext
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setAuthState('restoring');
      
      // Load custom claims
      const roleData = await getUserRole();
      
      // Load user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          ...userData,
          uid: user.uid,
          email: user.email,
          role: roleData?.role || userData.role || 'player',
          tenantId: roleData?.tenantId || userData.tenantId,
        });
      }
      
      setAuthState('authenticated');
    } else {
      setUser(null);
      setAuthState('idle');
    }
  });

  return () => unsubscribe();
}, []);
```

### Testing

**Test Case 1: Anonymous Auth Still Works**
```typescript
// Player login flow
const user = await signInAnonymously(auth);
expect(user.isAnonymous).toBe(true);
```

**Test Case 2: Email Auth Works**
```typescript
// Admin login flow
const user = await signInWithEmail('admin@test.com', 'Test123!');
expect(user.isAnonymous).toBe(false);
expect(user.email).toBe('admin@test.com');
```

**Test Case 3: Custom Claims Loaded**
```typescript
const roleData = await getUserRole();
expect(roleData.role).toBe('superadmin');
expect(roleData.tenantId).toBe('global');
```

### References
- `docs/FIREBASE_EMULATOR_INITIALIZATION_FIX.md`
- `src/services/firebase.service.ts` (existing patterns)

---

## Ticket BE-004: Create Audit Log Helper Functions

**Priority:** P2 (Should Have)  
**Story Points:** 2  
**Estimated Time:** 2 hours  
**Dependencies:** None

### Description
Create reusable helper functions for logging admin actions to Firestore `auditLogs` collection. This ensures consistent audit trail across all Cloud Functions.

### Acceptance Criteria
- [ ] `logAuditAction()` helper function created
- [ ] Includes action type, actor, target, timestamp
- [ ] Supports metadata field for additional context
- [ ] Used in `setUserRole` function
- [ ] Unit tests pass

### Implementation

**File:** `functions/src/utils/auditLog.ts`

```typescript
import {getFirestore, Timestamp} from 'firebase-admin/firestore';

export type AuditAction =
  | 'SET_USER_ROLE'
  | 'CREATE_EVENT'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'APPROVE_SUBMISSION'
  | 'REJECT_SUBMISSION'
  | 'CREATE_TENANT'
  | 'UPDATE_TENANT';

export interface AuditLogEntry {
  action: AuditAction;
  actorId: string;
  actorRole: string;
  tenantId: string;
  timestamp: Timestamp;
  targetId?: string;
  targetType?: 'user' | 'event' | 'task' | 'submission' | 'tenant';
  metadata?: Record<string, any>;
}

/**
 * Log admin action to Firestore audit trail
 */
export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  const db = getFirestore();
  
  try {
    await db.collection('auditLogs').add({
      ...entry,
      timestamp: entry.timestamp || Timestamp.now(),
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't block operations
    console.error('Failed to log audit action:', error);
  }
}

/**
 * Query audit logs for a specific tenant
 */
export async function getAuditLogs(
  tenantId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  const db = getFirestore();
  
  const snapshot = await db.collection('auditLogs')
    .where('tenantId', '==', tenantId)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => doc.data() as AuditLogEntry);
}

/**
 * Clean up old audit logs (run via Cloud Scheduler)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 90): Promise<number> {
  const db = getFirestore();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const snapshot = await db.collection('auditLogs')
    .where('timestamp', '<', Timestamp.fromDate(cutoffDate))
    .limit(500)
    .get();
  
  if (snapshot.empty) {
    return 0;
  }
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  return snapshot.size;
}
```

**Usage Example in `setUserRole`:**

```typescript
import {logAuditAction} from './utils/auditLog';

// ... in setUserRole function ...
await logAuditAction({
  action: 'SET_USER_ROLE',
  actorId: auth.uid,
  actorRole: callerRole,
  tenantId: data.tenantId,
  targetId: data.uid,
  targetType: 'user',
  metadata: {
    oldRole: targetUser.customClaims?.role || 'player',
    newRole: data.role,
    targetEmail: targetUser.email,
  },
  timestamp: Timestamp.now(),
});
```

### Testing

**Test Case 1: Log Entry Created**
```typescript
await logAuditAction({
  action: 'CREATE_EVENT',
  actorId: 'admin-123',
  actorRole: 'admin',
  tenantId: 'tenant-esn',
  targetId: 'event-456',
  targetType: 'event',
  timestamp: Timestamp.now(),
});

// Verify in Firestore
const logs = await getAuditLogs('tenant-esn', 1);
expect(logs[0].action).toBe('CREATE_EVENT');
```

### References
- `functions/src/index.ts` - Existing Firestore patterns

---

## Summary

**Total Story Points:** 8  
**Estimated Time:** 9.5 hours  
**Critical Path:** BE-001 → BE-002 → BE-003

**Deployment Order:**
1. BE-001 (Manual Firebase Console)
2. BE-004 (Deploy audit helpers)
3. BE-002 (Deploy setUserRole function)
4. BE-003 (Update client-side auth)

**Testing Checklist:**
- [ ] Email auth enabled in Console
- [ ] Can create admin account via Console
- [ ] setUserRole function deployed successfully
- [ ] Custom claims set correctly
- [ ] Audit logs appear in Firestore
- [ ] Anonymous auth still works for players
- [ ] No auth emulator errors on refresh

**Next Sprint:** Week 2 - Event Management Backend (tickets TBD)
