# Open Lingo — doc index

Quick reference for this folder. Use for human reading and minimal context.

- **PROJECT_STATE.md** — Architecture assessment, current state vs docs, route structure. Use for planning and AI delegation.
- **TODO.md** — Concrete todos and what's left to implement (by area).
- **DESIGN.md** — Design ideas, architecture notes, tech choices, folder structure.
- **CONTENT-DESIGN.md** — Content philosophy: core courses (language-agnostic, versioned, manifest-based) vs community content (language-specific, no cutover on language switch).
- **FLASHCARD-DATA.md** — Flashcard format, vocab manifest (per-module), lesson completion flow, user learned-words.
- **LOCALIZATION.md** — Localization strategy: UI strings in locale files, practice content localized via inline translations or per-locale data, community content stays in its original language.
- **COMMUNITY_PLANNING.md** — Community & forum database schema, rich markdown editor, content linking.
- **FEATURES.md** — Feature backlog and ideas from the plan (not yet built).
- **dataformats/** — Data format specs and example JSON. `flashcards.md` + examples; courses & modules coming next.
- **tasks/** — Self-contained work items with context, files to touch, and acceptance criteria.

## src/ structure

The codebase uses a two-layer structure:

- `src/shared/` — Cross-cutting infrastructure: domain types (`shared/domain/`), API client, auth, components, contexts, hooks, i18n + locales, storage.
- `src/features/` — UI domains, each self-contained with own `components/`, `data/`, and pages.
- `src/routes/` — App-level layout wrappers (Layout, LangLayout, RedirectToLang).

Feature-specific data (flashcards, particles, stories) lives inside its feature under `data/`. Language configs are in `shared/domain/languageConfig.ts`. See DESIGN.md for the full folder tree.
