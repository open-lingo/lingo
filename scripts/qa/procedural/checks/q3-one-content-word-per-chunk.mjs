/**
 * Q3 v3 — one-content-word-per-chunk, DICTIONARY-FIRST.
 *
 * v2 (fugashi/UniDic POS-tag counting alone) measured 0% precision on a
 * 60-hit random sample (`docs/procedural-qa-2026-09-17.md` §3) — the false
 * positives fell into three named classes: (1) legitimate compounds that
 * are one taught vocabulary item, (2) grammatical constructions (V-te +
 * aux, passive, すぎる, ない-as-suffix) the POS scheme alone can't tell
 * from two content words, (3) plain kana-only tagger parse failures.
 *
 * v3 resolves each tile against JMdict + the course atom lexicon FIRST
 * (`lib/tileMorphology.mjs`'s `decomposeTile` — see its doc comment for
 * the full 5-step resolution order and which class each step closes), and
 * only falls back to the tagger for whatever that can't resolve. Re-
 * measured 2026-09-17 against a fresh random 60-hit sample; see the doc's
 * §3 v3 table for the precision this reached and whether it cleared the
 * 0.9 bar to promote to `enforced: true`.
 */
import { buildTileMorphologyCtx, decomposeTile } from "../lib/tileMorphology.mjs";
import { jmdictAvailable } from "../lib/jmdict.mjs";
import { sidecarAvailable } from "../../../lexical/ja/sidecar.mjs";

export const id = "Q3";
export const question = "does every tile in this build/listen step carry at most one content morpheme?";
// See docs/procedural-qa-2026-09-17.md §3/§4 for the v2 -> v3 precision
// table and the promotion decision (enforced vs still-informational, and
// why). This export is the CODE's own claim about itself, kept in sync by
// hand with that decision — do not flip without re-measuring.
export const enforced = true;

const BUILD_TYPES = new Set(["build_sentence", "listening_build"]);

export function appliesTo(step) {
  return (
    BUILD_TYPES.has(step.type) &&
    step.granularity !== "character" &&
    !step.picker &&
    Array.isArray(step.tiles) &&
    step.tiles.length > 0 &&
    sidecarAvailable() &&
    jmdictAvailable()
  );
}

export async function run(step, ctx) {
  const morphCtx = buildTileMorphologyCtx(ctx);
  const tiles = step.correctOrder ?? step.tiles;
  const evidence = [];
  let flagged = false;
  for (const tile of tiles) {
    const { chunks, reason } = decomposeTile(tile, morphCtx);
    if (chunks > 1) {
      flagged = true;
      evidence.push(`tile "${tile}" carries ${chunks} content morphemes — ${reason}`);
    }
  }
  if (!flagged) evidence.push(`${tiles.length} tile(s), each <=1 content morpheme`);
  return { answer: flagged ? "no" : "yes", evidence };
}

/** Plant: glue the WHOLE sentence into one tile — guaranteed to carry more
 *  than one content morpheme for any real multi-word sentence, the exact
 *  under-splitting defect this catches. */
export function plant(step) {
  const clone = structuredClone(step);
  if (!Array.isArray(clone.tiles) || clone.tiles.length < 2) return clone;
  const merged = clone.tiles.join("");
  clone.tiles = [merged];
  clone.correctOrder = [merged];
  return clone;
}
