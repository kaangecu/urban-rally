/**
 * Theme Utility
 * 
 * Detects and applies theme styling based on tenant configuration.
 * Supports both light (corporate) and dark (cyberpunk) themes.
 */

export type ThemeStyle = 'light' | 'cyberpunk';

export interface ThemeConfig {
  style: ThemeStyle;
  colors: {
    primary: string;
    secondary: string;
  };
}

/**
 * Determines if a tenant uses the cyberpunk theme
 * Based on tenant ID or explicit themeStyle field
 */
export function isCyberpunkTheme(tenant: any): boolean {
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
 * Gets the theme configuration for a tenant
 */
export function getThemeConfig(tenant: any): ThemeConfig {
  const isCyberpunk = isCyberpunkTheme(tenant);
  
  return {
    style: isCyberpunk ? 'cyberpunk' : 'light',
    colors: {
      primary: tenant?.primaryColor || '#1a56db',
      secondary: tenant?.secondaryColor || '#7e3af2',
    },
  };
}

/**
 * Applies theme CSS variables to the document root
 */
export function applyTheme(tenant: any): void {
  const root = document.documentElement;
  const theme = getThemeConfig(tenant);
  
  // Apply tenant colors
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  
  // Apply theme-specific styles
  if (theme.style === 'cyberpunk') {
    // Cyberpunk dark theme
    root.style.setProperty('--color-background', '5 5 5');         // Almost black
    root.style.setProperty('--color-surface', '20 20 25');         // Dark gray
    root.style.setProperty('--color-text-main', '255 255 255');    // White
    root.style.setProperty('--color-text-muted', '161 161 170');   // Gray
    root.style.setProperty('--color-border', '255 255 255');       // White (with opacity)
    
    // Add cyberpunk class for special effects
    root.classList.add('theme-cyberpunk');
    root.classList.remove('theme-light');
  } else {
    // Light theme (default)
    root.style.setProperty('--color-background', '243 244 246');   // Gray-100
    root.style.setProperty('--color-surface', '255 255 255');      // White
    root.style.setProperty('--color-text-main', '17 24 39');       // Gray-900
    root.style.setProperty('--color-text-muted', '107 114 128');   // Gray-500
    root.style.setProperty('--color-border', '209 213 219');       // Gray-300
    
    // Add light class
    root.classList.add('theme-light');
    root.classList.remove('theme-cyberpunk');
  }
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
