import { describe, expect, it } from 'vitest';
import { formatPoints, formatTaskCount } from './format';

describe('formatPoints', () => {
  it('uses "pts" for every amount', () => {
    expect(formatPoints(0)).toBe('0 pts');
    expect(formatPoints(1)).toBe('1 pts');
    expect(formatPoints(50)).toBe('50 pts');
  });

  it('groups thousands', () => {
    expect(formatPoints(1250)).toBe('1,250 pts');
  });

  it('adds a plus sign for rewards', () => {
    expect(formatPoints(80, { signed: true })).toBe('+80 pts');
    expect(formatPoints(0, { signed: true })).toBe('+0 pts');
  });
});

describe('formatTaskCount', () => {
  it('uses the right plural', () => {
    expect(formatTaskCount(0)).toBe('0 tasks done');
    expect(formatTaskCount(1)).toBe('1 task done');
    expect(formatTaskCount(2)).toBe('2 tasks done');
  });
});
