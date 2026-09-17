/**
 * Q3 one-content-word-per-chunk: no tile carries more than one content
 * morpheme (particles/auxiliaries/copula may attach).
 *
 * Tool: the JA lexical sidecar (`scripts/lexical/ja/sidecar.mjs`, fugashi +
 * unidic-lite), fed the KANJI-reconstructed sentence (`lib/kanjiReconstruct.mjs`)
 * to dodge the kana-only over-segmentation pitfall, then tokens are mapped
 * back onto tile spans and counted by POS.
 *
 * This is the STRUCTURAL half of the tile-shrapnel class (option B in
 * `docs/tile-shrapnel-2026-09-17.md` §4): Q2 catches a known word split
 * ACROSS tiles (over-splitting); Q3 catches two distinct content words
 * glued INTO one tile (under-splitting) — complementary, not overlapping.
 */
import { sidecarAvailable, tagOne } from "../../../lexical/ja/sidecar.mjs";
import {
  buildKanjiIndex,
  reconstruct,
  attributeTokensToTiles,
  isContentToken,
} from "../lib/kanjiReconstruct.mjs";

export const id = "Q3";
export const question = "does every tile in this build/listen step carry at most one content morpheme?";
// INFORMATIONAL, not enforced. Measured (docs/procedural-qa-2026-09-17.md):
// 653 hits over 4,125 build/listen steps; a hand-audited random 60-hit
// sample found 0 true positives. POS tags alone are NOT sufficient for this
// question — the false positives cluster into three named classes: (1)
// legitimate noun-noun/prefix+noun/number+counter compounds that are one
// taught vocabulary item (おかあさん, ひこうき, さんじ); (2) grammatical
// constructions the POS scheme can't tell from content (V-te + いく/くる/
// しまう/みる aspectual auxiliaries, される passive, すぎる "too much", the
// ない negative ending itself tagged 形容詞); (3) plain kana-only tagger
// parse failures with no kanji anchor (いっぽん, のまない). The real fix is
// JMdict compound-entry lookup + a richer auxiliary-construction table —
// out of scope for this lane; see the doc's "how to add a question".
export const enforced = false;

const BUILD_TYPES = new Set(["build_sentence", "listening_build"]);

export function appliesTo(step) {
  // Character-granularity steps tile individual kana, not words — see the
  // identical exclusion (and its measurement) in Q2.
  return (
    BUILD_TYPES.has(step.type) &&
    step.granularity !== "character" &&
    !step.picker &&
    Array.isArray(step.tiles) &&
    step.tiles.length > 0 &&
    sidecarAvailable()
  );
}

export async function run(step, ctx) {
  const kanjiIndex = ctx.kanjiIndex;
  const tiles = step.correctOrder ?? step.tiles;
  const { text, spans } = reconstruct(tiles, kanjiIndex);
  const tokens = tagOne(text);
  const byTile = attributeTokensToTiles(tokens, spans);
  const evidence = [];
  let flagged = false;
  for (const span of spans) {
    const toks = byTile.get(span.tileIndex) ?? [];
    const content = toks.filter(isContentToken);
    if (content.length > 1) {
      flagged = true;
      evidence.push(
        `tile "${span.tile}" carries ${content.length} content morphemes: ${content.map((t) => `${t.surface}(${t.pos1})`).join(", ")}`,
      );
    }
  }
  if (!flagged) evidence.push(`${tiles.length} tile(s), each <=1 content morpheme`);
  return { answer: flagged ? "no" : "yes", evidence };
}

/** Plant: glue the WHOLE sentence into one tile — guaranteed to carry more
 *  than one content morpheme for any real multi-word sentence, the exact
 *  under-splitting defect this catches (a merge of just two adjacent tiles
 *  can coincidentally itself be one real word, e.g. いっしょ+に = いっしょに
 *  "together" — not a violation, so this plant is deliberately maximal). */
export function plant(step) {
  const clone = structuredClone(step);
  if (!Array.isArray(clone.tiles) || clone.tiles.length < 2) return clone;
  const merged = clone.tiles.join("");
  clone.tiles = [merged];
  clone.correctOrder = [merged];
  return clone;
}
