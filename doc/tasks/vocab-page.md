# Task: Vocab Page

**File:** `src/features/vocab/VocabPage.tsx`
**Route:** `/vocab`
**Current state:** Stub — "coming soon"

## Goal

Build a vocabulary lists page where users can browse, search, and study themed word lists for their selected language.

## Requirements

- Show vocab lists grouped by theme (greetings, food, travel, numbers, etc.)
- Each list shows: name, word count, progress (0/N learned)
- Click a list → expand or navigate to a drill/review view
- Search/filter bar at top
- Language-aware: show lists for the current `learningLanguageId`
- Empty state if no lists for the language

## Data

- Create `src/data/vocab/` with mock JSON files per language (e.g. `ko-vocab.json`, `ja-vocab.json`)
- Type: `{ id, languageId, theme, words: [{ word, meaning, reading? }] }`
- Loader in `src/data/vocab/loadVocab.ts`

## UI reference

- Follow the layout style of `StoriesPage` (sidebar filters + main list)
- Cards should be clickable, rounded-xl, border, hover state

## i18n

- Add `vocab.*` keys to `en.json` and `ko.json`

## Acceptance criteria

- [ ] Vocab page shows themed lists for ko and ja
- [ ] Search filters the list
- [ ] Clicking a list shows words (expand or sub-page)
- [ ] All strings use `t()`
- [ ] `npm run build` passes
