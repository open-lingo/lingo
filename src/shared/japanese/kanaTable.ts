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

const SMALL_KANA = new Set(["ゃ", "ゅ", "ょ", "ャ", "ュ", "ョ"]);
const KANA_RANGE = /[぀-ゟ゠-ヿ]/;
const KATAKANA_LONG_MARK = "ー";

export function isKana(char: string): boolean {
  return char === KATAKANA_LONG_MARK || KANA_RANGE.test(char);
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
