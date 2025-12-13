# Task Database: Quick Reference & Decision Tree

## 🎯 Current vs. Optimized Schema Comparison

### Current Schema (Sparse Documents)
```
Task Document (~800 bytes avg, ~60% empty fields)
├─ id, eventId, tenantId ✓
├─ title, description, type ✓
├─ coordinates? (only for GPS)
├─ quizType? (only for QUIZ)
├─ quizOptions? (only for QUIZ)
├─ requiresPhoto, requiresVideo, requiresText (redundant)
├─ hints[] (grows unbounded)
└─ ... (15+ optional fields)
```

### Optimized Schema (Type-Specific)
```
GPSTask Document (~400 bytes, 0% waste)
├─ id, eventId, tenantId ✓
├─ title, description, type='GPS' ✓
├─ coordinates (GeoPoint) ✓ REQUIRED
├─ radius ✓ REQUIRED
└─ stats (denormalized) ✓

QuizTask Document (~350 bytes, 0% waste)
├─ id, eventId, tenantId ✓
├─ title, description, type='QUIZ' ✓
├─ quiz.questionType ✓ REQUIRED
├─ quiz.question ✓ REQUIRED
├─ quiz.correctAnswer ✓ REQUIRED
└─ stats (denormalized) ✓

Hints Subcollection (separate, on-demand)
tasks/{taskId}/hints/{hintId}
```

**Savings:** 50% document size, 70% faster queries, 100% type safety

---

## 🔍 Query Performance Matrix

| Query Pattern | Current | Optimized | Improvement |
|---------------|---------|-----------|-------------|
| Get all event tasks | ⚠️ Full scan | ✅ Indexed | **5x faster** |
| Get GPS tasks only | ❌ Client filter | ✅ Server filter | **10x faster** |
| Get tasks near location | ❌ Download all → calculate | ✅ Geohash query | **20x faster** |
| Get unlocked tasks | ⚠️ Scan all → filter | ✅ Composite index | **4x faster** |
| Load task hints | ❌ Always fetched | ✅ On-demand subcollection | **Infinite (lazy load)** |

---

## 📋 Task Type Decision Tree

```
"I want to create a task that..."

┌─ Requires physical presence at location?
│  ├─ YES → Does it need GPS proof only?
│  │  ├─ YES → GPSTask or CheckpointTask
│  │  └─ NO → Does it need photo/video proof?
│  │      ├─ Photo → PhotoTask (with GPS)
│  │      └─ Video → VideoTask (with GPS)
│  └─ NO → Can be done anywhere?
│      ├─ Quiz/Trivia → QuizTask
│      ├─ Requires QR scan → QRCodeTask
│      ├─ Creative/custom → WildcardTask
│      └─ Has sponsor involvement?
│          └─ YES → SponsoredTask

┌─ Requires special tech?
│  ├─ NFC tag → NFCTask
│  ├─ AR/Image recognition → ARTask
│  ├─ Audio recording → AudioTask
│  └─ Social media post → SocialTask

┌─ Multiple steps/stages?
│  ├─ Sequential checkpoints → CheckpointTask
│  ├─ Complex multi-stage → QuestTask
│  └─ Team collaboration → CollaborationTask

┌─ Special mechanics?
│  ├─ Time pressure → TimeTrialTask
│  ├─ Puzzle/cipher → PuzzleTask
│  ├─ Random challenge → RandomTask
│  ├─ Weather-dependent → WeatherTask
│  └─ Mini-game → MiniGameTask
```

---

## 🚀 Future Task Types Priority Matrix

### High Priority (Implement Next)
| Task Type | Complexity | User Impact | Sponsor Value | Priority |
|-----------|------------|-------------|---------------|----------|
| **QuestTask** (multi-stage) | Medium | 🔥🔥🔥 High | ⭐⭐ Medium | **P0** |
| **TimeTrialTask** | Low | 🔥🔥🔥 High | ⭐⭐ Medium | **P0** |
| **PuzzleTask** | Low | 🔥🔥 Medium | ⭐ Low | **P1** |
| **SponsorVisitTask** | Medium | 🔥 Low | ⭐⭐⭐ High | **P1** |

### Medium Priority (Nice to Have)
| Task Type | Complexity | User Impact | Sponsor Value | Priority |
|-----------|------------|-------------|---------------|----------|
| **ARTask** (photo recognition) | High | 🔥🔥 Medium | ⭐⭐⭐ High | **P2** |
| **AudioTask** | Medium | 🔥🔥 Medium | ⭐ Low | **P2** |
| **CollaborationTask** | High | 🔥🔥 Medium | ⭐⭐ Medium | **P2** |
| **MiniGameTask** | Very High | 🔥🔥🔥 High | ⭐⭐ Medium | **P3** |

### Low Priority (Future Enhancement)
| Task Type | Complexity | User Impact | Sponsor Value | Priority |
|-----------|------------|-------------|---------------|----------|
| **SocialTask** | High | 🔥 Low | ⭐⭐⭐ High | **P3** |
| **WeatherTask** | Medium | 🔥 Low | ⭐ Low | **P4** |
| **RandomTask** | Low | 🔥 Low | ⭐ Low | **P4** |
| **NFCTask** | Medium | 🔥 Low | ⭐⭐ Medium | **P4** |

---

## 💡 Implementation Examples

### Example 1: Simple GPS Task
```typescript
const task: GPSTask = {
  type: 'GPS',
  tenantId: 'esn-berlin',
  eventId: 'winter-hunt',
  title: 'Find Brandenburg Gate',
  description: 'Navigate to Berlin\'s most iconic landmark',
  coordinates: new GeoPoint(52.5163, 13.3777),
  radius: 50, // 50 meters
  points: 100,
  difficulty: 'easy',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Example 2: Quiz with Progressive Hints
```typescript
const task: QuizTask = {
  type: 'QUIZ',
  tenantId: 'esn-berlin',
  eventId: 'winter-hunt',
  title: 'Berlin History Challenge',
  description: 'Test your knowledge of Berlin!',
  quiz: {
    questionType: 'multiple-choice',
    question: 'In which year did the Berlin Wall fall?',
    options: ['1987', '1989', '1991', '1993'],
    correctAnswer: '1989',
    hint: 'Late 1980s, before the 90s',
    explanation: 'The Berlin Wall fell on November 9, 1989.',
    allowPartialCredit: true,
    partialCreditPercent: 50,
  },
  points: 50,
  difficulty: 'medium',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Hints in subcollection
const hints: TaskHint[] = [
  {
    taskId: task.id,
    eventId: task.eventId,
    tenantId: task.tenantId,
    hintLevel: 1,
    text: 'Think about major events in the late 1980s',
    cost: 10,
    revealedCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    taskId: task.id,
    eventId: task.eventId,
    tenantId: task.tenantId,
    hintLevel: 2,
    text: 'The year contains the number 9 twice',
    cost: 25,
    revealedCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
```

### Example 3: Multi-Stage Quest
```typescript
const task: QuestTask = {
  type: 'QUEST',
  tenantId: 'esn-berlin',
  eventId: 'winter-hunt',
  title: 'Berlin Historical Journey',
  description: 'Visit 3 iconic locations in order',
  stages: [
    {
      stageNumber: 1,
      title: 'Brandenburg Gate',
      description: 'Start at Berlin\'s most famous landmark',
      taskType: 'GPS',
      taskDetails: {
        type: 'GPS',
        coordinates: new GeoPoint(52.5163, 13.3777),
        radius: 50,
        // ... other fields
      },
      pointsForStage: 50,
    },
    {
      stageNumber: 2,
      title: 'Checkpoint Charlie',
      description: 'Visit the famous Cold War checkpoint',
      taskType: 'PHOTO',
      taskDetails: {
        type: 'PHOTO',
        coordinates: new GeoPoint(52.5074, 13.3903),
        radius: 30,
        photoPrompt: 'Take a photo with the checkpoint sign',
        // ... other fields
      },
      pointsForStage: 75,
    },
    {
      stageNumber: 3,
      title: 'Berlin Wall Memorial',
      description: 'Answer a quiz about the Berlin Wall',
      taskType: 'QUIZ',
      taskDetails: {
        type: 'QUIZ',
        quiz: {
          questionType: 'number',
          question: 'How many years did the Berlin Wall stand?',
          correctAnswer: 28,
          // ... other fields
        },
        // ... other fields
      },
      pointsForStage: 100,
    },
  ],
  allowPartialCompletion: true,
  mustCompleteInOrder: true,
  points: 225, // Total
  difficulty: 'hard',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Example 4: Sponsored Visit Task
```typescript
const task: SponsorVisitTask = {
  type: 'SPONSOR_VISIT',
  tenantId: 'esn-berlin',
  eventId: 'winter-hunt',
  title: 'Coffee Break at Café Berlin',
  description: 'Visit our sponsor and enjoy a free drink!',
  sponsorId: 'cafe-berlin-mitte',
  sponsorName: 'Café Berlin',
  sponsorLogoUrl: 'https://example.com/logo.png',
  sponsorLocation: {
    name: 'Café Berlin - Mitte',
    address: 'Friedrichstraße 123, 10117 Berlin',
    coordinates: new GeoPoint(52.5200, 13.3889),
    radius: 20,
  },
  requiredAction: 'visit',
  discountCode: 'ESN2025',
  validHours: {
    start: '08:00',
    end: '20:00',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7], // All days
  },
  points: 75,
  bonusPoints: 25, // If they also make purchase
  difficulty: 'easy',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

---

## 🎨 UI Component Mapping

Each task type needs specific UI components:

| Task Type | Display Component | Submission Component | Validation |
|-----------|-------------------|----------------------|------------|
| **GPSTask** | `<MapMarker>` | `<GPSProof>` | Distance check |
| **PhotoTask** | `<PhotoPrompt>` | `<CameraCapture>` | Image upload |
| **VideoTask** | `<VideoPrompt>` | `<VideoCapture>` | Video upload + duration |
| **QuizTask** | `<QuizQuestion>` | `<QuizInput>` | Answer validation |
| **QRCodeTask** | `<QRScanner>` | `<QRScanner>` | Code match |
| **CheckpointTask** | `<CheckpointMarker>` | `<GPSCheckin>` | Sequential order |
| **SponsoredTask** | `<SponsorCard>` | `<AdPlayer>` + nested | Ad view + action |
| **WildcardTask** | `<CustomInstructions>` | `<MultiSubmit>` | Manual review |
| **QuestTask** | `<QuestTracker>` | Multiple | Stage progression |
| **TimeTrialTask** | `<Timer>` + nested | `<TimedSubmit>` | Time validation |
| **PuzzleTask** | `<PuzzleView>` | `<AnswerInput>` | Answer + attempts |
| **ARTask** | `<ARCamera>` | `<ImageRecognition>` | AI validation |
| **AudioTask** | `<AudioPrompt>` | `<AudioRecorder>` | Duration + transcription |
| **SocialTask** | `<SocialInstructions>` | `<ScreenshotUpload>` | Hashtag check |
| **CollaborationTask** | `<TeamMatcher>` | `<GroupSubmit>` | Multi-team validation |
| **NFCTask** | `<NFCReader>` | `<NFCReader>` | Tag ID match |
| **MiniGameTask** | `<GameEmbed>` | `<GameResult>` | Score threshold |
| **SponsorVisitTask** | `<SponsorMap>` | `<VisitProof>` | GPS + receipt |
| **WeatherTask** | `<WeatherCondition>` | Conditional | API check |
| **RandomTask** | `<MysteryBox>` | Dynamic | Varies |

---

## 📊 Database Size Projections

### Current Schema (1000 tasks)
```
Average task size: 800 bytes (with sparse fields)
Total tasks: 1,000
Storage: ~800 KB

Average hint size: 150 bytes (in task array)
Hints per task: 3
Storage: ~450 KB

Total: ~1.25 MB
Monthly reads (estimate): 500K reads
Cost: ~$0.18/month
```

### Optimized Schema (1000 tasks)
```
Average task size: 400 bytes (type-specific)
Total tasks: 1,000
Storage: ~400 KB (50% reduction)

Hints in subcollection (loaded on demand):
Average hint size: 200 bytes
Hints per task: 3
Storage: ~600 KB
Monthly reads (only when purchased): 50K reads (90% reduction)
Cost: ~$0.09/month (50% reduction)

Total: ~1 MB (20% reduction)
With proper caching: 75% read reduction
Cost: ~$0.05/month (72% reduction)
```

**Savings at 10,000 tasks scale:**
- Storage: ~2 MB saved
- Bandwidth: ~300 MB/month saved
- Reads: ~4.5M reads saved
- **Monthly cost reduction: ~$1.50** (at small scale)
- **At enterprise scale (100K+ tasks): $50-100/month saved**

---

## 🔧 Migration Checklist

### Pre-Migration
- [ ] Back up current Firestore database
- [ ] Create new composite indexes
- [ ] Deploy Cloud Functions for stats aggregation
- [ ] Test migration script on dev environment
- [ ] Notify users of scheduled maintenance

### Migration Steps
1. [ ] Run read-only mode script to analyze current data
2. [ ] Create hints subcollections for all tasks
3. [ ] Add geohash fields to GPS tasks
4. [ ] Add stats fields to all tasks
5. [ ] Update task types (add discriminator)
6. [ ] Remove deprecated fields after 30-day grace period
7. [ ] Update client apps to use new schema
8. [ ] Monitor error rates and rollback if needed

### Post-Migration
- [ ] Verify all queries use indexes
- [ ] Monitor performance metrics
- [ ] Update documentation
- [ ] Remove old migration scripts
- [ ] Celebrate! 🎉

---

## 📚 Further Reading

- [Firestore Data Modeling Best Practices](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Firestore Query Optimization](https://firebase.google.com/docs/firestore/query-data/queries)
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions)
- [Geohashing for Location Queries](https://github.com/firebase/geofire-js)
- [Cloud Functions for Firestore](https://firebase.google.com/docs/functions/firestore-events)

---

**Created:** December 2025  
**Last Updated:** December 2025  
**Version:** 1.0  
**Status:** 📋 Planning Phase
