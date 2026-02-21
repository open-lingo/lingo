# Open Lingo — Project State & Architecture

**Last updated:** 2025-02-19  
**Purpose:** Senior architect reference. Use for planning, delegating tasks to AI agents, and keeping docs accurate.

---

## Executive Summary

Open Lingo is a language-learning SPA (Vite + React) with a **lingo-core** FastAPI backend. The frontend has a solid foundation: Auth0, i18n (en, ko), layout/nav, learn flow, flashcards with SRS, stories, community, contribute (deck editor), forum, leaderboard. Several documented tasks are **already done** but not reflected in docs. The backend exists with decks, users/subscriptions, SRS, and community APIs.

---

## What's Done (verified in codebase)

### Infrastructure
- [x] i18n: react-i18next, en.json + ko.json, Settings (language, theme, UI locale)
- [x] Auth0: env-based config, normalized callback
- [x] Layout: Home, Practice, Flashcards, Stories, Leaderboard, Community in nav
- [x] Modal system: stack-based ModalContext, ModalBase, ModalRoot
- [x] Toast system: ToastContext, ToastContainer
- [x] Shared progress components: ProgressBar, ProgressBarWithCheckpoints, StatusNodeStrip, LessonStatusCircle
- [x] Shared icons: LockIcon, ChevronIcon
- [x] Two-layer src: `shared/` + `features/`, `routes/`
- [x] Language config: ko + ja in learning selector; full config for future
- [x] .env.example with Auth0 vars

### Features (implemented)
- [x] **Home:** course cards, continue learning, progress summary, quick links
- [x] **Learn:** combined course + community; linear modules; Test out, Start over; lesson unlock; semi/full expansion
- [x] **Flashcards:** deck viewer, FlashcardTester with highlight mode + reasoning; ko + ja decks; course deck unlock by lesson completion
- [x] **Stories:** hub (sidebar, search, filter, course/community); detail page (placeholder content)
- [x] **Community:** ContentBrowserPage (explore), ContributePage (My Content, Create, Admin, DeckEditor), Forum (threads, new thread)
- [x] **Leaderboard:** category cards, tabs (XP, language, flashcards, contributors)
- [x] **Profile:** edit page (avatar, username, name, status)
- [x] **Lesson page:** step renderer, multiple step types (Teach, MultipleChoice, Translate, BuildSentence, FillBlank, Listening, MatchPairs, etc.)

### SRS (spaced repetition)
- [x] SM-2 algorithm in `engine/srs.ts`
- [x] SRS storage: `srsStorage.ts` (localStorage)
- [x] Review queue: `reviewQueue.ts`, `buildReviewQueue`, `countCardsDue`
- [x] SRS sync: `srsSync.ts`, `useSRSyncSession` for backend sync
- [x] FlashcardTester: rating buttons (Again, Hard, Good, Easy), `reviewCard`, `setCardState`
- [x] ProgressSummary: "cards due today" from `countCardsDue`

### Community & Content
- [x] **DeckPreviewModal:** sidebar (creator, updated date, language, card count, upvotes); comments stub; Subscribe/Unsubscribe (API)
- [x] **ContentBrowserPage:** API integration for decks (`listAdminDecks`), subscriptions; Subscribe/Preview on cards
- [x] **FlashcardsPage:** subscribed decks from API; merge with course decks; `deckResponseToFlashcardDeck`
- [x] **Contribute:** MyContentTab, CreateTab, DeckEditor, AdminTab; deck create/edit flow

### Practice pages (implemented)
- [x] **ParticlePracticePage:** particle cards, sections, browse UI
- [x] **AlphabetPracticePage:** alphabet sections, CharacterCard, AlphabetSectionBlock; path/query routing
- [x] **KanjiPracticePage:** exists (needs verification of depth)
- [x] **ComponentsPracticePage:** exists (needs verification)
- [x] **VideosPracticePage:** mock video, transcript, segment highlighting, word-add flow

### Backend (lingo-core)
- [x] Decks API: list, get, create, update, status
- [x] Users API: subscriptions (get, add, remove)
- [x] SRS API: card state, sync
- [x] Community API: browse, etc.

### Content (stub level)
- [x] Japanese: flashcards (5 cards), particles (8), stories (6)
- [x] Korean: flashcards (5 cards), particles (8), stories (6)

---

## What's Not Done / Stubs

### UI pages (stub → real)
- [ ] **VocabPage** — stub ("coming soon")
- [ ] **Practice hub** — PracticePage is stub; route index goes to FlashcardsPage (no hub)
- [ ] **GrammarPage** — stub
- [ ] **StoryDetailPage** — layout exists; content shows `t("stories.contentPlaceholder")` (no real story text/exercises)

### Practice pages (partial)
- **KanjiPracticePage, ComponentsPracticePage** — exist but may be minimal; verify
- **VideosPracticePage** — functional with mock; needs unlock-by-course, community addons

### Content expansion
- [ ] **Korean content:** 30+ cards, 14+ particles, sentences, vocab lists
- [ ] **Japanese content:** 30+ cards, 12+ particles, sentences, vocab lists
- [ ] **Story content:** real text, exercises, comprehension

### Backend integration
- [ ] User settings API (persist language, theme to backend)
- [ ] Progress API (lessons, XP, streaks)
- [ ] Content API consolidation
- [ ] Leaderboard API (replace mock)
- [ ] Funding meter: real ad-funded %

### Frontend polish
- [ ] ja.json (Japanese UI locale)
- [ ] Community content warning on language switch
- [ ] Sync/offline when backend ready
- [ ] Practice content localization (particle meanings per locale)

### Docs / config
- [ ] Amplify env for prod deployment
- [ ] Update docs to match codebase (this doc + TODO.md + tasks/README)

---

## Route Structure (current)

```
/                     → HomePage
/login, /logout       → Auth
/:lang/learn          → LearnPage, LessonPage
/:lang/practice       → PracticeLayout
  index               → FlashcardsPage (not PracticePage!)
  flashcards          → FlashcardsPage
  flashcards/review   → FlashcardTester
  stories             → StoriesPage
  stories/:storyId    → StoryDetailPage
  particles           → ParticlePracticePage
  alphabet/:alphabetId? → AlphabetPracticePage
  kanji               → KanjiPracticePage
  components          → ComponentsPracticePage
  videos              → VideosPracticePage
/:lang/vocab          → VocabPage
/:lang/grammar        → GrammarPage
/:lang/community      → CommunityLayout
  explore             → ContentBrowserPage
  contribute          → ContributePage (My Content, Create, DeckEditor, Admin)
  discuss, forum      → Forum, ThreadPage, NewThreadPage
  leaderboard         → LeaderboardPage
```

**Note:** Practice index = FlashcardsPage. There is no Practice hub page. `PracticePage.tsx` exists but is not routed.

---

## Backend (lingo-core)

- **Stack:** FastAPI, SQLite (dev) / DynamoDB (prod)
- **Routers:** users, decks, srs, community
- **Key endpoints:** Decks CRUD, subscriptions, SRS sync
- **Location:** `lingo-core/` (sibling to `lingo/`)

---

## Task Docs vs Reality

| Task doc | Docs say | Reality |
|----------|----------|---------|
| community-deck-preview | in progress | **DONE** — sidebar, metadata, comments stub, subscribe |
| srs-engine | not started | **DONE** — SM-2, storage, queue, FlashcardTester ratings |
| community-content-wiring | — | **Mostly DONE** — ContentBrowserPage + FlashcardsPage use API, subscribe |
| practice-hub | stub | **Stub** — PracticePage exists but not routed; index = FlashcardsPage |
| vocab-page | stub | **Stub** |
| particle-practice | stub | **DONE** — ParticlePracticePage has real UI |
| alphabet-learner | partial | **DONE** — AlphabetPracticePage full |
| story-content | placeholder | **Partial** — layout; content placeholder |

---

## Design docs (accurate)

- **DESIGN.md** — Architecture, folder structure, tech choices ✓
- **CONTENT-DESIGN.md** — Course vs community, versioning ✓
- **FLASHCARD-DATA.md** — Vocab manifest, lesson completion flow ✓
- **LOCALIZATION.md** — UI strings, practice content localization ✓
- **COMMUNITY_PLANNING.md** — Forum schema, rich markdown, content links ✓
- **FEATURES.md** — Backlog ✓
- **dataformats/** — Flashcards, lessons, courses, progress, SRS ✓

---

## Recommended next steps (for AI delegation)

1. **Update docs** — TODO.md, tasks/README.md, mark completed tasks
2. **Practice hub** — Implement PracticePage as hub; optionally reroute practice index
3. **Vocab page** — Build themed lists, search, drill view
4. **Story content** — Replace placeholder with real text + exercises
5. **Grammar page** — Build grammar topic browser/drills
6. **Content expansion** — Korean + Japanese: 30+ cards, particles, sentences
7. **Polish** — ja.json, community warning on language switch

---

## Files to reference

- `docs/TODO.md` — high-level todo list
- `docs/tasks/README.md` — task index
- `docs/tasks/*.md` — individual task specs
- `src/shared/domain/languageConfig.ts` — language + practice config
- `src/features/practice/practiceNavItems.ts` — practice nav by language
- `src/features/flashcards/engine/` — SRS implementation
