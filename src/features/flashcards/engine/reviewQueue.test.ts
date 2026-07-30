import { describe, it, expect, beforeEach } from "vitest";
import {
  buildReviewQueue,
  countCardsDue,
  adaptiveNewCardsPerDay,
  countRemainingNewCards,
  countRemainingDueCards,
  dueModalityBreakdown,
} from "./reviewQueue";
import { setCardState, clearSRSStore } from "./srsStorage";
import { createInitialState, reviewCard, addDays, getToday } from "./srs";
import type { Flashcard } from "../data/types";

/**
 * Guards the "visible backlog" wiring (retention Phase 1). The unseen
 * backlog is throttled to `newCardsPerDay`; `unseenTotal` exposes the full
 * pre-cap count so the UI can show "N more queued". If this regresses, the
 * throttle goes silent again (the gap the retention design flags).
 */
const card = (id: string): Flashcard => ({
  id,
  front: id,
  back: id,
  type: "word",
});

describe("buildReviewQueue — unseen backlog", () => {
  beforeEach(() => clearSRSStore());

  it("caps new cards but reports the full unseen backlog", () => {
    const cards = Array.from({ length: 10 }, (_, i) => card(`c-${i}`));
    // Seed 3 cards with state (fresh state is due today → review pile).
    for (let i = 0; i < 3; i++) setCardState(`c-${i}`, createInitialState());

    const q = buildReviewQueue(cards, 5);

    expect(q.dueCount).toBe(3); // seeded + due
    expect(q.unseenTotal).toBe(7); // 10 - 3 seeded
    expect(q.newCount).toBe(5); // capped at newCardsPerDay
    // Backlog behind today's allotment = 7 - 5 = 2 (what the UI surfaces).
    expect(q.unseenTotal - q.newCount).toBe(2);
  });

  it("unseenTotal is 0 when every card has been studied", () => {
    const cards = Array.from({ length: 4 }, (_, i) => card(`s-${i}`));
    for (const c of cards) setCardState(c.id, createInitialState());
    const q = buildReviewQueue(cards, 5);
    expect(q.unseenTotal).toBe(0);
  });

  it("countCardsDue = due reviews + capped new intake (honest daily load)", () => {
    const cards = Array.from({ length: 12 }, (_, i) => card(`d-${i}`));
    for (let i = 0; i < 2; i++) setCardState(`d-${i}`, createInitialState());
    // explicit cap 5: 2 due + min(10 unseen, 5) = 7
    expect(countCardsDue(cards, 5)).toBe(7);
  });
});

describe("adaptiveNewCardsPerDay (Phase 2)", () => {
  it("returns the base when backlog is empty or small", () => {
    expect(adaptiveNewCardsPerDay(0)).toBe(5);
    expect(adaptiveNewCardsPerDay(50)).toBe(5); // ceil(50/21)=3 < base 5
  });

  it("scales up to drain a large backlog, capped to avoid flooding", () => {
    expect(adaptiveNewCardsPerDay(210)).toBe(10); // ceil(210/21)=10
    expect(adaptiveNewCardsPerDay(1000)).toBe(15); // capped at max
  });

  it("buildReviewQueue uses the adaptive cap when none is passed", () => {
    // 210 unseen, none studied → adaptive cap 10 (not the old fixed 5).
    const cards = Array.from({ length: 210 }, (_, i) => card(`a-${i}`));
    const q = buildReviewQueue(cards);
    expect(q.newCardsAllowed).toBe(10);
    expect(q.newCount).toBe(10);
    expect(q.unseenTotal).toBe(210);
  });

  it("buildReviewQueue still respects an explicit cap", () => {
    const cards = Array.from({ length: 210 }, (_, i) => card(`b-${i}`));
    const q = buildReviewQueue(cards, 5);
    expect(q.newCardsAllowed).toBe(5);
    expect(q.newCount).toBe(5);
  });
});

describe("live session counts (reviewer headline)", () => {
  beforeEach(() => clearSRSStore());

  it("counts a new card as new until it is graded, then drops it", () => {
    const newCards = [card("n-0"), card("n-1")];
    // Both unseen (no SRS state) → both still "new".
    expect(countRemainingNewCards(newCards)).toBe(2);

    // Introduce n-0: first grade transitions it new→learning.
    setCardState("n-0", reviewCard(createInitialState(), "recognition", "good"));
    expect(countRemainingNewCards(newCards)).toBe(1);

    // Introduce n-1 too → none remain new.
    setCardState("n-1", reviewCard(createInitialState(), "recognition", "again"));
    expect(countRemainingNewCards(newCards)).toBe(0);
  });

  it("drops a due card from the remaining-due tally once it is no longer due", () => {
    // Fresh state is due today (recognition dueDate = today) → in review pile.
    setCardState("d-0", createInitialState());
    const reviewCards = [card("d-0")];
    expect(countRemainingDueCards(reviewCards)).toBe(1);

    // Scheduled out past today on both modalities → no longer due.
    const scheduled = createInitialState();
    const future = addDays(getToday(), 5);
    scheduled.recognition.dueDate = future;
    scheduled.recognition.reps = 1;
    scheduled.production.dueDate = future;
    setCardState("d-0", scheduled);
    expect(countRemainingDueCards(reviewCards)).toBe(0);
  });

  it("breaks the due total into recognition vs production sub-states", () => {
    // createInitialState: recognition due today, production staggered +3d.
    setCardState("m-0", createInitialState());
    const b = dueModalityBreakdown([card("m-0")]);
    expect(b.recognition).toBe(1);
    expect(b.production).toBe(0);
  });
});
