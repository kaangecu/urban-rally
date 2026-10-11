# Testing Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
chmod +x scripts/setup-testing.sh
./scripts/setup-testing.sh
```

Or manually:
```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  jsdom @faker-js/faker msw @playwright/test
```

### Step 2: Update package.json

Add these scripts (already in the strategy doc):
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Step 3: Run Your First Test

The quiz validation test already exists! Just run:

```bash
npm test
```

## 📝 Writing Your First Test

### Example: Testing a Utility Function

Create `src/utils/example.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Example Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run it:
```bash
npm test example
```

### Example: Testing a React Component

Create `src/components/Button.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../__tests__/setup/test-utils';

function Button({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick}>{label}</button>;
}

describe('Button', () => {
  it('should render with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = render(<Button label="Click" onClick={onClick} />);
    
    await user.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

## 🎯 Common Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage

# Run specific test file
npm test quizValidation

# Run E2E tests
npm run test:e2e
```

## 📊 Coverage Report

After running `npm run test:coverage`, open:
```
coverage/index.html
```

## 🐛 Debugging Tests

### VS Code Debugger

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Console Debugging

Add `console.log()` in your tests or:
```typescript
it('should debug', () => {
  const result = myFunction();
  console.log('Result:', result);
  expect(result).toBe('expected');
});
```

## 📚 Next Steps

1. ✅ Read `docs/TESTING_STRATEGY.md` - Complete strategy
2. ✅ Start with high-priority tests (quiz validation, auth)
3. ✅ Aim for 80% coverage on critical paths
4. ✅ Write tests alongside new features

## 🆘 Troubleshooting

### Issue: "Cannot find module 'vitest'"
**Solution:** Run the setup script or install dependencies

### Issue: "TypeError: window.matchMedia is not a function"
**Solution:** Already mocked in `test-setup.ts`

### Issue: "Navigator.geolocation is undefined"
**Solution:** Already mocked in `test-setup.ts`

### Issue: Tests are slow
**Solution:** 
- Use `vi.mock()` for heavy imports
- Reduce test timeout if not needed
- Run specific test files instead of all

## 💡 Tips

- **Write tests first (TDD)** - Helps clarify requirements
- **Test behavior, not implementation** - Makes refactoring easier
- **Use descriptive test names** - Makes failures easier to understand
- **Keep tests isolated** - Each test should be independent
- **Mock external dependencies** - Firebase, APIs, etc.

## 📖 Full Documentation

See `docs/TESTING_STRATEGY.md` for:
- Complete folder structure
- All test categories
- Templates for every test type
- Best practices
- CI/CD integration
- And much more!

---

**Happy Testing! 🧪**
