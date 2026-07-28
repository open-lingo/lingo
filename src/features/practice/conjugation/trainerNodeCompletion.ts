import { markLessonCompleted } from "@/shared/domain/mockProgress";

/** XP for finishing a trainer node. Flat, and below a full sub-lesson's
 *  award — the drill is one paradigm, not a lesson's worth of material. */
const TRAINER_NODE_XP = 10;

/**
 * Mark a trainer path-node complete after its drill finishes.
 *
 * The conjugation trainer is a standalone practice surface — reachable from
 * the practice hub with no lesson anywhere in sight — so it has no idea it
 * can also be a required node on the learn path. The node id rides in on the
 * `?node=` search param (see `lessonRoutePath`) and only sessions launched
 * from the path carry one; a hub-launched drill passes null and this no-ops.
 *
 * WHY IT MUST BE CALLED. `getModuleStatus` gates the next module on every
 * non-review row in this one being completed. A trainer node that never
 * records completion would wall the learner in permanently.
 *
 * Accuracy mirrors the summary's score: results are per-question credit in
 * [0,1] (a half is a cheat-sheet peek), so the mean is the session score.
 */
export function completeTrainerNode(
  nodeId: string | null,
  results: number[],
): void {
  if (!nodeId || results.length === 0) return;
  const accuracy = results.reduce((acc, r) => acc + r, 0) / results.length;
  markLessonCompleted(nodeId, {
    accuracy,
    xpEarned: TRAINER_NODE_XP,
    // Not a review: this node gates module progression like a content
    // lesson, and `isReview` drives the XP multiplier + streak bookkeeping
    // for the SRS review flow, which this is not part of.
    isReview: false,
  });
}
