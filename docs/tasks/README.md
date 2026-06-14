# Tasks

Each `.md` file here is a self-contained work item. **Closed** = done.

**Before launch:** [PRODUCTION_ROADMAP.md](../PRODUCTION_ROADMAP.md) (2-week plan) · [MVP_PRODUCTION_READINESS.md](../MVP_PRODUCTION_READINESS.md) · [PROJECT_STATE.md](../PROJECT_STATE.md).

## AI delegation

For AI agents: read [PROJECT_STATE.md](../PROJECT_STATE.md) first, then the most recent handoff doc in `docs/`. **Do not start net-new features** that conflict with launch scope unless the roadmap explicitly allows it.

**Post-launch / parallel (when infra is ready):**

### Core UX (post-launch polish)
1. **[homepage-ux](./homepage-ux.md)** — **done** — landing + guest patterns
2. **[srs-viewer-redesign](./srs-viewer-redesign.md)** — **partial**
3. **[card-markdown-editor](./card-markdown-editor.md)** — open

### Auth (stability)
4. **[auth-session-strategy](./auth-session-strategy.md)** — 401 refresh, session revocation

### Backlog
5. **[practice-hub](./practice-hub.md)** — **done** — `PracticePage` is practice index
6. **[vocab-page](./vocab-page.md)** — Themed lists, search, drill view
7. **[story-content](./story-content.md)** — Replace StoryDetailPage placeholder with real text + exercises
8. **[grammar-page](./grammar-page.md)** — Grammar topic browser/drills
9. **[korean-content](./korean-content.md)** / **[japanese-content](./japanese-content.md)** — Expand to 30+ cards, 14+ particles
10. **[community-themes](./community-themes.md)** — Backend + CloudFront for community themes; replace mock

### Investigation (planning, not yet implementation)
11. **[schema-versioning-migration](./schema-versioning-migration.md)** — 🧬 Add `schemaVersion` to lessons, themes, settings, sync payloads; design v1/v2 viewers and `migrateXxxV1toV2()`; prevents old clients crashing, CDN breaking, silent corruption
12. **[performance-budgeting](./performance-budgeting.md)** — 🧠 Lazy loading, code splitting, bundle budget (initial JS < 300 KB gzip); route-level `React.lazy`; keep lesson flow lightweight; avoid heavy libs and global re-renders
13. **[local-cache-server-state-research](./local-cache-server-state-research.md)** — 📦 Research & standardize local cache editing; design layer for derived-from-local data (TanStack-like); local cache as source of truth vs TanStack; research server state patterns in parallel

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
| [practice-hub](./practice-hub.md) | `src/features/practice/PracticePage.tsx` | **closed** — practice index routed |
| [particle-practice](./particle-practice.md) | `src/features/practice/ParticlePracticePage.tsx` | closed |
| [kanji-practice](./kanji-practice.md) | `src/features/practice/KanjiPracticePage.tsx` | partial (verify depth) |
| [alphabet-learner](./alphabet-learner.md) | `src/features/practice/AlphabetPracticePage.tsx` | closed |
| [components-practice](./components-practice.md) | `src/features/practice/ComponentsPracticePage.tsx` | partial (verify depth) |
| [grammar-page](./grammar-page.md) | `src/features/grammar/GrammarPage.tsx` | stub |
| [story-content](./story-content.md) | `src/features/stories/StoryDetailPage.tsx` | partial (layout; content placeholder) |

### Engine / logic

| Task | File | Status |
|------|------|--------|
| [srs-engine](./srs-engine.md) | `src/features/flashcards/engine/` | closed |

### Auth

| Task | File | Status |
|------|------|--------|
| [auth-session-strategy](./auth-session-strategy.md) | `src/shared/api/client.ts`, provider, auth | planned |

### Backend

| Task | File | Status |
|------|------|--------|
| [backend-user-api](./backend-user-api.md) | Users router, settings | closed (remaining: DynamoDB, profile pic, rate limit) |
| [backend-srs-api](./backend-srs-api.md) | SRS router, sync | closed (remaining: DynamoDB impl) |
| [backend-progress-api](./backend-progress-api.md) | Progress router | not started |
| [backend-content-api](./backend-content-api.md) | Content router | not started |
| **TTS (text-to-speech)** | See [TTS_PLANNING.md](../TTS_PLANNING.md) | planned — Own API, CDN, ElevenLabs (swappable), cache-first |

### Content

| Task | File | Status |
|------|------|--------|
| [japanese-content](./japanese-content.md) | `src/features/flashcards/data/`, `src/features/practice/data/` | stub |
| [korean-content](./korean-content.md) | `src/features/flashcards/data/`, `src/features/practice/data/` | partial |

### Community

| Task | File | Status |
|------|------|--------|
| [community-deck-preview](./community-deck-preview.md) | `DeckPreviewModal` | closed |
| [community-content-wiring](./community-content-wiring.md) | ContentBrowserPage, FlashcardsPage | closed |
| [community-themes](./community-themes.md) | theme/, API, CloudFront | planned |
| [community-resources](./community-resources.md) | ExternalContentPage, External Content tab | planned |

### Core UX

| Task | File | Status |
|------|------|--------|
| [homepage-ux](./homepage-ux.md) | HomePage, ProgressSummary | closed |
| [srs-viewer-redesign](./srs-viewer-redesign.md) | FlashcardTester | partial (back-first, counts widget) |
| [card-markdown-editor](./card-markdown-editor.md) | DeckEditor, CardPreview, FlashcardTester | not started |

### Frontend / design system

| Task | File | Status |
|------|------|--------|
| Theme + design tokens | theme/, ui/, Layout, Home, Community, nav | closed |

### Infrastructure / schema (investigation)

| Task | File | Status |
|------|------|--------|
| [schema-versioning-migration](./schema-versioning-migration.md) | theme/, sync, settings, lessons; `docs/SCHEMA_VERSIONING.md` | investigation |
| [performance-budgeting](./performance-budgeting.md) | routes, vite config, bundle analysis | investigation |
| [local-cache-server-state-research](./local-cache-server-state-research.md) | storage/, TanStack usage; `docs/LOCAL_CACHE_SERVER_STATE.md` | investigation |
