# AI Task Delegation Guide

Instructions for AI agents assigned to Open Lingo tasks.

---

## Before starting

1. **Read [PROJECT_STATE.md](../PROJECT_STATE.md)** — Architecture, route structure, what's done vs not done
2. **Read the specific task doc** — Full context, files to touch, acceptance criteria
3. **Skim the codebase** — Follow existing patterns (e.g. `StoriesPage`, `ParticlePracticePage`, `FlashcardTester`)

---

## Conventions (must follow)

- **i18n:** All user-visible strings via `t()`. Add keys to `en.json` and `ko.json` in `src/shared/i18n/locales/`
- **Styling:** Tailwind; component-based. Match `StoriesPage`, `CommunityLayout`, `PracticeLayout` patterns
- **Data:** Mock data in `src/features/<feature>/data/` or `mock*.ts` in the feature folder
- **Language config:** `src/shared/domain/languageConfig.ts` — practice types, alphabets
- **Shared components:** `src/shared/components/` — ProgressBar, icons, etc.
- **Localization:** Practice content (particle meanings, etc.) per [LOCALIZATION.md](../LOCALIZATION.md)

---

## Suggested task order (for parallel or sequential agents)

| Priority | Task | Scope | Dependencies |
|----------|------|-------|--------------|
| 1 | [practice-hub](./practice-hub.md) | Medium | None — route change + hub UI |
| 2 | [vocab-page](./vocab-page.md) | Medium | None |
| 3 | [story-content](./story-content.md) | Medium | None |
| 4 | [grammar-page](./grammar-page.md) | Medium | None |
| 5 | [korean-content](./korean-content.md) | Content | None |
| 6 | [japanese-content](./japanese-content.md) | Content | None |
| 7 | [kanji-practice](./kanji-practice.md) | Verify/expand | Kanji content |
| 8 | [components-practice](./components-practice.md) | Verify/expand | Component data |

---

## Output expectations

- **Branch:** `feat/<task-slug>` (e.g. `feat/practice-hub`)
- **Build:** `npm run build` must pass
- **PR:** Reference the task doc, list acceptance criteria checked
- **No breaking changes** to existing routes/components unless the task specifies

---

## Files to avoid changing (unless task requires)

- `App.tsx` — Route changes only when task specifies
- `shared/` — Add imports as needed; don't refactor shared infra
- `lingo-core/` — Backend; only touch if task is backend-specific
