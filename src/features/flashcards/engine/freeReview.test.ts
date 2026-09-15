import { describe, it, expect } from "vitest";
import { buildQueueFromSubscriptions, type DeckWithCards } from "./reviewQueue";
import { createInitialState, addDays, getToday, reviewCard } from "./srs";
import { canonicalize } from "./srsStorage";
import type { Flashcard, SRSCardState } from "../data/types";

function card(id: string): Flashcard {
  return { id, front: id, back: `${id}-back` } as Flashcard;
}

/**
 * A reviewed card whose next due date is `days` in the future (not due
 * today) AND whose last review was NOT today — realistic shape for "reviewed
 * a while ago, next due later." `createInitialState()` seeds `lastReviewDate`
 * to today (it's a never-reviewed seed date, not a real review), so this
 * must override it explicitly or every fixture card looks "reviewed today"
 * and the #113 same-day-exclusion swallows them all.
 */
function notDueState(days: number): SRSCardState {
  const base = createInitialState();
  const future = addDays(getToday(), days);
  const past = addDays(getToday(), -1);
  return {
    ...base,
    recognition: {
      ...base.recognition,
      reps: 1,
      interval: days,
      dueDate: future,
      lastReviewDate: past,
      state: "review",
    },
    production: {
      ...base.production,
      reps: 1,
      interval: days,
      dueDate: future,
      lastReviewDate: past,
      state: "review",
    },
  };
}

describe("free review (extra practice)", () => {
  const decks: DeckWithCards[] = [
    { id: "deck-1", cards: [card("a"), card("b"), card("c")] },
  ];
  const subs = [{ contentId: "deck-1", newCardsPerDay: 0, newCardOrder: "ordered" as const }];

  it("surfaces nothing extra when free is off and nothing is due", () => {
    const store: Record<string, SRSCardState> = {
      [canonicalize("a")]: notDueState(3),
      [canonicalize("b")]: notDueState(5),
      [canonicalize("c")]: notDueState(10),
    };
    const q = buildQueueFromSubscriptions(subs, decks, store, { free: false });
    expect(q.totalCount).toBe(0);
    expect(q.extraCount ?? 0).toBe(0);
  });

  it("pulls not-yet-due cards (soonest first) when free is on", () => {
    const store: Record<string, SRSCardState> = {
      [canonicalize("a")]: notDueState(10),
      [canonicalize("b")]: notDueState(3),
      [canonicalize("c")]: notDueState(5),
    };
    const q = buildQueueFromSubscriptions(subs, decks, store, { free: true });
    expect(q.dueCount).toBe(0);
    expect(q.newCount).toBe(0);
    expect(q.extraCount).toBe(3);
    // Soonest-due first: b (3) < c (5) < a (10).
    expect(q.queue.map((c) => c.id)).toEqual(["b", "c", "a"]);
  });

  it("reports notYetDueCount so the UI can hide a no-op free-review CTA", () => {
    // No SRS state at all + newCardsPerDay 0 => nothing due, nothing new,
    // and nothing reviewed-but-not-due. The free-review button would be a
    // silent no-op, so notYetDueCount must be 0.
    const emptyStore: Record<string, SRSCardState> = {};
    const q0 = buildQueueFromSubscriptions(subs, decks, emptyStore, { free: true });
    expect(q0.notYetDueCount).toBe(0);
    expect(q0.totalCount).toBe(0);

    // With reviewed-but-not-due cards present, the count is non-zero even
    // when free is off (so the completion screen can decide before flipping).
    const seenStore: Record<string, SRSCardState> = {
      [canonicalize("a")]: notDueState(3),
      [canonicalize("b")]: notDueState(5),
    };
    const q1 = buildQueueFromSubscriptions(subs, decks, seenStore, { free: false });
    expect(q1.notYetDueCount).toBe(2);
  });

  it("does NOT add extras when real reviews are due (free is a fallback only)", () => {
    const store: Record<string, SRSCardState> = {
      // 'a' is due today.
      [canonicalize("a")]: createInitialState(),
      [canonicalize("b")]: notDueState(5),
      [canonicalize("c")]: notDueState(8),
    };
    // 'a' has reps 0 → it's an unseen/new card, so give it explicit due state.
    store[canonicalize("a")] = (() => {
      const s = createInitialState();
      return {
        ...s,
        recognition: { ...s.recognition, reps: 1, dueDate: getToday(), state: "review" },
        production: { ...s.production, reps: 1, dueDate: getToday(), state: "review" },
      };
    })();
    const q = buildQueueFromSubscriptions(subs, decks, store, { free: true });
    expect(q.dueCount).toBe(1);
    expect(q.extraCount ?? 0).toBe(0);
  });

  // TestFlight b13 #113 (Spencer): a card graded "Good"/"Easy" today (first
  // try, not due again for days) must NOT resurface today via the free/
  // extra-practice backfill — Anki parity: only cards still genuinely due
  // (Again/Hard, looping within the day) reappear same-day.
  it("does not resurface a card graded today, even as free-review backfill (#113)", () => {
    // Simulate a real reviewer grade: reviewCard() stamps today's review.
    // A single "Good" leaves a brand-new card on a same-day learning step
    // (dueDate == today, genuinely still `isDue` — real, expected Anki
    // behavior, not this bug). Two "Good" grades graduate it out of
    // learning to a multi-day interval, matching what Spencer actually saw:
    // a card "first try marked" and graded again shortly after, now due in
    // 2 days — but the free-review backfill still pulled it back in.
    let gradedToday = createInitialState();
    gradedToday = reviewCard(gradedToday, "recognition", "good", new Date());
    gradedToday = reviewCard(gradedToday, "recognition", "good", new Date());
    const store: Record<string, SRSCardState> = {
      [canonicalize("a")]: gradedToday, // reviewed today, not due today
      [canonicalize("b")]: notDueState(30), // reviewed days ago, also not due today
    };
    const q = buildQueueFromSubscriptions(subs, decks, store, { free: true });
    expect(q.queue.map((c) => c.id)).not.toContain("a");
    expect(q.extraCount ?? 0).toBe(1);
  });
});
