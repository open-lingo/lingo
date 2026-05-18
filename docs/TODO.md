# Todos and what's left

By area. **Launch plan:** [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) · **Ideas / epics:** [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md) · **Checklists:** [MVP_PRODUCTION_READINESS.md](./MVP_PRODUCTION_READINESS.md) · **Code snapshot:** [PROJECT_STATE.md](./PROJECT_STATE.md).

## Done (recently)

- [x] Theme system: token-based themes, presets (Light/Dark/Sepia/AMOLED), custom themes, theme editor panel, Your themes + Community themes (mock)
- [x] Design system: Card, Button, token classes; migrated Layout, Home, Community, ProgressSummary, nav components (ThemeToggle, LanguageSelector, AuthMenu, SyncManager, FundingMeter)

- [x] i18n: react-i18next, en.json + ko.json, Settings page (language, theme, UI locale)
- [x] Auth0: env-based config (VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID), normalized callback
- [x] Layout: Home, Practice, Flashcards, Stories, Leaderboard, Community in nav
- [x] Home: course cards, continue learning, progress summary, quick links
- [x] Flashcards: deck viewer, FlashcardTester with highlight mode + reasoning, ko + ja decks; course deck unlock by lesson completion (see FLASHCARD-DATA.md)
- [x] Stories: hub page (sidebar, search, filter, course/community sections), detail page
- [x] Community: official courses, addons, forum, suggestions, contribute
- [x] Leaderboard: category cards, tabs (XP, language, flashcards, contributors)
- [x] Learn page: combined course + community; linear modules, current module card, progress %, Test out, Start over; community expandable cards; lesson unlock; semi/full expansion
- [x] Profile: edit page (avatar, username, name, status)
- [x] Language config: reduced to ko + ja only in learning selector; full config kept for future
- [x] Japanese stub: flashcards (5 cards), particles (8), stories (6)
- [x] Korean: flashcards (5 cards), particles (8), stories (6)
- [x] Content design docs: CONTENT-DESIGN.md (course vs community, versioning), FLASHCARD-DATA.md (vocab manifest, lesson completion flow)
- [x] SRS engine: SM-2, srsStorage, reviewQueue, FlashcardTester ratings, ProgressSummary cards due
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

- [ ] **User settings API** → [backend-user-api.md](tasks/backend-user-api.md)
- [ ] **Progress API** → [backend-progress-api.md](tasks/backend-progress-api.md)
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

## Community

- [ ] **External Content** → [community-resources.md](tasks/community-resources.md) — Community-curated links (multiple URLs/item); content + translation language

## Frontend polish

- [ ] More UI locales: add ja.json (Japanese UI); add to i18n supportedLngs and Settings
- [ ] Community content warning: when switching language, show "Community content may not be supported in this language" (see CONTENT-DESIGN.md)
- [ ] Sync / offline: IStorage/ISync for progress and settings when backend exists
- [ ] Practice content localization: add per-locale particle meanings/usage (inline translations or per-locale data files); see LOCALIZATION.md

## Product & platform (ideas — see PRODUCT_BACKLOG.md)

### MVP scope reminders

- [ ] **No billing at launch** — ad-supported only; accept negative margin until AdSense scales
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

- [x] CONTENT-DESIGN.md, FLASHCARD-DATA.md, LOCALIZATION.md
- [x] MVP_PRODUCTION_READINESS, ADS_*, PRODUCTION_ROADMAP, PROJECT_STATE (2026-05)
- [ ] `lingo/.env.example` (vars documented in README; file optional)
- [ ] Amplify / deploy env: all `VITE_*` + API URL for prod
