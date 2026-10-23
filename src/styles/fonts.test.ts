import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]);

describe('self-hosted fonts', () => {
  it('declares the six design system faces', () => {
    const declared = faces.map((f) => `${f.match(/font-family:\s*"([^"]+)"/)?.[1]} ${f.match(/font-weight:\s*(\d+)/)?.[1]}`);
    expect(declared.sort()).toEqual([
      'Atkinson Hyperlegible 400',
      'Atkinson Hyperlegible 700',
      'JetBrains Mono 500',
      'JetBrains Mono 700',
      'Oxanium 600',
      'Oxanium 700',
    ]);
  });

  it('loads every face from a committed woff2 file with swap', () => {
    for (const face of faces) {
      const url = face.match(/url\("([^"]+\.woff2)"\)/)?.[1];
      expect(url, face).toBeDefined();
      expect(existsSync(resolve(__dirname, '..', url!))).toBe(true);
      expect(face).toMatch(/font-display:\s*swap/);
    }
  });

  it('never fetches fonts from Google at runtime', () => {
    expect(css).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  });

  it('exposes font tokens with system fallbacks', () => {
    expect(css).toMatch(/--font-display:\s*"Oxanium",[^;]*system-ui/);
    expect(css).toMatch(/--font-body:\s*"Atkinson Hyperlegible",[^;]*system-ui/);
    expect(css).toMatch(/--font-mono:\s*"JetBrains Mono",[^;]*monospace/);
  });
});
