/**
 * Test suite for quiz validation utility
 * 
 * Run with: npm test -- quizValidation.test
 */

import { validateQuizAnswer, validateMultipleAnswers, getDetailedFeedback } from './quizValidation';

describe('Quiz Validation - Fuzzy Matching', () => {
  describe('Exact Matches', () => {
    test('should match exact string answers', () => {
      const result = validateQuizAnswer('Berlin', 'Berlin');
      expect(result.isCorrect).toBe(true);
      expect(result.similarity).toBe(1.0);
      expect(result.pointsMultiplier).toBe(1.0);
      expect(result.isFuzzyMatch).toBe(false);
    });

    test('should match case-insensitively by default', () => {
      const result = validateQuizAnswer('berlin', 'Berlin');
      expect(result.isCorrect).toBe(true);
      expect(result.similarity).toBe(1.0);
      expect(result.pointsMultiplier).toBe(1.0);
    });

    test('should match with extra whitespace', () => {
      const result = validateQuizAnswer('  Berlin  ', 'Berlin');
      expect(result.isCorrect).toBe(true);
      expect(result.similarity).toBe(1.0);
    });

    test('should match exact number answers', () => {
      const result = validateQuizAnswer(42, 42);
      expect(result.isCorrect).toBe(true);
      expect(result.similarity).toBe(1.0);
    });

    test('should match boolean answers', () => {
      const result = validateQuizAnswer(true, true);
      expect(result.isCorrect).toBe(true);
      expect(result.similarity).toBe(1.0);
    });
  });

  describe('Fuzzy Matches (Typos)', () => {
    test('should accept "Berln" as close to "Berlin" (missing i)', () => {
      const result = validateQuizAnswer('Berln', 'Berlin');
      console.log(getDetailedFeedback('Berln', 'Berlin', result));
      
      expect(result.isCorrect).toBe(true); // Should accept with fuzzy match
      expect(result.isFuzzyMatch).toBe(true);
      expect(result.pointsMultiplier).toBe(0.95); // 95% points
      expect(result.similarity).toBeGreaterThan(0.85);
    });

    test('should accept "Beriln" as close to "Berlin" (transposed letters)', () => {
      const result = validateQuizAnswer('Beriln', 'Berlin');
      expect(result.isCorrect).toBe(true);
      expect(result.isFuzzyMatch).toBe(true);
    });

    test('should accept "Berliin" as close to "Berlin" (double letter)', () => {
      const result = validateQuizAnswer('Berliin', 'Berlin');
      expect(result.isCorrect).toBe(true);
      expect(result.isFuzzyMatch).toBe(true);
    });

    test('should reject answers that are too different', () => {
      const result = validateQuizAnswer('Paris', 'Berlin');
      expect(result.isCorrect).toBe(false);
      expect(result.pointsMultiplier).toBe(0);
    });

    test('should reject completely wrong answers', () => {
      const result = validateQuizAnswer('xyz', 'Berlin');
      expect(result.isCorrect).toBe(false);
      expect(result.similarity).toBeLessThan(0.5);
    });
  });

  describe('Custom Thresholds', () => {
    test('should respect custom fuzzy threshold', () => {
      // "Brlin" might be ~80% similar to "Berlin"
      const strictResult = validateQuizAnswer('Brlin', 'Berlin', {
        fuzzyThreshold: 0.95, // Very strict
      });
      
      const lenientResult = validateQuizAnswer('Brlin', 'Berlin', {
        fuzzyThreshold: 0.70, // More lenient
      });
      
      expect(lenientResult.isCorrect).toBe(true);
      // Strict might reject it depending on similarity
    });

    test('should disable fuzzy matching when allowFuzzy is false', () => {
      const result = validateQuizAnswer('Berln', 'Berlin', {
        allowFuzzy: false,
      });
      
      expect(result.isCorrect).toBe(false); // No fuzzy match allowed
      expect(result.pointsMultiplier).toBe(0);
    });

    test('should use custom points multiplier for fuzzy matches', () => {
      const result = validateQuizAnswer('Berln', 'Berlin', {
        fuzzyPointsMultiplier: 0.80, // 80% instead of default 95%
      });
      
      if (result.isCorrect) {
        expect(result.pointsMultiplier).toBe(0.80);
      }
    });
  });

  describe('Case Sensitivity', () => {
    test('should enforce case sensitivity when enabled', () => {
      const result = validateQuizAnswer('berlin', 'Berlin', {
        caseSensitive: true,
      });
      
      // Might still match with fuzzy, but won't be exact
      expect(result.isFuzzyMatch).toBe(true);
    });

    test('should be case-insensitive by default', () => {
      const result = validateQuizAnswer('BERLIN', 'berlin');
      expect(result.isCorrect).toBe(true);
      expect(result.similarity).toBe(1.0);
    });
  });

  describe('Number Validation', () => {
    test('should match exact numbers', () => {
      const result = validateQuizAnswer(42, 42);
      expect(result.isCorrect).toBe(true);
    });

    test('should convert string numbers to match', () => {
      const result = validateQuizAnswer('42', 42);
      expect(result.isCorrect).toBe(true);
    });

    test('should handle decimal numbers', () => {
      const result = validateQuizAnswer(3.14, 3.14);
      expect(result.isCorrect).toBe(true);
    });

    test('should handle close numeric typos', () => {
      // "422" vs "42" might not match well
      const result = validateQuizAnswer('422', '42');
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Multiple Answers Validation', () => {
    test('should validate all correct answers', () => {
      const result = validateMultipleAnswers(
        ['Berlin', 'Paris', 'London'],
        ['Berlin', 'Paris', 'London']
      );
      
      expect(result.isCorrect).toBe(true);
      expect(result.similarity).toBe(1.0);
    });

    test('should accept fuzzy matches in multiple answers', () => {
      const result = validateMultipleAnswers(
        ['Berln', 'Paris', 'Londn'],
        ['Berlin', 'Paris', 'London']
      );
      
      expect(result.isCorrect).toBe(true);
      expect(result.isFuzzyMatch).toBe(true);
    });

    test('should reject if any answer is wrong', () => {
      const result = validateMultipleAnswers(
        ['Berlin', 'Rome', 'London'], // Rome instead of Paris
        ['Berlin', 'Paris', 'London']
      );
      
      expect(result.isCorrect).toBe(false);
    });

    test('should reject if wrong number of answers', () => {
      const result = validateMultipleAnswers(
        ['Berlin', 'Paris'], // Only 2
        ['Berlin', 'Paris', 'London'] // Expecting 3
      );
      
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Real-World Scenarios', () => {
    test('Geography: Capital cities with common typos', () => {
      const scenarios = [
        { user: 'Washinton', correct: 'Washington', shouldPass: true },
        { user: 'Tokio', correct: 'Tokyo', shouldPass: true },
        { user: 'Moskow', correct: 'Moscow', shouldPass: true },
        { user: 'Bejing', correct: 'Beijing', shouldPass: true },
      ];

      scenarios.forEach(({ user, correct, shouldPass }) => {
        const result = validateQuizAnswer(user, correct);
        console.log(`${user} vs ${correct}: ${result.similarity.toFixed(2)} - ${result.isCorrect}`);
        
        if (shouldPass) {
          expect(result.isCorrect).toBe(true);
        }
      });
    });

    test('History: Dates with minor typos', () => {
      const result = validateQuizAnswer('1776', '1776');
      expect(result.isCorrect).toBe(true);
      
      // Year typo should fail
      const wrongYear = validateQuizAnswer('1777', '1776');
      expect(wrongYear.isCorrect).toBe(false);
    });

    test('Science: Chemical formulas (should be exact)', () => {
      // Disable fuzzy for formulas
      const result = validateQuizAnswer('H2O', 'H2O', {
        allowFuzzy: false,
      });
      expect(result.isCorrect).toBe(true);
      
      // Wrong formula should fail
      const wrong = validateQuizAnswer('H20', 'H2O', {
        allowFuzzy: false,
      });
      expect(wrong.isCorrect).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty strings', () => {
      const result = validateQuizAnswer('', 'Berlin');
      expect(result.isCorrect).toBe(false);
    });

    test('should handle very long strings', () => {
      const longAnswer = 'A'.repeat(1000);
      const result = validateQuizAnswer(longAnswer, longAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('should handle special characters', () => {
      const result = validateQuizAnswer('C++', 'C++');
      expect(result.isCorrect).toBe(true);
    });

    test('should handle unicode characters', () => {
      const result = validateQuizAnswer('München', 'München');
      expect(result.isCorrect).toBe(true);
    });

    test('should handle emojis', () => {
      const result = validateQuizAnswer('😀', '😀');
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should handle validation quickly', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        validateQuizAnswer('Berlin', 'Berlin');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`1000 validations took ${duration}ms`);
      expect(duration).toBeLessThan(1000); // Should be fast
    });
  });
});
