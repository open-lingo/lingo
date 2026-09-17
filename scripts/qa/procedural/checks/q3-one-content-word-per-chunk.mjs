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
 *
 * KO/ES/FR (2026-09-17, lane A7e): redefined for space-tokenized courses —
 * see `lib/wordChunk.mjs`'s header comment. A tile is flagged only if (a)
 * its own full text is NOT itself a registered whole-course atom (the
 * fixed-expression escape — «buenas noches», «por favor», «je vais») AND
 * (b) it contains 2+ independent CONTENT words once glue (articles,
 * prepositions, clitic pronouns, conjunctions — ES/FR closed-class table;
 * particles/endings/copula — KO Kiwi tags) is excluded. See
 * `docs/procedural-qa-2026-09-17.md`'s per-language section for the
 * measured precision.
 */
import { buildTileMorphologyCtx, decomposeTile } from "../lib/tileMorphology.mjs";
import { jmdictAvailable } from "../lib/jmdict.mjs";
import { sidecarAvailable } from "../../../lexical/ja/sidecar.mjs";
import { contentWordCount, koContentMorphemeCount, isPhraseChoiceBank } from "../lib/wordChunk.mjs";
import { tagOne as koTagOne, sidecarAvailable as koSidecarAvailable } from "../../../lexical/ko/sidecar.mjs";

export const id = "Q3";
export const question = "does every tile in this build/listen step carry at most one content morpheme?";
// See docs/procedural-qa-2026-09-17.md §3/§4 for the v2 -> v3 precision
// table and the promotion decision (enforced vs still-informational, and
// why). This export is the CODE's own claim about itself, kept in sync by
// hand with that decision — do not flip without re-measuring.
//
// PER-LANGUAGE (2026-09-17, lane A7e): JA/ES/FR clear the 0.9 precision
// bar (JA's JMdict-first v3; ES 0/0 vacuous, FR 13/13 audited true — see
// the doc's per-language section). KO's Kiwi-tags-only Q3 measured 0/8
// true on a full hand audit — every hit was either a grammaticalized
// construction Kiwi's POS tags alone can't distinguish from content
// (V-고 나서 "after doing," -을 거예요 future/conjecture, -을 줄 알다
// "know how to") or a legitimate idiomatic compound (잘하다 "be good at"),
// the exact v2-vs-v3 gap JA closed with JMdict + a deconjugation table —
// no KO equivalent exists yet. KO's Q3 therefore stays INFORMATIONAL
// (index.mjs's `resolveEnforced` reads this as a function); the finding
// count is still baselined (never allowed to rise) in
// `proceduralQa.baseline.json`'s `ko.Q3`, same ratchet discipline as any
// enforced question — informational only means a "no" doesn't fail CI on
// its own, not that regressions go untracked.
export const enforced = (ctx) => ctx?.lang !== "ko";

const BUILD_TYPES = new Set(["build_sentence", "listening_build"]);

export function appliesTo(step, ctx) {
  if (
    !BUILD_TYPES.has(step.type) ||
    step.granularity === "character" ||
    step.picker ||
    !Array.isArray(step.tiles) ||
    step.tiles.length === 0
  ) {
    return false;
  }
  const lang = ctx?.lang;
  if (!lang || lang === "ja") return sidecarAvailable() && jmdictAvailable();
  if (typeof step.targetSentence === "string" && isPhraseChoiceBank(step.targetSentence, step.tiles, step.correctOrder, lang)) {
    return false; // discrimination-between-whole-clauses bank, not a word-level build — see lib/wordChunk.mjs
  }
  if (lang === "ko") return koSidecarAvailable();
  return true; // es/fr: table + Lexique, no external process required
}

export function naReason(step, ctx) {
  const lang = ctx?.lang;
  if (lang && lang !== "ja" && typeof step.targetSentence === "string" && isPhraseChoiceBank(step.targetSentence, step.tiles, step.correctOrder, lang)) {
    return "phrase-choice bank (competing whole-clause tiles, not word-level pieces) — excluded from Q3, the ES/FR/KO analogue of JA's picker exclusion (docs/procedural-qa-2026-09-17.md)";
  }
  return "not applicable to this step";
}

export async function run(step, ctx) {
  if (ctx.lang === "es" || ctx.lang === "fr") {
    const tiles = step.correctOrder ?? step.tiles;
    const evidence = [];
    let flagged = false;
    for (const tile of tiles) {
      if (ctx.atomSurfaceSet?.has(tile)) continue; // whole tile is a registered fixed expression
      const { contentWords } = contentWordCount(tile, ctx.lang, ctx.atomSurfaceSet);
      if (contentWords.length > 1) {
        flagged = true;
        evidence.push(`tile "${tile}" carries ${contentWords.length} content words: ${contentWords.join(", ")}`);
      }
    }
    if (!flagged) evidence.push(`${tiles.length} tile(s), each <=1 content word`);
    return { answer: flagged ? "no" : "yes", evidence };
  }
  if (ctx.lang === "ko") {
    const tiles = step.correctOrder ?? step.tiles;
    const evidence = [];
    let flagged = false;
    for (const tile of tiles) {
      if (ctx.atomSurfaceSet?.has(tile)) continue;
      const { count } = koContentMorphemeCount(tile, koTagOne);
      if (count > 1) {
        flagged = true;
        evidence.push(`tile "${tile}" carries ${count} content morphemes (Kiwi tags)`);
      }
    }
    if (!flagged) evidence.push(`${tiles.length} tile(s), each <=1 content morpheme`);
    return { answer: flagged ? "no" : "yes", evidence };
  }
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
