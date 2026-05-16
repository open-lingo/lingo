/**
 * Mora counting for Japanese hiragana / katakana strings.
 *
 * A mora ≠ a glyph. In yōon ("きょ", "しゅ", "ちょ"), the parent kana +
 * small ゃ/ゅ/ょ combine into a single mora. Long vowels with ー and
 * sokuon (small っ) each contribute one mora. Non-kana characters are
 * ignored.
 *
 * Examples (target → mora count):
 *   あい            → 2
 *   くち            → 2
 *   きょう          → 2  (きょ + う)
 *   がっこう        → 4  (が + っ + こ + う)
 *   ぎゅうにゅう    → 4  (ぎゅ + う + にゅ + う)
 *   ありがとう      → 5
 *   おねがいします  → 7
 *   おかあさん      → 5
 *
 * Used to scale STT thresholds: short utterances need looser perfect
 * thresholds because Whisper struggles on sub-second audio, and a
 * single mora difference is a much larger relative miss.
 */

const SMALL_YA_YU_YO_HIRAGANA = new Set(["ゃ", "ゅ", "ょ"]);
const SMALL_YA_YU_YO_KATAKANA = new Set(["ャ", "ュ", "ョ"]);

function isHiragana(ch: string): boolean {
  if (ch.length === 0) return false;
  const code = ch.charCodeAt(0);
  return code >= 0x3041 && code <= 0x309f;
}

function isKatakana(ch: string): boolean {
  if (ch.length === 0) return false;
  const code = ch.charCodeAt(0);
  return code >= 0x30a0 && code <= 0x30ff;
}

function isKana(ch: string): boolean {
  return isHiragana(ch) || isKatakana(ch);
}

/**
 * Count mora in a kana string. Returns 0 for empty / non-kana inputs.
 * Yōon (parent + small ゃゅょ) collapses to a single mora.
 */
export function countMora(text: string): number {
  if (!text) return 0;
  const chars = Array.from(text);
  let count = 0;
  for (const ch of chars) {
    if (!isKana(ch)) continue;
    if (
      SMALL_YA_YU_YO_HIRAGANA.has(ch) ||
      SMALL_YA_YU_YO_KATAKANA.has(ch)
    ) {
      // Yōon glide attaches to the previous kana → no new mora.
      continue;
    }
    count += 1;
  }
  return count;
}
