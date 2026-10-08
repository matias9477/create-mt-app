# DESIGN.md — __APP_NAME__ design system

The rules here are enforced conventions, not suggestions. CLAUDE.md links here; keep both honest.

## Colors

Components consume **semantic tokens only** — never hex values, never raw Tailwind palette colors (`bg-neutral-100`), never `Appearance`-conditional literals. The palette lives in three places that MUST stay in sync:

1. `global.css` — CSS variables (light `:root` + `.dark:root`)
2. `src/ui/theme-colors.ts` — runtime hex twin (`useThemeColors()` for imperative props)
3. The `THEME` constant inside each widget file (widgets can't import app code)

| Token | className | Use for |
|---|---|---|
| `surface.page` | `bg-surface-page` | Screen backgrounds |
| `surface.card` | `bg-surface-card` | Cards, rows, inputs, headers |
| `surface.sunken` | `bg-surface-sunken` | Wells, secondary buttons, insets |
| `text.primary` | `text-text-primary` | Titles, body copy |
| `text.secondary` | `text-text-secondary` | Supporting copy, labels |
| `text.tertiary` | `text-text-tertiary` | Hints, placeholders, metadata |
| `border.hairline` | `border-border-hairline` | Dividers, card borders |
| `accent.fg` | `bg-accent-fg` / `text-accent-fg` | Primary actions, selection, links |
| `accent.on` | `text-accent-on` | Text/icons on top of accent |
| `danger.fg` | `text-danger-fg` | Destructive actions, errors |

Adding a color = adding a **token** in all three places, then using it by name. If a design needs a color that doesn't map to a token, that's a conversation about the palette, not an inline hex.

## Spacing & sizing — no pixels

Use the Tailwind spacing scale through classNames (`p-4`, `gap-3`, `mt-6`); never numeric pixel values in `style={{}}`. Allowed exceptions, kept rare and commented: values that must be computed at runtime (safe-area insets, screen-width paging) and native props that only accept numbers (icon `size`).

- Screen padding: `p-4` (16)
- Card padding: `p-4` (`Card padded={false}` to drop it — never a `p-0` className override); rows: fixed `h-14` (56pt) with or without a subtitle, `px-4`, one line each for title and subtitle
- Lists of rows (settings, item lists) are **inset-grouped**: `ListSection` = small uppercase caption + one borderless rounded card, rows edge to edge, inset hairlines only *between* rows
- Vertical rhythm between sections: `mt-6`
- Radii: `rounded-xl` inputs/buttons, `rounded-2xl` cards, `rounded-full` dots/avatars

## Typography

System font. Sizes come from the type scale, not ad-hoc values. `text-xs/sm/base` are remapped in `tailwind.config.js` to the iOS text styles (footnote 13 / subhead 15 / body 17) so in-app text matches the native headers and tab bar; don't put Tailwind's 12/14/16 back.

| className | Size | Role |
|---|---|---|
| `text-3xl font-bold` | 30 | Hero titles (screen titles are the native header) |
| `text-base font-semibold` | 17 | Buttons, emphasized rows |
| `text-base` | 17 | Body, row titles, inputs |
| `text-sm` | 15 | Row subtitles, secondary info, errors |
| `text-xs font-medium uppercase tracking-wide` | 13 | Section captions (`ListSection`) |
| `text-xs` | 13 | Footers, legal, small labels |

## Components

Screens are **compositions, never 700-line files**: a route file wires together components from `src/ui/` (generic primitives) and `src/features/<feature>/` (feature pieces). If a screen grows past ~150 lines, extract components. Reuse before creating; extend a primitive before forking it.

Current primitives (`src/ui/`): `Screen`, `Card`, `Button` (primary/secondary/danger; press-scale + haptic built in), `Field` (floating label), `ListSection` + `ListRow`, `ExpandableList`, `TabStack`, `ThemeRoot`, plus `usePressScale()` and the motion tokens in `motion.ts`.

- **Forms use floating labels**: every text input is a `Field`. The label sits inside the box like a placeholder and floats up to a small title on focus or once filled; `placeholder` is only a hint shown while focused and empty. Never stack a separate title above an input — it makes forms past ~3 fields long and heavy.

- **Data states**: every component backed by async data renders all of loading / error / empty — never a blank region. Empty states say what to do next.
- **Long lists**: a collection inside a scrolling screen goes through `ExpandableList` (view more/less) or pagination — screens must not become infinite.
- **Safe areas**: full-screen surfaces and modals use safe-area insets (`Screen` handles it; custom overlays use `SafeAreaView`/`useSafeAreaInsets`) so nothing sits under the clock or the home indicator.

## Motion & feel

Motion and haptics are part of the design system, like color: tokens in `src/ui/motion.ts`, intents in `src/features/haptics/haptics.ts`. Rules of thumb:

| Situation | Motion | Haptic |
|---|---|---|
| Press on a button | `usePressScale()` spring (0.96) | `press` on press-in |
| Choice / page change | `LinearTransition` on the indicator | `tick` |
| Toggle on / off | `withTiming` color/scale, `DURATION.layout` | `toggleOn` / `toggleOff` |
| Item added / removed | `entering` FadeIn/FadeInDown, `exiting` FadeOut, list `itemLayoutAnimation` | — (or `success` on save) |
| Save / create landed | — | `success` |
| Destructive confirmed | `exiting` FadeOutLeft | `destructive` on confirm |
| Big moment (goal reached) | one-shot flash / pop, fired on the transition | `celebrate`, delayed to the visual peak |

- **Every moment is a pair**: when something important happens, the animation and the haptic land on the same beat (`useMomentHaptic(..., delay)` matches the animation's peak).
- **Hierarchy**: small touches get small feedback; save rich presets and flashy effects for the 1–3 moments that define this app. If everything celebrates, nothing does.
- **Quiet idle**: no ambient loops on resting screens unless they signal "live" state — and those honor Reduce Motion.
- **Durations**: exits `DURATION.exit` (160ms) < layout `DURATION.layout` (220ms) < entrances `DURATION.enter` (260ms); fills/counters `DURATION.fill` (520ms). Nothing interactive waits on an animation to finish.
- **Accessibility**: Reduce Motion → static fallbacks; the haptics toggle in Settings → Feel silences every haptic.

## Dark mode

Shipped from day one. It works automatically **if** you only use semantic tokens. Never branch on `isDark` inside components for colors — if light and dark need different values, that difference belongs in the palette definitions.

## Voice & tone

Fill this in before writing any user-facing copy — it governs notifications, empty states, errors, settings descriptions, and store copy alike.

- **Should feel like:** TODO (e.g. "a well-made pocket tool", "playoff scoreboard energy")
- **Should NOT feel like:** TODO (e.g. "generic habit tracker", "corporate SaaS", "cute wellness app")
- **Always use:** TODO (words/framings that fit the metaphor)
- **Never use:** TODO (e.g. "You failed", "streak broken", guilt framings)
- **Pitch line:** "TODO — one memorable sentence." Quote it verbatim in the App Store description and keep it stable.

## App Store visual direction

Write the screenshot story before the screenshots exist — four headlines, one per screenshot, staged with the `__DEV__` DeveloperSection in Settings:

1. TODO — the core promise (hero screen)
2. TODO — the second-most-valuable feature
3. TODO — the widget on a home screen
4. TODO — dark mode / customization
