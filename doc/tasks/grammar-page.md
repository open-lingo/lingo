# Task: Grammar Page

**File:** `src/features/grammar/GrammarPage.tsx`
**Route:** `/grammar`
**Current state:** Stub — "coming soon"

## Goal

Grammar reference and practice: heatmap of grammar topics, sentence builder, and explanations.

## Requirements

### Grammar Heatmap
- Grid of grammar topics (e.g. particles, verb conjugation, honorifics, counters)
- Color-coded by mastery: red (new) → yellow → green (mastered)
- Click a topic → detail with explanation and examples

### Sentence Builder (stretch)
- Drag-and-drop or select words to build a grammatically correct sentence
- Feedback on word order and particle usage

### Reference
- Expandable sections per grammar point
- Examples with translation and breakdown

## Data

- Create `src/data/grammar/ko-grammar.json` and `ja-grammar.json`
- Type: `{ id, topic, description, examples: [{ sentence, translation, breakdown }], mastery: 0-100 }`

## UI reference

- Heatmap: grid of colored cells (like GitHub contribution graph)
- Detail: card with explanation + example sentences
- Sentence builder: horizontal slots for word tiles

## i18n

- Add `grammar.*` keys: title, subtitle, heatmap, topics, mastery levels

## Acceptance criteria

- [ ] Heatmap renders with grammar topics for ko and ja
- [ ] Click a topic → shows explanation and examples
- [ ] At least 8 grammar topics per language in mock data
- [ ] `npm run build` passes
