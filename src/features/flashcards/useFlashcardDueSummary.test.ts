/**
 * Week-review sparkline id matching.
 *
 * SRS store keys are always canonical (`<lang>:<bare>`). The hook built its id
 * set from RAW card ids, so bundled deck cards (`n5-1`) matched nothing and
 * every subscription-deck review was dropped from the count — while course-deck
 * cards, which already carry canonical atom ids, were counted. The result was a
 * partial undercount that looks like a plausible number instead of an obvious
 * zero, and it disagreed with the retention stat rendered beside it (which
 * canonicalized correctly).
 */
import { describe, it, expect } from "vitest";
import { computeWeekReviews } from "./useFlashcardDueSummary";
import { canonicalizeCardId } from "./engine/srsStorage";
import { getToday, addDays } from "./engine/srs";
import type { SRSStore } from "./engine";
import type { SRSCardState, SRSModalityState } from "./data/types";

function sub(overrides: Partial<SRSModalityState> = {}): SRSModalityState {
  return {
    stability: 5,
    difficulty: 4,
    state: "review",
    interval: 10,
    dueDate: getToday(),
    lastReviewDate: getToday(),
    reps: 3,
    lapses: 0,
    ...overrides,
  };
}

function card(lastReviewDate: string): SRSCardState {
  return {
    recognition: sub({ lastReviewDate }),
    production: sub({ lastReviewDate }),
  };
}

describe("computeWeekReviews", () => {
  it("counts reviews for a BARE-id deck card once its id is canonicalized", () => {
    // The regression: `n5-1` is stored under `ja:n5-1`, so a raw-id set misses it.
    const store: SRSStore = { "ja:n5-1": card(getToday()) };

    const raw = computeWeekReviews(store, new Set(["n5-1"]));
    expect(raw[6]).toBe(0); // what the bug produced

    const canonical = computeWeekReviews(
      store,
      new Set(["n5-1"].map(canonicalizeCardId)),
    );
    expect(canonical[6]).toBe(2); // both modalities reviewed today
  });

  it("still counts already-canonical course-deck ids", () => {
    const store: SRSStore = { "ja:atom-7": card(getToday()) };
    const counts = computeWeekReviews(
      store,
      new Set(["ja:atom-7"].map(canonicalizeCardId)),
    );
    expect(counts[6]).toBe(2);
  });

  it("buckets a review by day and ignores anything outside the window", () => {
    const store: SRSStore = {
      "ja:a": card(addDays(getToday(), -2)),
      "ja:b": card(addDays(getToday(), -30)), // older than the 7-day window
    };
    const counts = computeWeekReviews(
      store,
      new Set(["ja:a", "ja:b"].map(canonicalizeCardId)),
    );
    expect(counts[4]).toBe(2); // index 6 is today, so -2 days is index 4
    expect(counts.reduce((a, b) => a + b, 0)).toBe(2); // the -30d card is out
  });

  it("ignores never-reviewed modalities", () => {
    const store: SRSStore = {
      "ja:seed": {
        recognition: sub({ reps: 0, lastReviewDate: getToday() }),
        production: sub({ reps: 0, lastReviewDate: getToday() }),
      },
    };
    const counts = computeWeekReviews(store, new Set(["ja:seed"]));
    expect(counts.reduce((a, b) => a + b, 0)).toBe(0);
  });

  it("ignores cards outside the scoped set", () => {
    const store: SRSStore = { "ja:in": card(getToday()), "ja:out": card(getToday()) };
    const counts = computeWeekReviews(store, new Set(["ja:in"]));
    expect(counts[6]).toBe(2);
  });
});
