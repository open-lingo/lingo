/**
 * `kanaToRomaji` — compile-time romaji generator for `grammarRule`
 * examples/antiPattern and pitfall wrong/right sentences.
 *
 * Bug (JA local-judge triage 2026-09-13, ja-m43/ja-m46): the local `ROMAJI`
 * table only carried hiragana plus a hand-picked handful of katakana chars
 * needed for course character names (トム/ミカ/ケン/タナカ). Any OTHER
 * katakana character fell through the `ROMAJI[ch] ? … : out.push(ch)` branch
 * and was emitted as raw kana glyphs fused into the ASCII romaji string
 * (`テスト` → `テス` + `to` = "テスtoha" once は followed). The long-vowel
 * mark `ー` handler compounds this: it repeats the last character of
 * `out[out.length - 1]`, which — when that entry is itself an un-romanized
 * raw katakana glyph rather than a romaji syllable — duplicates the raw
 * glyph instead of the correct vowel (`コーヒー` → コ,コ,ヒ,ヒ = "ココヒヒ").
 *
 * Fix: `kanaToRomaji` now looks up `KANA_ROMAJI`
 * (`@/shared/japanese/kanaTable`, sourced from `JA_HIRAGANA`/`JA_KATAKANA`
 * in `languageConfig.ts`) instead of a hand-duplicated partial table — the
 * same canonical, full-katakana table already used for per-kana ruby
 * elsewhere in the app.
 */
import { describe, it, expect } from "vitest";
import { kanaToRomaji } from "./moduleCompiler";

describe("kanaToRomaji", () => {
  it("romanizes a katakana loanword with a long-vowel mark (コーヒー)", () => {
    expect(kanaToRomaji("コーヒーがつめたい")).toBe("koohiigatsumetai");
  });

  it("romanizes katakana immediately followed by the は particle (kana-faithful, no space)", () => {
    // テスト+は, kana-faithful romaji (は renders "ha", not "wa" — Spencer
    // ruling) — this is the exact ja-m43-neo-2 shape:
    // もしかしたら + テスト + は + むずかしいかもしれない.
    expect(kanaToRomaji("テストはむずかしい")).toBe("tesutohamuzukashii");
  });

  it("romanizes katakana immediately followed by the を particle (を → 'o', kana-faithful)", () => {
    expect(kanaToRomaji("テストをうける")).toBe("tesutooukeru");
  });

  it("still romanizes hiragana correctly (regression guard)", () => {
    expect(kanaToRomaji("わたしはがくせいです")).toBe("watashihagakuseidesu");
  });

  it("still romanizes the sokuon (っ) correctly (regression guard)", () => {
    expect(kanaToRomaji("がっこう")).toBe("gakkou");
  });
});
