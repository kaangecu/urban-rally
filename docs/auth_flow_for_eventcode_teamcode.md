The Golden Rule for Event Apps: "Don't block the door. Block the seat."

You should allow users to get as deep into the app as possible before asking for credentials. Authentication is "work"; browsing is "fun."

Here is the analysis of Where, How, and What to collect.

1. 📍 Where to place Auth? (The "Just-in-Time" Strategy)
Do not force login on the Landing Screen. It kills conversion. Instead, use Lazy Authentication.

Path A: The Browser (Event Code Flow)
Landing: User clicks "Enter Event Code."

Event Code: User enters code. (System creates a temporary anonymous session).

Browse Teams: User can see who is playing, check the leaderboard, and see empty slots. (Still Anonymous/Un-authed).

Select Team: User taps "Join Squad."

🚧 AUTH TRIGGER: The app prompts: "Who is joining this squad?"

Success: User is authenticated and added to the team.

Path B: The Sniper (Team Code Flow)
Landing: User clicks "Have Team Code?"

Team Code: User enters code (e.g., NEON-42).

🚧 AUTH TRIGGER: Valid code found. App prompts: "Joining Team 'Neon Spectres'. Create your profile."

Success: User is authenticated and added.

Path C: The Scanner (QR Code Flow)
Action: User scans a physical QR code at the event.

Deep Link: App opens directly to the Team Detail sheet.

Action: User taps "Join."

🚧 AUTH TRIGGER: Same as Path A.



Auth Component 

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans overflow-y-auto">
  
  <div class="absolute inset-0 bg-black/90 backdrop-blur-xl"></div>

  <div class="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl my-auto">
    
    <div class="absolute top-0 right-0 -mt-16 -mr-16 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl"></div>
    <div class="absolute bottom-0 left-0 -mb-16 -ml-16 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl"></div>
    
    <div class="relative z-10 p-6">
      
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gray-800 border border-white/10 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
           <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.5 2-2 2h4c-1.5 0-2-1.116-2-2z"></path></svg>
        </div>
        <h2 class="text-xl font-black text-white uppercase italic tracking-wider">Identity Uplink</h2>
        <p class="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
          Establishing Secure Connection...
        </p>
      </div>

      <div class="space-y-4">

        <div class="grid grid-cols-2 gap-4">
          
          <div class="group">
            <label class="block text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1.5 ml-1">
              First Name <span class="text-pink-500">*</span>
            </label>
            <div class="relative flex items-center rounded-xl bg-gray-900 border border-white/10 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)] transition-all">
              <input type="text" placeholder="ALEX" class="w-full bg-transparent py-3.5 px-4 text-white placeholder-gray-700 font-bold uppercase tracking-wide focus:outline-none font-mono">
            </div>
          </div>

          <div class="group">
            <label class="block text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1.5 ml-1">
              Last Name <span class="text-pink-500">*</span>
            </label>
            <div class="relative flex items-center rounded-xl bg-gray-900 border border-white/10 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)] transition-all">
              <input type="text" placeholder="RIDER" class="w-full bg-transparent py-3.5 px-4 text-white placeholder-gray-700 font-bold uppercase tracking-wide focus:outline-none font-mono">
            </div>
          </div>
        
        </div>

        <div class="group">
          <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
            Recovery Email <span class="text-[9px] bg-white/5 px-1.5 py-0.5 rounded ml-2 border border-white/5 text-gray-600">OPTIONAL</span>
          </label>
          <div class="relative flex items-center rounded-xl bg-gray-900 border border-white/10 focus-within:border-pink-500/50 focus-within:shadow-[0_0_15px_-3px_rgba(236,72,153,0.3)] transition-all">
            <svg class="w-4 h-4 text-gray-600 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <input type="email" placeholder="backup@link.com" class="w-full bg-transparent py-3.5 px-3 text-white placeholder-gray-700 font-medium text-sm focus:outline-none">
          </div>
        </div>

        <div class="space-y-3 pt-2">
          
          <label class="flex items-start gap-3 cursor-pointer group">
            <div class="relative flex items-center mt-0.5">
              <input type="checkbox" class="peer sr-only">
              <div class="h-5 w-5 rounded border border-gray-600 bg-gray-900 peer-checked:bg-cyan-500 peer-checked:border-cyan-400 transition-all flex items-center justify-center shadow-inner">
                 <svg class="w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path></svg>
              </div>
            </div>
            <span class="text-[10px] text-gray-400 leading-snug group-hover:text-gray-300 transition-colors">
              Agree to <span class="text-cyan-400 underline decoration-cyan-500/30">Terms</span> & <span class="text-cyan-400 underline decoration-cyan-500/30">Privacy</span>.
            </span>
          </label>

          <label class="flex items-start gap-3 cursor-pointer group">
            <div class="relative flex items-center mt-0.5">
              <input type="checkbox" class="peer sr-only">
              <div class="h-5 w-5 rounded border border-gray-600 bg-gray-900 peer-checked:bg-cyan-500 peer-checked:border-cyan-400 transition-all flex items-center justify-center shadow-inner">
                 <svg class="w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path></svg>
              </div>
            </div>
            <span class="text-[10px] text-gray-400 leading-snug group-hover:text-gray-300 transition-colors">
              Allow data processing for leaderboard.
            </span>
          </label>

        </div>

      </div>

      <button class="group relative w-full mt-6 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-[1px] font-bold text-white shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]">
        <span class="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-50 blur-sm transition-opacity group-hover:opacity-100"></span>
        <div class="relative flex items-center justify-center rounded-xl bg-gray-900/50 backdrop-blur-md py-4 text-sm font-black uppercase tracking-widest transition-colors group-hover:bg-transparent">
          Create ID
        </div>
      </button>

    </div>
  </div>
</div>