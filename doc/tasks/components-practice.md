# Task: Character Components Practice

**File:** `src/features/practice/ComponentsPracticePage.tsx`
**Route:** `/practice/components`
**Current state:** Stub — "coming soon"

## Goal

Break down kanji/hanzi into radicals and components. Show how characters are built from simpler parts.

## Requirements

- Show a kanji/hanzi character broken into its radicals
- Explain each radical's meaning
- "Build a character" mode: given radicals, pick which character they form
- Only for languages with `hasComponentBreakdown: true` (ja, zh)

## Data

- Create `src/data/components/ja-components.json`
- Type: `{ character, components: [{ radical, meaning, position }], mnemonic? }`

## UI reference

- Large character with visual breakdown
- Radicals shown as separate highlighted segments
- Quiz: "Which character uses these radicals?"

## i18n

- Add `practice.components.*` keys

## Acceptance criteria

- [ ] Shows character breakdown with radicals
- [ ] At least 10 characters with component data
- [ ] Quiz mode functional
- [ ] `npm run build` passes
