# Task: Japanese Content Expansion

**Area:** `src/data/`
**Current state:** Stub — 5 flashcards, 8 particles, 6 stories

## Goal

Expand Japanese content to be usable for actual learning, not just a demo.

## Requirements

### Flashcards (`src/data/flashcards/ja-beginner.json`)
- Expand to 30-50 cards covering: greetings, self-intro, numbers 1-10, colors, family, food
- Each card: front (Japanese), back (English), type, reasoning, parts/words with particle IDs
- Include mix of word, sentence, and other types

### Particles (`src/data/particles/ja.json`)
- Already has 8 basic particles (は, が, を, に, で, の, と, か)
- Add: も (also), から (from), まで (until), へ (towards), よ (emphasis), ね (confirmation)
- Add practice sentences: `src/data/particles/ja-sentences.json`

### Stories (`src/features/stories/storiesData.ts`)
- Currently 3 course + 2 community stories for ja
- Expand to 5 course + 4 community
- Add variety: daily life, travel, school, work, food

### Vocab lists
- Create `src/data/vocab/ja-vocab.json` with themed lists
- Themes: greetings, numbers, family, food, travel, school

## Acceptance criteria

- [ ] 30+ flashcards with proper parts/words structure
- [ ] 12+ particles with usage notes
- [ ] Practice sentences for particle drill
- [ ] 9+ stories
- [ ] Vocab lists with 5+ themes
- [ ] All data loads without errors
