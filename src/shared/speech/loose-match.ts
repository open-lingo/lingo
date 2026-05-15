/**
 * Loose comparison of an ASR transcript against a target Japanese phrase.
 *
 * The Web Speech API for `ja-JP` returns transcripts that are usually
 * "close enough" but rarely byte-identical to the target. Common drift:
 *
 *   - Whitespace inserted between morphemes ("お ちゃ" vs "おちゃ")
 *   - Trailing punctuation ("おちゃ。", "おちゃ?")
 *   - Long vowel collapse / expansion ("おお" ↔ "おう")
 *   - Hiragana ↔ katakana ↔ kanji substitution ("ありがとう" → "有難う")
 *
 * For a first-pass MVP we normalize both sides and compare with a
 * combination of:
 *   - exact normalized match (pass immediately)
 *   - substring (transcript contains target, or target contains transcript)
 *   - per-character overlap ≥ 0.7
 *
 * The bar deliberately leans **lenient**. False positives during a
 * pronunciation drill are far better than false negatives — we don't want
 * to punish the learner because Chrome heard "お茶" instead of "おちゃ".
 *
 * Future replacement: swap in a Whisper-based phoneme-aware compare once
 * transformers.js is wired up. See
 * `docs/superpowers/specs/2026-05-15-speech-recognition-research.md`.
 */

const PUNCT_RE = /[\s　.,!?。、！？・「」『』（）()「」]/g;

/** Normalize for compare: strip whitespace + punctuation, lowercase. */
export function normalizeJa(s: string): string {
  if (!s) return "";
  return s.replace(PUNCT_RE, "").toLowerCase();
}

/**
 * Per-character Jaccard-ish overlap on multisets of code points. Not a
 * proper edit distance; good enough as a "did the learner say roughly
 * the right kana" signal for V1.
 */
function charOverlap(a: string, b: string): number {
  if (!a || !b) return 0;
  const aChars = [...a];
  const bChars = [...b];
  const bCounts = new Map<string, number>();
  for (const c of bChars) bCounts.set(c, (bCounts.get(c) ?? 0) + 1);
  let hits = 0;
  for (const c of aChars) {
    const left = bCounts.get(c) ?? 0;
    if (left > 0) {
      hits += 1;
      bCounts.set(c, left - 1);
    }
  }
  // Symmetric: penalize for length mismatch.
  return hits / Math.max(aChars.length, bChars.length);
}

/**
 * Returns true if `transcript` is a plausible pronunciation of `target`.
 *
 * The threshold (0.7) was hand-tuned against the a-row vocab from
 * `mock-ja-m1-l1.ts`. Revisit when real usage data lands.
 */
export function isUtteranceCorrect(
  target: string,
  transcript: string,
  threshold: number = 0.7,
): boolean {
  const t = normalizeJa(target);
  const u = normalizeJa(transcript);
  if (!t || !u) return false;
  if (t === u) return true;
  if (u.includes(t) || t.includes(u)) return true;
  return charOverlap(t, u) >= threshold;
}
