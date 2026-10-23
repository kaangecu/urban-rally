# UI review rubric

For `ui-reviewer`. Review screenshots at 390×844 in both themes against the reference you were given. Every comment must point at something visible in a screenshot or at a `file:line`.

## Criteria

1. **Matches the reference and the system.** Same layout intent, existing tokens and classes, no new colors, fonts or radii. Unintended differences from the reference come first.
2. **Hierarchy.** One primary action per screen, within thumb reach. The content the player came for is above the fold.
3. **States.** Empty, loading, error and success exist and use real copy.
4. **Contrast and color.** Text is at least 4.5:1 (3:1 at 24px+). Borders, focus rings and icons are at least 3:1. Color is never the only cue.
5. **Touch and size.** Targets are at least 44px, text at least 14px, there is no horizontal overflow, and nothing sticky covers the focused element.
6. **Theme parity.** Light and cyberpunk both work. Text and surface colors come from the same theme branch.
7. **Copy.** It's specific, uses "pts", handles plurals, and errors say what to do.
8. **Generic AI look.** Multi-hue gradient buttons, decorative orbs or emoji, stat panels nobody asked for, glass with nothing moving underneath it.

## Examples from this app

Use these to calibrate how specific a comment should be.

**Bad: say so like this**
- "Terms modal (light): headings are `text-white` on a white panel, 1.0:1. `TermsOfService.tsx` and `PrivacyPolicy.tsx` apply `prose-invert` without a theme branch. Use `themeClasses.textMain`." (This is the app before #40, which fixes it.)
- "Bottom nav: labels are 9px uppercase. Raise to 13px minimum; they are the most-used controls."
- "Map: open and done pins are blue versus green (1.45:1 to each other) plus a 12px tick on done (`GameMap.tsx:130-152`). Give each state its own shape, not only a colour."
- "Task list: the stats panel pushes the first task title to about 690px, below the fold on a 390×844 phone. Move progress into one line and show tasks first."
- "Join step 1: the subtitle reads 'Join the adventure in team code'. The copy is built from the step title."

**Good: say what to keep**
- "Upload sheet: the percentage and progress bar show status clearly. Keep them."
- "Camera: close and flip buttons are 44px with `aria-label`s. Keep them."
- "Light task badges: Easy and Medium read at 6.5:1 and 6.4:1 and carry words. Keep them."

**Not useful: don't write comments like this**
- "Looks modern and clean." (No evidence, no action.)
- "Consider improving the visual hierarchy." (Name the element and the change.)
- "Make it pop more." (Taste with no criterion.)

## Output

At most 10 items, most important first. For each item give:

- **Severity:** bug, high, medium or low.
- **Where:** screenshot name and region, or `file:line`.
- **What:** the problem, with the number where one applies (ratio, px, tap count).
- **Fix:** one concrete change, using the existing tokens and classes.

Then list 1–3 things to keep. End with any criterion you could not check, such as screen-reader behaviour or real sunlight. Give no overall score and no pass or fail verdict.
