import { describe, it, expect, beforeEach } from "vitest";
import {
  buildReviewQueue,
  countCardsDue,
  adaptiveNewCardsPerDay,
} from "./reviewQueue";
import { setCardState, clearSRSStore } from "./srsStorage";
import { createInitialState } from "./srs";
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
