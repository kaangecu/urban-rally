# Event Code to Team Browser Flow - Testing Guide

## Overview
This document outlines how to test the complete hybrid login flow from event code entry to team selection.

## Flow Diagram

```
Landing Screen (/)
    ↓ Click "Browse Event"
Event Code Entry (/join/event)
    ↓ Enter code (e.g., "NIGHT2025")
    ↓ Validate & Find Event
Team Browser (/tenant/{tid}/event/{eid}/teams)
    ↓ Browse Teams
    ↓ Click Team Card
Team Detail Modal
    ↓ Click "Join Squad"
Dashboard (/tenant/{tid}/event/{eid}/dashboard)
```

## Testing Steps

### 1. Start at Landing Screen
**URL:** `http://localhost:5174/`

**Expected:**
- See 3 option cards:
  - 📚 Browse Event
  - 🎫 Join with Team Code
  - 📱 Scan QR Code (disabled)

**Action:** Click "Browse Event"

---

### 2. Enter Event Code
**URL:** `http://localhost:5174/join/event`

**Expected UI:**
- 🎪 Event icon
- "Browse Event" title
- Event code input field
- Info box explaining event codes
- "Continue to Teams" button (disabled until 6+ chars)

**Test Cases:**

#### Test Case 1: Valid Event Code
**Input:** `NIGHT2025`
**Expected:**
1. Button becomes enabled
2. Click "Continue to Teams"
3. Shows "Validating..." spinner
4. Success animation appears:
   - Green checkmark ✓
   - "Event Found!"
   - Event name: "Night Chase 2025"
   - "Loading teams..." message
5. After 800ms, redirects to team browser

#### Test Case 2: Invalid Event Code
**Input:** `INVALID`
**Expected:**
- Error message: "Invalid event code. Please check and try again."
- Stays on event code screen
- Error clears when user types again

#### Test Case 3: Short Event Code
**Input:** `ABC`
**Expected:**
- Button stays disabled
- No error shown (validation on submit only)

#### Test Case 4: Empty Event Code
**Click Submit:** With empty field
**Expected:**
- Error: "Please enter an event code"

---

### 3. Team Browser Screen
**URL:** `http://localhost:5174/tenant/{tenantId}/event/{eventId}/teams`

**Example:** `http://localhost:5174/tenant/esn-berlin/event/{eventId}/teams`

### A. Cyberpunk Theme (if tenant has cyberpunk theme)

**Expected UI Elements:**

#### Header
- **Title:** "SQUAD SELECT" (gradient cyan to pink, italic, uppercase)
- **Counter:** "> X Squads Available" (cyan, animated pulse, mono font)
- **Background:** Radial gradient (indigo-950 → black)

#### Search Bar
- **Style:** Glassmorphism (bg-white/5, backdrop-blur)
- **Icon:** Pink magnifying glass (turns lighter on focus)
- **Placeholder:** "Find squad name..."
- **Behavior:** Real-time filtering as you type

#### Filter Chips
- **"All Teams"** - Active by default
- **"Space Available"** - Pink glow when active
- **Style:** Rounded pills with neon borders

#### Team Cards
Each card shows:

**Open Team (Cyan Theme):**
- **Border:** White/10 with cyan glow on hover
- **Status Badge:** "OPEN" with animated pinging dot (top-right)
- **Avatar:** Gradient border (cyan → blue) with team emoji
- **Team Name:** Bold white text (turns cyan on hover)
- **Capacity Bar:** 
  - Gradient fill (cyan → blue)
  - Glow shadow effect
  - Shows "3 / 6 Members"
- **Hover:** Scales to 1.01x, border glows cyan

**Full Team (Red/Gray Theme):**
- **Style:** Grayscale filter (50%), reduced opacity
- **Status Badge:** "FULL SQUAD" (red)
- **Capacity Bar:** Red/900 fill (no glow)
- **Cursor:** Not allowed
- **No Hover:** No scale effect

**User's Team (Green Theme):**
- **Border:** Green/30
- **Status Badge:** "YOUR TEAM" with checkmark
- **Capacity Bar:** Green gradient with glow
- **Clickable:** Opens modal with team details

#### Loading State
- Themed spinner (cyan glow)
- "Loading teams..." text

#### Error State
- Themed error component
- Retry button

### B. Light Theme (if tenant has light theme)

**Expected UI Elements:**

#### Header
- **Title:** "Team Browser" (gray-900, normal weight)
- **Counter:** "X teams available" (gray-600)
- **Background:** Gray-50

#### Search Bar
- **Style:** White background, gray border
- **Icon:** Gray magnifying glass (turns blue on focus)

#### Filter Chips
- **Active:** Blue background
- **Inactive:** Gray background

#### Team Cards
- **Border:** Gray-200
- **Shadow:** Standard drop shadow
- **Hover:** Shadow increases, slight lift
- **Capacity Bar:** Blue fill (no glow)

---

### 4. Team Detail Modal
**Trigger:** Click any team card

**Expected UI (Cyberpunk):**

#### Modal Appearance
- **Animation:** Slides up from bottom (animate-slideUp)
- **Backdrop:** Black/60 with blur
- **Position:** Bottom sheet (rounded-t-3xl)
- **Background:** Gray-900/90 with backdrop blur

#### Modal Content
- **Drag Handle:** White/20 bar at top
- **Team Avatar:** Large (64px) with gradient border and emoji
- **Team Name:** 2xl, bold, uppercase, italic
- **Status Indicator:**
  - Open: "OPEN TO JOIN" (cyan, pinging dot)
  - Full: "FULL SQUAD" (red)
  - Joined: "YOUR TEAM" (green)

#### Capacity Section
- **Label:** "Squad Capacity" (uppercase, small)
- **Numbers:** "3/6" (white, bold)
- **Progress Bar:** Gradient with glow

#### Members Preview
- **Title:** "Squad Members (X)"
- **List:** First 3 members with:
  - Avatar circle with first letter
  - Member name
- **Overflow:** "...and X more" if > 3 members

#### Join Button
**States:**

1. **Available to Join:**
   - Text: "Join Squad (X slots left)"
   - Style: Gradient (cyan → blue), shadow glow
   - Hover: Scales to 1.02x
   - Active: Scales to 0.98x

2. **Joining (Loading):**
   - Text: "Joining..."
   - Disabled, opacity 50%
   - Shows spinner

3. **Team Full:**
   - Text: "Squad Full"
   - Disabled, gray background
   - Cursor: Not allowed

4. **Already Joined:**
   - Text: "Close"
   - Gray gradient
   - Closes modal

#### Closing Modal
- **Click backdrop:** Modal closes
- **Drag handle:** Visual indicator
- **Escape key:** Closes modal

---

### 5. Post-Join Flow
**After clicking "Join Squad":**

1. **Button State:** Shows "Joining..." with disabled state
2. **Backend Call:** `joinTeam()` executes
3. **Auth Store:** Updates with team info
4. **Navigation:** Redirects to dashboard
5. **URL:** `/tenant/{tenantId}/event/{eventId}/dashboard`

---

## Available Event Codes (From Migration)

| Event Code | Event Name | Teams |
|------------|------------|-------|
| `NIGHT2025` | Night Chase 2025 | Check Firestore |
| `WINTER` | Winter Scavenger Hunt | Check Firestore |
| `20252025` | Welcome Week 2025 | Check Firestore |
| `UNNAMED` | Unnamed Event | Check Firestore |
| `UNNAMED2` | Unnamed Event | Check Firestore |
| `UNNAMED3` | Unnamed Event | Check Firestore |

---

## Search & Filter Testing

### Search Tests

1. **By Team Name:**
   - Type: "Cyber"
   - Expected: Shows teams with "Cyber" in name

2. **By Display Name:**
   - Type: "Runners"
   - Expected: Shows matching teams

3. **By Access Code:**
   - Type: team's access code
   - Expected: Shows exact match

4. **Clear Search:**
   - Type something, then clear
   - Expected: Shows all teams again

5. **No Results:**
   - Type: "XYZ123"
   - Expected: Empty state message

### Filter Tests

1. **All Teams (Default):**
   - Expected: Shows all teams (open, full, joined)

2. **Space Available:**
   - Click filter
   - Expected: Shows only teams with memberCount < maxMembers
   - Full teams hidden

3. **Combined Search + Filter:**
   - Type: "Cyber"
   - Click: "Space Available"
   - Expected: Shows "Cyber" teams with space only

---

## Performance Checks

### Loading Speed
- **Initial Load:** < 1 second for small team lists
- **Search Response:** Real-time (no debounce needed for <100 teams)
- **Modal Open:** Instant (no loading delay)

### Animations
- **Team Cards:** Smooth hover (scale 1.01x)
- **Modal:** Smooth slide-up (no jank)
- **Filters:** Instant state change
- **Search:** Real-time filtering

---

## Accessibility Checks

### Keyboard Navigation
- [ ] Tab through cards
- [ ] Enter to open modal
- [ ] Escape to close modal
- [ ] Tab through filter chips
- [ ] Space/Enter to activate filters

### Screen Reader
- [ ] Search input has label
- [ ] Filter buttons have labels
- [ ] Team cards have accessible names
- [ ] Modal has focus trap

### Color Contrast
- [ ] Text meets WCAG AA (4.5:1)
- [ ] Status badges are readable
- [ ] Disabled states are obvious

---

## Mobile Testing

### Responsive Design
- [ ] Max-w-md container centers on desktop
- [ ] Full width on mobile
- [ ] Touch targets ≥ 44px
- [ ] No horizontal scroll

### Touch Interactions
- [ ] Cards respond to touch
- [ ] Modal swipe to close (future)
- [ ] Filter chips touchable
- [ ] Search input keyboard appears

---

## Error Scenarios

### No Teams Found
**Scenario:** Event exists but has no teams
**Expected:**
- Empty state component
- Message: "No teams available yet"
- Back button to return

### Network Error
**Scenario:** Firestore connection fails
**Expected:**
- Error state component
- Message: "Failed to load teams"
- Retry button

### Invalid Event ID
**Scenario:** Event doesn't exist
**Expected:**
- Error: "Event not found"
- Back button navigates to landing

---

## Browser Testing

### Required Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### CSS Features
- [ ] Backdrop-blur works (Safari requires `-webkit-backdrop-filter`)
- [ ] Gradients render correctly
- [ ] Animations are smooth
- [ ] Custom fonts load

---

## Quick Test Script

```bash
# 1. Start dev server
npm run dev

# 2. Open browser
open http://localhost:5174

# 3. Test event code flow
# - Click "Browse Event"
# - Enter "NIGHT2025"
# - Verify redirect to team browser
# - Search for team
# - Click team card
# - Verify modal opens
# - Click "Join Squad"
# - Verify navigation to dashboard
```

---

## Known Issues

### TypeScript Errors (Non-blocking)
- ❌ `Cannot find module './TeamCard'`
- ❌ `Cannot find module './TeamDetailModal'`
- **Status:** VS Code language server issue
- **Impact:** None - files exist and runtime works
- **Fix:** Restart TS server or ignore

### Code Improvements Needed
- `20252025` event code (should be `WELCOME2025`)
- Unnamed events need proper names
- Missing unit tests

---

## Success Criteria

✅ **Flow Complete When:**
1. Can enter event code
2. See teams from that event only
3. Search works real-time
4. Filters work correctly
5. Cards show correct status
6. Modal opens with team details
7. Can join team
8. Redirects to dashboard
9. No console errors
10. Works on mobile

---

**Testing Status:** ✅ Ready for Manual Testing  
**Dev Server:** Running on http://localhost:5174  
**Next Step:** Open browser and test the flow!

