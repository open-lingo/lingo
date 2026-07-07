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
  it("returns 0 for sidequests / unrecognized IDs", () => {
    expect(parseModuleIndex("ja-sidequest-survival-phrases")).toBe(0);
    expect(parseModuleIndex(undefined)).toBe(0);
    expect(parseModuleIndex("ja-m1-recap")).toBe(1); // recaps are still m1
    expect(parseModuleIndex("random-string")).toBe(0);
  });
});

describe("shouldAutoOffScriptRomaji", () => {
  it("flips hiragana at M10, not before", () => {
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

  it("flips katakana at M17 — hiragana's M10 does not trip katakana", () => {
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
});

describe("shouldAutoFadeBuildTileRomaji", () => {
  it("fades at the build-tile threshold (M10), no later than romaji auto-off", () => {
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
    // User reached M10, fade fired, user turned it back off in Settings.
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
