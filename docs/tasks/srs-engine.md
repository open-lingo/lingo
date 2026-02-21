# Task: SRS Engine (Spaced Repetition)

**Status: DONE** (2025-02-19)

**Files:** `src/features/flashcards/engine/` (srs.ts, srsStorage.ts, reviewQueue.ts, srsSync.ts)
**Current state:** SM-2 implemented; FlashcardTester has rating buttons; ProgressSummary shows cards due; SRS sync with backend.

**See also:** `doc/FLASHCARD-DATA.md` (course deck unlock by lesson completion).

## Goal

Implement Anki-style spaced repetition scheduling so "cards due today" is real and cards are shown at optimal intervals.

## Requirements

### Core algorithm
- SM-2 or simplified variant
- Per-card state: `{ easeFactor, interval, dueDate, repetitions, lastReviewDate }`
- After review: user rates Easy / Good / Hard / Again
- Compute next interval and due date

### Integration
- `getCardsDueToday(languageId, completedLessonIds?)` → cards where `dueDate <= today` **and** card is unlocked (for course decks)
- Use `getDeckForPractice(languageId, completedLessonIds)` so only unlocked cards are in the pool
- `reviewCard(cardId, rating)` → update card state
- Hook into `ProgressSummary` "cards due today" count
- Hook into `FlashcardTester` review flow

### Course decks
- Only schedule cards that are unlocked (introduced by completed lessons)
- Community decks: all cards available for scheduling

### Storage
- localStorage for now (same pattern as settings)
- Type: `Record<cardId, SRSCardState>`
- Migrate to backend later (see `backend-progress-api.md`)

## Files to create/edit

- `src/features/flashcards/engine/srs.ts` — core algorithm (pure functions, no React)
- `src/features/flashcards/engine/srsStorage.ts` — localStorage read/write
- `src/features/flashcards/FlashcardTester.tsx` — add rating buttons, call SRS on review
- `src/features/flashcards/FlashcardsPage.tsx` — already uses `getDeckForPractice`; ensure SRS respects it
- `src/features/progress/ProgressSummary.tsx` — wire "cards due today" to real count (unlocked cards only for course decks)

## Acceptance criteria

- [x] SM-2 or equivalent algorithm implemented with tests
- [x] Cards shown in due order
- [x] Rating buttons (Easy/Good/Hard/Again) after flip
- [x] "Cards due today" reflects real SRS state; course deck count excludes locked cards
- [x] New cards introduced at configurable rate (e.g. 5/day) from unlocked pool only
- [x] `npm run build` passes
