/**
 * Q1 known-words: every content word in the step's answer and prompt was
 * introduced in an earlier module, or by a teach surface earlier in this
 * lesson.
 *
 * Tool: for JA, `jaSurfaces(step)` (`stepTaxonomy.ts`) for the exact set of
 * learner-facing kana surfaces (grading-only wrong forms already scrubbed —
 * `acceptedAnswers`, `antiPattern`, conjugation `distractors`, kanji-reading
 * `options`); for KO/ES, the generic field-based `stepSurfaces`
 * (`lib/surfaces.mjs` — ES/FR text isn't script-distinguishable from
 * English commentary the way JA kana is, so this walks known teaching
 * fields instead of filtering by script). Then `gateResidual` (`gate.ts`)
 * per surface at the step's own module either way — reused verbatim, no
 * reimplementation.
 *
 * FR is a special case: `gate.ts`'s `gateResidual` is documented
 * "language-agnostic... covers ja/ko/es" — FR has no adapter in
 * `normalizedAtoms.ts`'s `buildAtomsFor` (`src/features/lesson/data/
 * normalizedAtoms.ts`, out of this lane's file-ownership scope), so
 * `getNormalizedCourseAtoms("fr")` is always `[]` and `gateResidual` would
 * report EVERY non-empty FR surface as 100% unknown — not a real signal,
 * just noise. Marked `n/a` for FR with that reason rather than flooding
 * every FR step as a false "no".
 */
export const id = "Q1";
export const question =
  "does the learner already know every content word in this step's answer and prompt?";
// INFORMATIONAL, not enforced. Measured against real content (docs/
// procedural-qa-2026-09-17.md): `gate.ts`'s atom-surface matcher models
// VOCABULARY, not MORPHOLOGY — it has no notion of verb/adjective
// conjugation, so any step using a conjugated form of an otherwise-known
// verb (volitional のもう, negative たべない, past かった…) reports a false
// "unknown" residue for the ending. m34's own OWN grammar_rule step teaching
// the volitional form fails this way. This is a real, load-bearing
// limitation of the reused tool, not a runner bug — see the doc for the
// measured false-positive rate and the follow-up spec (lemma-normalize via
// the JA sidecar before matching).
export const enforced = false;

export function appliesTo() {
  return true; // every step type carries at least a prompt or an answer surface (FR handled inside run — see the n/a reason there)
}

export async function run(step, ctx) {
  if (ctx.lang === "fr") {
    return {
      answer: "n/a",
      evidence: ['no FR adapter in normalizedAtoms.ts\'s buildAtomsFor — gateResidual("fr", …) is always 100% unknown, not a real signal'],
    };
  }
  const surfaces = ctx.lang === "ja" ? ctx.jaSurfaces(step) : ctx.stepSurfaces(step);
  const evidence = [];
  let anyResidual = false;
  for (const surface of surfaces) {
    const residual = ctx.gateResidual(surface, ctx.lang, ctx.moduleNum);
    if (residual) {
      anyResidual = true;
      evidence.push(`"${surface}" has unknown residue "${residual}" at module ${ctx.moduleNum}`);
    }
  }
  if (surfaces.length === 0) {
    return { answer: "n/a", evidence: ["step carries no kana learner-facing surface"] };
  }
  if (!anyResidual) evidence.push(`${surfaces.length} surface(s) fully comprehensible`);
  return { answer: anyResidual ? "no" : "yes", evidence };
}

/** Plant: swap in an above-level word (module far beyond this course, so it
 *  can never resolve as an atom) into the step's primary target text. */
export function plant(step) {
  const clone = structuredClone(step);
  const inject = (s) => (typeof s === "string" ? `${s}ゼツメツキグシュ` : s);
  if ("targetSentence" in clone) clone.targetSentence = inject(clone.targetSentence);
  else if ("targetPhrase" in clone) clone.targetPhrase = inject(clone.targetPhrase);
  else if ("transcript" in clone) clone.transcript = inject(clone.transcript);
  else if (Array.isArray(clone.pairs) && clone.pairs.length > 0)
    clone.pairs = [{ ...clone.pairs[0], source: inject(clone.pairs[0].source) }, ...clone.pairs.slice(1)];
  else if (Array.isArray(clone.lines) && clone.lines.length > 0)
    clone.lines = [{ ...clone.lines[0], kana: inject(clone.lines[0].kana) }, ...clone.lines.slice(1)];
  else if (Array.isArray(clone.tiles) && clone.tiles.length > 0)
    clone.tiles = [...clone.tiles, "ゼツメツキグシュ"];
  else if (clone.prompt && typeof clone.prompt === "object" && "before" in clone.prompt)
    clone.prompt = { ...clone.prompt, before: inject(clone.prompt.before) };
  return clone;
}
