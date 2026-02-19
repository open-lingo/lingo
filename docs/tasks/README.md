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

- Use `react-i18next` `t()` for all user-visible strings. Add keys to locale files in `src/shared/i18n/locales/` (`en.json`, `ko.json`).
- Follow existing Tailwind + component patterns (see `StoriesPage`, `CommunityLayout`).
- Mock data is fine for now; use `mock*.ts` files in the feature folder.
- Feature-specific data (flashcards, particles, stories) lives in `src/features/<feature>/data/`.
- Language configs live in `src/shared/domain/languageConfig.ts`.
- Shared components (progress bars, icons) are in `src/shared/components/`.
- Practice content that explains meaning/usage to the user must support localization (see `docs/LOCALIZATION.md`).

## Task index

### UI pages (stub → real)

| Task | File | Status |
|------|------|--------|
| [vocab-page](./vocab-page.md) | `src/features/vocab/VocabPage.tsx` | stub |
| [practice-hub](./practice-hub.md) | `src/features/practice/PracticePage.tsx` | stub |
| [particle-practice](./particle-practice.md) | `src/features/practice/ParticlePracticePage.tsx` | stub |
| [kanji-practice](./kanji-practice.md) | `src/features/practice/KanjiPracticePage.tsx` | stub |
| [alphabet-learner](./alphabet-learner.md) | `src/features/practice/AlphabetPracticePage.tsx` | partial stub |
| [components-practice](./components-practice.md) | `src/features/practice/ComponentsPracticePage.tsx` | stub |
| [grammar-page](./grammar-page.md) | `src/features/grammar/GrammarPage.tsx` | stub |
| [story-content](./story-content.md) | `src/features/stories/StoryDetailPage.tsx` | placeholder |

### Engine / logic

| Task | File | Status |
|------|------|--------|
| [srs-engine](./srs-engine.md) | `src/features/flashcards/` | not started |

### Backend (future)

| Task | File | Status |
|------|------|--------|
| [backend-user-api](./backend-user-api.md) | `src/shared/api/`, `src/features/settings/` | not started |
| [backend-progress-api](./backend-progress-api.md) | `src/shared/api/`, `src/features/progress/` | not started |
| [backend-content-api](./backend-content-api.md) | `src/shared/api/`, `src/features/learn/` | not started |

### Content

| Task | File | Status |
|------|------|--------|
| [japanese-content](./japanese-content.md) | `src/features/flashcards/data/`, `src/features/practice/data/` | stub |
| [korean-content](./korean-content.md) | `src/features/flashcards/data/`, `src/features/practice/data/` | partial |
