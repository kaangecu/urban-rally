import { describe, expect, it } from 'vitest';
import { JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH, generateJoinCode } from './joinCode';

describe('generateJoinCode', () => {
  it('makes 8-character codes', () => {
    expect(JOIN_CODE_LENGTH).toBe(8);
    expect(generateJoinCode()).toHaveLength(8);
  });

  it('uses only the alphabet, which has no look-alike 0, O, 1 or I', () => {
    for (const lookAlike of ['0', 'O', '1', 'I']) {
      expect(JOIN_CODE_ALPHABET).not.toContain(lookAlike);
    }
    for (let i = 0; i < 1000; i++) {
      expect(generateJoinCode()).toMatch(new RegExp(`^[${JOIN_CODE_ALPHABET}]{8}$`));
    }
  });

  it('does not repeat in 10k codes', () => {
    const codes = new Set(Array.from({ length: 10_000 }, () => generateJoinCode()));
    expect(codes.size).toBe(10_000);
  });
});
