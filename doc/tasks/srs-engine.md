# Task: SRS Engine (Spaced Repetition)

**Files:** `src/features/flashcards/`, new `src/engine/srs.ts`
**Current state:** Flashcards exist but no scheduling — all cards shown every time

## Goal

Implement Anki-style spaced repetition scheduling so "cards due today" is real and cards are shown at optimal intervals.

## Requirements

### Core algorithm
- SM-2 or simplified variant
- Per-card state: `{ easeFactor, interval, dueDate, repetitions, lastReviewDate }`
- After review: user rates Easy / Good / Hard / Again
- Compute next interval and due date

### Integration
- `getCardsDueToday(languageId)` → cards where `dueDate <= today`
- `reviewCard(cardId, rating)` → update card state
- Hook into `ProgressSummary` "cards due today" count
- Hook into `FlashcardTester` review flow

### Storage
- localStorage for now (same pattern as settings)
- Type: `Record<cardId, SRSCardState>`
- Migrate to backend later (see `backend-progress-api.md`)

## Files to create/edit

- `src/engine/srs.ts` — core algorithm (pure functions, no React)
- `src/engine/srsStorage.ts` — localStorage read/write
- `src/features/flashcards/FlashcardTester.tsx` — add rating buttons, call SRS on review
- `src/features/progress/ProgressSummary.tsx` — wire "cards due today" to real count

## Acceptance criteria

- [ ] SM-2 or equivalent algorithm implemented with tests
- [ ] Cards shown in due order
- [ ] Rating buttons (Easy/Good/Hard/Again) after flip
- [ ] "Cards due today" reflects real SRS state
- [ ] New cards introduced at configurable rate (e.g. 5/day)
- [ ] `npm run build` passes
