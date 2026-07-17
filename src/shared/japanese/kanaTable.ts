/**
 * Flat kana → romaji table, derived from the per-syllabary character
 * romanization tables on JA_HIRAGANA and JA_KATAKANA in languageConfig.
 *
 * One place. Both syllabaries. Lookup keyed by the kana character (or
 * yōon digraph like りゃ).
 */
import { getLanguageConfig } from "@/shared/domain/languageConfig";

function buildKanaRomaji(): Record<string, string> {
  const config = getLanguageConfig("ja");
  if (!config?.alphabets) return {};
  const out: Record<string, string> = {};
  for (const alphabet of config.alphabets) {
    const map = alphabet.characterRomanization;
    if (!map) continue;
    for (const [kana, romaji] of Object.entries(map)) {
      out[kana] = romaji;
    }
  }
  return out;
}

export const KANA_ROMAJI: Record<string, string> = buildKanaRomaji();

// Small kana that can form a digraph with the preceding kana: yōon ゃ/ゅ/ょ
// plus the small vowels used by extended katakana loanword sounds (ティ,
// ファ, ウィ…). Merging is still gated on the combo existing in KANA_ROMAJI,
// so listing a small kana here never creates unmapped digraphs.
const SMALL_KANA = new Set([
  "ゃ", "ゅ", "ょ", "ャ", "ュ", "ョ",
  "ァ", "ィ", "ゥ", "ェ", "ォ",
]);
const KANA_RANGE = /[぀-ゟ゠-ヿ]/;
const KATAKANA_LONG_MARK = "ー";

export function isKana(char: string): boolean {
  return char === KATAKANA_LONG_MARK || KANA_RANGE.test(char);
}

/** True for katakana-block chars (incl. the ー long mark, U+30FC). Drives
 *  the per-script romaji fade — katakana romaji retires later than hiragana. */
export function isKatakana(char: string): boolean {
  if (char.length === 0) return false;
  const code = char.charCodeAt(0);
  return code >= 0x30a0 && code <= 0x30ff;
}

/**
 * CJK Unified Ideographs (U+4E00–U+9FFF) plus 々 (U+3005, the kanji
 * iteration mark — repeats the preceding kanji, e.g. 時々). 々 isn't
 * itself in the Unified Ideographs block but reads as kanji for every
 * purpose that matters here, so it's included explicitly.
 */
const KANJI_RE = /[一-鿿々]/;

/**
 * True if `s` contains any kanji character. Backs the never-mix-romaji
 * policy (Spencer 2026-07-16: "we just dont want romaji + kanji ever,
 * looks tacky and is bad practice") — any surface this returns true for
 * must not render a romaji reading line, even if romaji is otherwise
 * forced on. See `useRomajiHelperVisible` in
 * `shared/readingAnnotation/AnnotatedText.tsx` for the render-time gate.
 *
 * Exported from this shared spot (not language-feature-owned) so the
 * kanji-substitution layer can reuse the same detector instead of
 * growing a second one.
 */
export function containsKanji(s: string): boolean {
  return KANJI_RE.test(s);
}

/**
 * Token returned from `tokenizeJapanese`. Each token represents one
 * "visual unit" rendered on the baseline of <AnnotatedJa>.
 *
 * - For kana, `text` is one syllable (one char, or two for yōon like りゃ).
 * - For non-kana (kanji, punctuation, latin, whitespace), `text` is a single
 *   code point; the renderer treats it as un-annotatable in bare-string mode.
 */
export type JaToken = {
  text: string;
  kana: boolean;
  romaji?: string;
};

/**
 * Split a Japanese string into tokens. Yōon digraphs (e.g. りゃ) are
 * merged into a single token when the following code point is a small
 * kana ゃ/ゅ/ょ.
 */
export function tokenizeJapanese(text: string): JaToken[] {
  const tokens: JaToken[] = [];
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const next = chars[i + 1];
    if (next && isKana(char) && SMALL_KANA.has(next)) {
      const combo = char + next;
      const romaji = KANA_ROMAJI[combo];
      if (romaji) {
        tokens.push({ text: combo, kana: true, romaji });
        i++;
        continue;
      }
    }
    if (isKana(char)) {
      tokens.push({ text: char, kana: true, romaji: KANA_ROMAJI[char] });
    } else {
      tokens.push({ text: char, kana: false });
    }
  }
  return tokens;
}
