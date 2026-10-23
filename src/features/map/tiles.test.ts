import { describe, expect, it } from 'vitest';
import { getTileLayer } from '../../config/app.config';

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
});
