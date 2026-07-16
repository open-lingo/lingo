import { describe, expect, it } from "vitest";
import { compactStreak } from "./streakDisplay";

describe("compactStreak", () => {
  it("renders day-scale streaks as days", () => {
    expect(compactStreak(0)).toEqual({ value: 0, unit: "d" });
    expect(compactStreak(1)).toEqual({ value: 1, unit: "d" });
    expect(compactStreak(29)).toEqual({ value: 29, unit: "d" });
  });

  it("renders month-scale streaks as floored months", () => {
    expect(compactStreak(30)).toEqual({ value: 1, unit: "m" });
    expect(compactStreak(59)).toEqual({ value: 1, unit: "m" });
    expect(compactStreak(60)).toEqual({ value: 2, unit: "m" });
    expect(compactStreak(365)).toEqual({ value: 12, unit: "m" });
  });

  it("clamps negatives to zero days", () => {
    expect(compactStreak(-3)).toEqual({ value: 0, unit: "d" });
  });
});
