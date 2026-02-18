# Task: Kanji / Character Practice Page

**File:** `src/features/practice/KanjiPracticePage.tsx`
**Route:** `/practice/kanji`
**Current state:** Stub — "coming soon"

## Goal

Kanji/hanzi character recognition practice: show a character, user guesses meaning or reading.

## Requirements

- Flashcard-style: show character on front, meaning + reading on back
- Modes: meaning → character, character → meaning, character → reading
- Difficulty levels (N5, N4, etc. for Japanese; HSK levels for Chinese)
- Track progress per character
- Only relevant for languages with `practiceTypes` including "kanji" (ja, zh)

## Data

- Create `src/data/kanji/ja-n5.json` with ~20 starter kanji
- Type: `{ character, meaning, onyomi, kunyomi, strokeCount, examples: [{ word, reading, meaning }] }`

## UI reference

- Large character display (centered, big font)
- Flip animation or reveal button
- Progress bar at top

## i18n

- Add `practice.kanji.*` keys

## Acceptance criteria

- [ ] Shows kanji flashcard with character
- [ ] Reveals meaning and readings on flip/click
- [ ] At least 20 N5 kanji in the data file
- [ ] Works for Japanese (Chinese is bonus)
- [ ] `npm run build` passes
