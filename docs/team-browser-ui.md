Example UI

<div class="min-h-screen bg-[#050505] p-6 flex flex-col gap-10 font-sans items-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-[#050505] to-[#000000]">

  <div class="w-full max-w-md">
    <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 italic uppercase tracking-tighter">
      SQUAD SELECT
    </h1>
    <p class="text-cyan-300/70 text-xs font-mono uppercase tracking-widest animate-pulse mt-1">
      > 12 Squads Nearby
    </p>
  </div>

  <div class="w-full max-w-md space-y-4 relative z-10">
    <div class="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-xl shadow-lg group focus-within:bg-white/10 transition-colors">
       <svg class="w-5 h-5 text-pink-400 group-focus-within:text-pink-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
       <input type="text" placeholder="Find squad name..." class="w-full bg-transparent border-none focus:outline-none text-white ml-3 font-medium placeholder-white/30">
    </div>

    <div class="flex gap-3">
      <button class="px-4 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/50 text-pink-300 text-[10px] font-bold uppercase tracking-wider hover:bg-pink-500/30 transition-colors">
        Space Available
      </button>
      <button class="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors">
        Friends
      </button>
    </div>
  </div>

  <div class="w-full max-w-md space-y-4 relative z-10 pb-20">
    
    <div class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-xl cursor-pointer transition-all hover:scale-[1.01] hover:border-cyan-400/30">
      
      <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div class="absolute top-0 right-0 rounded-bl-xl border-l border-b border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
        <div class="flex items-center gap-1.5">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span class="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">Open</span>
        </div>
      </div>

      <div class="relative z-10 flex items-center gap-4 mb-5">
        <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20">
          <div class="h-full w-full rounded-[10px] bg-gray-900 flex items-center justify-center">
             <span class="text-xl">🚀</span>
          </div>
        </div>
        <h3 class="text-white font-extrabold text-lg tracking-tight group-hover:text-cyan-200 transition-colors">
          Cyber_Runners
        </h3>
      </div>

      <div class="relative z-10">
        <div class="flex justify-between text-[10px] font-bold text-cyan-200/70 mb-1.5 uppercase tracking-wide">
           <span>Capacity</span>
           <span>3 / 6 Members</span>
        </div>
        <div class="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
           <div class="h-full w-3/6 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
        </div>
      </div>
    </div>


    <div class="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm grayscale-[50%] opacity-80">
      
      <div class="absolute top-0 right-0 rounded-bl-xl border-l border-b border-red-500/20 bg-red-500/10 px-3 py-1.5">
        <span class="text-[10px] font-bold text-red-400 uppercase tracking-wider">Full Squad</span>
      </div>

      <div class="flex items-center gap-4 mb-5">
        <div class="h-12 w-12 rounded-xl bg-gray-800 border border-white/10 flex items-center justify-center opacity-70">
           <span class="text-xl">💀</span>
        </div>
        <h3 class="text-gray-300 font-bold text-lg tracking-tight">Night_Stalkers</h3>
      </div>

      <div>
        <div class="flex justify-between text-[10px] font-bold text-red-300/50 mb-1.5 uppercase tracking-wide">
           <span>Capacity</span>
           <span>6 / 6 Members</span>
        </div>
        <div class="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
           <div class="h-full w-full bg-red-900/50"></div>
        </div>
      </div>
    </div>


    <div class="group relative overflow-hidden rounded-2xl border border-pink-500/20 bg-white/5 p-5 backdrop-blur-xl shadow-xl cursor-pointer hover:border-pink-500/50 transition-colors">
      
      <div class="absolute top-0 right-0 rounded-bl-xl border-l border-b border-pink-500/20 bg-pink-500/10 px-3 py-1.5">
        <div class="flex items-center gap-1.5">
          <svg class="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          <span class="text-[10px] font-bold text-pink-300 uppercase tracking-wider">Locked</span>
        </div>
      </div>

      <div class="relative z-10 flex items-center gap-4 mb-5">
        <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 p-[1px] shadow-lg shadow-pink-500/20">
          <div class="h-full w-full rounded-[10px] bg-gray-900 flex items-center justify-center">
             <span class="text-xl">🍒</span>
          </div>
        </div>
        <h3 class="text-white font-extrabold text-lg tracking-tight">Pacha Queens</h3>
      </div>

      <div class="relative z-10">
        <div class="flex justify-between text-[10px] font-bold text-pink-200/70 mb-1.5 uppercase tracking-wide">
           <span>Capacity</span>
           <span>5 / 6 Members</span>
        </div>
        <div class="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
           <div class="h-full w-5/6 bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
        </div>
      </div>
    </div>

  </div>

  <div class="fixed bottom-0 left-0 right-0 z-50">
      <div class="relative rounded-t-3xl border-t border-white/10 bg-gray-900/90 p-6 backdrop-blur-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)] max-w-md mx-auto">
        
        <div class="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8"></div>

        <div class="flex items-center gap-4 mb-6">
            <div class="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div class="h-full w-full rounded-[15px] bg-gray-900 flex items-center justify-center">
                 <span class="text-3xl">🚀</span>
              </div>
            </div>
            <div>
              <h2 class="text-2xl font-black text-white tracking-tight uppercase italic">Cyber_Runners</h2>
              <div class="flex items-center gap-2 mt-1">
                 <span class="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                 <span class="text-xs font-mono text-cyan-400">OPEN TO JOIN</span>
              </div>
            </div>
        </div>

        <div class="mb-8">
            <div class="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
               <span>Squad Capacity</span>
               <span class="text-white">3/6</span>
            </div>
            <div class="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
               <div class="h-full w-3/6 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]"></div>
            </div>
        </div>

        <button class="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-900/50 transition-transform hover:scale-[1.02] active:scale-[0.98]">
          Join Squad
        </button>
      </div>
  </div>

</div>


-----


This is a comprehensive implementation guide for building the **Team Browsing Screen** in React with Tailwind CSS v4.

Since you are using **Tailwind v4**, we will utilize modern CSS variables for theming, which keeps your codebase clean and makes the "Cyberpunk" glow effects easy to manage.

-----

### 1\. Project Setup (Tailwind v4)

Tailwind v4 relies heavily on native CSS variables. We will define our Cyberpunk colors in your main CSS file.

**`src/index.css` (or `App.css`)**
Add these variables to the `@theme` directive. This makes them available as utility classes (e.g., `bg-neon-pink`, `text-neon-cyan`).

```css
@import "tailwindcss";

@theme {
  /* 1. Define Brand Colors */
  --color-neon-pink: #ec4899;   /* Pink-500 */
  --color-neon-cyan: #06b6d4;   /* Cyan-500 */
  --color-neon-purple: #a855f7; /* Purple-500 */
  --color-neon-red: #ef4444;    /* Red-500 */
  
  /* 2. Define Surface Colors (Glassmorphism) */
  --color-glass-surface: rgba(255, 255, 255, 0.05);
  --color-glass-border: rgba(255, 255, 255, 0.1);
  
  /* 3. Define Fonts */
  --font-sans: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* 4. Custom Animations */
  --animate-pulse-slow: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Global Styles for the Cyberpunk Background */
body {
  background-color: #050505;
  background-image: radial-gradient(ellipse at top, #1e1b4b, #050505, #000000);
  color: white;
  min-height: 100vh;
}
```

-----

### 2\. Component Architecture

We will break the screen down into reusable React components to keep the code clean.

**Directory Structure:**

```text
src/
├── components/
│   ├── ui/
│   │   ├── Badge.jsx          (Status indicators)
│   │   ├── ProgressBar.jsx    (Capacity bars)
│   │   └── SearchBar.jsx      (Glass input)
│   └── teams/
│       ├── TeamCard.jsx       (The main list item)
│       └── TeamList.jsx       (Grid wrapper)
├── pages/
│   └── TeamBrowser.jsx        (Main Screen)
```

-----

### 3\. Core UI Components

#### A. The Status Badge

Handles the "Open", "Full", and "Locked" visual states.

```jsx
// src/components/ui/Badge.jsx
const variants = {
  open: "border-cyan-500/20 bg-cyan-500/10 text-neon-cyan",
  full: "border-red-500/20 bg-red-500/10 text-red-400",
  locked: "border-neon-pink/20 bg-neon-pink/10 text-neon-pink",
};

export default function Badge({ status, icon, label }) {
  const styles = variants[status] || variants.open;
  
  return (
    <div className={`absolute top-0 right-0 rounded-bl-xl border-l border-b px-3 py-1.5 backdrop-blur-md ${styles}`}>
      <div className="flex items-center gap-1.5">
        {status === 'open' && (
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
           </span>
        )}
        {icon && <span className="w-3 h-3">{icon}</span>}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}
```

#### B. The Progress Bar

A reusable linear bar that changes color based on the team type.

```jsx
// src/components/ui/ProgressBar.jsx
export default function ProgressBar({ current, max, colorClass }) {
  // Calculate percentage
  const percentage = Math.min((current / max) * 100, 100);
  
  return (
    <div className="relative z-10">
      <div className={`flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wide opacity-70 ${colorClass}`}>
         <span>Capacity</span>
         <span>{current} / {max} Members</span>
      </div>
      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
         <div 
           style={{ width: `${percentage}%` }}
           className={`h-full shadow-[0_0_10px_currentColor] transition-all duration-500 ${colorClass.replace('text-', 'bg-')}`}
         ></div>
      </div>
    </div>
  );
}
```

-----

### 4\. The Team Card Component

This acts as the "Controller" for the styles. It accepts props and determines which visual style (Cyan, Red, or Pink) to render.

```jsx
// src/components/teams/TeamCard.jsx
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';

export default function TeamCard({ team, onClick }) {
  // 1. Determine Style Config based on status
  const config = {
    open: {
      wrapper: "hover:border-neon-cyan/30 hover:scale-[1.01]",
      glow: "from-cyan-500/10 to-blue-500/10",
      avatarBg: "from-cyan-500 to-blue-600",
      avatarShadow: "shadow-neon-cyan/20",
      textHover: "group-hover:text-cyan-200",
      barColor: "text-neon-cyan bg-gradient-to-r from-neon-cyan to-blue-500"
    },
    full: {
      wrapper: "grayscale-[50%] opacity-80 cursor-not-allowed",
      glow: "hidden",
      avatarBg: "bg-gray-800",
      avatarShadow: "",
      textHover: "",
      barColor: "text-red-300 bg-red-900"
    },
    locked: {
      wrapper: "hover:border-neon-pink/50",
      glow: "from-pink-500/10 to-purple-500/10",
      avatarBg: "from-neon-pink to-neon-purple",
      avatarShadow: "shadow-neon-pink/20",
      textHover: "",
      barColor: "text-neon-pink bg-gradient-to-r from-neon-pink to-neon-purple"
    }
  };

  const theme = config[team.status];

  return (
    <div 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-glass-border bg-glass-surface p-5 backdrop-blur-xl shadow-xl transition-all cursor-pointer ${theme.wrapper}`}
    >
      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity ${theme.glow}`}></div>

      {/* Status Badge */}
      <Badge status={team.status} label={team.statusLabel} />

      {/* Card Content */}
      <div className="relative z-10 flex items-center gap-4 mb-5">
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br p-[1px] shadow-lg ${theme.avatarBg} ${theme.avatarShadow}`}>
          <div className="h-full w-full rounded-[10px] bg-gray-900 flex items-center justify-center text-xl">
            {team.emoji}
          </div>
        </div>
        <h3 className={`text-white font-extrabold text-lg tracking-tight transition-colors ${theme.textHover}`}>
          {team.name}
        </h3>
      </div>

      {/* Capacity Bar */}
      <ProgressBar 
        current={team.members} 
        max={team.maxMembers} 
        colorClass={theme.barColor} 
      />
    </div>
  );
}
```

-----

### 5\. The Main Page Implementation

Assemble the parts. Notice the use of the `max-w-md` container to ensure it looks like a mobile app even on desktop screens.

```jsx
// src/pages/TeamBrowser.jsx
import { useState } from 'react';
import TeamCard from '../components/teams/TeamCard';

const MOCK_TEAMS = [
  { id: 1, name: "Cyber_Runners", status: "open", statusLabel: "Open", members: 3, maxMembers: 6, emoji: "🚀" },
  { id: 2, name: "Night_Stalkers", status: "full", statusLabel: "Full Squad", members: 6, maxMembers: 6, emoji: "💀" },
  { id: 3, name: "Pacha Queens", status: "locked", statusLabel: "Locked", members: 5, maxMembers: 6, emoji: "🍒" },
];

export default function TeamBrowser() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex flex-col items-center p-6 gap-8 min-h-screen pb-24">
      
      {/* 1. Header */}
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-pink italic uppercase tracking-tighter">
          Squad Select
        </h1>
        <p className="text-neon-cyan/70 text-xs font-mono uppercase tracking-widest animate-pulse mt-1">
          &gt; {MOCK_TEAMS.length} Squads Nearby
        </p>
      </div>

      {/* 2. Search & Filter */}
      <div className="w-full max-w-md space-y-4 relative z-10">
        <div className="flex items-center bg-glass-surface border border-glass-border rounded-xl px-4 py-3 backdrop-blur-xl shadow-lg group focus-within:bg-white/10 transition-colors">
           <svg className="w-5 h-5 text-neon-pink group-focus-within:text-pink-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
           <input 
             type="text" 
             placeholder="Find squad name..." 
             className="w-full bg-transparent border-none focus:outline-none text-white ml-3 font-medium placeholder-white/30"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        
        {/* Filter Chips */}
        <div className="flex gap-3">
          <button className="px-4 py-1.5 rounded-full bg-neon-pink/20 border border-neon-pink/50 text-neon-pink text-[10px] font-bold uppercase tracking-wider hover:bg-neon-pink/30 transition-colors">
            Space Available
          </button>
          <button className="px-4 py-1.5 rounded-full bg-glass-surface border border-glass-border text-gray-400 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors">
            Friends
          </button>
        </div>
      </div>

      {/* 3. Team List */}
      <div className="w-full max-w-md space-y-4 relative z-10">
        {MOCK_TEAMS.map((team) => (
          <TeamCard 
            key={team.id} 
            team={team} 
            onClick={() => console.log('Open Sheet', team.id)} 
          />
        ))}
      </div>

    </div>
  );
}
```

### 6\. Implementation Checklist

1.  **Background:** Ensure your `div` or `body` has the `radial-gradient` applied, otherwise the glass cards will look flat gray instead of frosted.
2.  **Z-Index:** The cards use `relative z-10` to ensure they sit above the background glow but below any potential modal sheets.
3.  **Gradients:** Use `bg-gradient-to-br` (Bottom Right) for Avatars to give them depth.
4.  **Touch Targets:** Ensure the entire card is clickable (`cursor-pointer`) and has a hover scale effect (`hover:scale-[1.01]`) to feel tactile on mobile.