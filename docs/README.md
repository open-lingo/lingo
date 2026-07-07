# Open Lingo — doc index

Quick reference for this folder.

> **Doc hygiene (keep this folder lean).** This directory accumulates dated handoffs, audits, and specs — most go *stale*, and stale-but-plausible docs mislead agents more than no docs. Two habits: **(1)** sweep periodically — retire superseded/dated docs to `archive/`, kill dangling refs, keep `CLAUDE.md` + this index + `PROJECT_STATE.md` pointing only at *current* docs. **(2)** author guidelines conservatively — state what the code/tests enforce (name the test), label heuristics as heuristics, and never write a guideline that contradicts shipped reality (shipped JA M1–M7 is ground truth). When in doubt about *what* to cut or *which* rule wins, that's a judgment call — ask, don't guess.

## Launch & monetization

- **PRODUCTION_ROADMAP.md** — **~2 week launch plan** (scope, week 1/2 tasks, post-launch backlog).
- **PRODUCT_BACKLOG.md** — Epics & ideas (admin, moderation, progress API, CI/CD, no billing at MVP).
- **MVP_PRODUCTION_READINESS.md** — Detailed P0/P1/P2 checklists.
- **PROJECT_STATE.md** — What’s implemented vs stub (keep in sync with code).
- **superpowers/specs/2026-05-24-quests-tracking-design.md** — Quest/daily XP event model (planning).
- **TODO.md** — Backlog by area.
- **ADS_PLACEMENT.md** — Where and how to add AdSense units.
- **ADS_AND_FINANCE_ARCHITECTURE.md** — Funding meter API, AdSense/Stripe (server-side).
- **FEATURES.md** — Ideas and post-launch features (not launch scope).

## Product & engineering

- **PROJECT_STATE.md** — Architecture assessment, current state vs docs, route structure. Use for planning and AI delegation.
- **STORY_PLANNING.md** — Story editor & reader: data format, add-word-to-deck, API, AI usage.
- **TTS_PLANNING.md** — Text-to-speech: own API, CDN, ElevenLabs (swappable), cache-first, usage tracking, monetization hooks.
- **TODO.md** — Concrete todos and what's left to implement (by area).
- **DESIGN.md** — Design ideas, architecture notes, tech choices, folder structure.
- **CONTENT-DESIGN.md** — Content philosophy: core courses (language-agnostic, versioned, manifest-based) vs community content (language-specific, no cutover on language switch).
- **dataformats/flashcards/** — Flashcard + deck format (FSRS-6 SRS state). *(Supersedes the old top-level FLASHCARD-DATA.md, removed 2026-06-30 — it described the retired SM-2 schema.)*
- **LOCALIZATION.md** — Localization strategy: UI strings in locale files, practice content localized via inline translations or per-locale data, community content stays in its original language.
- **FEATURES.md** — Feature backlog and ideas from the plan (not yet built).
- **dataformats/** — Data format specs and example JSON; [progress/](dataformats/progress/README.md) (hybrid rollup + client buffer — see also `../lingo-core/docs/adr/0001-progress-api-hybrid-rollup.md`).
- **tasks/** — Self-contained work items with context, files to touch, and acceptance criteria.
- **archive/** — Completed/superseded docs (handoffs, done specs, dated audits). Historical only — not current guidance.
- **agents/** — AI agent context. `basecontext/` has foundational docs: `FRONTEND_CONTEXT.md` (theme strategy, design tokens), `AUTH_STRATEGY.md` (token refresh, sessions, logout).

## src/ structure

The codebase uses a two-layer structure:

- `src/shared/` — Cross-cutting infrastructure: domain types (`shared/domain/`), API client, auth, components, contexts, hooks, i18n + locales, storage.
- `src/features/` — UI domains, each self-contained with own `components/`, `data/`, and pages.
- `src/routes/` — App-level layout wrappers (Layout, LangLayout, RedirectToLang).

Feature-specific data (flashcards, particles, stories) lives inside its feature under `data/`. Language configs are in `shared/domain/languageConfig.ts`. See DESIGN.md for the full folder tree.
