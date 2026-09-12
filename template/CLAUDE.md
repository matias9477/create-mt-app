# CLAUDE.md

@AGENTS.md

## Project

__APP_NAME__ — an Expo (latest SDK) iOS/Android app. Local-first: SQLite via Drizzle is the source of truth for entity data. Scaffolded by create-mt-app; the conventions below are deliberate — follow them instead of inventing new patterns. Visual rules (tokens, spacing, typography, voice & tone, component inventory) live in **DESIGN.md**; the living roadmap in **TODO.md**.

### App identity

- Bundle id / Android package: `__BUNDLE_ID__` · App Group: `__APP_GROUP__`
- Apple Team ID: `__APPLE_TEAM_ID__` · Expo owner: `__EXPO_OWNER__`
- EAS project id: TODO (run `npx eas init`, record it here)
- App Store ID: TODO after first release — record it here AND in `src/lib/review-prompt.ts` (review prompts and the write-review URL need it)

## Commands

- `npm start` — Metro dev server
- `npm run ios` / `npm run android` — full native build + run. Required for the widget and RevenueCat (they do NOT work in Expo Go).
- `npm run prebuild:ios` — regenerate the ios/ dir from scratch (it's gitignored prebuild output)
- `npm test` — Jest; single test: `npx jest path/to/file.test.ts` (or `-t "test name"`)
- `npm run lint:fix` — Biome lint + format (there is no ESLint/Prettier — don't add them)
- `npm run db:generate` — generate a Drizzle migration after editing `src/db/schema.ts`
- `db:studio` / `db:push` — **do not use**: incompatible with expo-sqlite
- `npm run release` — version bump → EAS build → TestFlight submit (expo-release)

## Shipping workflow

This is the process layer that gets apps shipped — treat it with the same weight as the code rules.

- **Spec first.** A feature (or batch) starts as `docs/spec-<name>.md`, copied from `docs/spec-template.md`, written as the output of an interview and dated ("agreed YYYY-MM-DD"), stating free-vs-Pro and out-of-scope up front. Commit the spec (`chore: add <name> spec`), then implement in its stated order with its planned commit series. The spec is the domain authority; deviations get written back into it.
- **Roadmap in TODO.md.** Phases ordered **easiest → hardest** so they get knocked out one at a time, with the **monetization pivot early** so later features ship already gated correctly. Shipped work is rewritten as outcome prose; unresolved product decisions get `## Open:` sections naming the conflict; tech debt carries removal instructions written when the scaffolding is added. Update TODO.md as part of normal commits (`docs(todo): ...`).
- **Scaffold the seam, don't implement.** Default question for any proposal: "is this needed for v1.0?" If not, leave the seam (an empty module, an installed-but-unwired SDK, a single theme on theme infra) and a TODO entry — a full build up front is how apps never ship. Intentionally empty modules are directories with a documented fill plan, not stubs.
- **Releasing.** `npm run release` (expo-release, pinned `#v1.0.0` from GitHub) verifies app.json/package.json version parity, bumps both + iOS buildNumber, builds, optionally submits to TestFlight, commits `chore(release): vX.Y.Z`, and reverts the bump on failure. `release.config.json` (gitignored — personal Apple ID) holds `appleId` + `cleanSessions`. Store listing copy lives in `store.config.json` and is pushed **separately**: `eas metadata:lint` then `eas metadata:push` — `npm run release` does not touch it. **Screenshots are never covered by EAS metadata** — stage states with the `__DEV__` DeveloperSection in Settings, screenshot manually, upload in App Store Connect per the headlines in DESIGN.md.
- **App Review.** If a build gets an "Information Needed" rejection, follow `~/.claude/guides/app-store-rejection-reply.md` (cross-app playbook: answer in the Resolution Center, all items in one message, grep the codebase before asking the developer, disclose dormant SDKs like unwired RevenueCat in one line).
- **No analytics, no crash reporting — by design.** Zero third-party tracking is a product position sold in the store listing ("your data stays on your device, no accounts, no tracking") and it avoids the ATT prompt. Never add Sentry/PostHog/Firebase "to be helpful". Errors are console logs + the ErrorBoundary.

## Architecture

### Data layer

- `src/db/schema.ts` is the **single source of truth**. After changing it, run `npm run db:generate`; migrations land in `drizzle/` and are applied at boot by `useMigrations()` in `app/_layout.tsx` (loading/error gates included). Never hand-write CREATE TABLE statements and never edit generated SQL.
- Reads are drizzle **live queries** (`useLiveQuery` via `src/db/live.ts`) — they re-run automatically after writes. Use `isLiveQueryLoading()` for spinners.
- Every table gets a `uuid` column (`src/db/uuid.ts`) as the stable cross-device key; the int PK is device-local.
- All DB access goes through the owning feature's `queries.ts`. Screens and components never import `src/db/client.ts` directly.

### Feature modules (`src/features/<feature>/`)

Each feature owns, by consistent filename:

- `schema.ts` — Zod input schema + inferred types. Error messages are **lazy i18n thunks**: `{ error: () => i18n.t("validation.key") }` (Zod 4 `error` key) so they follow language changes.
- `queries.ts` — live-query read hooks (`useX`) + plain async mutations (`createX/updateX/deleteX`). The only module touching that feature's tables.
- `<feature>-form.tsx` — react-hook-form + `zodResolver`, typed `useForm<FormIn, unknown, FormOut>` with `z.input<>`/`z.output<>`.
- Extra presentational pieces in kebab-case files.

Cross-cutting invisible providers are PascalCase `*Sync.tsx` components returning `null` (`ThemeSync`, `LanguageSync`, `WidgetSync`), mounted once in `app/_layout.tsx`.

### Routing / UI

- `app/` is expo-router (typed routes on). Route files stay **thin** — logic lives in `src/features/*`, shared primitives in `src/ui/`.
- **Screens are compositions, never monoliths.** A screen is multiple reused components, not one 700-line file. Extract past ~150 lines; reuse an existing primitive or feature component before writing a new one (inventory in DESIGN.md).
- Styling is **NativeWind v4 semantic tokens only** — no hex in components, no `StyleSheet.create`, no raw pixel values in `style={{}}` (spacing comes from the Tailwind scale; the few allowed exceptions are listed in DESIGN.md). Imperative color props (navigation options, `placeholderTextColor`, icon colors) come from `useThemeColors()`.
- The palette lives in THREE synced places: `global.css`, `src/ui/theme-colors.ts`, and the THEME constant inside each widget file.
- **Dark mode and en/es ship from day one** in every app — retrofitting them is a migration; having them from the start is free. Dark mode: persisted `themePreference` → `ThemeSync` → nativewind `setColorScheme` → `ThemeRoot`. Don't read `Appearance` directly, and don't hardcode strings.
- **Safe areas**: every full-screen surface and modal respects safe-area insets (`Screen` handles it; custom overlays use `SafeAreaView`/`useSafeAreaInsets`). Nothing may render under the clock or home indicator.

### UX rules (apply to every new screen/flow)

- **Data states**: any component rendering async/db-backed data implements all three of loading, error (with retry where it makes sense), and empty (saying what to do next). A blank region is a bug.
- **Long lists**: collections inside scrolling screens go through `src/ui/expandable-list.tsx` (view more/less) or pagination — screens must not scroll forever because one section is huge.
- **Cancellability**: every multi-step workflow offers cancel/back to the previous state at ANY point — one tap, not ten back-presses. Modals are dismissible; destructive exits from dirty forms get a confirm.
- **Destructive actions**: irreversible operations get a confirm, and where feasible an undo path (e.g. an "un-mark" affordance) so a mistap is recoverable without support email.
- **Error boundary**: `src/ui/error-boundary.tsx` wraps the navigator in `app/_layout.tsx` — an unexpected render throw shows a themed retry screen instead of blanking the tree. Keep it mounted.
- **Onboarding** (`app/onboarding.tsx`): paged intro, **skippable at all times**, ends with a call-to-action that creates the user's first __FEATURE__. Gated by the persisted `onboardingDone` flag in `(tabs)/_layout.tsx`; revisitable from Settings. Keep it to 3–4 slides of basic information.
- **Accounts**: this template has none, but if account creation is ever added, a **delete account** flow (Settings row → confirm → server-side deletion, see shotbook's `delete-account` edge function for the model) must ship in the same release. App Store review requires it, and so do we.

### Settings screen (`app/(tabs)/settings.tsx`)

Standard sections every app keeps: Appearance (theme), Language, Pro (paywall entry + restore purchases), About — **Leave a review**, **Privacy policy**, replay onboarding — and the **app version** read from app.json via `Constants.expoConfig?.version` (never hardcode it).

`src/features/dev/developer-section.tsx` renders at the bottom in `__DEV__` builds only: preview-state tools (reset onboarding, empty the data) for staging App Store screenshots and testing flows. English-only copy — it never ships. Add new dev tools there, gated in that one place.

### Reviews (`src/lib/review-prompt.ts`)

- **After a happy moment** (milestone reached, Nth item created, workflow completed) call `maybeRequestReview()` — never on launch, never mid-task. Apple allows ~3 prompts/365 days; we additionally cap to one attempt per session.
- The Settings row uses `requestReviewExplicitly()` (user-initiated: ignores the session cap, falls back to the App Store write-review page).
- Set `APP_STORE_ID` in `review-prompt.ts` after the first release.

### Privacy policy

Every app has a published privacy policy before release:

1. Write `content/privacy/__SLUG__.mdx` in the portfolio repo (`~/Projects/my-portfolio`) — copy the frontmatter shape from an existing one (`shotbook.mdx`: app, developer, effectiveDate, lastUpdated, contactEmail, summary).
2. Publish the portfolio; the policy is served at `https://www.matiasturra.dev/privacy/__SLUG__`.
3. That URL is already wired into Settings (`PRIVACY_POLICY_URL`) — and goes into App Store Connect metadata.

### iOS widget (`widgets/`)

- Uses **expo-widgets + @expo/ui/swift-ui** (TSX with a `"widget"` directive), NOT @bacons/apple-targets.
- The `"widget"` directive serializes only the component function body into the widget process — every constant it uses must be declared *inside* the function.
- Data flows one way: `WidgetSync` (mounted in the root layout) maps live-query data to props and calls `Widget.updateSnapshot()`. Strings are pre-translated on the JS side — the widget receives display text, never i18n keys.
- Widget sync must never break the app — keep it wrapped in try/catch.
- Widget name, families, and configuration parameters live in app.json under the `expo-widgets` plugin; changing their *shape* needs a new native build (`npm run ios`), only values are runtime-settable.
- Deep links use `widgetURL("__SLUG__://...")`, matching the app `scheme`.

### i18n

- i18next + expo-localization; **en and es from day one**, kept in key parity (`src/i18n/{en,es}.json`) — every new string lands in both files in the same change.
- `import "@/src/i18n"` must stay the first import of `app/_layout.tsx`.
- Components use `useTranslation()`; non-React modules import the `i18n` default and call `i18n.t()`.
- Adding a language: add the JSON file, extend `SUPPORTED_LANGUAGES` in `src/i18n/index.ts`, the options in settings, `CFBundleLocalizations` in app.json, and `store.config.json`.

### Notifications (when you add them — none scaffolded)

Rules learned the hard way in `since` (`src/utils/notifications.ts` there is the reference implementation):

- Guard for Expo Go first (`Constants.appOwnership === "expo"`) and degrade silently — notifications need a dev-client build.
- Every notification carries a typed `data` payload (`type`, ids) — that's what makes scoped cancellation and orphan-cleanup sweeps possible. Sweeps return counts.
- **Reconcile on launch**: re-register pending notifications at startup (iOS drops them) and clean up orphans for entities deleted while the app was closed. No BGTaskScheduler — lazy sweeps on launch/foreground are the source of truth.
- **Copy is baked at schedule time**, so a language change must reschedule everything pending (`LanguageSync` is where that hook belongs).
- Only request the permission when a feature actually schedules something — a launch-time prompt with no feature behind it is an App Review risk.
- Test senders live beside the real schedulers, consumed only by the DeveloperSection.

### Purchases / Paywall (RevenueCat)

- `src/features/purchases/`: `purchasesService.ts` is the only module importing `react-native-purchases`; `purchasesStore.ts` holds `isReady/isPro/customerInfo`; gate features with the `useIsPro()` selector, never the whole store.
- Keys come from `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` in `.env`. The Pro entitlement id is `PRO_ENTITLEMENT_ID` in `types.ts` and must match the RevenueCat dashboard.
- `app/paywall.tsx` is a custom paywall (modal route) over `getCurrentOffering()`. User-cancelled purchases are not errors (`isUserCancelled`).

One-time RevenueCat setup for a new app:

1. Dashboard: create the app (iOS + Android), products in App Store Connect / Play Console, an entitlement named `pro`, attach products to it, and a `default` offering with the packages the paywall shows.
2. Copy the platform API keys into `.env` (and EAS env for builds).
3. Test on a dev-client build with a sandbox App Store account (`npm run ios`; RevenueCat logs are DEBUG in `__DEV__`).

Hiding a feature behind the paywall (the standard recipe):

1. Gate the feature at its entry point with `useIsPro()`; when false, `router.push("/paywall?variant=<feature>")` (add the `variant` search param + per-variant copy under `paywall.*` in both locale files).
2. Purchase success path: `purchasePackage` → `refresh()` → `router.back()`. Always offer restore. Keep the App Store terms footer.
3. Free tier stays useful: gate depth (unlimited entries, widget, exports), not the core loop.

## Conventions

- **File naming: kebab-case** (`review-prompt.ts`, `items-form.tsx`). The only PascalCase files are `*Sync.tsx` invisible providers and widget components (`ItemsWidget.tsx`).
- TypeScript strict incl. `noUncheckedIndexedAccess`; single path alias `@/*` → repo root (imports read `@/src/...`, `@/widgets/...`).
- Lint/format: Biome only (`biome.json`: 100 cols, double quotes). Run `npm run lint:fix` before committing.
- Tests cover **pure logic only** (zod schemas, `src/lib`, services) in colocated `__tests__/` folders — no component snapshot tests.
- Logs are prefixed `[feature/function]`: `console.error("[purchases/restore] failed", error)`.
- Comments explain *why* (rationale, workarounds, sync requirements), not what.
- Conventional commits with a feature scope: `feat(__FEATURE__): ...`, `fix(settings): ...`.
- `/ios` and `/android` are gitignored prebuild output — never edit them by hand; native config changes go through app.json plugins.
- Env: only `EXPO_PUBLIC_*` vars are readable in app code; `.env` is gitignored, `.env.example` documents the keys.
- New domain logic = a new feature module with the `schema/queries/form` layout above. Don't put business logic in route files.
