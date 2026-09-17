/**
 * Generic (non-JA) learner-facing-surface extractor for Q1/Q6, ported from
 * `stepTaxonomy.ts`'s `jaSurfaces`. JA's version filters by SCRIPT (kana-
 * only regex) because JA target text and English commentary are script-
 * distinguishable. ES/FR/KO target text and English commentary are BOTH
 * Latin (ES/FR) or Latin-adjacent (KO's own gloss/explanation fields are
 * still English/Latin) — a script filter cannot tell them apart, so this
 * file is FIELD-based instead: it walks only the known teaching-surface
 * field names (the same set Q10's `GRADED_FIELDS` uses for JA, since that
 * list already IS "every field the render pipeline grades/speaks," which
 * is language-agnostic by construction — confirmed against real ES/FR/KO
 * runtime JSON, `docs/procedural-qa-2026-09-17.md`).
 */
const TEXT_FIELDS = [
  "targetSentence",
  "targetPhrase",
  "audioKey",
  "audioText",
  "transcript",
  "correctParticle",
];

export function stepSurfaces(step) {
  const out = [];
  for (const f of TEXT_FIELDS) if (typeof step[f] === "string") out.push(step[f]);
  if (Array.isArray(step.tiles)) for (const t of step.tiles) if (typeof t === "string") out.push(t);
  if (Array.isArray(step.correctOrder))
    for (const t of step.correctOrder) if (typeof t === "string") out.push(t);
  if (step.prompt && typeof step.prompt === "object") {
    if (typeof step.prompt.before === "string") out.push(step.prompt.before);
    if (typeof step.prompt.after === "string") out.push(step.prompt.after);
  }
  if (Array.isArray(step.lines))
    for (const l of step.lines) if (typeof l.kana === "string") out.push(l.kana);
  if (Array.isArray(step.pairs))
    for (const p of step.pairs) if (typeof p.source === "string") out.push(p.source);
  if (Array.isArray(step.turns))
    for (const t of step.turns) if (typeof t.npc?.kana === "string") out.push(t.npc.kana);
  if (Array.isArray(step.options))
    for (const o of step.options) if (typeof o.word === "string") out.push(o.word);
  return [...new Set(out)];
}
