# Task: Homepage UX Improvements

**Files:** `src/features/home/HomePage.tsx`, `src/features/progress/ProgressSummary.tsx`
**Current state:** Home shows "Welcome back" for logged-in users; guests get "Welcome, guest" but the rest of the page is identical except no ProgressSummary or Continue Learning. No community deck pointers.

## Goals

1. **Logged-out experience** — Tailored homepage for guests: value prop, CTA to sign up or browse, try-it flows
2. **More enticing for all** — Polish, visual hierarchy, clearer CTAs
3. **Community deck pointers** — Section or card linking to "Explore new decks" / ContentBrowserPage
4. **Streaks display** — Improve where/how streaks are shown (ProgressSummary or dedicated strip)
5. **XP (start)** — Introduce XP display; mock at first; prepare for backend

## Requirements

### Logged-out homepage
- Distinct layout: hero/value prop, "Get started" or "Try a lesson" CTA
- Language picker visible (already have LanguagePickerModal when no language)
- Link to community/explore so guests can browse decks before signing up
- Optionally: preview of available languages or course cards (read-only)

### Community deck pointers (logged-in)
- Add card or section: "Discover new decks" → `community/explore`
- Maybe "Trending" or "New this week" teaser (mock or API when ready)

### Streaks
- Current: ProgressSummary shows `streakDays`, `lessonsCompletedThisWeek`, `cardsDue`
- Consider: streak in a more prominent spot (header strip? home hero?)
- Or: keep in ProgressSummary but improve styling (flame icon, animation)

### XP (start)
- Add XP to ProgressSummary or home (mock value for now)
- Define shape: `{ total: number, earnedToday?: number }` — align with backend later
- i18n keys for XP labels

## Acceptance criteria

- [ ] Logged-out users see a distinct, welcoming homepage (value prop + CTA)
- [ ] Community deck pointer: link/card to explore new decks
- [ ] Streak display updated (location or styling)
- [ ] XP placeholder displayed (mock); i18n keys added
- [ ] All strings use `t()`
- [ ] `npm run build` passes

## Files

- `src/features/home/HomePage.tsx`
- `src/features/progress/ProgressSummary.tsx`
- `src/features/progress/mockProgress.ts` (or new mock for XP)
- `src/shared/i18n/locales/en.json`, `ko.json`
