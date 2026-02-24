# Task: Japanese Content Expansion

**Area:** `src/features/flashcards/data/`, `src/features/practice/data/`
**Current state:** Stub — 5 flashcards, 8 particles, 6 stories

**See also:** `doc/FLASHCARD-DATA.md` (vocab manifest, lesson→card mapping), `src/features/flashcards/data/lessonCardMap.ts` (lesson introduces cardIds).

## Goal

Expand Japanese content to be usable for actual learning, not just a demo.

## Requirements

### Flashcards (`src/features/flashcards/data/ja-beginner.json`)
- Expand to 30-50 cards covering: greetings, self-intro, numbers 1-10, colors, family, food
- Draw from Japanese Core 2k + survival phrases (see FLASHCARD-DATA.md vocab selection strategy)
- Each card: front (Japanese), back (English), type, reasoning, parts/words with particle IDs
- Include mix of word, sentence, and other types
- Update `lessonCardMap.ts` (LESSON_TO_CARDS.ja) so new lessons introduce the new cards

### Particles (`src/features/practice/data/ja.json`)
- Already has 8 basic particles (は, が, を, に, で, の, と, か)
- Add: も (also), から (from), まで (until), へ (towards), よ (emphasis), ね (confirmation)
- Add practice sentences: `src/features/practice/data/ja-sentences.json`

### Stories (API — `GET /stories/browse`)
- Currently 3 course + 2 community stories for ja
- Expand to 5 course + 4 community
- Add variety: daily life, travel, school, work, food

### Vocab lists
- Create `src/features/vocab/data/ja-vocab.json` with themed lists
- Themes: greetings, numbers, family, food, travel, school
- Consider module vocab manifests (see FLASHCARD-DATA.md) — modules own their vocab; lessons introduce subsets
- **Selection strategy (FLASHCARD-DATA.md):** Use Japanese Core 2k frequency list + everyday words + conversation/survival phrase frequency (greetings, directions, requests, emergencies, shopping, food ordering)

## Acceptance criteria

- [ ] 30+ flashcards with proper parts/words structure
- [ ] 12+ particles with usage notes
- [ ] Practice sentences for particle drill
- [ ] 9+ stories
- [ ] Vocab lists with 5+ themes
- [ ] All data loads without errors
