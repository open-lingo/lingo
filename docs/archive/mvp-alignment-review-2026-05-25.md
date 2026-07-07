# MVP alignment review — 2026-05-25

**Purpose:** Honest stocktake of where the codebase stands vs. the launch plans in [PROJECT_STATE.md](./PROJECT_STATE.md), [MVP_PAGES_PLAN.md](./MVP_PAGES_PLAN.md), [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md), and [MVP_PRODUCTION_READINESS.md](./MVP_PRODUCTION_READINESS.md).

**Scope decision baked in:** MVP is **ad-free for the initial trial — no revenue.** Anything ad-, AdSense-, finance-meter-, or ad-free-SKU-shaped is **Bucket D (Deferred)**, off the launch critical path.

---

## 1. Executive summary

- **Core learning loop is the strongest part of the product and is shippable for Japanese.** M1-M7 sub-lesson restructure + SRS review-lesson split + per-modality flashcards are landed; 876/876 frontend unit tests pass. Internal 8-persona audit closes at **8.6/10 — "production-ready for beta learners"** (`handoff-2026-05-25.md` §6).
- **MVP is not ship-ready yet — blockers are non-curriculum.** Top gaps: (a) Korean content is two files vs. Japanese's ~30, (b) backend `tests/test_social.py` has **5 failing tests** that map to surfaces the social UI already calls, (c) every Week-1 infra item in `PRODUCTION_ROADMAP.md` (staging, prod Auth0, rate-limiting, Sentry, /health, backups) is still open, (d) home + social render real data alongside hardcoded mocks (`MOCK_THREADS`, `MOCK_FRIENDS_LB`, `MOCK_WEEKLY_LB`, `MOCK_KANA_MASTERY`).
- **The ad-free scope cut is the right call and frees ~1 week of work.** Hide the ad-free shop section + ad slots, keep the code, ship without revenue UI.
- **Significant session-recent work is post-MVP scope creep.** Quests (no backend), level/XP curve, social reactions, league spotlight, friend leaderboard, invites, threads, messenger, 51 new UI primitives, Spanish locale — none required for MVP, several visible to testers as more-finished-than-real.
- **Recommended path:** one focused week on infra + content scope + visible-mock cleanup, then a beta cutover for Japanese learners. See §6.

---

## 2. Plan-vs-reality matrix

| Area | Reality | Status | Gap |
|---|---|---|---|
| **Landing** | `features/landing/LandingPage.tsx` (288 LOC) live | shipped | Lighthouse + final copy pass open |
| **Auth + routing** | Auth0 + `RequireAuth` wired; `VITE_DEV_AUTH_BYPASS=true` in dev | shipped | Prod tenant not provisioned |
| **Home (signed-in)** | `RestructuredHome` grid renders for all signed-in users | partial | Reads `MOCK_KANA_MASTERY`, `MOCK_CARDS_HOT_PREVIEW`, `MOCK_RECENT_PRACTICE`, `MOCK_DAILY_QUESTS`, `MOCK_THREADS` (`features/home/restructured/mockHomeData.ts`, `CommunityStrip.tsx:9`); plan §2-C "most-used practice" tally absent |
| **Home (guest)** | `HomePage.tsx:128-150` static welcome + CTAs | shipped | |
| **Learn page** | `LearnPage.tsx` (432 LOC) + YourPathCard, map scroll, quests sidebar, dev panel | shipped | Most sidequests still placeholder |
| **Lesson flow** | `LessonPage.tsx` (743 LOC), per-step `recordStepEvent`, batch `POST /progress/lessons/batch`, gated SRS writes, per-modality flashcard grading | shipped | God-file still a refactor target |
| **Practice hub** | `PracticePage` + `PracticeLayout` | shipped | |
| **Flashcards** | `FlashcardsPage` + per-modality `FlashcardTester` + card/deck managers | shipped | |
| **Stories** | `StoriesPage`+`StoryDetailPage` load from API, content placeholder | partial | `practice.stories: false` — fine for MVP |
| **Vocab page** | `VocabPage.tsx` is an **8-line stub** | missing | Still routed at `App.tsx:293`; remove from nav |
| **Grammar** | `GrammarRedirect` → `practice/grammar` (`PracticeGrammarPage`) | partial | OK for MVP |
| **Particle / alphabet** | Real pages + `AlphabetLessonPage` | shipped | |
| **Kanji / components** | **10-line stub pages**, routed for all langs | missing | Hide from nav or finish |
| **Videos practice** | `VideosPracticePage` with mock catalog; flag off | gated | |
| **Community → Explore** | `ContentBrowserPage.tsx` (936 LOC); browse + subscribe + deck preview live | partial | Plan §4 items (all-langs toggle, `approval_status`, `searchTokens`, vote schema) not coded |
| **Community → Deck editor / approval** | `DeckEditor` exists; no `approval_status` field on backend; flag off | gated | Post-MVP |
| **Admin → moderation queue** | `require_admin` now real (env allow-list OR DB role, `app/auth/dependencies.py:285`); no pending-review tab | partial | Admin gate is **fixed since architecture-review** |
| **Profile page** | `PublicProfilePage` at global `/u/:username` with friendship-state CTAs | shipped | Exceeds plan §7 |
| **Settings** | Backend `GET/PATCH /users/me/settings` wired through `SettingsContext` | shipped | |
| **Auth onboarding** | `LanguagePickerModal` + `learning.onboardingCompleted` persisted to backend + local | shipped | |
| **Legal pages** | Privacy/Terms/About + cookie consent + delete shipped | shipped | Pre-launch lawyer skim recommended |
| **Leaderboard / forum / contribute** | Code present, flags off | gated | |

---

## 3. Things shipped that aren't in the plan

Recent work that's not MVP-required:

| Feature | State | MVP verdict |
|---|---|---|
| **Quests system** (`features/quests/`, daily/weekly/random/friend, `QuestsPanel`, `useQuests` localStorage) | Frontend complete, **no backend** — catalog mocked, no `/quests/*` endpoints | **Hide or label "Beta — local only"** — clearing cache wipes streaks |
| **Level / XP curve** (`useUserStats.ts` derives level locally) | Local fallback over backend XP column | **Ship** — low risk |
| **Ad-free time module** (`features/adFree/`, `AdFreeShopSection`, lingot purchase, grind detector) | Built + tests pass | **Hide** — nothing to skip without ads |
| **Ad provider DI + DailyWelcomeAd** (`features/ads/providers/`, `FakeAdProvider`, `AdSenseAdProvider`, banner) | Wired + tests | **Hide** (no ads) — keep code, render nothing |
| **Social: reactions / league / friend LB / invites / threads / messenger** | UI + `SocialApi` E2E through `ApiProvider`, mutation tests pass | **Mixed** — friends + reactions backend-real; leaderboards + threads + activity still read `MOCK_FRIENDS_LB`/`MOCK_WEEKLY_LB`/`MOCK_THREADS`. **Hide leaderboards** or label preview. Backend `tests/test_social.py` 5 failing — fix first. |
| **51 new shared UI primitives** in `shared/components/ui/` | Modal/EmptyState/CenteredLoader/Dialog/FilterBar/Pagination/Popover/etc. | **Ship** — fills `ARCHITECTURE_REVIEW_2026-06-14.md` §3 gap |
| **Spanish locale** (`shared/i18n/locales/es.json`) loaded | `AVAILABLE_LEARNING_LANGUAGE_IDS = ["ko","ja"]` excludes ES (`languageConfig.ts:1019`) | **Half-done** — decide: launch UI-only or hide entirely |
| **Practice mocks unified via `usePracticeData`** | — | **Ship** |
| **Learn revamp** (YourPathCard, map scroll, quests sidebar) | — | **Ship** |
| **Travel Sprint sidequest** (romaji-scaffolded pathway) | — | **Ship** — addresses Priya-persona audit |
| **TTS pipeline + 56 new audio + 421-entry manifest** | — | **Ship** |

---

## 4. MVP gaps — prioritized punch list

### Bucket A — Must ship for MVP

1. **Korean content scope decision** — JA has ~30 mock-ja-m* files (M1-M7 sub-lesson restructure + story + sidequests); KO has 2 (`mock-ko-m1-intro.ts`, `mock-ko-m1-vowels.ts`). Either launch JA-only or budget 2-3 weeks of KO authoring. Marketing copy implying parity must match the decision.
2. **Fix 5 failing backend social tests** — `lingo-core/tests/test_social.py`: `test_send_and_accept_friend_request`, `test_public_profile_friendship_status`, `test_activity_feed_and_reaction_toggle`, `test_threads_listing_and_detail`, `test_quest_targets`. These cover live endpoints the UI calls.
3. **Hide or label mock-driven UI** — `MOCK_THREADS` (home `CommunityStrip`, `HomeActivityPanel`), `MOCK_KANA_MASTERY`/`MOCK_CARDS_HOT_PREVIEW`/`MOCK_RECENT_PRACTICE` (home), `MOCK_FRIENDS_LB`/`MOCK_WEEKLY_LB`/`MOCK_MONTHLY_LB` (entire `LeaderboardsSection.tsx`), `MOCK_CONTRIBUTORS` (5 fake people). Empty-state or wire to real backend. Per `MVP_PRODUCTION_READINESS.md` §"Product truth": no mock data as live.
4. **Staging environment** — single biggest unchecked roadmap item (Week 1 #2). Needed to rehearse prod cutover, prod Auth0, and a deploy runbook.
5. **Prod Auth0 + `DEBUG=false` guard** — `app/auth/dependencies.py` bypasses JWT entirely when `DEBUG=true`. Add a lifespan assertion in `app/main.py` that refuses to start with `DEBUG=true` when `AWS_LAMBDA_FUNCTION_NAME` is set.
6. **Rate limiting** — no `slowapi` anywhere in `lingo-core`. `POST /srs/sync`, `POST /decks`, `POST /users` all unprotected.
7. **Sentry (or equivalent) on both sides** — roadmap #7. Launching blind to first-week errors is a poor UX.

### Bucket B — Should ship for MVP

1. **Remove stub pages from nav** — `Vocab`, `Kanji`, `Components`.
2. **`/health` endpoint + uptime check** (roadmap #8) — cheap and high-value.
3. **Backups + restore drill** (roadmap #12).
4. **Wire friend search E2E and smoke-test it** against the real backend.
5. **CI on PRs** — `npm run test:run` + `pytest` + `ruff` + `npm run build`. ~2 hours of GitHub Actions for permanent regression protection given 876 + 41 tests already exist.
6. **Lighthouse pass** on landing + home.
7. **`THIRD_PARTY_NOTICES` + LICENSE at repo root.**

### Bucket C — Nice-to-have, post-MVP

Achievements page; public `/:lang/u/:username`; story comprehension beyond M8; real usage telemetry; ja.json UI strings; 401 token refresh; plan §4 search/voting schema; streak milestone toasts; backend SRS schema SM-2 → FSRS-6 migration (sync requests would 422 against current backend per `lingo/CLAUDE.md` "Backend mismatch"); `vocabGraduation` receiver (SRS phase 5).

### Bucket D — Deferred (ad-free trial)

AdSense unit IDs + live fills + approval; `FundingMeter` live %; **ad-free time SKUs** in shop (hide section); ad density modulation; grind-detector → ad-free credit; Stripe / premium.

---

## 5. Known broken / partially-wired things

- **Backend social tests fail (5 / 41).** Friend request, activity feed reactions, threads, quest-targets endpoints don't return what the frontend expects. Social page partially masks failure via mocks.
- **`CommunityStrip.tsx:9` + `HomeActivityPanel.tsx:9` import `MOCK_THREADS`** — home rail shows mock forum threads while the discuss flag is off.
- **`LeaderboardsSection.tsx`** uses `MOCK_WEEKLY_LB`/`MOCK_MONTHLY_LB`/`MOCK_FRIENDS_LB` for every leaderboard view. The league-spotlight "See full leaderboard" CTA links to the anchor — testers see seeded fake names.
- **`ContributorsPage.tsx:20`** ships a `MOCK_CONTRIBUTORS` of 5 people.
- **Quests are localStorage-only** (`features/quests/useQuests.ts:124`, key `lingo_quests_v1`). Clearing cache wipes streaks.
- **Dev-preview routes mounted unconditionally**: `/asset-test`, `/picker-test`, `/home-preview`, `/social-preview`, `/lesson-preview` — gate behind `import.meta.env.DEV`.
- **Stub pages still routed**: `Vocab` (8 LOC), `Kanji` (10), `Components` (10) appear in nav for Japanese.
- **Spanish learning language** — locale file loads, language config exists, but picker excludes it (`languageConfig.ts:1019`). Half-shipped.
- **Shop cosmetics** — `POST /shop/purchase` works (`app/progress/router.py:431`); 4 sample items (`shop_catalog.py`). Owned cosmetics aren't rendered anywhere on profile — buy "Profile frame: gold" and see no effect.
- **`M3_8` mastery test** still in `LESSONS` map — the only surviving one.
- **`ContentBrowserPage.tsx:530`** has a `// TODO: route does not exist; ensure flag stays off`. Acceptable while flag is off.

---

## 6. Backend gaps blocking MVP

- **`MockCommunityRepository` wired for ALL backends** (`app/db/provider.py:122`). SQLite + Dynamo community repos `raise NotImplementedError`. Forum data evaporates on Lambda cold start. OK while discuss/contribute flags are off — verify no MVP code path hits the community repo.
- **Stories on Dynamo missing** — `_story_repo = None` (`provider.py:104`). OK with `practice.stories: false`.
- **Admin role enforcement — fixed.** `app/auth/dependencies.py:285 require_admin` checks `settings.ADMIN_USER_IDS` OR `has_admin_access(role)`. The architecture-review "all admin routes open" line is stale; smoke-test before launch.
- **Test coverage: 41 backend tests, 5 failing on social.** Up from "1 smoke test" baseline noted in the architecture review.
- **No `/quests/*` backend** — frontend doc-comments the future contract but nothing implemented. Pair with the quest-UI decision.
- **No rate limiting, no `/health`, no Sentry/structured logs**.

---

## 7. What to do this week (focused 1-week sprint)

Solo-dev plan. Days pessimistic.

| # | Day | Item | Why | Parallel? |
|---|---|---|---|---|
| 1 | Mon ½ | **Scope decision: KO content** — JA-only or 2-week KO push. Update landing copy + language picker to match. | Single biggest content risk | No |
| 2 | Mon ½ | **Strip stub pages from nav** (Vocab/Kanji/Components) + flag-gate dev preview routes behind `import.meta.env.DEV` | 1-hour cleanup, removes tester confusion | No |
| 3 | Tue | **Fix 5 failing `tests/test_social.py`** | Bucket A #2 — live endpoints the social UI calls | Yes — single agent |
| 4 | Tue/Wed | **Mock-removal pass**: replace `MOCK_THREADS`/`MOCK_FRIENDS_LB`/`MOCK_WEEKLY_LB`/`MOCK_KANA_MASTERY`/`MOCK_RECENT_PRACTICE`/`MOCK_CONTRIBUTORS` with empty-state OR real endpoints | Bucket A #3 | Yes — 2-3 file-isolated agents |
| 5 | Wed | **Hide ads + ad-free UI** behind `ads.enabled` flag (default false). Remove `AdFreeShopSection` mount from `ShopPage`. Hide shop nav if cosmetics inventory isn't rendered. | Bucket D — implements the scope cut | No |
| 6 | Thu | **Staging env**: deploy `lingo-core` to non-prod Lambda + `lingo` to non-prod CloudFront/S3, staging Auth0 tenant, `/health` endpoint | Bucket A #4 + #5 — single biggest unblocker | No |
| 7 | Thu/Fri | **Sentry + rate-limit `slowapi`** on `POST /srs/sync`, `POST /decks`, `POST /users` | Bucket A #6 + #7 | Yes — backend + frontend agents |
| 8 | Fri | **Staging smoke test**: login → lesson → 10-card review → subscribe deck → delete account. Document any regressions. | Roadmap #17 | No |

**Reserve / overflow**: Lighthouse (B #6), `THIRD_PARTY_NOTICES` (B #7), backups drill (B #3), CI workflow (B #5).

**Punted past this week**: quest backend, `vocabGraduation` receiver, FSRS-6 backend schema, Anki import, M8+ comprehension, story content, achievements, KO curriculum expansion (unless that was day-1 decision).

---

## 8. Risks

1. **KO learners get a janky experience.** Two mock-ko files for the entire course. If marketing implies parity, first KO tester bounces.
2. **Mock data looks live.** Seeded leaderboard names + mock forum threads + fake contributors compound tester-trust issues Spencer's notes already flagged.
3. **Auth0 prod misconfig at cutover.** No staging means prod Auth0 first sees real callbacks at launch. Rehearse twice.
4. **`DEBUG=true` slipping into prod.** JWT bypass when `DEBUG=true` (`app/auth/dependencies.py`). Add a Lambda-environment assertion in `app/main.py` lifespan.
5. **No rate limiting on `POST /srs/sync`.** A bad client floods Dynamo writes; cost spikes fast.
6. **`MockCommunityRepository` in Lambda.** Cold-start data loss. Acceptable only while no MVP path hits the community repo — audit before any social-preview surface goes live.
7. **`LessonPage.tsx` (743 LOC) is the central god-file.** Not a launch blocker; will be one when 2 devs hit it concurrently post-launch.
8. **Quests with no backend.** First user to clear localStorage loses a streak shield and is loud about it.
9. **No `lingo/.env.example`.** `lingo-core` has one; frontend doesn't. Per-env `VITE_*` setup is guesswork for a junior deployer.
10. **No CI on PRs.** 876 + 41 tests exist, none gating merges. 2-hour fix for permanent regression protection.

---

## 9. Verification notes

- **Frontend tests:** `npm run test:run` → **876 passed across 88 files** (32s).
- **Backend tests:** `pytest` → **36 passed, 5 failed** (all `tests/test_social.py`).
- **E2E specs:** 15 Playwright specs in `tests/e2e/` (personas, alphabet-resume, FSRS-6 round-trip) — not run as part of this review.
- **Feature flags** (`public/feature-flags.json`): only `community.tabs.explore` and `community.explore.flashcardDecks` on. Conservative as planned.
- **Routes:** 80+ entries in `src/App.tsx`; dev/preview routes (`/asset-test`, `/picker-test`, `/home-preview`, `/social-preview`, `/lesson-preview`) mounted unconditionally.
- **Cross-references** in this doc all resolve to existing files under `lingo/docs/`.
