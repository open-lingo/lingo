# Task: Story Content & Reader

**File:** `src/features/stories/StoryDetailPage.tsx`
**Route:** `/stories/:storyId`
**Current state:** Shows story metadata but placeholder for content body

## Goal

Build a story reader with interactive learning features: highlighted vocab, inline translation, comprehension questions.

## Requirements

### Story Reader
- Render story text with paragraphs
- Tap/hover a word → popup with meaning, reading, part of speech
- Highlighted words: particles in one color, vocab in another (like flashcard highlight mode)
- Toggle: show/hide furigana (Japanese) or romanization

### Comprehension
- After reading: 2-3 multiple-choice comprehension questions
- Score and explanation

### Data
- Create `src/data/stories/` with full story content per story ID
- Type: `{ storyId, paragraphs: [{ text, words: [{ segment, meaning?, particleId?, isVocab? }] }], questions: [{ question, options, correctIndex, explanation }] }`
- Start with 1-2 stories for Korean, 1 for Japanese

## UI reference

- Clean reading layout (max-w-2xl, prose styling)
- Word popup: small card below/above word (like tooltip)
- Questions: cards below story text

## i18n

- Add `stories.reader.*` keys: showFurigana, hideTranslation, comprehension, checkAnswers

## Acceptance criteria

- [ ] Story renders with interactive word highlights
- [ ] Word tap shows meaning popup
- [ ] At least 1 story with full content for ko and ja
- [ ] Comprehension questions work
- [ ] `npm run build` passes
