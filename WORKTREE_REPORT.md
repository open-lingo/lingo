# Home page redesign — bento "home base"

Branch: `ui/home-redesign`. Rewrites the returning-user home
(`src/features/home/restructured/`) from a vertical widget feed into a tight
bento dashboard that fits one desktop viewport.

## The bento layout

```
┌───────────────────────────────────────────────────────────────┐
│  HERO  "Hi {name}" + Continue/Start CTA + lesson progress  │  ⟶ streak │
│        bar                                                 │    level/XP│   ← what to do + reward
├──────────────────────┬──────────────────────┬─────────────────┤
│  TODAY'S PLAN        │  FLASHCARDS DUE      │  LEADERBOARD     │
│  daily-quest         │  N cards · Review    │  friends, you    │   ← momentum / action /
│  checklist · X/Y     │  now + due chips     │  highlighted     │     friends
├──────────────────────┴──────────────────────┴─────────────────┤
│  TRENDING IN THE COMMUNITY — 4 compact deck/discussion tiles    │   ← community
└───────────────────────────────────────────────────────────────┘
```

### How each block answers a motivation-loop question
- **What should I do?** → Hero "Continue learning" (single dominant CTA,
  drops straight into the lesson player) + Flashcards "Review now".
- **What reward am I about to earn?** → Hero reward strip: streak flame,
  level, XP-to-next-level progress bar (Duolingo-style, merged from the old
  standalone Account Overview card).
- **Momentum** → Today's Plan daily-quest checklist ("1/2 done", per-item XP).
- **How am I doing?** → folded into the hero (streak/level/XP) + Today's Plan.
- **What are my friends doing?** → Leaderboard reframed as competition: top
  friend, your highlighted row, "X XP to pass {name}".
- **What's cool in the community?** → Trending strip — compact horizontal
  tiles of the freshest decks + discussions.

## What I prioritised / cut to stay no-scroll

The desktop home **content fits one 1440×900 viewport** (content bottom ≈ 754px
of 900; the site-wide footer sits below the fold by design, same as every
other page). To get there from the old ~1231px-tall stack:

- **Merged** the greeting banner + the redundant right-side "where you left
  off" card + the standalone Account Overview (streak/XP/weekly sparkline)
  into ONE hero. Killed the three competing CTAs → one "Continue learning".
- **Compressed** the old full-height Friends panel (friends list + suggestion
  + friend-quest, which ate ~40% of the page) into a 1/3-width competitive
  Leaderboard. The "Add friends" entry is kept; the social page owns the rest.
- **Cut** the "Recent practice" tile — it was mock-only (no `useLastPractice`
  endpoint) and the lowest-signal of the action tiles.
- **Cut** the recent-activity feed (owner's lowest priority, no endpoint).
- **Shrank** the Community section from a 3-row card into a 4-tile compact strip.

## Real data vs. gaps

| Surface | Source | Status |
|---|---|---|
| Hero lesson / progress / "lesson N of M" | `getMockCourse` + `useCompletedLessonIds` + `findInProgressLessonId` | **real** (course data + local progress) |
| Streak / level / XP-to-next | `useUserStats` (`/progress/me`) | **real** |
| Today's Plan (daily quests) | `useQuests` (`/api/core/v1/quests`, server-authoritative) | **real** |
| Flashcards due count + preview | `useCardsDueCount` + `useFlashcardDueSummary` (SRS) | **real** |
| Leaderboard | `useFriendsLeaderboard` (`/social/leaderboards/friends`) | **real** |
| Trending decks | `community.listAddons({languageId})` | **real** (empty for some langs → shows empty state) |
| Trending discussions | `community.listThreads({sort:"new"})` | **real** (behind `flags.community.tabs.discuss`) |

### Noted gaps (left as skeletons / empty states, not faked)
- **Cover art / creator avatars on trending tiles** — the `CommunityAddon`
  payload has no cover-image or author-avatar field yet, so tiles use an icon
  chip + meta. Swap to real covers when the backend ships them.
- **Leaderboard period language** is hardcoded to `ja` inside
  `useFriendsLeaderboard` (pre-existing); inherited as-is.
- **All `mockHomeData.ts` mock surfaces are gone** — every tile now reads a
  real hook or renders a real empty state.

## Files
- New: `HeroContinue.tsx`, `TodaysPlan.tsx`, `LeaderboardCard.tsx`,
  `TrendingRow.tsx`, plus pure helpers `planHelpers.ts` / `leaderboardHelpers.ts`
  (+ unit tests).
- Rewritten: `RestructuredHome.tsx`.
- Reused: `FlashcardsTile.tsx` (already real-data).
- Deleted (orphaned): `HeroSection`, `AccountOverviewCard`, `RecentPracticeTile`,
  `SocialCard`, `CommunityStrip`, restructured `QuestsCard`, `components/QuestRow`,
  `mockHomeData.ts`.
- i18n: added `home.restructured.*` keys to `en.json` + `ko.json`.

## House style
- lucide via `Icon` for all affordances (flame, hand, trophy, crown, target,
  check-circle, star…). Only emoji is the language flag fallback.
- Every `useQuery` has explicit `staleTime`; no inline API instantiation.
- All strings via `t()`.

## Verification
- `npx tsc --noEmit` — clean.
- `npm run build` — clean (pre-existing chunk-size warning only).
- `npx vitest run` — 117 files / 1050 tests pass (incl. 11 new helper tests).
- Screenshots in `.screenshots/`: desktop proves no-scroll (content within the
  viewport), plus mobile pass.

Before vs after:
- `before-desktop.png` (widget feed, scrolls) → `after-desktop.png` (bento,
  no internal scroll) + `after-desktop-full.png`.
- `before-mobile.png` → `after-mobile.png` (stacks cleanly; mobile may scroll).
