# Week 1 State Management Tickets

**Agent:** State Manager  
**Sprint:** Week 1 (Foundation & Auth)  
**Total Story Points:** 6

---

## Ticket STATE-001: Create Admin Store (Zustand)

**Priority:** P0 (Blocking)  
**Story Points:** 2  
**Estimated Time:** 2 hours  
**Dependencies:** None

### Description
Create new Zustand store to manage admin-specific state, including admin mode toggle and admin-related data. Uses persist middleware to save state in localStorage.

### Acceptance Criteria
- [ ] Store file created at `src/store/adminStore.ts`
- [ ] `isAdminMode` boolean state with persistence
- [ ] `setAdminMode` action to toggle admin/player view
- [ ] State persists across browser refreshes
- [ ] TypeScript types defined
- [ ] No performance issues with selective subscriptions

### Implementation

**File:** `src/store/adminStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  // Admin mode toggle
  isAdminMode: boolean;
  setAdminMode: (mode: boolean) => void;

  // Future: Admin-specific data
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;

  selectedTenantId: string | null;
  setSelectedTenantId: (id: string | null) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      // Admin mode
      isAdminMode: false,
      setAdminMode: (mode) => set({ isAdminMode: mode }),

      // Selected entities
      selectedEventId: null,
      setSelectedEventId: (id) => set({ selectedEventId: id }),

      selectedTenantId: null,
      setSelectedTenantId: (id) => set({ selectedTenantId: id }),

      // UI state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'admin-mode-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        isAdminMode: state.isAdminMode,
        selectedEventId: state.selectedEventId,
        selectedTenantId: state.selectedTenantId,
      }),
    }
  )
);

// Selectors (for optimized subscriptions)
export const selectIsAdminMode = (state: AdminState) => state.isAdminMode;
export const selectSelectedEventId = (state: AdminState) => state.selectedEventId;
export const selectSidebarOpen = (state: AdminState) => state.sidebarOpen;
```

### Testing

**Test Case 1: Initial State**
```typescript
import { useAdminStore } from '@/store/adminStore';

const initialState = useAdminStore.getState();
expect(initialState.isAdminMode).toBe(false);
expect(initialState.selectedEventId).toBeNull();
```

**Test Case 2: Toggle Admin Mode**
```typescript
const { setAdminMode } = useAdminStore.getState();

setAdminMode(true);
expect(useAdminStore.getState().isAdminMode).toBe(true);

setAdminMode(false);
expect(useAdminStore.getState().isAdminMode).toBe(false);
```

**Test Case 3: LocalStorage Persistence**
```typescript
// Set admin mode
useAdminStore.getState().setAdminMode(true);

// Check localStorage
const stored = localStorage.getItem('admin-mode-storage');
const parsed = JSON.parse(stored);
expect(parsed.state.isAdminMode).toBe(true);

// Simulate page reload
useAdminStore.persist.rehydrate();
expect(useAdminStore.getState().isAdminMode).toBe(true);
```

**Test Case 4: Selective Subscription (Performance)**
```typescript
// Component only subscribes to isAdminMode
const Component = () => {
  const isAdminMode = useAdminStore(state => state.isAdminMode);
  // Component won't re-render when selectedEventId changes
};
```

### References
- Existing pattern: `src/store/authStore.ts`
- Zustand persist: https://docs.pmnd.rs/zustand/integrations/persisting-store-data

---

## Ticket STATE-002: Create `useAdminAuth` Hook

**Priority:** P0 (Blocking)  
**Story Points:** 2  
**Estimated Time:** 3 hours  
**Dependencies:** BE-003 (signInWithEmail service)

### Description
Create custom React hook to handle admin authentication flows (login, logout, role verification). Abstracts Firebase auth logic from components.

### Acceptance Criteria
- [ ] Hook file created at `src/hooks/useAdminAuth.ts`
- [ ] `login(email, password)` function
- [ ] `logout()` function
- [ ] `checkAdminRole()` function
- [ ] Loading and error states managed
- [ ] Integrates with `useAuthStore`
- [ ] TypeScript types defined

### Implementation

**File:** `src/hooks/useAdminAuth.ts`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail, signOut as firebaseSignOut, getUserRole } from '@/services/firebase.service';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';

interface UseAdminAuthResult {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useAdminAuth(): UseAdminAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);
  const setAdminMode = useAdminStore(state => state.setAdminMode);

  /**
   * Login admin user with email/password
   */
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign in with Firebase
      const user = await signInWithEmail(email, password);

      // Get custom claims (role, tenantId)
      const roleData = await getUserRole();

      if (!roleData) {
        throw new Error('Failed to retrieve user role');
      }

      // Verify user has admin privileges
      const adminRoles = ['superadmin', 'admin', 'organizer', 'moderator'];
      if (!adminRoles.includes(roleData.role)) {
        // Sign out non-admin users
        await firebaseSignOut();
        throw new Error('This account does not have admin privileges');
      }

      // Update auth store
      setUser({
        uid: user.uid,
        email: user.email!,
        role: roleData.role,
        tenantId: roleData.tenantId,
        isAnonymous: false,
      });

      // Enable admin mode
      setAdminMode(true);

      // Redirect to admin dashboard
      navigate('/admin');
    } catch (err: any) {
      console.error('Admin login error:', err);

      // User-friendly error messages
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-email': 'Invalid email address',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later',
        'auth/user-disabled': 'This account has been disabled',
        'auth/network-request-failed': 'Network error. Please check your connection',
      };

      setError(errorMessages[err.code] || err.message || 'Login failed. Please try again');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout admin user
   */
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign out from Firebase
      await firebaseSignOut();

      // Clear auth store
      setUser(null);

      // Disable admin mode
      setAdminMode(false);

      // Redirect to login
      navigate('/admin/login');
    } catch (err: any) {
      console.error('Logout error:', err);
      setError('Failed to logout. Please try again');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  return {
    login,
    logout,
    isLoading,
    error,
    clearError,
  };
}
```

### Usage Example

```tsx
// In AdminLogin.tsx
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminLogin = () => {
  const { login, isLoading, error, clearError } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Automatically redirects to /admin on success
    } catch (err) {
      // Error already set in hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* ... form fields ... */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
};
```

### Testing

**Test Case 1: Successful Login**
```typescript
const { result } = renderHook(() => useAdminAuth());

await act(async () => {
  await result.current.login('admin@test.com', 'Test123!');
});

expect(result.current.isLoading).toBe(false);
expect(result.current.error).toBeNull();
expect(useAuthStore.getState().user?.role).toBe('admin');
expect(useAdminStore.getState().isAdminMode).toBe(true);
```

**Test Case 2: Failed Login (Wrong Password)**
```typescript
const mockSignIn = jest.fn().mockRejectedValue({ code: 'auth/wrong-password' });

const { result } = renderHook(() => useAdminAuth());

await act(async () => {
  try {
    await result.current.login('admin@test.com', 'WrongPassword');
  } catch (err) {
    // Expected
  }
});

expect(result.current.error).toBe('Incorrect password');
```

**Test Case 3: Non-Admin Login Rejected**
```typescript
const mockSignIn = jest.fn().mockResolvedValue({
  uid: '123',
  email: 'player@test.com',
});
const mockGetUserRole = jest.fn().mockResolvedValue({ role: 'player', tenantId: 'tenant-1' });

// Should reject and sign out
await expect(result.current.login('player@test.com', 'Test123!')).rejects.toThrow(
  'This account does not have admin privileges'
);
```

### References
- `src/services/firebase.service.ts` - Auth functions
- `src/store/authStore.ts` - User state management

---

## Ticket STATE-003: Create `useHasAdminRole` Helper Hook

**Priority:** P1 (Must Have)  
**Story Points:** 1  
**Estimated Time:** 1 hour  
**Dependencies:** STATE-001

### Description
Create lightweight helper hook to check if current user has admin privileges. Used by components to conditionally render admin UI elements.

### Acceptance Criteria
- [ ] Hook file created at `src/hooks/useHasAdminRole.ts`
- [ ] Returns boolean indicating admin role status
- [ ] Optionally checks for specific role(s)
- [ ] Uses selective Zustand subscription (performance)
- [ ] TypeScript types defined

### Implementation

**File:** `src/hooks/useHasAdminRole.ts`

```typescript
import { useAuthStore } from '@/store/authStore';

type AdminRole = 'superadmin' | 'admin' | 'organizer' | 'moderator';

/**
 * Check if current user has admin role
 * @param requiredRole - Optional specific role to check for
 * @returns Boolean indicating if user has admin privileges
 */
export function useHasAdminRole(requiredRole?: AdminRole | AdminRole[]): boolean {
  const userRole = useAuthStore(state => state.user?.role);

  if (!userRole) return false;

  // If no specific role required, check if user has any admin role
  if (!requiredRole) {
    return ['superadmin', 'admin', 'organizer', 'moderator'].includes(userRole);
  }

  // Check for specific role(s)
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole as AdminRole);
  }

  return userRole === requiredRole;
}

/**
 * Check if user can perform admin actions for a specific tenant
 */
export function useHasAdminAccessToTenant(tenantId: string): boolean {
  const user = useAuthStore(state => state.user);

  if (!user) return false;

  // Super admin has access to all tenants
  if (user.role === 'superadmin' && user.tenantId === 'global') {
    return true;
  }

  // Other admins only have access to their own tenant
  return user.tenantId === tenantId;
}

/**
 * Get user's permission level as a number (higher = more permissions)
 */
export function usePermissionLevel(): number {
  const userRole = useAuthStore(state => state.user?.role);

  const roleHierarchy: Record<string, number> = {
    player: 0,
    moderator: 1,
    organizer: 2,
    admin: 3,
    superadmin: 4,
  };

  return roleHierarchy[userRole || 'player'] || 0;
}
```

### Usage Examples

**Example 1: Show Admin Button**
```tsx
import { useHasAdminRole } from '@/hooks/useHasAdminRole';

const TaskCard = () => {
  const hasAdminRole = useHasAdminRole();

  return (
    <div>
      <h3>Task Title</h3>
      {hasAdminRole && (
        <button>Edit Task</button>
      )}
    </div>
  );
};
```

**Example 2: Check Specific Role**
```tsx
import { useHasAdminRole } from '@/hooks/useHasAdminRole';

const UserManagement = () => {
  // Only super admins can manage users
  const canManageUsers = useHasAdminRole('superadmin');

  if (!canManageUsers) {
    return <div>Access Denied</div>;
  }

  return <div>User Management UI</div>;
};
```

**Example 3: Check Multiple Roles**
```tsx
import { useHasAdminRole } from '@/hooks/useHasAdminRole';

const EventCreator = () => {
  // Only admins and organizers can create events
  const canCreateEvent = useHasAdminRole(['admin', 'organizer', 'superadmin']);

  return (
    <button disabled={!canCreateEvent}>
      Create Event
    </button>
  );
};
```

**Example 4: Tenant Access Check**
```tsx
import { useHasAdminAccessToTenant } from '@/hooks/useHasAdminRole';

const EventDetail = ({ event }) => {
  const hasAccess = useHasAdminAccessToTenant(event.tenantId);

  return (
    <div>
      <h2>{event.name}</h2>
      {hasAccess && (
        <button>Edit Event</button>
      )}
    </div>
  );
};
```

### Testing

**Test Case 1: Returns True for Admin Roles**
```typescript
useAuthStore.setState({ user: { role: 'admin', uid: '123' } });

const { result } = renderHook(() => useHasAdminRole());
expect(result.current).toBe(true);
```

**Test Case 2: Returns False for Player Role**
```typescript
useAuthStore.setState({ user: { role: 'player', uid: '123' } });

const { result } = renderHook(() => useHasAdminRole());
expect(result.current).toBe(false);
```

**Test Case 3: Check Specific Role**
```typescript
useAuthStore.setState({ user: { role: 'moderator', uid: '123' } });

const { result: allowedResult } = renderHook(() => useHasAdminRole('moderator'));
expect(allowedResult.current).toBe(true);

const { result: deniedResult } = renderHook(() => useHasAdminRole('admin'));
expect(deniedResult.current).toBe(false);
```

**Test Case 4: Tenant Access**
```typescript
useAuthStore.setState({
  user: { role: 'admin', uid: '123', tenantId: 'tenant-1' }
});

const { result: allowed } = renderHook(() => useHasAdminAccessToTenant('tenant-1'));
expect(allowed.current).toBe(true);

const { result: denied } = renderHook(() => useHasAdminAccessToTenant('tenant-2'));
expect(denied.current).toBe(false);
```

**Test Case 5: Super Admin Universal Access**
```typescript
useAuthStore.setState({
  user: { role: 'superadmin', uid: '123', tenantId: 'global' }
});

const { result: tenant1 } = renderHook(() => useHasAdminAccessToTenant('tenant-1'));
expect(tenant1.current).toBe(true);

const { result: tenant2 } = renderHook(() => useHasAdminAccessToTenant('tenant-2'));
expect(tenant2.current).toBe(true);
```

### References
- `src/store/authStore.ts` - User role access
- React hooks best practices

---

## Ticket STATE-004: Update `AuthContext` for Role Loading

**Priority:** P1 (Must Have)  
**Story Points:** 1  
**Estimated Time:** 1 hour  
**Dependencies:** BE-003 (getUserRole service)

### Description
Update existing `AuthContext` to load user roles from Firebase Custom Claims during auth state restoration. Ensures roles are available immediately after page refresh.

### Acceptance Criteria
- [ ] `AuthContext` loads custom claims on auth state change
- [ ] Role data stored in `useAuthStore`
- [ ] Works for both anonymous and email auth
- [ ] No race conditions with auth state machine
- [ ] Existing functionality not broken

### Implementation

**File:** `src/contexts/AuthContext.tsx`

Update the `onAuthStateChanged` listener:

```typescript
import { getUserRole } from '@/services/firebase.service';

// ... existing code ...

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    // Skip if we're creating a new user (prevent race condition)
    if (authState === 'creating') return;

    if (firebaseUser) {
      setAuthState('restoring');

      try {
        // Load custom claims (for admin users)
        let roleData = null;
        if (!firebaseUser.isAnonymous) {
          roleData = await getUserRole();
        }

        // Load user document from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Merge custom claims with Firestore data (custom claims take precedence)
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || userData.email,
            isAnonymous: firebaseUser.isAnonymous,
            role: roleData?.role || userData.role || 'player',
            tenantId: roleData?.tenantId || userData.tenantId || '',
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
          });

          setAuthState('authenticated');
        } else {
          // User document doesn't exist yet (shouldn't happen)
          console.warn('User document not found for authenticated user');
          setAuthState('idle');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setAuthState('error');
      }
    } else {
      // User signed out
      setUser(null);
      setTeam(null);
      setAuthState('idle');
    }
  });

  return () => unsubscribe();
}, [authState]);
```

### Testing

**Test Case 1: Anonymous User (Player)**
```typescript
const mockUser = {
  uid: '123',
  isAnonymous: true,
  email: null,
};

// Trigger auth state change
await act(async () => {
  onAuthStateChanged.mock.calls[0][1](mockUser);
});

const user = useAuthStore.getState().user;
expect(user?.role).toBe('player');
expect(user?.isAnonymous).toBe(true);
```

**Test Case 2: Email User (Admin)**
```typescript
const mockUser = {
  uid: '456',
  isAnonymous: false,
  email: 'admin@test.com',
  getIdTokenResult: () => Promise.resolve({
    claims: { role: 'admin', tenantId: 'tenant-1' }
  }),
};

await act(async () => {
  onAuthStateChanged.mock.calls[0][1](mockUser);
});

const user = useAuthStore.getState().user;
expect(user?.role).toBe('admin');
expect(user?.tenantId).toBe('tenant-1');
```

**Test Case 3: Custom Claims Override Firestore**
```typescript
// Firestore says "organizer", but custom claims say "admin"
// Custom claims should win (more authoritative)

const firestoreData = { role: 'organizer', tenantId: 'tenant-1' };
const customClaims = { role: 'admin', tenantId: 'tenant-1' };

// ... test implementation
expect(user?.role).toBe('admin'); // Custom claims win
```

### References
- `src/contexts/AuthContext.tsx` - Existing auth state machine
- `docs/PROFILE_FIRST_IMPLEMENTATION.md` - Auth flow documentation

---

## Summary

**Total Story Points:** 6  
**Estimated Time:** 7 hours  
**Critical Path:** STATE-001 → STATE-002 → STATE-004

**Store Architecture:**
- `adminStore.ts` - Admin mode state, selected entities, UI state
- `authStore.ts` - User data, role, tenant (updated by AuthContext)

**Hook Architecture:**
- `useAdminAuth` - High-level auth actions (login, logout)
- `useHasAdminRole` - Permission checks for UI rendering
- Both hooks consume from stores (don't duplicate state)

**Integration Points:**
- STATE-001 (adminStore) → Used by UI-001, UI-003, UI-004
- STATE-002 (useAdminAuth) → Used by UI-002 (AdminLogin)
- STATE-003 (useHasAdminRole) → Used by UI-001 (AdminModeToggle)
- STATE-004 (AuthContext update) → Provides role data to all hooks

**Testing Strategy:**
- Unit tests for each store (Zustand test utils)
- Integration tests for hooks (React Testing Library)
- E2E test for full login flow (Playwright)

**Performance Considerations:**
- Use selective subscriptions: `useAdminStore(state => state.isAdminMode)`
- Avoid subscribing to entire store: `useAdminStore()` ❌
- Persist only essential data to localStorage
- Use `partialize` to exclude transient UI state from persistence

**Next Sprint:** Week 2 - Event Management State (event CRUD hooks, real-time sync)
