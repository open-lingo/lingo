/**
 * Sentence-case the first character of a learner-facing English prompt at
 * RENDER time (Spencer QA 2026-07-16, ja-m28-review-2: "lowercase on the
 * words also look bad for single word prompts/questions, looks
 * unpolished").
 *
 * Surgical by design:
 *  - Only the FIRST character is touched (never reformats the rest of the
 *    string — this is not a rewrite, just a display-time capitalization).
 *  - No-ops when the prompt starts with a Japanese character (JA quiz
 *    prompts use the script itself as the cue, not English framing).
 *  - No-ops when the first character isn't a lowercase letter (already
 *    capitalized, punctuation-led, digit-led, etc.).
 *
 * Data stays untouched — call this at the render site, never at authoring
 * or generation time.
 */
const JA_CHAR = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;

export function formatPrompt(text: string): string {
  if (!text) return text;
  const first = text[0];
  if (JA_CHAR.test(first)) return text;
  const upper = first.toUpperCase();
  if (upper === first) return text;
  return upper + text.slice(1);
}
