import type { Lesson } from "./course";

/**
 * Where a path node goes when you tap it.
 *
 * Most rows are lessons and open the lesson player. Two kinds route OUT to a
 * different surface: `alphabet` to the kana/hangul learner, and `trainer` to
 * the conjugation trainer. The rule lived inline in three places — LearnPage,
 * ResumeFab and DistrictView — which is why `alphabet` was the only kind that
 * ever got one: a fourth copy is easy to forget. One function now, three
 * callers, and a new kind is a single edit.
 *
 * Returns a LANGUAGE-RELATIVE path; every caller wraps it in its own
 * `langPath` / `p` helper.
 *
 * `node` on the trainer link is what closes the loop back to the path. The
 * trainer is a standalone practice surface that knows nothing about lessons,
 * so the session carries its origin node id and marks THAT complete on
 * finish — without it the drill would be unskippable, since a node the
 * learner can never complete blocks the module (`getModuleStatus` counts
 * every non-review row).
 */
export function lessonRoutePath(lesson: Lesson): string {
  if (lesson.kind === "alphabet" && lesson.alphabetId) {
    return `practice/alphabet/${lesson.alphabetId}/learn`;
  }
  if (lesson.kind === "trainer" && lesson.trainerTypeIds?.length) {
    const types = lesson.trainerTypeIds;
    const node = encodeURIComponent(lesson.id);
    // One tile → the per-type session. Two or more → the combined session,
    // which is the only surface that drills the stacked forms.
    return types.length === 1
      ? `practice/grammar/conjugation/${types[0]}?node=${node}`
      : `practice/grammar/conjugation/train?types=${types.join(",")}&combos=1&node=${node}`;
  }
  return `learn/lessons/${lesson.id}`;
}
