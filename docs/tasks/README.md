# Tasks

Each `.md` file here is a self-contained work item. Pick one and implement it.

## AI delegation

For AI agents: read [PROJECT_STATE.md](../PROJECT_STATE.md) first for architecture and current state. **Ready-to-delegate tasks** (in suggested order):

### Core UX (new)
1. **[homepage-ux](./homepage-ux.md)** — Logged-out experience, community deck pointers, streaks, XP placeholder
2. **[srs-viewer-redesign](./srs-viewer-redesign.md)** — New/review/Again/buried counts; fix "fixed card count" UX
3. **[card-markdown-editor](./card-markdown-editor.md)** — Markdown for card content; rich editor option; inline images

### Existing backlog
4. **[practice-hub](./practice-hub.md)** — Build PracticePage as hub; route `/:lang/practice` index to it
5. **[vocab-page](./vocab-page.md)** — Themed lists, search, drill view
6. **[story-content](./story-content.md)** — Replace StoryDetailPage placeholder with real text + exercises
7. **[grammar-page](./grammar-page.md)** — Grammar topic browser/drills
8. **[korean-content](./korean-content.md)** / **[japanese-content](./japanese-content.md)** — Expand to 30+ cards, 14+ particles

Each task doc has context, files to touch, and acceptance criteria. Follow conventions below.

## How to use

1. Pick a task that isn't already claimed (check branches / PRs).
2. Read the task doc — it has context, files to touch, acceptance criteria.
3. Create a branch: `feat/<task-name>` (e.g. `feat/vocab-page`).
4. Implement. Follow existing patterns in the codebase.
5. Run `npm run build` — no TS errors.
6. Open a PR referencing the task.

## Conventions

- Use `react-i18next` `t()` for all user-visible strings. Add keys to locale files in `src/shared/i18n/locales/` (`en.json`, `ko.json`).
- Follow existing Tailwind + component patterns (see `StoriesPage`, `CommunityLayout`).
- Mock data is fine for now; use `mock*.ts` files in the feature folder.
- Feature-specific data (flashcards, particles, stories) lives in `src/features/<feature>/data/`.
- Language configs live in `src/shared/domain/languageConfig.ts`.
- Shared components (progress bars, icons) are in `src/shared/components/`.
- Practice content that explains meaning/usage to the user must support localization (see `docs/LOCALIZATION.md`).

## Task index

**See [PROJECT_STATE.md](../PROJECT_STATE.md)** for full architecture and verified status.

### UI pages (stub → real)

| Task | File | Status |
|------|------|--------|
| [vocab-page](./vocab-page.md) | `src/features/vocab/VocabPage.tsx` | stub |
| [practice-hub](./practice-hub.md) | `src/features/practice/PracticePage.tsx` | stub (not routed; index → FlashcardsPage) |
| [particle-practice](./particle-practice.md) | `src/features/practice/ParticlePracticePage.tsx` | **done** |
| [kanji-practice](./kanji-practice.md) | `src/features/practice/KanjiPracticePage.tsx` | partial (verify depth) |
| [alphabet-learner](./alphabet-learner.md) | `src/features/practice/AlphabetPracticePage.tsx` | **done** |
| [components-practice](./components-practice.md) | `src/features/practice/ComponentsPracticePage.tsx` | partial (verify depth) |
| [grammar-page](./grammar-page.md) | `src/features/grammar/GrammarPage.tsx` | stub |
| [story-content](./story-content.md) | `src/features/stories/StoryDetailPage.tsx` | partial (layout; content placeholder) |

### Engine / logic

| Task | File | Status |
|------|------|--------|
| [srs-engine](./srs-engine.md) | `src/features/flashcards/engine/` | **done** |

### Backend (future)

| Task | File | Status |
|------|------|--------|
| [backend-user-api](./backend-user-api.md) | `src/shared/api/`, `src/features/settings/` | not started |
| [backend-progress-api](./backend-progress-api.md) | `src/shared/api/`, `src/features/progress/` | not started |
| [backend-content-api](./backend-content-api.md) | `src/shared/api/`, `src/features/learn/` | not started |
| **TTS (text-to-speech)** | See [TTS_PLANNING.md](../TTS_PLANNING.md) | planned — Own API, CDN, ElevenLabs (swappable), cache-first |

### Content

| Task | File | Status |
|------|------|--------|
| [japanese-content](./japanese-content.md) | `src/features/flashcards/data/`, `src/features/practice/data/` | stub |
| [korean-content](./korean-content.md) | `src/features/flashcards/data/`, `src/features/practice/data/` | partial |

### Community

| Task | File | Status |
|------|------|--------|
| [community-deck-preview](./community-deck-preview.md) | `DeckPreviewModal` | **done** |
| [community-content-wiring](./community-content-wiring.md) | ContentBrowserPage, FlashcardsPage, DeckPreviewModal | **done** (API + subscribe) |
| [community-resources](./community-resources.md) | ExternalContentPage, External Content tab | planned |

### Core UX (new)

| Task | File | Status |
|------|------|--------|
| [homepage-ux](./homepage-ux.md) | HomePage, ProgressSummary | not started |
| [srs-viewer-redesign](./srs-viewer-redesign.md) | FlashcardTester | not started |
| [card-markdown-editor](./card-markdown-editor.md) | DeckEditor, CardPreview, FlashcardTester | not started |
