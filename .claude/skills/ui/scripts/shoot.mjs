#!/usr/bin/env node
// Screenshot a page at phone size and print cheap layout checks: horizontal
// overflow and tap targets under 44px. The theme comes from the signed-in
// team's tenant, so pass a saved sign-in (--state) per theme.
//
// Usage: node .claude/skills/ui/scripts/shoot.mjs <url-or-file> [--out dir]
//          [--name label] [--state file.json] [--size 390x844] [--full] [--wait ms]
// Save a sign-in with: npx playwright codegen --save-storage=<file.json> <url>
// Uses @playwright/test, already a devDependency. Set PW_CHROMIUM_PATH to use
// a preinstalled Chromium instead of Playwright's own download.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const target = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!target) {
  console.error('Usage: shoot.mjs <url-or-file> [--out dir] [--name label] [--state file.json] [--size 390x844] [--full] [--wait ms]');
  process.exit(1);
}
const url = /^https?:\/\//.test(target) ? target : pathToFileURL(resolve(target)).href;
const out = opt('out', '.ui-shots');
const [width, height] = opt('size', '390x844').split('x').map(Number);
const name = opt('name', 'shot');
const state = opt('state');
const full = args.includes('--full');
const wait = Number(opt('wait', '500'));
mkdirSync(out, { recursive: true });

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
  ...(state ? { storageState: state } : {}),
});
// Not 'networkidle': Firestore keeps a listener open, so the network never idles.
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(wait);
const file = `${out}/${name}-${width}x${height}.png`;
await page.screenshot({ path: file, fullPage: full });

const report = await page.evaluate(() => {
  const doc = document.documentElement;
  const overflow = doc.scrollWidth - doc.clientWidth;
  const small = [];
  for (const el of document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.width < 44 || r.height < 44) {
      const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40);
      small.push(`${Math.round(r.width)}x${Math.round(r.height)} ${label}`);
    }
  }
  return { overflow, small };
});
console.log(`${file}`);
console.log(`  horizontal overflow: ${report.overflow > 0 ? `${report.overflow}px` : 'none'}`);
console.log(`  tap targets under 44px: ${report.small.length}`);
for (const s of report.small.slice(0, 15)) console.log(`    ${s}`);
await browser.close();
