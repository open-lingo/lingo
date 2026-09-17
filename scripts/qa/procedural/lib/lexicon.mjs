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

let atomKanaSetByLang = new Map();

/** Every course atom's kana `display` form, as a Set — the "course-
 *  registered atom" lexicon override for Q3 v3 (`lib/tileMorphology.mjs`'s
 *  `decomposeTile` case (c)). Distinct from `getCourseAtomSurfaces` (Q4's
 *  `surface ?? kana`, no fallback for kanji-surfaced number atoms) — Q3
 *  matches against literal kana TILE text, so the kana-normalized
 *  `display` field (which DOES fall back for kanji-surfaced atoms, e.g.
 *  よん for 四) is the correct source here. */
export async function getAtomKanaSet(lang) {
  if (atomKanaSetByLang.has(lang)) return atomKanaSetByLang.get(lang);
  const atoms = await getAtoms(lang);
  const set = new Set(atoms.map((a) => a.display).filter(Boolean));
  // JA course furniture (character names, bare interjections) belongs to
  // no module and isn't in `getNormalizedCourseAtoms` OR JMdict — see
  // `getJaFurnitureKana`'s doc comment. Folded in here so every caller of
  // this set (Q2's isIndependentWord, Q3's whole-tile/atom check) gets it
  // for free instead of needing its own union.
  if (lang === "ja") {
    for (const k of await getJaFurnitureKana()) set.add(k);
  }
  atomKanaSetByLang.set(lang, set);
  return set;
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

let furnitureKana = null;

/**
 * JA "course furniture" — character names (たなか/ケン/ミカ/トム/タナカ) and
 * bare interjections (うん/そう/はい…), present since m3, belonging to no
 * module, and NOT in JMdict (they're proper nouns / discourse particles a
 * general-vocabulary dictionary doesn't carry — JMdict's own name data
 * lives in a SEPARATE database, JMnedict, not fetched by this lane).
 * Reused from `moduleCompiler.ts`'s own `JA_COURSE_FURNITURE_KANA` export
 * (its doc comment: "every OTHER consumer... must agree with the
 * compiler") rather than re-listing these five names + six interjections
 * here. Without this, Q3 v3's whole-tile JMdict/atom check has no way to
 * recognize たなか/ケン/ミカ as one word and the tagger fallback shreds
 * them into individual kana/katakana "content" morphemes — measured
 * 2026-09-17: this WAS the single largest false-positive source in the
 * first v3 measurement pass (hundreds of hits, m3 onward).
 */
export async function getJaFurnitureKana() {
  if (furnitureKana) return furnitureKana;
  const mod = await loadTs("/src/features/lesson/data/moduleCompiler.ts");
  furnitureKana = new Set(mod.JA_COURSE_FURNITURE_KANA ?? []);
  return furnitureKana;
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
