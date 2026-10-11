# 🔮 Future Work: Multi-Theme Support

**Status:** 📋 Planning Phase  
**Target:** v2.0 (Post-MVP)  
**Priority:** Medium  
**Dependencies:** Design token system, component library refactor complete

---

## 🎯 Vision

Enable UrbanRally to support multiple visual themes while maintaining code maintainability and performance.

### Potential Themes (Future)

1. **Cyberpunk Dark** (Current v1.0) ✅
   - Primary theme
   - Glassmorphism + neon glows
   - Pink/purple/cyan palette

2. **Corporate Light** (Planned v2.0)
   - Professional appearance
   - Clean white backgrounds
   - Blue/gray palette
   - For enterprise clients

3. **High Contrast** (Planned v2.0)
   - Accessibility focus
   - WCAG AAA compliance
   - Strong color contrast
   - For vision-impaired users

4. **Custom Tenant Themes** (Planned v3.0)
   - Per-organization branding
   - Custom color palettes
   - Logo integration
   - For white-label deployments

---

## 🏗️ Architecture Strategy

### Phase 1: Foundation (Current - v1.0)

**Goal:** Build dark theme first, design for future themes

**Current Approach:**
```tsx
// ✅ What we're doing now
<div className="bg-white/5 backdrop-blur-xl border-white/10">
<button className="bg-gradient-to-r from-pink-500 to-purple-600">
```

**Why This Works:**
- Establishes consistent dark theme
- Identifies all UI patterns
- Proves glassmorphism approach
- Gets product to market faster

**What We're Avoiding:**
```tsx
// ❌ Not doing this (not scalable)
<div className="bg-white dark:bg-gray-900">
<div className="text-black dark:text-white">
```

**Why?** `dark:` conditionals only work for 2 themes. We'll need a different approach for 3+ themes.

---

### Phase 2: Design Token System (v1.5 - Q1 2026)

**Goal:** Abstract all colors/spacing into CSS variables

**Proposed Structure:**

```css
/* theme.css */
:root {
  /* Semantic color tokens */
  --color-background-primary: var(--cyberpunk-bg-primary);
  --color-background-secondary: var(--cyberpunk-bg-secondary);
  --color-background-card: var(--cyberpunk-bg-card);
  
  --color-text-primary: var(--cyberpunk-text-primary);
  --color-text-secondary: var(--cyberpunk-text-secondary);
  
  --color-accent-primary: var(--cyberpunk-accent-primary);
  --color-accent-secondary: var(--cyberpunk-accent-secondary);
  
  --color-success: var(--cyberpunk-success);
  --color-warning: var(--cyberpunk-warning);
  --color-error: var(--cyberpunk-error);
  
  /* Spacing tokens */
  --spacing-xs: 0.5rem;   /* 8px */
  --spacing-sm: 0.75rem;  /* 12px */
  --spacing-md: 1rem;     /* 16px */
  --spacing-lg: 1.5rem;   /* 24px */
  --spacing-xl: 2rem;     /* 32px */
  
  /* Border radius */
  --radius-sm: 0.5rem;    /* 8px */
  --radius-md: 0.75rem;   /* 12px */
  --radius-lg: 1rem;      /* 16px */
  
  /* Effects */
  --blur-sm: 8px;
  --blur-md: 16px;
  --blur-lg: 24px;
}

/* Cyberpunk theme values */
:root {
  --cyberpunk-bg-primary: rgba(17, 24, 39, 0.95);
  --cyberpunk-bg-secondary: rgba(31, 41, 55, 0.9);
  --cyberpunk-bg-card: rgba(255, 255, 255, 0.05);
  
  --cyberpunk-text-primary: rgb(255, 255, 255);
  --cyberpunk-text-secondary: rgb(209, 213, 219);
  
  --cyberpunk-accent-primary: rgb(236, 72, 153);  /* Pink */
  --cyberpunk-accent-secondary: rgb(168, 85, 247); /* Purple */
  
  --cyberpunk-success: rgb(34, 197, 94);   /* Green */
  --cyberpunk-warning: rgb(234, 179, 8);   /* Yellow */
  --cyberpunk-error: rgb(239, 68, 68);     /* Red */
}

/* Future: Corporate Light theme */
[data-theme="corporate"] {
  --color-background-primary: rgb(255, 255, 255);
  --color-background-secondary: rgb(249, 250, 251);
  --color-background-card: rgb(255, 255, 255);
  
  --color-text-primary: rgb(17, 24, 39);
  --color-text-secondary: rgb(75, 85, 99);
  
  --color-accent-primary: rgb(37, 99, 235);  /* Blue */
  --color-accent-secondary: rgb(59, 130, 246);
  
  /* Success/warning/error stay the same */
}

/* Future: High Contrast theme */
[data-theme="high-contrast"] {
  --color-background-primary: rgb(0, 0, 0);
  --color-background-secondary: rgb(0, 0, 0);
  --color-background-card: rgb(0, 0, 0);
  
  --color-text-primary: rgb(255, 255, 255);
  --color-text-secondary: rgb(255, 255, 255);
  
  --color-accent-primary: rgb(255, 255, 0);  /* Yellow */
  --color-accent-secondary: rgb(0, 255, 255); /* Cyan */
  
  --color-success: rgb(0, 255, 0);
  --color-warning: rgb(255, 255, 0);
  --color-error: rgb(255, 0, 0);
}
```

**Component Migration Example:**

```tsx
// Before (v1.0 - Current)
<div className="bg-white/5 backdrop-blur-xl border-white/10">
  <h2 className="text-white">Title</h2>
  <p className="text-gray-300">Description</p>
</div>

// After (v1.5 - With design tokens)
<div className="glass-card">
  <h2 className="text-primary">Title</h2>
  <p className="text-secondary">Description</p>
</div>

// CSS (tokens.css)
.glass-card {
  background: var(--color-background-card);
  backdrop-filter: blur(var(--blur-lg));
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
```

**Benefits:**
- ✅ Change entire theme by swapping CSS variables
- ✅ No component code changes needed
- ✅ Type-safe with CSS module exports
- ✅ Supports unlimited themes
- ✅ Dynamic theme switching at runtime

---

### Phase 3: Theme Switcher (v2.0 - Q2 2026)

**Goal:** Allow users/admins to change themes

**User Settings:**

```tsx
// User preferences
interface UserPreferences {
  theme: 'cyberpunk' | 'corporate' | 'high-contrast';
  // ... other preferences
}

// Theme Provider
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const theme = user?.preferences?.theme || 'cyberpunk';
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  return <>{children}</>;
}
```

**Settings UI:**

```tsx
// In user settings page
<div className="space-y-4">
  <h3>Appearance</h3>
  <div className="space-y-2">
    <ThemeOption
      name="Cyberpunk Dark"
      preview="/previews/cyberpunk.jpg"
      value="cyberpunk"
      selected={theme === 'cyberpunk'}
      onClick={() => setTheme('cyberpunk')}
    />
    <ThemeOption
      name="Corporate Light"
      preview="/previews/corporate.jpg"
      value="corporate"
      selected={theme === 'corporate'}
      onClick={() => setTheme('corporate')}
    />
    <ThemeOption
      name="High Contrast"
      preview="/previews/high-contrast.jpg"
      value="high-contrast"
      selected={theme === 'high-contrast'}
      onClick={() => setTheme('high-contrast')}
    />
  </div>
</div>
```

---

### Phase 4: Tenant Themes (v3.0 - Q3 2026)

**Goal:** Per-organization custom branding

**Tenant Config:**

```typescript
// In Firebase tenant document
interface TenantTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    text: string;
  };
  logo: {
    light: string;  // URL to logo
    dark: string;   // URL to logo
  };
  fonts?: {
    heading: string;
    body: string;
  };
}

// Example: Company X's custom theme
{
  id: "company-x",
  name: "Company X Brand",
  colors: {
    primary: "#FF6B35",      // Their brand orange
    secondary: "#004E89",    // Their brand blue
    success: "#00A878",
    warning: "#F77F00",
    error: "#D62828",
    background: "#1A1A2E",
    text: "#EAEAEA"
  },
  logo: {
    light: "https://cdn.company-x.com/logo-light.svg",
    dark: "https://cdn.company-x.com/logo-dark.svg"
  }
}
```

**Dynamic Theme Application:**

```tsx
// Load tenant theme
export function useTenantTheme() {
  const { tenant } = useTenant();
  
  useEffect(() => {
    if (tenant?.theme) {
      // Apply custom CSS variables
      const root = document.documentElement;
      root.style.setProperty('--color-accent-primary', tenant.theme.colors.primary);
      root.style.setProperty('--color-accent-secondary', tenant.theme.colors.secondary);
      // ... apply all colors
    }
  }, [tenant]);
}
```

---

## 📋 Migration Checklist

### ✅ Phase 1: Dark Theme First (Current - v1.0)

- [x] Establish cyberpunk dark theme
- [x] Refactor TaskDetail as reference
- [x] Document all UI patterns
- [x] Create component library
- [ ] Complete refactoring all 34 files
- [ ] Remove all `dark:` conditionals
- [ ] Remove all light theme remnants

### 🔄 Phase 2: Design Tokens (v1.5)

- [ ] Define semantic token structure
- [ ] Create CSS variable system
- [ ] Build token generator tool
- [ ] Migrate components to use tokens
- [ ] Create theme documentation
- [ ] Test token swapping
- [ ] Performance audit

### 📅 Phase 3: Theme Switcher (v2.0)

- [ ] Design theme picker UI
- [ ] Implement theme provider
- [ ] Add user preference storage
- [ ] Create theme preview system
- [ ] Design corporate light theme
- [ ] Design high contrast theme
- [ ] Accessibility testing (WCAG AAA)
- [ ] User testing with different themes

### 🎨 Phase 4: Tenant Themes (v3.0)

- [ ] Design tenant theme schema
- [ ] Build theme configuration UI (admin)
- [ ] Implement dynamic CSS variable injection
- [ ] Create theme validation system
- [ ] Add logo upload/management
- [ ] Build theme preview tool
- [ ] Create tenant theme gallery
- [ ] Documentation for theme creation

---

## 🎨 Design Considerations

### Cyberpunk → Corporate Migration

**What Changes:**
| Element | Cyberpunk | Corporate |
|---------|-----------|-----------|
| Background | Glass blur + dark | Solid white/light gray |
| Cards | `bg-white/5` blur | `bg-white` shadow |
| Borders | `border-white/10` | `border-gray-200` |
| Text | White/gray-300 | Gray-900/gray-600 |
| Buttons | Gradient pink/purple | Solid blue |
| Shadows | Neon glows | Subtle shadows |
| Effects | Blur, glow | Clean, minimal |

**What Stays:**
- Layout structure
- Component hierarchy
- Spacing scale
- Border radius scale
- Typography scale
- Icon set

### High Contrast Considerations

**Accessibility Requirements:**
- Contrast ratio ≥ 7:1 (WCAG AAA)
- No reliance on color alone
- Clear focus indicators
- No thin borders (<2px)
- Larger touch targets (48px)

**Special Handling:**
```css
/* High contrast theme */
[data-theme="high-contrast"] {
  /* Remove all blur effects */
  --blur-sm: 0;
  --blur-md: 0;
  --blur-lg: 0;
  
  /* Increase border widths */
  --border-width: 2px;
  
  /* Remove opacity/transparency */
  .glass-card {
    background: var(--color-background-card);
    backdrop-filter: none; /* No blur */
    border-width: 2px;
  }
}
```

---

## 🔧 Technical Implementation

### Theme Detection & Application

```typescript
// useTheme.ts
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export type Theme = 'cyberpunk' | 'corporate' | 'high-contrast' | 'custom';

export function useTheme() {
  const { user, tenant } = useAuth();
  const [theme, setTheme] = useState<Theme>('cyberpunk');

  // Determine theme priority:
  // 1. User preference (if set)
  // 2. Tenant default theme
  // 3. App default (cyberpunk)
  useEffect(() => {
    const userTheme = user?.preferences?.theme;
    const tenantTheme = tenant?.defaultTheme;
    const selectedTheme = userTheme || tenantTheme || 'cyberpunk';
    
    setTheme(selectedTheme);
    applyTheme(selectedTheme);
  }, [user, tenant]);

  const applyTheme = (themeName: Theme) => {
    // Set data attribute for CSS
    document.documentElement.setAttribute('data-theme', themeName);
    
    // If custom tenant theme, inject variables
    if (themeName === 'custom' && tenant?.theme) {
      applyCustomTheme(tenant.theme);
    }
  };

  const applyCustomTheme = (themeConfig: TenantTheme) => {
    const root = document.documentElement;
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  };

  return {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
      applyTheme(newTheme);
      // Save to user preferences
      if (user) {
        updateUserPreferences(user.id, { theme: newTheme });
      }
    }
  };
}
```

### Component Library Updates

```tsx
// Button.tsx (v1.5 - with tokens)
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

// button.css (with design tokens)
.btn {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(
    to right,
    var(--color-accent-primary),
    var(--color-accent-secondary)
  );
  color: white;
}

.btn-primary:hover {
  filter: brightness(1.1);
  box-shadow: 0 0 20px var(--color-accent-primary);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: var(--color-background-hover);
}
```

---

## 📊 Performance Considerations

### CSS Variable Performance

**Pros:**
- ✅ Fast runtime theme switching
- ✅ No JavaScript overhead
- ✅ Browser-optimized
- ✅ Small bundle size

**Cons:**
- ⚠️ IE11 doesn't support (not a concern for us)
- ⚠️ Slightly slower than static CSS (negligible)

**Optimization:**
```css
/* Use CSS containment for theme changes */
.themed-component {
  contain: style;
}

/* Limit variable scope when possible */
.card {
  /* Only reference needed variables */
  background: var(--color-background-card);
  /* Not: background: var(--color-background-primary, var(--fallback, #000)); */
}
```

### Bundle Size Impact

**Current (v1.0):**
- CSS: ~50KB (minified)
- All styles inline in Tailwind

**Estimated (v2.0 with themes):**
- CSS: ~80KB (minified)
  - Base: 50KB
  - Tokens: 10KB
  - Theme variants: 20KB
- Still acceptable for web app

**Optimization:**
- Use CSS modules for tree-shaking
- Lazy load theme-specific styles
- Cache theme CSS aggressively

---

## 🧪 Testing Strategy

### Visual Regression Testing

```typescript
// visual-regression.spec.ts
import { test, expect } from '@playwright/test';

const themes = ['cyberpunk', 'corporate', 'high-contrast'];

themes.forEach(theme => {
  test.describe(`Theme: ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
    });

    test('TaskDetail modal matches snapshot', async ({ page }) => {
      await page.goto('/tasks/123');
      await expect(page).toHaveScreenshot(`task-detail-${theme}.png`);
    });

    test('Game map matches snapshot', async ({ page }) => {
      await page.goto('/map');
      await expect(page).toHaveScreenshot(`game-map-${theme}.png`);
    });

    // Test all major components
  });
});
```

### Accessibility Testing

```typescript
// accessibility.spec.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('High Contrast Theme Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'high-contrast');
    });
    await injectAxe(page);
  });

  test('passes WCAG AAA contrast requirements', async ({ page }) => {
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });

  test('all interactive elements have 48px touch targets', async ({ page }) => {
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(48);
      expect(box?.width).toBeGreaterThanOrEqual(48);
    }
  });
});
```

---

## 📚 Developer Guidelines

### Do's ✅

```tsx
// ✅ Use semantic class names
<div className="glass-card">
<button className="btn-primary">

// ✅ Use CSS variables (when available)
style={{ backgroundColor: 'var(--color-background-card)' }}

// ✅ Design components with themes in mind
// Think: "Will this work with light AND dark backgrounds?"

// ✅ Document theme-specific behavior
/**
 * Card component
 * @theme cyberpunk - Glass with blur effect
 * @theme corporate - Solid white with shadow
 * @theme high-contrast - Solid black with thick border
 */
```

### Don'ts ❌

```tsx
// ❌ Hard-code colors
<div className="bg-gray-900">

// ❌ Use conditional dark mode
<div className="bg-white dark:bg-gray-900">

// ❌ Rely on specific colors for meaning
<div className="text-pink-500"> {/* What if theme has no pink? */}

// ❌ Create new arbitrary color values
<div className="bg-[#1a2b3c]"> {/* Use design tokens */}
```

### Theme-Agnostic Development

**Think in semantics, not colors:**

```tsx
// ❌ Color-specific thinking
"The submit button is pink"
<button className="bg-pink-500">

// ✅ Semantic thinking
"The submit button is the primary action"
<button className="btn-primary">
```

**Design for contrast, not specific colors:**

```tsx
// ❌ Assumes dark background
<p className="text-gray-300">

// ✅ Semantic contrast
<p className="text-secondary"> {/* Adapts to theme */}
```

---

## 📈 Success Metrics

### v1.5 (Design Tokens)
- [ ] 100% of components use CSS variables
- [ ] 0 hard-coded color values in components
- [ ] Theme swap in <100ms
- [ ] No visual regression from v1.0
- [ ] Bundle size increase <30KB

### v2.0 (Theme Switcher)
- [ ] 3 complete themes available
- [ ] All themes pass accessibility audit
- [ ] User can switch themes in settings
- [ ] Theme preference persists
- [ ] 95%+ of users on default theme (expected)
- [ ] <5% performance degradation

### v3.0 (Tenant Themes)
- [ ] Admin can configure custom theme
- [ ] Custom themes auto-validated
- [ ] Logo integration working
- [ ] 10+ tenant custom themes deployed
- [ ] Theme preview tool available
- [ ] Documentation complete

---

## 🗓️ Timeline

| Phase | Target | Duration | Dependencies |
|-------|--------|----------|--------------|
| Phase 1: Dark Theme | v1.0 - Q4 2025 | 4 weeks | None |
| **Design Token System** | **v1.5 - Q1 2026** | **6 weeks** | **Phase 1 complete** |
| **Theme Switcher** | **v2.0 - Q2 2026** | **8 weeks** | **Design tokens** |
| **Tenant Themes** | **v3.0 - Q3 2026** | **10 weeks** | **Theme switcher** |

---

## 📖 Related Documentation

- [`STYLING_REFACTOR_GUIDE.md`](./STYLING_REFACTOR_GUIDE.md) - Current v1.0 implementation
- [`QUICK_START_STYLING.md`](./QUICK_START_STYLING.md) - Developer quick reference
- [`TASKDETAIL_REFACTOR_NOTES.md`](./TASKDETAIL_REFACTOR_NOTES.md) - Reference implementation
- [`component-guide.md`](./component-guide.md) - Design philosophy

---

## 🆘 Questions?

### "Should I use `dark:` classes?"
**No.** Build for dark theme only in v1.0. We'll add multi-theme support in v1.5+ using CSS variables.

### "Can I hard-code colors?"
**For now, yes** - but use the documented patterns (glass-card, text-white, etc.). We'll migrate to CSS variables in v1.5.

### "When will users get light theme?"
**v2.0 (Q2 2026)** - After design token system is complete.

### "What if my client needs light theme now?"
**Discuss with product team.** May need to accelerate timeline or create a one-off solution.

---

**Future Work Document v1.0**  
**Created:** December 5, 2025  
**Status:** 📋 Planning Phase  
**Next Review:** Q1 2026 (before v1.5 kickoff)
