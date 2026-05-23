import { describe, it, expect } from "vitest";
import { JA_KANA_EMOJI_MAP, lookupKanaEmoji } from "./notoEmoji";

describe("JA_KANA_EMOJI_MAP", () => {
  it("is non-empty (derived from JA_COURSE_ATOMS)", () => {
    expect(JA_KANA_EMOJI_MAP.size).toBeGreaterThan(40);
  });

  it("contains common N5 vocab keyed by kana", () => {
    // Spot-check a few stable entries from JA_COURSE_ATOMS.
    expect(JA_KANA_EMOJI_MAP.has("つき")).toBe(true);
    expect(JA_KANA_EMOJI_MAP.has("ほし")).toBe(true);
  });
});

describe("lookupKanaEmoji", () => {
  it("returns the emoji for a known kana", () => {
    expect(lookupKanaEmoji("つき")).toBe("🌙");
    expect(lookupKanaEmoji("ほし")).toBe("⭐");
  });

  it("returns null for unknown kana", () => {
    expect(lookupKanaEmoji("xyznotaword")).toBeNull();
  });
});
