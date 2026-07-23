# Open Lingo — Mobile Scaling + React Native Readiness Research

**Date:** 2026-07-20
**Owner:** mobile-scaling / RN-readiness initiative (synthesis lead)

**Goal.** Establish, from a read-only sweep of `/home/trevor/projects/open-lingo/lingo` (`master`, 544 `.tsx` files), exactly what breaks the web app on a ~360px phone today and what stands between the current codebase and a shared web+native (React Native) UI. This doc consolidates six parallel research passes — responsive-code audit, viewport/breakpoint architecture, styling+RN compatibility, per-surface UX, test infrastructure, and component inventory — into one executable plan: a prioritized worklist, a mobile render test-pipeline spec, and a React Native compatibility path. File:line evidence is preserved so each item can be picked up cold.

---

## Executive Summary

The app is more mobile-hardened than a greenfield audit would predict — the lesson player, flashcards, transit map, and app shell carry a long trail of QA fixes (fixed `100dvh` shells, reserved CTA slots, mobile-specific transit rendering, `min-h-[44px]` tap floors). But three systemic facts dominate everything else:

1. **Responsiveness lives ~entirely in Tailwind `className` strings, not JS.** There are 6,538 `className` occurrences across 401 files and 663 responsive-prefix utilities (`sm:` 416, `lg:` 169, `md:` 58, `xl:` 13, `2xl:` 7). The JS viewport layer that *does* exist (`useViewport`, `useMediaQuery`, `Show`) is imported by **3 files** and by **zero feature files**. So responsive behavior is invisible to JS/tests and **none of it survives a React Native port** (no `className`, no CSS media queries in RN). This is the single most systemic issue.

2. **A silent, live styling bug affects 533 usages across 164 files.** Alpha modifiers on theme-token colors (`bg-accent/10`, `bg-warning/10`, `border-error/40`, …) compile to **no CSS rule at all** because tokens are stored as hex strings that Tailwind can't split into channels for `<alpha-value>`. Every subtle tint background on alerts, badges, and callouts is rendering fully transparent today. The fix — store tokens as space-separated RGB channel triples — is *also* the exact change that makes token values consumable by a native styling lib. Ship it first; it's the highest-leverage single change and it pays off on web immediately.

3. **The token architecture is the portability asset; the rest of the styling is the liability.** `ThemeTokens` (`src/shared/theme/types.ts:5`) is already a platform-agnostic JS object whose own header anticipates `useTheme()` on RN; theming is via CSS variables, not `dark:` (only 23 `dark:` usages); a single web adapter (`web-adapter.ts:4`) is the only binding to the DOM. Components speak a small semantic-token vocabulary (`bg-surface`, `border-border`, `rounded-card`, `shadow-card`) — ~20 names an RN theme must remap, not thousands of literal classes. The recommended path is **NativeWind v4** (keeps the className asset on both platforms), preceded by the token migration, with audio/speech/canvas/stroke-render walled off behind TS interfaces as per-platform native modules.

The leverage set is tiny: five primitives carry almost all traffic — `Icon` (199 render sites), `Card` (65), `Button` (48), `EmptyState` (18), `Badge` (12). Getting those right, mobile + RN, covers most of the app.

The concrete mobile-UX gaps are concentrated: Settings mobile nav (nav-above-content), conjugation-hub sticky bar occlusion, `ProfilePreviewPopover` off-screen overflow, and the lesson/placement CTA-below-fold risk on short viewports. Admin tables side-scroll (acceptable, desktop-first).

A headless mobile render test pipeline is achievable **today** with the existing Playwright setup and a valid token-bearing `.auth/user.json`; the DOM-geometry assertions (overflow, off-screen elements, tap targets, CTA-in-fold, render errors) are environment-stable and become the automated gate. The only human-in-the-loop dependency is refreshing the Auth0 storageState when it expires.

---

## 1. Responsive / Scaling Code Audit

Target "breaks on a phone" viewport is **~360px CSS px** (iPhone SE / small Android). Root cause first, then the severity-ranked offenders.

**Root cause — CSS-breakpoint-only responsiveness.** `src/shared/hooks/useViewport.ts` and `useMediaQuery.ts` are dead code in the feature tree (`rg -ln 'useViewport|useMediaQuery' src/features` → nothing). Every `sm:/md:/lg:` decision is baked into a `className`. Untestable, invisible to logic, and the primary RN blocker.

Severity-ranked offenders (evidence `file:line`):

| file:line | pattern | why it breaks @360px | fix |
|---|---|---|---|
| `TransitLearnPage.tsx:1096-1108,1363-1370` (+ px coords `:796-1007`) | SVG map scale floored `Math.max(0.85, …)`, raw `<svg>`/`<rect>` px art | intrinsic map width is thousands of px; 0.85 floor forces horizontal drag-pan, no overview fits; total RN rewrite | phone mode = vertical `DistrictView`/`LineDiagram` default under `md`, map opt-in; isolate the map as a clearly non-portable module (already partly done — map is `hidden md:block`) |
| `AdminUsersListPage.tsx:176`, `AdminModerationPage.tsx:679`, `AdminAuditPage.tsx:89`, `practice/conjugation/CheatSheet.tsx` | `<table>` wrapped in `overflow-hidden` (not `-x-auto`) | right columns clip/compress instead of scroll | route ALL tables through one `<ResponsiveTable>` = `overflow-x-auto` + `min-w-[…]` (the correct pattern already exists at `DataTable.tsx:59`, `AdminOperationsPage.tsx:643`, `AdminInfraHealthPage.tsx:168`) |
| `CardPreview.tsx:213` (`w-[280px] flex-shrink-0`), `ActivityFeedStrip.tsx:111,161`, `FlashcardsPage.tsx:84` | fixed-width non-shrinking flex children | 280px = ~78% of 360px → forced horizontal scroll; `CardPreview` is a side pane that won't stack | `w-full max-w-[280px]` + allow shrink; side-by-side panes `flex-col` under `md` |
| ~20 sites incl. `SettingsSectionPanel.tsx:278`, `CardManagerPage.tsx:687`, `KanjiReadingStepView.tsx:146`, `ProfilePreviewPopover.tsx:78`, `JourneySidebar.tsx:56`, `learn/components/ProfileCard.tsx:80` | `grid-cols-2`/`grid-cols-3` with **no** responsive prefix | columns never collapse; cells crushed to ~100-150px, labels truncate | default `grid-cols-1` + `sm:grid-cols-N`; the codebase already does this at `FriendsSection.tsx:162` — inconsistency, not intent |
| 359 `text-[Npx]` tokens, **272 ≤11px** (e.g. `SidebarNav.tsx:66`, `Badge.tsx:33`, `DistrictView.tsx:178` `text-[9.5px]`, `ConjugationPracticePage.tsx:415,473` `text-[9px]`) | hardcoded px font sizes, many sub-legible | ignores OS font-scale (a11y); 9-10px unreadable, worse with `truncate` | move to `rem`/Tailwind scale tokens; ≥12px effective body floor; ban `text-[9px]` |
| `WordImageMcqStepView.tsx:139` (`min(calc(100vw - 3rem), calc((100dvh - 20rem)*…))`) | `100vw` **and** `100dvh` combined in one calc | `100vw` includes scrollbar gutter, `dvh` jumps with browser chrome → grid mis-sizes | base width on container (`100%`/`cqw`), cap height separately; no `dvh` math in step content (house rule) |
| lesson steps: `MatchPairsStepView.tsx:333-334,410-411`, `BuildSentenceStepView.tsx:122-125,243`, `MultipleChoiceStepView.tsx:156-157`, `SymbolToSoundStepView.tsx:110` (`text-[clamp(140px,22dvh,200px)]`), `ConjugationClozeStepView.tsx:212`, `ParticleClozeStepView.tsx:235` | `clamp(…, Ndvh, …)` tile/type sizing | banned per CLAUDE.md — mobile chrome show/hide makes `dvh` jump → tile resize jitter + overflow on short windows | container-relative sizing (`cqh`/flex `min-h-0`) or fixed `rem` steps; keep `100dvh` shell height, not per-tile `dvh` |
| `FlashcardTester.tsx:836` (`grid grid-cols-4`) | fixed 4-across grade buttons | Again/Hard/Good/Easy ~78px each @360px, keycap badge `lg:`-only | `grid-cols-2 sm:grid-cols-4` or 2×2 on phones |
| `ConjugationPracticePage.tsx:402,439` (`h-[112px]`), `DeckEditor.tsx:324` (`h-[calc(100vh-12rem)]`), `EventsPage.tsx:43`, `StoryEditor.tsx:333` | fixed heights + `100vh` (not `dvh`) | iOS Safari `100vh` includes address bar → bottom controls under chrome | use `100dvh`/`100svh` (shell already does at `Layout.tsx:424`); prefer `min-h` |
| `DeckSettingsBar.tsx:41,53,65` (`min-w-[200px]`×2), `FilterBar.tsx:145`, `data/FilterBar.tsx:47` (`min-w-[160-180px] flex-1`) | `min-w-[…px]` fields in flex rows | two `min-w-[200px]` siblings need 400px+ before wrapping → row overflows @360px | `flex-wrap` parent, mins to `min-w-0`/`basis-full sm:basis-auto` |
| `DrillQuestionCard.tsx:225` (`grid-cols-[1fr_auto_1fr]`, `:134` `min-w-[52px]`), conjugation keypad tiles | fixed-min tile grids | many-tile forms exceed 360px → answer row overflows | `flex-wrap` / responsive tile sizing keyed to tile count |
| `SocialPage.tsx:108`, `FriendsPage.tsx:256` tab rows (`min-h-[40px] flex-1 whitespace-nowrap`) | nowrap tabs in non-scrolling flex | 4+ tabs overflow; some rows scroll (`SocialPage.tsx:93`), some don't | standardize on `Tabs.tsx:36` (`overflow-x-auto whitespace-nowrap`) |

**Correct patterns to reuse (not bugs):** `Layout.tsx:424` (`svh`, `max-w-[min(2100px,96vw)]`), `SidebarNav.tsx:23`+`Layout.tsx:135` (rail gated `lg:` + `lg:pl-60`), `DataTable.tsx:59` / `AdminOperationsPage.tsx:643` (`overflow-x-auto`), `Button.tsx:45` + `MobileNavLink` (`min-h-[44px]`), `FriendsSection.tsx:162` (`grid-cols-1 md:grid-cols-2`).

**Recurring root causes:** (1) CSS-breakpoint-only responsiveness; (2) hardcoded px instead of relative/container units; (3) `dvh`/`vw` math in content that must not jump; (4) `overflow-hidden` vs `-x-auto` on tables; (5) non-collapsing multi-col grids; (6) fixed-width non-shrinking flex children; (7) `100vh` vs `dvh/svh` inconsistency; (8) god files (`TransitLearnPage` 2,252 LOC, `LessonPage` 1,051, `AdminOperationsPage` 1,123, `SpeakingStepView` 1,004, `FlashcardTester` 959) concentrate the risk on exactly the surfaces most in need of mobile work.

---

## 2. Viewport / Breakpoint Architecture (as-is)

**Hooks** (`src/shared/hooks/`): `useMediaQuery` (`useMediaQuery.ts:9`) is the SSR-safe `matchMedia` primitive everything builds on. `useViewport` (`useViewport.ts:38`) returns `{isMobile,isTablet,isDesktop}` off a **duplicated** local `BREAKPOINTS` mirror (`:11-17`) of Tailwind defaults — `isMobile = <768` (no `sm` tier). `useBreakpoint` (`:49`) backs `Show`/`ResponsiveSwitch`. `useFocusTrap`, `useEscapeKey`, `useReducedMotion` round out the set.

**Consumption is near-zero:** `useViewport` imported by 3 files (`Tooltip.tsx:52`, `FilterBar.tsx:82`, `Show.tsx`); `useMediaQuery` has zero consumers outside `useViewport`. Almost all responsiveness is Tailwind classes.

**Documented gaps / bugs:**
1. **Two "mobile" boundaries.** Hooks say `<768` (`md`); CSS is `sm:`-centric (415 `sm:` vs 58 `md:`) → *de facto* mobile ends at `640`. They disagree.
2. **`useViewport` SSR default documented backwards** (`useViewport.ts:31-32` claims desktop-first; `useMediaQuery` seeds `false` → actually renders **mobile** tree first). Bug + RN trap (no `matchMedia` in RN).
3. **Two parallel modal systems, divergent mobile behavior + a11y:** `ui/Modal.tsx` (77 importers) becomes a **bottom sheet** on mobile via Tailwind `items-end`/`sm:items-center`, has focus-trap + scroll-lock + escape. `components/ModalBase.tsx` (13 importers incl. Settings, ConfirmModal, LanguageSwitchModal, QuestsPanel) is a **top-offset dialog**, **no focus trap, no scroll lock**, never a sheet, re-implements escape inline (`:54-61`).
4. **Modal→sheet policy inconsistent:** automatic-CSS (`ui/Modal`), manual `side` prop (`Sheet.tsx:51`, ~11 consumers), conditional `useViewport` (`FilterBar.tsx:82`), absent (`ModalBase`/`Popover`/`DropdownMenu`).
5. **Reduced motion has two sources of truth** — `useReducedMotion` (reads Settings flag) vs 7 direct `matchMedia("(prefers-reduced-motion)")` calls (`Confetti.tsx:24`, `LessonIntro.tsx:22`, `LessonComplete.tsx:18`, `GrammarRuleStepView.tsx:78`, `SymbolIntroStepView`, `DrawingCanvas.tsx:139`, `glyphs/useStrokeAnimation.ts:21`).
6. **No safe-area handling at all** — zero `env(safe-area-inset-*)`, no `viewport-fit=cover` (`index.html:33`). At risk: `sticky top-0` header (`Layout.tsx:152`) under the notch, `FloatingLanguagePill` `fixed bottom-4 left-3` vs home indicator, mobile-menu backdrop pinned `top-11` (`Layout.tsx:324`).
7. **Duplicated breakpoint constants** (stock `tailwind.config.js` vs hand-copied `BREAKPOINTS`) with no shared token.
8. **Height units mixed** — `svh`/`dvh`/`vh`/`min-h-screen` across 22 files, no convention. Shell uses `svh` correctly (`Layout.tsx:424`).

**App shell is body-scroll, not fixed.** `Layout.tsx:134` = `flex min-h-screen flex-col`, `sticky top-0` header, `BodyScrollbars` on `document.body`. The fixed-shell / no-body-scroll conversion is **planned, not built**. No bottom tab bar — nav is hamburger (`md:hidden`, `:297`) + top bar; sidebar `w-60` rail is `lg:`-only opt-in. Native polish present but partial (`index.css:61-69`: `overscroll-behavior:none`, tap-highlight off, `touch-action:manipulation`, fluid root-font `clamp()`).

**Recommended coherent strategy:** (A) single breakpoint token source feeding both `tailwind.config.js` and `BREAKPOINTS`, one documented semantic mobile boundary; (B) Tailwind for pure show/hide, hooks only for structurally-different trees — and push conditional-layout through `useViewport` (backed by `useWindowDimensions` in RN); (C) collapse to one modal primitive with `presentation="auto|sheet|center"`, guarantee focus-trap + scroll-lock + escape on every overlay, auto-fall-back Popover/DropdownMenu to a bottom Sheet below mobile (maps cleanly to RN); (D) safe-area as first-class token (`viewport-fit=cover` + `safe-*` utilities backed by `env()`) — the portable seam to RN `useSafeAreaInsets`; (E) one reduced-motion hook (OR the Settings flag with the OS query), one height unit behind a utility.

---

## 3. Styling Architecture + React Native Compatibility (findings)

**Stack:** Tailwind 3.4, `darkMode:"class"`, `@tailwindcss/typography` only plugin. No ESLint/Prettier, **no `clsx`/`tailwind-merge`/`cva`** — a hand-rolled `cn()` (`ui/cn.ts:2`) with **no conflict resolution** (Button leans on `!important` hacks like `!justify-start`, `Button.tsx:44`). 6,538 classNames / 401 files. All raw web HTML elements — `div` 1987, `span` 1032, `p` 851; none exist in RN.

**The good part — token system:** `ThemeTokens` (`theme/types.ts:5`) is a plain platform-agnostic JS object; 3 presets (`presets.ts`); the only web binding is `applyThemeToDOM` (`web-adapter.ts:4`) called from `ThemeContext.tsx:231`. Tailwind consumes tokens as `var()` aliases. **Theming is CSS-vars, not `dark:` (23 usages total)** — the biggest positive portability signal.

**CONFIRMED LIVE BUG (§ top-priority):** alpha modifiers on token colors compile to **nothing**. `bg-accent/10`, `text-accent/50`, `border-accent/40` emit **no rule** because tokens are hex strings (`--color-accent:#9c2c2c`) aliased as bare `var(--color-accent)` — Tailwind can't apply `<alpha-value>`. **533 usages / 164 files** render transparent today. Top offenders: `bg-warning/10` (42), `bg-error/10` (40), `bg-success/10` (29), `bg-success/15` (28), `bg-warning/15` (27), `bg-accent/10` (23), `border-accent/40` (20), `border-error/40` (17), `border-info/40` (13). **Fix = store channel triples** (`--color-accent: 156 44 44`) + alias `rgb(var(--color-accent) / <alpha-value>)`. Repairs all 533 on web AND converts tokens to the numeric form native tooling needs. `web-adapter.ts` shape unchanged.

**RN blocker inventory (quantified):**

| Blocker | Files | Notes |
|---|---|---|
| `className` / Tailwind | 401 | 6,538 usages; the whole styling model |
| responsive prefixes | — | 663 media-query utilities; RN has none |
| raw DOM elements | ~all | `div/span/p/ul/li/table/img/a` → `View/Text/FlatList/Image/Pressable`; RN forbids raw text outside `<Text>` |
| `react-router-dom` | 180 import / 136 use nav APIs | needs React Navigation or router abstraction; deeply woven |
| `window.` / `document.` | 127 / 52 | `document` mostly funnels through theme adapter + `Portal` (3 `createPortal`); `window` spread wide |
| `localStorage` | **123** | local-first (SRS, theme, settings) → `AsyncStorage`/MMKV; load-bearing |
| `matchMedia` | 15 | viewport/reduced-motion hooks |
| OverlayScrollbars | 4 (`main.tsx`, `BodyScrollbars`, `ScrollArea`, `ContentRail`) | web-DOM scroll lib → `ScrollView`/`FlatList` |
| lucide-react icons | 13 (centralized via `iconRegistry.ts`) | **low blocker** — `lucide-react-native` exists, swap registry imports |
| CSS-keyframe animations | Tailwind keyframes; `animate-pulse` 39, `animate-fade-up` 14, etc. | **no framer-motion (0 files)**; RN needs Reanimated |
| pseudo-states | `hover:` 919, `focus:` 156, `active:` 68 | RN has none; hover meaningless on touch, `active`→Pressable |

**Effectively un-portable — reimplement per platform behind a shared interface (already partly seam'd):** Web Audio/`HTMLAudioElement` (`audio/audioManager.ts:7-8`, `sfx.ts`, `alphabetAudio.ts` → `expo-av`/track-player), Speech (`speech/` — `speechSynthesis`, `SpeechRecognition`, `whisper-worker.ts`, `getUserMedia`), Canvas (`Confetti`, `DrawingCanvas`, `SymbolIntroStepView`, `drawingComparison` → `react-native-skia`), kanji stroke SVG (`glyphs/` → Skia/`react-native-svg`). Define `AudioPlayer`/`SpeechRecognizer`/`StrokeRenderer`/`Storage` TS interfaces now; keep web impls, add native later.

**Styling-lib decision → NativeWind v4.** It is the only option that keeps the 6,538 className strings, the `cn()`+variant-map idiom, and the 61-primitive layer alive on both platforms; the CSS-var token system maps directly onto it. Tamagui/Unistyles/StyleX all discard the className asset. NativeWind does *not* solve: `div/span/p`→`View/Text`, router (136 files), `localStorage` (123 files), or 919 hover styles — those are separate abstraction work. Path is "abstract primitives + platform APIs behind interfaces, then NativeWind unifies styling on top," not a switch-flip.

**Key files:** `theme/types.ts` (portable token type), `theme/web-adapter.ts` (the one binding to replace), `theme/presets.ts` + `styles/tokens.css` (hex → migrate), `tailwind.config.js` (var aliases + keyframes), `shared/components/ui/` (61 primitives), `ui/cn.ts` (no-conflict joiner), `iconRegistry.ts` (already abstracted), `audio/audioManager.ts` + `speech/` (native modules).

---

## 4. Per-Surface Mobile UX

Severity: **blocker** (unusable/hidden action) / **major** (frustrating but usable) / **minor** (polish). Overall unusually hardened; gaps concentrated.

**Cross-cutting:** CTA lives inside the scroll container pinned by `mt-auto` (not sticky) — `LessonPage.tsx:877-903`, `MultipleChoiceStepView.tsx:248`, `BuildSentenceStepView.tsx:404`; once content overflows, the CTA scrolls off-screen (root of the below-fold risks). Hardcoded chrome-height `calc()`s assume a fixed top-bar/footer budget (`ConjugationPracticePage.tsx:168` `min-h-[calc(100dvh-8rem)]`, `LessonPage.tsx:845`, `transitLearnPage.css:95-99`) — brittle across mobile chrome variants. Sub-44px icon targets (`FlashcardTester.tsx:606-622` ~36px; `DataTable.tsx:76,118` `h-4 w-4`).

- **Lesson player** — *mostly ready.* **[major]** MCQ grid floors `clamp(320px,52dvh,640px)` (`MultipleChoiceStepView.tsx:155`), build floors `clamp(260px,44dvh,520px)` (`BuildSentenceStepView.tsx:243`); on short/landscape viewports prompt + grid + wrong-answer banner + CTA overflow the fixed shell → `mt-auto` Continue drops below fold. `MatchPairsStepView.tsx:257-260` already reserves a CTA slot to fight exactly this — generalize it. Positives: fixed `100dvh` shell, single scroller, ghost tiles prevent reflow, `LessonMetaChips` drops minutes chip `<sm`.
- **Flashcards** — *ready.* Minor: 4-col grade row tight @320-360px; ~36px header icons. Card body fixed `min-h-[360px]`, action row fixed `h-16` (no jump), detail panel stacked on mobile / overlay `lg:` only.
- **Learn / transit map** — *ready (best-in-class).* Heavy SVG `hidden md:block`; mobile gets dedicated vertical `LineDiagram` + "view network map" toggle (`TransitLearnPage.tsx:2166-2190`). Minor: expanded map drops into horizontal drag-pan panel with hardcoded `calc(100dvh-10.5rem)`, heavy ambient animation (mitigated by `prefers-reduced-motion` at `:480`).
- **Practice hub + conjugation** — *usable; priority fix.* **[major]** Conjugation-hub **sticky action bar overlaps content** — bar is `sticky bottom-3 mt-auto` opaque (`ConjugationPracticePage.tsx:247-248`) but the tile grid above has no bottom padding reserving the bar height → last tiles slide under the pill. Positives: `GridDrillCard` single-column w/ reserved feedback slot, `GridBoard` 2-col + `truncate`.
- **Home** — *ready today; re-check under fixed-shell.* Stacks cleanly (`HomeVariant1.tsx:22` `lg:grid-cols-[1fr_340px]`). Minor: shell wraps hub pages in `flex flex-col justify-center` (`Layout.tsx:418`); if no-body-scroll lands, `justify-center` clips over-tall Home on mobile. Flag for that migration.
- **Settings** — *needs work (weakest surface).* **[major]** No mobile nav pattern — `SettingsContent` is `flex-col sm:flex-row` (`SettingsContent.tsx:14`) with `SettingsNav` as a full vertical list above content (`SettingsNav.tsx:56-57`); user scrolls past the entire nav to reach a section, then back up. No horizontal scroller / collapse-on-select. Minor: verify the `SettingsOpenRoute` wrapper is height-bounded or `overflow-y-auto` won't get a scroll height.
- **Community + Social** — *mostly ready.* **[major]** `ProfilePreviewPopover` is `absolute left-0 top-full w-72` (288px) with no edge-collision handling (`ProfilePreviewPopover.tsx:57`) → overflows off the right edge when triggered from a right-half avatar. Positives: community tabs scroll horizontally by default (`Tabs.tsx:34-36`), grids stack, activity feed is a proper horizontal scroller.
- **Admin** — *usable, low priority.* Every table is `DataTable` (`overflow-x-auto` + `min-w-full`) → side-scroll wide tables. Desktop-first, acceptable. `AdminLayout` stacks + real mobile collapsible sidebar.
- **Placement** — *ready.* Renders through the same `StepRenderer`/lesson step views → inherits lesson behavior incl. the CTA-below-fold risk; runs as `focusedFlow` (chrome dropped) which helps vertical budget.

**Priority fix list:** (1) conjugation-hub sticky bar bottom-padding; (2) Settings mobile nav → horizontal `TabList` or collapse-on-select; (3) ProfilePreviewPopover edge collision/clamp; (4) lesson/placement CTA-below-fold — sticky-to-shell-bottom or reduce `52dvh`/`44dvh` floors on short heights; (5) admin stacked-card under `md` (low).

---

## 5. Prioritized Worklist

Ordered by leverage (H>M>L) then severity. Effort S/M/L. "RN" = advances React Native readiness.

| id | surface | title | effort | leverage | RN | notes |
|---|---|---|---|---|---|---|
| W1 | theme/tokens | Migrate color tokens hex → RGB channel triples; alias `rgb(var(--x)/<alpha-value>)` | M | H | ✅ | Fixes 533 broken alpha-on-token styles across 164 files (live bug) AND makes tokens RN-numeric. `tokens.css`+`presets.ts` values, `tailwind.config.js` aliases; `web-adapter.ts` shape unchanged. Ship first, independently justified. |
| W2 | shared/hooks | Single breakpoint token source + fix `useViewport` SSR default + adopt in feature code | M | H | ✅ | One module feeds both `tailwind.config.js theme.screens` and `BREAKPOINTS`; pick one documented mobile boundary; fix `useViewport.ts:31` backwards default. Backed by `useWindowDimensions` on RN — the portable conditional-layout seam. |
| W3 | shared/ui | Consolidate two modal systems → one `<Modal presentation="auto\|sheet\|center">`; guarantee focus-trap + scroll-lock + escape on every overlay | M | H | ✅ | Merge `ModalBase` (13 sites, no trap/lock) into `ui/Modal` (77 sites). `auto`=bottom-sheet `<md`, centered `≥md`. Freeze prop contract so RN `Modal` is a swap. |
| W4 | shared/ui | Build one `<ResponsiveTable>` (overflow-x-auto + min-w) and route all tables through it | S | H | ⚠️ | Fixes clipping `overflow-hidden` tables (`AdminUsersList/Moderation/Audit`, `CheatSheet`); reuse `DataTable.tsx:59` pattern. |
| W5 | shared/ui | Introduce responsive primitive layer (`<Stack>`,`<Row wrap>`,`<Grid cols>`,`<Text scale>`) consuming `useViewport` | L | H | ✅ | Moves layout decisions into JS so they're testable + RN-swappable. Migrate hot surfaces off raw `md:`/`lg:` classes incrementally. |
| W6 | icon layer | Verify `lucide-react-native` parity for `iconRegistry` names; keep the registry the single icon seam | S | H | ✅ | 199 render sites behind one indirection (`Icon.tsx`) — near-single-seam RN port. Highest-leverage component. |
| W7 | shared/ui | Convert/harden top-5 primitives (Icon, Card, Button, EmptyState, Badge) — responsive audit + extract styling seam | M | H | ✅ | Five carry most traffic (199/65/48/18/12 sites). Audit Button `primary-3d` offset-shadow (no RN analog → elevation fallback); fix `cn()` ordering hack (`Button.tsx:44`). |
| W8 | grids (~20 sites) | Default `grid-cols-1` + `sm:grid-cols-N` on all non-collapsing multi-col grids | S | H | — | `SettingsSectionPanel`, `CardManagerPage`, step views, `ProfilePreviewPopover`, `JourneySidebar`, `ProfileCard`, etc. Systemic, mechanical. |
| W9 | test infra | Stand up headless mobile render pipeline (Playwright mobile project + DOM-geometry assertions) | M | H | — | See §6. Overflow + off-screen + tap-target + CTA-in-fold + render-error gate; catches scaling regressions automatically. |
| W10 | lesson steps | Remove `dvh`/`vw`-arithmetic sizing from step content; use container units / fixed `rem` | M | H | ⚠️ | Violates CLAUDE.md; causes tile jitter + overflow. `WordImageMcq`, `MatchPairs`, `BuildSentence`, symbol steps, cloze steps. |
| W11 | app shell | Safe-area tokens: `viewport-fit=cover` + `safe-*` utilities backed by `env(safe-area-inset-*)` | S | M | ✅ | Zero safe-area handling today. Apply to sticky header, mobile-menu backdrop, `FloatingLanguagePill`, bottom sheets. Maps to RN `useSafeAreaInsets`. |
| W12 | settings | Settings mobile nav → horizontal scrolling `TabList` or collapse-on-select `<sm` | M | M | — | Weakest mobile surface (`SettingsNav.tsx:56`, `SettingsContent.tsx:14`); verify wrapper height-bound. |
| W13 | practice | Conjugation-hub: reserve bottom padding = sticky-bar height on scroll content | S | M | — | `ConjugationPracticePage.tsx:202-242` vs bar `:247`; last tiles hidden under opaque pill. |
| W14 | lesson/placement | Fix CTA-below-fold: make step CTA sticky-to-shell-bottom or reduce `52/44dvh` grid floors on short heights | M | M | — | `MultipleChoiceStepView.tsx:155`, `BuildSentenceStepView.tsx:243`; generalize `MatchPairs` reserved-slot pattern. |
| W15 | social | ProfilePreviewPopover edge-collision / `right-0` flip / viewport clamp | S | M | — | `ProfilePreviewPopover.tsx:57` — 288px panel overflows right edge @360px. |
| W16 | flashcards/social | Fix fixed-width non-shrinking flex children (`w-full max-w-[280px]` + allow shrink; stack panes `<md`) | S | M | — | `CardPreview.tsx:213` (side pane won't stack), `ActivityFeedStrip`, `FlashcardsPage`. |
| W17 | platform seams | Define `Storage`/router/`AudioPlayer`/`SpeechRecognizer`/`StrokeRenderer` interfaces; decouple `localStorage`(123)/`react-router`(136) in-place | L | M | ✅ | Pure web decoupling now; native impls at RN time. Un-portable modules already partly seam'd (audio DI, speech featureFlag). |
| W18 | community/admin | Standardize full-height panes on `dvh`/`svh`; kill `100vh` | S | M | — | `DeckEditor.tsx:324`, `StoryEditor.tsx:333`, `EventsPage.tsx:43` — iOS content hidden under address bar. |
| W19 | typography | Replace `text-[Npx]` (359, 272 ≤11px) with `rem`/scale tokens; ≥12px body floor | M | M | ⚠️ | a11y font-scale + legibility; ban `text-[9px]`. |
| W20 | overlays | Auto-fall-back Popover/DropdownMenu to bottom Sheet below mobile boundary | M | M | ⚠️ | `FilterBar.tsx:82` already proves the pattern; removes `getBoundingClientRect` positioning on touch, ports cleanly to RN. |
| W21 | god files | Split `LessonPage` (1,051 LOC, 8 step renderers) and isolate `TransitLearnPage` SVG map before responsive/RN refactor | L | M | ⚠️ | Reduces risk on the surfaces hardest to touch safely (flagged in CLAUDE.md). |
| W22 | motion | One `useReducedMotion` (OR Settings flag with OS query); route all 7 direct `matchMedia` gates through it | S | L | ⚠️ | Two sources of truth today. |
| W23 | cleanup | Reconcile duplicate `FilterBar` (`ui/` 217 vs `data/` 72) to one | S | L | — | Blocks clean primitive port. |
| W24 | admin | Optional stacked-card table layout `<md` for highest-traffic admin lists | M | L | — | Low priority; desktop-first surface. |

---

## 6. Mobile Render Test-Pipeline Spec

**Runs headless here, today.** Playwright (`@playwright/test ^1.60`) already drives all screenshot scripts; `.auth/user.json` is a valid 6.9KB token-bearing storageState (origin `localhost:5173`, 6 cookies, 10 auth0 entries) → authed routes render headless with **no human**. `webServer` (`playwright.config.ts:33-39`) auto-starts `npm run dev` and reuses an existing 5173 server. Real Chromium has a layout engine → geometry assertions are valid. **happy-dom/Vitest has no layout engine** (`vite.config.ts:386`) — never run overflow/rect checks there; Vitest stays for logic only.

**Reusable precedents to generalize:** `scripts/kanji-ruby-measure.mjs` (the template — already does page-overflow `scrollWidth>clientWidth+1`, within-viewport rect checks, container-clip, 44px tap-floor, over a `VIEWPORTS×THEMES` matrix with non-zero exit); `scripts/batch-shots.mjs` (34-route `PAGES` list + a `VIEWPORTS` array already `[["mobile",390,844],["desktop",1440,900]]` + lang/funding/cookie seeding — **but `:60` omits `storageState`, so its "authed" routes aren't authed; any new runner must pass `storageState:".auth/user.json"` as `shot.mjs:52` does`); `scripts/shot.mjs` (correct seeding: `addInitScript` sets `open-lingo-settings` learningLanguageId + `ftueArcSeen` + funding-collapsed BEFORE navigation so modals don't block); `scripts/qa-link-crawl.mjs` (`pageerror`/console capture pattern).

**Viewport matrix** (Playwright CSS px, `deviceScaleFactor:1` — DPR doesn't affect layout overflow, keeps snapshots small):

Primary gate (5): `android-small` 360×640, `iphone-se` 375×667, `pixel-7` 412×915, `iphone-14-promax` 430×932, `tablet-portrait` 768×1024 (the `md`/`lg` boundary where the sidebar isn't shown yet). Extended/nightly: `iphone-se-landscape` 667×375, `pixel-7-landscape` 915×412 (short-height clipping). Second axis: `colorScheme: light|dark` on a **reduced** route set only (Academia light vs charcoal dark regress, but doubling the full matrix is wasteful).

**Assertions** (all in `page.evaluate()` after `waitUntil:"networkidle"` + settle; `EPS=1px`):
1. **No horizontal page overflow** — `scrollingElement.scrollWidth <= clientWidth+1` (highest-signal; generalizes `kanji-ruby-measure.mjs:80`). **Hard-fail.**
2. **No element pushed off the right edge** — `querySelectorAll('body *')` filter `width>0 && right>innerWidth+1`, report offenders (tag/class/right). **Hard-fail once baseline clean.**
3. **Tap targets ≥44px** — interactive selector, filter visible + `height<44||width<24`. Start **warn** (curated allow-list for inline links/icon-in-hit-area), promote per-route.
4. **Primary CTA in initial viewport** — requires a small markup prereq: add `data-testid="primary-cta"` on each surface's main action, then rect within `innerHeight`/`innerWidth`. Catches the `mt-auto`-below-fold class of bug.
5. **No unintended vertical scroll on fixed-shell surfaces** — N/A until the planned `100dvh` shell lands (`Layout.tsx:134` is `min-h-screen` scrollable today); wire per-route behind a flag.
6. **Mobile nav present, not overlapping content `<md`** — assert overlay (`Layout.tsx:324`) exists + no primary-content rect intersects the nav rect.
7. **No console/page errors during render** — `page.on('pageerror')` + `console` type `error` (per `qa-link-crawl.mjs:10-11`). **Hard-fail.**
Second tier (advisory, visual snapshots): overlap/z-order, `text-overflow:ellipsis` truncation (DOM sees full text), font-scaling aesthetics — `toHaveScreenshot()`, mask dynamic regions (streaks/timers/ads).

**File/script layout.** Layer A (the gate, Playwright specs): `tests/mobile/_matrix.ts` (VIEWPORTS + ROUTES `{path,auth,lang,primaryCta?}`), `_seed.ts` (shared addInitScript lifted from `shot.mjs:57-92`), `_measure.ts` (`overflowCheck`/`wideElements`/`smallTapTargets`/`ctaInFold`), then `overflow.mobile.spec.ts`, `tap-targets.mobile.spec.ts`, `cta-fold.mobile.spec.ts`, `render-errors.mobile.spec.ts`. Add a `mobile` project to `playwright.config.ts` (viewport/`storageState`/`*.mobile.spec.ts`), either one project per viewport or `test.describe.each(VIEWPORTS)`. Layer B (visual sweep): generalize `batch-shots.mjs` → `scripts/mobile-matrix.mjs` **with storageState**, §matrix viewports, writes `<route>--<viewport>.png`, prints PASS/FAIL + `process.exit`. npm scripts: `test:mobile` (gate), `test:mobile:shots` (visual), `test:mobile:snap`/`:update` (advisory baselines).

**Route targets** (reuse `batch-shots.mjs:17-49`): public `/landing /get-started /try /login /about` (no auth — always-green subset); authed `/home /settings`; learn `/ja/learn`, `/learn/course`, lesson steps `…/lessons/ja-m4-1-1?step=0|2|6` (highest-risk — LessonPage god file), `/placement-test`; practice pillars (`/practice` hub, grammar/review/conjugation, flashcards + review/cards/decks, alphabet/hiragana, kanji, stories, journey, reading/speaking/listening/writing); content/social `/ja/vocab /shop /community/explore /community/leaderboard /social`. **Run the `/ja/*` set once and a representative subset as `ko`** — Korean was ported later; CJK/long-string wrapping is where overflow bites.

**CI:** new `mobile-e2e` job in `.github/workflows/ci.yml` after `build` — `playwright install --with-deps chromium`, `npm run test:mobile` (`CI:true` → retries:1/workers:1/github reporter), upload `playwright-report/`+`test-results/` on failure. Gate assertions 1-2 + 7 as hard-fail first; ratchet 3-4 per route as baselines clean. Snapshots advisory/nightly.

**Needs a human (fallback):** (a) **Refreshing `.auth/user.json` on Auth0 expiry** — the access token is short-lived; silent refresh works only while the SPA cache is valid, then re-seed is the interactive headed `npm run test:e2e:auth` (`auth.setup.ts:44`, 5-min window, needs WSLg) which **cannot run headless**. CI fallback: provision a dedicated test account + Auth0 password-grant/service-token seeding step to mint storageState non-interactively (preferred long-term), OR run the **public-route subset headless in CI** as the always-green gate and the authed matrix locally. (b) **Visual snapshots are font-render-sensitive** across WSL/local vs CI Ubuntu — keep advisory, generate baselines inside the CI container if ever promoted, mask dynamic content. (c) **"Looks wrong but fits" aesthetic judgment** — the pipeline flags overflow/clipping/tap-size objectively but can't rank subjective polish; a human eyeballs `test:mobile:shots`.

---

## 7. React Native Compatibility

**Direction: adopt NativeWind v4 as the shared styling layer, preceded by the token migration (W1).** Rationale: the codebase is deeply Tailwind-committed (6,538 classNames, 61 className-based primitives, `cn()`+variant-map idiom); NativeWind is the only option that keeps those on both platforms — every alternative (Tamagui, Unistyles, StyleX) discards them. The token architecture is the hard part already done right: platform-agnostic `ThemeTokens`, a single web adapter, CSS-var theming (23 `dark:` usages). NativeWind consumes exactly this. W1 (channel triples) is a prerequisite that pays off on web *today* (533 broken styles) and converts tokens to native-numeric form.

**What NativeWind does NOT solve (separate abstraction work):** `div/span/p`→`View/Text/Pressable` element swap (biggest mechanical cost — 1032 `span`, 851 `p`; RN forbids raw text outside `<Text>`), `react-router-dom`→React Navigation/router abstraction (136 files), `localStorage`→`Storage`/AsyncStorage interface (123 files), 919 `hover:` styles meaningless on touch. Approach: abstract primitives + platform APIs behind TS interfaces, then let NativeWind unify styling on top.

**First primitives to convert** (high reuse × pure presentational × no web APIs — validate the pipeline before touching routing/portals/audio):
- **Tier 1 (port first):** `Badge` (canonical smallest test; also proves the W1 alpha-tint fix), `Spinner`/`CenteredLoader` (forces the Reanimated animation-adapter decision on a trivial surface), `Card` (65 sites; exercises full token set surface/border/radius/shadow), `Skeleton` (`animate-pulse` smoke test), `Button` (48 sites; `<button>`→`<Pressable>`, `active:`/`disabled:`→press state; note `!justify-start` `cn()`-ordering hack needs resolution), `EmptyState` (validates composed nesting). Plus `Icon` (199 sites, one registry seam → `lucide-react-native` — the single highest-leverage port).
- **Tier 2 (after pipeline proven):** `Switch`/`Checkbox`/`Radio`/`Slider`/`SegmentedControl` (→ RN controlled inputs; `SegmentedControl` is the designated mobile tab replacement — make it standard over web `Tabs` on small viewports), `Tabs`/`Accordion`, `Avatar` (+ `UserAvatar`/`DecoratedAvatar`), `Select`/`Field`/`Input`/`Textarea` (→ `TextInput`/Picker). Harden `Show`/`ResponsiveSwitch`+`useViewport` here (the responsive contract itself — `matchMedia` on web, `useWindowDimensions` on RN, same API).

**Web-locked — wrap behind an API, reimplement natively, never "share the component":** `Modal`/`Dialog`/`Sheet`/`Drawer`/`Popover`/`DropdownMenu`/`Tooltip`/`Toast`/`Portal` (`createPortal`+focus-trap+`getBoundingClientRect`), `ScrollArea`/`ContentRail`/`BodyScrollbars` (OverlayScrollbars → `ScrollView`/`FlatList`), `FacetSidebar`, `CommandPalette` (keyboard-only), `DataTable` (→ FlatList), the `ModalBase`/`ModalRoot`/`ModalBackdrop`/`ConfirmModal` stack (consolidate into `ui/Modal` first — W3), `ThemeEditorPanel`/`DevPanel`/`CookieConsent` (dev/web tooling), `SiteFooter`/`AuthMenu`/`FloatingLanguagePill`/`LanguageSelector` (app-shell chrome, rebuild per-platform). Un-portable native modules behind interfaces: everything in `src/shared/audio/` (Web Audio+HTMLAudio), `src/shared/speech/` (speechSynthesis/SpeechRecognition/Whisper worker/getUserMedia), the canvas set (`Confetti`/`DrawingCanvas`/`SymbolIntroStepView`/`drawingComparison`), `src/shared/glyphs/` stroke rendering — define `AudioPlayer`/`SpeechRecognizer`/`StrokeRenderer`/`Storage` now, keep web impls, add native later.

**Two cleanups that block a clean port:** duplicate `FilterBar` (`ui/` 217 LOC vs `data/` 72, different exports — reconcile to one) and the two parallel modal systems (pick one canonical modal or the RN port doubles).

**Suggested sequencing:** (1) ship W1 token migration; (2) add `Storage`/router/audio/speech/stroke interfaces as seams in-place on web (no RN yet); (3) introduce NativeWind + `View`/`Text`/`Pressable` shim, port Tier-1 (Badge→Card→Button); (4) expand to Tier 2, then rebuild web-locked shells natively.
