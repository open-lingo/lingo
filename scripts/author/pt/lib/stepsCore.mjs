/**
 * lib/stepsCore.mjs — the DEBUT half of spec -> candidate steps: map,
 * imageMcq, clozeLit, buildLit. Split from `lib/steps.mjs` purely to keep
 * every file under this lane's 150-line budget; see `lib/stepsClose.mjs`
 * for the closing half (listenCompLit/agreementLit/sim/matchLit/speakWin)
 * and `lib/stepsExtra.mjs` for round-2's additions (speak/contrast/
 * pattern/conjugation/auto-phrase-debut).
 *
 * Every candidate step here also carries `_ord`: the sentence's (or,
 * for imageMcq, the word's) index in the spec's own `sentences:`/`words:`
 * list — `lib/schedule.mjs`'s interleave reads this to keep the final step
 * order close to the author's written order (PTTOOL2 finding 1c), instead
 * of a kind-grouping heuristic that could reorder a debut sentence behind
 * a later one just because its kind's queue happened to be longer.
 */
import { bare, lower1 } from "../../../draft/pt-ir/assemble.mjs";
import { PT_CONTRACTIONS, MAX_IMAGE_MCQ_PER_LESSON, TILE_FLOOR, FALLBACK_IMAGE_DISTRACTORS } from "./rules.mjs";
import { normalizeSentence, literalToken, dedupeOptionsCaseInsensitive } from "./normalizeText.mjs";

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
 *  Distractors prefer real taught vocabulary of the SAME part of speech
 *  (PTGRADE finding 3: "never olá 👋 against gato" — an interjection is
 *  not a plausible distractor for a noun); fall back to the small curated
 *  pool of common concrete nouns (also POS-tagged "noun") when no matching
 *  taught vocabulary exists yet (m1 L1's own case). */
export function buildImageMcqs(spec, priorVocab) {
  const imageable = spec.words.filter((w) => w.emoji && (w.pos === "noun" || w.pos === "proper-noun"));
  const pool = imageable.slice(0, MAX_IMAGE_MCQ_PER_LESSON);
  const used = new Set(pool.map((w) => w.pt));
  const priorPool = priorVocab && priorVocab.size
    ? [...priorVocab.values()].filter((a) => a.emoji && (a.partOfSpeech === "noun" || a.partOfSpeech === "proper-noun") && !used.has(a.surface))
    : [];
  return pool.map((target, i) => {
    const window = priorPool.filter((d) => d.surface !== target.pt).slice(i * 3, i * 3 + 3);
    const ds = (window.length >= 3 ? window : FALLBACK_IMAGE_DISTRACTORS.filter((d) => d.surface !== target.pt && d.pos === "noun").slice(0, 3))
      .map((d) => ({ surface: d.surface, emoji: d.emoji }));
    return {
      id: nextId("img"), kind: "imageMcq", _ord: spec.sentences.findIndex((s) => s.uses.includes(target.pt)) ?? 0,
      target: { surface: target.pt, meaningEn: target.en, emoji: target.emoji },
      distractors: ds,
    };
  });
}

/** clozeLit — one per `cloze:<word>` role, and unconditionally for any
 *  `build`-tagged sentence whose `uses` includes a PT contraction (design
 *  doc §3: contractions are cloze-only, never a tile, even if the author
 *  tagged the sentence `build`).
 *
 *  Options (PTGRADE finding 1): when the blanked word belongs to a spec
 *  `contrastSet`, the options are EXACTLY that set (never a random
 *  same-POS noun from the lesson bag — the round-1 grading loss was a
 *  cloze offering "sou / gato / amigo" instead of "sou / é", which tests
 *  vocabulary recognition, not the grammar point). Falls back to the old
 *  same-POS-in-sentence heuristic only when no contrastSet covers the
 *  blank (e.g. a one-off cloze with no paradigm mate yet).
 *
 *  ROUND 3 (lane PTTOOL3, rule 7): the emitted `blank` is now the LITERAL
 *  token found in the sentence's FINAL (post-`normalizeSentence`) text —
 *  not the bare canonical surface the author/atom writes. R2-L2 hit this
 *  twice: a sentence-initial "Onde" never matched a `blank: "onde"`
 *  (assemble.mjs's `words(pt).indexOf(blank)` is an exact, case-sensitive
 *  match), and "cidade," (trailing comma) never matched `blank: "cidade"`
 *  — the round-1 workaround was re-wording the sentence to dodge both.
 *  `dedupeOptionsCaseInsensitive` closes the companion bug (options
 *  offering "Onde" AND "onde" as if they were different words). */
export function buildClozeLits(spec) {
  const out = [];
  const setFor = (w) => spec.contrastSet.find((set) => set.includes(w));
  for (const [si, s] of spec.sentences.entries()) {
    const clozeRoles = s.roles.filter((r) => r.startsWith("cloze:")).map((r) => r.split(":")[1]);
    const forcedContraction = s.roles.includes("build") && s.uses.find((u) => PT_CONTRACTIONS.has(u.toLowerCase()));
    const blanks = clozeRoles.length ? clozeRoles : forcedContraction ? [forcedContraction] : [];
    const finalPt = normalizeSentence(s.pt); // matches what emitFragment.mjs will later write for `pt`
    for (const canonicalBlank of blanks) {
      const blank = literalToken(finalPt, canonicalBlank) ?? canonicalBlank; // fall back so a genuine "not a word of the sentence" error still surfaces downstream, unobscured
      const set = setFor(canonicalBlank);
      let options;
      let why;
      if (set) {
        options = set.map((m) => (m === canonicalBlank ? blank : m));
        why = `"${blank}" is part of the ${set.join("/")} contrast set — pick the one that fits here.`;
      } else {
        const samePos = s.uses.filter((u) => spec.wordByPt.get(u)?.pos === spec.wordByPt.get(canonicalBlank)?.pos && u !== canonicalBlank);
        options = [blank, ...samePos].slice(0, 3);
        if (options.length < 2) options.push(...[...spec.wordByPt.keys()].filter((k) => k !== canonicalBlank).slice(0, 2 - options.length + 1));
        why = "";
      }
      out.push({
        id: nextId("clz"), kind: "clozeLit", _ord: si, pt: s.pt, en: s.en, blank,
        options: dedupeOptionsCaseInsensitive([...new Set(options)], blank), atoms: s.uses, why,
      });
    }
  }
  return out;
}

/** buildLit — `build`-tagged sentences, skipping any forced into clozeLit
 *  above. Refuses < TILE_FLOOR tiles unless the sentence carries the
 *  `debut` role (the grammar point's first-ever sentence). */
export function buildBuildLits(spec) {
  const out = [];
  spec.sentences.forEach((s, si) => {
    if (!s.roles.includes("build")) return;
    if (s.uses.some((u) => PT_CONTRACTIONS.has(u.toLowerCase()))) return; // handled as clozeLit
    const tileCount = bare(s.pt).split(" ").length;
    if (tileCount < TILE_FLOOR && !s.roles.includes("debut")) {
      throw new Error(
        `buildLit: "${s.pt}" has ${tileCount} tiles (< ${TILE_FLOOR}) and is not tagged "debut" — ` +
          `smallest fix: add role "debut", or extend the sentence to >= ${TILE_FLOOR} words`,
      );
    }
    out.push({ id: nextId("bld"), kind: "buildLit", _ord: si, pt: s.pt, en: s.en, tiles: [], atoms: s.uses });
  });
  return out;
}
