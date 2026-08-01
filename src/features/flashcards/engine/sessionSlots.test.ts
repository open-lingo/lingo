import { describe, it, expect, beforeEach } from "vitest";
import { buildSessionSlots, requeueReason } from "./sessionSlots";
import {
  setCardState,
  getCardState,
  clearSRSStore,
  getSRSStore,
} from "./srsStorage";
import {
  createInitialState,
  reviewCard,
  getDueModalities,
  addDays,
  getToday,
} from "./srs";
import type { Flashcard, SRSCardState } from "../data/types";

const card = (id: string): Flashcard => ({
  id,
  front: id,
  back: id,
  type: "word",
});

/** State with explicit per-modality due dates (relative days from today). */
function stateDue(recognitionDay: number, productionDay: number): SRSCardState {
  const s = createInitialState();
  s.recognition.dueDate = addDays(getToday(), recognitionDay);
  s.production.dueDate = addDays(getToday(), productionDay);
  s.recognition.reps = 1;
  s.production.reps = 1;
  return s;
}

describe("buildSessionSlots", () => {
  beforeEach(() => clearSRSStore());

  it("gives a both-due card one slot per due modality", () => {
    setCardState("a", stateDue(0, 0));
    const slots = buildSessionSlots([card("a")], getSRSStore());
    expect(slots.map((s) => s.modality)).toEqual(["recognition", "production"]);
    expect(slots.every((s) => s.card.id === "a")).toBe(true);
  });

  it("defers the second modality behind every other card's first pass", () => {
    setCardState("a", stateDue(0, 0));
    setCardState("b", stateDue(0, 5));
    const slots = buildSessionSlots([card("a"), card("b")], getSRSStore());
    expect(slots.map((s) => `${s.card.id}:${s.modality}`)).toEqual([
      "a:recognition",
      "b:recognition",
      "a:production",
    ]);
  });

  it("gives a never-studied card a single recognition slot", () => {
    // No stored state: production is staggered days out, so only recognition
    // is due — one slot, not two.
    const slots = buildSessionSlots([card("new")], getSRSStore());
    expect(slots).toHaveLength(1);
    expect(slots[0].modality).toBe("recognition");
  });

  it("uses the production slot when only production is due", () => {
    setCardState("a", stateDue(5, 0));
    const slots = buildSessionSlots([card("a")], getSRSStore());
    expect(slots.map((s) => s.modality)).toEqual(["production"]);
  });

  it("falls back to a single recognition slot for not-yet-due cards", () => {
    // Free-review sessions surface cards that aren't due in either direction.
    setCardState("a", stateDue(3, 9));
    const slots = buildSessionSlots([card("a")], getSRSStore());
    expect(slots).toHaveLength(1);
    expect(slots[0].modality).toBe("recognition");
  });

  it("emits no duplicate slot for a card listed twice", () => {
    setCardState("a", stateDue(0, 0));
    const slots = buildSessionSlots([card("a"), card("a")], getSRSStore());
    expect(slots).toHaveLength(2);
  });
});

describe("requeueReason", () => {
  it("requeues a Good-graded new card that is still on a same-day learning step", () => {
    // The reported bug: a brand-new word graded Good lands on FSRS's 10-minute
    // learning step, so it is STILL due today — but only Again/Hard used to be
    // re-shown, so the session ended with the word still owed.
    const next = reviewCard(createInitialState(), "recognition", "good");
    expect(next.recognition.state).toBe("learning");
    expect(requeueReason(next, "recognition", "good")).toBe("learning");
  });

  it("does not requeue once the card graduates out of today", () => {
    let s = reviewCard(createInitialState(), "recognition", "good");
    s = reviewCard(s, "recognition", "good");
    expect(s.recognition.state).toBe("review");
    expect(requeueReason(s, "recognition", "good")).toBeNull();
  });

  it("does not requeue an Easy grade", () => {
    const next = reviewCard(createInitialState(), "recognition", "easy");
    expect(requeueReason(next, "recognition", "easy")).toBeNull();
  });

  it("still reports Again/Hard as an 'again' requeue", () => {
    const again = reviewCard(createInitialState(), "recognition", "again");
    expect(requeueReason(again, "recognition", "again")).toBe("again");
    const hard = reviewCard(createInitialState(), "recognition", "hard");
    expect(requeueReason(hard, "recognition", "hard")).toBe("again");
  });

  it("ignores the OTHER modality's due state", () => {
    // Production is due today too (placement-seeded card), but grading
    // recognition Good out to a future date must not requeue recognition —
    // production has its own slot.
    const seeded = createInitialState();
    seeded.production.dueDate = getToday();
    let s = reviewCard(seeded, "recognition", "good");
    s = reviewCard(s, "recognition", "good");
    expect(requeueReason(s, "recognition", "good")).toBeNull();
  });
});

/**
 * End-to-end guard for the reported bug: "recognition happens, it says I'm
 * done, then I come back and there are more cards for production."
 *
 * Simulates the reviewer loop (build slots → grade each → requeue what the
 * scheduler still wants today) and asserts the session cannot end with due
 * reviews outstanding.
 */
describe("a finished session owes nothing", () => {
  beforeEach(() => clearSRSStore());

  function runSession(cards: Flashcard[], rating: "good" | "easy") {
    const slots = buildSessionSlots(cards, getSRSStore());
    let i = 0;
    let guard = 0;
    while (i < slots.length) {
      if (guard++ > 200) throw new Error("session did not converge");
      const { card: c, modality } = slots[i];
      const current = getCardState(c.id) ?? createInitialState();
      const next = reviewCard(current, modality, rating);
      setCardState(c.id, next);
      if (requeueReason(next, modality, rating)) {
        slots.push({ card: c, modality });
      }
      i++;
    }
    return slots;
  }

  it("clears a placement-seeded card that is due in BOTH directions", () => {
    // `createPlacementSeedState` seeds both modalities due today (no stagger),
    // which is the state that used to strand production reviews.
    setCardState("a", stateDue(0, 0));
    runSession([card("a")], "good");
    expect(getDueModalities(getCardState("a")!)).toEqual([]);
  });

  it("clears a brand-new card despite same-day learning steps", () => {
    runSession([card("fresh")], "good");
    expect(getDueModalities(getCardState("fresh")!)).toEqual([]);
  });

  it("clears a mixed queue of new and both-due cards", () => {
    setCardState("both", stateDue(0, 0));
    setCardState("recOnly", stateDue(0, 6));
    const cards = [card("both"), card("recOnly"), card("fresh")];
    runSession(cards, "good");
    for (const c of cards)
      expect(getDueModalities(getCardState(c.id)!)).toEqual([]);
  });
});
