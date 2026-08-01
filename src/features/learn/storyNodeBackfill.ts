import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  getMockCompletedLessonIds,
  markLessonCompleted,
} from "@/shared/domain/mockProgress";

const FLAG_KEY = "lingo_story_node_backfill_v1";

/** Pathway node id for a story. Own namespace, so it can never collide with a
 *  lesson id — the reader's `?node=` handshake round-trips this exact string. */
export function storyNodeId(storyId: string): string {
  return `story:${storyId}`;
}

/**
 * Retro-credit story nodes to learners who had already finished the module.
 *
 * Story nodes are inserted into modules people are ALREADY past.
 * `getCurrentModuleIndex` returns the first module that is not fully complete,
 * and `useCourseLevel` feeds off that index — so without this a learner sitting
 * in m14 would be yanked back to m3 the moment they loaded the app, taking
 * their drill pools, kanji exposure, transit map and learn map with them. Being
 * asked to read one new story is fine; silently losing eleven modules of
 * position is not.
 *
 * A node is credited only when every OTHER row in its module is already done —
 * i.e. the learner had genuinely cleared that module under the old shape.
 *
 * RUNS EXACTLY ONCE per browser profile, which is the whole point. If it ran on
 * every load it would also credit the node the instant a learner finished the
 * module's last lesson, and the story would never be asked for. After the flag
 * is set, new learners meet the story the normal way.
 *
 * Zero XP: this is bookkeeping for work already done, not a reward.
 */
export function backfillStoryNodes(languageId: string): number {
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
    const nodes = rows.filter((l) => l.kind === "story");
    if (nodes.length === 0) continue;
    const others = rows.filter((l) => l.kind !== "story");
    // A module that is nothing but story rows was never "cleared" by anybody —
    // don't hand out credit for a module the learner has not touched.
    if (others.length === 0) continue;
    if (!others.every((l) => done.has(l.id))) continue;
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
