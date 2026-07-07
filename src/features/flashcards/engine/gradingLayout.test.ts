import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveGradingLayout,
  hasAnyReviewedCard,
  SIMPLE_RATING,
} from "./gradingLayout";
import { createInitialState, reviewCard } from "./srs";
import { setCardState } from "./srsStorage";

describe("resolveGradingLayout", () => {
  it("honors an explicit 'simple' preference regardless of history", () => {
    expect(resolveGradingLayout("simple", true)).toBe("simple");
    expect(resolveGradingLayout("simple", false)).toBe("simple");
  });

  it("honors an explicit 'full' preference regardless of history", () => {
    expect(resolveGradingLayout("full", true)).toBe("full");
    expect(resolveGradingLayout("full", false)).toBe("full");
  });

  it("defaults to 'full' when a card has already been reviewed", () => {
    expect(resolveGradingLayout(undefined, true)).toBe("full");
  });

  it("defaults to 'simple' for a fresh learner with no reviews", () => {
    expect(resolveGradingLayout(undefined, false)).toBe("simple");
  });
});

describe("hasAnyReviewedCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is false for an empty store", () => {
    expect(hasAnyReviewedCard()).toBe(false);
  });

  it("is false when only pristine (never-reviewed) states exist", () => {
    setCardState("ja:aoi", createInitialState());
    expect(hasAnyReviewedCard()).toBe(false);
  });

  it("is true once a card has been reviewed (reps > 0 + lastReviewedAt)", () => {
    const reviewed = reviewCard(createInitialState(), "recognition", "good");
    setCardState("ja:aoi", reviewed);
    expect(hasAnyReviewedCard()).toBe(true);
  });
});

describe("SIMPLE_RATING mapping", () => {
  it("maps 'Didn't know' to the 'again' rating", () => {
    expect(SIMPLE_RATING.didntKnow).toBe("again");
  });

  it("maps 'Knew it' to the 'good' rating", () => {
    expect(SIMPLE_RATING.knewIt).toBe("good");
  });
});
