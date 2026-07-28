import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  getMockCompletedLessonIds,
  markLessonCompleted,
} from "@/shared/domain/mockProgress";

const FLAG_KEY = "lingo_trainer_node_backfill_v1";

/**
 * Retro-credit trainer nodes to learners who had already finished the module.
 *
 * Trainer nodes were inserted into modules 8, 11, 12, 13 and 16 AFTER people
 * were already learning. `getCurrentModuleIndex` returns the first module that
 * is not fully complete, so without this a learner sitting in m14 would be
 * yanked back to m8 the moment they loaded the app — and `useCourseLevel`
 * feeds off that index, so their drill pools, kanji exposure and learn map
 * would all roll back with it. Being asked to do one new drill is fine;
 * silently losing six modules of position is not.
 *
 * A node is credited only when every OTHER row in its module is already done —
 * i.e. the learner had genuinely cleared that module under the old shape.
 *
 * RUNS EXACTLY ONCE per browser profile, which is the whole point. If it ran
 * on every load it would also credit the node the instant a learner finished
 * the module's last lesson, and the gate would never fire for anybody. After
 * the flag is set, new learners meet the drill the normal way.
 *
 * Zero XP: this is bookkeeping for work already done, not a reward.
 */
export function backfillTrainerNodes(languageId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    if (localStorage.getItem(FLAG_KEY)) return 0;
  } catch {
    return 0;
  }

  const done = new Set(getMockCompletedLessonIds());
  let credited = 0;
  for (const mod of getMockCourse(languageId).modules) {
    const rows = mod.lessons ?? [];
    const nodes = rows.filter((l) => l.kind === "trainer");
    if (nodes.length === 0) continue;
    const othersDone = rows
      .filter((l) => l.kind !== "trainer")
      .every((l) => done.has(l.id));
    if (!othersDone) continue;
    for (const node of nodes) {
      if (done.has(node.id)) continue;
      markLessonCompleted(node.id, { accuracy: 1, xpEarned: 0, isReview: false });
      credited++;
    }
  }

  try {
    localStorage.setItem(FLAG_KEY, new Date().toISOString());
  } catch {
    /* a failed flag write means it retries next load — harmless, idempotent */
  }
  return credited;
}
