import { afterEach, describe, expect, it } from 'vitest';
import { applyTheme, getThemeName } from './theme';

describe('getThemeName', () => {
  it('defaults to night before a tenant is known', () => {
    expect(getThemeName(null)).toBe('night');
    expect(getThemeName(undefined)).toBe('night');
  });

  it('uses night for cyberpunk tenants', () => {
    expect(getThemeName({ id: 'urban-chase' })).toBe('night');
    expect(getThemeName({ id: 'x', themeStyle: 'cyberpunk' })).toBe('night');
    expect(getThemeName({ id: 'x', themeStyle: 'night' })).toBe('night');
  });

  it('uses daylight for light tenants', () => {
    expect(getThemeName({ id: 'esn-berlin' })).toBe('daylight');
    expect(getThemeName({ id: 'x', themeStyle: 'daylight' })).toBe('daylight');
    expect(getThemeName({ id: 'x', themeStyle: 'light' })).toBe('daylight');
  });
});

describe('applyTheme', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('style');
  });

  it('sets data-theme on <html>', () => {
    applyTheme({ id: 'urban-chase' });
    expect(document.documentElement.dataset.theme).toBe('night');

    applyTheme({ id: 'esn-berlin' });
    expect(document.documentElement.dataset.theme).toBe('daylight');
  });

  it('does not inject tenant colours (tenants pick a theme, not a primary)', () => {
    applyTheme({ id: 'esn-berlin', primaryColor: '#123456', secondaryColor: '#654321' });
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--color-secondary')).toBe('');
  });
});
