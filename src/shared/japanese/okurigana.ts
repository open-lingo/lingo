/**
 * Okurigana-aligned furigana (Spencer QA 2026-07-17, m29-3-1 screenshots:
 * "we only need furigana above the kanji, not the following kana").
 *
 * A ruby annotation must cover only the kanji run of a surface, not its
 * leading/trailing kana. Standard alignment: strip the longest common
 * affixes between surface and reading (necessarily kana — the reading is
 * kana), ruby the middle:
 *
 *   飲む/のむ      → 飲(の)む          (suffix む stripped)
 *   飲まない/のまない → 飲(の)まない     (suffix まない stripped)
 *   食べる/たべる   → 食(た)べる        (suffix べる stripped)
 *   大きい/おおきい  → 大(おお)きい      (suffix きい stripped)
 *   来ない/こない   → 来(こ)ない        (reading changes are fine — the
 *                                       caller passes the ACTUAL reading)
 *   お土産/おみやげ  → お・土産(みやげ)   (prefix お stripped)
 *   学校/がっこう   → 学校(がっこう)     (no common affix — whole-word ruby)
 *
 * Mixed kanji-kana-kanji middles (持って行く) deliberately fall back to a
 * single ruby over the whole remaining run — common-affix stripping covers
 * the curriculum; per-run splitting is not modeled (don't over-engineer).
 *
 * Sibling of `features/languages/ja/writtenForms.writtenSegments`, which
 * solves the DERIVATION direction (kana conjugated form → written form) via
 * dictionary-form prefix substitution. This util solves the RENDER direction:
 * given a finished surface + reading pair, where does the <rt> belong.
 */
import { containsKanji } from "./kanaTable";

export type AlignedFurigana = {
  /** Kana shared by surface and reading BEFORE the annotated run ("" usually). */
  prefix: string;
  /** The ruby base — the kanji-bearing middle of the surface. */
  body: string;
  /** The furigana for `body` — the middle of the reading. */
  rt: string;
  /** Kana shared AFTER the annotated run (okurigana tail: む, べる, きい…). */
  suffix: string;
};

/**
 * Split `surface`/`reading` into prefix + annotated body + suffix. Falls back
 * to whole-word ruby (`prefix`/`suffix` empty, body = surface, rt = reading)
 * whenever alignment would produce an empty body/rt or a body with no kanji.
 * Callers are expected to pass a kanji-bearing surface with a distinct
 * reading; anything else returns the whole-word shape unchanged.
 */
export function alignFurigana(surface: string, reading: string): AlignedFurigana {
  const whole: AlignedFurigana = {
    prefix: "",
    body: surface,
    rt: reading,
    suffix: "",
  };
  if (surface === reading) return whole; // nothing to align
  const s = Array.from(surface);
  const r = Array.from(reading);
  // Longest common suffix…
  let suf = 0;
  while (
    suf < s.length &&
    suf < r.length &&
    s[s.length - 1 - suf] === r[r.length - 1 - suf]
  ) {
    suf++;
  }
  // …then longest common prefix of what remains.
  let pre = 0;
  while (
    pre < s.length - suf &&
    pre < r.length - suf &&
    s[pre] === r[pre]
  ) {
    pre++;
  }
  const body = s.slice(pre, s.length - suf).join("");
  const rt = r.slice(pre, r.length - suf).join("");
  if (body.length === 0 || rt.length === 0 || !containsKanji(body)) {
    return whole;
  }
  return {
    prefix: s.slice(0, pre).join(""),
    body,
    rt,
    suffix: s.slice(s.length - suf).join(""),
  };
}
