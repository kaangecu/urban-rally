# Admin Portal Development Plan - Option B

> **Document Type:** Development Implementation Plan  
> **Date:** December 28, 2025  
> **Author:** Lead Project Engineer  
> **Status:** ⏳ Pending Approval  
> **Depends On:** [ADMIN_PORTAL_ARCHITECTURE.md](./ADMIN_PORTAL_ARCHITECTURE.md)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Development Phases](#development-phases)
3. [Coding Agent Roles & Responsibilities](#coding-agent-roles--responsibilities)
4. [User Flow Diagrams](#user-flow-diagrams)
5. [Sprint Breakdown](#sprint-breakdown)
6. [Technical Specifications](#technical-specifications)
7. [Risk Assessment](#risk-assessment)
8. [Questions for Stakeholder Approval](#questions-for-stakeholder-approval)

---

## Project Overview

### Selected Approach
**Option B: Extended Current App** - Adding admin routes to the existing React application with:
- Firebase Custom Claims for role-based access control (RBAC)
- Cloud Functions for all administrative write operations
- Shared component library and design system
- Single deployment artifact

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to Create Event | < 5 minutes | User testing |
| Time to Create Task | < 2 minutes | User testing |
| Admin Page Load Time | < 2 seconds | Lighthouse |
| Bundle Size Increase | < 150KB (gzipped) | Build analysis |
| Cloud Function Latency | < 500ms p95 | Firebase monitoring |

### Deliverables

1. **Phase 1:** Authentication & RBAC system for admin users
2. **Phase 2:** Event management (CRUD) with map bounds configuration
3. **Phase 3:** Task management with GPS picker, quiz builder, photo requirements
4. **Phase 4:** Submission review queue for moderators
5. **Phase 5:** Analytics dashboard and audit logging

---

## Development Phases

### Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT TIMELINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Week 1          Week 2          Week 3          Week 4          Week 5     │
│  ───────         ───────         ───────         ───────         ───────    │
│                                                                              │
│  ┌─────────┐                                                                │
│  │ Phase 1 │  Auth & RBAC                                                   │
│  │ Backend │  Cloud Functions                                               │
│  └────┬────┘                                                                │
│       │                                                                      │
│       ▼     ┌─────────────────┐                                             │
│             │    Phase 2      │  Event Management                           │
│             │  Full Stack     │  UI + Cloud Functions                       │
│             └────────┬────────┘                                             │
│                      │                                                       │
│                      ▼     ┌─────────────────┐                              │
│                            │    Phase 3      │  Task Management             │
│                            │  Full Stack     │  GPS, Quiz, Photo            │
│                            └────────┬────────┘                              │
│                                     │                                        │
│                                     ▼     ┌─────────────────┐               │
│                                           │    Phase 4      │  Submissions  │
│                                           │  Full Stack     │  Review Queue │
│                                           └────────┬────────┘               │
│                                                    │                         │
│                                                    ▼     ┌─────────────┐    │
│                                                          │  Phase 5    │    │
│                                                          │  Polish     │    │
│                                                          └─────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Authentication & RBAC (Week 1)

**Objective:** Enable email/password login for admin users with role-based access

| Task | Owner Agent | Duration | Dependencies |
|------|-------------|----------|--------------|
| Enable email auth in Firebase Console | Manual | 30 min | None |
| Create `setUserRole` Cloud Function | Backend Agent | 4 hrs | None |
| Create `adminUsers` Firestore collection | Backend Agent | 1 hr | None |
| Create admin login page | UI Agent | 4 hrs | None |
| Create `useAdminAuth` hook | State Agent | 3 hrs | Cloud Function |
| Create `AdminRoute` guard component | State Agent | 2 hrs | useAdminAuth |
| Create first superadmin via console | Manual | 30 min | Cloud Function |
| Write security rules for adminUsers | Backend Agent | 2 hrs | None |

**Deliverable:** Admin can log in with email/password and access `/admin` route

---

### Phase 2: Event Management (Week 2)

**Objective:** Enable organizers to create and manage events

| Task | Owner Agent | Duration | Dependencies |
|------|-------------|----------|--------------|
| Create `createEventSecure` Cloud Function | Backend Agent | 3 hrs | Phase 1 |
| Create `updateEventSecure` Cloud Function | Backend Agent | 2 hrs | Phase 1 |
| Create `deleteEventSecure` Cloud Function | Backend Agent | 2 hrs | Phase 1 |
| Create `AdminLayout` component | UI Agent | 3 hrs | None |
| Create `AdminSidebar` navigation | UI Agent | 2 hrs | AdminLayout |
| Create `EventList` page | UI Agent | 4 hrs | None |
| Create `EventForm` component | UI Agent | 6 hrs | None |
| Create `MapBoundsPicker` component | UI Agent | 4 hrs | Leaflet |
| Create `useAdminEvents` hook | State Agent | 3 hrs | Cloud Functions |
| Create `adminStore` Zustand store | State Agent | 2 hrs | None |
| Integration testing | All Agents | 4 hrs | All above |

**Deliverable:** Organizer can create, edit, and delete events with map configuration

---

### Phase 3: Task Management (Week 3)

**Objective:** Enable organizers to create various task types

| Task | Owner Agent | Duration | Dependencies |
|------|-------------|----------|--------------|
| Create `createTaskSecure` Cloud Function | Backend Agent | 4 hrs | Phase 2 |
| Create `updateTaskSecure` Cloud Function | Backend Agent | 2 hrs | Phase 2 |
| Create `deleteTaskSecure` Cloud Function | Backend Agent | 2 hrs | Phase 2 |
| Create `bulkCreateTasks` Cloud Function | Backend Agent | 3 hrs | Phase 2 |
| Create `TaskList` admin page | UI Agent | 4 hrs | None |
| Create `TaskForm` component | UI Agent | 6 hrs | None |
| Create `GPSPicker` component | UI Agent | 4 hrs | Leaflet |
| Create `QuizBuilder` component | UI Agent | 5 hrs | None |
| Create `PhotoRequirements` component | UI Agent | 2 hrs | None |
| Create `TaskTypeSelector` component | UI Agent | 2 hrs | None |
| Create `useAdminTasks` hook | State Agent | 3 hrs | Cloud Functions |
| Add tasks to `adminStore` | State Agent | 1 hr | adminStore |

**Deliverable:** Organizer can create GPS, Quiz, and Photo tasks with full configuration

---

### Phase 4: Submission Review (Week 4)

**Objective:** Enable moderators to review and approve/reject submissions

| Task | Owner Agent | Duration | Dependencies |
|------|-------------|----------|--------------|
| Create `reviewSubmission` Cloud Function | Backend Agent | 4 hrs | Phase 3 |
| Create `getSubmissionsForEvent` Cloud Function | Backend Agent | 3 hrs | Phase 3 |
| Create `SubmissionQueue` page | UI Agent | 5 hrs | None |
| Create `SubmissionCard` component | UI Agent | 3 hrs | None |
| Create `SubmissionDetailModal` component | UI Agent | 4 hrs | None |
| Create `PhotoViewer` component | UI Agent | 2 hrs | None |
| Create `ApprovalActions` component | UI Agent | 2 hrs | None |
| Create `useSubmissions` hook | State Agent | 3 hrs | Cloud Functions |
| Create real-time submission listener | State Agent | 3 hrs | Firestore |

**Deliverable:** Moderator can view pending submissions and approve/reject them

---

### Phase 5: Polish & Launch (Week 5)

**Objective:** Analytics, audit logging, and production hardening

| Task | Owner Agent | Duration | Dependencies |
|------|-------------|----------|--------------|
| Create `AdminDashboard` with stats | UI Agent | 6 hrs | All phases |
| Create `AuditLog` component | UI Agent | 4 hrs | Cloud Function |
| Create `logAdminAction` Cloud Function | Backend Agent | 3 hrs | None |
| Lock down Firestore production rules | Backend Agent | 2 hrs | All phases |
| Add lazy loading for admin routes | State Agent | 2 hrs | All phases |
| Performance optimization | All Agents | 4 hrs | All above |
| E2E testing with Playwright | QA | 8 hrs | All above |
| Documentation updates | All Agents | 4 hrs | All above |

**Deliverable:** Production-ready admin portal with analytics and audit trail

---

## Coding Agent Roles & Responsibilities

### Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGENT ORCHESTRATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                        ┌─────────────────────┐                              │
│                        │   Lead Architect    │                              │
│                        │   (Orchestrator)    │                              │
│                        └──────────┬──────────┘                              │
│                                   │                                          │
│            ┌──────────────────────┼──────────────────────┐                  │
│            │                      │                      │                  │
│            ▼                      ▼                      ▼                  │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐          │
│   │   UI Component  │   │    Backend      │   │  State Manager  │          │
│   │     Builder     │   │    Proxy        │   │     Agent       │          │
│   │                 │   │                 │   │                 │          │
│   │  React/Tailwind │   │  Cloud Funcs    │   │  Zustand/Hooks  │          │
│   │  Forms/Modals   │   │  Firestore      │   │  Context        │          │
│   └────────┬────────┘   └────────┬────────┘   └────────┬────────┘          │
│            │                     │                     │                    │
│            └─────────────────────┼─────────────────────┘                    │
│                                  │                                          │
│                                  ▼                                          │
│                        ┌─────────────────────┐                              │
│                        │    Shared Types     │                              │
│                        │  src/types/schema   │                              │
│                        └─────────────────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Agent 1: UI Component Builder

**Purpose:** Build all admin portal React components with Tailwind CSS styling.

#### System Prompt
```markdown
You are the UI Component Builder for Urban Rally Admin Portal.

## Your Role
Build React components for the admin interface. Focus on:
- Forms for event/task creation
- Data tables and lists
- Modal dialogs
- Map integration (Leaflet)
- Responsive design

## Constraints (STRICT)
1. ❌ NO direct API/Firebase calls - receive data via props or hooks
2. ❌ NO importing from `/services` folder
3. ❌ NO useEffect with data fetching
4. ✅ Use Tailwind CSS utility classes
5. ✅ Support dark mode via CSS variables
6. ✅ Ensure touch-friendly sizing (min 44px tap targets)
7. ✅ Use Framer Motion for animations
8. ✅ Use Lucide icons

## Admin-Specific Patterns
- Admin theme: Use slate/zinc color palette (darker than player UI)
- Forms: Use controlled components with validation
- Tables: Support sorting, filtering, pagination
- Modals: Use portal for z-index isolation
```

#### Responsibilities
| Component Type | Examples | Priority |
|---------------|----------|----------|
| Layout | `AdminLayout`, `AdminSidebar`, `AdminHeader` | P1 |
| Forms | `EventForm`, `TaskForm`, `QuizBuilder` | P1 |
| Data Display | `EventList`, `TaskList`, `SubmissionQueue` | P1 |
| Map Components | `MapBoundsPicker`, `GPSPicker` | P1 |
| Modals | `ConfirmDeleteModal`, `SubmissionDetailModal` | P2 |
| Charts | `EventStatsChart`, `CompletionRateChart` | P3 |

---

### Agent 2: Backend Proxy (Firebase Specialist)

**Purpose:** Build all Cloud Functions and Firestore security rules for admin operations.

#### System Prompt
```markdown
You are the Backend Proxy for Urban Rally Admin Portal.

## Your Role
Build secure Cloud Functions using Firebase Admin SDK. Handle:
- RBAC enforcement via Custom Claims
- Atomic Firestore transactions
- Input validation
- Audit logging
- Error handling

## Constraints (STRICT)
1. ✅ ALL writes MUST go through Cloud Functions (no client writes)
2. ✅ EVERY function checks `request.auth.token.role`
3. ✅ EVERY function validates tenantId access
4. ✅ Use Firestore transactions for multi-document operations
5. ✅ Log all admin actions to `auditLogs` collection
6. ❌ NEVER expose Admin SDK to client
7. ❌ NEVER trust client-provided role/permission data

## RBAC Enforcement Pattern
```typescript
// EVERY Cloud Function must include:
if (!request.auth) {
  throw new HttpsError('unauthenticated', 'Must be logged in');
}

const claims = request.auth.token;
if (!claims.role || !['superadmin', 'admin', 'organizer'].includes(claims.role)) {
  throw new HttpsError('permission-denied', 'Insufficient permissions');
}

if (!claims.tenantIds?.includes(data.tenantId)) {
  throw new HttpsError('permission-denied', 'No access to this tenant');
}
```
```

#### Responsibilities
| Function | Required Role | Purpose |
|----------|--------------|---------|
| `setUserRole` | superadmin | Assign roles to users |
| `createTenantSecure` | superadmin | Create new organization |
| `createEventSecure` | organizer+ | Create event |
| `updateEventSecure` | organizer+ | Modify event |
| `deleteEventSecure` | admin+ | Delete event |
| `createTaskSecure` | organizer+ | Create task |
| `updateTaskSecure` | organizer+ | Modify task |
| `deleteTaskSecure` | organizer+ | Delete task |
| `bulkCreateTasks` | organizer+ | Create multiple tasks |
| `reviewSubmission` | moderator+ | Approve/reject submission |
| `getSubmissionsForEvent` | moderator+ | List pending submissions |
| `logAdminAction` | internal | Record audit entry |

---

### Agent 3: State Manager Agent

**Purpose:** Build Zustand stores, custom hooks, and React Context for admin state management.

#### System Prompt
```markdown
You are the State Manager for Urban Rally Admin Portal.

## Your Role
Manage admin-specific state including:
- Admin authentication state
- Event/task data caching
- Form state management
- Real-time submission updates

## Constraints (STRICT)
1. ✅ Create separate `adminStore` (don't pollute authStore)
2. ✅ Selective subscriptions to prevent re-renders
3. ✅ Custom hooks call Cloud Functions via service layer
4. ✅ Real-time listeners for submission queue
5. ❌ NO business logic in stores
6. ❌ NO direct Firestore calls - use service functions

## Admin State Architecture
```
AdminAuthContext (email auth lifecycle)
    ↓
adminStore (Zustand)
    ├── currentTenant
    ├── events[]
    ├── tasks[]
    ├── submissions[]
    └── auditLogs[]
    ↓
Admin Components
```

## Key Hooks to Create
- `useAdminAuth()` - Email login, role checking
- `useAdminEvents()` - CRUD operations for events
- `useAdminTasks()` - CRUD operations for tasks
- `useSubmissions()` - Real-time submission queue
- `useAuditLog()` - Admin action history
```

#### Responsibilities
| Store/Hook | Purpose | Persistence |
|------------|---------|-------------|
| `adminStore` | Admin-specific global state | Session only |
| `useAdminAuth` | Email auth + role extraction | Via Firebase |
| `useAdminEvents` | Event CRUD with caching | Memory |
| `useAdminTasks` | Task CRUD with caching | Memory |
| `useSubmissions` | Real-time submission queue | Memory |
| `useAuditLog` | Paginated audit entries | Memory |

---

## User Flow Diagrams

### Flow 1: Super Admin Creates Tenant & Assigns Admin

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN: CREATE TENANT FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                           │
│  │ Super Admin  │                                                           │
│  │ logs in via  │                                                           │
│  │ email/pwd    │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                           │
│  │ /admin/      │  Dashboard shows:                                         │
│  │ dashboard    │  - All tenants                                            │
│  │              │  - System stats                                           │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Click "New Tenant"                                                │
│  ┌──────────────┐                                                           │
│  │ /admin/      │  Form fields:                                             │
│  │ tenants/new  │  - Tenant name                                            │
│  │              │  - Primary color                                          │
│  │              │  - Logo upload                                            │
│  │              │  - Contact email                                          │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Submit form                                                       │
│  ┌──────────────┐                                                           │
│  │ Cloud Func:  │  Validates:                                               │
│  │ createTenant │  - Caller is superadmin                                   │
│  │ Secure       │  - Name is unique                                         │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Tenant created                                                    │
│  ┌──────────────┐                                                           │
│  │ /admin/      │  Shows:                                                   │
│  │ tenants/:id  │  - Tenant details                                         │
│  │              │  - "Invite Admin" button                                  │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Click "Invite Admin"                                              │
│  ┌──────────────┐                                                           │
│  │ Invite Modal │  Enter:                                                   │
│  │              │  - Admin email address                                    │
│  │              │  - Role (admin/organizer)                                 │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Send invite                                                       │
│  ┌──────────────┐                                                           │
│  │ Cloud Func:  │  Creates:                                                 │
│  │ inviteAdmin  │  - User with email auth                                   │
│  │              │  - Custom claims {role, tenantIds}                        │
│  │              │  - Sends invite email                                     │
│  └──────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Flow 2: Organizer Creates Event

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ORGANIZER: CREATE EVENT FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                           │
│  │ Organizer    │                                                           │
│  │ logs in via  │                                                           │
│  │ email/pwd    │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Custom claims checked                                             │
│  ┌──────────────┐                                                           │
│  │ Redirect to  │  Based on claims.tenantIds:                               │
│  │ tenant-      │  - Single tenant → auto-select                            │
│  │ specific     │  - Multiple → show selector                               │
│  │ dashboard    │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                           │
│  │ /admin/      │  Shows:                                                   │
│  │ events       │  - Event list for tenant                                  │
│  │              │  - "Create Event" button                                  │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Click "Create Event"                                              │
│  ┌──────────────┐                                                           │
│  │ /admin/      │  STEP 1: Basic Info                                       │
│  │ events/new   │  ┌─────────────────────────────────────┐                  │
│  │              │  │ Event Name: [___________________]  │                  │
│  │              │  │ Event Code: [BERLIN2025________]  │                  │
│  │              │  │ Description: [________________]   │                  │
│  │              │  │ Start Date: [📅 Dec 1, 2025___]   │                  │
│  │              │  │ End Date:   [📅 Dec 31, 2025__]   │                  │
│  │              │  └─────────────────────────────────────┘                  │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Next step                                                         │
│  ┌──────────────┐                                                           │
│  │ STEP 2:      │  Map bounds configuration                                 │
│  │ Map Config   │  ┌─────────────────────────────────────┐                  │
│  │              │  │  [Interactive Leaflet Map]         │                  │
│  │              │  │                                     │                  │
│  │              │  │  Drag corners to set bounds        │                  │
│  │              │  │  ┌───┐               ┌───┐         │                  │
│  │              │  │  │ NW │───────────────│ NE │         │                  │
│  │              │  │  └───┘               └───┘         │                  │
│  │              │  │    │                   │           │                  │
│  │              │  │  ┌───┐               ┌───┐         │                  │
│  │              │  │  │ SW │───────────────│ SE │         │                  │
│  │              │  │  └───┘               └───┘         │                  │
│  │              │  └─────────────────────────────────────┘                  │
│  │              │  Center: [52.520, 13.405]                                 │
│  │              │  Zoom: [13]                                               │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Next step                                                         │
│  ┌──────────────┐                                                           │
│  │ STEP 3:      │  Team settings                                            │
│  │ Settings     │  ┌─────────────────────────────────────┐                  │
│  │              │  │ Max Teams: [100__]                  │                  │
│  │              │  │ Max Team Size: [4__]                │                  │
│  │              │  │ [ ] Auto-approve submissions        │                  │
│  │              │  │ [x] Allow late submissions          │                  │
│  │              │  └─────────────────────────────────────┘                  │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Submit                                                            │
│  ┌──────────────┐                                                           │
│  │ Cloud Func:  │  Validates:                                               │
│  │ createEvent  │  - Caller has organizer+ role                             │
│  │ Secure       │  - tenantId in caller's tenantIds                         │
│  │              │  - Event code is unique                                   │
│  │              │  - Dates are valid                                        │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Event created                                                     │
│  ┌──────────────┐                                                           │
│  │ /admin/      │  Redirect to event detail                                 │
│  │ events/:id   │  Shows "Add Tasks" CTA                                    │
│  └──────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Flow 3: Organizer Creates Task

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ORGANIZER: CREATE TASK FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                           │
│  │ /admin/      │  Event detail page                                        │
│  │ events/:id   │  Shows existing tasks                                     │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Click "Add Task"                                                  │
│  ┌──────────────┐                                                           │
│  │ Task Type    │  ┌─────────────────────────────────────┐                  │
│  │ Selector     │  │ Select task type:                   │                  │
│  │              │  │                                     │                  │
│  │              │  │  ┌───────┐  ┌───────┐  ┌───────┐   │                  │
│  │              │  │  │  📍   │  │  📷   │  │  ❓   │   │                  │
│  │              │  │  │  GPS  │  │ Photo │  │ Quiz  │   │                  │
│  │              │  │  └───────┘  └───────┘  └───────┘   │                  │
│  │              │  │                                     │                  │
│  │              │  │  ┌───────┐  ┌───────┐  ┌───────┐   │                  │
│  │              │  │  │  🎥   │  │  📱   │  │  ⭐   │   │                  │
│  │              │  │  │ Video │  │  QR   │  │Sponsor│   │                  │
│  │              │  │  └───────┘  └───────┘  └───────┘   │                  │
│  │              │  └─────────────────────────────────────┘                  │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Select "GPS"                                                      │
│  ┌──────────────┐                                                           │
│  │ GPS Task     │  ┌─────────────────────────────────────┐                  │
│  │ Form         │  │ Title: [Find the Brandenburg Gate_] │                  │
│  │              │  │ Description: [Walk to the iconic..] │                  │
│  │              │  │ Points: [100_]  Difficulty: [Medium]│                  │
│  │              │  └─────────────────────────────────────┘                  │
│  │              │                                                           │
│  │              │  ┌─────────────────────────────────────┐                  │
│  │              │  │ [Interactive Map - Click to place] │                  │
│  │              │  │                                     │                  │
│  │              │  │            📍 ← Draggable marker   │                  │
│  │              │  │                                     │                  │
│  │              │  └─────────────────────────────────────┘                  │
│  │              │  Lat: [52.5163] Lng: [13.3777]                            │
│  │              │  Radius: [50m] ← Acceptance radius                        │
│  │              │                                                           │
│  │              │  [x] Requires photo proof                                 │
│  │              │  [ ] Requires text answer                                 │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Select "Quiz"                                                     │
│  ┌──────────────┐                                                           │
│  │ Quiz Task    │  ┌─────────────────────────────────────┐                  │
│  │ Form         │  │ Title: [Berlin History Quiz______] │                  │
│  │              │  │ Question: [When was the Wall built?]│                  │
│  │              │  │ Points: [50__]  Difficulty: [Easy] │                  │
│  │              │  └─────────────────────────────────────┘                  │
│  │              │                                                           │
│  │              │  Quiz Type: (•) Multiple Choice ( ) Text                  │
│  │              │                                                           │
│  │              │  ┌─────────────────────────────────────┐                  │
│  │              │  │ Options:                            │                  │
│  │              │  │ [A] [1961___] ← ✓ Correct          │                  │
│  │              │  │ [B] [1945___]                       │                  │
│  │              │  │ [C] [1989___]                       │                  │
│  │              │  │ [D] [1972___]                       │                  │
│  │              │  │                                     │                  │
│  │              │  │ [+ Add Option]                      │                  │
│  │              │  └─────────────────────────────────────┘                  │
│  │              │                                                           │
│  │              │  Hint (optional): [Think post-WWII...] │                  │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Submit                                                            │
│  ┌──────────────┐                                                           │
│  │ Cloud Func:  │  Validates:                                               │
│  │ createTask   │  - Caller has organizer+ role                             │
│  │ Secure       │  - Event belongs to tenant                                │
│  │              │  - Task type-specific validation                          │
│  │              │  - Coordinates within map bounds                          │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Task created                                                      │
│  ┌──────────────┐                                                           │
│  │ Task List    │  Updated list with new task                               │
│  │ Updated      │  Option to add more tasks                                 │
│  └──────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Flow 4: Moderator Reviews Submission

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODERATOR: REVIEW SUBMISSION FLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                           │
│  │ Moderator    │                                                           │
│  │ logs in via  │                                                           │
│  │ email/pwd    │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                           │
│  │ /admin/      │  Shows:                                                   │
│  │ submissions  │  - Pending count badge (🔴 12)                            │
│  │              │  - Filter by event                                        │
│  │              │  - Sort by oldest first                                   │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │ SUBMISSION QUEUE                                              │           │
│  │ ┌──────────────────────────────────────────────────────────┐ │           │
│  │ │ 📷 Team "City Explorers"                                  │ │           │
│  │ │ Task: "Find a Red Door"                                   │ │           │
│  │ │ Submitted: 5 minutes ago                                  │ │           │
│  │ │ ┌─────────┐                                               │ │           │
│  │ │ │ [Photo] │ ← Thumbnail                                   │ │           │
│  │ │ └─────────┘                                               │ │           │
│  │ │        [👁️ Review]  [✅ Quick Approve]  [❌ Reject]       │ │           │
│  │ └──────────────────────────────────────────────────────────┘ │           │
│  │ ┌──────────────────────────────────────────────────────────┐ │           │
│  │ │ ❓ Team "Quiz Masters"                                    │ │           │
│  │ │ Task: "Berlin History Quiz"                               │ │           │
│  │ │ Submitted: 12 minutes ago                                 │ │           │
│  │ │ Answer: "1961" ✓ (Auto-scored: CORRECT)                   │ │           │
│  │ │        [Auto-approved - No action needed]                 │ │           │
│  │ └──────────────────────────────────────────────────────────┘ │           │
│  └──────────────────────────────────────────────────────────────┘           │
│         │                                                                    │
│         ▼ Click "Review"                                                    │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │ SUBMISSION DETAIL MODAL                                       │           │
│  │ ┌──────────────────────────────────────────────────────────┐ │           │
│  │ │ Task: "Find a Red Door"                                   │ │           │
│  │ │ Team: "City Explorers" (3 members)                        │ │           │
│  │ │ Submitted by: "John Doe" at 14:32                         │ │           │
│  │ │                                                           │ │           │
│  │ │ ┌───────────────────────────────────────────────────────┐│ │           │
│  │ │ │                                                       ││ │           │
│  │ │ │            [Full-size Photo]                          ││ │           │
│  │ │ │                                                       ││ │           │
│  │ │ └───────────────────────────────────────────────────────┘│ │           │
│  │ │                                                           │ │           │
│  │ │ GPS Location: 52.5163, 13.3777 (within radius ✓)          │ │           │
│  │ │                                                           │ │           │
│  │ │ Rejection Reason (optional):                              │ │           │
│  │ │ [Photo doesn't show a red door________________]           │ │           │
│  │ │                                                           │ │           │
│  │ │ Points to Award: [50__] (default: 50)                     │ │           │
│  │ │                                                           │ │           │
│  │ │        [✅ Approve (+50 pts)]    [❌ Reject]              │ │           │
│  │ └──────────────────────────────────────────────────────────┘ │           │
│  └──────────────────────────────────────────────────────────────┘           │
│         │                                                                    │
│         ▼ Click "Approve"                                                   │
│  ┌──────────────┐                                                           │
│  │ Cloud Func:  │  Actions:                                                 │
│  │ reviewSub    │  1. Update submission status → 'approved'                 │
│  │ mission      │  2. Add points to team score                              │
│  │              │  3. Add taskId to team.completedTaskIds                   │
│  │              │  4. Update user stats                                     │
│  │              │  5. Log audit entry                                       │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼ Real-time update                                                  │
│  ┌──────────────┐                                                           │
│  │ Queue        │  Submission removed from queue                            │
│  │ Updated      │  Next submission auto-focused                             │
│  └──────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sprint Breakdown

### Sprint 1 (Week 1): Foundation

| Story Points | Task | Agent | Acceptance Criteria |
|-------------|------|-------|---------------------|
| 3 | Enable email/password auth | Manual | Firebase Console configured |
| 5 | Create `setUserRole` function | Backend | Role assigned via Custom Claims |
| 3 | Create `adminUsers` collection + rules | Backend | Security rules tested |
| 5 | Build admin login page | UI | Email/password form works |
| 5 | Create `useAdminAuth` hook | State | Returns role from claims |
| 3 | Create `AdminRoute` guard | State | Redirects unauthorized users |
| **24** | **Total** | | |

### Sprint 2 (Week 2): Events

| Story Points | Task | Agent | Acceptance Criteria |
|-------------|------|-------|---------------------|
| 5 | Create event CRUD functions | Backend | Create/update/delete work |
| 5 | Build `AdminLayout` + sidebar | UI | Navigation functional |
| 8 | Build `EventForm` with validation | UI | All fields validated |
| 5 | Build `MapBoundsPicker` | UI | Draggable bounds work |
| 5 | Create `useAdminEvents` hook | State | CRUD operations cached |
| **28** | **Total** | | |

### Sprint 3 (Week 3): Tasks

| Story Points | Task | Agent | Acceptance Criteria |
|-------------|------|-------|---------------------|
| 8 | Create task CRUD + bulk functions | Backend | All task types supported |
| 8 | Build `TaskForm` with type switching | UI | GPS/Quiz/Photo forms work |
| 5 | Build `GPSPicker` with radius | UI | Marker draggable, radius shown |
| 5 | Build `QuizBuilder` | UI | Add/remove options works |
| 3 | Create `useAdminTasks` hook | State | Tasks linked to events |
| **29** | **Total** | | |

### Sprint 4 (Week 4): Submissions

| Story Points | Task | Agent | Acceptance Criteria |
|-------------|------|-------|---------------------|
| 5 | Create `reviewSubmission` function | Backend | Approve/reject updates DB |
| 5 | Build `SubmissionQueue` page | UI | Real-time updates work |
| 5 | Build `SubmissionDetailModal` | UI | Photo viewer, GPS map |
| 3 | Build `ApprovalActions` component | UI | Quick approve/reject |
| 5 | Create `useSubmissions` hook | State | Real-time listener |
| **23** | **Total** | | |

### Sprint 5 (Week 5): Polish

| Story Points | Task | Agent | Acceptance Criteria |
|-------------|------|-------|---------------------|
| 5 | Build `AdminDashboard` with stats | UI | Charts render correctly |
| 3 | Create audit logging function | Backend | All actions logged |
| 3 | Lock down Firestore rules | Backend | Client writes rejected |
| 3 | Add lazy loading for admin routes | State | Bundle size reduced |
| 5 | E2E tests for admin flows | QA | 90%+ coverage |
| **19** | **Total** | | |

---

## Technical Specifications

### New File Structure

```
src/
├── features/
│   └── admin/                          # NEW: Admin portal feature
│       ├── components/
│       │   ├── AdminLayout.tsx
│       │   ├── AdminSidebar.tsx
│       │   ├── AdminHeader.tsx
│       │   ├── EventForm.tsx
│       │   ├── TaskForm.tsx
│       │   ├── TaskTypeSelector.tsx
│       │   ├── MapBoundsPicker.tsx
│       │   ├── GPSPicker.tsx
│       │   ├── QuizBuilder.tsx
│       │   ├── SubmissionCard.tsx
│       │   ├── SubmissionDetailModal.tsx
│       │   └── ApprovalActions.tsx
│       ├── pages/
│       │   ├── AdminDashboard.tsx
│       │   ├── AdminLogin.tsx
│       │   ├── EventList.tsx
│       │   ├── EventDetail.tsx
│       │   ├── EventCreate.tsx
│       │   ├── TaskList.tsx
│       │   ├── TaskCreate.tsx
│       │   ├── SubmissionQueue.tsx
│       │   └── AuditLog.tsx
│       ├── hooks/
│       │   ├── useAdminAuth.ts
│       │   ├── useAdminEvents.ts
│       │   ├── useAdminTasks.ts
│       │   └── useSubmissions.ts
│       └── services/
│           └── admin.service.ts        # Cloud Function wrappers
│
├── store/
│   └── adminStore.ts                   # NEW: Admin-specific state
│
├── contexts/
│   └── AdminAuthContext.tsx            # NEW: Admin auth lifecycle
│
└── types/
    └── admin.types.ts                  # NEW: Admin-specific types

functions/src/
├── index.ts                            # Add new exports
├── admin/                              # NEW: Admin Cloud Functions
│   ├── setUserRole.ts
│   ├── createTenantSecure.ts
│   ├── createEventSecure.ts
│   ├── updateEventSecure.ts
│   ├── deleteEventSecure.ts
│   ├── createTaskSecure.ts
│   ├── updateTaskSecure.ts
│   ├── deleteTaskSecure.ts
│   ├── bulkCreateTasks.ts
│   ├── reviewSubmission.ts
│   ├── getSubmissionsForEvent.ts
│   └── logAdminAction.ts
└── utils/
    ├── rbac.ts                         # NEW: Role check utilities
    └── audit.ts                        # NEW: Audit logging utilities
```

### Route Configuration

```typescript
// Add to AppRoutes.tsx

// Admin Routes (Protected by AdminRoute guard)
<Route path="/admin" element={<AdminRoute requiredRole="moderator" />}>
  <Route index element={<AdminDashboard />} />
  <Route path="login" element={<AdminLogin />} />
  
  {/* Event Management - organizer+ */}
  <Route path="events" element={<AdminRoute requiredRole="organizer"><EventList /></AdminRoute>} />
  <Route path="events/new" element={<AdminRoute requiredRole="organizer"><EventCreate /></AdminRoute>} />
  <Route path="events/:eventId" element={<AdminRoute requiredRole="organizer"><EventDetail /></AdminRoute>} />
  
  {/* Task Management - organizer+ */}
  <Route path="events/:eventId/tasks" element={<AdminRoute requiredRole="organizer"><TaskList /></AdminRoute>} />
  <Route path="events/:eventId/tasks/new" element={<AdminRoute requiredRole="organizer"><TaskCreate /></AdminRoute>} />
  
  {/* Submission Review - moderator+ */}
  <Route path="submissions" element={<AdminRoute requiredRole="moderator"><SubmissionQueue /></AdminRoute>} />
  
  {/* User Management - admin+ */}
  <Route path="users" element={<AdminRoute requiredRole="admin"><AdminUserList /></AdminRoute>} />
  
  {/* Tenant Management - superadmin only */}
  <Route path="tenants" element={<AdminRoute requiredRole="superadmin"><TenantList /></AdminRoute>} />
  <Route path="tenants/new" element={<AdminRoute requiredRole="superadmin"><TenantCreate /></AdminRoute>} />
  
  {/* Audit Log - admin+ */}
  <Route path="audit" element={<AdminRoute requiredRole="admin"><AuditLog /></AdminRoute>} />
</Route>
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Bundle size exceeds 150KB | Medium | Low | Lazy loading admin routes |
| Custom Claims not syncing | Low | High | Force token refresh after role change |
| Map picker performance | Medium | Medium | Debounce drag events |
| Submission queue overwhelmed | Low | Medium | Pagination + real-time filters |
| Admin accidentally deletes event | Medium | High | Soft delete with 30-day recovery |

---

## Questions for Stakeholder Approval

> **Please review the following questions and provide your preferences. My recommendations are marked with ⭐.**

### Q1: Admin Theme

**Should the admin portal use the same theme as the player app, or a distinct "admin" theme?**

| Option | Description |
|--------|-------------|
| A. Same theme | Reuse player theme (cyberpunk/light toggle) |
| B. ⭐ Distinct admin theme | Dark slate/zinc professional look (always dark) |
| C. Tenant-branded | Each tenant gets their own admin color scheme |

**Recommendation:** Option B - A distinct dark professional theme helps admins mentally separate "work mode" from "player mode" and reduces cognitive load.

---

### Q2: Submission Auto-Approval

**Should certain task types be auto-approved?**

| Option | Description |
|--------|-------------|
| A. All manual | Every submission requires moderator review |
| B. ⭐ Quiz auto-approve | Quiz answers checked automatically, photos need review |
| C. GPS auto-approve | GPS within radius auto-approved, photos need review |
| D. Full auto-approve | Only flag suspicious submissions |

**Recommendation:** Option B - Quiz answers have objective correct/incorrect answers. GPS-only tasks are also low-risk. Photo/video submissions should require human review for quality.

---

### Q3: Bulk Task Import

**Should we support bulk task import from CSV/Excel?**

| Option | Description |
|--------|-------------|
| A. No | Manual creation only (faster to build) |
| B. ⭐ CSV import | Upload CSV with tasks (title, description, type, points, coordinates) |
| C. Excel template | Provide downloadable Excel template with validation |

**Recommendation:** Option B - Many organizers already have task lists in spreadsheets. CSV import saves significant time for events with 50+ tasks. Can be Phase 2 enhancement.

---

### Q4: Event Code Generation

**How should event codes be generated?**

| Option | Description |
|--------|-------------|
| A. Manual only | Organizer types code (e.g., "BERLIN2025") |
| B. ⭐ Auto-suggest | System suggests code based on event name, editable |
| C. Random | System generates random 8-char code |

**Recommendation:** Option B - Auto-suggest like "BERLIN-WINTER25" is memorable and human-friendly. Organizer can customize if needed.

---

### Q5: Audit Log Retention

**How long should audit logs be retained?**

| Option | Description | Storage Cost |
|--------|-------------|--------------|
| A. 30 days | Short retention | Minimal |
| B. ⭐ 90 days | Medium retention | Low |
| C. 1 year | Long retention | Medium |
| D. Forever | No deletion | High |

**Recommendation:** Option B - 90 days covers most event cycles and provides enough history for troubleshooting without excessive storage costs.

---

### Q6: First Super Admin Setup

**How should the first super admin be created?**

| Option | Description |
|--------|-------------|
| A. ⭐ Firebase Console | Manually create user in Firebase Console, set claims via script |
| B. Environment variable | Read admin email from .env, auto-create on deploy |
| C. Setup wizard | First visitor to /admin/setup becomes super admin |

**Recommendation:** Option A - Most secure. Super admin creation is a one-time operation and shouldn't be automated. Using Firebase Console ensures only project owners can create the first admin.

---

### Q7: Mobile Admin Experience

**What level of mobile support for admin portal?**

| Option | Description |
|--------|-------------|
| A. Desktop only | Admin portal requires minimum 1024px width |
| B. ⭐ Responsive | Works on tablet (768px+), limited phone support |
| C. Full mobile | Fully responsive including phone layouts |

**Recommendation:** Option B - Key features like submission review work well on tablets for on-the-go moderation. Complex forms (event/task creation) are better on larger screens.

---

### Q8: Team Creation

**Can organizers pre-create teams, or only players?**

| Option | Description |
|--------|-------------|
| A. Players only | Teams created when players join with code |
| B. ⭐ Organizer can pre-create | Organizer creates teams + codes, shares codes to captains |
| C. Both | Either flow works |

**Recommendation:** Option B - Pre-creating teams allows organizers to control team names and distribute codes at registration events. Important for structured events like university orientations.

---

### Q9: Development Priority

**If we need to cut scope, which features should be deprioritized?**

| Feature | My Priority | Your Priority |
|---------|-------------|---------------|
| Event CRUD | P1 (Must have) | ___ |
| Task CRUD | P1 (Must have) | ___ |
| Submission Review | P1 (Must have) | ___ |
| Admin Dashboard Stats | P2 (Should have) | ___ |
| Audit Logging | P2 (Should have) | ___ |
| Bulk Task Import | P3 (Nice to have) | ___ |
| Team Pre-Creation | P3 (Nice to have) | ___ |

---

### Q10: Timeline Flexibility

**What is the deadline flexibility?**

| Option | Description |
|--------|-------------|
| A. Fixed 5 weeks | Must deliver all features by deadline |
| B. ⭐ Core by 5 weeks | Core features (P1) by week 5, P2/P3 follow in week 6-7 |
| C. Flexible | Launch when ready, no hard deadline |

**Recommendation:** Option B - Deliver a working MVP with event/task/submission management in 5 weeks. Polish features like analytics and bulk import can follow.

---

---

## 10. Stakeholder Decisions (✅ APPROVED)

All decisions confirmed. Implementation proceeds with updated requirements.

### ✅ Q1: Admin Theme - APPROVED
**Decision:** Distinct dark professional "Tactical Ops" theme (Option B).

**Implementation:**
- **Styling Guide:** Follow `docs/admin-portal/admin_portal_style.md` specifications
- **Color Palette:**
  - Main Background: `#0f172a` (Slate-900) - blue-tinted dark
  - Surfaces: `#1e293b` (Slate-800) - cards, sidebars
  - Borders: Slate-700 - 1px solid borders (no shadows)
  - Text: Slate-200 body, Slate-500 muted labels
  - Status: Emerald-500 (active), Red-500 (rejected), Orange-400 (pending)
  - Actions: Blue-600 primary buttons
- **Typography:**
  - UI Labels: Sans-serif, uppercase, `tracking-widest`
  - Data/IDs: Monospace (JetBrains Mono/Roboto Mono) for timestamps, scores, coordinates
- **Components:**
  - Tactical cards: Solid slate-800 bg, 1px slate-700 border, rounded-xl
  - Status indicators: Colored dots + text badges
  - Dense data tables: Tight padding, monospace numbers, hover highlights
  - "Kill switch" buttons: Uppercase, bold, no shadows
- **Design Philosophy:** Mission control aesthetic - high data density, zero fluff, borders over shadows

---

### ✅ Q2: Auto-Approval - APPROVED
**Decision:** Quiz task submissions auto-approve on exact answer match (Option B).

**Implementation:**
- Add `autoApprove: boolean` field to `Task` schema (true for Quiz, false for Photo/GPS)
- Cloud Function `submitTaskSecure` logic:
  ```typescript
  if (task.type === 'quiz' && task.autoApprove) {
    const isCorrect = submission.answer.toLowerCase().trim() === task.quizAnswer.toLowerCase().trim();
    submission.status = isCorrect ? 'approved' : 'pending';
  } else {
    submission.status = 'pending'; // Photo/GPS always need review
  }
  ```
- Wrong quiz answers still appear in moderator queue for manual review

---

### ⏳ Q3: Bulk Import - DEFERRED
**Decision:** CSV import for tasks will be built in future phase (not MVP).

**MVP Scope:** Manual task creation only via form UI.

**Future Enhancement:** Add CSV upload in Phase 2 if organizers request it for large events (50+ tasks).

---

### ✅ Q4: Event Codes - APPROVED
**Decision:** Auto-suggest event codes based on event name with override option (Option B).

**Implementation:**
- Helper function: `generateEventCode(eventName: string): string`
- Logic: Extract capitalized letters + year
  - Example: "City Explorer 2025" → "CE2025"
  - Example: "Berlin Winter Hunt" → "BWH2025"
- UI: Pre-fill input field, organizer can edit before saving
- Validation: Check uniqueness in `events` collection, show error if duplicate

---

### ✅ Q5: Audit Retention - APPROVED
**Decision:** 90-day audit log retention (Option B).

**Implementation:**
- Cloud Scheduler job (weekly): `cleanupOldAuditLogs()`
- Query: `where('timestamp', '<', Date.now() - 90 days)` → batch delete
- Estimated cost: ~$0.50/month for 10k logs
- Retention period configurable in `firebase-functions.config`

---

### ✅ Q6: First Admin Setup - GUIDED MANUAL SETUP
**Decision:** Firebase Console manual setup with agent-provided step-by-step guide (Option A).

**Agent Deliverable:** Create `docs/admin-portal/FIRST_ADMIN_SETUP_GUIDE.md` during Week 1 with instructions:
1. Enable email/password auth in Firebase Console
2. Create first user manually in Authentication tab
3. Open Cloud Functions logs, find `createUserDocument` call
4. Run `setUserRole({uid: '[UID]', role: 'superadmin'})` via Firebase Console
5. Verify custom claims set with `firebase.auth().currentUser.getIdTokenResult()`
6. Login to admin portal at `/admin/login`

**Security Rationale:** Super admin creation is a one-time operation requiring project owner access.

---

### ✅ Q7: Mobile Support - MOBILE-FIRST (CRITICAL UPDATE)
**Decision:** **MOBILE-FIRST DESIGN** - Most admins/moderators will use mobile devices (phones/tablets).

**Requirements:**
- **Primary Target:** Mobile devices (375px - 768px)
- **Secondary Support:** Tablets (768px+) and desktop (1024px+)
- **Development Approach:**
  - Start with mobile layout using Tailwind base classes
  - Use `md:` breakpoint (768px) for tablet optimizations
  - Use `lg:` breakpoint (1024px) for desktop enhancements
- **Touch Targets:** Minimum 44px height/width for buttons and tap areas
- **Key Patterns:**
  - **Forms:** Stack vertically on mobile, 2-column grid on tablet
  - **Tables:** Card layout on mobile, switch to table on `md:` breakpoint
  - **Navigation:** Bottom tab bar on mobile, sidebar on tablet/desktop
  - **Maps:** Full-screen map on mobile, side-by-side picker on desktop
  - **Modals:** Full-screen on mobile, centered dialog on tablet+
- **Testing Strategy:**
  - Chrome DevTools mobile emulation (iPhone SE, iPhone 14, Galaxy S23)
  - Real device testing on iOS Safari and Android Chrome
  - Test submission review flow on actual mobile devices

**Component Examples:**

*Mobile Task Review Card:*
```tsx
<div class="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
  <img src={submission.photoUrl} class="w-full h-48 object-cover rounded-lg mb-3" />
  <h3 class="text-sm font-bold text-slate-200 mb-2">{task.title}</h3>
  <div class="flex gap-2">
    <button class="flex-1 bg-emerald-500 text-white py-3 px-4 rounded-lg text-sm font-bold">
      Approve
    </button>
    <button class="flex-1 bg-red-500/10 border border-red-500/50 text-red-500 py-3 px-4 rounded-lg text-sm font-bold">
      Reject
    </button>
  </div>
</div>
```

*Desktop/Tablet Table (md: breakpoint):*
```tsx
<div class="hidden md:block">
  <table class="w-full text-sm">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

---

### ✅ Q8: Team Creation - ORGANIZERS ONLY
**Decision:** Only organizers can pre-create teams (Option B).

**Implementation:**
- Add `allowPlayerTeamCreation: boolean` to Event schema (default: false)
- UI Changes:
  - Hide "Create Team" button for players when setting is disabled
  - Show "Pre-Create Teams" button in admin event management UI (organizers only)
- Cloud Function `createTeamSecure()`:
  - Check if user has organizer role for the event's tenant
  - Validate `eventId` and `tenantId` match
  - Generate team join code automatically
- Workflow:
  1. Organizer creates event
  2. Organizer clicks "Pre-Create Teams"
  3. Form: Team name, max members, optional captain email
  4. System generates unique team code
  5. Organizer shares code with team captain

---

### ✅ Q9: Priority - MUST-HAVES ONLY (P1)
**Decision:** Build only P1 features now. P2/P3 revisited in future (Option: Core features only).

**P1 Must-Haves (MVP Scope):**
1. ✅ Event Management (create/edit/view events)
2. ✅ Task Management (create/edit/view tasks with map picker)
3. ✅ Submission Review (approve/reject with photo viewer)

**P2 - Deferred to Phase 2:**
- User Role Management (manual via Firebase Console for MVP)
- Admin Dashboard with analytics/stats
- Audit Logs (not critical for MVP)

**P3 - Future Enhancements:**
- Bulk task import (Q3)
- CSV export of results
- Advanced reporting

**Scope Protection:** If timeline slips, deprioritize dashboard stats before cutting core CRUD features.

---

### ✅ Q10: Timeline - 5 WEEKS CORE, 6-7 WEEKS TOTAL
**Decision:** Core MVP in 5 weeks, polish phase extends to 6-7 weeks (Option B).

**Adjusted Timeline:**
- **Weeks 1-5:** Core P1 features (Auth, Events, Tasks, Submissions)
- **Week 6:** Mobile optimization pass, cross-device testing, iOS Safari fixes
- **Week 7:** Bug fixes, performance tuning, documentation, deployment prep

**Success Metrics:**
- Event creation < 5 minutes (including 10 tasks)
- Submission review < 30 seconds per item (mobile)
- App loads < 2 seconds on 3G network
- Zero P0 bugs in submission review flow

---

## 11. New Requirement: Admin/Player Dual-Mode Navigation

**User Story:** Admin/moderator/organizer users should see the player app by default after login (Join Event, Browse Teams, Team Code). A role-specific button allows switching to admin view.

**Rationale:** Admins often need to participate in events as players or test the player experience. This dual-mode approach allows seamless context switching without logging out.

### Implementation Strategy

#### 1. UI Component: Admin Mode Toggle
```tsx
// src/components/AdminModeToggle.tsx
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Shield, User } from 'lucide-react';

const AdminModeToggle = () => {
  const { user } = useAuthStore();
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Hide for regular players
  const hasAdminRole = user?.role && ['superadmin', 'admin', 'organizer', 'moderator'].includes(user.role);
  if (!hasAdminRole) return null;

  return (
    <button
      onClick={() => setIsAdminMode(!isAdminMode)}
      className="fixed bottom-4 right-4 z-50 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-xs font-bold uppercase text-slate-200 hover:bg-slate-700 transition-colors shadow-lg flex items-center gap-2"
      aria-label={isAdminMode ? 'Switch to player view' : 'Switch to admin view'}
    >
      {isAdminMode ? (
        <>
          <User size={16} />
          <span>Player View</span>
        </>
      ) : (
        <>
          <Shield size={16} />
          <span>Admin View</span>
        </>
      )}
    </button>
  );
};

export default AdminModeToggle;
```

#### 2. Routing Architecture (React Router v6)
```tsx
// src/App.tsx - Conditional Route Rendering
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Player routes
import PlayerDashboard from '@/pages/PlayerDashboard';
import BrowseTeams from '@/pages/BrowseTeams';
import JoinWithCode from '@/pages/JoinWithCode';
import TaskMap from '@/pages/TaskMap';

// Admin routes
import AdminDashboard from '@/features/admin/pages/AdminDashboard';
import EventManagement from '@/features/admin/pages/EventManagement';
import TaskManagement from '@/features/admin/pages/TaskManagement';
import SubmissionReview from '@/features/admin/pages/SubmissionReview';

import AdminModeToggle from '@/components/AdminModeToggle';

const App = () => {
  const { user } = useAuthStore();
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  const hasAdminRole = user?.role && ['superadmin', 'admin', 'organizer', 'moderator'].includes(user.role);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Player routes (always accessible) */}
        <Route path="/" element={<PlayerDashboard />} />
        <Route path="/browse-teams" element={<BrowseTeams />} />
        <Route path="/join-code" element={<JoinWithCode />} />
        <Route path="/tasks" element={<TaskMap />} />
        
        {/* Admin routes (conditional rendering) */}
        {hasAdminRole && isAdminMode && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<EventManagement />} />
            <Route path="/admin/events/:id" element={<EventDetail />} />
            <Route path="/admin/events/:id/tasks/new" element={<TaskCreator />} />
            <Route path="/admin/tasks" element={<TaskManagement />} />
            <Route path="/admin/review" element={<SubmissionReview />} />
          </>
        )}
        
        {/* Redirect /admin to dashboard if not in admin mode */}
        {hasAdminRole && !isAdminMode && (
          <Route path="/admin/*" element={<Navigate to="/" replace />} />
        )}
        
        {/* 404 fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Toggle button (only shown to admin roles) */}
      <AdminModeToggle isAdminMode={isAdminMode} setIsAdminMode={setIsAdminMode} />
    </BrowserRouter>
  );
};

export default App;
```

#### 3. Zustand State Management
```typescript
// src/store/adminStore.ts - New store for admin mode state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  isAdminMode: boolean;
  setAdminMode: (mode: boolean) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAdminMode: false,
      setAdminMode: (mode) => set({ isAdminMode: mode }),
    }),
    {
      name: 'admin-mode-storage', // localStorage key
    }
  )
);
```

#### 4. Security Enforcement

**Client-Side:**
- Admin routes only render when `isAdminMode === true` AND user has admin role
- Toggle button only visible to users with admin roles
- Default view is player dashboard (prevents accidental admin exposure)

**Server-Side (No Changes Needed):**
- Cloud Functions already verify role via Firebase Custom Claims
- Firestore security rules enforce role-based access
- Client-side routing is cosmetic; backend enforces permissions

**Example Cloud Function (existing pattern):**
```typescript
export const createEventSecure = onCall({cors: true}, async (request) => {
  const {auth} = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Must be logged in');
  
  // Get custom claims
  const user = await admin.auth().getUser(auth.uid);
  const role = user.customClaims?.role;
  
  if (!['superadmin', 'admin', 'organizer'].includes(role)) {
    throw new HttpsError('permission-denied', 'Must be organizer or higher');
  }
  
  // Proceed with event creation...
});
```

#### 5. Mobile Navigation Adjustments

**Bottom Tab Bar (Mobile Player View):**
```tsx
// src/components/BottomNav.tsx
const BottomNav = () => {
  const { isAdminMode } = useAdminStore();
  
  if (isAdminMode) return null; // Hide in admin mode
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 flex justify-around py-2 z-40">
      <NavItem icon={MapPin} label="Tasks" to="/" />
      <NavItem icon={Users} label="Teams" to="/browse-teams" />
      <NavItem icon={Hash} label="Join" to="/join-code" />
      <NavItem icon={User} label="Profile" to="/profile" />
    </nav>
  );
};
```

**Admin Navigation (Side Drawer on Mobile):**
```tsx
// src/features/admin/components/AdminNav.tsx
const AdminNav = () => {
  const { isAdminMode } = useAdminStore();
  const [isOpen, setIsOpen] = useState(false);
  
  if (!isAdminMode) return null;
  
  return (
    <>
      {/* Mobile: Hamburger menu */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-800 p-2 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={24} className="text-slate-200" />
      </button>
      
      {/* Side drawer (mobile) / Sidebar (desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <nav className="p-4">
          <AdminNavItem icon={LayoutDashboard} label="Dashboard" to="/admin" />
          <AdminNavItem icon={Calendar} label="Events" to="/admin/events" />
          <AdminNavItem icon={MapPin} label="Tasks" to="/admin/tasks" />
          <AdminNavItem icon={CheckCircle} label="Review" to="/admin/review" />
        </nav>
      </aside>
    </>
  );
};
```

#### 6. User Flow Example

**Scenario:** Organizer wants to test their event as a player.

1. User logs in with organizer credentials
2. App shows player dashboard (Join Event, Browse Teams, Team Code)
3. User sees 🛡️ "Admin View" button (bottom-right)
4. User clicks button → Admin mode activates
5. Bottom tab bar hides, admin sidebar appears
6. User navigates to `/admin/events`, creates tasks
7. User clicks 👤 "Player View" button to test
8. Admin routes become inaccessible, player routes show
9. User joins their event with a team code
10. User completes tasks to verify functionality
11. User switches back to Admin View to review submissions

**State Persistence:** Admin mode preference saved in localStorage, survives page refreshes.

---

## 12. Updated Development Phases

### Phase 1: Foundation & Auth (Week 1) - UPDATED

**Agent: Backend Proxy**
- ✅ Enable email/password auth in Firebase Console (Manual, 30 min)
- ✅ Create `setUserRole` Cloud Function with role validation
- ✅ Create first super admin guide document
- **NEW:** Update Cloud Functions to support dual-mode auth (existing anonymous + new email auth)

**Agent: State Manager**
- ✅ Create `useAdminStore` with `isAdminMode` state (Zustand + persist)
- ✅ Create `useAdminAuth` hook for email login
- **NEW:** Add role checking helper: `useHasAdminRole()`

**Agent: UI Component Builder**
- ✅ Create admin login page (`/admin/login`) with Tactical Ops theme
- **NEW:** Build `AdminModeToggle` component with Shield/User icons
- **NEW:** Implement mobile-first bottom navigation for player view
- **NEW:** Build admin sidebar navigation with hamburger menu (mobile)
- ✅ Apply Tactical Ops styling from design system doc

**Testing:**
- Login as super admin via email
- Toggle between player/admin modes
- Verify routes appear/disappear correctly
- Test on mobile device (iOS Safari, Android Chrome)

---

### Phase 2: Event Management (Week 2) - UPDATED

**Agent: UI Component Builder (Mobile-First)**
- Build event creation form:
  - **Mobile:** Full-screen wizard (3 steps), swipe navigation
  - **Tablet+:** Single scrollable form with sections
- Build event list view:
  - **Mobile:** Card grid (1 column)
  - **Tablet:** Card grid (2 columns)
  - **Desktop:** Table with sortable columns
- Touch targets: Minimum 44px for all buttons

**Agent: Backend Proxy**
- ✅ `createEventSecure` - Role check: organizer+
- ✅ `updateEventSecure` - Validate ownership
- **NEW:** `generateEventCode` - Auto-suggest from event name

**Agent: State Manager**
- ✅ Extend `useAdminStore` with event CRUD methods
- **NEW:** Add `useEventCodeValidator` hook (check uniqueness)

**Mobile Testing:**
- Create event on iPhone 14 (375px width)
- Test form keyboard behavior (input focus, scroll)
- Verify touch targets meet 44px minimum

---

### Phase 3: Task Management (Week 3) - UPDATED

**Agent: UI Component Builder (Mobile-First)**
- Task type selector:
  - **Mobile:** Full-screen grid (2x3 cards)
  - **Desktop:** Inline modal
- GPS task form with map picker:
  - **Mobile:** Full-screen map, bottom sheet for form
  - **Desktop:** Split view (map 60%, form 40%)
- Quiz task form:
  - **Mobile:** Stacked fields, auto-scroll to next input
  - **Tablet+:** 2-column layout
- Touch-friendly map controls (zoom buttons, current location)

**Agent: Backend Proxy**
- ✅ `createTaskSecure` - Validate coordinates
- ✅ `updateTaskSecure` - Check event ownership
- **NEW:** Add `autoApprove` field to Task schema

**Mobile Testing:**
- Create GPS task on mobile (test map interactions)
- Create quiz task with on-screen keyboard
- Test map marker dragging with finger (not mouse)

---

### Phase 4: Submission Review (Week 4) - CRITICAL MOBILE FOCUS

**Agent: UI Component Builder (Mobile-First - PRIMARY USE CASE)**
- Submission queue:
  - **Mobile:** Swipeable cards (Tinder-style), swipe right = approve, swipe left = reject
  - **Tablet:** Card grid (2 columns) with tap actions
  - **Desktop:** Table with modal detail view
- Photo viewer:
  - **Mobile:** Full-screen lightbox, pinch-to-zoom
  - **Desktop:** Modal with image zoom
- Approval buttons:
  - **Mobile:** Large full-width buttons (60px height), sticky to bottom
  - **Tablet:** Standard button size (44px)

**Agent: Backend Proxy**
- `approveSubmissionSecure` - Update status, award points
- `rejectSubmissionSecure` - Add rejection reason
- **NEW:** Auto-approval logic for quiz tasks in `submitTaskSecure`

**Agent: State Manager**
- `useSubmissionQueue` - Real-time listener for pending submissions
- **NEW:** `useSwipeActions` - Handle swipe gestures on mobile

**Mobile Testing Priority (Most Important Phase):**
- Test submission review on moderator's actual mobile device
- Verify swipe gestures work smoothly
- Test photo loading on 3G network
- Ensure buttons reachable with one thumb (bottom 50% of screen)

---

### Phase 5: Polish & Deployment (Week 5-7) - UPDATED

**Week 5: Core Polish**
- Fix bugs from Phases 1-4
- Performance optimization (lazy loading, image compression)
- Add loading skeletons (mobile: full-screen, desktop: inline)

**Week 6: Mobile Optimization Pass (NEW)**
- **Agent: UI Component Builder**
  - iOS Safari fixes (viewport height, input zoom)
  - Android Chrome optimizations (touch delay, scroll performance)
  - PWA manifest updates (installable, offline support)
- **Testing:** Real device testing on 5+ devices
  - iPhone SE (smallest screen)
  - iPhone 14 (standard size)
  - Galaxy S23 (Android reference)
  - iPad Mini (tablet reference)
  - Desktop (1920x1080)

**Week 7: Deployment & Documentation**
- Deploy to Firebase Hosting
- Create `FIRST_ADMIN_SETUP_GUIDE.md`
- Update Firestore rules (lock down for production)
- Smoke tests on production environment

---

## 13. Updated Success Metrics

### Performance Targets (Mobile-First)
- **Event Creation:** < 5 minutes (including 10 tasks) on mobile
- **Submission Review:** < 30 seconds per item (mobile swipe interface)
- **App Load Time:** < 2 seconds on 3G network
- **Bundle Size Increase:** < 150KB (admin features lazy-loaded)

### Mobile Experience Targets
- **Touch Target Compliance:** 100% of interactive elements ≥ 44px
- **Viewport Support:** 375px (iPhone SE) to 1920px (desktop)
- **Gesture Support:** Swipe, pinch-zoom, drag-to-reorder
- **Offline Capability:** Admin mode works with cached data (read-only)

### Code Quality Targets (Unchanged)
- TypeScript strict mode: 0 errors
- All Cloud Functions: Role validation + error handling
- Test coverage: ≥ 70% for critical paths

---

## Next Steps (Updated)

Upon confirmation of this updated plan:

1. **Week 1, Day 1, Morning (2 hours):**
   - Agent creates `FIRST_ADMIN_SETUP_GUIDE.md` with Firebase Console steps
   - Developer follows guide to enable email auth and create first super admin

2. **Week 1, Day 1, Afternoon (4 hours):**
   - Backend Agent: Implement `setUserRole` Cloud Function
   - State Agent: Create `useAdminStore` with `isAdminMode` state
   - UI Agent: Build `AdminModeToggle` component

3. **Week 1, Day 2 (8 hours):**
   - UI Agent: Build admin login page with Tactical Ops theme
   - UI Agent: Build mobile bottom nav (player view)
   - UI Agent: Build admin sidebar with hamburger menu (mobile)
   - Integration testing: Toggle between modes, verify routing

4. **Week 1, Day 3-5 (12 hours):**
   - All agents: Continue Phase 1 tasks (admin dashboard, role guards)
   - Mobile testing: Test on iOS Safari and Android Chrome
   - Fix viewport issues, keyboard behavior, touch targets

---

**Document Status:** ✅ APPROVED - Ready for Implementation  
**Document Version:** 2.0 (Updated with stakeholder decisions)  
**Last Updated:** December 28, 2025

**Key Changes from v1.0:**
- Added Tactical Ops design system integration
- Mobile-first development approach (primary requirement)
- Admin/player dual-mode navigation architecture
- Updated all phases with mobile-specific implementation details
- Deferred bulk import to Phase 2
- Added Week 6 mobile optimization pass
- Updated success metrics for mobile performance
