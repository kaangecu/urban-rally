# Test Examples and Templates

This directory contains comprehensive test templates and examples to help you write tests for the Urban Rally application.

## 📁 What's in this directory?

**`comprehensive-test-template.test.ts`**
- Complete testing reference guide
- Demonstrates all testing patterns:
  - ✅ Unit tests for pure functions
  - ✅ Testing with mocks (geolocation, timers)
  - ✅ Async operations and promises
  - ✅ Table-driven tests
  - ✅ Snapshot testing
  - ✅ Spies and mock functions
- **Use this file as a reference, but don't modify it**
- Copy patterns from here to your actual test files

## 🎯 How to use these examples

### For Unit Tests
Copy patterns from the "Pure Function Testing" section:
```typescript
// Example: Testing utils/myFunction.ts
// Create: utils/myFunction.test.ts (next to the source file)

import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### For Component Tests
Copy patterns from the "React Component Testing" section:
```typescript
// Example: Testing components/Button.tsx
// Create: components/Button.test.tsx (next to the component)

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### For Integration Tests
Create a `__tests__/` subdirectory within your feature:
```typescript
// Example: Testing auth flow
// Create: features/auth/__tests__/auth-flow.integration.test.ts

import { describe, it, expect } from 'vitest';
// ... test auth flow across multiple components
```

## 📝 Important Notes

1. **Don't put real tests in this directory** - This is for examples only
2. **Co-locate your tests** - Put test files next to the source files they test
3. **Use meaningful names** - `Button.test.tsx`, not `test1.tsx`
4. **Run specific tests** - Use `npm test Button` to run only Button tests

## 🔗 Related Documentation

- **Testing Strategy:** `/docs/TESTING_STRATEGY.md` - Complete testing guide
- **Quick Start:** `/docs/TESTING_QUICK_START.md` - Get started in 5 minutes
- **Test Setup:** `/src/__tests__/setup/` - Global test configuration

## 💡 Pro Tips

- Copy the patterns you need, don't copy entire test files
- Adapt examples to your specific use case
- Keep tests simple and focused
- Use descriptive test names that explain what's being tested
- Group related tests with `describe` blocks
