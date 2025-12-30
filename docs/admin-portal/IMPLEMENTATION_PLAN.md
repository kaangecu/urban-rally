# Role Management System - Implementation Plan

> **Project:** Urban Rally Admin Portal - Multi-Tenant Role Management  
> **Architecture:** Hybrid Expanded User Schema (Scoped RBAC)  
> **Timeline:** 4 weeks (112 hours)  
> **Date:** December 30, 2025

---

## Table of Contents

1. [Development Phases](#development-phases)
2. [User Scenarios & Acceptance Criteria](#user-scenarios--acceptance-criteria)
3. [Testing Plan](#testing-plan)
4. [Coding Agent Guidelines](#coding-agent-guidelines)
5. [Quality Gates](#quality-gates)
6. [Deployment Strategy](#deployment-strategy)

---

## Development Phases

### Phase 1: Foundation & Backend (Week 1 - 32 hours)

#### Milestone 1.1: Schema Definition (8 hours)

**Tasks:**
- [ ] Update `src/types/schema.ts` with Hybrid User schema
- [ ] Add `tenantRoles` map interface
- [ ] Add `pendingInvitations` map interface
- [ ] Mark `managedTenantIds` as deprecated
- [ ] Export `ROLE_HIERARCHY` constant
- [ ] Run type-check validation

**Deliverables:**
```typescript
// src/types/schema.ts
export interface User extends MultiTenantEntity {
  // ... existing fields ...
  
  tenantRoles?: {
    [tenantId: string]: TenantRoleAssignment;
  };
  
  pendingInvitations?: {
    [token: string]: PendingInvitation;
  };
  
  highestRole: 'superadmin' | 'admin' | 'organizer' | 'moderator' | 'player';
  
  /** @deprecated Use tenantRoles instead */
  managedTenantIds?: string[];
}

export const ROLE_HIERARCHY = {
  superadmin: { level: 4, inherits: ['admin', 'organizer', 'moderator'] },
  admin: { level: 3, inherits: ['organizer', 'moderator'] },
  organizer: { level: 2, inherits: ['moderator'] },
  moderator: { level: 1, inherits: [] },
  player: { level: 0, inherits: [] },
} as const;
```

**Testing Checklist:**
- [ ] `npm run type-check` passes
- [ ] No TypeScript errors in existing services
- [ ] Schema exported correctly

---

#### Milestone 1.2: Cloud Functions - Core (16 hours)

**Task Priority Order:**

**1. assignRole (4 hours)**
```typescript
// functions/src/admin/assignRole.ts
export const assignRole = onCall({ cors: true, region: 'europe-west3' }, async (request) => {
  // 1. Validate auth
  // 2. Check permissions (superadmin OR admin in tenantId)
  // 3. Prevent non-superadmin from assigning superadmin
  // 4. Get target user document
  // 5. Update tenantRoles[tenantId]
  // 6. Recalculate highestRole
  // 7. Update Custom Claims
  // 8. Update tenant.adminCount if role is admin
  // 9. Create audit log entry
  // 10. Return success
});
```

**Testing Checklist:**
- [ ] Superadmin can assign any role to any user
- [ ] Admin can assign roles only in their tenant
- [ ] Admin cannot assign superadmin role
- [ ] Cannot assign role without authentication
- [ ] Custom claims updated correctly
- [ ] Audit log created
- [ ] Error handling works (invalid tenantId, user not found)

**2. revokeRole (4 hours)**
```typescript
// functions/src/admin/revokeRole.ts
export const revokeRole = onCall({ cors: true, region: 'europe-west3' }, async (request) => {
  // 1. Validate auth
  // 2. Check permissions
  // 3. Prevent last admin removal
  // 4. Mark role as inactive (soft delete)
  // 5. Recalculate highestRole
  // 6. Update Custom Claims
  // 7. Update tenant.adminCount
  // 8. Create audit log
});
```

**Testing Checklist:**
- [ ] Cannot revoke last admin in tenant
- [ ] Role marked as inactive (not deleted)
- [ ] Custom claims refreshed
- [ ] Audit log shows "revoke" action

**3. inviteUserToTenant (4 hours)**
```typescript
// functions/src/admin/inviteUserToTenant.ts
export const inviteUserToTenant = onCall({ cors: true, region: 'europe-west3' }, async (request) => {
  // 1. Validate auth & permissions
  // 2. Generate secure token (32 bytes)
  // 3. Calculate role expiration
  // 4. Calculate invite expiration (7 days)
  // 5. Find or create user by email
  // 6. Add pendingInvitations[token] to user doc
  // 7. Send email
  // 8. Return magic link
  // 9. Create audit log (action: 'invite_sent')
});
```

**Testing Checklist:**
- [ ] Magic link generated with 32-byte token
- [ ] Existing user gets invitation added to doc
- [ ] New user document created with invitation
- [ ] Email sent successfully
- [ ] Invite expires after 7 days
- [ ] Returns valid invite link

**4. acceptInvitation (4 hours)**
```typescript
// functions/src/admin/acceptInvitation.ts
export const acceptInvitation = onCall({ cors: true }, async (request) => {
  // 1. Find user by pendingInvitations[token]
  // 2. Verify invitation not expired
  // 3. Move invitation to tenantRoles[tenantId]
  // 4. Mark invitation as 'accepted'
  // 5. Create or get Firebase Auth account
  // 6. Update Custom Claims
  // 7. Update tenant.adminCount if role=admin
  // 8. Create audit log (action: 'grant')
  // 9. Generate custom token for auto-login
  // 10. Return success + customToken
});
```

**Testing Checklist:**
- [ ] Token validation works
- [ ] Expired invitations rejected
- [ ] Role moved from pendingInvitations to tenantRoles
- [ ] Firebase Auth account created for new users
- [ ] Custom token enables auto-login
- [ ] Audit log created

---

#### Milestone 1.3: Scheduled Function - Role Expiration (4 hours)

**Task:**
```typescript
// functions/src/scheduled/expireRoles.ts
export const expireRoles = schedule({
  schedule: 'every day 02:00',
  region: 'europe-west3',
  timeZone: 'Europe/Berlin',
}, async () => {
  // 1. Query users with admin/organizer/moderator roles
  // 2. Check each tenantRoles[*].expiresAt
  // 3. Mark expired roles as inactive
  // 4. Recalculate highestRole
  // 5. Create audit log entries
  // 6. Use batched writes (500 per batch)
  // 7. Log expiration count
});
```

**Testing Checklist:**
- [ ] Function triggers at 2 AM Berlin time
- [ ] Expired roles marked as inactive
- [ ] highestRole recalculated correctly
- [ ] Batch writes don't exceed 500 operations
- [ ] Audit logs created for each expiration
- [ ] Logs show count of expired roles

---

#### Milestone 1.4: Firestore Security Rules (4 hours)

**Task:**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSuperadmin() {
      return request.auth != null && request.auth.token.sa == true;
    }
    
    function hasRoleInTenant(tenantId, minRole) {
      let userRole = request.auth.token.tr[tenantId];
      let hierarchy = ['moderator', 'organizer', 'admin'];
      let minIndex = hierarchy.indexOf(minRole);
      let userIndex = hierarchy.indexOf(userRole);
      return userIndex >= minIndex;
    }
    
    match /users/{userId} {
      allow read: if request.auth.uid == userId || isSuperadmin();
      allow write: if false; // Cloud Functions only
    }
    
    match /tenants/{tenantId} {
      allow read: if request.auth != null && (isSuperadmin() || tenantId in request.auth.token.tenantIds);
      allow write: if isSuperadmin();
      allow update: if hasRoleInTenant(tenantId, 'admin');
    }
    
    match /roleAssignments/{assignmentId} {
      allow read: if isSuperadmin() || (request.auth != null && hasRoleInTenant(resource.data.tenantId, 'admin'));
      allow write: if false; // Cloud Functions only
    }
  }
}
```

**Testing Checklist:**
- [ ] Player cannot read other users
- [ ] Admin can read users in their tenants
- [ ] Superadmin can read all users
- [ ] No direct writes allowed to users collection
- [ ] Tenant reads require authentication
- [ ] Audit log reads scoped to tenant admins

---

### Phase 2: Core Admin UI (Week 2 - 32 hours)

#### Milestone 2.1: Admin Store & Context (6 hours)

**Tasks:**
- [ ] Create `src/store/adminStore.ts` with Zustand
- [ ] Add `activeTenantId` state
- [ ] Add `availableTenants` array
- [ ] Implement `switchTenant` action
- [ ] Add localStorage persistence
- [ ] Create `useAdminContext` hook

**Deliverables:**
```typescript
// src/store/adminStore.ts
interface AdminStore {
  activeTenantId: string | null;
  availableTenants: TenantContext[];
  
  setActiveTenant: (tenantId: string) => void;
  switchTenant: (tenantId: string) => void;
  loadAvailableTenants: (userId: string) => Promise<void>;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      activeTenantId: null,
      availableTenants: [],
      
      switchTenant: (tenantId) => {
        set({ activeTenantId: tenantId });
        window.location.reload(); // Prevent state leakage
      },
      
      loadAvailableTenants: async (userId) => {
        const user = await getUser(userId);
        const tenantRoles = user.tenantRoles || {};
        const tenants = await Promise.all(
          Object.keys(tenantRoles)
            .filter(tid => tenantRoles[tid].isActive)
            .map(tid => getTenant(tid))
        );
        set({ availableTenants: tenants });
      },
    }),
    { name: 'admin-context' }
  )
);
```

**Testing Checklist:**
- [ ] Store initializes with null activeTenantId
- [ ] loadAvailableTenants fetches user's tenants
- [ ] switchTenant updates state and reloads page
- [ ] State persists to localStorage
- [ ] State restores on page reload

---

#### Milestone 2.2: Context Switcher Component (6 hours)

**Tasks:**
- [ ] Create `src/features/admin/components/ContextSwitcher.tsx`
- [ ] Add to admin layout navbar
- [ ] Implement dropdown UI (mobile-first)
- [ ] Add tenant logo display
- [ ] Show current role badge
- [ ] Handle loading states

**Deliverables:**
```typescript
// src/features/admin/components/ContextSwitcher.tsx
export function ContextSwitcher() {
  const { activeTenantId, availableTenants, switchTenant } = useAdminStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const activeTenant = availableTenants.find(t => t.id === activeTenantId);
  
  return (
    <div className="relative">
      {/* Button */}
      <button onClick={() => setIsOpen(!isOpen)} className="...">
        <img src={activeTenant?.logoUrl} alt="" className="w-6 h-6 rounded" />
        <span>{activeTenant?.name}</span>
        <ChevronDown />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-lg rounded-lg">
          {availableTenants.map(tenant => (
            <button key={tenant.id} onClick={() => switchTenant(tenant.id)}>
              <img src={tenant.logoUrl} />
              <div>
                <div>{tenant.name}</div>
                <div className="text-xs">{tenant.role}</div>
              </div>
              {activeTenantId === tenant.id && <Check />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Testing Checklist:**
- [ ] Shows current tenant name and logo
- [ ] Dropdown opens on click
- [ ] Lists all available tenants
- [ ] Shows role badge for each tenant
- [ ] Active tenant marked with checkmark
- [ ] Clicking tenant triggers switchTenant
- [ ] Page reloads after switch
- [ ] Mobile responsive (44px tap targets)

---

#### Milestone 2.3: Staff List Component (10 hours)

**Tasks:**
- [ ] Create `src/features/admin/components/StaffList.tsx`
- [ ] Create `src/features/admin/components/StaffCard.tsx`
- [ ] Implement user query (by tenantRoles[activeTenantId])
- [ ] Add role badge display
- [ ] Add "granted by" info
- [ ] Show expiration countdown if applicable
- [ ] Add action menu (change role, remove)
- [ ] Add search/filter functionality
- [ ] Implement loading skeletons

**Deliverables:**
```typescript
// src/features/admin/components/StaffList.tsx
export function StaffList() {
  const { activeTenantId } = useAdminStore();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (!activeTenantId) return;
    
    const q = query(
      collection(db, 'users'),
      where(`tenantRoles.${activeTenantId}.isActive`, '==', true)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaff(users);
      setLoading(false);
    });
    
    return unsubscribe;
  }, [activeTenantId]);
  
  const filteredStaff = staff.filter(user => 
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <input 
        type="search" 
        placeholder="Search staff..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {loading ? (
        <StaffListSkeleton />
      ) : (
        <div className="space-y-3">
          {filteredStaff.map(user => (
            <StaffCard key={user.id} user={user} tenantId={activeTenantId} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Testing Checklist:**
- [ ] Displays all users with active roles in current tenant
- [ ] Real-time updates when roles change
- [ ] Search filters by name and email
- [ ] Loading skeleton shows during fetch
- [ ] Empty state shown when no staff
- [ ] Mobile-friendly card layout
- [ ] Action menu accessible

---

#### Milestone 2.4: Invite Modal Component (10 hours)

**Tasks:**
- [ ] Create `src/features/admin/components/InviteModal.tsx`
- [ ] Add email input with validation
- [ ] Add role selector dropdown
- [ ] Add expiration selector (24h, 48h, 1week, 1month, never)
- [ ] Implement magic link generation
- [ ] Add "Copy Link" button with clipboard API
- [ ] Add toast notifications
- [ ] Add optional email sending
- [ ] Handle loading/error states

**Deliverables:**
```typescript
// src/features/admin/components/InviteModal.tsx
export function InviteModal({ tenantId, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'moderator' | 'organizer' | 'admin'>('moderator');
  const [expiresIn, setExpiresIn] = useState('1week');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const result = await inviteUserToTenant({ email, tenantId, role, expiresIn });
      setInviteLink(result.data.inviteLink);
      toast.success('Invitation link generated!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Invite Team Member</DialogTitle>
      
      <div className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
        >
          <option value="moderator">Moderator</option>
          <option value="organizer">Organizer</option>
          <option value="admin">Admin</option>
        </Select>
        
        <Select
          label="Access expires in"
          value={expiresIn}
          onChange={(e) => setExpiresIn(e.target.value)}
        >
          <option value="24h">24 hours</option>
          <option value="48h">48 hours</option>
          <option value="1week">1 week</option>
          <option value="1month">1 month</option>
          <option value="never">Never</option>
        </Select>
        
        {inviteLink && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <label className="text-sm font-medium">Invitation Link</label>
            <div className="flex gap-2 mt-1">
              <input 
                readOnly 
                value={inviteLink} 
                className="flex-1 px-3 py-2 text-sm"
              />
              <button onClick={handleCopyLink}>
                {copied ? <Check /> : <Copy />}
              </button>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <button onClick={onClose} variant="outline">Cancel</button>
          <button 
            onClick={handleGenerateLink} 
            disabled={!email || loading}
            loading={loading}
          >
            Generate Link
          </button>
        </div>
      </div>
    </Dialog>
  );
}
```

**Testing Checklist:**
- [ ] Email validation works
- [ ] Role selector shows 3 options (moderator/organizer/admin)
- [ ] Expiration selector shows 5 options
- [ ] Generate Link button disabled without email
- [ ] Loading state shown during generation
- [ ] Invite link displayed after generation
- [ ] Copy button copies to clipboard
- [ ] Toast shown on copy
- [ ] Error handling works
- [ ] Modal closes on Cancel

---

### Phase 3: Advanced Features (Week 3 - 24 hours)

#### Milestone 3.1: Audit Log Viewer (8 hours)

**Tasks:**
- [ ] Create `src/features/admin/components/AuditLog.tsx`
- [ ] Implement timeline layout
- [ ] Add date grouping (Today, Yesterday, Last 7 days)
- [ ] Add action icons
- [ ] Add actor/target names
- [ ] Show reason if provided
- [ ] Implement infinite scroll
- [ ] Add filter by action type
- [ ] Add search by user email

**Deliverables:**
```typescript
// src/features/admin/components/AuditLog.tsx
export function AuditLog() {
  const { activeTenantId } = useAdminStore();
  const [logs, setLogs] = useState<RoleAssignment[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const loadMore = async () => {
    if (!activeTenantId || loading || !hasMore) return;
    
    setLoading(true);
    let q = query(
      collection(db, 'roleAssignments'),
      where('tenantId', '==', activeTenantId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(q);
    const newLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    setLogs(prev => [...prev, ...newLogs]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === 20);
    setLoading(false);
  };
  
  useEffect(() => {
    loadMore();
  }, [activeTenantId]);
  
  const groupedLogs = groupByDate(logs);
  
  return (
    <div>
      <h2>Activity Log</h2>
      
      {Object.entries(groupedLogs).map(([date, logs]) => (
        <div key={date}>
          <h3>{date}</h3>
          {logs.map(log => (
            <AuditLogEntry key={log.id} log={log} />
          ))}
        </div>
      ))}
      
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

**Testing Checklist:**
- [ ] Loads first 20 audit logs
- [ ] Grouped by date (Today, Yesterday, etc.)
- [ ] Shows action icon (grant/revoke/modify)
- [ ] Shows actor and target names
- [ ] Shows reason if provided
- [ ] "Load More" button loads next 20
- [ ] Infinite scroll works
- [ ] No logs message shown when empty

---

#### Milestone 3.2: Email Templates (8 hours)

**Tasks:**
- [ ] Create `functions/src/utils/emailTemplates.ts`
- [ ] Design invitation email (new user)
- [ ] Design invitation email (existing user)
- [ ] Design role changed notification
- [ ] Design role revoked notification
- [ ] Design role expired notification
- [ ] Implement template rendering
- [ ] Integrate with SendGrid or Firebase Email
- [ ] Add preview mode for testing

**Deliverables:**
```typescript
// functions/src/utils/emailTemplates.ts
export const emailTemplates = {
  invitation: {
    subject: (tenantName: string) => `You've been invited to ${tenantName}`,
    html: (data: InvitationData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .button { 
            display: inline-block;
            background-color: #4F46E5; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 8px;
            margin: 20px 0;
          }
          .details { background-color: #F3F4F6; padding: 16px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h2>You've been invited to ${data.tenantName}!</h2>
        <p>${data.inviterName} has invited you to join as a <strong>${data.role}</strong>.</p>
        
        <div class="details">
          <strong>Role:</strong> ${data.role}<br>
          <strong>Access expires:</strong> ${data.expiresAt || 'Never'}
        </div>
        
        <a href="${data.inviteLink}" class="button">Accept Invitation</a>
        
        <p><small>Or copy this link: ${data.inviteLink}</small></p>
        <p><small>This invitation expires in 7 days.</small></p>
      </body>
      </html>
    `,
    text: (data: InvitationData) => `
      You've been invited to ${data.tenantName}!
      
      ${data.inviterName} has invited you to join as a ${data.role}.
      
      Accept invitation: ${data.inviteLink}
      
      This invitation expires in 7 days.
    `,
  },
  
  roleChanged: {
    subject: (tenantName: string) => `Your role has been updated in ${tenantName}`,
    html: (data: RoleChangeData) => `
      <!DOCTYPE html>
      <html>
      <body>
        <h2>Your role has been updated</h2>
        <p>${data.changedBy} has changed your role in ${data.tenantName}.</p>
        
        <div class="details">
          <strong>Previous role:</strong> ${data.oldRole || 'None'}<br>
          <strong>New role:</strong> ${data.newRole}<br>
          ${data.reason ? `<strong>Reason:</strong> ${data.reason}` : ''}
        </div>
        
        <p>Your new permissions are now active.</p>
      </body>
      </html>
    `,
  },
  
  // ... other templates
};

export async function sendEmail(to: string, template: keyof typeof emailTemplates, data: any) {
  const { subject, html, text } = emailTemplates[template];
  
  // SendGrid integration
  await sendGridClient.send({
    to,
    from: 'noreply@urbanrally.app',
    subject: typeof subject === 'function' ? subject(data.tenantName) : subject,
    html: html(data),
    text: text ? text(data) : undefined,
  });
}
```

**Testing Checklist:**
- [ ] All 5 templates render correctly
- [ ] Variables substituted properly
- [ ] Links work in email clients
- [ ] Mobile responsive design
- [ ] Plain text version provided
- [ ] Preview mode shows rendered email
- [ ] SendGrid sends successfully
- [ ] Emails arrive in inbox (not spam)

---

#### Milestone 3.3: Mobile Optimizations (8 hours)

**Tasks:**
- [ ] Audit all components on mobile (iOS/Android)
- [ ] Ensure 44px minimum tap targets
- [ ] Fix any layout shift issues
- [ ] Add bottom navigation for admin pages
- [ ] Implement swipe gestures (optional)
- [ ] Optimize bundle size (lazy loading)
- [ ] Run Lighthouse audit (target >90)
- [ ] Test offline functionality

**Testing Checklist:**
- [ ] All buttons/links meet 44px minimum
- [ ] No horizontal scrolling
- [ ] Dropdowns open correctly on mobile
- [ ] Modals use full screen on mobile
- [ ] Forms usable with on-screen keyboard
- [ ] Context switcher works one-handed
- [ ] Staff cards scrollable
- [ ] Lighthouse mobile score >90
- [ ] Works on iOS Safari and Chrome Android

---

### Phase 4: Testing & Launch (Week 4 - 24 hours)

#### Milestone 4.1: E2E Testing (8 hours)

**Tasks:**
- [ ] Create `tests/e2e/admin-role-management.spec.ts`
- [ ] Write test scenarios (see Test Plan section)
- [ ] Set up test data seeding
- [ ] Configure Playwright for emulator
- [ ] Run tests in CI/CD
- [ ] Fix any failing tests
- [ ] Generate test report

**Testing Checklist:**
- [ ] All 10+ test scenarios pass
- [ ] Tests run successfully in CI
- [ ] Test coverage >80%
- [ ] Screenshot comparison tests pass
- [ ] Accessibility tests pass

---

#### Milestone 4.2: Security Audit (8 hours)

**Tasks:**
- [ ] Review Custom Claims implementation
- [ ] Audit Firestore security rules
- [ ] Test privilege escalation scenarios
- [ ] Verify magic link security
- [ ] Check XSS vulnerabilities
- [ ] Test CSRF protection
- [ ] Review rate limiting
- [ ] Penetration testing (basic)

**Security Checklist:**
- [ ] Cannot assign role without proper permissions
- [ ] Cannot access other tenants' data
- [ ] Magic links expire after 7 days
- [ ] Last admin cannot be removed
- [ ] Superadmin cannot remove self if last
- [ ] XSS protection in all inputs
- [ ] CSRF tokens on sensitive actions
- [ ] No sensitive data in client-side logs

---

#### Milestone 4.3: Performance Testing & Documentation (8 hours)

**Tasks:**
- [ ] Run performance tests
- [ ] Optimize slow queries
- [ ] Add database indexes
- [ ] Write user guide
- [ ] Write developer guide
- [ ] Write API documentation
- [ ] Create video tutorials (optional)
- [ ] Prepare launch announcement

**Performance Checklist:**
- [ ] Permission check <100ms
- [ ] Staff list load <500ms
- [ ] Magic link generation <200ms
- [ ] Role assignment <300ms
- [ ] Audit log query <400ms
- [ ] All metrics meet targets

**Documentation Checklist:**
- [ ] User guide complete with screenshots
- [ ] Developer guide with code examples
- [ ] API reference for all functions
- [ ] Migration guide for existing data
- [ ] Troubleshooting section

---

## User Scenarios & Acceptance Criteria

### Scenario 1: Superadmin Creates Tenant & First Admin

**As a** Superadmin  
**I want to** create a new tenant organization and assign the first admin  
**So that** the organization can manage their own events

**Pre-conditions:**
- User is logged in as Superadmin
- No existing tenant with same orgId

**Steps:**
1. Navigate to `/admin/tenants/new`
2. Fill in tenant details (name, orgId, contact email)
3. Enter admin email address
4. Click "Create Tenant"
5. System generates magic link
6. Copy link and send to admin via WhatsApp
7. Admin clicks link
8. Admin auto-logged in and redirected to dashboard

**Acceptance Criteria:**
- [ ] Tenant created in Firestore with unique orgId
- [ ] Admin invitation added to user document
- [ ] Magic link generated and displayed
- [ ] Email sent to admin (optional)
- [ ] Admin can accept invitation and gain access
- [ ] Admin sees correct tenant context
- [ ] Audit log shows tenant creation

**Edge Cases:**
- [ ] Duplicate orgId rejected
- [ ] Invalid email format rejected
- [ ] Expired invitation link shows error
- [ ] Already-accepted invitation cannot be reused

---

### Scenario 2: Admin Invites Organizer via Magic Link

**As an** Admin  
**I want to** invite a volunteer to be an Organizer  
**So that** they can create and manage events

**Pre-conditions:**
- User logged in as Admin
- Has active role in at least one tenant
- Correct tenant selected in context switcher

**Steps:**
1. Navigate to `/admin/staff`
2. Click "Invite Team Member"
3. Enter volunteer email
4. Select "Organizer" role
5. Select "1 week" expiration
6. Click "Generate Link"
7. Click "Copy Link"
8. Share link via WhatsApp
9. Volunteer clicks link
10. Volunteer accepts invitation

**Acceptance Criteria:**
- [ ] Invite modal opens
- [ ] Form validation works (email required)
- [ ] Magic link generated with 32-byte token
- [ ] Link copied to clipboard
- [ ] Toast notification shown
- [ ] Volunteer receives email (optional)
- [ ] Volunteer can click link and accept
- [ ] Role added to volunteer's tenantRoles
- [ ] Role expires after 1 week
- [ ] Audit log shows invitation sent and accepted

**Edge Cases:**
- [ ] Existing user gets invitation added to document
- [ ] New user gets new document created
- [ ] Expired link shows error message
- [ ] Invalid token shows error

---

### Scenario 3: Admin Promotes Organizer to Admin

**As an** Admin  
**I want to** promote an Organizer to Admin  
**So that** they can help manage the team

**Pre-conditions:**
- User logged in as Admin
- Target user has Organizer role in same tenant

**Steps:**
1. Navigate to `/admin/staff`
2. Find user in list
3. Click action menu (three dots)
4. Click "Change Role"
5. Select "Admin"
6. Enter reason: "Needs to manage team"
7. Click "Confirm"

**Acceptance Criteria:**
- [ ] Role change modal opens
- [ ] Current role shown ("Organizer")
- [ ] New role selectable
- [ ] Optional reason field
- [ ] Confirmation required
- [ ] Role updated in Firestore immediately
- [ ] Custom Claims refreshed
- [ ] User sees new permissions on next page load
- [ ] Notification email sent to user
- [ ] Audit log shows role change with reason
- [ ] tenant.adminCount incremented

**Edge Cases:**
- [ ] Cannot demote self if last admin
- [ ] Cannot promote to superadmin (non-superadmin)
- [ ] Network error shows error message and rolls back

---

### Scenario 4: Admin Changes Role Expiration

**As an** Admin  
**I want to** extend a Moderator's expiring role  
**So that** they can continue helping after the event

**Pre-conditions:**
- User logged in as Admin
- Target user has Moderator role expiring in 2 days

**Steps:**
1. Navigate to `/admin/staff`
2. Find user with expiration countdown
3. Click action menu
4. Click "Change Role"
5. Keep role as "Moderator"
6. Change expiration to "1 month"
7. Click "Confirm"

**Acceptance Criteria:**
- [ ] Expiration countdown visible on staff card
- [ ] Can change expiration without changing role
- [ ] New expiresAt date saved to tenantRoles
- [ ] User not interrupted during active session
- [ ] Audit log shows expiration change

---

### Scenario 5: Admin Revokes Role

**As an** Admin  
**I want to** remove a Moderator's access  
**So that** they no longer have permissions after event ends

**Pre-conditions:**
- User logged in as Admin
- Target user has Moderator role
- Target user is not last admin

**Steps:**
1. Navigate to `/admin/staff`
2. Find user in list
3. Click action menu
4. Click "Remove from Organization"
5. Enter reason: "Event ended"
6. Confirm removal

**Acceptance Criteria:**
- [ ] Confirmation modal shown
- [ ] Reason field required
- [ ] Role marked as inactive (not deleted)
- [ ] Custom Claims refreshed
- [ ] User loses access immediately
- [ ] Notification email sent
- [ ] Audit log shows revocation with reason
- [ ] User no longer shown in staff list

**Edge Cases:**
- [ ] Cannot remove last admin
- [ ] Cannot remove self if last admin
- [ ] Error message shown if attempted

---

### Scenario 6: Organizer Tries to Assign Admin Role (Permission Denied)

**As an** Organizer  
**I want to** understand I cannot assign admin roles  
**So that** I know my permission limitations

**Pre-conditions:**
- User logged in as Organizer
- No Admin role in any tenant

**Steps:**
1. Navigate to `/admin/staff`
2. Notice "Invite Team Member" button is disabled or hidden
3. Try to access invite URL directly
4. See permission denied error

**Acceptance Criteria:**
- [ ] Invite button not shown for Organizers
- [ ] Direct URL access blocked
- [ ] Clear error message shown
- [ ] Redirected to dashboard
- [ ] Audit log shows attempted unauthorized action

---

### Scenario 7: Role Expires Automatically

**As a** System  
**I want to** automatically expire roles at scheduled time  
**So that** temporary access is revoked without manual intervention

**Pre-conditions:**
- Moderator role has expiresAt = Yesterday 23:59
- Scheduled function runs at 2 AM

**Steps:**
1. Scheduled function triggers at 2 AM
2. Queries users with expired roles
3. Marks expired roles as inactive
4. Recalculates highestRole
5. Creates audit log entries
6. Logs expiration count

**Acceptance Criteria:**
- [ ] Function runs daily at 2 AM Berlin time
- [ ] Expired roles marked as inactive
- [ ] isActive set to false
- [ ] expiredAt timestamp added
- [ ] highestRole recalculated correctly
- [ ] Audit log created (action: 'revoke', assignerId: 'system')
- [ ] User loses access on next login
- [ ] Custom Claims refreshed (or refreshed on next login)

---

### Scenario 8: User Switches Tenant Context

**As an** Admin with roles in multiple tenants  
**I want to** switch between tenant contexts  
**So that** I can manage different organizations

**Pre-conditions:**
- User has Admin role in ESN Berlin
- User has Organizer role in ESN Munich
- Currently viewing ESN Berlin

**Steps:**
1. Click context switcher in navbar
2. See dropdown with both tenants
3. ESN Berlin marked as active (checkmark)
4. Click "ESN Munich"
5. Page reloads
6. Context switcher now shows "ESN Munich"
7. Staff list shows ESN Munich staff

**Acceptance Criteria:**
- [ ] Context switcher shows current tenant
- [ ] Dropdown lists all user's tenants
- [ ] Active tenant marked with checkmark
- [ ] Role badge shown for each tenant
- [ ] Clicking tenant triggers page reload
- [ ] New context persisted to localStorage
- [ ] All data reflects new tenant context
- [ ] No cross-tenant data leakage

---

### Scenario 9: Last Admin Cannot Remove Self

**As an** Admin (last one in tenant)  
**I want to** be prevented from removing my own admin role  
**So that** the tenant doesn't become orphaned

**Pre-conditions:**
- User is Admin in ESN Berlin
- User is ONLY admin in ESN Berlin (adminCount = 1)

**Steps:**
1. Navigate to `/admin/staff`
2. Find self in list
3. Click action menu
4. Click "Remove from Organization"
5. See error modal

**Acceptance Criteria:**
- [ ] Error modal shown: "Cannot remove last admin"
- [ ] Explanation: "Assign another admin first"
- [ ] List of other users shown with "Promote to Admin" buttons
- [ ] Action blocked at UI level
- [ ] Action blocked at Cloud Function level
- [ ] User remains in staff list
- [ ] No audit log created

---

### Scenario 10: Mobile User Invites Volunteer During Event

**As an** Admin using mobile phone at event venue  
**I want to** quickly invite a volunteer via WhatsApp  
**So that** they can start moderating submissions immediately

**Pre-conditions:**
- User on iOS or Android device
- At event venue with WhatsApp installed
- Volunteer standing next to admin

**Steps:**
1. Open Urban Rally admin portal on mobile
2. Tap "Invite Team Member"
3. Enter volunteer email (on-screen keyboard)
4. Select "Moderator" role
5. Select "24 hours" expiration
6. Tap "Generate Link"
7. Tap "Copy Link"
8. Open WhatsApp
9. Paste link in message
10. Send to volunteer
11. Volunteer taps link
12. Auto-logs in and starts moderating

**Acceptance Criteria:**
- [ ] Modal uses full screen on mobile
- [ ] Form inputs work with on-screen keyboard
- [ ] Tap targets minimum 44px
- [ ] Generate button loading state shown
- [ ] Link copied to clipboard
- [ ] Toast notification shown
- [ ] Easy to switch to WhatsApp and paste
- [ ] Link works on volunteer's mobile device
- [ ] Auto-login works
- [ ] Submission queue loads on mobile

---

## Testing Plan

### Unit Tests (Vitest)

**Location:** `src/__tests__/admin/`

**Test Files:**
- `assignRole.test.ts` - Cloud Function unit tests
- `revokeRole.test.ts` - Cloud Function unit tests
- `inviteUserToTenant.test.ts` - Cloud Function unit tests
- `acceptInvitation.test.ts` - Cloud Function unit tests
- `expireRoles.test.ts` - Scheduled function tests
- `ContextSwitcher.test.tsx` - Component tests
- `StaffList.test.tsx` - Component tests
- `InviteModal.test.tsx` - Component tests

**Example Test:**
```typescript
// src/__tests__/admin/assignRole.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { assignRole } from '../../../functions/src/admin/assignRole';

describe('assignRole Cloud Function', () => {
  beforeEach(() => {
    // Set up emulator
    // Clear test data
  });
  
  it('should allow superadmin to assign any role', async () => {
    const request = {
      auth: { uid: 'superadmin1', token: { sa: true } },
      data: { targetUserId: 'user1', tenantId: 'tenant1', role: 'admin' },
    };
    
    const result = await assignRole(request);
    
    expect(result.success).toBe(true);
    expect(result.newRole).toBe('admin');
  });
  
  it('should prevent non-admin from assigning roles', async () => {
    const request = {
      auth: { uid: 'organizer1', token: { tr: { tenant1: 'organizer' } } },
      data: { targetUserId: 'user1', tenantId: 'tenant1', role: 'moderator' },
    };
    
    await expect(assignRole(request)).rejects.toThrow('permission-denied');
  });
  
  it('should prevent admin from assigning superadmin', async () => {
    const request = {
      auth: { uid: 'admin1', token: { tr: { tenant1: 'admin' } } },
      data: { targetUserId: 'user1', tenantId: 'tenant1', role: 'superadmin' },
    };
    
    await expect(assignRole(request)).rejects.toThrow('permission-denied');
  });
});
```

---

### E2E Tests (Playwright)

**Location:** `tests/e2e/admin-role-management.spec.ts`

**Test Scenarios:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Admin Role Management', () => {
  test.beforeEach(async ({ page }) => {
    // Start emulators
    // Seed test data
    await page.goto('http://localhost:5173');
  });
  
  test('Scenario 1: Superadmin creates tenant and invites first admin', async ({ page }) => {
    // Login as superadmin
    await page.fill('[data-testid="email-input"]', 'superadmin@test.com');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to create tenant
    await page.goto('/admin/tenants/new');
    
    // Fill form
    await page.fill('[data-testid="tenant-name"]', 'Test Organization');
    await page.fill('[data-testid="tenant-orgid"]', 'test-org');
    await page.fill('[data-testid="admin-email"]', 'admin@test.com');
    
    // Submit
    await page.click('[data-testid="create-tenant-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verify magic link shown
    const inviteLink = await page.locator('[data-testid="invite-link"]').inputValue();
    expect(inviteLink).toContain('/invite/accept?token=');
  });
  
  test('Scenario 2: Admin invites organizer via magic link', async ({ page, context }) => {
    // Login as admin
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to staff
    await page.goto('/admin/staff');
    
    // Click invite button
    await page.click('[data-testid="invite-button"]');
    
    // Fill invite form
    await page.fill('[data-testid="invite-email"]', 'organizer@test.com');
    await page.selectOption('[data-testid="invite-role"]', 'organizer');
    await page.selectOption('[data-testid="invite-expiration"]', '1week');
    
    // Generate link
    await page.click('[data-testid="generate-link-button"]');
    
    // Wait for link
    await expect(page.locator('[data-testid="invite-link"]')).toBeVisible();
    const inviteLink = await page.locator('[data-testid="invite-link"]').inputValue();
    
    // Open link in new tab (simulate volunteer)
    const volunteerPage = await context.newPage();
    await volunteerPage.goto(inviteLink);
    
    // Verify acceptance
    await expect(volunteerPage.locator('[data-testid="accept-button"]')).toBeVisible();
    await volunteerPage.click('[data-testid="accept-button"]');
    
    // Verify redirected to dashboard
    await expect(volunteerPage).toHaveURL(/\/admin\/dashboard/);
  });
  
  // ... more test scenarios
});
```

---

### Manual Testing Checklist

**Mobile Testing (iOS Safari & Chrome Android):**
- [ ] Context switcher works with touch
- [ ] Staff list scrolls smoothly
- [ ] Invite modal uses full screen
- [ ] Copy button works
- [ ] Forms work with on-screen keyboard
- [ ] No layout shift issues
- [ ] All tap targets ≥44px

**Browser Compatibility:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Security Testing:**
- [ ] Try assigning role without permission
- [ ] Try accessing other tenant's data
- [ ] Try using expired magic link
- [ ] Try XSS in input fields
- [ ] Try CSRF attack

**Performance Testing:**
- [ ] Measure permission check time
- [ ] Measure staff list load time
- [ ] Measure magic link generation time
- [ ] Check for memory leaks
- [ ] Run Lighthouse audit

---

## Coding Agent Guidelines

### General Principles

1. **Mobile-First Always**
   - Design for 320px width first
   - Use Tailwind responsive classes: `sm:`, `md:`, `lg:`
   - Minimum tap target: 44x44px
   - Test on actual devices, not just Chrome DevTools

2. **Security First**
   - NEVER trust client-side data
   - ALL role checks in Cloud Functions
   - Use Custom Claims for authorization
   - Validate all inputs
   - Sanitize user-provided data

3. **Type Safety**
   - Use TypeScript strictly
   - No `any` types unless absolutely necessary
   - Define interfaces for all data structures
   - Use Zod for runtime validation

4. **Error Handling**
   - Always try-catch async operations
   - Provide user-friendly error messages
   - Log errors with context
   - Show toast notifications for user feedback
   - Implement retry logic for network errors

5. **Performance**
   - Use React.memo for expensive components
   - Implement pagination/infinite scroll
   - Lazy load components
   - Optimize Firestore queries
   - Add database indexes

6. **Accessibility**
   - Use semantic HTML
   - Add ARIA labels
   - Ensure keyboard navigation works
   - Test with screen readers
   - Maintain color contrast ≥4.5:1

---

### Code Patterns to Follow

#### Pattern 1: Cloud Function Structure

```typescript
// functions/src/admin/{functionName}.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../config';

interface RequestData {
  // Define request shape
}

interface ResponseData {
  success: boolean;
  // Define response shape
}

export const functionName = onCall<RequestData, ResponseData>(
  { cors: true, region: 'europe-west3' },
  async (request): Promise<ResponseData> => {
    // 1. Validate authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }
    
    // 2. Validate input
    const { param1, param2 } = request.data;
    if (!param1) {
      throw new HttpsError('invalid-argument', 'param1 is required');
    }
    
    // 3. Check permissions
    const userId = request.auth.uid;
    const userClaims = request.auth.token;
    
    const isSuperadmin = userClaims.sa === true;
    const isAdmin = userClaims.tr?.[tenantId] === 'admin';
    
    if (!isSuperadmin && !isAdmin) {
      throw new HttpsError('permission-denied', 'Insufficient permissions');
    }
    
    try {
      // 4. Perform operation
      const result = await db.collection('...').doc('...').update({
        field: value,
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      // 5. Create audit log
      await db.collection('roleAssignments').add({
        assignerId: userId,
        action: 'grant',
        timestamp: FieldValue.serverTimestamp(),
        // ... other fields
      });
      
      // 6. Return success
      return { success: true, data: result };
      
    } catch (error) {
      console.error('Error in functionName:', error);
      throw new HttpsError('internal', 'Operation failed');
    }
  }
);
```

#### Pattern 2: React Component Structure

```typescript
// src/features/admin/components/{ComponentName}.tsx
import React, { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from '@/utils/toast';

interface ComponentProps {
  // Define props
}

export function ComponentName({ prop1 }: ComponentProps) {
  // 1. Hooks at top
  const { activeTenantId } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 2. Effects
  useEffect(() => {
    if (!activeTenantId) return;
    
    // Load data
    loadData();
  }, [activeTenantId]);
  
  // 3. Event handlers
  const handleAction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await someFunction();
      toast.success('Action completed!');
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 4. Render
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  return (
    <div className="space-y-4">
      {/* Component content */}
    </div>
  );
}
```

#### Pattern 3: Firestore Query with Real-Time Updates

```typescript
// src/hooks/useStaffList.ts
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase.service';
import type { User } from '@/types/schema';

export function useStaffList(tenantId: string | null) {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!tenantId) {
      setStaff([]);
      setLoading(false);
      return;
    }
    
    const q = query(
      collection(db, 'users'),
      where(`tenantRoles.${tenantId}.isActive`, '==', true)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        
        setStaff(users);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading staff:', error);
        setError(error);
        setLoading(false);
      }
    );
    
    return unsubscribe;
  }, [tenantId]);
  
  return { staff, loading, error };
}
```

---

### Common Pitfalls to Avoid

❌ **DON'T:**
- Don't use client-side role checks for security
- Don't trust URL parameters for permissions
- Don't forget to update Custom Claims after role changes
- Don't allow direct Firestore writes (use Cloud Functions)
- Don't forget to create audit logs
- Don't use `any` type
- Don't forget mobile testing

✅ **DO:**
- Use Cloud Functions for all role assignments
- Validate permissions in every function
- Update Custom Claims immediately
- Create detailed audit logs
- Use TypeScript strictly
- Test on real mobile devices
- Handle all error cases

---

### Development Workflow

1. **Pick a task from Phase plan**
2. **Read relevant documentation:**
   - `docs/admin-portal/ROLE_MANAGEMENT_ARCHITECTURE.md`
   - `docs/FIREBASE_EMULATOR_SETUP.md`
   - `.github/copilot-instructions.md`

3. **Set up development environment:**
   ```bash
   # Terminal 1: Start emulators
   firebase emulators:start
   
   # Terminal 2: Start dev server
   npm run dev
   
   # Terminal 3: Run tests in watch mode
   npm test -- --watch
   ```

4. **Implement feature:**
   - Follow code patterns above
   - Write unit tests first (TDD)
   - Use TypeScript strictly
   - Add comments for complex logic

5. **Test implementation:**
   ```bash
   # Run type check
   npm run type-check
   
   # Run unit tests
   npm test
   
   # Run E2E tests
   npm run test:e2e
   
   # Manual testing in browser
   ```

6. **Create PR:**
   - Reference Phase milestone
   - Include testing checklist
   - Add screenshots (mobile + desktop)
   - Request review

---

## Quality Gates

### Gate 1: Code Complete (End of Each Phase)

- [ ] All tasks in phase completed
- [ ] TypeScript type check passes
- [ ] Unit tests pass
- [ ] Code reviewed by peer
- [ ] No console errors in browser
- [ ] Mobile tested on real device

### Gate 2: Feature Complete (End of Phase 3)

- [ ] All user scenarios implemented
- [ ] E2E tests pass
- [ ] Acceptance criteria met
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] Documentation complete

### Gate 3: Production Ready (End of Phase 4)

- [ ] All tests passing in CI
- [ ] Security review complete
- [ ] Performance baseline established
- [ ] Rollback plan documented
- [ ] Launch checklist complete
- [ ] Stakeholder approval obtained

---

## Deployment Strategy

### Staging Deployment (After Phase 3)

1. **Deploy to staging environment:**
   ```bash
   firebase use staging
   firebase deploy --only functions,firestore,hosting
   ```

2. **Run smoke tests:**
   - Superadmin creates tenant
   - Admin invites user
   - User accepts invitation
   - Role expiration job runs

3. **Get stakeholder approval**

### Production Deployment (After Phase 4)

1. **Create backup:**
   ```bash
   # Export Firestore data
   gcloud firestore export gs://backup-bucket/$(date +%Y%m%d)
   ```

2. **Run migration script:**
   ```bash
   npm run migrate:tenant-roles
   ```

3. **Deploy to production:**
   ```bash
   firebase use production
   firebase deploy --only functions,firestore
   # Wait for functions to deploy
   firebase deploy --only hosting
   ```

4. **Monitor for 24 hours:**
   - Check error logs
   - Monitor function execution times
   - Track Firestore read/write costs
   - Review user feedback

5. **Deprecate old fields (3 months later):**
   - Update documentation
   - Remove `managedTenantIds` from UI
   - Archive migration script

---

## Success Metrics

### Week 1 (Foundation)
- ✅ 5 Cloud Functions deployed
- ✅ 100% unit test coverage
- ✅ Security rules tested
- ✅ 0 TypeScript errors

### Week 2 (Core UI)
- ✅ Context switcher functional
- ✅ Staff list real-time updates
- ✅ Invite modal generates links
- ✅ Mobile Lighthouse score >90

### Week 3 (Advanced)
- ✅ Audit log displays history
- ✅ Email templates tested
- ✅ All mobile optimizations done

### Week 4 (Launch)
- ✅ 10+ E2E scenarios passing
- ✅ Security audit complete
- ✅ Documentation published
- ✅ Production deployed

---

## Contact & Support

**Technical Lead:** [Your Name]  
**Slack Channel:** #admin-portal-dev  
**Documentation:** `/docs/admin-portal/`  
**Issue Tracker:** GitHub Issues

---

**Last Updated:** December 30, 2025  
**Version:** 1.0.0
