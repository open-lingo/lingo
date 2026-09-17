/**
 * Q2 whole-word-tiles: every tile boundary in a build/listen step aligns
 * with a word the course knows — the v2 whole-course retokenization rule
 * from `docs/tile-shrapnel-2026-09-17.md` (§3–4), promoted into a callable
 * check. See `lib/irLexicon.mjs` for the runtime-JSON adaptation of the
 * two tests (span / retokenize).
 */
import {
  wholeLexicon,
  groupTilesIntoChunks,
  tokenize,
} from "../lib/irLexicon.mjs";

export const id = "Q2";
export const question =
  "does every tile boundary in this build/listen step fall on a word boundary the course knows?";
// INFORMATIONAL, not enforced. Measured (docs/procedural-qa-2026-09-17.md):
// a full 46-module sweep gives 9 hits; hand-audit found 2 true (a derived
// verb-form atom, たべすぎた, used in m27 before its own m36 registration —
// the exact `やめて` defect class) and 7 coincidental substring collisions
// between an unrelated registered atom (そうです, なんだ) and an ordinary
// word+copula boundary — precision ~2/9 (~22%), below the 0.9 bar.
export const enforced = false;

const BUILD_TYPES = new Set(["build_sentence", "listening_build"]);

export function appliesTo(step) {
  // Character-granularity steps (the m1-m5 hiragana-row "build the kana"
  // drills) tile individual ALPHABET characters, not words — a tile bank
  // like め|が|ね|ぬ|か|れ (めがね "glasses" plus distractor kana) is testing
  // kana recognition, not word segmentation, and every retokenization test
  // below is a category error on it. `picker: true` steps (register-choice
  // drills, e.g. m29) use WHOLE COMPETING PHRASES as tiles ("たかいじゃん" /
  // "たかいですね" / "たかくないです" as four rival whole-sentence choices,
  // `correctOrder` a single tile) — also not word segmentation. Both
  // measured and excluded; see docs/procedural-qa-2026-09-17.md.
  return (
    BUILD_TYPES.has(step.type) &&
    step.granularity !== "character" &&
    !step.picker &&
    Array.isArray(step.tiles) &&
    step.tiles.length > 1
  );
}

export async function run(step, ctx) {
  const sentence = step.targetSentence;
  const lexicon = wholeLexicon(ctx.moduleId);
  const groups = groupTilesIntoChunks(sentence, step.correctOrder ?? step.tiles);
  if (!groups) {
    return {
      answer: "n/a",
      evidence: [`tiles don't cleanly regroup into "${sentence}"'s authored chunks — skipped`],
    };
  }
  const evidence = [];
  let flagged = false;
  // Whole-course RETOKENIZE only (test a). Test (b) WHOLE-WORD SPAN was
  // measured and dropped — see the doc-comment at the top of this file and
  // docs/procedural-qa-2026-09-17.md's Q2 precision table: on a full
  // 46-module sweep it was 58 hits, ~2 arguably true, the rest coincidental
  // substring collisions between an unrelated grammar/discourse atom
  // (んです, そうだ, むいか, たって, いって…) and an ordinary content-word +
  // copula/particle boundary it happens to overlap textually. Test (a)
  // alone reuses the SAME mechanism that actually caught やめて in the
  // original incident (the whole-course tokenizer preferring the longer
  // registered word over the module's own shorter split).
  const moduleVocab = ctx.moduleVocabApprox;
  const wholeSorted = [...new Set([...moduleVocab, ...lexicon])].sort((a, b) => b.length - a.length);
  for (const { chunk, tiles } of groups) {
    if (tiles.length < 2) continue;
    const whole = tokenize(wholeSorted, chunk);
    const shipped = tiles.join("|");
    const wholeJoined = whole.join("|");
    if (shipped !== wholeJoined) {
      flagged = true;
      evidence.push(
        `chunk "${chunk}" tokenizes to ${shipped} but the whole-course lexicon splits it as ${wholeJoined}`,
      );
    }
  }
  if (!flagged) evidence.push(`${groups.length} chunk(s) checked, no shrapnel`);
  return { answer: flagged ? "no" : "yes", evidence };
}

/** Plant: split a real registered word across two tiles the way やめて→や|め|て
 *  did — take the first multi-kana tile and cut it in half. */
export function plant(step) {
  const clone = structuredClone(step);
  const idx = clone.tiles.findIndex((t) => t.length >= 3);
  if (idx === -1) return clone; // no good tile to shred; caller should skip
  const t = clone.tiles[idx];
  const cut = Math.max(1, Math.floor(t.length / 2));
  const pieces = [t.slice(0, cut), t.slice(cut)];
  clone.tiles = [...clone.tiles.slice(0, idx), ...pieces, ...clone.tiles.slice(idx + 1)];
  clone.correctOrder = clone.tiles;
  return clone;
}
