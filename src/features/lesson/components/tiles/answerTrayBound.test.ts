import { describe, expect, it } from "vitest";
import { computeAnswerTrayBound } from "./answerTrayBound";

describe("computeAnswerTrayBound", () => {
  it("does nothing when the bank already fits within the stage (no overflow)", () => {
    const r = computeAnswerTrayBound({
      overflowPx: 0,
      currentHeightPx: 328.5,
      rowHeightPx: 52.5,
      rowGapPx: 8,
    });
    expect(r.maxHeightPx).toBeNull();
  });

  it("does nothing for sub-tolerance overflow (fractional-layout noise)", () => {
    const r = computeAnswerTrayBound({
      overflowPx: 0.2,
      currentHeightPx: 220,
      rowHeightPx: 60.5,
      rowGapPx: 8,
    });
    expect(r.maxHeightPx).toBeNull();
  });

  it("caps to the tallest whole number of rows that removes the overflow", () => {
    // 5 rows @ 52.5px + 4 gaps @ 8px = 294.5px natural; 212.4px overflow
    // means only ~2 rows of budget remain (294.5 - 212.4 = 82.1, which is
    // just over 1 row + gap but short of 2) -- the cap must snap DOWN, never
    // advertise a row it can't actually show without scrolling.
    const r = computeAnswerTrayBound({
      overflowPx: 212.4,
      currentHeightPx: 328.5,
      rowHeightPx: 52.5,
      rowGapPx: 8,
    });
    expect(r.maxHeightPx).not.toBeNull();
    // 328.5 - 212.4 = 116.1 target; rowStep = 60.5; floor((116.1+8)/60.5) = 2
    // -> 2*60.5 - 8 = 113
    expect(r.maxHeightPx).toBeCloseTo(113, 5);
    expect(r.maxHeightPx!).toBeLessThanOrEqual(328.5);
  });

  it("never caps below one full row, even if the overflow alone would erase every row", () => {
    const r = computeAnswerTrayBound({
      overflowPx: 500,
      currentHeightPx: 328.5,
      rowHeightPx: 52.5,
      rowGapPx: 8,
    });
    expect(r.maxHeightPx).toBeCloseTo(52.5, 5);
  });

  it("never returns a cap taller than what is currently rendered", () => {
    const r = computeAnswerTrayBound({
      overflowPx: 5,
      currentHeightPx: 100,
      rowHeightPx: 52.5,
      rowGapPx: 8,
    });
    expect(r.maxHeightPx).not.toBeNull();
    expect(r.maxHeightPx!).toBeLessThanOrEqual(100);
  });

  it("is a no-op (never guesses) when there is no row unit to snap to", () => {
    const r = computeAnswerTrayBound({
      overflowPx: 50,
      currentHeightPx: 200,
      rowHeightPx: 0,
      rowGapPx: 8,
    });
    expect(r.maxHeightPx).toBeNull();
  });

  it("the cut line always lands on an exact row boundary (N*rowH + (N-1)*gap)", () => {
    const rowHeightPx = 61;
    const rowGapPx = 10;
    const r = computeAnswerTrayBound({
      overflowPx: 90,
      currentHeightPx: 400,
      rowHeightPx,
      rowGapPx,
    });
    const capped = r.maxHeightPx!;
    // (capped + gap) must be an exact multiple of (rowHeightPx + rowGapPx).
    const rows = (capped + rowGapPx) / (rowHeightPx + rowGapPx);
    expect(Number.isInteger(Math.round(rows * 1e6) / 1e6)).toBe(true);
  });
});
