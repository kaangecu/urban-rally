/**
 * Manual Test Script for Quiz Validation
 * 
 * Run with: npm exec tsx src/utils/quizValidation.manual-test.ts
 * Or: npx tsx src/utils/quizValidation.manual-test.ts
 */

import { validateQuizAnswer, getDetailedFeedback } from './quizValidation';

console.log('='.repeat(80));
console.log('QUIZ VALIDATION FUZZY MATCHING - MANUAL TEST SUITE');
console.log('='.repeat(80));
console.log();

// Test scenarios
const testCases = [
  // Exact matches
  {
    category: 'Exact Matches',
    tests: [
      { user: 'Berlin', correct: 'Berlin', expected: 'PASS' },
      { user: 'berlin', correct: 'Berlin', expected: 'PASS (case-insensitive)' },
      { user: '  Berlin  ', correct: 'Berlin', expected: 'PASS (whitespace)' },
      { user: 42, correct: 42, expected: 'PASS (number)' },
      { user: true, correct: true, expected: 'PASS (boolean)' },
    ],
  },
  
  // Fuzzy matches (typos)
  {
    category: 'Fuzzy Matches (Typos)',
    tests: [
      { user: 'Berln', correct: 'Berlin', expected: 'PASS (missing letter)' },
      { user: 'Beriln', correct: 'Berlin', expected: 'PASS (transposed)' },
      { user: 'Berliin', correct: 'Berlin', expected: 'PASS (double letter)' },
      { user: 'Brlin', correct: 'Berlin', expected: 'PASS/FAIL (missing vowel)' },
      { user: 'Washinton', correct: 'Washington', expected: 'PASS (common typo)' },
      { user: 'Tokio', correct: 'Tokyo', expected: 'PASS (alternate spelling)' },
      { user: 'Moskow', correct: 'Moscow', expected: 'PASS (common typo)' },
    ],
  },
  
  // Should fail
  {
    category: 'Wrong Answers (Should Fail)',
    tests: [
      { user: 'Paris', correct: 'Berlin', expected: 'FAIL (different city)' },
      { user: 'xyz', correct: 'Berlin', expected: 'FAIL (gibberish)' },
      { user: '1777', correct: '1776', expected: 'FAIL (wrong number)' },
      { user: '', correct: 'Berlin', expected: 'FAIL (empty)' },
    ],
  },
  
  // Points calculation
  {
    category: 'Points Calculation (100 point quiz)',
    tests: [
      { user: 'Berlin', correct: 'Berlin', expected: '100 points (exact)' },
      { user: 'Berln', correct: 'Berlin', expected: '95 points (fuzzy)' },
    ],
  },
];

// Run all test cases
let totalTests = 0;
let passedTests = 0;

testCases.forEach(({ category, tests }) => {
  console.log(`\n${category}`);
  console.log('-'.repeat(80));
  
  tests.forEach(({ user, correct, expected }) => {
    totalTests++;
    
    const result = validateQuizAnswer(user, correct);
    const basePoints = 100;
    const points = result.isCorrect 
      ? Math.floor(basePoints * result.pointsMultiplier)
      : 0;
    
    const passed = result.isCorrect === (expected.includes('PASS'));
    if (passed) passedTests++;
    
    const status = passed ? '✅' : '❌';
    const matchType = result.isFuzzyMatch ? 'FUZZY' : result.isCorrect ? 'EXACT' : 'WRONG';
    
    console.log(`${status} "${user}" → "${correct}"`);
    console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}% | ` +
                `Match: ${matchType} | Points: ${points} | Expected: ${expected}`);
    console.log(`   Feedback: ${result.feedback}`);
    console.log();
  });
});

console.log('='.repeat(80));
console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log('='.repeat(80));

// Detailed example
console.log('\n\nDETAILED EXAMPLE:');
console.log('-'.repeat(80));
const detailedResult = validateQuizAnswer('Berln', 'Berlin');
console.log(getDetailedFeedback('Berln', 'Berlin', detailedResult));

// Custom threshold examples
console.log('\n\nCUSTOM THRESHOLD EXAMPLES:');
console.log('-'.repeat(80));

const strictResult = validateQuizAnswer('Brlin', 'Berlin', {
  fuzzyThreshold: 0.95, // Very strict
});
console.log('Strict (95% threshold): "Brlin" → "Berlin"');
console.log(`  Result: ${strictResult.isCorrect ? 'PASS' : 'FAIL'} (${(strictResult.similarity * 100).toFixed(1)}%)`);

const lenientResult = validateQuizAnswer('Brlin', 'Berlin', {
  fuzzyThreshold: 0.70, // Lenient
});
console.log('Lenient (70% threshold): "Brlin" → "Berlin"');
console.log(`  Result: ${lenientResult.isCorrect ? 'PASS' : 'FAIL'} (${(lenientResult.similarity * 100).toFixed(1)}%)`);

const noFuzzyResult = validateQuizAnswer('Berln', 'Berlin', {
  allowFuzzy: false, // Exact match only
});
console.log('Exact Match Only: "Berln" → "Berlin"');
console.log(`  Result: ${noFuzzyResult.isCorrect ? 'PASS' : 'FAIL'}`);

console.log('\n✅ Manual test complete!');
