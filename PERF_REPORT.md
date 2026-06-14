# Frontend performance review — Open Lingo web app

Branch: `ui/perf-review`. Scope: data-fetching layer (TanStack Query hygiene,
fetch anti-patterns, dedup, TTLs), allocation/leak check, and edge-cacheability.

## TL;DR

The data layer is in good shape. Repo convention "every `useQuery` gets an
explicit `staleTime`" is followed across **all 49 `useQuery` call sites** — no
missing or `staleTime: 0` cases. Context values are memoized, intervals/listeners
clean up, and big derived lists (`.sort/.map/.filter`) are inside `useMemo`.
Heap is **flat across a 6-pass / 48-navigation loop — no leak.**

The real wins are narrow:
1. **`CommunityDecksLayout` fired two API GETs on every community-page mount
   whose results were thrown away** (the count was never rendered). Deleted.
   *(applied)*
2. **The `/users/me` query was re-implemented inline in 7 places**; two of them
   used `staleTime: 60_000` against the others' `5 * 60_000`, so they caused
   avoidable refetch churn on the shared cache key. Routed `AddFriendButton` and
   `MessagesSection` through the shared `useMe()` hook. *(applied)*
3. A set of **effect-`fetch`-into-`useState` pages** bypass TanStack Query
   entirely (community deck/story editors + list pages). Larger per-file
   refactor — left as **recommended**.

---

## (a) Full `useQuery` audit table

`staleTime` legend: `5m = 5*60_000`, `1m = 60_000`, `30s = 30_000`,
`1h = 60*60*1000`. "Dedup" = does the key collide intentionally with another
hook to share cache.

| File | queryKey | staleTime | refetch flags | Dedup / notes | Verdict |
|---|---|---|---|---|---|
| `shared/hooks/useMe.ts` | `["users", sub, "me"]` | 5m | — | Canonical `me` hook | ✅ good |
| `shared/components/AuthMenu.tsx` | `["users", sub, "me"]` | 5m | — | inline `me` (dedup w/ useMe) | ⚠️ could use `useMe()` |
| `features/home/HomePage.tsx` | `["users", sub, "me"]` | 5m | — | inline `me` | ⚠️ could use `useMe()` |
| `features/learn/hooks/useLearnProfile.ts` | `["users", sub, "me"]` | 5m | — | inline `me` | ⚠️ could use `useMe()` |
| `features/settings/SettingsSectionPanel.tsx` | `["users", sub, "me"]` | 5m | — | inline `me` | ⚠️ could use `useMe()` |
| `features/social/components/AddFriendButton.tsx` | `["users", sub, "me"]` | ~~1m~~ | — | inline `me` @ **1m** (TTL mismatch) | ✅ **FIXED → useMe()** |
| `features/social/sections/MessagesSection.tsx` | `["users", sub, "me"]` | ~~1m~~ | — | inline `me` @ **1m** (TTL mismatch) | ✅ **FIXED → useMe()** |
| `shared/hooks/useProgressMe.ts` | `["progress","me",uid]` | 5m (gc 10m) | — | invalidated post-lesson | ✅ good |
| `shared/components/GitHubBadge.tsx` | `["github","repo-stars",…]` | 1h (gc 2h) | focus:off | public | ✅ good |
| `features/funding/useFundingTransparency.ts` | `["finance","transparency"]` | 1h | — | placeholderData fallback; public | ✅ good |
| `features/quests/useQuests.ts` | `QUESTS_QUERY_KEY` | 60s | interval 60s, focus:on | server-authoritative, intentional | ✅ good |
| `features/admin/events/useEvents.ts` (list) | `["ops","events","list",filters]` | 15s | interval 15s | live admin | ✅ good |
| `features/admin/events/useEvents.ts` (detail) | `["ops","events","detail",id]` | 30s | enabled:id | — | ✅ good |
| `features/admin/SystemHealthPanel.tsx` ×3 | `["health",…]` | interval-ms | interval | live health | ✅ good |
| `features/admin/AdminOperationsPage.tsx` ×11 | `["ops",…]` | 60s/slow consts | — | clean key namespacing | ✅ good |
| `features/admin/AdminHomePage.tsx` ×5 | `["admin",…]`,`["ops","jobs","summary"]` | 30–60s | — | jobs key dedups w/ Ops page | ✅ good |
| `features/admin/AdminAuditPage.tsx` | `["admin","audit",{cursor,kind}]` | 30s | placeholderData:prev | cursor pagination ✓ | ✅ good |
| `features/admin/AdminUsersListPage.tsx` | `["admin","users",…]` | 30s | placeholderData:prev | ✓ | ✅ good |
| `features/admin/lms/LearningTab.tsx` | `["admin","lms","snapshot",userId]` | 30s | — | — | ✅ good |
| `features/admin/PlatformXpRatesPanel.tsx` | `XP_QUERY_KEY` | 5m | — | const key | ✅ good |
| `features/admin/components/UserPicker.tsx` | `["admin","userPicker",debounced]` | 30s | enabled:len≥1, debounced | ✓ | ✅ good |
| `features/social/hooks/useSocial.ts` ×13 | `SOCIAL_QUERY_KEYS.*` | 30–60s | — | centralized key factory ✓ | ✅ good |
| `features/social/components/FindFriendModal.tsx` | `["users","discover",debounced]` | 30s | enabled:open&len≥1 | debounced ✓ | ✅ good |
| `features/shop/useShopState.ts` | `["users",uid,"settings","shop"]` | 5m | — | — | ✅ good |
| `features/shop/useEquippedCosmetic.ts` | `["users",uid,"acting",actingAs,"settings",key]` | 5m | — | — | ✅ good |
| `features/flashcards/useSubscriptions.ts` | `["users",uid,"subscriptions","deck"]` | 5m | — | **shares key** w/ useDeckSubscriptions ✓ | ✅ good |
| `features/flashcards/useDeckSubscriptions.ts` (subs) | `["users",uid,"subscriptions","deck"]` | 5m | — | dedup ✓ | ✅ good |
| `features/flashcards/useDeckSubscriptions.ts` (batch) | `["decks","batch",deckIds]` | 5m | enabled:len>0 | `deckIds` memoized; key contents stable per subs | ✅ good |
| `features/profile/usePublicProfile.ts` ×2 | `["users","profile",u]`,`["social","profile",u]` | 5m | enabled:!!u | — | ✅ good |
| `features/community/forum/*` (Forum/Thread/NewThread) | `["community",…]` | 1m / 5m | enabled:id | categories/tags shared 5m ✓ | ✅ good |
| `features/community/ContentBrowserPage.tsx` | `["community","addons",{lang}]` | 1m | — | — | ✅ good |
| `features/community/CommunityRightRail.tsx` | `["community","tags"]` | 5m | — | dedup w/ Forum ✓ | ✅ good |
| `features/community/ContributorsPage.tsx` | `["community","threads","recent-for-contributors"]` | 5m | — | dedup w/ ForumPage's recent ✓ | ✅ good |
| `features/community/hooks/useDeckVote.ts` | `KEY(deckId)` | 30s | enabled:id, optimistic | cancelQueries on mutate ✓ | ✅ good |
| `features/home/HomeActivityPanel.tsx` | `["community","threads","home-activity"]` | 1m | enabled:flag | — | ✅ good |
| `features/home/restructured/CommunityStrip.tsx` | `["community","threads","home-strip"]` | 1m | enabled:flag | — | ✅ good |
| `features/learn/LearnCoursesPage.tsx` | `["community","addons",{kind,lang}]` | 5m | enabled:lang | — | ✅ good |
| `features/settings/AccountPrivacySection.tsx` | `SOCIAL_QUERY_KEYS.blocks` | 1m | enabled:auth | dedup w/ useSocial blocks ✓ | ✅ good |

**No query is missing `staleTime`.** The only TTL defect found was the two
`me` re-implementations at `60_000` vs the canonical `5 * 60_000` — both fixed.

### Query-key stability check
All keys are either constants, centralized factories (`SOCIAL_QUERY_KEYS`,
`QUESTS_QUERY_KEY`, `XP_QUERY_KEY`), or primitives/debounced strings. Object
literals appear in keys (`{sort, categoryId}`, `{languageId}`, `{cursor, kind}`)
but TanStack hashes keys structurally, so these are stable as long as the
*values* are stable — and they are (derived from URL/state primitives, not
freshly-allocated objects with unstable identity). `["decks","batch",deckIds]`
uses a `useMemo`-stabilized array. **No unstable-key churn found.**

---

## (b) Live capture — per-route requests, duplicates, cancellations

Method: Playwright + CDP, authed via `.auth/user.json`, landing fresh on each
route (`/en/{home,learn,flashcards,practice,social,community,shop,quests}`).
No local backend, so app `/api/*` calls fail fast (ECONNREFUSED) — request
*patterns* are still valid signal.

**Real (non-Vite-module) API requests, consistent across every route landing:**

| Endpoint | Count per landing | Cause | Production reality |
|---|---|---|---|
| `GET /api/core/v1/finance/transparency` | 4× | `ApiClient` `maxRetries=2` (3 attempts) × StrictMode double-mount on cold-cache reload, retrying the ECONNREFUSED | **1× in prod** (endpoint succeeds → no retry; 1h staleTime → no refetch) |
| `GET /feature-flags.json` | 2× | React **StrictMode** double-invocation in dev | **1× in prod** (StrictMode is dev-only) |
| `GET /repos/open-lingo/lingo` (GitHub stars) | 1× | GitHubBadge, 1h staleTime | fine |

**Cancellations:** 1 aborted request per route navigation — these are TanStack/
`AbortController` correctly cancelling the in-flight `me`/profile fetch when the
component unmounts mid-flight. Expected behavior, not waste; on return the 5-min
`staleTime` serves cache so there's no re-RTT unless the cache expired.

**Conclusion:** both "duplicates" are dev-only artifacts (StrictMode +
no-backend retry loop), **not production bugs**. With a real backend the
per-route API request set is minimal and well-deduplicated. The `_maxRetries`
network-error retry is worth a glance (see recommended #4) since it triples
request volume on a genuinely-down endpoint, but it does not fire on success.

---

## (c) Heap across navigation

6 passes × 8 routes = 48 full navigations, `HeapProfiler.collectGarbage` +
`Runtime.getHeapUsage` sampled after each pass:

```
14.25 -> 14.22 -> 14.23 -> 14.23 -> 14.23  (MB)
growth pass1 -> pass5: -0.03 MB
```

**Flat. No leak.** Intervals (`useSRSyncSession`, `useLessonSyncStatus`,
`useAdFreeStatus`, etc.) and `addEventListener` sites all return cleanup
functions (verified). Context providers memoize their `value`. No growing
in-memory cache observed; TanStack `gcTime` defaults bound the query cache.

---

## (d) Ranked fixes

### Applied (this branch)
1. **`CommunityDecksLayout` — delete 2 dead fetches.** `listMyDecks()` +
   `getSubscriptions()` fired on every community-page mount; their results fed
   only `myDecksCount`/`subscribedCount`, which `tabLabel()` ignored entirely
   (counts deliberately not rendered). Removed the effects, state, the unused
   `browseCount`/`searchSlot`-adjacent count props, and the `browseCount` prop
   pass in `ContentBrowserPage`. **Net: −2 GETs per community nav, zero behavior
   change.** Effort: S.
2. **Unify `me` TTL.** `AddFriendButton.useMyUsername` and
   `MessagesSection.meQuery` re-implemented `["users", sub, "me"]` at
   `staleTime: 60_000`, mismatching the 5-min canonical TTL on the shared key →
   a 60s-stale consumer re-mounting would refetch data the 5-min consumers
   considered fresh. Both now call the shared `useMe()` hook. Effort: S.

### Recommended (not applied — larger/riskier)
3. **Convert effect-`fetch`-into-`useState` pages to TanStack Query.** These
   bypass the cache, can't dedup, refetch on every mount, and re-fetch the same
   `getSubscriptions`/`listMyDecks` data that `useSubscriptions`/
   `useDeckSubscriptions` already cache:
   - `community/StoriesPage.tsx`, `community/MyDecksPage.tsx`,
     `community/DeckCreatePage.tsx`, `community/SubscribedPage.tsx`,
     `community/contribute/StoryEditor.tsx`,
     `community/contribute/DeckEditor.tsx`, `community/contribute/MyContentTab.tsx`.
   Each needs its own key design + invalidation wiring. Effort: M per file
   (~7 files). Highest data-layer payoff after the applied fixes.
4. **Cap `ApiClient` network-error retries for idempotent public GETs / make
   retry opt-in.** `maxRetries=2` triples request volume against a hard-down
   endpoint with exponential backoff; for the funding meter / tags (decorative,
   public) a single attempt is plenty. Effort: S, but touches the shared client —
   verify no admin/live-poll surface depends on the retry.
5. **Route the remaining 4 inline `me` queries through `useMe()`** (AuthMenu,
   HomePage, useLearnProfile, SettingsSectionPanel). They already dedup correctly
   (same key + 5m), so this is cosmetic/maintainability, not a perf win. Effort: S.
6. **Bundle code-splitting.** Build warns on three >500 kB chunks:
   `mockLessons` (1.87 MB), `MarkdownEditor` (1.68 MB), `index` (1.70 MB).
   `MarkdownEditor` should be lazy (already a separate chunk — confirm it's only
   pulled on contribute routes); `mockLessons` is lesson content and dominates
   first-load for `/learn`. `manualChunks` + route-level `lazyRetry` audit.
   Effort: M. (Out of strict scope but the biggest perceived-latency lever for a
   single-region backend — TTI is gated by JS parse, not just RTT.)

---

## (e) What would benefit most from edge caching (CloudFront)

These GETs are **public / identical for all users** → cache at the edge with a
short-to-medium TTL and cut the single-region Lambda RTT to ~0 for cache hits:

| Endpoint | Why cacheable | Suggested edge TTL |
|---|---|---|
| `GET /feature-flags.json` (static asset) | Already a flat file; serve via CDN with `s-maxage` | 1–5 min |
| `GET /api/core/v1/finance/transparency` | `skipAuth`, same for everyone, FE already caches 1h | 5–15 min |
| `GET /api/core/v1/community/categories` | Public, rarely changes | 5–15 min |
| `GET /api/core/v1/community/tags` | `skipAuth` (TagsApi public), rarely changes | 5–15 min |
| `GET /api/core/v1/community/threads` (list, by sort/category) | Public read; vary on querystring | 30–60 s |
| `GET /api/core/v1/community/threads/{id}` + `/posts` | Public read | 30–60 s |
| `GET /api/core/v1/community/addons` (deck/course catalog) | Public browse catalog | 1–5 min |
| `GET /api/core/v1/community/addons/{id}` + `/deck` | Public deck content; changes only on publish | 5–15 min |
| TTS audio (`/tts/*`) + vocab art assets | Immutable content-addressed files | `immutable`, long TTL |
| GitHub stars (`/repos/open-lingo/lingo`) | Already external + cached client-side | n/a (3rd-party) |

**NOT cacheable at the edge (per-user / auth-bearing — keep origin-only):**
`/users/me`, `/users/me/settings`, `/progress/me`, `/srs/*`, `/quests`,
`/social/*` (friends, requests, threads, leaderboards keyed to viewer),
`/users/{me}/subscriptions`, `/decks/batch` (user's subscribed set), shop
settings, all `/admin/*` and `/ops/*`. These carry the Auth0 bearer / vary by
user and must hit origin (or use a private/`no-store` cache policy).

> Note: community thread/post/addon lists *can* be edge-cached for signed-out
> and signed-in users alike **only if** vote/subscription state is fetched
> separately per-user (it already is — `useDeckVote` is its own keyed query),
> so the list payload itself stays user-agnostic. Confirm the BE list responses
> don't embed viewer-specific `myVote` fields before enabling edge caching on
> them; if they do, split that out first.
