This styling guide is optimized for **coding agents** (Cursor, Copilot, Windsurf) to systematically implement the "Tactical Ops" Admin Theme.

---

# 🛡️ Admin UI Design System: "Tactical Ops"

## 1. Design Philosophy

**The Vibe:** Mission Control, Military HUD, Field Monitor.
**The Goal:** High data density, low eye strain in dark environments, immediate readability of critical status.
**Core Principles:**

* **Zero Fluff:** No decorative gradients or glassmorphism. Use solid, opaque backgrounds.
* **High Contrast Status:** Status indicators (Green/Red/Orange) must pop against the dark slate background.
* **Monospace Data:** All numbers, IDs, and coordinates must use a monospaced font for rapid scanning.
* **Borders over Shadows:** Use 1px borders to define hierarchy instead of shadows.

---

## 2. Technical Architecture (Tailwind v4)

### Color Palette (Semantic Tokens)

Do not use raw colors like `bg-slate-900`. Use these semantic definitions in your Tailwind config or CSS variables.

| Token | Tailwind Class | Hex Value | Usage |
| --- | --- | --- | --- |
| `bg-admin-main` | `bg-[#0f172a]` | Slate-900 | Main app background. |
| `bg-admin-surface` | `bg-[#1e293b]` | Slate-800 | Cards, Sidebars, Headers. |
| `border-admin` | `border-slate-700` | Slate-700 | All borders and dividers. |
| `text-admin-body` | `text-slate-200` | Slate-200 | Primary reading text. |
| `text-admin-muted` | `text-slate-500` | Slate-500 | Labels, secondary info. |
| `status-good` | `emerald-500` | `#10b981` | Online, Approved, Active. |
| `status-bad` | `red-500` | `#ef4444` | Offline, Rejected, SOS. |
| `status-warn` | `orange-400` | `#fb923c` | Pending, Warning. |
| `action-primary` | `blue-600` | `#2563eb` | Buttons, Links. |

### Typography Rules

* **Headings/UI:** `font-sans` (Inter/System) - Uppercase labels, tracking-widest.
* **Data/Values:** `font-mono` (JetBrains/Roboto Mono) - Timestamps, IDs, Scores, Coordinates.

---

## 3. Component Patterns (Copy-Paste Ready)

### A. The Tactical Card (Standard Container)

Used for widgets, stats, and lists.
**Key Traits:** Solid Slate-800 background, 1px Slate-700 border, Rounded-xl.

```html
<div class="bg-[#1e293b] border border-slate-700 rounded-xl p-4 shadow-sm">
  <div class="flex justify-between items-center mb-3">
    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Card Title</h3>
    <button class="text-blue-400 hover:text-blue-300 text-xs font-bold">Edit</button>
  </div>
  <div class="text-slate-200">Content here...</div>
</div>

```

### B. Status Indicators (The "Traffic Lights")

Used heavily to indicate state. Always pair a colored dot/bg with text.

**1. Live/Active (Pulse):**

```html
<div class="flex items-center gap-2">
  <div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
  <span class="text-xs font-bold text-slate-200 uppercase tracking-wide">System Online</span>
</div>

```

**2. Badge Style (Table Cells):**

```html
<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
  Active
</span>

```

### C. Data Value Display (Stat Box)

Used for showing metrics like "Total Users" or "Score".
**Key Traits:** Muted Label (Sans), Big Value (Mono).

```html
<div class="bg-[#0f172a] border border-slate-700 p-3 rounded-lg">
  <span class="block text-[10px] text-slate-500 uppercase font-bold mb-1">Total XP</span>
  <span class="text-xl font-mono font-bold text-white">2,450</span>
  <span class="block text-[10px] text-emerald-500 mt-1 font-mono">▲ +120</span>
</div>

```

### D. The "Kill Switch" Button (Primary Action)

Used for Approve/Reject/Ban.
**Key Traits:** Uppercase, Bold, No Shadows, 100% Opacity on Hover.

```html
<button class="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
  Confirm Action
</button>

<button class="bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
  Reject / Ban
</button>

```

### E. The Dense Data Table

Used for lists of teams or logs.
**Key Traits:** Tight padding (`py-2`), Monospace numbers, Hover row highlight.

```html
<div class="w-full overflow-hidden rounded-lg border border-slate-700">
  <table class="w-full text-left text-sm">
    <thead class="bg-[#0f172a] text-[10px] uppercase font-bold text-slate-500 border-b border-slate-700">
      <tr>
        <th class="px-4 py-2">Team</th>
        <th class="px-4 py-2">Status</th>
        <th class="px-4 py-2 text-right">Value</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-700 bg-[#1e293b]">
      <tr class="hover:bg-slate-700/50 transition-colors cursor-pointer">
        <td class="px-4 py-2 font-medium text-slate-200">Team Alpha</td>
        <td class="px-4 py-2">
          <span class="text-emerald-400 text-xs font-mono">● Online</span>
        </td>
        <td class="px-4 py-2 text-right font-mono text-slate-300">#482</td>
      </tr>
    </tbody>
  </table>
</div>

```

---

## 4. Implementation Rules for Agents

1. **Always use `font-mono` for IDs and Numbers.**
* *Bad:* `<span class="font-sans">Score: 100</span>`
* *Good:* `<span class="font-sans text-xs">Score:</span> <span class="font-mono text-white">100</span>`


2. **Avoid pure black.** Use `#0f172a` (Slate-900) for the background to maintain the "Tactical" blue-tinted dark mode.
3. **Keep text size small.** Admin interfaces need density.
* Labels: `text-[10px]` or `text-xs`.
* Body: `text-sm`.
* Headings: `text-sm` or `text-base` (rarely larger).


4. **Use Borders for separation.** Do not use spacing or shadows to separate content. Use `border-slate-700`.
5. **Mobile First.** Always ensure buttons are at least `h-10` or `p-3` on mobile breakpoints for touch targets, even if they look dense on desktop.