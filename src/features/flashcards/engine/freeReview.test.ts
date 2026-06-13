import { describe, it, expect } from "vitest";
import { buildQueueFromSubscriptions, type DeckWithCards } from "./reviewQueue";
import { createInitialState, addDays, getToday } from "./srs";
import { canonicalize } from "./srsStorage";
import type { Flashcard, SRSCardState } from "../data/types";

function card(id: string): Flashcard {
  return { id, front: id, back: `${id}-back` } as Flashcard;
}

/** A reviewed card whose next due date is `days` in the future (not due today). */
function notDueState(days: number): SRSCardState {
  const base = createInitialState();
  const future = addDays(getToday(), days);
  return {
    ...base,
    recognition: { ...base.recognition, reps: 1, interval: days, dueDate: future, state: "review" },
    production: { ...base.production, reps: 1, interval: days, dueDate: future, state: "review" },
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
});
