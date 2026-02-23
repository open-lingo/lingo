# Task: SRS Viewer Redesign

**Files:** `src/features/flashcards/FlashcardTester.tsx`, `src/features/flashcards/engine/reviewQueue.ts`, `useSubscriptionQueue.ts`
**Current state:** Progress shows `index + 1 / allCards.length` — implies fixed card count. But `allCards` grows as "Again" cards are appended to `repeatCards`. No breakdown of new vs review vs failed. Buried exists in SRS but no session buried counter.

## Goal

Redesign the SRS viewer to show accurate, meaningful counts:
- **New card count** — Cards introduced this session (never seen before)
- **Reviewable count** — Cards due for review (had SRS state, due today)
- **Failed reviewable count** — Cards that scored "Again" and will be re-shown this session
- **Buried counter (session)** — Cards buried during this session (if user can bury from tester)

The queue is dynamic: as users hit "Again", `repeatCards` grows. The UI should reflect this.

## Current behavior

- `queue.review` = due cards
- `queue.newCards` = new cards (capped per day)
- `queue.queue` = `[...review, ...newCards]`
- `repeatCards` = cards rated "Again" appended for re-review
- `allCards = [...queue.queue, ...repeatCards]` — grows during session

## Requirements

### Count display
- Replace `index + 1 / allCards.length` with a clearer breakdown
- Show: New | Review | Again (failed) | Buried (if applicable)
- Example: `New: 3 · Review: 12 · Again: 2` or similar
- Progress bar: can show "completed in queue" vs "remaining" — but remaining grows with Again, so consider a different metaphor (e.g. "Reviewed: X" instead of "X of Y")

### Buried
- `buriedUntil` exists in SRS; CardManager has bury/unbury
- Session buried counter: if we add "Bury" button to FlashcardTester, track how many buried this session
- Or: skip buried in tester for now, just show the other counts

### UX
- Don't imply "Y cards left" when Y can increase (Again)
- Prefer: "Reviewed: N" + "New: X · Due: Y · Again: Z"
- Or: show counts at start of session and update "Again" as it grows

## Acceptance criteria

- [ ] Count display: New, Review, Again (failed) visible
- [ ] Progress/position indicator does not imply fixed total (or clarifies that Again adds more)
- [ ] Optional: Buried counter if bury-from-tester is added
- [ ] i18n keys for all labels
- [ ] `npm run build` passes

## Files

- `src/features/flashcards/FlashcardTester.tsx`
- `src/features/flashcards/useSubscriptionQueue.ts` (queue shape)
- `src/features/flashcards/engine/reviewQueue.ts` (already has dueCount, newCount)
- `src/shared/i18n/locales/en.json`, `ko.json`

## Notes

`useSubscriptionQueue` returns `queue` from `buildQueueFromSubscriptions`. The queue has `dueCount`, `newCount`, `totalCount`. We need to expose "Again" count — that's `repeatCards.length` in session state. For "buried this session" we'd need to add bury UI and session state.
