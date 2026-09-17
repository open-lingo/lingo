/**
 * Q2 v3 — whole-word-tiles, DICTIONARY-FIRST.
 *
 * v2 (whole-course-lexicon RETOKENIZE only) measured ~22% precision (9
 * hits, 2 true — `docs/procedural-qa-2026-09-17.md` §3): the 7 false
 * positives were coincidental substring collisions between an unrelated
 * registered GRAMMAR/discourse atom (そうです/そうだ/んです/なんだ) and an
 * ordinary word+copula or word+から boundary it happens to overlap
 * textually — a real word on both sides, not a cut-through-a-word defect.
 *
 * v3's definition (the lane brief): a tile boundary is a shrapnel
 * candidate only if (a) the retokenized longer word spanning it is a
 * JMdict COMMON entry or a course atom, AND (b) the boundary does NOT
 * coincide with a JMdict entry boundary on both sides — i.e. the two
 * pieces immediately flanking it are not THEMSELVES independently valid
 * words. (a) alone is v2's rule; (b) is the fix — `lib/irLexicon.mjs`'s
 * `chunkBoundaryHits` implements both together (see its doc comment for
 * the exact search/skip semantics). This is test (b) WHOLE-WORD SPAN from
 * `docs/tile-shrapnel-2026-09-17.md` §3, dropped entirely in v2 for being
 * too noisy on its own — v3 restores it, now filtered by (b).
 *
 * KO/ES/FR (2026-09-17, lane A7e): this question is redefined for
 * space-tokenized courses — see `lib/wordChunk.mjs`'s header comment for
 * why the JA sub-word-morpheme definition doesn't port (multi-word tiles
 * are DELIBERATE there, per the ES/FR authoring guides). The KO/ES/FR
 * check is `sentenceReconstructs`: do the tiles, joined word-for-word,
 * exactly reproduce `targetSentence`? Purely mechanical, no dictionary —
 * see `docs/procedural-qa-2026-09-17.md`'s per-language section for the
 * measured precision and the "chunk" definition this rests on.
 */
import { groupTilesIntoChunks, chunkBoundaryHits, wholeLexicon } from "../lib/irLexicon.mjs";
import { isCommonKanaEntry, hasKanaEntry, jmdictAvailable } from "../lib/jmdict.mjs";
import { sentenceReconstructs } from "../lib/wordChunk.mjs";

export const id = "Q2";
export const question =
  "does every tile boundary in this build/listen step fall on a word boundary the course knows?";
// See docs/procedural-qa-2026-09-17.md §3/§4 for the v2 -> v3 precision
// table and the promotion decision. Kept in sync by hand — do not flip
// without re-measuring.
export const enforced = true;

const BUILD_TYPES = new Set(["build_sentence", "listening_build"]);

export function appliesTo(step, ctx) {
  // Same category exclusions as v2, still valid: character-granularity
  // kana-row drills and `picker` whole-phrase steps are not word
  // segmentation at all — see docs/procedural-qa-2026-09-17.md §3.
  if (
    !BUILD_TYPES.has(step.type) ||
    step.granularity === "character" ||
    step.picker ||
    !Array.isArray(step.tiles) ||
    step.tiles.length < 2 ||
    typeof step.targetSentence !== "string"
  ) {
    return false;
  }
  if (ctx?.lang && ctx.lang !== "ja") return true; // mechanical, no JMdict needed
  return jmdictAvailable();
}

/** "Course atom", for Q2's purposes, is the SAME whole-course registered-
 *  atom lexicon v2 used (`wholeLexicon` — the IR compiler's `lexiconKanas`,
 *  every atom kana surface from every module) unioned with the current
 *  module's own shipped tile vocabulary (`moduleVocabApprox`) — NOT
 *  `atomKanaSet` (Q3's narrower `getNormalizedCourseAtoms` source). This
 *  matters concretely: derived verb-form atoms (`derivedFrom`, e.g.
 *  たべすぎた, m36) are IR-only by design (`courseAtoms.ts`'s own comment,
 *  "stay IR-only per DERIVED_KINDS") and never appear in
 *  `getNormalizedCourseAtoms` — using that narrower set here would make
 *  Q2 blind to the exact defect class (a derived form used before its own
 *  registration) it exists to catch. */
function isQualifyingSpan(ctx) {
  const lexicon = wholeLexicon(ctx.moduleId);
  return (text) => isCommonKanaEntry(text) || ctx.moduleVocabApprox?.has(text) || lexicon.has(text);
}

function isIndependentWord(ctx) {
  // Deliberately looser than "qualifying" (ANY JMdict entry, not just
  // common) — a piece counts as "a real word in context" even if it's an
  // uncommon one; only totally unattested fragments (verb stems, etc.)
  // fail this and let the boundary stay flagged. Deliberately EXCLUDES
  // `moduleVocabApprox` (unlike `isQualifyingSpan`) — that set is "every
  // tile shipped anywhere in this module," which trivially contains BOTH
  // flanking tiles of every boundary by construction (they're shipped
  // tiles too), so using it here would make condition (b) vacuously true
  // for every minimal 2-tile merge and never flag anything (measured:
  // this was the very first version of this function, and it produced 0
  // hits course-wide — see the ledger). "Independently valid" has to mean
  // "a real registered/dictionary WORD," not "was shipped as SOME tile."
  //
  // Also includes `atomKanaSet` (Q3's UNFILTERED course-atom set, from
  // `getNormalizedCourseAtoms`) alongside `wholeLexicon` (which drops
  // anything under 3 kana — measured false positive: なんぷん "how many
  // minutes" tiled as なん|ぷん flagged shrapnel because ぷん, a
  // deliberately-registered 2-kana counter atom (`courseAtoms.ts`'s
  // "pun-counter", "the rendaku half of the minute counter"), is too
  // short for `wholeLexicon`'s >=3 filter and has no JMdict entry of its
  // own — its base reading ふん does, ぷん (rendaku-voiced) doesn't).
  const lexicon = wholeLexicon(ctx.moduleId);
  return (text) => hasKanaEntry(text) || lexicon.has(text) || ctx.atomKanaSet?.has(text);
}

export async function run(step, ctx) {
  if (ctx.lang !== "ja") {
    const tiles = step.correctOrder ?? step.tiles;
    const mismatch = sentenceReconstructs(step.targetSentence, tiles, ctx.lang);
    if (!mismatch) {
      return { answer: "yes", evidence: [`${tiles.length} tile(s) reconstruct "${step.targetSentence}" exactly`] };
    }
    return {
      answer: "no",
      evidence: [
        `tiles do not reconstruct the target sentence word-for-word: expected "${mismatch.expected}", got "${mismatch.got}"`,
      ],
    };
  }
  const sentence = step.targetSentence;
  const groups = groupTilesIntoChunks(sentence, step.correctOrder ?? step.tiles);
  if (!groups) {
    return {
      answer: "n/a",
      evidence: [`tiles don't cleanly regroup into "${sentence}"'s authored chunks — skipped`],
    };
  }
  const evidence = [];
  let flagged = false;
  const qualifies = isQualifyingSpan(ctx);
  const independent = isIndependentWord(ctx);
  for (const { chunk, tiles } of groups) {
    if (tiles.length < 2) continue;
    const hits = chunkBoundaryHits(tiles, qualifies, independent);
    for (const hit of hits) {
      flagged = true;
      evidence.push(
        `chunk "${chunk}": tile "${hit.tileLeft}"|"${hit.tileRight}" boundary is cut by known word "${hit.merged}" ` +
          `(pieces "${hit.pieceLeft}"/"${hit.pieceRight}" not both independently valid words)`,
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
