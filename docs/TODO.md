# Todos and what's left

By area. Check tasks in `docs/tasks/` for detailed specs per item.

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

## UI pages — stub → real

Each has a task doc in `docs/tasks/`. See `PROJECT_STATE.md` for verified status.

- [ ] **Vocab page** → [vocab-page.md](tasks/vocab-page.md)
- [ ] **Practice hub** → [practice-hub.md](tasks/practice-hub.md) — PracticePage exists but not routed; index goes to FlashcardsPage
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
- [ ] Leaderboard API: replace mock data with real rankings/XP
- [ ] Funding meter: plug real ad-funded % into FundingMeter
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

## Docs and config

- [x] .env.example with Auth0 vars
- [x] CONTENT-DESIGN.md, FLASHCARD-DATA.md (design philosophies, vocab manifest)
- [x] LOCALIZATION.md (finalized localization strategy)
- [ ] Amplify env: VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID for prod deployment
