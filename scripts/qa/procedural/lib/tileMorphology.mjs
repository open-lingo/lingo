/**
 * Q3 v3 — "does this tile carry at most one content morpheme" — decided
 * from DICTIONARY FACTS (JMdict + the course atom lexicon) first, the
 * fugashi/UniDic tagger only as a last-resort fallback for whatever a
 * dictionary-first pass can't resolve. See
 * `docs/procedural-qa-2026-09-17.md` §3 for the v2 measurement (0% on a
 * 60-hit sample) that motivated this rewrite and its named false-positive
 * classes, which the steps below are numbered against.
 *
 * `decomposeTile(tile, ctx)` returns
 *   { chunks: 1 } — one content morpheme (possibly plus attached function
 *     morphemes), tile passes Q3, OR
 *   { chunks: N, reason } — N >= 2 distinct content morphemes found, with
 *     a human-readable trace of how they were identified (Q3 fails).
 *
 * Resolution order (each step only runs if the previous one didn't
 * resolve the tile):
 *   1. Whole tile (kana as-is, or its course-atom kanji reconstruction) IS
 *      a JMdict entry or a registered course atom -> 1 content morpheme.
 *      Closes false-positive class 1 (legitimate compounds: おかあさん,
 *      ひこうき, さんじ...) and most of class 3 (いっぽん — a JMdict entry
 *      in its own right, no tagger segmentation needed at all).
 *   2. `tryDeconjugate` (lib/jaDeconjugate.mjs) recovers a JMdict/atom
 *      dictionary form from the WHOLE tile via the standard nai/masu/tai/
 *      sugiru/passive-causative/volitional/te/ta reverse-conjugation
 *      table -> 1 content morpheme (the verb) + its own recognized
 *      inflection (not separately counted — the ending IS what
 *      `tryDeconjugate` matched, not a second morpheme). Closes the rest
 *      of class 3 (のまない -> のむ) and the ない/すぎる/passive slice of
 *      class 2.
 *   3. Split at each て/で occurrence: does the LEFT half (through て/で)
 *      deconjugate to a content verb, AND does the RIGHT half deconjugate
 *      to one of the aspectual auxiliary lemmas (いく/くる/しまう/みる/
 *      おく/ある/いる)? -> 1 content morpheme (the host verb; the
 *      aspectual aux is function, per the auxiliary table below). Closes
 *      the "V-te + aux" slice of class 2 (たべてしまった, かってくる,
 *      なっていく) for tiles that glue verb+aux into one chunk.
 *   4. Prefix/suffix split: does SOME prefix of the tile match a JMdict
 *      entry/atom/deconjugation, with the remainder fully covered by the
 *      auxiliary table (particles, copula, more conjugation endings) via
 *      greedy longest-match? -> 1 content morpheme.
 *   5. Fallback: fugashi tagger (kanji-reconstructed input, as v2 used),
 *      counting "content" tokens with the auxiliary table's surface/lemma
 *      overrides applied and adjacent content-token runs merged whenever
 *      their concatenation is itself a JMdict/atom entry (closes
 *      remaining class-1 compounds the tagger fragments that steps 1-4
 *      didn't already resolve some other way).
 */
import { hasKanaEntry, isCommonKanaEntry } from "./jmdict.mjs";
import { tryDeconjugate } from "./jaDeconjugate.mjs";
import { tagOne } from "../../../lexical/ja/sidecar.mjs";
import { wholeLexicon } from "./irLexicon.mjs";

/**
 * Auxiliary table: surfaces/lemmas that attach to a content word and are
 * NEVER themselves counted as a second content morpheme, cited against the
 * UniDic pos1 tag each would otherwise carry (the tag alone is not enough
 * — see the class-2 note on ない below).
 */
// Particles — already pos1 "助詞" (all subtypes: 格助詞 case, 係助詞
// binding, 接続助詞 conjunctive — と/で/に/を/は/が/も/けど/ので/のに...).
// Auxiliary verbs — pos1 "助動詞" (です/ます/ない/た/そうだ/らしい...).
// Symbols/punctuation — pos1 "補助記号"/"記号". Suffixes — pos1 "接尾辞"
// (さん/ちゃん/たち/すぎ...). Prefixes — pos1 "接頭辞" (お/ご honorifics);
// NOT excluded by v2's FUNCTION_POS1, which is exactly why お+かあさん
// over-counted — a bare honorific prefix is never itself a content word.
export const FUNCTION_POS1 = new Set(["助詞", "助動詞", "補助記号", "記号", "接尾辞", "接頭辞"]);

// Literal surfaces to treat as function even when a mis-tag makes them
// LOOK content-like — class 2's named example: UniDic tags a bare ない
// token "形容詞" (i-adjective) when it is functioning as the negative
// auxiliary suffix on a verb, indistinguishable by pos1 alone from the
// adjective ない ("nonexistent") used as a real predicate. Since every
// verb-negation ない also matches `tryDeconjugate` (step 2) before this
// fallback ever runs, this table only needs to catch a BARE ない/なかった
// tile (its own tile, attached to a separately-tiled verb) reaching the
// tagger fallback — same treatment as the copula/ending surfaces below.
export const FUNCTION_SURFACES = new Set([
  "ない", "なかった",
  "だ", "です", "である", "じゃ", "でした", "でしょう",
  "て", "で", "た", "だ",
  "ます", "ました", "ません", "ませんでした",
  "たい", "たかった", "たくない", "たくなかった",
]);

// Aspectual auxiliary verb lemmas — step 3's "V-te + aux" table. Every one
// of these is ALSO a real content verb in isolation (いく "to go", みる
// "to see"); what makes them function here is the SYNTACTIC position
// (directly after a て/で-form verb), which step 3 checks structurally
// rather than trying to hard-code a lemma-only exception (a bare tile
// "いく" with no preceding て-form verb is still content).
export const ASPECTUAL_AUX_LEMMAS = new Set(["いく", "くる", "しまう", "みる", "おく", "ある", "いる"]);

function jmdictOrAtomHas(text, ctx) {
  if (!text) return false;
  if (hasKanaEntry(text)) return true;
  if (ctx.atomKanaSet?.has(text)) return true;
  // Whole-course registered-atom lexicon (IR `lexiconKanas`, keyed by
  // module only for the IR file lookup — the SET it returns is already
  // whole-course, every module's atoms). Needed for `derivedFrom`
  // verb/adjective-form atoms (すぎる/そう/やすい/たがる/つづける/される
  // derivations — ちいさすぎる, ふりそう, あるきやすい, いきたがっている,
  // よみつづける, そうさされた, all measured 2026-09-17 as real registered
  // course vocabulary, not JMdict headwords and not in
  // `getNormalizedCourseAtoms` either — `courseAtoms.ts`'s own comment:
  // "stay IR-only per DERIVED_KINDS", same reason Q2 needs this source).
  if (ctx.courseLexicon?.has(text)) return true;
  return false;
}

function jmdictOrAtomExistsFn(ctx) {
  return (text) => jmdictOrAtomHas(text, ctx);
}

/** Step 1. */
function wholeTileIsWord(tile, ctx) {
  const kanjiRecon = ctx.kanjiIndex?.get(tile);
  return jmdictOrAtomHas(tile, ctx) || (kanjiRecon && jmdictOrAtomHas(kanjiRecon, ctx));
}

/** Step 2. */
function wholeTileDeconjugates(tile, ctx) {
  return tryDeconjugate(tile, jmdictOrAtomExistsFn(ctx)) !== null;
}

/** Step 3: split at て/で, left = content verb (deconjugates), right =
 *  aspectual aux (deconjugates to one of ASPECTUAL_AUX_LEMMAS). */
function teAuxSplit(tile, ctx) {
  const existsFn = jmdictOrAtomExistsFn(ctx);
  for (let i = 1; i < tile.length; i++) {
    const marker = tile[i];
    if (marker !== "て" && marker !== "で") continue;
    const left = tile.slice(0, i + 1);
    const right = tile.slice(i + 1);
    if (right.length === 0) continue;
    const leftDict = tryDeconjugate(left, existsFn);
    if (!leftDict) continue;
    // Right side: either the aux verb itself (bare or further
    // inflected) or already covered by the aux table (いた/います/etc.
    // for いる, which has no dictionary-form kanji ambiguity).
    const rightDict = tryDeconjugate(right, existsFn) ?? (existsFn(right) ? right : null);
    if (rightDict && ASPECTUAL_AUX_LEMMAS.has(rightDict)) {
      return { leftDict, rightDict, splitAt: i };
    }
  }
  return null;
}

/** Step 4: longest JMdict/atom/deconjugatable prefix, remainder fully
 *  covered by FUNCTION_SURFACES via greedy longest-match. */
function prefixContentSuffixFunction(tile, ctx) {
  const existsFn = jmdictOrAtomExistsFn(ctx);
  const functionSurfacesSorted = [...FUNCTION_SURFACES].sort((a, b) => b.length - a.length);
  for (let cut = tile.length - 1; cut >= 1; cut--) {
    const prefix = tile.slice(0, cut);
    const suffix = tile.slice(cut);
    const prefixOk = jmdictOrAtomHas(prefix, ctx) || tryDeconjugate(prefix, existsFn) !== null;
    if (!prefixOk) continue;
    // Greedily consume `suffix` entirely with FUNCTION_SURFACES tokens.
    let rest = suffix;
    let ok = true;
    while (rest.length > 0) {
      const match = functionSurfacesSorted.find((f) => rest.startsWith(f));
      if (!match) {
        ok = false;
        break;
      }
      rest = rest.slice(match.length);
    }
    if (ok) return { prefix, suffix };
  }
  return null;
}

/** Step 5 fallback: tagger + aux-table overrides + JMdict-span merge. */
function taggerFallback(tile, ctx) {
  const kanjiRecon = ctx.kanjiIndex?.get(tile) ?? tile;
  const tokens = tagOne(kanjiRecon);
  const isContent = (tok) => {
    if (FUNCTION_POS1.has(tok.pos1)) return false;
    if (FUNCTION_SURFACES.has(tok.surface)) return false;
    if (FUNCTION_SURFACES.has(tok.lemma)) return false;
    return true;
  };
  // Merge adjacent content-token runs whose concatenation is itself a
  // JMdict/atom entry (class-1 compounds the tagger still fragments even
  // with kanji reconstruction, e.g. two 名詞 tokens forming one noun-noun
  // compound headword). `tokenCount` tracks how many RAW tagger tokens
  // fed each run — a run built from exactly one tagger token is already
  // whatever the tagger considers one morpheme and is never re-split
  // below (single JMdict/atom entries routinely contain a short, coincidentally-
  // independently-valid substring — ある = あ+る, measured 2026-09-17 as
  // the largest false-positive source in the first v3 pass — so
  // `internalTwoWordSplit` only makes sense on a run the TAGGER itself
  // already split into 2+ tokens with no function word between them).
  const units = [];
  let run = "";
  let runTokenCount = 0;
  for (const tok of tokens) {
    if (isContent(tok)) {
      run += tok.surface;
      runTokenCount++;
    } else {
      if (run) units.push({ text: run, tokenCount: runTokenCount });
      run = "";
      runTokenCount = 0;
    }
  }
  if (run) units.push({ text: run, tokenCount: runTokenCount });
  let contentCount = 0;
  const details = [];
  for (const { text, tokenCount } of units) {
    const split = tokenCount >= 2 ? internalTwoWordSplit(text, ctx) : null;
    if (split) {
      contentCount += 2;
      details.push(`${split.left}+${split.right}`);
    } else {
      contentCount += 1;
      details.push(text);
    }
  }
  return { contentCount, details, tokens };
}

/** Does `text` split into two independently-valid JMdict/atom words at
 *  some internal point (both non-empty)? Used only inside the tagger
 *  fallback, on a run the tagger already called "content" but couldn't
 *  resolve as one recognized unit — checks whether it's actually TWO. */
function internalTwoWordSplit(text, ctx) {
  const existsFn = jmdictOrAtomExistsFn(ctx);
  for (let cut = 1; cut < text.length; cut++) {
    const left = text.slice(0, cut);
    const right = text.slice(cut);
    // Both halves must be >= 2 kana: single-mora JMdict entries (bare
    // particles, interjections, archaic readings) are common enough that
    // an unguarded 1-kana split finds a "valid" boundary inside almost
    // any word — measured false-positive source.
    if (left.length < 2 || right.length < 2) continue;
    if ((jmdictOrAtomHas(left, ctx) || tryDeconjugate(left, existsFn)) && (jmdictOrAtomHas(right, ctx) || tryDeconjugate(right, existsFn))) {
      return { left, right };
    }
  }
  return null;
}

const TRAILING_PUNCT = /[。？！、]+$/;

/**
 * @param {string} tile
 * @param {{kanjiIndex: Map<string,string>, atomKanaSet: Set<string>}} ctx
 * @returns {{chunks: number, reason: string}}
 */
export function decomposeTile(rawTile, ctx) {
  if (!rawTile) return { chunks: 0, reason: "empty tile" };
  // Sentence-final punctuation attaches directly to the last tile in a
  // step's tile array (「ある？」, 「いく。」) — strip it before any
  // dictionary/deconjugation lookup (JMdict entries and the deconjugation
  // table never include punctuation) so steps 1-4 resolve these instead of
  // falling through to the tagger fallback for something they'd handle
  // fine unpunctuated.
  const tile = rawTile.replace(TRAILING_PUNCT, "");
  if (!tile) return { chunks: 0, reason: "punctuation-only tile" };
  if (wholeTileIsWord(tile, ctx)) {
    return { chunks: 1, reason: `whole tile is a JMdict entry or course atom` };
  }
  if (wholeTileDeconjugates(tile, ctx)) {
    return { chunks: 1, reason: `tile deconjugates to a JMdict/atom dictionary form` };
  }
  const teAux = teAuxSplit(tile, ctx);
  if (teAux) {
    return {
      chunks: 1,
      reason: `te-form split: "${tile.slice(0, teAux.splitAt + 1)}"(${teAux.leftDict}) + aspectual aux "${tile.slice(teAux.splitAt + 1)}"(${teAux.rightDict})`,
    };
  }
  const prefixSplit = prefixContentSuffixFunction(tile, ctx);
  if (prefixSplit) {
    return { chunks: 1, reason: `content prefix "${prefixSplit.prefix}" + function suffix "${prefixSplit.suffix}"` };
  }
  const fallback = taggerFallback(tile, ctx);
  if (fallback.contentCount <= 1) {
    return { chunks: fallback.contentCount, reason: `tagger fallback: ${fallback.details.join(", ") || "(no content tokens)"}` };
  }
  return { chunks: fallback.contentCount, reason: `tagger fallback found ${fallback.contentCount} content units: ${fallback.details.join(", ")}` };
}

export { isCommonKanaEntry };

/** Build the small ctx this module needs from the runner's full step ctx
 *  (`run.mjs`/`measure.mjs`/`checks.test.mjs` all carry `kanjiIndex` and
 *  `atomKanaSet` already — see `lib/kanjiReconstruct.mjs`'s
 *  `buildKanjiIndex` and `lib/lexicon.mjs`'s `getAtomKanaSet`). */
export function buildTileMorphologyCtx(ctx) {
  return {
    kanjiIndex: ctx.kanjiIndex,
    atomKanaSet: ctx.atomKanaSet,
    courseLexicon: ctx.moduleId ? wholeLexicon(ctx.moduleId) : undefined,
  };
}
