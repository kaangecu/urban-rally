import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Reads the per-theme token blocks from src/index.css and checks the design
// system's text pairs still pass WCAG AA (4.5:1) in both themes.
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

function themeVars(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  expect(start, `missing ${selector} block`).toBeGreaterThan(-1);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--ur-([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS: [string, string][] = [
  ['text', 'bg'], ['text', 'surface'], ['text', 'surface-raised'],
  ['text-muted', 'bg'], ['text-muted', 'surface'], ['text-muted', 'surface-raised'],
  ['accent-text', 'surface'], ['on-accent', 'accent'],
  ['progress-text', 'surface'], ['on-progress', 'progress'],
  ['attention-text', 'surface'], ['attention-text', 'attention-soft'],
  ['warning-text', 'surface'], ['warning-text', 'warning-soft'],
  ['danger-text', 'surface'], ['danger-text', 'danger-soft'],
];

describe.each([
  ['night', '[data-theme="night"]'],
  ['daylight', '[data-theme="daylight"]'],
])('%s tokens', (_name, selector) => {
  const vars = themeVars(selector);

  it.each(PAIRS)('%s on %s passes AA', (fg, bg) => {
    expect(vars[fg], `--ur-${fg}`).toMatch(/^#[0-9a-f]{6}$/i);
    expect(vars[bg], `--ur-${bg}`).toMatch(/^#[0-9a-f]{6}$/i);
    expect(contrast(vars[fg], vars[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
