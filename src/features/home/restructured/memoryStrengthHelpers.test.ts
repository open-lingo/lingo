import { describe, it, expect } from "vitest";
import { buildMemoryStrengthView } from "./memoryStrengthHelpers";

describe("buildMemoryStrengthView", () => {
  it("derives started count and mastery percentage against started cards", () => {
    const v = buildMemoryStrengthView({
      learningCount: 30,
      masteredCount: 10,
      totalCount: 700, // deliberately ignored for the percentage
      weekReviews: [0, 0, 0, 0, 0, 0, 0],
    });
    expect(v.startedCount).toBe(40);
    // 10 / (30 + 10) = 25% — framed against started, not the 700-atom deck.
    expect(v.masteredPct).toBe(25);
  });

  it("returns 0% and hasStarted=false when nothing is started", () => {
    const v = buildMemoryStrengthView({
      learningCount: 0,
      masteredCount: 0,
      totalCount: 700,
      weekReviews: [0, 0, 0, 0, 0, 0, 0],
    });
    expect(v.masteredPct).toBe(0);
    expect(v.hasStarted).toBe(false);
    expect(v.startedCount).toBe(0);
  });

  it("sums week reviews and counts active days", () => {
    const v = buildMemoryStrengthView({
      learningCount: 5,
      masteredCount: 5,
      totalCount: 50,
      weekReviews: [4, 0, 2, 0, 0, 8, 1],
    });
    expect(v.weekTotal).toBe(15);
    expect(v.activeDays).toBe(4);
    expect(v.hasStarted).toBe(true);
  });

  it("rounds mastery percentage", () => {
    const v = buildMemoryStrengthView({
      learningCount: 2,
      masteredCount: 1,
      totalCount: 3,
      weekReviews: [1, 1, 1, 1, 1, 1, 1],
    });
    // 1 / 3 = 33.33 -> 33
    expect(v.masteredPct).toBe(33);
  });
});
