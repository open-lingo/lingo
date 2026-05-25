import { describe, it, expect } from "vitest";
import {
  xpForLevel,
  totalXpToReachLevel,
  currentLevel,
  xpProgressToNextLevel,
} from "./leveling";

describe("xpForLevel", () => {
  it("level 1 takes 100 XP", () => {
    expect(xpForLevel(1)).toBe(100);
  });

  it("triangular growth: level 2 takes 200, level 3 takes 300", () => {
    expect(xpForLevel(2)).toBe(200);
    expect(xpForLevel(3)).toBe(300);
  });

  it("level 10 takes 1000 XP", () => {
    expect(xpForLevel(10)).toBe(1000);
  });

  it("invalid level returns 0", () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-3)).toBe(0);
  });
});

describe("totalXpToReachLevel", () => {
  it("reaching level 1 takes 0 XP (everyone starts at level 1)", () => {
    expect(totalXpToReachLevel(1)).toBe(0);
  });

  it("reaching level 2 takes 100 XP (finished level 1)", () => {
    expect(totalXpToReachLevel(2)).toBe(100);
  });

  it("reaching level 3 takes 100 + 200 = 300 XP", () => {
    expect(totalXpToReachLevel(3)).toBe(300);
  });

  it("reaching level 10 takes triangular sum 100+200+...+900 = 4500 XP", () => {
    expect(totalXpToReachLevel(10)).toBe(4500);
  });

  it("reaching level 11 takes 5500 XP — matches spec target", () => {
    expect(totalXpToReachLevel(11)).toBe(5500);
  });
});

describe("currentLevel", () => {
  it("0 XP is level 1", () => {
    expect(currentLevel(0)).toBe(1);
  });

  it("just below threshold stays on current level", () => {
    expect(currentLevel(99)).toBe(1);
    expect(currentLevel(299)).toBe(2);
  });

  it("crossing the threshold ticks up", () => {
    expect(currentLevel(100)).toBe(2);
    expect(currentLevel(300)).toBe(3);
  });

  it("4500 XP is exactly level 10 (sum 1..9 levels' costs)", () => {
    expect(currentLevel(4500)).toBe(10);
  });

  it("negative XP defends to 1", () => {
    expect(currentLevel(-50)).toBe(1);
  });
});

describe("xpProgressToNextLevel", () => {
  it("at 0 XP: 0/100 on level 1", () => {
    const p = xpProgressToNextLevel(0);
    expect(p.level).toBe(1);
    expect(p.intoLevel).toBe(0);
    expect(p.toNext).toBe(100);
    expect(p.percent).toBe(0);
  });

  it("at 50 XP: 50/100 on level 1", () => {
    const p = xpProgressToNextLevel(50);
    expect(p.level).toBe(1);
    expect(p.intoLevel).toBe(50);
    expect(p.toNext).toBe(100);
    expect(p.percent).toBe(50);
  });

  it("at 150 XP: level 2 with 50/200", () => {
    const p = xpProgressToNextLevel(150);
    expect(p.level).toBe(2);
    expect(p.intoLevel).toBe(50);
    expect(p.toNext).toBe(200);
    expect(p.percent).toBe(25);
  });

  it("exact level boundary: 100 XP → level 2 with 0 into it", () => {
    const p = xpProgressToNextLevel(100);
    expect(p.level).toBe(2);
    expect(p.intoLevel).toBe(0);
  });
});
