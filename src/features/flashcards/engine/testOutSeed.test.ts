import { describe, it, expect } from "vitest";
import {
  DAYS_PER_MODULE,
  KNOWN_THRESHOLD_DAYS,
  moduleDistance,
  seedIntervalDays,
  isKnown,
  createTestOutSeedState,
  shouldSeedTestOut,
} from "./testOutSeed";
import type { SRSCardState } from "../data/types";

describe("testOutSeed — constants", () => {
  it("5 days per module, known at 90 days", () => {
    expect(DAYS_PER_MODULE).toBe(5);
    expect(KNOWN_THRESHOLD_DAYS).toBe(90);
  });
});

describe("moduleDistance", () => {
  it("the just-tested module's own atoms get distance 1", () => {
    expect(moduleDistance(30, 30)).toBe(1);
  });
  it("test out of m30, atom introduced m1 → distance 30", () => {
    expect(moduleDistance(30, 1)).toBe(30);
  });
  it("floors at 1 — an atom from the highest module or later never goes to 0", () => {
    expect(moduleDistance(5, 5)).toBe(1);
    expect(moduleDistance(5, 9)).toBe(1); // introduced "after" highest — clamp, not negative
  });
});

describe("seedIntervalDays — Spencer's worked cases", () => {
  it("distance 1 → 5 days", () => {
    expect(seedIntervalDays(1)).toBe(5);
  });
  it("distance 18 → 90 days (known threshold)", () => {
    expect(seedIntervalDays(18)).toBe(90);
  });
  it("distance 30 → 150 days (module 30 test-out, module 1 atom)", () => {
    expect(seedIntervalDays(30)).toBe(150);
  });
  it("distance 6 → 30 days", () => {
    expect(seedIntervalDays(6)).toBe(30);
  });
});

describe("isKnown", () => {
  it("< 90 days is not known", () => {
    expect(isKnown(89)).toBe(false);
    expect(isKnown(60)).toBe(false);
    expect(isKnown(5)).toBe(false);
  });
  it(">= 90 days is known", () => {
    expect(isKnown(90)).toBe(true);
    expect(isKnown(150)).toBe(true);
  });
});

describe("createTestOutSeedState", () => {
  it("stamps both modalities with the same interval/dueDate and sets known correctly", () => {
    const state = createTestOutSeedState(150, "2026-09-14");
    expect(state.recognition.interval).toBe(150);
    expect(state.production.interval).toBe(150);
    expect(state.recognition.dueDate).toBe("2027-02-11");
    expect(state.production.dueDate).toBe("2027-02-11");
    expect(state.known).toBe(true);
  });
  it("a 5-day seed is not known", () => {
    const state = createTestOutSeedState(5, "2026-09-14");
    expect(state.known).toBe(false);
  });
  it("seeded state is reps=1 (established), not new", () => {
    const state = createTestOutSeedState(5, "2026-09-14");
    expect(state.recognition.reps).toBe(1);
    expect(state.production.reps).toBe(1);
  });
});

function subState(interval: number) {
  return {
    stability: interval,
    difficulty: 5,
    state: "review" as const,
    interval,
    dueDate: "2099-01-01",
    lastReviewDate: "2026-01-01",
    reps: 1,
    lapses: 0,
  };
}

describe("shouldSeedTestOut — never shorten an existing longer interval", () => {
  it("no existing state → always seed", () => {
    expect(shouldSeedTestOut(undefined, 5)).toBe(true);
  });
  it("existing state shorter than the seed → seed (replace)", () => {
    const existing: SRSCardState = {
      recognition: subState(3),
      production: subState(3),
    };
    expect(shouldSeedTestOut(existing, 5)).toBe(true);
  });
  it("existing state longer than the seed → do NOT seed (leave untouched)", () => {
    const existing: SRSCardState = {
      recognition: subState(300),
      production: subState(300),
    };
    expect(shouldSeedTestOut(existing, 150)).toBe(false);
  });
  it("mixed modalities: compares the weaker (min) of the two", () => {
    const existing: SRSCardState = {
      recognition: subState(300), // strong
      production: subState(2), // weak — still less advanced than the seed
    };
    expect(shouldSeedTestOut(existing, 5)).toBe(true);
  });
  it("existing exactly equal to the seed is NOT less advanced — leave untouched", () => {
    const existing: SRSCardState = {
      recognition: subState(5),
      production: subState(5),
    };
    expect(shouldSeedTestOut(existing, 5)).toBe(false);
  });
});
