/**
 * Quiz Answer Validation Utility
 * 
 * Provides fuzzy matching for quiz answers to handle typos gracefully
 * while maintaining strict validation when needed.
 * 
 * Phase 2 Implementation: Fuzzy Matching with string-similarity
 */

import { compareTwoStrings } from 'string-similarity';

/**
 * Configuration options for quiz answer validation
 */
export interface QuizValidationOptions {
  /**
   * Whether to match case-sensitively
   * @default false
   */
  caseSensitive?: boolean;
  
  /**
   * Similarity threshold for fuzzy matching (0.0 - 1.0)
   * 0.85 = 85% similar (recommended for typos)
   * @default 0.85
   */
  fuzzyThreshold?: number;
  
  /**
   * Whether to allow fuzzy matching at all
   * Set to false for exact-match-only questions
   * @default true
   */
  allowFuzzy?: boolean;
  
  /**
   * Points multiplier for fuzzy matches (0.0 - 1.0)
   * @default 0.95 (95% of points for close matches)
   */
  fuzzyPointsMultiplier?: number;
}

/**
 * Result of quiz answer validation
 */
export interface QuizValidationResult {
  /**
   * Whether the answer is considered correct
   * (either exact match or fuzzy match above threshold)
   */
  isCorrect: boolean;
  
  /**
   * Similarity score between 0.0 and 1.0
   * 1.0 = exact match, 0.0 = completely different
   */
  similarity: number;
  
  /**
   * Points multiplier to apply (0.0 - 1.0)
   * 1.0 for exact matches, fuzzyPointsMultiplier for fuzzy matches
   */
  pointsMultiplier: number;
  
  /**
   * Feedback message for the user
   */
  feedback: string;
  
  /**
   * Whether this was a fuzzy match (vs exact match)
   */
  isFuzzyMatch: boolean;
}

/**
 * Default validation options
 */
const DEFAULT_OPTIONS: Required<QuizValidationOptions> = {
  caseSensitive: false,
  fuzzyThreshold: 0.65, // 65% similarity - balanced for common typos
  allowFuzzy: true,
  fuzzyPointsMultiplier: 0.95,
};

/**
 * Normalize a string for comparison
 */
function normalizeString(value: string | number | boolean, caseSensitive: boolean): string {
  const str = String(value).trim();
  return caseSensitive ? str : str.toLowerCase();
}

/**
 * Validate a quiz answer with fuzzy matching support
 * 
 * @param userAnswer - The answer provided by the user
 * @param correctAnswer - The correct answer to compare against
 * @param options - Validation options
 * @returns Validation result with correctness, similarity, and feedback
 * 
 * @example
 * ```typescript
 * // Exact match
 * const result1 = validateQuizAnswer('Berlin', 'Berlin');
 * // { isCorrect: true, similarity: 1.0, pointsMultiplier: 1.0, ... }
 * 
 * // Typo with fuzzy match
 * const result2 = validateQuizAnswer('Berln', 'Berlin');
 * // { isCorrect: true, similarity: 0.91, pointsMultiplier: 0.95, isFuzzyMatch: true, ... }
 * 
 * // Too different
 * const result3 = validateQuizAnswer('Paris', 'Berlin');
 * // { isCorrect: false, similarity: 0.18, pointsMultiplier: 0, ... }
 * ```
 */
export function validateQuizAnswer(
  userAnswer: string | number | boolean,
  correctAnswer: string | number | boolean,
  options: QuizValidationOptions = {}
): QuizValidationResult {
  // Merge with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Normalize both answers
  const userStr = normalizeString(userAnswer, opts.caseSensitive);
  const correctStr = normalizeString(correctAnswer, opts.caseSensitive);
  
  // Check for exact match first
  if (userStr === correctStr) {
    return {
      isCorrect: true,
      similarity: 1.0,
      pointsMultiplier: 1.0,
      feedback: '✅ Perfect match!',
      isFuzzyMatch: false,
    };
  }
  
  // If fuzzy matching is disabled, it's just wrong
  if (!opts.allowFuzzy) {
    return {
      isCorrect: false,
      similarity: 0.0,
      pointsMultiplier: 0.0,
      feedback: '❌ Incorrect answer',
      isFuzzyMatch: false,
    };
  }
  
  // Calculate similarity using Levenshtein distance
  const similarity = compareTwoStrings(userStr, correctStr);
  
  // Check if similarity meets threshold
  if (similarity >= opts.fuzzyThreshold) {
    return {
      isCorrect: true,
      similarity,
      pointsMultiplier: opts.fuzzyPointsMultiplier,
      feedback: `✅ Close enough! (${Math.round(similarity * 100)}% match)`,
      isFuzzyMatch: true,
    };
  }
  
  // Not close enough
  return {
    isCorrect: false,
    similarity,
    pointsMultiplier: 0.0,
    feedback: `❌ Incorrect (${Math.round(similarity * 100)}% match, need ${Math.round(opts.fuzzyThreshold * 100)}%)`,
    isFuzzyMatch: false,
  };
}

/**
 * Batch validate multiple answers (for multiple-choice questions)
 * 
 * @param userAnswers - Array of user answers
 * @param correctAnswers - Array of correct answers
 * @param options - Validation options
 * @returns Overall validation result
 */
export function validateMultipleAnswers(
  userAnswers: (string | number | boolean)[],
  correctAnswers: (string | number | boolean)[],
  options: QuizValidationOptions = {}
): QuizValidationResult {
  // If array lengths don't match, it's wrong
  if (userAnswers.length !== correctAnswers.length) {
    return {
      isCorrect: false,
      similarity: 0.0,
      pointsMultiplier: 0.0,
      feedback: '❌ Incorrect number of answers',
      isFuzzyMatch: false,
    };
  }
  
  // Validate each answer
  const results = userAnswers.map((userAnswer, index) => 
    validateQuizAnswer(userAnswer, correctAnswers[index], options)
  );
  
  // All must be correct
  const allCorrect = results.every(r => r.isCorrect);
  const anyFuzzy = results.some(r => r.isFuzzyMatch);
  const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
  const minMultiplier = Math.min(...results.map(r => r.pointsMultiplier));
  
  if (!allCorrect) {
    return {
      isCorrect: false,
      similarity: avgSimilarity,
      pointsMultiplier: 0.0,
      feedback: '❌ Some answers are incorrect',
      isFuzzyMatch: false,
    };
  }
  
  return {
    isCorrect: true,
    similarity: avgSimilarity,
    pointsMultiplier: minMultiplier, // Use lowest multiplier
    feedback: anyFuzzy ? '✅ All correct (some with typos)' : '✅ All perfect!',
    isFuzzyMatch: anyFuzzy,
  };
}

/**
 * Get detailed feedback for debugging/testing
 */
export function getDetailedFeedback(
  userAnswer: string | number | boolean,
  correctAnswer: string | number | boolean,
  result: QuizValidationResult
): string {
  return `
User Answer: "${userAnswer}"
Correct Answer: "${correctAnswer}"
Similarity: ${(result.similarity * 100).toFixed(1)}%
Is Correct: ${result.isCorrect}
Is Fuzzy Match: ${result.isFuzzyMatch}
Points Multiplier: ${(result.pointsMultiplier * 100).toFixed(0)}%
Feedback: ${result.feedback}
  `.trim();
}
