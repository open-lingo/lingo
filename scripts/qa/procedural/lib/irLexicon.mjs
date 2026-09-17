/**
 * Whole-course kana lexicon for Q2 (`whole-word-tiles`), promoting the v2
 * measurement in `docs/tile-shrapnel-2026-09-17.md` §3–4 into a callable
 * check.
 *
 * The IR compiler (`scripts/compile-ir.mjs`) already computes and commits
 * `lexiconKanas` into every `src/features/languages/ja/curriculum/ir/mN.ir.json`
 * — every registered atom kana surface, from EVERY module (earlier and
 * later). We read that file directly (read-only; never edited by this lane)
 * instead of recomputing it.
 *
 * Runtime-JSON adaptation of the original algorithm (`moduleCompiler.ts`'s
 * `diagnoseModule` "shrapnel" gate): that gate re-tokenizes IR beat text
 * itself to get its `vocabModule`-tokenized `toks`. This runner works off
 * the ALREADY-COMPILED runtime JSON, where a build/listen step's `tiles` /
 * `correctOrder` array **is** that same module-tokenized result (the shipped
 * tile bank). So test (a) RETOKENIZE becomes: re-tokenize the same chunk
 * against `moduleVocabApprox ∪ lexiconKanas` (whole-course) and compare to
 * the shipped tiles for that chunk; test (b) WHOLE-WORD SPAN is unchanged
 * (does a ≥3-kana lexicon word span a tile boundary within one chunk).
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../",
);
const IR_DIR = path.join(REPO_ROOT, "src/features/languages/ja/curriculum/ir");

const irCache = new Map();

/** Parsed `ir/<moduleId>.ir.json`, or null if it doesn't exist (KO has no
 *  IR; some ja modules may be unauthored). */
export function loadIr(moduleId) {
  if (irCache.has(moduleId)) return irCache.get(moduleId);
  const p = path.join(IR_DIR, `${moduleId}.ir.json`);
  const val = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
  irCache.set(moduleId, val);
  return val;
}

/** `ir.lexiconKanas` — every registered atom kana surface in the WHOLE
 *  course (earlier and later modules), length >= 3 (matches the v2 rule:
 *  a generic 2-kana stem is never a whole registered word, and stemming was
 *  exactly what drowned v1 in false positives — see the doc's §3). */
export function wholeLexicon(moduleId) {
  const ir = loadIr(moduleId);
  return new Set((ir?.lexiconKanas ?? []).filter((k) => k.length >= 3));
}

const PUNCT = /[。、？！]/g;

/** Same chunk split `diagnoseModule` uses: strip sentence punctuation, split
 *  on (full-width or ascii) whitespace. */
export function chunksOf(sentence) {
  return sentence
    .replace(PUNCT, "")
    .split(/[　\s]+/)
    .filter(Boolean);
}

/**
 * Group a step's ordered tiles into their originating authored chunks (the
 * space-delimited pieces of `targetSentence`), by consuming tiles until
 * their concatenated length matches each chunk's length. Trailing sentence
 * punctuation on the last tile is stripped first, mirroring `diagnoseModule`
 * treating `。？！` as a boundary mark, not part of the word.
 *
 * Returns `null` (skip — not an error) if the tiles don't cleanly sum to the
 * chunks, which can happen for step shapes this runner doesn't model
 * (declared as evidence by the caller, never thrown).
 */
export function groupTilesIntoChunks(sentence, tiles) {
  const chunks = chunksOf(sentence);
  const stripped = tiles.map((t) => t.replace(/[。？！]+$/, ""));
  const groups = [];
  let ti = 0;
  for (const chunk of chunks) {
    const group = [];
    let len = 0;
    while (ti < stripped.length && len < chunk.length) {
      group.push(stripped[ti]);
      len += stripped[ti].length;
      ti++;
    }
    if (len !== chunk.length) return null;
    groups.push({ chunk, tiles: group });
  }
  if (ti !== stripped.length) return null;
  return groups;
}

/**
 * Test (b) WHOLE-WORD SPAN over one chunk's tile group: does a whole
 * lexicon word (>= 3 kana), that is NOT itself one of the shipped tiles,
 * span a boundary between two adjacent tiles?
 */
export function spanHit(chunk, tileGroup, lexicon) {
  const boundaries = [];
  let cum = 0;
  for (const t of tileGroup.slice(0, -1)) {
    cum += t.length;
    boundaries.push(cum);
  }
  const tokenSet = new Set(tileGroup);
  for (const K of lexicon) {
    if (tokenSet.has(K)) continue;
    let idx = chunk.indexOf(K);
    while (idx !== -1) {
      const s = idx;
      const e = idx + K.length;
      const hit = boundaries.find((b) => s < b && b < e);
      if (hit !== undefined) return { K, boundary: hit };
      idx = chunk.indexOf(K, idx + 1);
    }
  }
  return null;
}

/** Greedy longest-match tokenizer, same shape as `moduleCompiler.ts`'s
 *  internal `tokenizeChunk` (offsets dropped — only token strings needed
 *  here). `vocabSorted` must already be sorted longest-first. */
export function tokenize(vocabSorted, chunk) {
  const toks = [];
  let i = 0;
  while (i < chunk.length) {
    const hit = vocabSorted.find((t) => chunk.startsWith(t, i));
    if (hit) {
      toks.push(hit);
      i += hit.length;
    } else {
      let j = i + 1;
      while (j < chunk.length && !vocabSorted.some((t) => chunk.startsWith(t, j))) j++;
      toks.push(chunk.slice(i, j));
      i = j;
    }
  }
  return toks;
}
