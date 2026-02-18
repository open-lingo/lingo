# Task: Alphabet Learner Page

**File:** `src/features/practice/AlphabetPracticePage.tsx`
**Route:** `/practice/alphabet/:alphabetId?`
**Current state:** Partial stub — shows character grid header but "coming soon" for the learner

## Goal

Interactive alphabet/character learning: show characters in a grid, click to learn stroke order, pronunciation, and example words.

## Requirements

- Character grid from `languageConfig.alphabet.characters` or `alphabets[]`
- Click a character → detail panel: pronunciation, stroke order hint, example word
- Quiz mode: show a character, pick the romanization (or reverse)
- Support multiple scripts: Hangul, Hiragana, Katakana (via `:alphabetId` param)
- Track which characters are "learned"

## Data

- Characters come from `languageConfig.ts` (already defined for ko, ja)
- Need pronunciation/romanization map: create `src/data/alphabets/hangul.json`, `hiragana.json`, `katakana.json`
- Type: `{ character, romanization, pronunciation?, exampleWord?, exampleMeaning? }`

## UI reference

- Grid of characters (5-6 columns)
- Selected character detail card (side panel or modal)
- Quiz mode: centered card with 4-choice buttons

## i18n

- Add `practice.alphabet.*` keys

## Acceptance criteria

- [ ] Character grid renders for Hangul, Hiragana, Katakana
- [ ] Clicking a character shows detail
- [ ] Quiz mode with at least multiple-choice
- [ ] `npm run build` passes
