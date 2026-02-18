# Tasks

Each `.md` file here is a self-contained work item. Pick one and implement it.

## How to use

1. Pick a task that isn't already claimed (check branches / PRs).
2. Read the task doc — it has context, files to touch, acceptance criteria.
3. Create a branch: `feat/<task-name>` (e.g. `feat/vocab-page`).
4. Implement. Follow existing patterns in the codebase.
5. Run `npm run build` — no TS errors.
6. Open a PR referencing the task.

## Conventions

- Use `react-i18next` `t()` for all user-visible strings. Add keys to `en.json` and `ko.json`.
- Follow existing Tailwind + component patterns (see `StoriesPage`, `CommunityPage`).
- Mock data is fine for now; use `mock*.ts` files in the feature folder.
- Keep language-specific content in `src/data/` (flashcards, particles, stories).
- Language configs live in `src/core/languageConfig.ts`.

## Task index

### UI pages (stub → real)

| Task | File | Status |
|------|------|--------|
| [vocab-page](./vocab-page.md) | `features/vocab/VocabPage.tsx` | stub |
| [practice-hub](./practice-hub.md) | `features/practice/PracticePage.tsx` | stub |
| [particle-practice](./particle-practice.md) | `features/practice/ParticlePracticePage.tsx` | stub |
| [kanji-practice](./kanji-practice.md) | `features/practice/KanjiPracticePage.tsx` | stub |
| [alphabet-learner](./alphabet-learner.md) | `features/practice/AlphabetPracticePage.tsx` | partial stub |
| [components-practice](./components-practice.md) | `features/practice/ComponentsPracticePage.tsx` | stub |
| [grammar-page](./grammar-page.md) | `features/grammar/GrammarPage.tsx` | stub |
| [story-content](./story-content.md) | `features/stories/StoryDetailPage.tsx` | placeholder |

### Engine / logic

| Task | File | Status |
|------|------|--------|
| [srs-engine](./srs-engine.md) | `features/flashcards/` | not started |

### Backend (future)

| Task | File | Status |
|------|------|--------|
| [backend-user-api](./backend-user-api.md) | `api/`, `settings/` | not started |
| [backend-progress-api](./backend-progress-api.md) | `api/`, `features/progress/` | not started |
| [backend-content-api](./backend-content-api.md) | `api/`, `features/course/` | not started |

### Content

| Task | File | Status |
|------|------|--------|
| [japanese-content](./japanese-content.md) | `src/data/` | stub |
| [korean-content](./korean-content.md) | `src/data/` | partial |
