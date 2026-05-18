# Open Lingo — doc index

Quick reference for this folder.

## Launch & monetization

- **PRODUCTION_ROADMAP.md** — **~2 week launch plan** (scope, week 1/2 tasks, post-launch backlog).
- **PRODUCT_BACKLOG.md** — Epics & ideas (admin, moderation, progress API, CI/CD, no billing at MVP).
- **MVP_PRODUCTION_READINESS.md** — Detailed P0/P1/P2 checklists.
- **PROJECT_STATE.md** — What’s implemented vs stub (keep in sync with code).
- **TODO.md** — Backlog by area.
- **ADS_PLACEMENT.md** — Where and how to add AdSense units.
- **ADS_AND_FINANCE_ARCHITECTURE.md** — Funding meter API, AdSense/Stripe (server-side).
- **FEATURES.md** — Ideas and post-launch features (not launch scope).

## Product & engineering

- **MERGE_ADMIN_PAGE.md** — Merge guide for `admin-page` → `main`: steps, conflicts, API checklist, behavioral changes.
- **PROJECT_STATE.md** — Architecture assessment, current state vs docs, route structure. Use for planning and AI delegation.
- **STORY_PLANNING.md** — Story editor & reader: data format, add-word-to-deck, API, AI usage.
- **TTS_PLANNING.md** — Text-to-speech: own API, CDN, ElevenLabs (swappable), cache-first, usage tracking, monetization hooks.
- **COMMUNITY_RESOURCES_PLANNING.md** — External Content: community-curated links (YouTube, podcasts, websites); multiple URLs per item; content + translation language.
- **TODO.md** — Concrete todos and what's left to implement (by area).
- **DESIGN.md** — Design ideas, architecture notes, tech choices, folder structure.
- **CONTENT-DESIGN.md** — Content philosophy: core courses (language-agnostic, versioned, manifest-based) vs community content (language-specific, no cutover on language switch).
- **FLASHCARD-DATA.md** — Flashcard format, vocab manifest (per-module), lesson completion flow, user learned-words.
- **LOCALIZATION.md** — Localization strategy: UI strings in locale files, practice content localized via inline translations or per-locale data, community content stays in its original language.
- **COMMUNITY_PLANNING.md** — Community & forum database schema, rich markdown editor, content linking.
- **FEATURES.md** — Feature backlog and ideas from the plan (not yet built).
- **dataformats/** — Data format specs and example JSON. `flashcards.md` + examples; courses & modules coming next.
- **tasks/** — Self-contained work items with context, files to touch, and acceptance criteria.
- **agents/** — AI agent context. `basecontext/` has foundational docs: `FRONTEND_CONTEXT.md` (theme strategy, design tokens), `AUTH_STRATEGY.md` (token refresh, sessions, logout).

## src/ structure

The codebase uses a two-layer structure:

- `src/shared/` — Cross-cutting infrastructure: domain types (`shared/domain/`), API client, auth, components, contexts, hooks, i18n + locales, storage.
- `src/features/` — UI domains, each self-contained with own `components/`, `data/`, and pages.
- `src/routes/` — App-level layout wrappers (Layout, LangLayout, RedirectToLang).

Feature-specific data (flashcards, particles, stories) lives inside its feature under `data/`. Language configs are in `shared/domain/languageConfig.ts`. See DESIGN.md for the full folder tree.
