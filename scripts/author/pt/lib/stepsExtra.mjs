/**
 * lib/stepsExtra.mjs — round-2 (lane PTTOOL2) candidate builders: the
 * mid-lesson `speak` role, `contrast` minimal pairs, `pattern` structured
 * input, `conjugation` cloze series, and the auto-synthesized `phrase`
 * debut `lib/schedule.mjs`'s debut-guarantee pass reaches for (finding 1b:
 * a contraction-forced cloze must never BE an atom's debut). Split from
 * `lib/stepsCore.mjs`/`lib/stepsClose.mjs` to keep every file under this
 * lane's 150-line budget.
 */
let seq = 0;
export const resetIds = () => { seq = 0; };
const nextId = (prefix) => `${prefix}-${(seq += 1)}`;

/** `speak` role — a mid-lesson `speakLit` on any tagged sentence (round-1
 *  gap: only the closing win sentence ever got one). Retention-rhythm law
 *  3 (docs/pt-course-design-2026-09-18.md, pack "known gaps"): a new form's
 *  first VOICING should print before it becomes a cloze answer — tag the
 *  sentence that introduces a form `speak` before any `cloze:<that form>`. */
export function buildSpeaks(spec) {
  return spec.sentences
    .map((s, si) => ({ s, si }))
    .filter(({ s }) => s.roles.includes("speak"))
    .map(({ s, si }) => ({ id: nextId("spk"), kind: "speakLit", _ord: si, pt: s.pt, en: s.en, atoms: s.uses }));
}

/** `contrast: [{a, b, note}]` — a minimal-pair `textMcq` ("which word means
 *  X?", options = the pair + padding to 3 distinct surfaces) per §2 row b's
 *  ladder (avó/avô, é/está). Distractor padding draws from prior taught
 *  vocabulary first (real surfaces), never invented ones. */
export function buildContrastSteps(spec, priorVocab) {
  const pad = priorVocab ? [...priorVocab.keys()] : [];
  return spec.contrast.map((c, i) => {
    const extra = pad.filter((s) => s !== c.a && s !== c.b).slice(0, 2);
    const distractors = [c.b, ...extra];
    while (distractors.length < 3) distractors.push(`${c.b}${"!".repeat(distractors.length)}`); // last-resort padding, never reached once >=2 prior lessons exist
    return {
      id: nextId("con"), kind: "textMcq", _ord: -1,
      target: c.a, distractors, prompt: c.note ?? `Which word means "${spec.wordByPt.get(c.a)?.en ?? c.a}"?`,
      atoms: [c.a],
    };
  });
}

/** `pattern: { frame, slots: [{pt, en, distractorsEn}] }` — structured
 *  input (§2 row c: "a new grammar point's first retrieval step is
 *  input-only"): the learner sees a FILLED frame and picks its English
 *  meaning — an `mcq` (sentenceMcq), never a production step. */
export function buildPatternSteps(spec) {
  if (!spec.pattern) return [];
  return spec.pattern.slots.map((sl, i) => ({
    id: nextId("pat"), kind: "mcq", _ord: -1,
    prompt: sl.pt, correct: sl.en, distractors: sl.distractorsEn,
    why: `Pattern: ${spec.pattern.frame}`, atoms: [],
  }));
}

/** `conjugation: { verb, forms: [{pt, en, blank}] }` — a clozeLit SERIES
 *  across persons (harder-grammar prep for m2+): each form's own sentence,
 *  blanked at its conjugated form, with every OTHER form in the set as a
 *  distractor option (the same "whole paradigm as the option pool"
 *  discipline `contrastSet` uses for round-1's ser/estar/ter pairs). */
export function buildConjugationClozes(spec) {
  if (!spec.conjugation) return [];
  const allBlanks = spec.conjugation.forms.map((f) => f.blank);
  return spec.conjugation.forms.map((f, i) => ({
    id: nextId("cnj"), kind: "clozeLit", _ord: -1,
    pt: f.pt, en: f.en, blank: f.blank,
    options: [...new Set(allBlanks)],
    atoms: [f.blank], why: `${spec.conjugation.verb}: ${f.blank} vs. ${allBlanks.filter((b) => b !== f.blank).join("/")}`,
  }));
}

/** Synthesizes a `phrase` debut candidate for an atom that would otherwise
 *  first print on a non-intro-capable step (finding 1b: a build sentence
 *  forced to `clozeLit` by a contraction must never BE that sentence's
 *  other atoms' debut). `ord` should be one tick before the step it's
 *  rescuing, so the order-preserving interleave places it immediately
 *  before. */
export function buildPhraseDebut(word, ord) {
  return {
    id: nextId("phr"), kind: "phrase", _ord: ord,
    meaning: word.en, text: word.pt, emoji: word.emoji, atoms: [word.pt],
  };
}
