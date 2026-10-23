/**
 * Theme Utility
 * 
 * Detects and applies theme styling based on tenant configuration.
 * Supports both light (corporate) and dark (cyberpunk) themes.
 */

import type { Tenant } from '../types/schema';

export type ThemeStyle = 'light' | 'cyberpunk';

/** Design system theme. Tenants pick Night or Daylight, not their own colours. */
export type ThemeName = 'night' | 'daylight';

// themeStyle isn't in the Tenant schema yet; older tenant docs may carry it
type ThemeTenant = (Partial<Tenant> & { themeStyle?: string }) | null | undefined;

export interface ThemeConfig {
  style: ThemeStyle;
}

/**
 * Determines if a tenant uses the cyberpunk theme
 * Based on tenant ID or explicit themeStyle field
 */
export function isCyberpunkTheme(tenant: ThemeTenant): boolean {
  // Check explicit themeStyle field first
  if (tenant?.themeStyle === 'cyberpunk') {
    return true;
  }
  
  // Fallback: Check tenant ID
  if (tenant?.id === 'urban-chase') {
    return true;
  }
  
  // Default to light theme
  return false;
}

/**
 * Night before a tenant is known and for cyberpunk tenants, Daylight for light tenants
 */
export function getThemeName(tenant: ThemeTenant): ThemeName {
  if (!tenant) return 'night';
  if (tenant.themeStyle === 'daylight' || tenant.themeStyle === 'light') return 'daylight';
  if (tenant.themeStyle === 'night') return 'night';
  return isCyberpunkTheme(tenant) ? 'night' : 'daylight';
}

/**
 * Gets the theme configuration for a tenant
 */
export function getThemeConfig(tenant: ThemeTenant): ThemeConfig {
  const isCyberpunk = isCyberpunkTheme(tenant);
  
  return {
    style: isCyberpunk ? 'cyberpunk' : 'light',
  };
}

/**
 * Applies the tenant's theme to the document root
 */
export function applyTheme(tenant: ThemeTenant): void {
  const root = document.documentElement;
  root.dataset.theme = getThemeName(tenant);

  // Legacy classes for screens not yet ported to the design system tokens
  const cyberpunk = getThemeConfig(tenant).style === 'cyberpunk';
  root.classList.toggle('theme-cyberpunk', cyberpunk);
  root.classList.toggle('theme-light', !cyberpunk);
}

/**
 * Utility classes for conditional styling
 */
export const themeClasses = {
  // Background classes
  background: (isCyberpunk: boolean) =>
    isCyberpunk
      ? 'bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-[#000000]'
      : 'bg-gray-100',
  
  // Surface/Card classes
  surface: (isCyberpunk: boolean) =>
    isCyberpunk
      ? 'bg-white/5 backdrop-blur-xl border-white/10'
      : 'bg-white border-gray-200',
  
  // Text classes
  textMain: (isCyberpunk: boolean) =>
    isCyberpunk ? 'text-white' : 'text-gray-900',
  
  textMuted: (isCyberpunk: boolean) =>
    isCyberpunk ? 'text-gray-400' : 'text-gray-600',
  
  // Button primary classes
  buttonPrimary: (isCyberpunk: boolean) =>
    isCyberpunk
      ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40'
      : 'bg-blue-600 hover:bg-blue-700 text-white',
  
  // Button secondary classes
  buttonSecondary: (isCyberpunk: boolean) =>
    isCyberpunk
      ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm'
      : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700',
  
  // Input classes
  input: (isCyberpunk: boolean) =>
    isCyberpunk
      ? 'bg-black/20 border-white/20 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/50 backdrop-blur-sm'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500',
  
  // Badge/Tag classes
  badge: (isCyberpunk: boolean) =>
    isCyberpunk
      ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_-3px_rgba(6,182,212,0.5)]'
      : 'bg-blue-100 border border-blue-200 text-blue-800',
};
