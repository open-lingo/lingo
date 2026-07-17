import { describe, expect, it } from "vitest";
import {
  HIRAGANA_ROMAJI_OFF_MODULE,
  KATAKANA_ROMAJI_OFF_MODULE,
  BUILD_TILE_ROMAJI_FADE_MODULE,
  parseModuleIndex,
  shouldAutoOffScriptRomaji,
  romajiVisibleForScript,
  todayLocalDate,
  shouldAutoFadeBuildTileRomaji,
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
  it("extracts the module number from the BARE moduleId (LessonContent.moduleId)", () => {
    // Regression: `LessonContent.moduleId` is "m29", not "ja-m29". The
    // prefix-required regex returned 0, so the romaji-by-module ladder never
    // fired from a lesson. The prefix is now optional.
    expect(parseModuleIndex("m29")).toBe(29);
    expect(parseModuleIndex("m7")).toBe(7);
    expect(parseModuleIndex("m1")).toBe(1);
  });
  it("returns 0 for sidequests / unrecognized IDs", () => {
    expect(parseModuleIndex("ja-sidequest-survival-phrases")).toBe(0);
    expect(parseModuleIndex(undefined)).toBe(0);
    expect(parseModuleIndex("ja-m1-recap")).toBe(1); // recaps are still m1
    expect(parseModuleIndex("random-string")).toBe(0);
  });
});

describe("shouldAutoOffScriptRomaji", () => {
  it("flips hiragana at M7, not before", () => {
    const base = { settings: settingsWith({}), script: "hiragana" as const };
    expect(
      shouldAutoOffScriptRomaji({
        ...base,
        reachedModuleIndex: HIRAGANA_ROMAJI_OFF_MODULE - 1,
      }),
    ).toBe(false);
    expect(
      shouldAutoOffScriptRomaji({
        ...base,
        reachedModuleIndex: HIRAGANA_ROMAJI_OFF_MODULE,
      }),
    ).toBe(true);
  });

  it("flips katakana at M17 — hiragana's M7 does not trip katakana", () => {
    const kata = { settings: settingsWith({}), script: "katakana" as const };
    expect(
      shouldAutoOffScriptRomaji({
        ...kata,
        reachedModuleIndex: HIRAGANA_ROMAJI_OFF_MODULE,
      }),
    ).toBe(false);
    expect(
      shouldAutoOffScriptRomaji({
        ...kata,
        reachedModuleIndex: KATAKANA_ROMAJI_OFF_MODULE,
      }),
    ).toBe(true);
  });

  it("does not re-flip once that script's guard is already set", () => {
    expect(
      shouldAutoOffScriptRomaji({
        settings: settingsWith({ hiraganaRomajiAutoOff: true }),
        reachedModuleIndex: HIRAGANA_ROMAJI_OFF_MODULE + 5,
        script: "hiragana",
      }),
    ).toBe(false);
  });
});

describe("romajiVisibleForScript", () => {
  const today = "2026-06-30";

  it("shows romaji by default (master on, no guard)", () => {
    expect(
      romajiVisibleForScript({
        settings: settingsWith({}),
        script: "hiragana",
        today,
      }),
    ).toBe(true);
  });

  it("hides a script once its guard is set, leaving the other on", () => {
    const s = settingsWith({ hiraganaRomajiAutoOff: true });
    expect(romajiVisibleForScript({ settings: s, script: "hiragana", today })).toBe(
      false,
    );
    expect(romajiVisibleForScript({ settings: s, script: "katakana", today })).toBe(
      true,
    );
  });

  it("master showRomaji=false hides both scripts", () => {
    const s = settingsWith({ showRomaji: false });
    expect(romajiVisibleForScript({ settings: s, script: "hiragana", today })).toBe(
      false,
    );
    expect(romajiVisibleForScript({ settings: s, script: "katakana", today })).toBe(
      false,
    );
  });

  it("romajiOnForDay===today forces romaji on despite a guard", () => {
    const s = settingsWith({ katakanaRomajiAutoOff: true, romajiOnForDay: today });
    expect(romajiVisibleForScript({ settings: s, script: "katakana", today })).toBe(
      true,
    );
  });

  it("a stale romajiOnForDay (not today) does not force it on", () => {
    const s = settingsWith({
      hiraganaRomajiAutoOff: true,
      romajiOnForDay: "2020-01-01",
    });
    expect(romajiVisibleForScript({ settings: s, script: "hiragana", today })).toBe(
      false,
    );
  });

  it("todayLocalDate returns a YYYY-MM-DD string", () => {
    expect(todayLocalDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // moduleIndex: retire by POSITION even when the one-shot guard never flipped
  // (QA jump / deep link into a late lesson), without touching the escape hatches.
  it("moduleIndex >= threshold hides romaji even with the guard unset", () => {
    const s = settingsWith({}); // hiraganaRomajiAutoOff stays false
    expect(
      romajiVisibleForScript({ settings: s, script: "hiragana", today, moduleIndex: 29 }),
    ).toBe(false);
    // katakana threshold is higher (17); m29 is past it too.
    expect(
      romajiVisibleForScript({ settings: s, script: "katakana", today, moduleIndex: 29 }),
    ).toBe(false);
  });

  it("moduleIndex below the threshold still shows romaji", () => {
    const s = settingsWith({});
    expect(
      romajiVisibleForScript({ settings: s, script: "hiragana", today, moduleIndex: 6 }),
    ).toBe(true);
    // katakana off-module is 17, so at m10 katakana romaji still shows...
    expect(
      romajiVisibleForScript({ settings: s, script: "katakana", today, moduleIndex: 10 }),
    ).toBe(true);
    // ...while hiragana (off at 7) is already hidden at m10 by position.
    expect(
      romajiVisibleForScript({ settings: s, script: "hiragana", today, moduleIndex: 10 }),
    ).toBe(false);
  });

  it("omitting moduleIndex keeps the exact guard-only behavior", () => {
    const s = settingsWith({}); // guard unset
    expect(romajiVisibleForScript({ settings: s, script: "hiragana", today })).toBe(true);
    expect(
      romajiVisibleForScript({ settings: s, script: "hiragana", today, moduleIndex: null }),
    ).toBe(true);
  });

  it("romajiOnForDay escape hatch STILL wins over a past-threshold module", () => {
    const s = settingsWith({ romajiOnForDay: today });
    expect(
      romajiVisibleForScript({ settings: s, script: "hiragana", today, moduleIndex: 29 }),
    ).toBe(true);
  });

  it("showRomaji=false still hard-hides regardless of module", () => {
    const s = settingsWith({ showRomaji: false });
    expect(
      romajiVisibleForScript({ settings: s, script: "hiragana", today, moduleIndex: 3 }),
    ).toBe(false);
  });
});

describe("shouldAutoFadeBuildTileRomaji", () => {
  it("fades at the build-tile threshold (M5), no later than romaji auto-off", () => {
    expect(BUILD_TILE_ROMAJI_FADE_MODULE).toBeLessThanOrEqual(
      HIRAGANA_ROMAJI_OFF_MODULE,
    );
    expect(BUILD_TILE_ROMAJI_FADE_MODULE).toBeLessThan(KATAKANA_ROMAJI_OFF_MODULE);
    expect(
      shouldAutoFadeBuildTileRomaji({
        settings: settingsWith({}),
        reachedModuleIndex: BUILD_TILE_ROMAJI_FADE_MODULE,
      }),
    ).toBe(true);
  });

  it("does NOT fade below the threshold (M9)", () => {
    expect(
      shouldAutoFadeBuildTileRomaji({
        settings: settingsWith({}),
        reachedModuleIndex: BUILD_TILE_ROMAJI_FADE_MODULE - 1,
      }),
    ).toBe(false);
  });

  it("is independent of the global showRomaji aid (still fades while romaji on)", () => {
    expect(
      shouldAutoFadeBuildTileRomaji({
        settings: settingsWith({ showRomaji: true }),
        reachedModuleIndex: BUILD_TILE_ROMAJI_FADE_MODULE,
      }),
    ).toBe(true);
  });

  it("does not re-fire once the one-shot guard has fired", () => {
    // User reached M5, fade fired, user turned it back off in Settings.
    // buildTileRomajiAutoFlipped stays true → must not re-fade them.
    expect(
      shouldAutoFadeBuildTileRomaji({
        settings: settingsWith({
          hideBuildTileRomaji: false,
          buildTileRomajiAutoFlipped: true,
        }),
        reachedModuleIndex: BUILD_TILE_ROMAJI_FADE_MODULE + 3,
      }),
    ).toBe(false);
  });

  it("no-ops when already faded", () => {
    expect(
      shouldAutoFadeBuildTileRomaji({
        settings: settingsWith({ hideBuildTileRomaji: true }),
        reachedModuleIndex: BUILD_TILE_ROMAJI_FADE_MODULE,
      }),
    ).toBe(false);
  });
});
