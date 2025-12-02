Here is the **Updated UI Design System Document**. I have incorporated your specific code snippets into **Section 4 (Component Patterns)** and **Section 7 (Specific Layouts)**.

You can copy-paste this entire block into your AI Coding Agent (Cursor/Windsurf/Copilot) to ensure it generates exactly what you visualized.

-----

# 🎨 UI Design System: "Spree Break Quest" (Cyberpunk Edition)

## 1\. Design Philosophy

**The Vibe:** High-Energy Night Mode, Gamified Utility, "Cyberpunk Hybrid."
**Core Metaphor:** A tactical heads-up display (HUD) for a futuristic city explorer.
**Visual Signatures:**

  * **Deep Dark Backgrounds:** Pure black (`#050505`) to save OLED battery.
  * **Glassmorphism:** UI cards are translucent (`bg-gray-900/60`) with `backdrop-blur-xl`.
  * **Neon Accents:**
      * **Primary/Action:** Pink-to-Purple Gradients.
      * **Info/Tech:** Cyan/Teal Glows.
      * **Urgent:** Red/Orange.
  * **Haptics:** Visual "glitch" effects and pulse animations.

-----

## 2\. Technical Architecture

**Constraint:** Use Tailwind CSS utility classes combined with Semantic Variables.

### Global Background Rule

The main app wrapper must **always** use this gradient to prevent the app from feeling "flat" black:

```html
<div class="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-[#000000]">
```

-----

## 3\. Component Patterns (The "Building Blocks")

### A. The "Glass Task Card" (Cyberpunk Neon)

**Usage:** Main feed items (Tasks, Quests).
**Key Features:** Gradient progress bar, glowing border on hover, "Active" badge.

```html
<div class="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
  <div class="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-pink-500/30 blur-3xl"></div>
  <div class="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/30 blur-3xl"></div>
  
  <div class="relative z-10 flex flex-col gap-5">
    <div class="flex items-start justify-between">
      <div>
        <span class="mb-1 inline-block rounded-full border border-cyan-500/50 bg-cyan-950/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 shadow-[0_0_10px_-3px_rgba(6,182,212,0.7)]">
          Active Quest
        </span>
        <h2 class="text-2xl font-extrabold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Title Here</h2>
      </div>
      <div class="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1.5 rounded-full shadow-[0_0_15px_-3px_rgba(236,72,153,0.6)]">
        <span class="font-bold text-white text-sm">500 XP</span>
      </div>
    </div>

    <div class="space-y-1">
      <div class="flex justify-between text-xs font-medium text-white/70">
        <span>Progress</span>
        <span>1/3</span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-white/10 p-[1px]">
        <div class="h-full w-1/3 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 shadow-[0_0_10px_rgba(236,72,153,0.7)]"></div>
      </div>
    </div>
  </div>
</div>
```

### B. The "Scanner HUD" (Camera Overlay)

**Usage:** When user opens camera to verify task.
**Key Features:** Dashed borders, Corner brackets, "Pulse" animation.

```html
<div class="relative h-64 w-full rounded-2xl bg-gray-900 overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)]">
  <div class="absolute inset-0 bg-gray-800 opacity-40"></div>
  
  <div class="absolute inset-4 border-2 border-dashed border-cyan-500/50 rounded-xl"></div>
  <div class="absolute top-4 left-4 h-6 w-6 border-t-4 border-l-4 border-cyan-400"></div>
  <div class="absolute top-4 right-4 h-6 w-6 border-t-4 border-r-4 border-cyan-400"></div>
  <div class="absolute bottom-4 left-4 h-6 w-6 border-b-4 border-l-4 border-cyan-400"></div>
  <div class="absolute bottom-4 right-4 h-6 w-6 border-b-4 border-r-4 border-cyan-400"></div>

  <div class="absolute bottom-8 left-0 right-0 text-center">
    <span class="bg-black/60 text-cyan-400 px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest backdrop-blur-md border border-cyan-500/30 animate-pulse">
      Scanning Target...
    </span>
  </div>
</div>
```

### C. The "Shop Item" (Micro-Transaction)

**Usage:** Purchasing skips/hints.
**Key Features:** Group Hover glow effect, Pink/Purple gradient theme.

```html
<div class="relative group cursor-pointer w-full">
  <div class="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>

  <div class="relative z-10 flex items-center gap-4 rounded-2xl border border-white/10 bg-gray-900/80 p-4 backdrop-blur-xl hover:border-pink-500/50 transition-colors">
    <div class="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center shadow-[inset_0_0_10px_rgba(236,72,153,0.2)]">
      </div>
    <div class="grow">
      <div class="flex justify-between items-start">
        <h4 class="text-white font-bold text-lg">Item Name</h4>
        <span class="text-xs font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">POPULAR</span>
      </div>
      <p class="text-gray-400 text-xs mt-1">Description text.</p>
    </div>
    <button class="flex flex-col items-center justify-center rounded-lg bg-white text-black px-4 py-2 font-bold hover:bg-pink-400 transition-colors">
      <span>€2.99</span>
    </button>
  </div>
</div>
```

### D. The "Success Toast" (Notification)

**Usage:** XP gain, Task Complete.
**Key Features:** Grid background pattern, Cyan theme, Slide-in animation.

```html
<div class="relative overflow-hidden rounded-xl bg-black/90 border-l-4 border-cyan-500 p-4 shadow-[0_0_30px_-5px_rgba(6,182,212,0.4)] flex items-center gap-4 backdrop-blur-md">
  <div class="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(6,182,212,0.2)_1px,transparent_1px)] bg-[length:10px_10px]"></div>

  <div class="relative z-10 h-10 w-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/50">
    </div>
  <div class="relative z-10">
    <h4 class="text-white font-bold uppercase italic tracking-wide">Task Complete</h4>
    <p class="text-cyan-400 text-xs font-mono font-bold">+500 XP ADDED</p>
  </div>
</div>
```

### E. The "Cyber Toggles" (Settings)

**Usage:** Profile settings.
**Key Features:** Custom toggle switch.

```html
<div class="flex items-center justify-between">
  <span class="text-gray-200 font-bold text-sm">Label</span>
  <div class="relative h-6 w-12 rounded-full bg-pink-600/20 border border-pink-500 cursor-pointer shadow-[0_0_10px_rgba(236,72,153,0.3)]">
    <div class="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-pink-500 shadow-sm"></div>
  </div>
  </div>
```

-----

## 4\. Specific Layouts

### A. Bottom Navigation Bar

**Style:** Floating Glass Bar (Not attached to bottom edge).
**Active State:** Icon glows with a blur effect behind it.

```html
<div class="fixed bottom-6 left-4 right-4 z-50">
  <div class="relative rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl px-2 py-4 shadow-[0_0_20px_-5px_rgba(236,72,153,0.3)] flex justify-around items-center">
    
    <button class="relative flex flex-col items-center gap-1 text-cyan-400">
      <div class="absolute -top-4 w-8 h-8 bg-cyan-500/40 rounded-full blur-lg"></div>
      <svg class="w-6 h-6 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">...</svg>
      <span class="text-[9px] font-bold uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">Label</span>
    </button>

    <button class="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
      <svg class="w-6 h-6">...</svg>
      <span class="text-[9px] font-bold uppercase">Label</span>
    </button>
  </div>
</div>
```

### B. Splash Screen Title

**Style:** Glitchy, Large, Gradients.

```html
<div class="text-center">
  <h1 class="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-500 italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-2">
    URBAN<br>CHASE
  </h1>
  <p class="text-sm font-mono text-cyan-300 uppercase tracking-[0.3em] mb-8 animate-pulse">
    System Online
  </p>
  <button class="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-transparent font-mono border-2 border-white focus:outline-none hover:border-pink-500 hover:text-pink-500">
    <span class="absolute w-full h-full -mt-1 -ml-1 transition-all duration-200 bg-pink-600 rounded opacity-0 group-hover:opacity-20"></span>
    START GAME
  </button>
</div>
```