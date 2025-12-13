# Next Steps - Urban Rally Development

## ✅ Completed (Phase 1-3)

### Phase 1: Authentication & Multi-Tenancy ✅
- [x] Team code login system
- [x] Dual-tenant theming (ESN Berlin, Urban Chase)
- [x] Firebase Auth with anonymous sign-in
- [x] Team ownership verification via Firestore

### Phase 2: Glassmorphism & Mobile UX ✅
- [x] 9 glass card variants with neon effects
- [x] Mobile-optimized camera UI
- [x] iOS safe area support
- [x] Permission consent screens
- [x] HTTPS setup for camera access

### Phase 3: Photo Submissions ✅
- [x] Camera capture with permission flow
- [x] Image compression (max 1MB, 1920px)
- [x] Firebase Storage upload with progress
- [x] Firestore submission documents
- [x] Team score updates
- [x] Points awarded automatically
- [x] Storage rules with isTeamMember check
- [x] Firestore rules with team ownership verification

---

## 🚧 Next Steps (Priority Order)

### Phase 4A: Video Submissions (HIGH PRIORITY)

**Status:** Component exists but needs testing with new security rules

**Tasks:**
- [ ] Test video recording with VideoCapture component
- [ ] Verify video upload to Storage (max 50MB)
- [ ] Test submission creation with videoUrl
- [ ] Verify team score update works for videos
- [ ] Test on mobile devices (iOS/Android)
- [ ] Check video playback in submission review

**Files to Check:**
- `src/features/submissions/VideoCapture.tsx` - Recording component
- `src/services/storage.service.ts` - uploadVideo function
- `storage.rules` - Already has video support (50MB max)

**Testing Checklist:**
```
1. Login with team code
2. Click VIDEO task
3. Click "Start Task"
4. Grant camera & mic permissions
5. Record 5-10 second video
6. Stop recording
7. Preview video playback
8. Click "Use Video"
9. Verify upload progress
10. Verify submission created
11. Verify points awarded
```

---

### Phase 4B: GPS Location Tasks (HIGH PRIORITY)

**Status:** UI exists, needs GPS validation logic

**Tasks:**
- [ ] Implement GPS validation in TaskSubmission component
- [ ] Calculate distance between user location and task location
- [ ] Define acceptable radius (e.g., 50 meters)
- [ ] Show "too far away" error message
- [ ] Show distance remaining to user
- [ ] Test GPS accuracy on mobile devices
- [ ] Handle GPS permission denied
- [ ] Test GPS spoofing protection (optional)

**Files to Create/Update:**
- `src/utils/gps.utils.ts` - Distance calculation (Haversine formula)
- `src/features/submissions/TaskSubmission.tsx` - GPS validation

**Example Implementation:**
```typescript
// Calculate distance in meters
function getDistance(lat1, lng1, lat2, lng2): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// In TaskSubmission.tsx
const distance = getDistance(
  userLocation.coords.latitude,
  userLocation.coords.longitude,
  task.location.lat,
  task.location.lng
);

if (distance > 50) { // 50 meters radius
  setError(`You're ${Math.round(distance)}m away. Get closer to ${task.title}!`);
  return;
}
```

---

### Phase 4C: Quiz/Text Submissions (MEDIUM PRIORITY)

**Status:** Basic UI exists, needs question/answer logic

**Tasks:**
- [ ] Create QuizSubmission component
- [ ] Support multiple choice questions
- [ ] Support text input questions
- [ ] Validate answers against correct answers
- [ ] Award full/partial points based on correctness
- [ ] Store quiz responses in Firestore
- [ ] Show correct answers after submission (optional)

**Files to Create:**
- `src/features/submissions/QuizSubmission.tsx`
- `src/types/quiz.types.ts`

**Data Structure:**
```typescript
interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'text' | 'number';
  options?: string[]; // For multiple choice
  correctAnswer: string | number;
  points: number;
}

interface QuizSubmission {
  taskId: string;
  answers: {
    questionId: string;
    answer: string | number;
    isCorrect: boolean;
    pointsAwarded: number;
  }[];
  totalPoints: number;
}
```

---

### Phase 5: Admin Review Dashboard (MEDIUM PRIORITY)

**Purpose:** Allow organizers to review/approve/reject submissions

**Tasks:**
- [ ] Create AdminDashboard component
- [ ] Show all submissions with status filter
- [ ] Display photos/videos for review
- [ ] Approve/reject buttons with reason
- [ ] Update submission status in Firestore
- [ ] Notify teams of review results (optional)
- [ ] Admin authentication (email/password)
- [ ] Restrict dashboard access to admins only

**Files to Create:**
- `src/features/admin/AdminDashboard.tsx`
- `src/features/admin/SubmissionReview.tsx`
- `src/services/admin.service.ts`

**Firestore Rules Update:**
```javascript
match /submissions/{submissionId} {
  // Admins can update status/points
  allow update: if isAdmin() 
                && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['status', 'reviewNotes', 'reviewedAt', 'reviewedBy']);
}

function isAdmin() {
  return isAuthenticated() 
         && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

### Phase 6: Real-Time Leaderboard (HIGH PRIORITY)

**Status:** Collection exists, needs UI component

**Tasks:**
- [ ] Create Leaderboard component
- [ ] Real-time Firestore listener for leaderboard updates
- [ ] Show team rank, name, score, completed tasks
- [ ] Auto-refresh when new submissions approved
- [ ] Filter by event/tenant
- [ ] Animated rank changes (optional)
- [ ] Show team's current position highlighted
- [ ] Cache leaderboard data for offline

**Files to Create:**
- `src/features/leaderboard/Leaderboard.tsx`
- `src/services/leaderboard.service.ts`

**Implementation:**
```typescript
// Real-time listener
const unsubscribe = onSnapshot(
  query(
    collection(db, 'leaderboard', eventId, 'entries'),
    orderBy('score', 'desc')
  ),
  (snapshot) => {
    const entries = snapshot.docs.map((doc, index) => ({
      rank: index + 1,
      ...doc.data()
    }));
    setLeaderboard(entries);
  }
);
```

---

### Phase 7: Map View (MEDIUM PRIORITY)

**Purpose:** Show all tasks on a map with team's current location

**Tasks:**
- [ ] Integrate Google Maps or Mapbox
- [ ] Show task markers with icons
- [ ] Show team's current location
- [ ] Color-code tasks (completed/active/locked)
- [ ] Click marker to see task details
- [ ] Show distance to each task
- [ ] Pan to team location button
- [ ] Cluster nearby tasks (optional)

**Libraries:**
- `@vis.gl/react-google-maps` or `react-map-gl` (Mapbox)

**Files to Create:**
- `src/features/map/TaskMap.tsx`
- `src/components/map/TaskMarker.tsx`

---

### Phase 8: Offline Support (LOW PRIORITY)

**Status:** Firestore persistence enabled, needs full offline UX

**Tasks:**
- [ ] Cache task list for offline viewing
- [ ] Queue submissions when offline
- [ ] Sync submissions when back online
- [ ] Show offline indicator in UI
- [ ] Store photos locally until uploaded
- [ ] Handle conflicts on sync
- [ ] Test airplane mode scenarios

**Files to Update:**
- `src/services/sync.service.ts` (new)
- `src/hooks/useOfflineQueue.ts` (new)

---

### Phase 9: PWA Features (LOW PRIORITY)

**Tasks:**
- [ ] Add web app manifest
- [ ] Service worker for caching
- [ ] Install prompt on mobile
- [ ] Offline fallback page
- [ ] Push notifications (optional)
- [ ] App icons (all sizes)

**Files to Create:**
- `public/manifest.json`
- `public/sw.js`

---

### Phase 10: Payments (Stripe Integration)

**Status:** Firestore rules exist, needs implementation

**Tasks:**
- [ ] Create Stripe account
- [ ] Install Stripe Firebase extension
- [ ] Create pricing tiers
- [ ] Payment checkout page
- [ ] Subscription management
- [ ] Restrict features by plan
- [ ] Handle payment webhooks

**Firestore Rules:** Already configured for `customers/{uid}/checkout_sessions`

---

## 🎯 Recommended Next Actions (This Week)

### 1. Test Video Submissions (2 hours)
- Most code already exists
- Just needs testing with new security rules
- High value, low effort

### 2. Implement GPS Validation (3 hours)
- Critical for location-based tasks
- Prevents cheating
- Enhances user experience

### 3. Build Leaderboard UI (4 hours)
- High user engagement
- Already have data structure
- Real-time updates with Firestore

### 4. Test on Real Devices (2 hours)
- Test photo capture on iPhone/Android
- Verify HTTPS works on local network
- Check GPS accuracy
- Test offline scenarios

---

## 📱 Testing Checklist

### Photo Tasks ✅
- [x] Camera permission consent screen
- [x] Take photo
- [x] Compress and upload
- [x] Submission created
- [x] Points awarded

### Video Tasks ⏳
- [ ] Camera/mic permission
- [ ] Record video
- [ ] Upload (check 50MB limit)
- [ ] Playback works
- [ ] Submission created

### GPS Tasks ⏳
- [ ] Get user location
- [ ] Validate distance
- [ ] Show distance to task
- [ ] Prevent far submissions

### Quiz Tasks ⏳
- [ ] Display questions
- [ ] Submit answers
- [ ] Validate correctness
- [ ] Award points

### Cross-Browser ⏳
- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Chrome (Android)
- [ ] Safari (iOS)
- [ ] Edge (desktop)

### Mobile Devices ⏳
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad)
- [ ] Different screen sizes

---

## 🔧 Technical Debt

### High Priority
- [ ] Add error boundaries for React components
- [ ] Implement proper loading states
- [ ] Add retry logic for failed uploads
- [ ] Improve error messages (user-friendly)
- [ ] Add analytics tracking

### Medium Priority
- [ ] Add unit tests (Jest)
- [ ] Add E2E tests (Playwright)
- [ ] Set up CI/CD pipeline
- [ ] Add code coverage reporting
- [ ] Optimize bundle size

### Low Priority
- [ ] Add Storybook for component docs
- [ ] Set up performance monitoring
- [ ] Add accessibility (a11y) improvements
- [ ] Internationalization (i18n)

---

## 📊 Performance Optimizations

### Image/Video
- [x] Image compression (1MB max)
- [ ] Progressive image loading
- [ ] Video compression before upload
- [ ] Thumbnail generation
- [ ] CDN integration

### Database
- [x] Firestore offline persistence
- [ ] Query result caching
- [ ] Firestore indexes for common queries
- [ ] Batch writes for multiple updates

### App Performance
- [ ] Code splitting (lazy load routes)
- [ ] Memoize expensive components
- [ ] Virtual scrolling for long lists
- [ ] Debounce search/filter inputs

---

## 🚀 Deployment

### Development
- [x] Local HTTPS with self-signed cert
- [x] Firebase Hosting preview channels
- [ ] Staging environment

### Production
- [ ] Custom domain setup
- [ ] SSL certificate (Let's Encrypt)
- [ ] Environment variables management
- [ ] Backup strategy
- [ ] Monitoring/logging (Sentry)

---

## 📚 Documentation Needed

### User Guides
- [ ] How to login with team code
- [ ] How to complete different task types
- [ ] How to check leaderboard
- [ ] Troubleshooting common issues

### Admin Guides
- [ ] How to create events
- [ ] How to add tasks
- [ ] How to review submissions
- [ ] How to manage teams

### Developer Docs
- [x] HTTPS Setup Guide
- [x] Mobile Camera Fixes
- [x] Firebase Storage Setup
- [ ] Firestore Data Model
- [ ] Security Rules Explained
- [ ] Deployment Guide

---

## 🎨 UI/UX Improvements

### High Priority
- [ ] Add loading spinners during uploads
- [ ] Show upload progress bar
- [ ] Success animations
- [ ] Error toast notifications
- [ ] Empty states (no tasks, no submissions)

### Medium Priority
- [ ] Confetti on task completion
- [ ] Sound effects (optional)
- [ ] Haptic feedback on mobile
- [ ] Smooth page transitions
- [ ] Dark mode support

### Low Priority
- [ ] Custom animations
- [ ] Parallax effects
- [ ] Micro-interactions
- [ ] Gamification badges

---

## 🐛 Known Issues

### Critical
- None! 🎉

### High Priority
- [ ] Test video upload size limit (50MB)
- [ ] Verify GPS accuracy on different devices
- [ ] Check offline sync conflicts

### Medium Priority
- [ ] Improve camera preview aspect ratio
- [ ] Add video duration limit validation
- [ ] Better error recovery on network failures

### Low Priority
- [ ] Storage rules warnings (unused variables)
- [ ] Optimize glassmorphism blur on mobile
- [ ] Reduce bundle size

---

## 💡 Feature Ideas (Future)

### Social Features
- [ ] Team chat/messaging
- [ ] Photo gallery for all teams
- [ ] Share submissions on social media
- [ ] Team vs Team challenges

### Gamification
- [ ] Achievements/badges system
- [ ] Daily challenges
- [ ] Streak tracking
- [ ] Power-ups/bonuses

### Advanced Features
- [ ] AR task overlays (WebXR)
- [ ] Voice commands
- [ ] Live streaming of events
- [ ] Spectator mode
- [ ] Multi-language support

---

## 📞 Support & Resources

### Documentation
- Firebase: https://firebase.google.com/docs
- React: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- TypeScript: https://www.typescriptlang.org

### Community
- GitHub Issues: https://github.com/kaangecu/urban-rally/issues
- Discussions: https://github.com/kaangecu/urban-rally/discussions

---

## ✨ Success Metrics

### Current Status (Phase 3 Complete)
- ✅ 100% authentication working
- ✅ 100% photo submissions working
- ✅ 2 tenants with custom theming
- ✅ Mobile-optimized camera UI
- ✅ HTTPS enabled
- ✅ Security rules implemented

### Phase 4 Goals
- ⏳ Video submissions working
- ⏳ GPS validation implemented
- ⏳ Quiz submissions working
- ⏳ 90%+ mobile compatibility

### Production Readiness
- ⏳ All task types working
- ⏳ Admin dashboard complete
- ⏳ Real-time leaderboard live
- ⏳ 95%+ test coverage
- ⏳ Performance optimized
- ⏳ Documentation complete

---

**Last Updated:** December 3, 2025  
**Current Phase:** Phase 4 - Additional Task Types  
**Next Milestone:** Video & GPS submissions complete
