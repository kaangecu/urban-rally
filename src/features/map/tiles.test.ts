import { describe, expect, it } from 'vitest';
import { getTileLayer } from '../../config/app.config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');

describe('getTileLayer', () => {
  it('uses dark tiles in the Night theme', () => {
    const tiles = getTileLayer('night');
    expect(tiles.url).toContain('basemaps.cartocdn.com/dark_all');
    expect(tiles.attribution).toMatch(/OpenStreetMap/);
    expect(tiles.attribution).toMatch(/CARTO/);
  });

  it('uses light tiles in the Daylight theme', () => {
    expect(getTileLayer('daylight').url).toContain('basemaps.cartocdn.com/light_all');
  });

  it('asks for standard 256px tiles, not @2x, to save mobile data', () => {
    expect(getTileLayer('night').url).not.toContain('{r}');
    expect(getTileLayer('daylight').url).not.toContain('{r}');
  });
});

describe('Leaflet chrome', () => {
  it('uses the theme background behind tiles and a readable attribution', () => {
    expect(css).toMatch(/\.leaflet-container\s*\{[^}]*background:\s*var\(--ur-bg\)/);
    expect(css).toMatch(/\.leaflet-container \.leaflet-control-attribution\s*\{[^}]*var\(--ur-glass\)[^}]*var\(--ur-text-muted\)/);
    expect(css).toMatch(/\.leaflet-control-attribution a\s*\{[^}]*var\(--ur-accent-text\)/);
  });
});
