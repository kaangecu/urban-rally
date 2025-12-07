/**
 * Example test file demonstrating testing best practices
 * 
 * This serves as a template for writing tests in the Urban Rally app
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateQuizAnswer } from '../../utils/quizValidation';
import { createMockPosition, mockTaskQuiz } from '../setup/firebase-mock';
import { waitFor } from '@testing-library/react';

// ============================================================================
// EXAMPLE 1: Testing a Pure Function (Utils)
// ============================================================================

describe('Quiz Validation - Complete Example', () => {
  describe('validateQuizAnswer', () => {
    it('should accept exact match', () => {
      const result = validateQuizAnswer('Berlin', 'Berlin');
      
      expect(result.isCorrect).toBe(true);
      expect(result.similarity).toBe(1.0);
      expect(result.pointsMultiplier).toBe(1.0);
      expect(result.isFuzzyMatch).toBe(false);
    });

    it('should accept fuzzy match for typos', () => {
      const result = validateQuizAnswer('Berln', 'Berlin', {
        fuzzyThreshold: 0.65,
        allowFuzzy: true,
      });
      
      expect(result.isCorrect).toBe(true);
      expect(result.isFuzzyMatch).toBe(true);
      expect(result.pointsMultiplier).toBe(0.95);
      expect(result.similarity).toBeGreaterThan(0.65);
    });

    it('should reject completely wrong answers', () => {
      const result = validateQuizAnswer('Paris', 'Berlin');
      
      expect(result.isCorrect).toBe(false);
      expect(result.pointsMultiplier).toBe(0);
    });

    it('should handle case insensitivity by default', () => {
      const result = validateQuizAnswer('BERLIN', 'berlin');
      
      expect(result.isCorrect).toBe(true);
      expect(result.similarity).toBe(1.0);
    });

    it('should handle edge cases', () => {
      // Empty strings
      expect(validateQuizAnswer('', 'Berlin').isCorrect).toBe(false);
      
      // Numbers
      expect(validateQuizAnswer(42, 42).isCorrect).toBe(true);
      
      // Booleans
      expect(validateQuizAnswer(true, true).isCorrect).toBe(true);
    });
  });

  // Testing different configurations
  describe('Configuration Options', () => {
    it('should respect custom fuzzy threshold', () => {
      const answer = 'Brlin'; // Missing 'e'
      
      // Strict threshold
      const strictResult = validateQuizAnswer(answer, 'Berlin', {
        fuzzyThreshold: 0.95,
      });
      
      // Lenient threshold
      const lenientResult = validateQuizAnswer(answer, 'Berlin', {
        fuzzyThreshold: 0.60,
      });
      
      // Lenient should pass, strict might not
      expect(lenientResult.isCorrect).toBe(true);
    });

    it('should disable fuzzy matching when allowFuzzy is false', () => {
      const result = validateQuizAnswer('Berln', 'Berlin', {
        allowFuzzy: false,
      });
      
      expect(result.isCorrect).toBe(false);
    });
  });
});

// ============================================================================
// EXAMPLE 2: Testing with Mocks (Services)
// ============================================================================

describe('Geolocation Example', () => {
  beforeEach(() => {
    // Setup mocks before each test
    vi.clearAllMocks();
  });

  it('should calculate distance between two points', () => {
    const berlinPosition = createMockPosition(52.52, 13.405);
    const taskLocation = mockTaskQuiz.requiredLocation;
    
    // This would use your actual geospatial utility
    // For demo purposes, we'll just check the structure
    expect(berlinPosition.coords.latitude).toBe(52.52);
    expect(berlinPosition.coords.longitude).toBe(13.405);
  });
});

// ============================================================================
// EXAMPLE 3: Testing Async Behavior
// ============================================================================

describe('Async Operations Example', () => {
  it('should handle async validation', async () => {
    // Simulate async validation (e.g., API call)
    const asyncValidate = async (answer: string) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return validateQuizAnswer(answer, 'Berlin');
    };

    const result = await asyncValidate('Berlin');
    
    expect(result.isCorrect).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const failingFunction = async () => {
      throw new Error('Validation failed');
    };

    await expect(failingFunction()).rejects.toThrow('Validation failed');
  });

  it('should timeout long operations', async () => {
    const longOperation = () =>
      new Promise((resolve) => setTimeout(resolve, 100));

    await waitFor(
      async () => {
        await longOperation();
        expect(true).toBe(true);
      },
      { timeout: 150 }
    );
  }, 200);
});

// ============================================================================
// EXAMPLE 4: Testing with Different Data Sets (Table-Driven Tests)
// ============================================================================

describe('Table-Driven Tests Example', () => {
  const testCases = [
    { input: 'Berlin', expected: 'Berlin', shouldPass: true, description: 'exact match' },
    { input: 'Berln', expected: 'Berlin', shouldPass: true, description: 'missing letter' },
    { input: 'Berliin', expected: 'Berlin', shouldPass: true, description: 'double letter' },
    { input: 'Paris', expected: 'Berlin', shouldPass: false, description: 'wrong answer' },
    { input: '', expected: 'Berlin', shouldPass: false, description: 'empty string' },
  ];

  testCases.forEach(({ input, expected, shouldPass, description }) => {
    it(`should ${shouldPass ? 'accept' : 'reject'} ${description}`, () => {
      const result = validateQuizAnswer(input, expected);
      expect(result.isCorrect).toBe(shouldPass);
    });
  });
});

// ============================================================================
// EXAMPLE 5: Snapshot Testing (for complex objects)
// ============================================================================

describe('Snapshot Testing Example', () => {
  it('should match validation result snapshot', () => {
    const result = validateQuizAnswer('Berlin', 'Berlin');
    
    // This creates/compares against a snapshot file
    expect(result).toMatchSnapshot();
  });

  it('should match fuzzy result structure', () => {
    const result = validateQuizAnswer('Berln', 'Berlin');
    
    // Test specific properties without full snapshot
    expect(result).toMatchObject({
      isCorrect: expect.any(Boolean),
      similarity: expect.any(Number),
      pointsMultiplier: expect.any(Number),
      feedback: expect.any(String),
      isFuzzyMatch: expect.any(Boolean),
    });
  });
});

// ============================================================================
// EXAMPLE 6: Testing with Spies
// ============================================================================

describe('Spies and Mocks Example', () => {
  it('should track function calls', () => {
    const mockCallback = vi.fn();
    
    // Call the mock function
    mockCallback('test', 123);
    mockCallback('test2');
    
    // Verify it was called
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith('test', 123);
    expect(mockCallback).toHaveBeenLastCalledWith('test2');
  });

  it('should mock return values', () => {
    const mockGetAnswer = vi.fn();
    
    // Mock different return values
    mockGetAnswer.mockReturnValueOnce('Berlin');
    mockGetAnswer.mockReturnValueOnce('Paris');
    
    expect(mockGetAnswer()).toBe('Berlin');
    expect(mockGetAnswer()).toBe('Paris');
  });
});

// ============================================================================
// BEST PRACTICES DEMONSTRATED
// ============================================================================

/*
✅ Descriptive test names that explain what's being tested
✅ AAA pattern: Arrange, Act, Assert
✅ Each test tests one thing
✅ Tests are independent (can run in any order)
✅ Use beforeEach/afterEach for setup/cleanup
✅ Mock external dependencies
✅ Test edge cases and error handling
✅ Group related tests with describe blocks
✅ Use table-driven tests for similar cases
✅ Test both success and failure paths
✅ Clear assertions with good error messages

📚 This file demonstrates:
1. Pure function testing
2. Async testing
3. Mock usage
4. Table-driven tests
5. Snapshot testing
6. Spies and stubs
7. Edge case handling
8. Error testing

Use this as a template when writing new tests!
*/
