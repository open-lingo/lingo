/**
 * Static PT review pool — mirrors `es/esReviewPool.ts`'s role (a cycle-safe,
 * import-order-independent snapshot of every registered atom, for the
 * compounding-review helpers in `grammarHelpers.ts` to draw prior-module
 * surfaces from at lesson-build time).
 *
 * EMPTY on purpose: zero PT modules are authored (docs/pt-course-design-
 * 2026-09-18.md — scaffolding lane, no lesson content). Once m1+ ship,
 * either hand-maintain this the way `es/esReviewPool.ts` started, or add a
 * `scripts/gen-pt-review-pool.mjs` mirroring `scripts/gen-es-review-pool.mjs`
 * (ES's generator regenerates this file from the `curriculum/m*.ts`
 * `PT_M{N}_ATOMS` declarations — do not hand-edit once that script exists).
 */
export type PtReviewEntry = {
  surface: string;
  gloss: string;
  kind: "vocab" | "particle" | "phrase";
  fromModule: string;
  partOfSpeech: string;
};

export const PT_REVIEW_POOL: PtReviewEntry[] = [];
