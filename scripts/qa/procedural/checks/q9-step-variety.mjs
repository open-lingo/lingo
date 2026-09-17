/**
 * Q9 step-variety: no 4+ consecutive selection-only steps; 10-25 steps per
 * (teaching) lesson. Ported from FR's `fr-quality.test.ts` ("FR quality —
 * density & variety"), which is the only course-level implementation of
 * this rule today. Lesson-scoped, not step-scoped: reported once, on the
 * lesson's first step; every other step is n/a.
 *
 * `SELECTION_TYPES` reused from `stepTaxonomy.ts` (the shared source both
 * the compiler and the JA authoring guards already read) rather than
 * FR's locally-declared `SELECTION_TYPES` constant, which lists mostly the
 * same JA-irrelevant FR step names.
 */
export const id = "Q9";
export const question =
  "does this lesson stay in the 10-25 step band with no 4+ run of selection-only steps?";
export const enforced = true;

/**
 * Kana/sound-row micro-lessons (2026-09-17, lane A9 — decision recorded in
 * docs/procedural-qa-2026-09-17.md). JA module 1's kana-introduction
 * lessons all share one lesson id convention: `ja-m1-<row>-<n>` (n = 1-3),
 * e.g. `ja-m1-ya-1`, `ja-m1-l1-2`, `ja-m1-yoon-sh-ch-3` — confirmed by
 * grepping every `ja-m1-*` lesson id in the curriculum (57 of them, zero
 * exceptions). Each one deliberately teaches ONE new kana symbol (or a
 * small yōon/dakuten cluster) plus one anchor word per sub-lesson (see the
 * "1+1+1 split" doc comments in m1-ya.ts / m1-wa.ts) — a fundamentally
 * different lesson archetype from the vocab/grammar "teaching lesson" the
 * FR density doctrine (fr-quality.test.ts, 10-25 steps for practice
 * variety) was written for. A row with only 3 kana (ya: や ゆ よ; wa: わ
 * を ん) cannot be padded to 10 steps without hollow filler — banned by
 * this repo's own step-type doctrine. Skipped entirely (not just the
 * step-count sub-check) since the variety/selection-run half of this
 * question targets the same "long teaching lesson" archetype.
 */
const KANA_ROW_LESSON_ID = /^ja-m1-[a-z0-9]+(?:-[a-z]+)*-[1-3]$/;

export function appliesTo(step, ctx) {
  return ctx.stepIndex === 0 && !KANA_ROW_LESSON_ID.test(ctx.lessonId);
}

export async function run(_step, ctx) {
  const steps = ctx.lessonSteps;
  const evidence = [];
  let bad = false;

  // Review/challenge/recap lessons are deliberately short or long reviews,
  // not the 10-25 "teaching lesson" band FR's rule targets; only flag the
  // band on lessons that look like normal teaching lessons (id has no
  // "review"/"recap"/"challenge" marker), matching FR's TEACHING/CHECKPOINT
  // split conceptually without importing FR's lesson-kind classifier.
  const isTeaching = !/review|recap|challenge/i.test(ctx.lessonId);
  if (isTeaching && (steps.length < 10 || steps.length > 25)) {
    bad = true;
    evidence.push(`${steps.length} steps, outside the 10-25 band`);
  }

  const selectionTypes = ctx.selectionTypes;
  let run = 0;
  let maxRun = 0;
  for (const s of steps) {
    run = selectionTypes.has(s.type) ? run + 1 : 0;
    maxRun = Math.max(maxRun, run);
    if (run >= 4) bad = true;
  }
  if (maxRun >= 4) evidence.push(`${maxRun} consecutive selection-only steps`);

  if (!bad) evidence.push(`${steps.length} steps, longest selection run ${maxRun}`);
  return { answer: bad ? "no" : "yes", evidence };
}

/** Plant: pad the lesson with a run of 5 `multiple_choice` (selection-type)
 *  steps. */
export function plant(step, ctx) {
  const filler = {
    id: `${step.id}-plant`,
    type: "multiple_choice",
    prompt: "planted filler",
    options: [{ id: "correct", text: "x" }],
    correctOptionId: "correct",
    exercisedAtoms: [],
    modality: "recognition",
  };
  ctx.lessonSteps = [...ctx.lessonSteps, ...Array.from({ length: 5 }, () => ({ ...filler }))];
  return step;
}
