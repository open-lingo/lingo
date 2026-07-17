# Todos and what's left

By area. **Launch plan:** [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) · **Ideas / epics:** [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md) · **Checklists:** [MVP_PRODUCTION_READINESS.md](./MVP_PRODUCTION_READINESS.md) · **Code snapshot:** [PROJECT_STATE.md](./PROJECT_STATE.md).

## Done (recently)

### 2026-06-30 → 2026-07-05 katakana + trainer + grammar-deck wave

- [x] **Katakana rollout + romaji fade** — base rows ア→ワ as first pathway nodes M3–M12; per-script flat romaji cutoffs (hira@M10 at ship time; moved to M7 on 2026-07-16 — see `shared/settings/romajiAutoFlip.ts`, kata@M17) + "for today" hatch; D2 vocab-only content-step SRS writes. Spec: [katakana-rollout-romaji-fade-spec-2026-06-30.md](katakana-rollout-romaji-fade-spec-2026-06-30.md).
- [x] **Conjugation Trainer v1→v1.4.1** — `/practice/conjugation` ink-tile hub, 6 types / 9 of 22 gated points, combine mode + "Combined forms" switch, shared drill card (build-stack order cue, class-chip popovers, kanji@M10+, cheat-sheet half-credit peek), anti-elimination distractor engine. Spec: [conjugation-trainer-v1-spec-2026-07-02.md](conjugation-trainer-v1-spec-2026-07-02.md).
- [x] **Grammar review deck v1** — step-based session at `/practice/grammar/review` (never flip cards), pool-aware queue, machine-enforced comprehensibility gate. Spec: [grammar-deck-v1-spec-2026-07-02.md](grammar-deck-v1-spec-2026-07-02.md).
- [x] **Track B sync parity + SRS sync hardening** — grammar rides `/srs/sync` with `grammar:` keys; merge/placement/batch-mark bugs fixed; FSRS interval snapshot pin.
- [x] **Flashcards:** modality-inversion fix, one-step undo, 2-button history-aware grading defaults.
- [x] **Lesson-shell UI overhaul** — anchored CTA in all 21 step views, wrong-tile feedback fix, focused chrome; [ui-review-2026-07-02/](ui-review-2026-07-02/index.html).
- [x] **Overlay perf** — backdrop-blur removed from all 5 overlay primitives (measured modal scroll p95 33.4→16.7ms).

### 2026-06-13 engagement + kana-polish wave (Spencer + Claude)

- [x] **Quests backend (real this time):** `lingo-core/app/quests/` — list/bump/claim/refresh to the FE contract; state in the user-settings blob; progress advances synchronously in the lesson batch handler; claim grants lingots/XP + streak-shield→freeze inventory; 2 pytests. `useQuests` lingo-async fiction excised.
- [x] **XP reconciliation:** server authoritative; client mirror `features/progress/xpRules.ts`; triangular leveling deleted (500-linear both sides); test/recap +10 premium (server-matched on lesson-id suffix).
- [x] **Streak freezes consume** on gap days (were sold-but-inert); 7-day milestone chip.
- [x] **Tier-1 juice:** Web-Audio sfx engine (no assets), per-run combo w/ pitch-up, non-blocking celebration toasts (above CTA), LessonComplete choreography (count-up, confetti, streak/level row), 247 Noto emoji SVGs vendored + glyph fallback.
- [x] **Lesson layout stability:** fixed-height shell w/ internal scroll (window never scrolls); options/CTA move 0px on submit (measured); ghost-sized build trays; word-build slots (fresh) / growing pill (review) with pop animation; container-sized match grids; dvh-arithmetic banned for step content.
- [x] **Kana m1/m2:** intro-before-spell conformance test + decoy floor; review tails (3 cards) on intro lessons; weighted progress bar (trace passes + row-test items tick live); earned trace skip (+`?trace-gate=0`); confusable-kana distractor bias; row-test fanfare + slim header; index-true dupe-tile placement; per-item test juice.
- [x] **Quest panel + shop design pass** (frontend-design skill): static 3-card quest window, tinted Noto-SVG icon tiles, reward pills, hero claim button + chime, staggered entrance; shop featured-banner hero, section identity tints, price-forward buy buttons.
- [x] Dev dials: `?step=N`, `?trace-gate`, `?tray=slots|pill`.

### 2026-05-25 social / MVP pass

- [x] **Social end-to-end:** `SocialApi` wired through `ApiProvider`; granular TanStack Query hooks; mutations with optimistic updates; Add-Friend silent-422 bug fixed (`to_username`/`to_user_id` snake_case); public profile `/u/:username` with friend-state-aware actions; leaderboards live; threads stub backed by real backend; blocked-users panel in Settings; `UserPreviewPopover` + `AddFriendButton` reused across community surfaces.
- [x] **Social backend:** reactions endpoint + array on activity items; league spotlight; streak snapshot; invite offer + redeem; threads/messages read; quest-targets. Single `social` table split into `social_friends` + `social_friend_requests` + `social_blocks` + 6 extension tables.
- [x] **Quests (frontend):** types + panel + spotlight + pill. _Correction 2026-06-13: the backend half claimed here never landed (the agent died uncommitted — verified against git history); the real backend shipped 2026-06-13, see below._
- [x] **Backend `api_error` + `require_repo` refactor** rolled across users/admin/community/decks/stories routers.
- [x] **FSRS-6 SRS migration** (Spencer) — `srs_cards_v2` table with JSON state + computed `due_date` index; Dynamo `state_json` + `dueDate` GSI; legacy SM-2 table dropped on startup.
- [x] **CORS-via-500 fixed** on `/social/activity` — defensive filter on canonical `ActivityKind` + `expose_headers=*`.
- [x] **Spanish (`es`) UI locale** — full `es.json` parity with `en.json`; settings picker.
- [x] **51 new UI primitives** + responsive hooks (`useViewport`/`useMediaQuery`/`useFocusTrap`/`useEscapeKey`); Modal/Sheet/Dialog/Popover/Tooltip/Accordion/Field/Input/Select/Checkbox/Radio/Switch/Slider/Spinner/Skeleton/Badge/Toast/Avatar/SegmentedControl/Pagination/Stepper/FilterBar.
- [x] **Learn page revamp** — YourPathCard hero with active-module spotlight + per-module fluency strip; map content scrolls in its own region; "back to current lesson" floating button; sidebar capped to viewport with internal scroll. Standalone course-progress card removed.
- [x] **Ad provider DI** — `AdProvider` interface + `FakeAd`/`AdSense` providers + context; `DailyWelcomeAd` once-per-day banner. _UI deferred per ad-free MVP trial._
- [x] **Ad-free time module** — lingot SKUs (30m/2h/24h) + grind-detector + AdFreePill in header + shop section. _UI deferred per ad-free MVP trial._
- [x] **Mobile pass** — header right-cluster collapses below `md`; body-scroll-locked mobile menu; 44px tap-target sweep.
- [x] **Practice page mocks unified** behind `usePracticeData()` + `useGrammarPracticeData()` hooks with swap-path documented.
- [x] **Community deck preview regression fixed** — `ContentBrowserPage` now passes `onPreview` / `onStoryPreview` to `CommunityItemCard`.
- [x] **WeekSparkline / PracticeHubSection visible** — Tailwind alpha-modifier silently dropped on CSS-var hex colors; patched two visible offenders, full tokens.css → channel-triple sweep is a follow-up.
- [x] **In-app `/docs` route removed** — will live on a separate site.
- [x] **Design docs:** `leagues-design-2026-05-25.md`, `xp-curve-design-2026-05-25.md`, `cosmetics-design-2026-05-25.md` (lingo-core); `archive/mvp-alignment-review-2026-05-25.md` + `social-engagement-research-2026-05-25.md` (lingo).
- [x] **Expanded seed:** 20 users, 24 friendships, 5 requests, 1 block, 15 activity items, 21 reactions, 1 invite + 2 redemptions, 2 threads + 9 messages, 6 quests.

### Earlier 2026-05-25

- [x] Lesson progress sync: per-step `recordStepEvent`, draft `draft:{lessonId}`, `materializeOrphanDrafts`, `syncedAt` on mid-lesson sync, SyncManager lessons row (no false failure icon after successful batch)
- [x] Start over: moved to bottom of Learn page; account-wide copy; `DELETE /progress/me` + local wipe + `DELETE /srs/all`
- [x] Dev: `</>` Progress JSON overlay on Learn (`LearnProgressJsonOverlay`) — server + local snapshot
- [x] Backend: `DELETE /api/core/v1/progress/me`, `delete_all_for_user` on progress repo; SQLite `update_user` persists streak/XP columns

- [x] Theme system: token-based themes, presets (Light/Dark/Sepia/AMOLED), custom themes, theme editor panel, Your themes + Community themes (mock)
- [x] Design system: Card, Button, token classes; migrated Layout, Home, Community, ProgressSummary, nav components (ThemeToggle, LanguageSelector, AuthMenu, SyncManager, FundingMeter)

- [x] i18n: react-i18next, en.json + ko.json, Settings page (language, theme, UI locale)
- [x] Auth0: env-based config (VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID), normalized callback
- [x] Layout: Home, Practice, Flashcards, Stories, Leaderboard, Community in nav
- [x] Home: course cards, continue learning, progress summary, quick links
- [x] Flashcards: deck viewer, FlashcardTester with highlight mode + reasoning, ko + ja decks; course deck unlock by lesson completion (see `docs/dataformats/flashcards/README.md`)
- [x] Stories: hub page (sidebar, search, filter, course/community sections), detail page
- [x] Community: official courses, addons, forum, suggestions, contribute
- [x] Leaderboard: category cards, tabs (XP, language, flashcards, contributors)
- [x] Learn page: combined course + community; linear modules, current module card, progress %, Test out, Start over; community expandable cards; lesson unlock; semi/full expansion
- [x] Profile: edit page (avatar, username, name, status)
- [x] Language config: reduced to ko + ja only in learning selector; full config kept for future
- [x] Japanese stub: flashcards (5 cards), particles (8), stories (6)
- [x] Korean: flashcards (5 cards), particles (8), stories (6)
- [x] Content design docs: CONTENT-DESIGN.md (course vs community, versioning), `docs/dataformats/flashcards/README.md` (vocab manifest, lesson completion flow)
- [x] SRS engine: SM-2 (since migrated to FSRS-6, 2026-05-23/25), srsStorage, reviewQueue, FlashcardTester ratings, ProgressSummary cards due
- [x] **Adaptive placement test** — 2-stage, 75-item question bank, 100% threshold, SRS seeding, onboarding prompt
- [x] **Module test-out** — same placement engine, single-module mode via `/ja/learn/test-out/:moduleId`
- [x] **SRS write gate fix** — M8-M27 review lessons now correctly write FSRS state
- [x] **dark: → token migration** — ~465 hard-coded `dark:` Tailwind classes → CSS variable tokens (58 files)
- [x] **A11y pass** — step focus management, skip-to-content, PlacementPrompt dialog a11y, WCAG AA contrast
- [x] **Flashcard mock stats → real** — sparkline + retention from actual SRS store
- [x] **Module revisiting** — completed modules show pathway
- [x] Community deck preview: DeckPreviewModal sidebar, metadata, comments stub, Subscribe button
- [x] Community content wiring: ContentBrowserPage + FlashcardsPage use decks/subscriptions API
- [x] Modal system: stack-based ModalContext, ModalBase, ModalRoot (replaced SettingsModalContext)
- [x] Shared progress components: ProgressBar, ProgressBarWithCheckpoints, StatusNodeStrip, LessonStatusCircle in `shared/components/progress/`
- [x] Shared icons: LockIcon, ChevronIcon in `shared/components/icons/`
- [x] Feature domain restructure: each feature has `components/` folder; character components extracted to `features/practice/components/characters/`
- [x] src/ restructure: two-layer `shared/` + `features/` — absorbed core/, api/, auth/, data/, settings/, storage/, components/, contexts/, hooks/, locales/ into proper homes
- [x] Localization policy: finalized community (language-specific, no cutover) vs core (language-agnostic, manifest-based instruction variants); practice content committed to localization
- [x] Landing vs app: `/landing`, `RequireAuth`, minimal signed-out header
- [x] Legal: privacy, terms, about, cookie consent, account delete + API
- [x] Leaderboard nav gated by `feature-flags.json` (default off)
- [x] Study options: settings + deck manager + review scope / URL filters
- [x] `list_owned_manifests` (backend) for My Content / owned decks
- [x] AdSense framework + collapsible banner shell; funding meter → transparency API
- [x] API security headers; finance `GET /finance/transparency`

## UI pages — stub → real

Each has a task doc in `docs/tasks/`. See `PROJECT_STATE.md` for verified status.

- [ ] **Vocab page** → [vocab-page.md](tasks/vocab-page.md)
- [x] **Practice hub** → [practice-hub.md](tasks/practice-hub.md) — `/:lang/practice` index → `PracticePage`
- [x] **Particle practice** → [particle-practice.md](tasks/particle-practice.md)
- [ ] **Kanji practice** → [kanji-practice.md](tasks/kanji-practice.md) — page exists; verify depth
- [x] **Alphabet learner** → [alphabet-learner.md](tasks/alphabet-learner.md)
- [ ] **Components practice** → [components-practice.md](tasks/components-practice.md) — page exists; verify depth
- [ ] **Grammar page** → [grammar-page.md](tasks/grammar-page.md)
- [ ] **Videos** (unlock by course, community addons, video steps in lessons) → [practice-hub.md](tasks/practice-hub.md) — VideosPracticePage exists with mock; expand
- [ ] **Story content** (real text + exercises) → [story-content.md](tasks/story-content.md) — layout exists; content placeholder

## Engine / logic

- [x] **SRS engine** (spaced repetition) → [srs-engine.md](tasks/srs-engine.md)

## Content expansion

- [ ] **Korean content** (30+ cards, 14+ particles, sentences, vocab lists) → [korean-content.md](tasks/korean-content.md)
- [ ] **Japanese content** (30+ cards, 12+ particles, sentences, vocab lists) → [japanese-content.md](tasks/japanese-content.md)

## Backend (future)

- [ ] **Anki deck import** (.apkg, server-side; scheduling optional) → [anki-import.md](tasks/anki-import.md), [anki-import architecture](dataformats/flashcards/anki-import.md)
- [ ] **User settings API** → [backend-user-api.md](tasks/backend-user-api.md)
- [x] **Progress API (core)** → [backend-progress-api.md](tasks/backend-progress-api.md) — batch + GET/DELETE me wired; single-attempt server validate still 501
- [ ] **Content API** → [backend-content-api.md](tasks/backend-content-api.md)
- [ ] Leaderboard API: replace mock data with real rankings/XP (keep flag off until then)
- [ ] Funding meter: live % from AdSense + Stripe sync (API + UI wired; manual env today)
- [ ] **TTS (text-to-speech)** → [TTS_PLANNING.md](TTS_PLANNING.md) — Own API, CDN, cache-first, ElevenLabs (swappable), usage tracking, monetization-ready

## Auth & session

- [ ] **Auth session strategy** → [auth-session-strategy.md](tasks/auth-session-strategy.md) — 401 refresh, session revocation, optional device sessions

## Core UX improvements

- [x] **Homepage for logged-out users** → [homepage-ux.md](tasks/homepage-ux.md) — **done** — Guest hero, community pointers, streaks, XP in ProgressSummary
- [ ] **SRS viewer redesign** → [srs-viewer-redesign.md](tasks/srs-viewer-redesign.md) — partial — New/review/Again/buried counts; back-first mode, counts widget done
- [ ] **Card markdown** → [card-markdown-editor.md](tasks/card-markdown-editor.md) — Markdown for card content; rich editor; inline images in markdown
- [ ] **Flashcards UI pass + Anki .apkg import** → [flashcards-anki-scoping-2026-06-13.md](flashcards-anki-scoping-2026-06-13.md) — scoped, awaiting Spencer go/no-go; media storage (no S3 pipeline) is the Anki blocker

## Community

- [ ] **External Content** → [community-resources.md](tasks/community-resources.md) — Community-curated links (multiple URLs/item); content + translation language

## Frontend polish

- [ ] More UI locales: add ja.json (Japanese UI); add to i18n supportedLngs and Settings
- [ ] Community content warning: when switching language, show "Community content may not be supported in this language" (see CONTENT-DESIGN.md)
- [ ] Sync / offline: IStorage/ISync for progress and settings when backend exists
- [ ] Practice content localization: add per-locale particle meanings/usage (inline translations or per-locale data files); see LOCALIZATION.md

## Product & platform (ideas — see PRODUCT_BACKLOG.md)

### MVP scope reminders

- [ ] **Ad-free + no billing at launch** — the ads framework is built but its UI is deferred for the MVP trial (see the Ad provider / Ad-free-time items above); ad-supported revenue (AdSense) comes post-MVP. Accept negative margin during the trial.
- [ ] **Polish home + landing** — logged-in `/home`, guest `/landing`, CTAs, continue learning
- [ ] **Product name** — decide branding (Open Lingo vs rename); meta, legal, Auth0 app name
- [ ] **CI/CD pipelines** — PR checks, staging deploy, prod promote, env secrets for `VITE_*` + API

### Admin & moderation (post-MVP epics)

- [ ] **Admin console v2** — feature toggles UI, user management, finance % knobs (pre-Stripe), record-count stats (decks, cards, users, SRS, …)
- [ ] **Content moderation** — approval queue; stage drafts / `pending_review` (“temp” decks) before publish
- [ ] **Blocking & safety** — user ban/suspend, report content, moderator actions
- [ ] **User management system** — roles, search, lifecycle beyond delete

### Progress & rewards (planning)

- [ ] **Progress API design** — lesson/course/story completion (SRS stays separate; working today)
- [ ] **Rewards / XP / streaks** — after progress API; feeds leaderboard later

### Infrastructure (later)

- [ ] **Caching evaluation** — soon-ish; not MVP (deck lists, flags, hot reads)
- [ ] **Live funding %** — AdSense sync; Stripe deferred past MVP

## Production launch (see PRODUCTION_ROADMAP.md)

- [ ] Staging + prod deploy (Auth0, CORS, DEBUG=false, HTTPS)
- [ ] Monitoring (Sentry), health check, backups + restore test
- [ ] Rate limiting; dependency audit
- [ ] Feature flags final audit; smoke test learn + SRS + settings
- [ ] Lawyer skim + `VITE_LEGAL_CONTACT_EMAIL` in prod

## Docs and config

- [x] CONTENT-DESIGN.md, `docs/dataformats/flashcards/README.md`, LOCALIZATION.md
- [x] MVP_PRODUCTION_READINESS, ADS_*, PRODUCTION_ROADMAP, PROJECT_STATE (2026-05)
- [ ] `lingo/.env.example` (vars documented in README; file optional)
- [ ] Amplify / deploy env: all `VITE_*` + API URL for prod
