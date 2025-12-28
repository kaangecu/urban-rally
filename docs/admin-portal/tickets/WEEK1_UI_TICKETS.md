# Week 1 UI Tickets - Admin Interface Foundation

**Agent:** UI Component Builder  
**Sprint:** Week 1 (Foundation & Auth)  
**Total Story Points:** 10

---

## Ticket UI-001: Create Admin Mode Toggle Component

**Priority:** P0 (Blocking)  
**Story Points:** 2  
**Estimated Time:** 2 hours  
**Dependencies:** None

### Description
Build floating toggle button that allows admin users to switch between player view and admin view. Button only visible to users with admin roles (superadmin, admin, organizer, moderator).

### Acceptance Criteria
- [ ] Button renders in bottom-right corner (fixed position)
- [ ] Shows Shield icon + "Admin View" when in player mode
- [ ] Shows User icon + "Player View" when in admin mode
- [ ] Only visible to non-player roles
- [ ] Uses Tactical Ops theme styling
- [ ] Touch target minimum 44px height
- [ ] Persists state in localStorage via Zustand
- [ ] Mobile-first responsive design

### Design Specifications

**Desktop (1024px+):**
- Position: `fixed bottom-4 right-4`
- Size: `px-4 py-3`
- Font: `text-xs font-bold uppercase`

**Mobile (< 768px):**
- Position: `fixed bottom-20 right-4` (above bottom nav)
- Size: `px-6 py-4` (larger touch target)
- Font: `text-xs font-bold uppercase`

**Colors (Tactical Ops):**
- Background: `bg-slate-800` (#1e293b)
- Border: `border border-slate-700`
- Text: `text-slate-200`
- Hover: `hover:bg-slate-700`

### Implementation

**File:** `src/components/AdminModeToggle.tsx`

```tsx
import { Shield, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';

const AdminModeToggle = () => {
  const user = useAuthStore(state => state.user);
  const { isAdminMode, setAdminMode } = useAdminStore();

  // Hide for players or unauthenticated users
  const hasAdminRole = user?.role && ['superadmin', 'admin', 'organizer', 'moderator'].includes(user.role);
  if (!hasAdminRole) return null;

  const handleToggle = () => {
    setAdminMode(!isAdminMode);
  };

  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-4 right-4 md:bottom-4 md:right-4 z-50 bg-slate-800 border border-slate-700 rounded-lg px-6 py-4 md:px-4 md:py-3 text-xs font-bold uppercase text-slate-200 hover:bg-slate-700 transition-colors shadow-lg flex items-center gap-2 min-h-[44px]"
      aria-label={isAdminMode ? 'Switch to player view' : 'Switch to admin view'}
    >
      {isAdminMode ? (
        <>
          <User size={16} />
          <span className="hidden sm:inline">Player View</span>
          <span className="sm:hidden">Player</span>
        </>
      ) : (
        <>
          <Shield size={16} />
          <span className="hidden sm:inline">Admin View</span>
          <span className="sm:hidden">Admin</span>
        </>
      )}
    </button>
  );
};

export default AdminModeToggle;
```

### Testing

**Test Case 1: Visibility for Admin Roles**
```typescript
import { render, screen } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';

// Mock admin user
useAuthStore.setState({ user: { role: 'admin', uid: '123' } });

render(<AdminModeToggle />);
expect(screen.getByLabelText(/switch to admin view/i)).toBeInTheDocument();
```

**Test Case 2: Hidden for Players**
```typescript
useAuthStore.setState({ user: { role: 'player', uid: '123' } });

const { container } = render(<AdminModeToggle />);
expect(container.firstChild).toBeNull();
```

**Test Case 3: Toggle Functionality**
```typescript
const { getByRole } = render(<AdminModeToggle />);
const button = getByRole('button');

fireEvent.click(button);
expect(useAdminStore.getState().isAdminMode).toBe(true);

fireEvent.click(button);
expect(useAdminStore.getState().isAdminMode).toBe(false);
```

### Mobile Testing
- [ ] Test on iPhone SE (375px) - button visible, tappable
- [ ] Test on Galaxy S23 (360px) - button doesn't overlap nav
- [ ] Test on iPad (768px) - button scales correctly
- [ ] Verify 44px minimum tap target on all devices

### References
- `docs/admin-portal/admin_portal_style.md` - Tactical Ops theme
- `src/store/authStore.ts` - User role access

---

## Ticket UI-002: Create Admin Login Page

**Priority:** P0 (Blocking)  
**Story Points:** 3  
**Estimated Time:** 4 hours  
**Dependencies:** None

### Description
Build dedicated admin login page at `/admin/login` with email/password form. Uses Tactical Ops theme for professional appearance, distinct from player UI.

### Acceptance Criteria
- [ ] Route: `/admin/login`
- [ ] Email and password input fields
- [ ] "Sign In" button with loading state
- [ ] Error handling for invalid credentials
- [ ] "Forgot Password" link (future feature)
- [ ] Mobile-first responsive design
- [ ] Tactical Ops theme applied
- [ ] Redirects to `/admin` on success
- [ ] Shows validation errors inline

### Design Specifications

**Layout:**
- Centered card on solid slate-900 background
- Card: `max-w-md` (448px), `bg-slate-800`, `border-slate-700`
- Logo/branding at top
- Form fields stacked vertically
- Full-width submit button

**Mobile (< 768px):**
- Full-screen form (no card)
- Inputs: `h-12` (larger touch targets)
- Button: `h-14` (56px)

**Desktop (768px+):**
- Centered card with padding
- Inputs: `h-10`
- Button: `h-11`

### Implementation

**File:** `src/features/admin/pages/AdminLogin.tsx`

```tsx
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { signInWithEmail } from '@/services/firebase.service';
import { useAuthStore } from '@/store/authStore';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await signInWithEmail(email, password);
      
      // Get user role from custom claims
      const idTokenResult = await user.getIdTokenResult();
      const role = idTokenResult.claims.role as string;

      // Verify user has admin role
      if (!['superadmin', 'admin', 'organizer', 'moderator'].includes(role)) {
        throw new Error('This account does not have admin privileges');
      }

      // Update auth store
      setUser({
        uid: user.uid,
        email: user.email!,
        role,
        tenantId: idTokenResult.claims.tenantId as string,
      });

      // Redirect to admin dashboard
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // User-friendly error messages
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later');
      } else {
        setError(err.message || 'Login failed. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 border border-slate-700 rounded-xl mb-4">
            <Shield size={32} className="text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-200 mb-2">Admin Portal</h1>
          <p className="text-sm text-slate-500 uppercase tracking-wider">Urban Rally</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 md:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 md:h-10 bg-[#0f172a] border border-slate-700 rounded-lg pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@organization.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 md:h-10 bg-[#0f172a] border border-slate-700 rounded-lg pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 md:h-11 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              Forgot your password?{' '}
              <a href="/admin/forgot-password" className="text-blue-400 hover:text-blue-300 font-bold">
                Reset Password
              </a>
            </p>
          </div>
        </div>

        {/* Back to Player App */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-slate-500 hover:text-slate-400 transition-colors inline-flex items-center gap-1"
          >
            ← Back to Player App
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
```

### Testing

**Test Case 1: Form Validation**
```typescript
render(<AdminLogin />);

const emailInput = screen.getByLabelText(/email/i);
const submitButton = screen.getByRole('button', { name: /sign in/i });

// Empty form
fireEvent.click(submitButton);
expect(emailInput).toBeInvalid();

// Valid email
fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
expect(emailInput).toBeValid();
```

**Test Case 2: Successful Login**
```typescript
const mockSignIn = jest.fn().mockResolvedValue({
  uid: '123',
  email: 'admin@test.com',
  getIdTokenResult: () => Promise.resolve({
    claims: { role: 'admin', tenantId: 'tenant-1' }
  })
});

// ... test implementation
```

**Test Case 3: Error Handling**
```typescript
const mockSignIn = jest.fn().mockRejectedValue({
  code: 'auth/wrong-password'
});

// ... test implementation
expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
```

### Mobile Testing
- [ ] Test form on iPhone SE (375px)
- [ ] Verify keyboard doesn't cover submit button
- [ ] Test autofill behavior (iOS Safari, Chrome)
- [ ] Verify input zoom doesn't trigger (font-size ≥ 16px)

### References
- `docs/admin-portal/admin_portal_style.md` - Tactical Ops components
- `src/services/firebase.service.ts` - Auth functions

---

## Ticket UI-003: Build Mobile Bottom Navigation (Player View)

**Priority:** P1 (Must Have)  
**Story Points:** 2  
**Estimated Time:** 2 hours  
**Dependencies:** None

### Description
Create mobile bottom tab navigation for player view. Should hide when user switches to admin mode. Uses existing player theme (not Tactical Ops).

### Acceptance Criteria
- [ ] Fixed to bottom of screen on mobile (< 768px)
- [ ] 4 tabs: Tasks, Teams, Join, Profile
- [ ] Icons from lucide-react
- [ ] Active tab highlighted
- [ ] Hides when `isAdminMode === true`
- [ ] Hidden on desktop (≥ 768px)
- [ ] Minimum 44px tap targets
- [ ] Smooth transitions

### Implementation

**File:** `src/components/BottomNav.tsx`

```tsx
import { MapPin, Users, Hash, User } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';

interface NavItem {
  icon: any;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: MapPin, label: 'Tasks', path: '/' },
  { icon: Users, label: 'Teams', path: '/browse-teams' },
  { icon: Hash, label: 'Join', path: '/join-code' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const BottomNav = () => {
  const location = useLocation();
  const isAdminMode = useAdminStore(state => state.isAdminMode);

  // Hide in admin mode or on desktop
  if (isAdminMode) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-40 safe-area-inset-bottom">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
                isActive
                  ? 'text-blue-500'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <Icon size={24} />
              <span className="text-[10px] font-bold uppercase tracking-wide mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
```

**File:** `src/App.tsx` - Update

```tsx
import BottomNav from '@/components/BottomNav';
import AdminModeToggle from '@/components/AdminModeToggle';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... routes ... */}
      </Routes>
      
      <BottomNav />
      <AdminModeToggle />
    </BrowserRouter>
  );
}
```

### Testing

**Test Case 1: Renders on Mobile**
```typescript
global.innerWidth = 375;
render(<BottomNav />);

expect(screen.getByText(/tasks/i)).toBeInTheDocument();
expect(screen.getByText(/teams/i)).toBeInTheDocument();
```

**Test Case 2: Hides in Admin Mode**
```typescript
useAdminStore.setState({ isAdminMode: true });

const { container } = render(<BottomNav />);
expect(container.firstChild).toBeNull();
```

**Test Case 3: Active Tab Highlighted**
```typescript
render(<BottomNav />, { initialEntries: ['/browse-teams'] });

const teamsLink = screen.getByText(/teams/i).closest('a');
expect(teamsLink).toHaveClass('text-blue-500');
```

### Mobile Testing
- [ ] Test on iPhone 14 - icons sized correctly
- [ ] Test on Galaxy S23 - labels readable
- [ ] Verify safe area insets (iPhone notch)
- [ ] Test tab switching animations

### References
- Existing player theme colors
- `src/store/adminStore.ts`

---

## Ticket UI-004: Build Admin Sidebar Navigation (Mobile Hamburger)

**Priority:** P1 (Must Have)  
**Story Points:** 3  
**Estimated Time:** 4 hours  
**Dependencies:** UI-001

### Description
Create admin navigation sidebar with hamburger menu for mobile and persistent sidebar for desktop. Uses Tactical Ops theme. Only visible when `isAdminMode === true`.

### Acceptance Criteria
- [ ] Mobile (< 768px): Hamburger menu in top-left
- [ ] Mobile: Side drawer slides in from left
- [ ] Mobile: Overlay closes drawer when clicked
- [ ] Desktop (≥ 768px): Persistent sidebar, always visible
- [ ] 4 nav items: Dashboard, Events, Tasks, Review
- [ ] Active route highlighted
- [ ] Tactical Ops styling applied
- [ ] Hides when `isAdminMode === false`

### Design Specifications

**Mobile Drawer:**
- Width: `w-64` (256px)
- Transform: `translate-x-0` (open), `-translate-x-full` (closed)
- Backdrop: `bg-black/50` overlay
- Transition: `transition-transform duration-300`

**Desktop Sidebar:**
- Width: `w-64`
- Fixed position
- Always visible (no toggle)

**Nav Item (Active):**
- Background: `bg-slate-700/50`
- Border-left: `border-l-4 border-blue-500`
- Text: `text-slate-200`

**Nav Item (Inactive):**
- Background: `transparent`
- Text: `text-slate-400`
- Hover: `hover:bg-slate-700/30`

### Implementation

**File:** `src/features/admin/components/AdminNav.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Calendar, MapPin, CheckCircle, Shield } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  icon: any;
  label: string;
  path: string;
  roles: string[]; // Which roles can see this item
}

const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/admin',
    roles: ['superadmin', 'admin', 'organizer', 'moderator'],
  },
  {
    icon: Calendar,
    label: 'Events',
    path: '/admin/events',
    roles: ['superadmin', 'admin', 'organizer'],
  },
  {
    icon: MapPin,
    label: 'Tasks',
    path: '/admin/tasks',
    roles: ['superadmin', 'admin', 'organizer'],
  },
  {
    icon: CheckCircle,
    label: 'Review',
    path: '/admin/review',
    roles: ['superadmin', 'admin', 'organizer', 'moderator'],
  },
];

const AdminNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isAdminMode = useAdminStore(state => state.isAdminMode);
  const user = useAuthStore(state => state.user);

  // Close drawer on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Hide if not in admin mode
  if (!isAdminMode) return null;

  // Filter nav items based on user role
  const visibleItems = navItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile: Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-800 border border-slate-700 p-3 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X size={24} className="text-slate-200" />
        ) : (
          <Menu size={24} className="text-slate-200" />
        )}
      </button>

      {/* Mobile: Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          aria-hidden="true"
        />
      )}

      {/* Sidebar/Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-[#1e293b] border-r border-slate-700
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-700">
          <Shield size={24} className="text-blue-500 mr-3" />
          <div>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Admin Portal
            </h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              {user?.role || 'Admin'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors
                  ${isActive
                    ? 'bg-slate-700/50 text-slate-200 border-l-4 border-blue-500 pl-3'
                    : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-300'
                  }
                `}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="bg-[#0f172a] border border-slate-700 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
              Logged in as
            </p>
            <p className="text-xs text-slate-300 font-mono truncate">
              {user?.email || 'Unknown'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminNav;
```

**File:** `src/App.tsx` - Update

```tsx
import AdminNav from '@/features/admin/components/AdminNav';

function App() {
  const isAdminMode = useAdminStore(state => state.isAdminMode);

  return (
    <BrowserRouter>
      <AdminNav />
      
      {/* Main content - add left margin when sidebar visible on desktop */}
      <div className={isAdminMode ? 'md:ml-64' : ''}>
        <Routes>
          {/* ... routes ... */}
        </Routes>
      </div>
      
      <BottomNav />
      <AdminModeToggle />
    </BrowserRouter>
  );
}
```

### Testing

**Test Case 1: Sidebar Hidden in Player Mode**
```typescript
useAdminStore.setState({ isAdminMode: false });

const { container } = render(<AdminNav />);
expect(container.firstChild).toBeNull();
```

**Test Case 2: Hamburger Menu Toggles Drawer**
```typescript
useAdminStore.setState({ isAdminMode: true });
render(<AdminNav />);

const menuButton = screen.getByLabelText(/toggle menu/i);
fireEvent.click(menuButton);

const sidebar = screen.getByRole('complementary');
expect(sidebar).toHaveClass('translate-x-0');
```

**Test Case 3: Role-Based Nav Items**
```typescript
useAuthStore.setState({ user: { role: 'moderator', uid: '123' } });
render(<AdminNav />);

// Moderator should see Dashboard and Review, but not Events/Tasks
expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
expect(screen.getByText(/review/i)).toBeInTheDocument();
expect(screen.queryByText(/events/i)).not.toBeInTheDocument();
```

### Mobile Testing
- [ ] Test hamburger menu on iPhone SE
- [ ] Verify drawer slides smoothly
- [ ] Test overlay click closes drawer
- [ ] Verify touch targets ≥ 44px

### References
- `docs/admin-portal/admin_portal_style.md` - Tactical Ops nav patterns

---

## Summary

**Total Story Points:** 10  
**Estimated Time:** 12 hours  
**Critical Path:** UI-001 → UI-004 (admin mode toggle needed for nav)

**Component Dependencies:**
- `AdminModeToggle` (UI-001) → Used by all other components
- `AdminLogin` (UI-002) → Standalone, no dependencies
- `BottomNav` (UI-003) → Checks `isAdminMode` from UI-001
- `AdminNav` (UI-004) → Checks `isAdminMode` from UI-001

**Mobile Testing Priority:**
1. UI-001 (Admin Mode Toggle) - Core navigation mechanism
2. UI-004 (Admin Sidebar) - Primary admin navigation
3. UI-002 (Login Page) - Entry point for admins
4. UI-003 (Bottom Nav) - Player experience

**Integration Points:**
- All components integrate with `useAdminStore` (created by State Manager)
- Login page calls `signInWithEmail` (created by Backend Proxy)
- Nav components check user role from `useAuthStore`

**Next Sprint:** Week 2 - Event Management UI (event list, event detail, event form)
