import { describe, expect, it } from "vitest";
import {
  xpForLevel,
  totalXpToReachLevel,
  currentLevel,
  xpProgressToNextLevel,
  XP_PER_LEVEL,
} from "./leveling";

// The curve MIRRORS lingo-core/app/progress/xp.py — 500 XP per level,
// linear. If these break, check which side changed and align both.
describe("leveling (server-mirrored linear curve)", () => {
  it("each level costs XP_PER_LEVEL", () => {
    expect(xpForLevel(1)).toBe(XP_PER_LEVEL);
    expect(xpForLevel(7)).toBe(XP_PER_LEVEL);
  });

  it("cumulative thresholds are linear", () => {
    expect(totalXpToReachLevel(1)).toBe(0);
    expect(totalXpToReachLevel(2)).toBe(500);
    expect(totalXpToReachLevel(5)).toBe(2000);
  });

  it("matches the server's level_for_xp", () => {
    // server: max(1, xp // 500 + 1)
    expect(currentLevel(0)).toBe(1);
    expect(currentLevel(499)).toBe(1);
    expect(currentLevel(500)).toBe(2);
    expect(currentLevel(2750)).toBe(6);
  });

  it("progress fills 0–100 within a level", () => {
    const p = xpProgressToNextLevel(750);
    expect(p.level).toBe(2);
    expect(p.intoLevel).toBe(250);
    expect(p.percent).toBe(50);
  });
});
