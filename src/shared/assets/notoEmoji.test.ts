import { describe, it, expect } from "vitest";
import { JA_KANA_EMOJI_MAP, lookupKanaEmoji, lingoArtUrl } from "./notoEmoji";

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

describe("lingoArtUrl", () => {
  it("resolves a migrated JA legacy kana key (generation-1 hand-authored SVG)", () => {
    expect(lingoArtUrl("ja", "つくえ")).toBe("/lingo-art/svg/desk.svg");
  });

  it("resolves a JA Wave-C custom-art key (generation-2 mflux PNG)", () => {
    expect(lingoArtUrl("ja", "しょうゆ")).toBe("/lingo-art/vocab/ja/shouyu.png");
  });

  it("resolves a KO key", () => {
    expect(lingoArtUrl("ko", "김치")).toBe("/lingo-art/vocab/ko/김치.png");
  });

  it("resolves an ES key", () => {
    expect(lingoArtUrl("es", "mesa")).toBe("/lingo-art/vocab/es/mesa.png");
  });

  it("is course-scoped — the same surface under a different course prefix does not collide", () => {
    // ja:テーブル has custom art; es:mesa (same referent, different word) is a
    // separate key. Neither should leak into the other course's namespace.
    expect(lingoArtUrl("fr", "mesa")).toBeNull();
    expect(lingoArtUrl("ko", "テーブル")).toBeNull();
  });

  it("returns null for a surface with no custom art", () => {
    expect(lingoArtUrl("ja", "ねこ")).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(lingoArtUrl("ja", undefined)).toBeNull();
  });
});
