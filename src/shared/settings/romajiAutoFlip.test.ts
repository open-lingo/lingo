import { describe, expect, it } from "vitest";
import {
  ROMAJI_AUTO_OFF_MODULE,
  parseModuleIndex,
  shouldAutoFlipRomaji,
} from "./romajiAutoFlip";
import { DEFAULT_SETTINGS, type UserSettings } from "./types";

function settingsWith(overrides: Partial<UserSettings["learning"]>): UserSettings {
  return {
    ...DEFAULT_SETTINGS,
    learning: { ...DEFAULT_SETTINGS.learning, ...overrides },
  };
}

describe("parseModuleIndex", () => {
  it("extracts the module number from ja-m{N}-... IDs", () => {
    expect(parseModuleIndex("ja-m1-l1-1")).toBe(1);
    expect(parseModuleIndex("ja-m7-9")).toBe(7);
    expect(parseModuleIndex("ja-m15")).toBe(15);
    expect(parseModuleIndex("ja-m15-1")).toBe(15);
    expect(parseModuleIndex("ko-m3-vowels")).toBe(3);
  });
  it("returns 0 for sidequests / unrecognized IDs", () => {
    expect(parseModuleIndex("ja-sidequest-survival-phrases")).toBe(0);
    expect(parseModuleIndex(undefined)).toBe(0);
    expect(parseModuleIndex("ja-m1-recap")).toBe(1); // recaps are still m1
    expect(parseModuleIndex("random-string")).toBe(0);
  });
});

describe("shouldAutoFlipRomaji", () => {
  it("does not flip when showRomaji is already off", () => {
    const result = shouldAutoFlipRomaji({
      settings: settingsWith({ showRomaji: false }),
      trigger: "module-reached",
      reachedModuleIndex: ROMAJI_AUTO_OFF_MODULE,
    });
    expect(result.flipped).toBe(false);
  });

  it("does not flip if the auto-off has already fired", () => {
    const result = shouldAutoFlipRomaji({
      settings: settingsWith({
        showRomaji: true,
        romajiAutoFlipped: true,
      }),
      trigger: "module-reached",
      reachedModuleIndex: ROMAJI_AUTO_OFF_MODULE,
    });
    expect(result.flipped).toBe(false);
  });

  it("flips when module-reached AND learner is on M15+", () => {
    const result = shouldAutoFlipRomaji({
      settings: settingsWith({ showRomaji: true, romajiAutoFlipped: false }),
      trigger: "module-reached",
      reachedModuleIndex: ROMAJI_AUTO_OFF_MODULE,
    });
    expect(result.flipped).toBe(true);
    expect(result.reason).toBe("module-reached");
  });

  it("does NOT flip on M14 (below threshold)", () => {
    const result = shouldAutoFlipRomaji({
      settings: settingsWith({ showRomaji: true, romajiAutoFlipped: false }),
      trigger: "module-reached",
      reachedModuleIndex: ROMAJI_AUTO_OFF_MODULE - 1,
    });
    expect(result.flipped).toBe(false);
  });

  it("flips on alphabet-mastered when full test passed", () => {
    const result = shouldAutoFlipRomaji({
      settings: settingsWith({ showRomaji: true, romajiAutoFlipped: false }),
      trigger: "alphabet-mastered",
      alphabetFullTestPassed: true,
    });
    expect(result.flipped).toBe(true);
    expect(result.reason).toBe("alphabet-mastered");
  });

  it("does not flip on alphabet trigger when full test not yet passed", () => {
    const result = shouldAutoFlipRomaji({
      settings: settingsWith({ showRomaji: true, romajiAutoFlipped: false }),
      trigger: "alphabet-mastered",
      alphabetFullTestPassed: false,
    });
    expect(result.flipped).toBe(false);
  });

  it("a learner who already turned romaji back on after auto-flip never re-flips", () => {
    // Scenario: user reaches M15, auto-flip fires, user turns romaji back
    // on. romajiAutoFlipped stays true. Next time they finish an M15+
    // lesson the helper must NOT re-flip them off.
    const result = shouldAutoFlipRomaji({
      settings: settingsWith({
        showRomaji: true,
        romajiAutoFlipped: true,
      }),
      trigger: "module-reached",
      reachedModuleIndex: ROMAJI_AUTO_OFF_MODULE + 2,
    });
    expect(result.flipped).toBe(false);
  });
});
