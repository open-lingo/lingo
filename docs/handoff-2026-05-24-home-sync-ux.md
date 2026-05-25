# Session handoff — 2026-05-24 (home, sync UX, social mocks)

**Companion:** [handoff-2026-05-25.md](./handoff-2026-05-25.md) (sub-lesson + SRS review work). This doc covers UI/progress/social wiring from the 2026-05-24 session.

---

## 1. Sync manager (header cloud)

**Files:** `src/shared/components/sync/SyncManager.tsx`, `src/shared/iconRegistry.ts` (`cloud`, `cloudSync`, `cloudAlert`)

| State | Trigger icon | Hover (dirty only) | Click |
|--------|----------------|-------------------|--------|
| Synced | Green `cloud` | — | Toggle popover |
| Dirty | Amber `cloud` | Cross-fade to `cloudSync` | Sync now (no popover required) |
| Syncing | Spinning `refresh` | — | — |
| Failed | Red `cloudAlert` | — | Retry sync |

**Popover (~210px):** compact Flashcards / Lessons rows; footer **“Last sync: {{time}}”** (uses `formatTimeAgo` — string already includes “ago” for relative times); “Auto-sync in …” when dirty; error hint when failed.

**Related sync fixes (lesson/SRS buffer):**

- `lessonSync.ts` — `minDurationSecForAttempt`, dedupe batch by `lessonId`, clear buffer on accepted
- `LessonPage.tsx` — `completionRecordedRef` (one attempt per finish)
- `srsSync.ts` — only mark synced when server returns cards
- `SettingsContext` / `useProgressMe` — no `ensureUserConsistency(null)` while auth loading; home waits for first `/progress/me`

**ADR reference:** [lingo-core/docs/adr/0001-progress-api-hybrid-rollup.md](../../lingo-core/docs/adr/0001-progress-api-hybrid-rollup.md) — batch sync model unchanged; UI is the user-facing surface.

---

## 2. Returning-user home (`RestructuredHome`)

**Entry:** `HomePage.tsx` → `RestructuredHome` for all signed-in users (FTUE branch still disabled).

### Account overview card

- **Removed** lingots row (balance stays in header `LingotBalance`).
- **Daily goal** + **week sparkline** from `useLocalProgressSummary()` → `getMockProgressSummary()` + `getWeekPracticeMinutes()` (lesson completions in localStorage; ~10 min per lesson estimate until session telemetry exists).
- **Streak / level / XP** from `useUserStats()` (server `/progress/me` with local fallbacks).
- **This week** layout: `items-start`, smaller flame icon, empty-week copy: “Complete a lesson to start your week”.
- **Kana mastery** — still mock (`mockHomeData.MOCK_KANA_MASTERY`), JA only.

### Quests card

- **Weekly** “Finish 5 lessons” → `summary.lessonsCompletedThisWeek` (real).
- **Daily** “Complete a lesson” → checks off when `dailyGoalCompletedMinutes > 0` today.
- Other daily quests + reset timer — still mock (`mockHomeData`).

### Social card

- Uses **`useSocial()`** — same friends/suggestions/quest as `/:lang/social` (see below).
- Links → `/:lang/social` (not community leaderboard).

### Hero

- Streak subline → `useUserStats().stats.streak` (was `getMockProgressSummary().streakDays`).

### New hooks / helpers

| Hook / fn | Path | Role |
|-----------|------|------|
| `useLocalProgressSummary` | `src/shared/hooks/useLocalProgressSummary.ts` | Subscribes to `subscribeLessonProgress`; returns summary + 7-day minutes |
| `getWeekPracticeMinutes` | `src/shared/domain/mockProgress.ts` | Aggregates completions per calendar day |
| `ESTIMATED_MINUTES_PER_LESSON` | `mockProgress.ts` | Default 10 — daily goal minutes derived from today’s completions |

### Mock home data trimmed

`mockHomeData.ts` no longer exports `MOCK_FRIENDS`, `MOCK_WEEK_MINUTES`, `MOCK_BEST_STREAK`, friend quest/suggestion — social lives in `features/social/mock/mockSocial.ts`.

---

## 3. Social — single mock source + `useSocial`

**Mock:** `src/features/social/mock/mockSocial.ts`  
**Hook:** `src/features/social/hooks/useSocial.ts`  
**API stub:** `src/shared/api/social.ts` (throws until implemented)

Consumers wired through `useSocial`:

- `SocialCard` (home)
- `FriendsSection` (search/list, requests, suggestions)
- `ActivityFeedStrip`, `SocialHeader`, `MessagesSection`

**Still direct mock imports:** `LeaderboardsSection` (large file; leaderboard rows unchanged).

**Home preview:** top 3 friends via `getHomeFriendsPreview()` (active first, by streak). Primary suggestion = first `MOCK_FRIEND_SUGGESTIONS` entry.

**Route:** `/:lang/social` and `/:lang/social-preview` → `SocialPreviewPage`.

---

## 4. Landing page

**File:** `src/features/landing/LandingPage.tsx`  
**Fix:** Hero CTAs mismatched sizes — all use `composeButtonClasses`; secondary links use new **`size: "hero"`** (`min-h-12`, `px-6`) aligned with `primary-3d`.

**File:** `src/shared/components/ui/Button.tsx` — `ButtonSize` includes `"hero"`.

---

## 5. Quests / XP-over-time (planned — not built)

Discussed architecture; captured in [superpowers/specs/2026-05-24-quests-tracking-design.md](./superpowers/specs/2026-05-24-quests-tracking-design.md).

**Summary:** Do not run heavy quest scans inside the synchronous lesson-batch handler. Emit idempotent progress events on accept; update quest counters inline for simple daily/weekly rules first; move to SQS/worker when friend quests, leagues, or anti-cheat need it. Daily XP aggregates (`user_daily_stats[date].xp`) belong on the same event path.

---

## 6. Docs to grep when wiring backend

```bash
rg "// MOCK:" src/features/home/restructured
rg "useSocial|mockSocial" src/features/social
rg "useLocalProgressSummary|getWeekPracticeMinutes" src
```

---

## 7. Still mock / follow-ups

| Surface | Status |
|---------|--------|
| Daily quests (review 20 cards, 5 min practice) | Mock progress in `mockHomeData` |
| Recent practice tile | `MOCK_RECENT_PRACTICE` |
| Hero “paused Nh ago” | `MOCK_HERO_PAUSED_HOURS_AGO` |
| Friend quest progress (you/friend ticks) | `MOCK_FRIEND_QUEST` in `mockSocial` |
| Kana mastery % | `MOCK_KANA_MASTERY` |
| `cardsDueToday` in progress summary | Often 0; flashcards tile uses real `useCardsDueCount` |
| Quest API + daily XP rollup | See quests spec |
| Push status of this branch | Verify `main` has sync + home commits |

---

## 8. Per-step lesson progress (unchanged)

Step events are local telemetry only. Server receives `stepResults[]` inside one attempt at lesson end. Sync dirty badge = pending lesson attempts only, not per-step.
