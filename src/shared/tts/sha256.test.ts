import { describe, it, expect } from "vitest";
import { sha256Hex16 } from "./sha256";

/**
 * The whole client-side-derivation scheme rests on this function producing
 * byte-identical output to Python's `hashlib.sha256(...).hexdigest()[:16]`.
 * If it drifts, every audio URL silently 404s.
 *
 * Fixtures are real (cache key → hash) pairs taken from the production
 * manifest, chosen to span the cases that actually break naive
 * implementations: single multi-byte glyphs, long multi-block sentences,
 * Latin accents/punctuation, and full-width CJK marks.
 */
const FIXTURES: [string, string][] = [
  ["ja:」", "a85f34e25ad17269"],
  ["ja:あ", "cc0414683fcad294"],
  ["ja:い", "fe2abbb065219374"],
  ["ja:ちゃが のみたい。トムは？", "afb0cab7f9bde7d5"],
  ["ja:ちゃを いっぱい ください", "f53532ffbda94aed"],
  ["ja:ちゃを なんばい のんだ？", "eb23859f091b8911"],
  ["ja:なつやすみに きょうだいの なかで おとうとが いちばん およぐから おとうとが いちばん げんきだ", "0568907b9dc08fec"],
  ["ja:ミカの おねえさんは うみや やまが すきだから やすみは うみに いったり やまで あそんだり する", "82ff268697af3782"],
  ["ja:ミカは がいこくに いった ことが ないと おもうけど なつやすみに ひこうきで いく つもりだと きいた", "ab1920c760f533d9"],
  ["ko:가", "8c5f753c87ea0e9d"],
  ["ko:개", "adc126a51eb5cd35"],
  ["ko:거", "e37a5278400f9147"],
  ["ko:가고 싶어요", "b8538cc0917bfe7d"],
  ["ko:가고 있어요", "b2cef1a0eea57f2f"],
  ["ko:가끔 먹어요", "f94bc6c6f5436946"],
  ["ko:한국 음식 중에서 비빔밥이 제일 좋아요", "f3dd80636ba903e2"],
  ["ko:한국 음식 중에서 비빔밥이 더 좋아요보다", "d70d128170560581"],
  ["ko:백 (100), 천 (1,000), 만 (10,000)", "7b029f5bcfc619b1"],
  ["es:A", "47447d791548629a"],
  ["es:a", "e580c6731650b445"],
  ["es:o", "6f74dded8d3646bc"],
  ["es:desayunar", "9db9a65883b091ad"],
  ["es:descansar", "2bf8339054d04699"],
  ["es:el abuelo", "34ba3b1df9bf9d42"],
  ["es:Me levanto a las seis. Primero me ducho y luego desayuno.", "dcabf5a25c9b938e"],
  ["es:tengo una reservación y la habitación está a la izquierda", "501247b1573e1107"],
  ["es:Perdón, señor. ¿Me puede ayudar? No sé dónde está el hotel.", "f505e39b02b2a719"],
  ["ja:やさいの なかで なにが いちばん やすい？", "98493f06b5f6b5ac"],
  ["ja:あには だいがくの がくせいだ", "d2fd5b0ac357dac4"],
  ["es:el jardín", "3b8c788528bfc5b4"],
  ["ja:ラーメンは もっと おいしいです", "e7f7474f8f6ecdca"],
  ["ja:きょうだいの なかで あにが いちばん よく およぐ", "c891c5ff008f3410"],
  ["ja:がくせいが ふたり きっさてんに いる", "365202ba789678b6"],
];

describe("sha256Hex16", () => {
  it("matches the FIPS 180-4 vectors", () => {
    // Full digests truncated to 16 — these are the canonical published values.
    expect(sha256Hex16("")).toBe("e3b0c44298fc1c14");
    expect(sha256Hex16("abc")).toBe("ba7816bf8f01cfea");
    expect(
      sha256Hex16("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
    ).toBe("248d6a61d20638b8");
  });

  it("matches Python hashlib on real production cache keys", () => {
    for (const [key, expected] of FIXTURES) {
      expect(sha256Hex16(key), `key=${key}`).toBe(expected);
    }
  });

  it("handles inputs spanning a block boundary", () => {
    // 55/56/57 bytes bracket the point where padding needs a second block —
    // the classic off-by-one in hand-rolled SHA-256.
    for (const n of [54, 55, 56, 57, 58, 63, 64, 65, 119, 120, 127, 128]) {
      const s = "a".repeat(n);
      expect(sha256Hex16(s), `len=${n}`).toMatch(/^[0-9a-f]{16}$/);
    }
    expect(sha256Hex16("a".repeat(55))).toBe("9f4390f8d30c2dd9");
    expect(sha256Hex16("a".repeat(56))).toBe("b35439a4ac6f0948");
    expect(sha256Hex16("a".repeat(64))).toBe("ffe054fe7ae0cb6d");
  });

  it("is stable across repeated calls (shared scratch buffers are reset)", () => {
    const first = sha256Hex16("ja:こんにちは");
    sha256Hex16("something else entirely that is much much longer");
    expect(sha256Hex16("ja:こんにちは")).toBe(first);
    expect(first).toBe("c34e1a1b60652761");
  });

  it("always returns 16 lowercase hex chars", () => {
    for (const s of ["", "a", "ja:あ", "ko:가", "𝔘𝔫𝔦𝔠𝔬𝔡𝔢", "🎌🇯🇵"]) {
      expect(sha256Hex16(s)).toMatch(/^[0-9a-f]{16}$/);
    }
  });
});
