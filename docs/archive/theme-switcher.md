This is the **Gold Standard** architecture for modern React apps.

We will use **CSS Variables (Custom Properties)** combined with **Tailwind Configuration**.

**The Logic:**
Instead of writing `bg-pink-500` (which is hardcoded), we will write `bg-primary`.

  * In **"Cyberpunk Mode"**, `bg-primary` automatically maps to **Neon Pink**.
  * In **"Corporate Mode"**, `bg-primary` automatically maps to **Navy Blue**.

Here is the complete architectural package.

### 1\. The Design Tokens (TypeScript)

Define the shape of your theme. This enforces that every theme has the same parts (so the app doesn't break when you switch).

`src/types/theme.ts`

```typescript
export interface ColorScheme {
  background: string; // The main page bg
  surface: string;    // Cards / Modals
  primary: string;    // Main CTA buttons
  secondary: string;  // Less important buttons
  accent: string;     // Highlights / Glows
  textMain: string;   // Headlines
  textMuted: string;  // Subtitles
  border: string;     // Borders
}

export interface Theme {
  id: 'cyberpunk' | 'corporate';
  name: string;
  colors: ColorScheme;
  borderRadius: {
    sm: string;
    DEFAULT: string;
    lg: string;
    full: string;
  };
  fontFamily: {
    sans: string;
    mono: string;
  };
  // Special property for glassmorphism intensity
  blurStrength: 'none' | 'sm' | 'md' | 'xl';
}
```

-----

### 2\. The Theme Definitions (Data)

Here we define the actual styles. Note: We use **RGB values** (e.g., `236 72 153`) instead of Hex codes. This allows Tailwind to handle opacity (e.g., `bg-primary/50`).

`src/lib/themes.ts`

```typescript
import { Theme } from '@/types/theme';

export const cyberpunkTheme: Theme = {
  id: 'cyberpunk',
  name: 'Spree Break Neon',
  colors: {
    background: '5 5 5',         // #050505 (Deep Black)
    surface: '20 20 25',         // Dark Gray for cards
    primary: '236 72 153',       // Neon Pink (Tailwind Pink-500)
    secondary: '6 182 212',      // Cyan (Tailwind Cyan-500)
    accent: '139 92 246',        // Purple Glow
    textMain: '255 255 255',     // White
    textMuted: '161 161 170',    // Zinc-400
    border: '255 255 255',       // White (applied with opacity)
  },
  borderRadius: {
    sm: '0.25rem',
    DEFAULT: '0.75rem',          // 12px
    lg: '1.5rem',                // 24px (Large rounded corners)
    full: '9999px',
  },
  fontFamily: {
    sans: '"Inter", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  blurStrength: 'xl', // Heavy glass effect
};

export const corporateTheme: Theme = {
  id: 'corporate',
  name: 'CityBound SaaS',
  colors: {
    background: '248 250 252',   // #f8fafc (Light Slate)
    surface: '255 255 255',      // Pure White
    primary: '15 23 42',         // Slate-900 (Professional Navy)
    secondary: '59 130 246',     // Blue-500 (Trustworthy Blue)
    accent: '245 158 11',        // Amber (Subtle highlight)
    textMain: '15 23 42',        // Slate-900
    textMuted: '100 116 139',    // Slate-500
    border: '226 232 240',       // Slate-200
  },
  borderRadius: {
    sm: '0.125rem',
    DEFAULT: '0.375rem',         // 6px (Tighter, professional)
    lg: '0.5rem',                // 8px
    full: '9999px',
  },
  fontFamily: {
    sans: '"Roboto", sans-serif',
    mono: '"Roboto Mono", monospace',
  },
  blurStrength: 'none', // No glass for business
};
```

-----

### 3\. The Logic (React Context)

This hook injects the CSS variables into the HTML `<body>` tag instantly.

`src/context/ThemeContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme } from '@/types/theme';
import { cyberpunkTheme, corporateTheme } from '@/lib/themes';

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: 'cyberpunk' | 'corporate') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setActiveTheme] = useState<Theme>(cyberpunkTheme);

  const setTheme = (themeId: 'cyberpunk' | 'corporate') => {
    const newTheme = themeId === 'corporate' ? corporateTheme : cyberpunkTheme;
    setActiveTheme(newTheme);
  };

  // This Effect actually applies the CSS variables to the DOM
  useEffect(() => {
    const root = document.documentElement;

    // 1. Set Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // 2. Set Radius
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      // Mapping 'DEFAULT' to just --radius, others to --radius-sm, etc.
      const varName = key === 'DEFAULT' ? '--radius' : `--radius-${key}`;
      root.style.setProperty(varName, value);
    });
    
    // 3. Set Font
    root.style.setProperty('--font-sans', theme.fontFamily.sans);

  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
```

-----

### 4\. The Glue (Tailwind Config)

This tells Tailwind to look at the CSS variables we just injected.

`tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Map Tailwind utilities to CSS Variables
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
      },
      textColor: {
        main: 'rgb(var(--color-textMain) / <alpha-value>)',
        muted: 'rgb(var(--color-textMuted) / <alpha-value>)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
        lg: 'var(--radius-lg)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
      }
    },
  },
  plugins: [],
}
```

-----

### 5\. How you write UI Components now

You no longer write `bg-pink-500`. You write this:

```tsx
// This component works for BOTH styles automatically
const PrimaryButton = () => {
  return (
    <button className="bg-primary text-main rounded-lg px-6 py-3 shadow-lg shadow-primary/20">
       Start Mission
    </button>
  );
};
```

  * **In Cyberpunk Mode:** This button is Neon Pink, rounded 12px, White Text.
  * **In Corporate Mode:** This button is Navy Blue, rounded 6px, Dark Text (wait, Corporate needs white text on primary buttons? You might need a `text-on-primary` token if the contrast flips\!).

### 6\. The "Secret" Switcher Component

Create a tiny hidden button (or admin route) to swap themes during your demo.

`src/components/ThemeToggle.tsx`

```tsx
import { useTheme } from '@/context/ThemeContext';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2 bg-black/80 p-2 rounded-full border border-white/20">
      <button 
        onClick={() => setTheme('cyberpunk')}
        className={`px-3 py-1 rounded-full text-xs font-bold ${theme.id === 'cyberpunk' ? 'bg-pink-500 text-white' : 'text-gray-400'}`}
      >
        NEON
      </button>
      <button 
        onClick={() => setTheme('corporate')}
        className={`px-3 py-1 rounded-full text-xs font-bold ${theme.id === 'corporate' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
      >
        SAAS
      </button>
    </div>
  );
};
```