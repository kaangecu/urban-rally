# Admin Portal Implementation Tickets - Master Index

**Project:** Urban Rally Admin Portal  
**Timeline:** 5-7 weeks  
**Total Story Points (Week 1):** 24

---

## Overview

This directory contains detailed implementation tickets for AI coding agents to build the Urban Rally admin portal. Each ticket includes:

- **Acceptance Criteria** - What "done" looks like
- **Implementation Code** - Copy-paste ready code examples
- **Testing Requirements** - Unit tests, integration tests, mobile testing
- **Dependencies** - What must be completed first
- **Story Points** - Complexity estimation (1-5 scale)

---

## Ticket Naming Convention

- **BE-XXX** - Backend Proxy (Cloud Functions, Firebase)
- **UI-XXX** - UI Component Builder (React components, styling)
- **STATE-XXX** - State Manager (Zustand stores, custom hooks)

---

## Week 1: Foundation & Authentication (24 Story Points)

### Backend Tickets (8 points)
| Ticket | Title | Priority | Points | Time |
|--------|-------|----------|--------|------|
| BE-001 | Enable Email/Password Auth | P0 | 1 | 30min |
| BE-002 | Implement `setUserRole` Cloud Function | P0 | 3 | 4hrs |
| BE-003 | Update Auth System for Dual Auth | P0 | 2 | 3hrs |
| BE-004 | Create Audit Log Helper Functions | P2 | 2 | 2hrs |

**Critical Path:** BE-001 → BE-002 → BE-003  
**File:** [WEEK1_BACKEND_TICKETS.md](./WEEK1_BACKEND_TICKETS.md)

---

### UI Tickets (10 points)
| Ticket | Title | Priority | Points | Time |
|--------|-------|----------|--------|------|
| UI-001 | Create Admin Mode Toggle Component | P0 | 2 | 2hrs |
| UI-002 | Create Admin Login Page | P0 | 3 | 4hrs |
| UI-003 | Build Mobile Bottom Navigation | P1 | 2 | 2hrs |
| UI-004 | Build Admin Sidebar Navigation | P1 | 3 | 4hrs |

**Critical Path:** UI-001 → UI-004  
**File:** [WEEK1_UI_TICKETS.md](./WEEK1_UI_TICKETS.md)

---

### State Management Tickets (6 points)
| Ticket | Title | Priority | Points | Time |
|--------|-------|----------|--------|------|
| STATE-001 | Create Admin Store (Zustand) | P0 | 2 | 2hrs |
| STATE-002 | Create `useAdminAuth` Hook | P0 | 2 | 3hrs |
| STATE-003 | Create `useHasAdminRole` Helper Hook | P1 | 1 | 1hr |
| STATE-004 | Update `AuthContext` for Role Loading | P1 | 1 | 1hr |

**Critical Path:** STATE-001 → STATE-002 → STATE-004  
**File:** [WEEK1_STATE_TICKETS.md](./WEEK1_STATE_TICKETS.md)

---

## Week 2: Event Management (28 Story Points)

### Backend Tickets (10 points)
| Ticket | Title | Priority | Points | Status |
|--------|-------|----------|--------|--------|
| BE-005 | Create `createEventSecure` Cloud Function | P0 | 3 | 📝 Planned |
| BE-006 | Create `updateEventSecure` Cloud Function | P0 | 2 | 📝 Planned |
| BE-007 | Create `deleteEventSecure` Cloud Function | P1 | 2 | 📝 Planned |
| BE-008 | Implement Event Code Generator | P1 | 2 | 📝 Planned |
| BE-009 | Add Event Validation Helpers | P2 | 1 | 📝 Planned |

**File:** WEEK2_BACKEND_TICKETS.md *(To be created)*

---

### UI Tickets (12 points)
| Ticket | Title | Priority | Points | Status |
|--------|-------|----------|--------|--------|
| UI-005 | Build Event List View (Mobile Cards) | P0 | 3 | 📝 Planned |
| UI-006 | Build Event Creation Form (3-Step Wizard) | P0 | 5 | 📝 Planned |
| UI-007 | Build Event Detail Page | P1 | 3 | 📝 Planned |
| UI-008 | Build Event Edit Modal | P1 | 2 | 📝 Planned |

**File:** WEEK2_UI_TICKETS.md *(To be created)*

---

### State Management Tickets (6 points)
| Ticket | Title | Priority | Points | Status |
|--------|-------|----------|--------|--------|
| STATE-005 | Create Event CRUD Hooks | P0 | 3 | 📝 Planned |
| STATE-006 | Create `useEventList` Real-Time Hook | P0 | 2 | 📝 Planned |
| STATE-007 | Create Event Validation Hook | P2 | 1 | 📝 Planned |

**File:** WEEK2_STATE_TICKETS.md *(To be created)*

---

## Week 3: Task Management (29 Story Points)

### Backend Tickets (11 points)
| Ticket | Title | Priority | Points | Status |
|--------|-------|----------|--------|--------|
| BE-010 | Create `createTaskSecure` Cloud Function | P0 | 3 | 📝 Planned |
| BE-011 | Create `updateTaskSecure` Cloud Function | P0 | 2 | 📝 Planned |
| BE-012 | Create `deleteTaskSecure` Cloud Function | P1 | 2 | 📝 Planned |
| BE-013 | Implement Quiz Auto-Approval Logic | P1 | 3 | 📝 Planned |
| BE-014 | Add GPS Validation (Radius Check) | P2 | 1 | 📝 Planned |

**File:** WEEK3_BACKEND_TICKETS.md *(To be created)*

---

### UI Tickets (13 points)
| Ticket | Title | Priority | Points | Status |
|--------|-------|----------|--------|--------|
| UI-009 | Build Task Type Selector | P0 | 2 | 📝 Planned |
| UI-010 | Build GPS Task Form with Map Picker | P0 | 5 | 📝 Planned |
| UI-011 | Build Quiz Task Form | P0 | 3 | 📝 Planned |
| UI-012 | Build Photo Task Form | P1 | 2 | 📝 Planned |
| UI-013 | Build Task List View | P1 | 2 | 📝 Planned |

**File:** WEEK3_UI_TICKETS.md *(To be created)*

---

### State Management Tickets (5 points)
| Ticket | Title | Priority | Points | Status |
|--------|-------|----------|--------|--------|
| STATE-008 | Create Task CRUD Hooks | P0 | 3 | 📝 Planned |
| STATE-009 | Create Task Validation Hook | P1 | 2 | 📝 Planned |

**File:** WEEK3_STATE_TICKETS.md *(To be created)*

---

## Week 4: Submission Review (23 Story Points)

### Backend Tickets (8 points)
| Ticket | Title | Priority | Points | Status |
|--------|-------|----------|--------|--------|
| BE-015 | Create `approveSubmissionSecure` Function | P0 | 3 | 📝 Planned |
| BE-016 | Create `rejectSubmissionSecure` Function | P0 | 2 | 📝 Planned |
| BE-017 | Implement Points Award Logic | P0 | 2 | 📝 Planned |
| BE-018 | Add Submission Statistics Aggregation | P2 | 1 | 📝 Planned |

**File:** WEEK4_BACKEND_TICKETS.md *(To be created)*

---

### UI Tickets (11 points)
| Ticket | Title | Priority | Points | Status |
|--------|-------|----------|--------|--------|
| UI-014 | Build Submission Queue (Swipeable Cards) | P0 | 5 | 📝 Planned |
| UI-015 | Build Photo Viewer with Pinch Zoom | P0 | 3 | 📝 Planned |
| UI-016 | Build Approval/Reject Buttons | P0 | 2 | 📝 Planned |
| UI-017 | Build Submission Filters | P2 | 2 | 📝 Planned |

**File:** WEEK4_UI_TICKETS.md *(To be created)*

---

### State Management Tickets (4 points)
| Ticket | Title | Priority | Points | Status |
|--------|-------|----------|--------|--------|
| STATE-010 | Create Submission Review Hooks | P0 | 3 | 📝 Planned |
| STATE-011 | Create Swipe Gesture Hook | P0 | 2 | 📝 Planned |

**File:** WEEK4_STATE_TICKETS.md *(To be created)*

---

## Week 5-7: Polish & Deployment (19 Story Points)

### Week 5: Core Polish
- Bug fixes from Weeks 1-4
- Performance optimization
- Loading states and skeletons

### Week 6: Mobile Optimization (NEW)
- iOS Safari fixes (viewport, input zoom)
- Android Chrome optimizations
- PWA manifest updates
- Real device testing (5+ devices)

### Week 7: Deployment
- Production Firebase deployment
- Firestore rules lockdown
- First admin setup guide walkthrough
- Smoke tests

**File:** WEEK5-7_POLISH_TICKETS.md *(To be created)*

---

## Ticket Status Legend

- 🎯 **P0** - Blocking (must complete before moving to next ticket)
- 📌 **P1** - Must Have (required for MVP)
- 💡 **P2** - Should Have (can be deferred if timeline slips)
- 🎁 **P3** - Nice to Have (Phase 2 enhancement)

- ✅ **Completed** - Ticket done, tested, merged
- 🚧 **In Progress** - Currently being worked on
- 📝 **Planned** - Not started yet
- ⏸️ **Blocked** - Waiting on dependency
- ❌ **Deferred** - Moved to Phase 2

---

## Agent Assignment Guidelines

### Backend Proxy Agent
- **Focus:** Cloud Functions, Firebase Admin SDK, security rules
- **Technologies:** TypeScript, Firebase Functions v2, Firestore Admin
- **Deliverables:** Callable functions, RBAC enforcement, audit logging
- **Testing:** Integration tests, emulator testing, production smoke tests

### UI Component Builder Agent  
- **Focus:** React components, Tailwind styling, mobile-first design
- **Technologies:** React 19, TypeScript, Tailwind v4, Framer Motion
- **Deliverables:** Responsive components, Tactical Ops theme, touch-friendly UI
- **Testing:** Component tests (Vitest), mobile device testing (real devices)

### State Manager Agent
- **Focus:** Zustand stores, custom hooks, data flow
- **Technologies:** Zustand, React hooks, TypeScript
- **Deliverables:** Global state, custom hooks, performance optimization
- **Testing:** Hook tests (React Testing Library), subscription tests

---

## Development Workflow

### Daily Standups (Async)
Each agent reports:
1. **Yesterday:** Tickets completed (with ticket IDs)
2. **Today:** Tickets in progress (with ticket IDs)
3. **Blockers:** Dependencies or issues

### Pull Request Process
1. Create feature branch: `feature/[TICKET-ID]-brief-description`
2. Implement ticket (include ticket ID in commits)
3. Run tests: `npm test`, `npm run type-check`
4. Create PR with template:
   - **Ticket:** [Link to ticket]
   - **Changes:** Bullet list
   - **Testing:** How to test
   - **Screenshots:** (for UI tickets)
5. Request review from other agents if cross-cutting
6. Merge after approval

### Testing Checklist (Every Ticket)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Unit tests pass (`npm test`)
- [ ] Component renders without errors
- [ ] Mobile responsive (Chrome DevTools + real device)
- [ ] Tactical Ops theme applied correctly
- [ ] No console errors or warnings
- [ ] Accessibility: Keyboard navigation, ARIA labels
- [ ] Performance: No unnecessary re-renders

---

## Success Metrics

### Week 1 Success Criteria
- [ ] Admin can log in with email/password
- [ ] Admin mode toggle works on mobile and desktop
- [ ] Navigation switches between player/admin views
- [ ] No auth errors on page refresh
- [ ] All 24 story points completed

### Overall MVP Success Criteria (Week 5)
- [ ] Event creation < 5 minutes (mobile)
- [ ] Submission review < 30 seconds per item (mobile swipe)
- [ ] App loads < 2 seconds on 3G
- [ ] 100% touch targets ≥ 44px
- [ ] Zero P0 bugs in core flows

---

## Quick Links

- **Development Plan:** [ADMIN_PORTAL_DEVELOPMENT_PLAN.md](../ADMIN_PORTAL_DEVELOPMENT_PLAN.md)
- **Design System:** [admin_portal_style.md](../admin_portal_style.md)
- **Setup Guide:** [FIRST_ADMIN_SETUP_GUIDE.md](../FIRST_ADMIN_SETUP_GUIDE.md)
- **Architecture:** [ADMIN_PORTAL_ARCHITECTURE.md](../ADMIN_PORTAL_ARCHITECTURE.md)

---

**Last Updated:** December 28, 2025  
**Document Version:** 1.0  
**Maintained By:** Urban Rally Dev Team
