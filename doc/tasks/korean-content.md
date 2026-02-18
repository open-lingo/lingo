# Task: Korean Content Expansion

**Area:** `src/data/`
**Current state:** Partial — 5 flashcards, 8 particles, 6 stories

## Goal

Expand Korean content to be usable for actual learning.

## Requirements

### Flashcards (`src/data/flashcards/ko-beginner.json`)
- Expand to 30-50 cards covering: greetings, self-intro, numbers (native + sino), colors, family, food
- Each card: front (Korean), back (English), type, reasoning, parts/words with particle IDs
- Include Hangul reading notes where helpful

### Particles (`src/data/particles/ko.json`)
- Already has 8 particles (은/는, 이/가, 을/를, 에, 에서, 의, 와/과, 세요)
- Add: 도 (also), 부터 (from), 까지 (until), 로/으로 (by means of), 한테/에게 (to person), 보다 (than)
- Add practice sentences: `src/data/particles/ko-sentences.json`

### Stories (`src/features/stories/storiesData.ts`)
- Currently 3 course + 3 community stories
- Expand to 6 course + 5 community
- Add variety: transportation, restaurant, shopping, hospital, phone call

### Vocab lists
- Create `src/data/vocab/ko-vocab.json` with themed lists
- Themes: greetings, numbers (native + sino), family, food, travel, school, shopping

## Acceptance criteria

- [ ] 30+ flashcards with proper parts/words structure
- [ ] 14+ particles with usage notes
- [ ] Practice sentences for particle drill
- [ ] 11+ stories
- [ ] Vocab lists with 6+ themes
- [ ] All data loads without errors
