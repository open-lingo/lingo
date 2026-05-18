# Home Page Restructure — Design Spec (2026-05-18)

Status: approved-pending-review · Owner: Spencer · Target: returning-user `/home` view.

Companion: dev-route mockup at `/:lang/home-preview` (`src/features/home/dev/HomeRestructureMockup.tsx`). The committed implementation must visually match that mockup; this document describes the rules behind it.

## Goal

Replace the current returning-user `<HomePage />` body (welcome heading + continue card + `ProgressSummary` + `navCards` + `HomeActivityPanel`) with a denser, more glanceable layout that surfaces account progress, daily/weekly quests, social signals, and community activity on one screen.

## Non-goals (this pass)

- Top-nav / mobile-menu / footer restructure. Documented in a separate spec later once we know what moved off the home body.
- First-time-user (zero-data) variant. The existing `<WelcomeBanner />` + `<EmptyActivityNotice />` path stays in place. New layout renders only for the **signed-in, returning** branch of `HomePage.tsx`.
- Guest (unauthenticated) view. Unchanged.
- Backend work for quests, friends, or "recent practice." All three ship as mock-driven UI this round.
- Kana-mastery dial real wiring — JA-only language-specific stats source. Ships with mock percentage; real wiring is a follow-up.

## Layout

CSS-grid, three named columns at `lg:` (≥1024px). Below `lg` everything stacks single-column in document order.

```
grid-template-areas:
  "account account social"
  "flash   quests   social"
  "recent  quests   social"

Bottom (full width, outside the 3-col grid):
  community
```

Stack order on mobile / tablet (`< lg`): hero → account → quests → flash → recent → social → community.

Hero sits above the grid and is full-width at every breakpoint.

## Components

Each component below is a new file under `src/features/home/restructured/`. Mock data is co-located until real wiring lands.

### 1. `HeroSection.tsx`

- Two-column layout at `md:`+ (`1.2fr / 1fr`), single-column below.
- Reuses the existing language background-image treatment (`languageConfig.backgroundImage` + dark gradient overlay).
- **Left:** kicker ("Welcome back to Lingo"), name greeting, streak-aware subline, primary "Continue lesson" CTA, "Up next: {lessonTitle}" line.
- **Right (inset):** glass card with module name, lesson title, lesson-N-of-M progress bar, "paused N ago" line.
- Wiring: greeting + module + lesson via existing `getNextLesson(course)` and `useAuth()` / `me.display_name`. Streak count via the same source `ProgressSummary` uses (`getMockProgressSummary`). "Paused N ago" is mock for now.

### 2. `AccountOverviewCard.tsx` — grid area `account`

- Header: kicker + headline + Level pill.
- Top metric row (3 cells, `sm:grid-cols-3`):
  1. Daily-goal ring (SVG, `ProgressRing`) — uses `dailyGoalCompletedMinutes / dailyGoalMinutes`.
  2. Streak — flame icon in a tinted well + N days + best-N caption.
  3. Weekly sparkline — 7 vertical bars sized by minutes-per-day, color `bg-accent/80`.
- XP bar — gradient `from-accent to-accent-hover`, label "X XP +Y today", caption "Z XP to level N+1".
- Kana mastery row — pill-style summary; renders only when `language.id === "ja"`. Hidden otherwise (placeholder dimensions reserved so layout doesn't jump? — **decided: no, just don't render**; row collapses).

### 3. `FlashcardsTile.tsx` — grid area `flash`

- Icon well (accent-muted) + "Due" warning chip.
- Headline: "{N} cards" with caption "Flashcards".
- Glyph preview row — 5 small squares with the first 5 due-card front glyphs + "+{rest}" overflow.
- Primary button: "Review now" → `langPath("practice/flashcards/review")`.
- Mock data in v1 — replace `cardsDue`, `cardsHotPreview` with `useCardsDueCount(langId)` + new "preview next N glyphs" helper later.

### 4. `RecentPracticeTile.tsx` — grid area `recent`

- Hover-card; whole card is a `<Link>`.
- Icon well (neutral surface, gains accent on hover) + "Recent" caption.
- Title (last practice type) + relative-timestamp subtitle + accent footer "Pick up where you left off →".
- Mock data in v1. Future wiring: tiny `useLastPractice()` hook backed by localStorage, written on entry to any `/practice/*` route. Out of scope for this PR.

### 5. `QuestsCard.tsx` — grid area `quests` (spans 2 rows)

- Header: "Today" kicker + "Daily quests" headline + "Resets {N}h" chip.
- 3 daily-quest rows via `QuestRow` sub-component (icon well, label, done/goal counter, progress bar, +XP chip). Completed rows: success-tinted icon well + line-through label + success-colored progress bar.
- Footer (pinned to bottom via `flex flex-col` + `mt-auto`): weekly-goal block — kicker, label, progress bar, +XP chip, done/goal counter.
- Mock data only.

### 6. `SocialCard.tsx` — grid area `social` (spans 3 rows)

- Header: "Social" kicker + "Friends" headline + "Add" pill button.
- Friend list — 3 rows max, each with avatar (initial in accent-muted disc) + active/idle status dot + name + status text + streak chip.
- Friend quest block (rounded surface-muted) — quest label + 2-column you/friend progress.
- Friend-suggestion block — dashed-border card, avatar + name + "reason" + Follow button.
- Footer (pinned bottom): "View leaderboard →" outline button.
- Mock data only. Future: backend service for friends, suggestions, friend-quest sync. Out of scope.

### 7. `CommunityStrip.tsx` — full-width, below grid

- Header bar (border-bottom): globe icon + "Community" + two text links ("Discussions", "Browse decks").
- 3-cell horizontal split at `md:` (divides via `md:divide-x md:divide-y-0`); stacks single-column below.
- Each cell: icon well + kind-tag + optional NEW pill + title + meta line.
- v1 wiring: reuse existing `HomeActivityPanel` data sources (`MOCK_THREADS` + new-decks count). Add a third "article" kind via future `flags.community.tabs.articles`.

## Theme rules

- Color tokens only: `bg-{surface,surface-muted,surface-elevated}`, `border-border`, `text-{primary,secondary,muted}`, `accent{,-hover,-muted}`, `warning`, `success`, `on-accent`. No hardcoded hex.
- Radii: `rounded-xl` for cards, `rounded-2xl` for hero, `rounded-lg` for icon wells, `rounded-full` for chips / dots / progress.
- Shadows: `shadow-card` on cards (default Card primitive), no custom shadows.
- One gradient: `bg-gradient-to-r from-accent to-accent-hover` on XP and weekly-progress bars only.
- Typography: existing scale — `text-xs` kickers (uppercase tracking-wider), `text-base/lg` card titles, `text-2xl/3xl` hero headline, font-extrabold for big numbers.

## Mobile

- Single grid column below `lg:`. No horizontal scroll.
- Hero `md:grid-cols-[1.2fr_1fr]` collapses to single column below `md:`; the "Where you left off" inset stacks under the CTA.
- Community strip cells stack into a `divide-y` vertical list below `md:`.
- Touch targets: every interactive element (hero CTA, "Review now", "Follow", "View leaderboard", community rows) is `≥40px` tall in the implementation.

## Wiring map (v1 scope)

| Surface | v1 source | v2 / follow-up |
|---|---|---|
| Hero — name, lesson, module | `useAuth() + me.display_name`, `getNextLesson(course)` | Real "paused N ago" timestamp from last-lesson-start telemetry |
| Hero — streak (subline) | `getMockProgressSummary().streakDays` (same as today) | Real streak engine |
| Account — daily-goal ring | `getMockProgressSummary()` daily-goal fields | Same |
| Account — streak / best | `getMockProgressSummary().streakDays`; best is mock | Best-streak persistence |
| Account — weekly sparkline | mock array (`[12,18,6,0,22,14,8]`) | `store.completed` aggregated per day |
| Account — XP bar | `xpTotal`, `xpEarnedToday` from `getMockProgressSummary()` | Same source already live |
| Account — kana mastery | mock 38% gated by `language.id === "ja"` | JA kana SRS retention query |
| Flashcards — due count | mock `23` | `useCardsDueCount(langId)` (already exists) |
| Flashcards — glyph preview | mock 5 chars | Query "next N due card fronts" on SRS store |
| Recent practice | mock | `useLastPractice()` localStorage hook (separate PR) |
| Daily quests | mock array of 3 | Quest engine (separate PR) |
| Weekly quest | mock | Same |
| Social — friends, suggestions, friend-quest | mock | Backend service (multi-PR) |
| Community strip | reuse `HomeActivityPanel` data (`MOCK_THREADS`, new-decks count) | Articles kind via `flags.community.tabs.articles` |

`// MOCK:` comments must mark every replacement point in the implementation so they're greppable later.

## Files this PR touches

- `src/features/home/HomePage.tsx` — replace the returning-user branch body. First-time-user and guest branches unchanged.
- `src/features/home/restructured/` (new):
  - `HeroSection.tsx`
  - `AccountOverviewCard.tsx`
  - `FlashcardsTile.tsx`
  - `RecentPracticeTile.tsx`
  - `QuestsCard.tsx`
  - `SocialCard.tsx`
  - `CommunityStrip.tsx`
  - `mockHomeData.ts` — single export of all mock objects, makes wiring later mechanical.
  - shared sub-components: `ProgressRing.tsx`, `WeekSparkline.tsx`, `QuestRow.tsx`, `FriendAvatar.tsx`.
- `src/features/home/dev/HomeRestructureMockup.tsx` — kept as the pre-implementation reference; can be removed after merge (or left as a dev playground — author's choice).
- `src/App.tsx` — leave the `/:lang/home-preview` dev route for one more round of iteration; can delete in a follow-up cleanup PR.

Files NOT touched: `ProgressSummary.tsx`, `HomeActivityPanel.tsx`, `HomeNavCard.tsx`, `FlashcardsCard.tsx`, `PracticeCard.tsx`, `WelcomeBanner.tsx`, `EmptyActivityNotice.tsx`. They remain as the first-time-user / guest path and as components other surfaces may import. They become dead code on the returning-user path only.

## Risks + things to watch

- **Language-context required.** Several sub-cards read `useLanguage()` and `getLanguageConfig()`. If those return null on the home route (the canonical home is `/home`, no `:lang` prefix), components must gracefully degrade. The current `HomePage` already handles this — copy the pattern.
- **Kana-mastery row only for JA.** Hide cleanly for non-JA so the Account Overview height isn't jittery between languages.
- **Mock-data drift.** Spencer's app vision says "no fake gamification." Mock quests, mock streaks-among-friends, and mock friend-quest progress all border on that. The mitigation: every mock surface ships with `// MOCK:` comments + a tracking issue to replace before any public announcement / launch beat. Internally-visible only is the rule until wired.
- **`bg-accent-rgb` CSS var.** The hero fallback gradient uses `var(--color-accent-rgb)` with a fallback. Confirm that var is defined in the theme storage (it is in the current `WelcomeBanner` — reuse the same expression).
- **CSS-in-JS via `style={{ gridTemplateAreas }}`.** Tailwind doesn't have a built-in `grid-template-areas` utility short of plugins. Inline style is fine; the area names appear once at the parent and on each child via `style={{ gridArea }}`. Acceptable trade-off vs. adding a Tailwind plugin.

## Acceptance criteria

1. Visiting `/home` while authenticated and having completed ≥1 lesson renders the new grid (Hero → Account+Quests+Social → Community), matching `/ja/home-preview` visually.
2. First-time users (`getMockCompletedLessonIds().length === 0`) still see the old `<WelcomeBanner /> + navCards + <EmptyActivityNotice />` flow.
3. Guest (unauthenticated) view unchanged.
4. Theme editor changes (accent color swap, dark mode toggle) propagate to all new components — no hardcoded colors.
5. At viewport widths 360, 768, 1024, 1440: no horizontal scroll, no clipped content, touch targets ≥40px.
6. Typecheck passes (`tsc --noEmit -p tsconfig.app.json`).
7. Every mock surface in the implementation files contains a `// MOCK:` comment naming the replacement target (e.g. `// MOCK: replace with useCardsDueCount(langId)`).
