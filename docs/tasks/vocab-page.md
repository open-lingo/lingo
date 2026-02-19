# Task: Vocab Page

**File:** `src/features/vocab/VocabPage.tsx`
**Route:** `/vocab`
**Current state:** Stub — "coming soon"

**See also:** `doc/FLASHCARD-DATA.md` (course vocab manifest; lessons introduce vocab; user learned-words).

## Goal

Build a vocabulary lists page where users can browse, search, and study themed word lists for their selected language.

## Requirements

- Show vocab lists grouped by theme (greetings, food, travel, numbers, etc.)
- **Course vocab**: Can be driven by module vocab manifests (see FLASHCARD-DATA.md). Progress = learned words from completed lessons.
- **Themed lists**: Standalone themed lists (community-style or supplemental)
- Each list shows: name, word count, progress (0/N learned)
- Click a list → expand or navigate to a drill/review view
- Search/filter bar at top
- Language-aware: show lists for the current `learningLanguageId`
- Empty state if no lists for the language

## Data

- Create `src/features/vocab/data/` with mock JSON files per language (e.g. `ko-vocab.json`, `ja-vocab.json`)
- Type: `{ id, languageId, theme, words: [{ word, meaning, reading? }] }` — align with `VocabEntry` in FLASHCARD-DATA.md where course vocab is used
- Loader in `src/features/vocab/data/loadVocab.ts`

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
