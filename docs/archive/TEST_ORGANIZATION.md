# Test File Organization - Best Practices

**Updated:** December 7, 2025  
**Applies to:** Urban Rally Testing Strategy

---

## 🎯 TL;DR - Where Do Tests Go?

| Type | Location | Example |
|------|----------|---------|
| **Unit Tests** | Next to source file | `Button.tsx` → `Button.test.tsx` |
| **Integration Tests** | `__tests__/` in feature folder | `features/auth/__tests__/auth-flow.integration.test.tsx` |
| **E2E Tests** | `src/__tests__/e2e/` | `src/__tests__/e2e/login.e2e.test.ts` |
| **Test Setup** | `src/__tests__/setup/` | `src/__tests__/setup/test-setup.ts` |
| **Test Examples** | `src/__tests__/examples/` | `src/__tests__/examples/comprehensive-test-template.test.ts` |

---

## 📚 Industry Best Practice: Co-located Tests

### Why Co-location?

✅ **Discoverability** - Test is right next to the code it tests  
✅ **Maintainability** - When you change code, test is right there  
✅ **Refactoring** - Moving/renaming files keeps tests together  
✅ **Context** - Import paths are simple (`./myFunction` not `../../../`)  
✅ **Team Standard** - Used by React, Vue, Angular, and most modern projects

### What is Co-location?

Put the test file **in the same directory** as the file it tests:

```
✅ CORRECT - Co-located
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx          ← RIGHT HERE
├── utils/
│   ├── validation.ts
│   └── validation.test.ts       ← RIGHT HERE
└── services/
    ├── api.service.ts
    └── api.service.test.ts      ← RIGHT HERE

❌ WRONG - Separated
src/
├── components/
│   └── Button.tsx
├── utils/
│   └── validation.ts
└── __tests__/                   ← DON'T DO THIS
    ├── Button.test.tsx          ← Hard to find
    └── validation.test.ts       ← Hard to maintain
```

---

## 🗂️ Complete Folder Structure

### Real Example from Urban Rally

```
src/
├── components/
│   ├── navigation/
│   │   ├── BottomNav.tsx
│   │   └── BottomNav.test.tsx                    ← Unit test
│   └── legal/
│       ├── LegalModal.tsx
│       └── LegalModal.test.tsx                   ← Unit test
│
├── features/
│   ├── auth/
│   │   ├── TeamCodeLogin.tsx
│   │   ├── TeamCodeLogin.test.tsx                ← Unit test
│   │   └── __tests__/
│   │       └── auth-flow.integration.test.tsx    ← Integration test
│   │
│   ├── tasks/
│   │   ├── TaskList.tsx
│   │   ├── TaskList.test.tsx                     ← Unit test
│   │   ├── TaskCard.tsx
│   │   ├── TaskCard.test.tsx                     ← Unit test
│   │   └── __tests__/
│   │       └── task-completion.integration.test.tsx
│   │
│   └── submissions/
│       ├── QuizInput.tsx
│       ├── QuizInput.test.tsx                    ← Unit test
│       └── __tests__/
│           └── quiz-validation.integration.test.tsx
│
├── services/
│   ├── firebase.service.ts
│   ├── firebase.service.test.ts                  ← Unit test
│   ├── task.service.ts
│   └── task.service.test.ts                      ← Unit test
│
├── store/
│   ├── authStore.ts
│   ├── authStore.test.ts                         ← Unit test
│   ├── taskStore.ts
│   └── taskStore.test.ts                         ← Unit test
│
├── utils/
│   ├── quizValidation.ts
│   ├── quizValidation.test.ts                    ← Unit test
│   ├── geospatial.ts
│   └── geospatial.test.ts                        ← Unit test
│
├── hooks/
│   ├── useTeamSync.ts
│   └── useTeamSync.test.ts                       ← Unit test
│
└── __tests__/                                     ← Global test infrastructure
    ├── e2e/                                       ← E2E tests only
    │   ├── auth.e2e.test.ts
    │   ├── task-completion.e2e.test.ts
    │   └── quiz-submission.e2e.test.ts
    │
    ├── examples/                                  ← Templates & examples
    │   ├── README.md
    │   └── comprehensive-test-template.test.ts
    │
    └── setup/                                     ← Global setup
        ├── test-setup.ts
        ├── test-utils.tsx
        └── firebase-mock.ts
```

---

## 📋 Rules of Thumb

### Unit Tests (90% of your tests)
```typescript
// ✅ DO: Put next to source file
src/utils/validation.ts
src/utils/validation.test.ts

// ❌ DON'T: Put in separate folder
src/utils/validation.ts
src/__tests__/utils/validation.test.ts
```

### Integration Tests
```typescript
// ✅ DO: Put in __tests__/ within feature
src/features/auth/
├── LoginForm.tsx
├── LoginForm.test.tsx                    ← Unit test
└── __tests__/
    └── auth-flow.integration.test.tsx    ← Integration test

// ❌ DON'T: Put with unit tests (confusing)
src/features/auth/
├── LoginForm.tsx
├── LoginForm.test.tsx
└── auth-flow.integration.test.tsx        ← Hard to distinguish
```

### E2E Tests
```typescript
// ✅ DO: Put in global __tests__/e2e/
src/__tests__/e2e/login.e2e.test.ts

// ❌ DON'T: Put with feature tests
src/features/auth/login.e2e.test.ts
```

### Test Setup/Utilities
```typescript
// ✅ DO: Put in global __tests__/setup/
src/__tests__/setup/
├── test-setup.ts
├── test-utils.tsx
└── firebase-mock.ts

// ❌ DON'T: Put in random places
src/test-setup.ts
src/utils/test-utils.tsx
```

### Examples/Templates
```typescript
// ✅ DO: Put in __tests__/examples/ (excluded from test runs)
src/__tests__/examples/
├── README.md
└── comprehensive-test-template.test.ts

// ❌ DON'T: Put with real code (causes confusion)
src/utils/__example__.test.ts             ← Looks like a real test!
```

---

## 🔍 Why This Matters

### Before (Bad Organization)
```
src/
├── components/
│   └── Button.tsx
└── utils/
    ├── validation.ts
    └── __example__.test.ts    ← What is this testing?!
```

**Problems:**
- ❌ Is `__example__.test.ts` testing `validation.ts`? 
- ❌ Where's the test for `Button.tsx`?
- ❌ Is this a real test or an example?
- ❌ Will it run when I do `npm test`?

### After (Good Organization)
```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx           ← Clear: tests Button
├── utils/
│   ├── validation.ts
│   └── validation.test.ts        ← Clear: tests validation
└── __tests__/
    └── examples/
        └── comprehensive-test-template.test.ts  ← Clear: example
```

**Benefits:**
- ✅ Clear what each test file tests
- ✅ Examples separated from real tests
- ✅ Examples excluded from test runs
- ✅ Easy to find related tests

---

## 🚀 Quick Reference

### Creating a New Test

**For a Component:**
```bash
# Creating: src/components/Header.tsx
# Also create: src/components/Header.test.tsx
cd src/components
touch Header.test.tsx
```

**For a Utility:**
```bash
# Creating: src/utils/formatDate.ts
# Also create: src/utils/formatDate.test.ts
cd src/utils
touch formatDate.test.ts
```

**For Integration:**
```bash
# Testing: src/features/auth/ flow
# Create: src/features/auth/__tests__/auth-flow.integration.test.tsx
cd src/features/auth
mkdir -p __tests__
cd __tests__
touch auth-flow.integration.test.tsx
```

### Running Specific Tests

```bash
# Run all Button tests
npm test Button

# Run all auth tests
npm test auth

# Run integration tests only
npm test integration

# Run E2E tests only
npm test e2e
```

---

## 📖 References

### Official Guidelines
- [Vitest Guide](https://vitest.dev/guide/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Kent C. Dodds - Test Location](https://kentcdodds.com/blog/colocation)

### Project Documentation
- **Full Strategy:** `/docs/TESTING_STRATEGY.md`
- **Quick Start:** `/docs/TESTING_QUICK_START.md`
- **Implementation:** `/docs/TESTING_IMPLEMENTATION_SUMMARY.md`
- **Examples:** `/src/__tests__/examples/README.md`

---

## ❓ FAQ

**Q: Where do I put component tests?**  
A: Next to the component: `Button.tsx` → `Button.test.tsx`

**Q: Where do I put utility tests?**  
A: Next to the utility: `validation.ts` → `validation.test.ts`

**Q: Where do I put integration tests?**  
A: In `__tests__/` within the feature folder: `features/auth/__tests__/`

**Q: Where do I put E2E tests?**  
A: In `src/__tests__/e2e/`

**Q: Where do I put test setup files?**  
A: In `src/__tests__/setup/`

**Q: Where do I put example tests?**  
A: In `src/__tests__/examples/` (they're excluded from runs)

**Q: Can I use a `__tests__/` folder for everything?**  
A: You *can*, but it's not recommended. Co-located tests are the industry standard.

**Q: Why not put all tests in one folder?**  
A: Hard to maintain, poor discoverability, complex imports, not standard practice.

---

## ✅ Checklist

Before creating a test, ask yourself:

- [ ] Is this a unit test? → Put it next to the source file
- [ ] Is this an integration test? → Put it in `__tests__/` in the feature folder
- [ ] Is this an E2E test? → Put it in `src/__tests__/e2e/`
- [ ] Is this a test utility? → Put it in `src/__tests__/setup/`
- [ ] Is this an example? → Put it in `src/__tests__/examples/`

**When in doubt:** Put the test next to the file it tests. ✨
