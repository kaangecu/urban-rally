This document is a **System Prompt / Context File** designed to be pasted into a coding agent (Cursor, Windsurf, Copilot) to ensure they generate UI components that match your specific **"Cyberpunk Neon / Ultimate Hybrid"** aesthetic while maintaining the **Multi-Tenant Architecture**.

-----

# 🎨 UI Design System: "Spree Break Quest"

## 1\. Design Philosophy

**The Vibe:** High-Energy Night Mode, Gamified Utility, "Cyberpunk Hybrid."
**Core Metaphor:** A tactical heads-up display (HUD) for a futuristic city explorer.
**Visual Signatures:**

  * **Deep Dark Backgrounds:** Pure black (`#050505`) to save OLED battery, with subtle deep indigo radial gradients.
  * **Glassmorphism:** UI cards are translucent (`bg-gray-900/60`) with `backdrop-blur-xl`.
  * **Neon Accents:** Primary actions use **Indigo-to-Pink** gradients. Status indicators use **Cyan** or **Amber**.
  * **Glows:** Buttons and cards have soft colored shadows (`shadow-indigo-500/50`) to simulate light emission.

-----

## 2\. Technical Architecture (Tailwind + CSS Variables)

**Constraint:** Do not use hardcoded colors (e.g., `bg-pink-500`) for structural elements. Use **Semantic Tokens** mapped to CSS variables to allow for white-labeling.

### Tailwind Config Map

```javascript
// tailwind.config.js extension
theme: {
  extend: {
    colors: {
      background: 'rgb(var(--color-background) / <alpha-value>)', // Deep Black
      surface: 'rgb(var(--color-surface) / <alpha-value>)',       // Glass Panel
      primary: 'rgb(var(--color-primary) / <alpha-value>)',       // Main Action (Indigo)
      secondary: 'rgb(var(--color-secondary) / <alpha-value>)',   // Secondary Action (Pink)
      accent: 'rgb(var(--color-accent) / <alpha-value>)',         // Highlights (Cyan)
    },
    textColor: {
      main: 'rgb(var(--color-text-main) / <alpha-value>)',        // White
      muted: 'rgb(var(--color-text-muted) / <alpha-value>)',      // Gray-400
    },
    borderRadius: {
      DEFAULT: 'var(--radius)', // 0.75rem (12px)
    },
    fontFamily: {
      sans: 'var(--font-sans)', // Inter
      mono: 'var(--font-mono)', // JetBrains Mono
    }
  }
}
```

-----

## 3\. The "Cyberpunk" Theme Definition

These are the specific values the agent must apply when the "Cyberpunk" theme is active.

| Token | CSS Variable Value (RGB) | Hex Equivalent | Description |
| :--- | :--- | :--- | :--- |
| `--color-background` | `5 5 5` | `#050505` | Almost pure black. |
| `--color-surface` | `17 24 39` | `#111827` | Deep Gray/Blue (Gray-900). |
| `--color-primary` | `79 70 229` | `#4f46e5` | Indigo-600. |
| `--color-secondary` | `219 39 119` | `#db2777` | Pink-600. |
| `--color-accent` | `6 182 212` | `#06b6d4` | Cyan-500. |
| `--radius` | `0.75rem` | `12px` | Modern, rounded corners. |
| `--blur-strength` | `12px` | `backdrop-blur-xl` | Heavy glass effect. |

**Background Gradient Rule:**
The main app wrapper should always use:
`bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-[#050505] to-[#000000]`

-----

## 4\. Component Patterns (Copy-Paste Ready)

### A. The "Glass Card" (Standard Container)

Used for Task Cards, Profile Stats, and Info panels.

  * **Key Classes:** `bg-surface/60`, `backdrop-blur-xl`, `border-white/10`.
  * **Shadow:** Deep, soft shadow `shadow-2xl`.

<!-- end list -->

```html
<div class="relative z-10 rounded-2xl border border-white/10 bg-surface/60 p-6 backdrop-blur-xl shadow-2xl">
  </div>
```

### B. The "Neon Gradient Button" (Primary Action)

Used for "Start Mission," "Scan," "Buy."

  * **Key Classes:** Gradient from `primary` to `secondary`.
  * **Glow:** `shadow-lg` colored by the primary color.
  * **Interaction:** `hover:scale-[1.02]`.

<!-- end list -->

```html
<button class="w-full rounded-xl bg-gradient-to-r from-primary to-secondary py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/40 transition-transform hover:scale-[1.02] active:scale-[0.98]">
  Start Mission
</button>
```

### C. The "Status Badge" (Tags)

Used for "XP," "Distance," "Rank."

  * **Key Classes:** `bg-primary/10`, `border-primary/30`, `text-primary-300`.

<!-- end list -->

```html
<span class="inline-block rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 shadow-[0_0_10px_-3px_rgba(6,182,212,0.5)]">
  Active Quest
</span>
```

### D. The "Energy Bar" (Progress)

Used for Health, Time Remaining, Zone Control.

  * **Container:** `bg-gray-800`.
  * **Fill:** Gradient `from-primary via-purple-500 to-secondary`.

<!-- end list -->

```html
<div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
  <div class="h-full w-3/4 bg-gradient-to-r from-primary via-purple-500 to-secondary shadow-[0_0_10px_rgba(168,85,247,0.6)]"></div>
</div>
```

### E. The "Glowing Input" (Form Field)

Used for Team Code Entry.

  * **Focus State:** The border glows when active.

<!-- end list -->

```html
<div class="group relative rounded-xl bg-surface/40 backdrop-blur-lg">
  <div class="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-accent via-primary to-accent opacity-0 transition-opacity duration-500 group-focus-within:opacity-100 group-focus-within:blur-sm"></div>
  
  <div class="relative flex items-center rounded-xl border border-white/10 bg-black/20 px-4">
    <input type="text" class="w-full bg-transparent py-4 font-mono font-bold uppercase text-white placeholder-gray-500 focus:outline-none" placeholder="CODE">
  </div>
</div>
```

-----

## 5\. Iconography & Typography Rules

### Icons

  * **Library:** Heroicons (Outline or Solid).
  * **Styling:** Icons are rarely plain white. They are usually wrapped in a **Glow Circle**.
  * **Example:**
    ```html
    <div class="h-10 w-10 rounded-full border border-primary/50 bg-primary/10 flex items-center justify-center text-indigo-300 shadow-[0_0_15px_-5px_rgba(79,70,229,0.5)]">
      <svg>...</svg>
    </div>
    ```

### Typography

  * **Headings:** Sans-serif (`var(--font-sans)`). Bold or Black weight.
  * **Data/Numbers:** Monospace (`var(--font-mono)`).
  * **Labels:** Uppercase, tracking-widest (letter-spacing), small text size (`text-[10px]` or `text-xs`).

-----

## 6\. Implementation Checklist for Agents

1.  [ ] **Always** wrap the main page content in the standard **Radial Gradient Background**.
2.  [ ] **Never** use white text on a light background. This is a Dark Mode app.
3.  [ ] Use `backdrop-blur-xl` sparingly on Android (consider media queries to reduce blur on low-power devices if possible, otherwise stick to standard classes).
4.  [ ] Ensure all "Call to Action" buttons use the **Gradient + Shadow** pattern to encourage clicks.
5.  [ ] Verify that text contrast is readable (Light Gray `text-indigo-100` on Dark Glass).
