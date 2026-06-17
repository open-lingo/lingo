import { describe, it, expect } from "vitest";
import { countCardStates } from "./practiceStats";
import type { SRSCardState, SRSModalityState } from "@/features/flashcards/data/types";

/** Build a modality sub-state with the fields the predicates read. */
function sub(over: Partial<SRSModalityState> = {}): SRSModalityState {
  return {
    stability: 0,
    difficulty: 5,
    state: "new",
    interval: 0,
    dueDate: "2026-06-16",
    lastReviewDate: "2026-06-16",
    reps: 0,
    lapses: 0,
    ...over,
  };
}

function card(rec: Partial<SRSModalityState>, prod: Partial<SRSModalityState>): SRSCardState {
  return { recognition: sub(rec), production: sub(prod) };
}

describe("countCardStates", () => {
  it("buckets deck cards by SRS state vs the stored store", () => {
    const ids = ["a", "b", "c", "d", "e"] as const;
    const store: Record<string, SRSCardState> = {
      // a: never graded (reps 0/0) → new
      a: card({ reps: 0 }, { reps: 0 }),
      // b: graded but below mastery interval (21d) in one modality → learning
      b: card({ reps: 3, interval: 5 }, { reps: 2, interval: 30 }),
      // c: both modalities mature (interval ≥ 21) → review
      c: card({ reps: 5, interval: 40 }, { reps: 5, interval: 25 }),
      // (d, e have no store entry → yet to learn)
    };

    const counts = countCardStates(ids, store);

    expect(counts.total).toBe(5);
    expect(counts.new).toBe(1);
    expect(counts.learning).toBe(1);
    expect(counts.review).toBe(1);
    expect(counts.yetToLearn).toBe(2);
    expect(counts.seen).toBe(3); // new + learning + review
  });

  it("returns an all-yet-to-learn breakdown for an empty store", () => {
    const counts = countCardStates(["x", "y"], {});
    expect(counts).toMatchObject({ new: 0, learning: 0, review: 0, yetToLearn: 2, total: 2, seen: 0 });
  });

  it("handles an empty deck", () => {
    const counts = countCardStates([], {});
    expect(counts).toMatchObject({ total: 0, seen: 0, yetToLearn: 0 });
  });
});
