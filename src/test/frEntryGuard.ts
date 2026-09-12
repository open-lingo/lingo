/**
 * FR module-graph entry guard (vitest setup file).
 *
 * `fr/courseAtoms.ts` eager-globs `fr/curriculum/m*.ts`, and every `mN.ts`
 * imports `atom` back from `courseAtoms.ts` — a load-bearing cycle
 * (docs/fr-article-glob-race-2026-09-10.md). Whoever touches an `mN.ts`
 * FIRST decides how that cycle unwinds: if a raw `mN` import is the entry,
 * `courseAtoms.ts` starts evaluating NESTED inside that module, its glob
 * finds `mN` mid-evaluation, skips it, and every later module bakes that
 * module's nouns bare via `withArticle()` (seen: m1 «café» bare in m3/m4/m6
 * on CI, 2026-09-12, runs 34671573584 / 34671573598 — green locally).
 *
 * Under the curriculum project's shared module cache the entry is whichever
 * test file the worker happens to evaluate first, so per-file guards are a
 * whack-a-mole. Running this as a setup file makes `courseAtoms.ts` the
 * entry in EVERY worker before ANY test file's imports run, whatever the
 * file order. Keep it as the only import here.
 */
import "@/features/languages/fr/courseAtoms";
