/**
 * Course-lexicon / comprehensibility access, all reused from existing
 * source via the `tsBridge` (never reimplemented):
 *   - `getNormalizedCourseAtoms` — `src/features/lesson/data/normalizedAtoms.ts`
 *   - `gateResidual` / `isComprehensible` — `src/features/practice/content/gate.ts`
 *   - `jaSurfaces` / `SELECTION_TYPES` — `src/features/lesson/data/stepTaxonomy.ts`
 *   - `courseAtoms` — `src/shared/language/registry.ts`'s `getLanguageModule`
 */
import { loadTs } from "./tsBridge.mjs";

let atomsByLang = new Map();
let atomSurfacesByLang = new Map();

export async function getAtoms(lang) {
  if (atomsByLang.has(lang)) return atomsByLang.get(lang);
  const mod = await loadTs("/src/features/lesson/data/normalizedAtoms.ts");
  const atoms = mod.getNormalizedCourseAtoms(lang);
  atomsByLang.set(lang, atoms);
  return atoms;
}

/**
 * Q4's atom-surface set, ported to match `particleTileSeparation.test.ts`'s
 * OWN source EXACTLY: `getLanguageModule(lang).courseAtoms.map(a => a.surface
 * ?? a.kana)` — not `getNormalizedCourseAtoms`'s kana-normalized `.display`.
 *
 * These two atom lists disagree for number/question-word atoms whose raw
 * `courseAtoms.surface` is the KANJI form (e.g. ja:ja-m5-1-v-4 "four" has
 * `surface: "四"`, no `kana` field) — `getNormalizedCourseAtoms` normalizes
 * that to `display: "よん"`, but the real test's `surface ?? kana` never
 * falls back to kana because `surface` is already truthy. Using the
 * kana-normalized set here (as an earlier version of this port did) makes
 * Q4 MORE sensitive than the real gate: it flags real conjugated forms that
 * happen to share a kana prefix with a bare-kanji-surfaced number atom —
 * よんで (te-form of よむ "to read") as よん("four")+で, なんで ("why") as
 * なん("what")+で, きゅうに ("suddenly") as きゅう("nine")+に — five false
 * positives measured 2026-09-17 (`docs/procedural-qa-2026-09-17.md` §3),
 * none reproducible against `particleTileSeparation.test.ts` (which passes,
 * 0 violations, on the same shipped content). Mirroring the real gate's
 * atom source exactly clears all five.
 */
export async function getCourseAtomSurfaces(lang) {
  if (atomSurfacesByLang.has(lang)) return atomSurfacesByLang.get(lang);
  const reg = await loadTs("/src/shared/language/registry.ts");
  const mod = reg.getLanguageModule(lang);
  const set = new Set(mod.courseAtoms.map((a) => String(a.surface ?? a.kana ?? "")));
  atomSurfacesByLang.set(lang, set);
  return set;
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
