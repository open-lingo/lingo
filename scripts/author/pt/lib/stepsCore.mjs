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
import { normalizeSentence, literalToken, dedupeOptionsCaseInsensitive, firstGloss } from "./normalizeText.mjs";

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
    // ITEM 3 (lane PTTOOL5): a map pair glosses ONE printed token, so it
    // takes only the word's FIRST gloss clause, never the whole
    // dictionary entry — see firstGloss's own header for the comma/slash
    // rule.
    if (w) pairs.push({ en: firstGloss(w.en), tokenIndex: i });
  }
  return {
    id: "map", kind: "map", tokens,
    pairs: pairs.length ? pairs : [{ en: s.en, tokenIndex: 0 }],
    audioText: lower1(bare(s.pt)),
  };
}

/** imageMcq — one per imageable noun on debut, max 2 (§4 shared rules).
 *
 *  ITEM 4 (lane PTTOOL5): distractors are real taught NOUNS from this
 *  lesson or an EARLIER one — never a proper noun (an emoji'd place/person
 *  name is not a plausible foil for a common noun) and never an
 *  `imageable: false` atom (already excluded structurally: `spec.mjs`
 *  only lets such an atom skip `emoji`, so "has an emoji" already implies
 *  "imageable"). Same-`class` candidates (when the target has one) are
 *  tried first — PTGRADE found "estudante/professor/cidade" offered
 *  against "gato", every one off-domain and answerable from the emoji
 *  alone. Falls back to the small curated common-noun pool only when
 *  fewer than 3 taught candidates qualify, and prints an INFO line naming
 *  which target triggered it (never silent). The two image steps of one
 *  lesson never share their distractor SET — `usedDistractors` is
 *  threaded across the `.map` so the second step can't redraw the first's
 *  picks. */
export function buildImageMcqs(spec, priorVocab) {
  const isImageableNoun = (pos) => pos === "noun"; // proper nouns are never distractor material
  const pool = spec.words.filter((w) => w.emoji && (w.pos === "noun" || w.pos === "proper-noun")).slice(0, MAX_IMAGE_MCQ_PER_LESSON);

  const sameLessonNouns = spec.words
    .filter((w) => w.emoji && isImageableNoun(w.pos))
    .map((w) => ({ surface: w.pt, emoji: w.emoji, class: w.class }));
  const earlierNouns = priorVocab && priorVocab.size
    ? [...priorVocab.values()].filter((a) => a.emoji && isImageableNoun(a.partOfSpeech)).map((a) => ({ surface: a.surface, emoji: a.emoji, class: a.class }))
    : [];
  const candidates = [...sameLessonNouns, ...earlierNouns];

  const usedDistractors = new Set();
  return pool.map((target, i) => {
    const eligible = candidates.filter((d) => d.surface !== target.pt && !usedDistractors.has(d.surface));
    const ranked = target.class
      ? [...eligible.filter((d) => d.class === target.class), ...eligible.filter((d) => d.class !== target.class)]
      : eligible;
    let chosen = ranked.slice(0, 3);
    if (chosen.length < 3) {
      const need = 3 - chosen.length;
      const fromFallback = FALLBACK_IMAGE_DISTRACTORS.filter(
        (d) => d.surface !== target.pt && d.pos === "noun" && !usedDistractors.has(d.surface) && !chosen.some((c) => c.surface === d.surface),
      ).slice(0, need);
      if (fromFallback.length) {
        console.log(
          `from-spec: imageMcq "${target.pt}": only ${chosen.length} taught noun distractor(s) qualify — ` +
            `INFO: falling back to ${fromFallback.length} curated module noun(s) (${fromFallback.map((d) => d.surface).join(", ")})`,
        );
      }
      chosen = [...chosen, ...fromFallback];
    }
    for (const c of chosen) usedDistractors.add(c.surface);
    return {
      id: nextId("img"), kind: "imageMcq", _ord: spec.sentences.findIndex((s) => s.uses.includes(target.pt)) ?? 0,
      target: { surface: target.pt, meaningEn: target.en, emoji: target.emoji },
      distractors: chosen.map((d) => ({ surface: d.surface, emoji: d.emoji })),
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
        // ITEM 2 (lane PTTOOL5): `why` is the spec-resolved, validated
        // explanation (spec.mjs's contrastSetWhy — either an explicit
        // `why:` or a matching `contrast[].note`), written verbatim —
        // never the old templated "part of the X/Y contrast set" stub.
        why = spec.contrastSetWhy[spec.contrastSet.indexOf(set)];
      } else {
        const samePos = s.uses.filter((u) => spec.wordByPt.get(u)?.pos === spec.wordByPt.get(canonicalBlank)?.pos && u !== canonicalBlank);
        options = [blank, ...samePos].slice(0, 3);
        if (options.length < 2) options.push(...[...spec.wordByPt.keys()].filter((k) => k !== canonicalBlank).slice(0, 2 - options.length + 1));
        why = s.why ?? ""; // PTGRADE8: per-sentence why when the spec wrote one
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
