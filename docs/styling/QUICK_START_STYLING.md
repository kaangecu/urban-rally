# 🚀 Quick Start: Consistent Styling Guide

**For developers working on UrbanRally**  
**Last Updated:** December 5, 2025

---

## ⚡ TL;DR - Do This Now

```tsx
// ❌ STOP doing this
<div className="bg-white rounded-lg shadow-xl">
  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2">
    Click Me
  </button>
</div>

// ✅ START doing this
<div className="glass-card">
  <button className="btn-primary">
    <span>Click Me</span>
  </button>
</div>
```

**Why?** We're building dark theme first with a cyberpunk glassmorphic aesthetic, designed for future theme support. See TaskDetail.tsx for reference.

---

## 📋 Cheat Sheet

### Modals
```tsx
<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]">
  <div className="relative overflow-hidden rounded-2xl border border-white/10 
                  bg-white/5 backdrop-blur-xl max-w-2xl w-full shadow-2xl"
       style={{ backgroundColor: 'rgba(17, 24, 39, 0.95)' }}>
    
    {/* Glow orbs */}
    <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full 
                    bg-pink-500/30 blur-3xl pointer-events-none" />
    <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full 
                    bg-cyan-500/30 blur-3xl pointer-events-none" />
    
    {/* Content */}
    <div className="relative z-10">
      {/* Your content */}
    </div>
  </div>
</div>
```

### Buttons
```tsx
{/* Primary Action */}
<button className="relative group overflow-hidden rounded-lg font-bold py-4 px-6">
  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 
                  group-hover:from-pink-500 group-hover:to-purple-500" />
  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 
                  blur-xl opacity-50 group-hover:opacity-70" />
  <span className="relative z-10 text-white uppercase tracking-wider">
    Action
  </span>
</button>

{/* Secondary Action */}
<button className="px-6 py-4 border border-white/20 text-gray-300 
                   hover:bg-white/10 hover:text-white rounded-lg backdrop-blur-sm">
  Cancel
</button>
```

### Badges
```tsx
{/* Success/Completed */}
<span className="inline-block rounded-full border border-green-500/50 
                 bg-green-950/50 px-3 py-1 text-xs font-bold uppercase 
                 text-green-300 shadow-[0_0_10px_-3px_rgba(34,197,94,0.7)]">
  ✓ Completed
</span>

{/* Active/Info */}
<span className="inline-block rounded-full border border-cyan-500/50 
                 bg-cyan-950/50 px-3 py-1 text-xs font-bold uppercase 
                 text-cyan-300 shadow-[0_0_10px_-3px_rgba(6,182,212,0.7)]">
  Active Quest
</span>

{/* XP Badge */}
<div className="flex items-center gap-1 bg-gradient-to-r from-pink-500 
                to-purple-600 px-4 py-2 rounded-full 
                shadow-[0_0_15px_-3px_rgba(236,72,153,0.6)]">
  <span className="font-bold text-white">500 XP</span>
</div>
```

### Cards
```tsx
{/* Glass Card */}
<div className="relative overflow-hidden rounded-xl border border-white/10 
                bg-white/5 p-4 backdrop-blur-sm">
  <div className="space-y-3">
    {/* Content */}
  </div>
</div>

{/* Info Card with Pattern */}
<div className="relative overflow-hidden rounded-xl border border-purple-500/30 
                bg-purple-950/30 p-4 backdrop-blur-sm">
  <div className="absolute inset-0 opacity-20 
                  bg-[linear-gradient(45deg,rgba(168,85,247,0.2)_1px,transparent_1px)] 
                  bg-[length:10px_10px]" />
  <div className="relative">
    {/* Content */}
  </div>
</div>
```

---

## 🎨 Color Reference

### Text Colors
```tsx
text-white          // Primary headings
text-gray-300       // Body text
text-gray-400       // Muted text/labels
```

### Background Colors
```tsx
bg-white/5          // Glass background
bg-white/10         // Glass hover
bg-gray-900/80      // Header/strong background
bg-gray-900/60      // Card background
```

### Border Colors
```tsx
border-white/10     // Standard border
border-white/20     // Strong border
border-cyan-500/50  // Colored border (info)
border-green-500/50 // Colored border (success)
```

### Glow Colors
```tsx
// Pink (Primary actions)
from-pink-500 to-purple-600
shadow-[0_0_15px_-3px_rgba(236,72,153,0.6)]

// Cyan (Info/Active)
shadow-[0_0_10px_-3px_rgba(6,182,212,0.7)]

// Green (Success)
shadow-[0_0_10px_-3px_rgba(34,197,94,0.7)]

// Yellow (Warning/Hints)
shadow-[0_0_15px_-3px_rgba(234,179,8,0.6)]
```

---

## 📏 Spacing Scale

```tsx
gap-3      // 12px - Small gaps
gap-4      // 16px - Medium gaps
gap-6      // 24px - Large gaps

p-3        // 12px - Compact padding
p-4        // 16px - Standard padding
p-6        // 24px - Comfortable padding

space-y-3  // 12px - Compact vertical spacing
space-y-4  // 16px - Standard vertical spacing
space-y-6  // 24px - Comfortable vertical spacing
```

---

## 🚫 Don't Do This

```tsx
// ❌ Hard-coded colors
<div className="bg-white">
<div className="bg-gray-100">
<p className="text-gray-900">

// ❌ Light theme remnants
<button className="bg-blue-500 hover:bg-blue-600">

// ❌ Conditional dark mode (breaks future theme support)
<div className="bg-white dark:bg-gray-900">

// ❌ Random spacing
<div className="p-5">  // Use p-4 or p-6
<div className="gap-5"> // Use gap-4 or gap-6

// ❌ Duplicate button styles
<button className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600">
// Use component instead!
```

---

## ✅ Do This Instead

```tsx
// ✅ Glass backgrounds
<div className="bg-white/5 backdrop-blur-xl">

// ✅ White/light text
<p className="text-white">
<p className="text-gray-300">

// ✅ Dark theme first (designed for future theme support)
// Avoid `dark:` conditionals - use semantic class names instead

// ✅ Standard spacing
<div className="p-4">
<div className="gap-3">

// ✅ Use components (when available)
<Button variant="primary">Click</Button>
```

---

## 🔍 Before You Commit

Run this checklist:

- [ ] No `bg-white` or `bg-gray-100` (use `bg-white/5`)
- [ ] No `text-gray-900` or `text-black` (use `text-white`)
- [ ] No `bg-blue-500` buttons (use gradient or component)
- [ ] No `dark:` conditional classes (dark first, future theme support planned)
- [ ] Spacing uses standard scale (3, 4, 6, 8, 12)
- [ ] Borders use `/10` or `/20` opacity (`border-white/10`)
- [ ] Mobile-tested (44px min touch targets)
- [ ] Has backwards compatibility fallback if using `backdrop-blur`

---

## 📚 Full Documentation

- **Complete Guide:** `/docs/STYLING_REFACTOR_GUIDE.md`
- **Reference Implementation:** `/docs/TASKDETAIL_REFACTOR_NOTES.md`
- **Audit Summary:** `/docs/STYLING_AUDIT_SUMMARY.md`

---

## 🆘 Need Help?

1. **Check TaskDetail.tsx** - Perfect example
2. **Read the guides** - Comprehensive docs
3. **Ask in code review** - We'll help!

---

## 🎯 Remember

> **Dark theme first, future-ready architecture, consistent patterns.**

Build for today's dark theme, design for tomorrow's theme system. Keep it simple, keep it consistent.

---

## 🔮 Future Theme Support

We're building dark theme first, but designing components to support multiple themes later:

**✅ Do This (Future-Proof):**
```tsx
// Use semantic class names that can be themed
<div className="glass-card">
<button className="btn-primary">

// Use CSS variables (when design tokens are implemented)
style={{ backgroundColor: 'var(--bg-card)' }}
```

**❌ Don't Do This (Locks to Dark):**
```tsx
// Hard-coded dark theme values
<div className="bg-gray-900 text-white">

// Conditional dark mode (not scalable to 3+ themes)
<div className="bg-white dark:bg-gray-900">
```

**Why?** When we add theme support, we can swap CSS variables or class implementations without touching component code.

See `/docs/FUTURE_THEME_SUPPORT.md` for the roadmap.

---

**Quick Start v1.0**  
**December 5, 2025**
