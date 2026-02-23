# Agent Context: SRS Viewer Redesign

**Copy this entire document** and give it to the AI agent. It contains everything needed to implement the task.

---

## Task

Redesign the flashcard review (SRS) viewer to show accurate counts: **New**, **Review**, **Again** (failed), and optionally **Buried**. The current UI shows `index + 1 / allCards.length`, which implies a fixed total — but `allCards` grows when users hit "Again" (cards are re-queued for the session).

---

## Project context

- **Stack:** Vite + React, Tailwind, react-i18next
- **Routes:** FlashcardTester at `/:lang/practice/flashcards/review`
- **i18n:** All strings via `t("key")`. Add keys to `en.json` and `ko.json` in `src/shared/i18n/locales/`

---

## Current behavior

**FlashcardTester** (`src/features/flashcards/FlashcardTester.tsx`):

1. **Queue:** From `useSubscriptionQueue(languageId, queueVersion)`. Returns `queue` of type `ReviewQueue`:
   - `queue.review` — due cards (had SRS state, due today)
   - `queue.newCards` — new cards (never seen)
   - `queue.queue` — `[...review, ...newCards]`
   - `queue.dueCount`, `queue.newCount`, `queue.totalCount`

2. **Session state:**
   - `allCards = [...queue.queue, ...repeatCards]`
   - `repeatCards` — cards rated "Again" are appended here (they get re-shown at end of session)
   - So `allCards.length` **grows** as user hits "Again"

3. **Current UI (lines ~313–331):**
   - `{index + 1} / {allCards.length}` — misleading (total changes)
   - Progress bar: `width: (index / allCards.length) * 100` — also misleading

4. **Rating flow:** When user flips and rates, `handleRate()`:
   - Calls `reviewCard()` and `setCardState()`
   - If `shouldRepeatInSession(rating)` (i.e. "Again" or "Hard"), appends card to `repeatCards`
   - Increments `index`; `sessionStats.reviewed` and `sessionStats.correct` updated

---

## Requirements

### Count display

Replace `index + 1 / allCards.length` with a breakdown:

- **New:** `queue.newCount` — new cards in today's queue (static for session)
- **Review:** `queue.dueCount` — due cards (static for session)
- **Again:** `repeatCards.length` — failed this session, will be re-shown (grows as user hits Again)
- **Buried:** Optional. SRS supports `buriedUntil`; CardManager has bury. For this task, you can skip buried or add a simple "0 buried" if bury-from-tester isn't in scope.

### Don't imply fixed total

- Avoid "X of Y cards" when Y can increase
- Prefer: **"Reviewed: N"** + **"New: X · Due: Y · Again: Z"**
- Or: "New: 3 | Review: 12 | Again: 2" with "Reviewed: 5" as session progress

### Progress bar

- Option A: Show "Reviewed" count (what's done) instead of fraction
- Option B: Progress bar for "queue completed" — but queue grows with Again, so maybe show "Session: X reviewed" instead of a bar
- Option C: Keep a bar but base it on initial queue size; Again cards could be a separate visual (e.g. "+2 again")

---

## Key code locations

**FlashcardTester.tsx:**
- Lines 144–184: `queue`, `allCards`, `repeatCards`, `index`, `sessionStats`, `handleRate`
- Lines 313–331: Count display and progress bar (replace these)
- `queue` has: `review`, `newCards`, `queue`, `dueCount`, `newCount`, `totalCount`, `cardIdToDefaultEase`

**useSubscriptionQueue** (`src/features/flashcards/useSubscriptionQueue.ts`):
- Returns `queue` from `buildQueueFromSubscriptions()`
- `ReviewQueue` type in `engine/reviewQueue.ts`

**engine/reviewQueue.ts:**
- `ReviewQueue`: `review`, `newCards`, `queue`, `dueCount`, `newCount`, `totalCount`, `cardIdToDefaultEase`
- `buildQueueFromSubscriptions` builds this from subscriptions + decks + SRS store

---

## Implementation approach

1. In FlashcardTester, you already have:
   - `queue?.dueCount`, `queue?.newCount` (initial counts)
   - `repeatCards.length` (Again count)
   - `sessionStats.reviewed` (how many rated so far)

2. Replace the count span (line ~319) with something like:
   ```
   Reviewed: {sessionStats.reviewed} · New: {queue.newCount} · Due: {queue.dueCount} · Again: {repeatCards.length}
   ```
   Or a more compact layout (e.g. badges, or "N new | M review | K again").

3. Replace or rethink the progress bar. Options:
   - Remove it and use text "Reviewed: X"
   - Or: bar = sessionStats.reviewed / (initial queue total) with "+Again" indicator
   - Or: segmented bar (done | new | due | again)

4. Add i18n keys: `flashcards.reviewed`, `flashcards.newCount`, `flashcards.reviewCount`, `flashcards.againCount` (or similar)

---

## Files to edit

| File | Purpose |
|------|---------|
| `src/features/flashcards/FlashcardTester.tsx` | Replace count display and progress bar; add new/ due/again breakdown |
| `src/shared/i18n/locales/en.json` | Keys for new labels |
| `src/shared/i18n/locales/ko.json` | Korean translations |

---

## Acceptance criteria

- [ ] Count display shows: New, Review (Due), Again — with correct values
- [ ] Progress/position does not imply fixed total (or clearly indicates Again adds more)
- [ ] i18n for all new labels
- [ ] `npm run build` passes

---

## Conventions

- Tailwind for styling
- Use `t()` for all labels
- Existing keys: `flashcards.reviewed`, `flashcards.accuracy`, `flashcards.sessionDone`, etc. — add new keys under `flashcards.*`
