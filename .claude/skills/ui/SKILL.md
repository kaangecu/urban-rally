---
name: ui
description: Build, change or review Urban Rally screens and components (React 19 + Tailwind 4) so they match the app's themes, tokens and states. Use for any UI, styling, layout, copy-on-screen or design-review work in src/.
---

# Urban Rally UI

Players use this app on a phone, outdoors, walking, often in sunlight. Each tenant picks a theme: the light theme (default) or the cyberpunk theme (`themeStyle: "cyberpunk"` or tenant id `urban-chase`, see `src/utils/theme.ts`). Work inside that system. Don't invent a new look.

The target is the design system's Night and Daylight themes in the Blend style (see section 3). The theming port moves the app there. After it, a tenant picks Night or Daylight only, not its own primary colour, because the contrast checks assume the system's magenta. Until a screen is ported, match what the code does today.

## 1. Plan before code

Write this plan in your reply before editing, and keep it short:

1. **Screen and job.** Which screen, and the one thing the player does there.
2. **Nearest exemplar.** The existing component you will follow (see `references/inventory.md`). Copy its structure, theme branching and class names.
3. **States.** Default, empty, loading, error, success, and offline or permission-denied where relevant. Write the real copy for each state.
4. **Wireframe.** An ASCII sketch at 390px wide, showing what is above the fold.
5. **Themes.** What changes between light and cyberpunk.

For anything bigger than one screen, follow the AGENTS.md workflow: write a one-page spec from `docs/specs/TEMPLATE.md`, write the failing tests, and stop for review before building.

## 2. Rules

**Tokens and classes**
- Colors come from the `@theme` variables in `src/index.css` and from `themeClasses` in `src/utils/theme.ts`. Reuse `glass-*`, `neon-*` and `themeClasses.*` before adding styles.
- New code adds no raw palette classes (`bg-gray-500`, `text-pink-400`), hex values or arbitrary classes (`bg-[#050505]`, `w-[37px]`). If a token is missing, say so in the plan instead of hard-coding one.
- Icons come from `lucide-react`, which is already installed. Never use emoji as icons or inside task titles.

**Layout and touch**
- Touch targets are at least 44×44px (WCAG 2.5.8 sets the floor at 24px; Apple's guidance is 44pt). Inputs use 16px text so iOS doesn't zoom.
- Text is at least 14px. Uppercase labels are at least 13px with letter-spacing, and three words at most.
- No horizontal scroll at 390px. Sticky headers, bottom nav and bottom sheets must not cover the focused element (WCAG 2.4.11).
- Put the main action within thumb reach, in the lower half of the screen or in a sheet footer.

**Content**
- Use real content (task names, team names, distances, points), never lorem ipsum.
- Points are always "pts": "+80 pts", "1,250 pts". Never XP.
- Errors say what happened and what to do next: "That code doesn't match a team. Check your event card." Never just "Something went wrong."
- Handle plurals ("1 task", "2 tasks"). Buttons start with a verb.
- Access codes allow paste and don't block password managers (WCAG 3.3.8).

**Accessibility (WCAG 2.2 AA)**
- Text contrast is at least 4.5:1, or 3:1 for 24px+ text. Control borders, focus rings and meaningful icons are at least 3:1.
- Never use color as the only cue. Status needs a word or icon, and map pins need a shape or label.
- Text color and surface color always come from the same theme branch. White text on a white light-mode modal is a bug this app has shipped before.
- Use real `<button>`, `<a>`, `<label>` and `<input>` elements. Icon-only buttons need an `aria-label`.

## 3. Theme rules

- **Light theme:** solid white surfaces on `gray-100`, a single tenant `primaryColor` for the main action, and no glow or blur.
- **Cyberpunk theme:** near-black ground, neon pink and cyan. Glow means "live": focus, the active tab, the selected item. Don't glow everything.
- **Blend style (the target for ported screens):** corners are 16px on cards and 12px on controls; buttons, tags and chips are pills; there are no chamfers. The only gradient is a one-hue magenta on the primary button, and a disabled primary goes flat grey. One soft magenta glow sits behind the header. Lists leave room at the bottom so the floating nav never hides the last item or the focused element.
- **Glass (`glass-*`, `backdrop-blur`):** only where content moves underneath it: the header and the floating bottom nav over a scrolling list, panels over the map, the camera bars and bottom sheets. Cards inside a list stay solid, and glass never stacks on glass. Over a flat page that doesn't move the blur is invisible but still costs GPU time. Use a tint of 86% or more over the map (text stays 11.6:1 on a white tile). Over the camera use the dark tint in both themes: a light tint needs 90% before red text passes over a black frame.
- Anything that differs by theme gets a branch for both themes. Components that only style for cyberpunk (TaskDetail, BottomNav today) are known gaps. Don't copy that pattern.

## 4. Avoid the generic AI look

Models drift toward safe defaults. Check your plan and your result against this list:

- Multi-hue gradients (pink to purple, magenta to cyan) on buttons, headings or progress. The one-hue magenta on the primary button is the only gradient.
- Identical rounded cards with a shadow for every block, or a "stats dashboard" of big numbers above the content the player came for.
- Decorative blurred orbs beyond the single header glow, and sparkles, trophies or emoji that carry no information.
- An eyebrow label above every heading, and fade-ins on everything.
- Inventing new fonts, colors or radii. Preserve the established patterns, structure and visual language.
- Generic copy such as "Start your adventure", "Active Quest" or "Mission". Say "Task", "Take photo" or "Join".

## 5. Check the result

Run this loop for every visible change.

1. **Run the app.** Start the emulators with `npm run emulators`, then the dev server with `VITE_USE_EMULATOR=true npm run dev`. Never run the `setup-*` or `add-*` seed scripts: they write to the real Firebase project. If the emulator has no event or team to play with, ask the user how to get test data into it.
2. **Screenshot.** Run `node .claude/skills/ui/scripts/shoot.mjs <url-or-file> --name <screen>-<theme> --state .ui-shots/<theme>.json` to capture 390×844. The script also prints any horizontal overflow and tap targets smaller than 44px. The theme comes from the signed-in team's tenant, so take one shot per theme, each with a saved sign-in:
   - Save a sign-in once per theme: run `npx playwright codegen --save-storage=.ui-shots/light.json http://localhost:5173` against the emulator, join with a light tenant's team, and close the window. Do the same with a cyberpunk tenant's team for `.ui-shots/cyberpunk.json`.
   - Leave out `--state` for signed-out screens such as join.
3. **Compare against a reference.** The reference is the before screenshot, the matching frame on the screen board (see `references/inventory.md`), or a mockup the user gave you. List the differences you intended and the ones you didn't.
4. **Get a separate review.** Hand the screenshots, the reference and the diff to the `ui-reviewer` subagent. It didn't write the code, so it grades more honestly.
5. **Iterate.** Fix what you agree with. Do at most **2 review rounds**, because almost all the gain comes from the first one. Re-read your diff after each round, since code quality tends to slip.
6. **Finish.** Run `npm run check`. Report what the reviewer raised that you didn't fix, and why.

The review is advice. It never decides on its own whether something ships, and the user's judgment and a real playtest on a phone outrank it. Never run Playwright with `--update-snapshots` unless the user asks.

## References

- `references/inventory.md`: tokens, classes, components, exemplars and known UI bugs.
- `references/rubric.md`: the review rubric with good and bad Urban Rally examples, used by `ui-reviewer`.
- Design system with the Night and Daylight tokens and components in the Blend style (the target for the theming port, not yet in code): https://claude.ai/artifact/4NkjoKb8Cxq9wMMVG1sQrN
- Screen board v2, the approved target for every screen in the Blend style: https://claude.ai/artifact/BgrgDH88cHdE9TgksSko7d. Compare ported screens against its frames.
- Old screen board with the app as it looks today (the "before"): https://claude.ai/artifact/QuLMW3b4bzLAtqf7PPaLpb
