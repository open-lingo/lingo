/**
 * Course-lexicon / comprehensibility access, all reused from existing
 * source via the `tsBridge` (never reimplemented):
 *   - `getNormalizedCourseAtoms` — `src/features/lesson/data/normalizedAtoms.ts`
 *   - `gateResidual` / `isComprehensible` — `src/features/practice/content/gate.ts`
 *   - `jaSurfaces` / `SELECTION_TYPES` — `src/features/lesson/data/stepTaxonomy.ts`
 */
import { loadTs } from "./tsBridge.mjs";

let atomsByLang = new Map();

export async function getAtoms(lang) {
  if (atomsByLang.has(lang)) return atomsByLang.get(lang);
  const mod = await loadTs("/src/features/lesson/data/normalizedAtoms.ts");
  const atoms = mod.getNormalizedCourseAtoms(lang);
  atomsByLang.set(lang, atoms);
  return atoms;
}

export async function getGate() {
  return loadTs("/src/features/practice/content/gate.ts");
}

export async function getStepTaxonomy() {
  return loadTs("/src/features/lesson/data/stepTaxonomy.ts");
}

/** `gateResidual(text, lang, module)` — "" means fully comprehensible. */
export async function gateResidual(text, lang, module) {
  const gate = await getGate();
  return gate.gateResidual(text, lang, module);
}

/** Every kana-only, learner-facing surface in a JA step (grading-only wrong
 *  forms scrubbed — see `stepTaxonomy.ts`'s own doc comment). */
export async function jaSurfaces(step) {
  const tax = await getStepTaxonomy();
  return tax.jaSurfaces(step);
}

export async function getSelectionTypes() {
  const tax = await getStepTaxonomy();
  return tax.SELECTION_TYPES;
}
