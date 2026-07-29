import { describe, it, expect } from "vitest";
import { getTtsUrl, hasTtsAudio } from "./index";

describe("getTtsUrl", () => {
  it("returns null for empty text", () => {
    expect(getTtsUrl("")).toBeNull();
  });

  it("returns null for unknown text", () => {
    expect(getTtsUrl("これは絶対にマニフェストに無い文字列です")).toBeNull();
  });

  it("resolves a known JA M3 phrase to a stable versioned URL", () => {
    // Locks in the client-derived path: the hash is computed from
    // `sha256("ja:こんにちは")[:16]`, so this exact value is the contract
    // between the app and the Python pipeline. If it changes, every audio
    // URL 404s.
    const url = getTtsUrl("こんにちは");
    expect(url).toBe("/tts/v1/ja/c34e1a1b60652761.mp3");
  });

  it("defaults lang to ja", () => {
    expect(getTtsUrl("こんにちは")).toBe(getTtsUrl("こんにちは", "ja"));
  });

  it("returns null for the same text under a different lang", () => {
    // Each language has its own manifest and the hash is salted by the lang
    // prefix, so a KO lookup for JA text must miss rather than resolve to
    // the JA recording.
    expect(getTtsUrl("こんにちは", "ko")).toBeNull();
  });

  it("falls back to the ±。 variant when the exact key is missing", () => {
    // Phrase-level keys in the manifest sometimes include the sentence
    // terminator and sometimes don't; the resolver tries both.
    const withDot = getTtsUrl("はい。");
    const withoutDot = getTtsUrl("はい");
    expect(withoutDot).not.toBeNull();
    // At least one form should resolve; if both forms resolve they may
    // differ (different recordings), but both must be versioned ja paths.
    if (withDot) expect(withDot).toMatch(/^\/tts\/v1\/ja\/[0-9a-f]{16}\.mp3$/);
    expect(withoutDot).toMatch(/^\/tts\/v1\/ja\/[0-9a-f]{16}\.mp3$/);
  });
});

describe("katakana single-glyph fallback", () => {
  it("resolves a lone katakana glyph via its hiragana twin", () => {
    // The pipeline only generated per-glyph clips for hiragana; ア must
    // resolve to the same recording as あ (sound-identical scripts).
    expect(getTtsUrl("あ")).not.toBeNull();
    expect(getTtsUrl("ア")).toBe(getTtsUrl("あ"));
    expect(getTtsUrl("ン")).toBe(getTtsUrl("ん"));
  });

  it("does NOT fall back for multi-char katakana words", () => {
    // A loanword missing from the manifest must miss loudly (so the TTS
    // emit/generate pass catches it), not play a hiragana conversion.
    expect(getTtsUrl("ネクタイタイプライター")).toBeNull();
  });

  it("does not apply the fallback outside ja", () => {
    expect(getTtsUrl("ア", "ko")).toBeNull();
  });
});

describe("hasTtsAudio", () => {
  it("is true iff getTtsUrl returns non-null", () => {
    expect(hasTtsAudio("こんにちは")).toBe(true);
    expect(hasTtsAudio("")).toBe(false);
    expect(hasTtsAudio("これは絶対にマニフェストに無い文字列です")).toBe(false);
  });
});
