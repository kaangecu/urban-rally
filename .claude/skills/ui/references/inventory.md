# Inventory: tokens, classes, components

Snapshot of main at 0b2cca7 (12 Oct 2026). Check the files before relying on a name; the code wins over this list.

## Tokens

`src/index.css` `@theme` (values are space-separated RGB, set at runtime by `applyTheme()`):

| Variable | Light | Cyberpunk | Use |
|---|---|---|---|
| `--color-background` | 243 244 246 | 5 5 5 | Page ground |
| `--color-surface` | 255 255 255 | 20 20 25 | Cards, sheets |
| `--color-text-main` | 17 24 39 | 255 255 255 | Body text |
| `--color-text-muted` | 107 114 128 | 161 161 170 | Secondary text |
| `--color-border` | 209 213 219 | 255 255 255 (with opacity) | Borders |
| `--color-primary` | tenant `primaryColor`, default `#1a56db` | same | Main action |
| `--color-secondary` | tenant `secondaryColor`, default `#7e3af2` | same | Accent |
| `--min-height-touch`, `--min-width-touch` | 44px | 44px | Touch targets |
| `--radius-sm`, `--radius`, `--radius-lg` | 4px, 12px, 24px | same | Corners |

`src/utils/theme.ts`: `isCyberpunkTheme(tenant)`, `getThemeConfig(tenant)`, `applyTheme(tenant)`, which sets `theme-light` or `theme-cyberpunk` on `<html>`, and `themeClasses.{background, surface, textMain, textMuted, buttonPrimary, buttonSecondary, input, badge}(isCyberpunk)`.

## Classes in `src/index.css`

- Glass: `glass-card`, `glass-card-strong`, `glass-card-subtle`, `glass-header`, `glass-modal`, `glass-frosted`, `glass-frosted-dark`. Blur drops to 12px under 768px.
- Neon: `neon-glow`, `neon-border`, `neon-border-cyan`, `neon-border-pink`.
- Measured problem: `glass-card` (40% tint) puts white text at 2.7:1 over a white map tile, and `glass-frosted` (5% white) at 1.0:1. Only use them over dark content, or with an 86%+ tint over the map.

## Components and exemplars

| Component | File | Follow it for | Don't copy |
|---|---|---|---|
| TaskCard | `src/features/tasks/TaskCard.tsx` | Branching on `isCyberpunkTheme` for every color | Emoji type icons, missing `GPS` mapping, `hover:scale-105` |
| TaskList | `src/features/tasks/TaskList.tsx` | Filter and sort logic, empty and loading states | Stats panel with no cyberpunk branch |
| TaskDetail | `src/features/tasks/TaskDetail.tsx` | Sheet structure and close button | Always-dark styling, hint buttons with no handler |
| TaskSubmission | `src/features/submissions/TaskSubmission.tsx` | Upload progress and error states | Full page reload on success |
| CameraCapture, VideoCapture | `src/features/submissions/` | Permission and error handling | Text-bar shutter |
| QuizInput | `src/features/submissions/QuizInput.tsx` | Attempt counting | Wrong-answer feedback that is never shown |
| TeamCodeLogin | `src/features/auth/TeamCodeLogin.tsx` | Field validation messages | Subtitle built from the step title ("Join the adventure in team code") |
| BottomNav | `src/components/navigation/BottomNav.tsx` | Icon-plus-label tab structure | 9px labels, cyberpunk-only styling, no `aria-current` |
| LegalModal | `src/components/legal/LegalModal.tsx` | Escape and backdrop close | White text on a white panel in light mode |
| GameMap | `src/features/map/GameMap.tsx` | Leaflet setup and popups | Fixed Berlin centre, pins told apart only by colour and a 12px tick |
| App header | `src/App.tsx` | Team name and score placement | "1 tasks completed", emoji Logout next to the score |

No component is a clean exemplar yet. Follow the structure of the nearest one and fix what the "Don't copy" column lists when you touch it.

## Screen references

Screen board v2, the approved target in the Blend style, one frame per screen and state: https://claude.ai/artifact/BgrgDH88cHdE9TgksSko7d

| Frame | Screen |
|---|---|
| 0 | App can't start |
| 1.1–1.4 | Join: code found, code not found, name and consent, terms sheet |
| 2.1–2.6 | Task list (Night, Daylight, loading, empty, offline), map with task peek |
| 3.1–3.9 | Task detail, too far, camera permission, viewfinder, photo preview, camera blocked, uploading, upload failed, task done |
| 4.1–4.4 | Video recording, quiz answer selected, wrong answer, text answer |

The old board shows the app as it looks today, useful as the "before": https://claude.ai/artifact/QuLMW3b4bzLAtqf7PPaLpb

Audits with measured findings: screen audit https://claude.ai/artifact/VaAWawxAv8z95z1K5V1X3W, design review https://claude.ai/artifact/MpWiPgWKVWPMPRvCU4hDax.
