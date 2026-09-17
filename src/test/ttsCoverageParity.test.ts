/**
 * Pins `scripts/qa/procedural/lib/ttsCoverage.mjs`'s `hasTtsClip` against
 * the REAL runtime resolver, `src/shared/tts/index.ts`'s `getTtsUrl`, for 20
 * real lines pulled from the shipped JA content (2026-09-17, procedural QA
 * lane A7b — `docs/procedural-qa-2026-09-17.md` §3/§4).
 *
 * Why this exists: `ttsCoverage.mjs` cannot `ssrLoadModule` `getTtsUrl`
 * itself for its hot path — `manifest.ts`'s manifest load is a fire-and-
 * forget promise (`void preloadTtsManifests().catch(() => {})`) designed for
 * a browser/dev-server runtime, and a one-shot CLI process has no reliable
 * hook to await it finishing first. So `ttsCoverage.mjs` REPLICATES
 * `getTtsUrl`'s algorithm in plain Node instead of importing it. This test
 * is the guard against that replica drifting from the original: it runs
 * under vitest (where `src/test/setup.ts` already awaits
 * `preloadTtsManifests()` before any test file imports), so it CAN safely
 * call the real `getTtsUrl`, and asserts boolean parity — the replica finds
 * a clip iff the real resolver does — for a fixed set of 20 lines spanning
 * every fallback path `getTtsUrl` has:
 *   - a direct hash hit (no punctuation)
 *   - the trailing-punctuation-stripped fallback (the class behind 654 of
 *     A7's original 655 Q7 findings — every one of these has a trailing "。"
 *     the deck does not)
 *   - a multi-sentence line resolving only through the internal-punctuation
 *     -stripped ("bare") fallback
 *   - the JA hiragana-twin single-glyph fallback (ア -> あ)
 *   - a line with NO clip under any path (must agree "false" on both sides)
 *
 * If this test goes red, the two implementations disagree — do not "fix" it
 * by editing this file's expectations; find and close the actual drift in
 * `ttsCoverage.mjs`.
 */
import { describe, expect, it } from "vitest";
import { getTtsUrl } from "@/shared/tts";
// @ts-expect-error — plain .mjs, no type declarations; runtime import only.
import { hasTtsClip } from "../../scripts/qa/procedural/lib/ttsCoverage.mjs";

const LANG = "ja";

const SAMPLES: string[] = [
  // Direct hits — no punctuation, resolve on the bare sha256 lookup.
  "わたしは がくせいだ",
  "たなかは せんせいだ",
  "トムは がくせいだ",
  "ともだちは がくせいだ",
  "わたしも がくせいだ",
  "いぬも ともだちだ",
  "ケンも にほんじんだ",
  "いいえ",
  // Trailing-punctuation fallback — m3, ja-m3-neo-1's listening-comp lines.
  "ねこだ。",
  "みずだ。",
  "ほんだ。",
  "ねこ。",
  "ねこです。",
  // Internal-punctuation ("bare") fallback — two-sentence dialogue lines
  // that keep their internal 。 boundary; the deck strips ALL punctuation.
  "わたしは トムだ。がくせいだ。",
  "わたしは ミカだ。がくせいだ。",
  "ミカは がくせいだ。",
  // JA hiragana-twin fallback: あ has a recorded clip, ア does not (the
  // pipeline only ever records per-glyph hiragana) — getTtsUrl falls back
  // to the hiragana twin for a lone katakana glyph.
  "ア",
  "イ",
  "あ",
  // Genuinely missing — ja-m42-neo-challenge-dlg-4 (Q10's kanji-leak line,
  // fixed 人->ひと 2026-09-17; the CLIP itself is still absent under any
  // fallback path). Both sides must agree "no clip" here too.
  "きしゃは くると いっていたが、うわさで は こないって いっているひとも います。",
];

describe("Q7's hasTtsClip mirrors the runtime getTtsUrl", () => {
  // vacuity: SAMPLES is a hardcoded 20-entry literal (not a derived
  // collector), so it cannot silently empty out from a data change — no
  // non-empty floor needed. See vacuity-lint.mjs's header for this
  // false-positive class.
  it.each(SAMPLES)("agrees with getTtsUrl for %j", (text) => {
    const runtimeHasClip = getTtsUrl(text, LANG) !== null;
    expect(hasTtsClip(LANG, text)).toBe(runtimeHasClip);
  });
});
