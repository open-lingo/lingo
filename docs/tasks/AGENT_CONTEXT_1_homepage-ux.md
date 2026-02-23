# Agent Context: Homepage UX Improvements

**Copy this entire document** and give it to the AI agent. It contains everything needed to implement the task.

---

## Task

Implement homepage UX improvements for Open Lingo: (1) a tailored experience for logged-out users, (2) community deck pointers, (3) improved streak display, and (4) XP placeholder.

---

## Project context

- **Stack:** Vite + React, Tailwind, react-i18next
- **Auth:** `useAuth()` → `isAuthenticated`, `user`, `isLoading`
- **Routes:** All under `/:lang/` (e.g. `/ko/learn`, `/ko/community/explore`). Use `useLangPath()` for links: `langPath("community/explore")` → `/ko/community/explore`
- **i18n:** All strings via `t("key")`. Add keys to `en.json` and `ko.json` in `src/shared/i18n/locales/`

---

## Current behavior

**HomePage** (`src/features/home/HomePage.tsx`):
- Same layout for logged-in and logged-out
- Logged-in: "Welcome back, {name}", Continue Learning link, ProgressSummary, card grid (FlashcardsCard, Stories, PracticeCard), course modules, quick links
- Logged-out: "Welcome to Open Lingo" but otherwise same — no ProgressSummary or Continue Learning, but card grid and quick links still show
- `LanguagePickerModal` opens when `!language` (no learning language selected)

**ProgressSummary** (`src/features/progress/ProgressSummary.tsx`):
- Only rendered when `isAuthenticated`
- Shows: streak days, lessons this week, cards due (from `useCardsDueCount`)
- Uses `getMockProgressSummary()` for streak, lessons, daily goal
- Daily goal progress bar

**mockProgress.ts** (`src/features/progress/mockProgress.ts`):
- `ProgressSummary` type: `streakDays`, `lessonsCompletedThisWeek`, `dailyGoalMinutes`, `dailyGoalCompletedMinutes`, `cardsDueToday`
- `getMockProgressSummary()` returns mock values

---

## Requirements

### 1. Logged-out homepage (distinct layout)

When `!isAuthenticated`:
- **Hero/value prop:** Short tagline (e.g. "Learn Korean and Japanese with spaced repetition")
- **CTAs:** "Get started" / "Sign up" (→ `/login`) and "Browse decks" (→ `community/explore`). Guests can browse without logging in.
- **Language picker:** Already handled by `LanguagePickerModal` when `!language`. If they have a language, show a small preview of available content or "Try a lesson" link.
- **Do NOT** show: ProgressSummary, Continue Learning, full course modules. Keep or adapt the card grid — maybe simplified (e.g. "Flashcards", "Stories", "Explore decks").

### 2. Community deck pointers (logged-in)

- Add a section or card: **"Discover new decks"** linking to `community/explore` (ContentBrowserPage)
- Optional: "Trending" or "New this week" teaser (mock is fine — e.g. "3 new decks this week")
- Route: `langPath("community/explore")`

### 3. Streaks

- Improve where/how streaks are shown
- Options: (a) keep in ProgressSummary but add flame icon, better styling; (b) add a small streak strip above or beside the hero; (c) both
- ProgressSummary already shows `p.streakDays` and `t("progress.dayStreak")`. Enhance visually.

### 4. XP (placeholder)

- Add XP to ProgressSummary (or home). Mock value for now.
- Extend `ProgressSummary` type in mockProgress: `xpTotal?: number`, `xpEarnedToday?: number`
- Add to `getMockProgressSummary()`: e.g. `xpTotal: 1250`, `xpEarnedToday: 50`
- Add i18n keys: `progress.xp`, `progress.xpEarnedToday` (or similar)
- Display in the grid (4th cell) or as a small badge

---

## Files to edit

| File | Purpose |
|------|---------|
| `src/features/home/HomePage.tsx` | Branch on `isAuthenticated`; logged-out hero + CTAs; community deck card |
| `src/features/progress/ProgressSummary.tsx` | Add XP; improve streak styling |
| `src/features/progress/mockProgress.ts` | Add `xpTotal`, `xpEarnedToday` to type and mock |
| `src/shared/i18n/locales/en.json` | New keys for home (guest), progress (XP, streak) |
| `src/shared/i18n/locales/ko.json` | Same keys, Korean translations |

---

## Key code references

**Auth check:**
```tsx
const { isAuthenticated, isLoading, user } = useAuth();
```

**Lang path:**
```tsx
const langPath = useLangPath();
// langPath("community/explore") → "/ko/community/explore"
// langPath("login") → "/ko/login" — but login is at /login (no lang prefix)
```

**Login route:** `/login` (see App.tsx — no `:lang` prefix)

**Existing home i18n keys:** `home.welcomeBack`, `home.welcomeGuest`, `home.continueLearning`, `home.yourCourse`, `home.cards.*`, `home.quickLinks.*`

**Existing progress keys:** `progress.title`, `progress.dayStreak`, `progress.lessonsThisWeek`, `progress.cardsDueToday`, `progress.todaysGoal`

---

## Acceptance criteria

- [ ] Logged-out users see a distinct homepage (hero, CTAs, no ProgressSummary/Continue Learning)
- [ ] "Browse decks" and/or "Get started" links work
- [ ] Logged-in users see a "Discover new decks" card/section → `community/explore`
- [ ] Streak display improved (styling and/or placement)
- [ ] XP placeholder shown (mock value); i18n keys added
- [ ] All user-visible strings use `t()`
- [ ] `npm run build` passes

---

## Conventions

- Tailwind for styling. Match existing patterns (rounded-xl, border, dark mode variants)
- Use `Link` from react-router-dom for in-app navigation
- Use `<a href="/login">` for login if it's outside the lang-prefixed routes
