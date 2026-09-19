/**
 * lib/stepsCore.mjs — the DEBUT half of spec -> candidate steps: map,
 * imageMcq, clozeLit, buildLit. Split from `lib/steps.mjs` purely to keep
 * every file under this lane's 150-line budget; see `lib/stepsClose.mjs`
 * for the closing half (listenCompLit/agreementLit/sim/matchLit/speakWin).
 */
import { bare, lower1 } from "../../../draft/pt-ir/assemble.mjs";
import { PT_CONTRACTIONS, MAX_IMAGE_MCQ_PER_LESSON, TILE_FLOOR, FALLBACK_IMAGE_DISTRACTORS } from "./rules.mjs";

let seq = 0;
export const resetIds = () => { seq = 0; };
const nextId = (prefix) => `${prefix}-${(seq += 1)}`;

/** map — the §13.3 first-view beat, built from the FIRST spec sentence.
 *  Tokens are the literal words of that sentence (punctuation kept
 *  attached, matching L1's own mapLit); a token maps to an English gloss
 *  when it matches a taught word's `pt` surface (case-insensitive, trailing
 *  punctuation stripped) — words outside `spec.words` (bare function
 *  words) are left unmapped, a documented simplification (see the
 *  PTTOOL report). */
export function buildMap(spec) {
  const s = spec.sentences[0];
  const tokens = s.pt.split(" ");
  const pairs = [];
  for (let i = 0; i < tokens.length; i++) {
    const bareWord = tokens[i].replace(/[.,!?]+$/, "");
    const w = spec.wordByPt.get(bareWord) ?? [...spec.wordByPt.values()].find((x) => x.pt.toLowerCase() === bareWord.toLowerCase());
    if (w) pairs.push({ en: w.en, tokenIndex: i });
  }
  return {
    id: "map", kind: "map", tokens,
    pairs: pairs.length ? pairs : [{ en: s.en, tokenIndex: 0 }],
    audioText: lower1(bare(s.pt)),
  };
}

/** imageMcq — one per imageable noun on debut, max 2 (§4 shared rules).
 *  Distractors prefer real taught vocabulary; fall back to a small curated
 *  pool of common concrete nouns when none exists yet (m1 L1's own case —
 *  there is no prior lesson). */
export function buildImageMcqs(spec, priorVocab) {
  const imageable = spec.words.filter((w) => w.emoji && (w.pos === "noun" || w.pos === "proper-noun"));
  const pool = imageable.slice(0, MAX_IMAGE_MCQ_PER_LESSON);
  const used = new Set(pool.map((w) => w.pt));
  const distractorSource = priorVocab && priorVocab.size
    ? [...priorVocab.values()].filter((a) => a.emoji && !used.has(a.surface))
    : FALLBACK_IMAGE_DISTRACTORS.filter((d) => !used.has(d.surface));
  return pool.map((target, i) => {
    const window = distractorSource.filter((d) => (d.surface ?? d.pt) !== target.pt).slice(i * 3, i * 3 + 3);
    const ds = (window.length >= 3 ? window : FALLBACK_IMAGE_DISTRACTORS.filter((d) => d.surface !== target.pt).slice(0, 3))
      .map((d) => ({ surface: d.surface, emoji: d.emoji }));
    return {
      id: nextId("img"), kind: "imageMcq",
      target: { surface: target.pt, meaningEn: target.en, emoji: target.emoji },
      distractors: ds,
    };
  });
}

/** clozeLit — one per `cloze:<word>` role, and unconditionally for any
 *  `build`-tagged sentence whose `uses` includes a PT contraction (design
 *  doc §3: contractions are cloze-only, never a tile, even if the author
 *  tagged the sentence `build`). */
export function buildClozeLits(spec) {
  const out = [];
  for (const s of spec.sentences) {
    const clozeRoles = s.roles.filter((r) => r.startsWith("cloze:")).map((r) => r.split(":")[1]);
    const forcedContraction = s.roles.includes("build") && s.uses.find((u) => PT_CONTRACTIONS.has(u.toLowerCase()));
    const blanks = clozeRoles.length ? clozeRoles : forcedContraction ? [forcedContraction] : [];
    for (const blank of blanks) {
      const samePos = s.uses.filter((u) => spec.wordByPt.get(u)?.pos === spec.wordByPt.get(blank)?.pos && u !== blank);
      const options = [blank, ...samePos].slice(0, 3);
      if (options.length < 2) options.push(...[...spec.wordByPt.keys()].filter((k) => k !== blank).slice(0, 2 - options.length + 1));
      out.push({ id: nextId("clz"), kind: "clozeLit", pt: s.pt, en: s.en, blank, options: [...new Set(options)], atoms: s.uses });
    }
  }
  return out;
}

/** buildLit — `build`-tagged sentences, skipping any forced into clozeLit
 *  above. Refuses < TILE_FLOOR tiles unless the sentence carries the
 *  `debut` role (the grammar point's first-ever sentence). */
export function buildBuildLits(spec) {
  const out = [];
  for (const s of spec.sentences) {
    if (!s.roles.includes("build")) continue;
    if (s.uses.some((u) => PT_CONTRACTIONS.has(u.toLowerCase()))) continue; // handled as clozeLit
    const tileCount = bare(s.pt).split(" ").length;
    if (tileCount < TILE_FLOOR && !s.roles.includes("debut")) {
      throw new Error(
        `buildLit: "${s.pt}" has ${tileCount} tiles (< ${TILE_FLOOR}) and is not tagged "debut" — ` +
          `smallest fix: add role "debut", or extend the sentence to >= ${TILE_FLOOR} words`,
      );
    }
    out.push({ id: nextId("bld"), kind: "buildLit", pt: s.pt, en: s.en, tiles: [], atoms: s.uses });
  }
  return out;
}
