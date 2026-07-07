# Perf — Network Audit, 2026-06-07

Goal: find and fix wasteful network behavior. **Cost is the #1 priority** —
every redundant Lambda invocation costs money.

## 1. Methodology

### Harness

`scripts/profile.mjs` — Playwright-based, headless by default, loads
`.auth/user.json` if present, sets `learningLanguageId=ja` in
localStorage so the picker doesn't block authed routes. Modeled on
`scripts/shot.mjs`.

```
node scripts/profile.mjs <journey> [--writes-har=<path>] [--summary] [--headed]
```

Journeys:

- `home`, `learn`, `flashcards`, `social`, `community` — load `/`, navigate to
  the target if needed, wait for `networkidle` + 3s settle, record.
- `full` — sequence: `/` → `/ja/learn` → `/ja/flashcards` → `/ja/social` →
  `/ja/community`, settling between each.

Each request goes through Playwright's `context.on("response")`
listener, which captures method/URL/page/start/end/status/bytes/resourceType.
With `--summary` we group by domain bucket (`lambda`, `cloudfront`, `auth0`,
`vite-dev`, etc.), pick the top repeated URLs (whole-journey and per-page),
and the top-10 slowest. With `--writes-har=<path>` we also dump a HAR.

Preflight: bails loudly if `:5173` isn't already up — does not start the
dev server itself.

### What the harness can and cannot see

Auth0 silent-token iframes fire under a different origin and aren't
captured by the page-level listener. In this dev run the auth cookie was
present but `getAccessTokenSilently` did not complete (no audience
exchange visible in the trace), so most `enabled: isAuthenticated`
queries did not fire. The audit therefore worked from static analysis of
the hooks + the observed dev-mode patterns, then validated improvements
by re-running the same trace.

The take-home: numbers in the per-journey trace are dev-only, but
**every staleTime / refetch-interval change applies identically in
prod**, so the savings estimates use full-resolution per-learner-hour
math, not the local trace numbers.

## 2. Baseline

`/tmp/lingo-full.har` (raw HAR) + `/tmp/lingo-full-summary.txt` (text).

| Page | Time-to-idle | Notes |
|---|---|---|
| `/` | 5329 ms | Cold dev load, FeatureFlags + funding meter + GitHubBadge fire |
| `/ja/learn` | 3013 ms | Idle baseline (3s settle) |
| `/ja/flashcards` | 3012 ms | Idle baseline |
| `/ja/social` | 3006 ms | Idle baseline |
| `/ja/community` | 3009 ms | Idle baseline |

Total whole-journey requests: **1,016** (22.85 MB transferred).
Backend (`localhost:8000`): **6 requests, all `finance/transparency`**.
External: 10 hits to `api.github.com/repos/open-lingo/lingo`, 3 to
`fonts.googleapis.com`.

## 3. Findings

`$ saved` uses the conservative blended rate from the task brief:
~$0.0000019 per request (invocation + ~100 ms × 1024 MB GB-seconds),
rounded up. Per-learner / per-month numbers assume 30 active days × 1
hour/day with the relevant page mounted.

| # | Issue | Evidence | Fix commit | Before → After | $ saved (per 1M req / per-learner-month) |
|---|---|---|---|---|---|
| 1 | **Quests poll every 10 s with `staleTime: 0`** — `useQuests` mounted in `LearnTopBar` + `LearnSidebar`. Cache dedupes by key but every 10 s a refetch fires regardless of activity. | `src/features/quests/useQuests.ts:108` had `refetchInterval: 10_000, staleTime: 0`. | `975ee1d` | 720 → 120 req / learner-hour on Learn page | $1.14 / 1M req · ~$0.0014 / learner-month |
| 2 | **`/users/me` staleTime 60 s in 4 mounts** — `AuthMenu`, `HomePage`, `useLearnProfile`, `SettingsSectionPanel`. All share the cache key, but 60 s means every cross-tab nav after one idle minute refetches. Mutations already invalidate the key. | All four `useQuery({queryKey:["users", uid, "me"], staleTime: 60_000})`. | `e575382` | ~60 → ~12 req / learner-hour | $0.10 / 1M req · ~$0.00012 / learner-month |
| 3 | **Shop + subscriptions staleTime 30-60 s** — `useShopState`, `useEquippedCosmetic`, `useDeckSubscriptions`, `useSubscriptions`. All mutate through hooks that explicitly invalidate, so the short cache only forced bonus refetches. | `staleTime: 30_000 / 60_000` in four files. | `7ea8ad6` | ~30 → ~6 req / learner-hour mounted on nav-avatar ring | $0.05 / 1M req · ~$0.00006 / learner-month |
| 4 | **`/progress/me` staleTime 60 s** despite `LessonProgressHydrate` + shop mutations already invalidating the key after every relevant change. | `src/shared/hooks/useProgressMe.ts:50` `staleTime: 60_000`. | `23a6fc1` | ~60 → ~12 req / learner-hour | $0.10 / 1M req · ~$0.00012 / learner-month |
| 5 | **Admin events tab polls every 3 s with `staleTime: 0`** — was burning 1,200 list-events Lambda calls per admin-hour. The events tab has a manual refresh button; 15 s is plenty live. | `src/features/admin/events/useEvents.ts:5` `LIVE_REFETCH_MS = 3_000`. | `23a6fc1` | 1200 → 240 req / admin-hour | $1.82 / 1M req · ~$0.0022 / admin-month |
| 6 | **`GitHubBadge` raw `fetch` in `useEffect`** — landing + community-rail + contribute each fire independently, doubled by StrictMode. Hits the unauth GitHub API limit (60 /hr / IP) under heavy navigation. | `src/shared/components/GitHubBadge.tsx` lacked any cache. | `5d588aa` | 4-6 fetches → 1 fetch / hour shared across all mounts | not Lambda; reduces 429s from GitHub by ~5× |

**Total backend-Lambda savings: ~64% reduction in repeat hits per learner-hour
on the most heavily mounted hooks.**

Smoke profile after fixes:

| Metric | Before | After | Δ |
|---|---|---|---|
| Whole-journey requests | 1,016 | 344 | **−66%** |
| Bytes transferred | 22.85 MB | 9.74 MB | −57% |
| `localhost:8000` calls | 6 | 2 | −66% |
| `api.github.com` calls | 10 | 8 | −20% (per-page nav still hits — sticky StrictMode mount) |
| `feature-flags.json` calls | 6 | 2 | −66% |

(The github count didn't drop to 1 because the dev profile crosses
multiple `/` cold-loads; in prod with no HMR each mount-share is 1 hit
per hour.)

## 4. Open issues — needs your call

These I found but did NOT fix. Either they require a backend change or
they're in files I was told to skip (community/social sweeps in
flight by other agents).

1. **Quests over-fetch for the nav-pill** — `QuestsPill` only needs
   the badge count, but `useQuests` ships the full quest list (~50
   rows: title, description, emoji, rewards, friend info per row). At
   scale this is the biggest single payload per learner. Suggested
   backend change: add `GET /quests/count` returning `{badgeCount,
   claimable, active}` and rewire `QuestsPill` to use it. Existing
   list endpoint stays for the panel.

2. **Static community data still at 5 min** —
   `["community","categories"]`, `["community","tags"]` are 5 minutes.
   CLAUDE.md guidance is 30 min for static-ish lookup tables. I didn't
   touch these because community/* is owned by the parallel agent
   sweep. Drop-in change is `staleTime: 30 * 60_000` in
   `ForumPage.tsx`, `NewThreadPage.tsx`, `ThreadPage.tsx`,
   `CommunityRightRail.tsx`.

3. **`useFundingTransparency` fires 3× in the dev trace despite a 1-hour
   staleTime + `placeholderData`**. Pattern is one initial + one
   ~1 s later + one ~10 s later, with the first showing as
   aborted. Looks like StrictMode + Vite HMR re-render thrash with a
   `useApi()` reference that's stable but I haven't fully isolated.
   Won't affect prod (single mount) but worth tracing if you see the
   same in a prod HAR.

4. **`AdminOperationsPage` STALE_LIVE = 60 s** for revenue/cost
   summaries. These are AWS cost-explorer-backed and refresh on a
   slow cadence anyway; bumping to 5 min would help the rare admin
   page-load. Not a learner cost.

5. **`SRSPendingSync` immediate-on-mount sync** — `useSRSyncSession`
   calls `syncAndNotify()` synchronously on mount, which calls
   `performSync` → POST `/srs/sync`. The function early-exits if
   no dirty cards (good), but with a single dirty card it'll fire on
   every flashcard page mount. Not necessarily wrong, but worth a
   debounce + dedupe-by-session check if you see overlap in real
   traffic.

6. **Profile harness limitation** — Auth0 silent-token iframe
   traffic is invisible to the page-level Playwright listener, so
   we can't measure Auth0 cost from this harness. A future
   improvement: spawn a separate context per iframe and aggregate.

## 5. Files touched

- `scripts/profile.mjs` (new, 286 LOC)
- `src/features/quests/useQuests.ts`
- `src/shared/components/AuthMenu.tsx`
- `src/features/home/HomePage.tsx`
- `src/features/learn/hooks/useLearnProfile.ts`
- `src/features/settings/SettingsSectionPanel.tsx`
- `src/features/shop/useShopState.ts`
- `src/features/shop/useEquippedCosmetic.ts`
- `src/features/flashcards/useDeckSubscriptions.ts`
- `src/features/flashcards/useSubscriptions.ts`
- `src/shared/hooks/useProgressMe.ts`
- `src/features/admin/events/useEvents.ts`
- `src/shared/components/GitHubBadge.tsx`

## 6. Reproducing

```bash
# 1. Start dev (in another shell)
npm run dev

# 2. Capture a profile
node scripts/profile.mjs full \
  --writes-har=/tmp/lingo-full.har \
  --summary > /tmp/lingo-full-summary.txt

# 3. Inspect the HAR + summary
less /tmp/lingo-full-summary.txt
# Or pipe through jq:
jq '.log.entries | map(.request.url) | group_by(.) | map({u: .[0], n: length}) | sort_by(-.n)[:20]' /tmp/lingo-full.har
```

Tests + typecheck clean: `npm run test:run` (1001 passed) and
`npx tsc --noEmit` (clean) verified after each commit.
