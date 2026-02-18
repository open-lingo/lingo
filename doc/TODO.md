# Todos and what's left

By area. Check tasks in `doc/tasks/` for detailed specs per item.

## Done (recently)

- [x] i18n: react-i18next, en.json + ko.json, Settings page (language, theme, UI locale)
- [x] Auth0: env-based config (VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID), normalized callback
- [x] Layout: Home, Practice, Flashcards, Stories, Leaderboard, Community in nav
- [x] Home: course cards, continue learning, progress summary, quick links
- [x] Flashcards: deck viewer, FlashcardTester with highlight mode + reasoning, ko + ja decks
- [x] Stories: hub page (sidebar, search, filter, course/community sections), detail page
- [x] Community: official courses, addons, forum, suggestions, contribute
- [x] Leaderboard: category cards, tabs (XP, language, flashcards, contributors)
- [x] Course map: SVG path with lesson nodes
- [x] Profile: edit page (avatar, username, name, status)
- [x] Language config: reduced to ko + ja only in learning selector; full config kept for future
- [x] Japanese stub: flashcards (5 cards), particles (8), stories (6)
- [x] Korean: flashcards (5 cards), particles (8), stories (6)

## UI pages — stub → real

Each has a task doc in `doc/tasks/`.

- [ ] **Vocab page** → [vocab-page.md](tasks/vocab-page.md)
- [ ] **Practice hub** → [practice-hub.md](tasks/practice-hub.md)
- [ ] **Particle practice** → [particle-practice.md](tasks/particle-practice.md)
- [ ] **Kanji practice** → [kanji-practice.md](tasks/kanji-practice.md)
- [ ] **Alphabet learner** → [alphabet-learner.md](tasks/alphabet-learner.md)
- [ ] **Components practice** → [components-practice.md](tasks/components-practice.md)
- [ ] **Grammar page** → [grammar-page.md](tasks/grammar-page.md)
- [ ] **Story content** (real text + exercises) → [story-content.md](tasks/story-content.md)

## Engine / logic

- [ ] **SRS engine** (spaced repetition) → [srs-engine.md](tasks/srs-engine.md)

## Content expansion

- [ ] **Korean content** (30+ cards, 14+ particles, sentences, vocab lists) → [korean-content.md](tasks/korean-content.md)
- [ ] **Japanese content** (30+ cards, 12+ particles, sentences, vocab lists) → [japanese-content.md](tasks/japanese-content.md)

## Backend (future)

- [ ] **User settings API** → [backend-user-api.md](tasks/backend-user-api.md)
- [ ] **Progress API** → [backend-progress-api.md](tasks/backend-progress-api.md)
- [ ] **Content API** → [backend-content-api.md](tasks/backend-content-api.md)
- [ ] Leaderboard API: replace mock data with real rankings/XP
- [ ] Funding meter: plug real ad-funded % into FundingMeter

## Frontend polish

- [ ] More UI locales: add ja.json (Japanese UI); add to i18n supportedLngs and Settings
- [ ] Sync / offline: IStorage/ISync for progress and settings when backend exists

## Docs and config

- [x] .env.example with Auth0 vars
- [ ] Amplify env: VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID for prod deployment
