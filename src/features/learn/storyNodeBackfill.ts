import { getActiveUserStorageId } from "@/features/settings/storage";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  getMockCompletedLessonIds,
  markLessonCompleted,
} from "@/shared/domain/mockProgress";

const FLAG_PREFIX = "lingo_story_node_backfill_v1";

/**
 * The one-shot flag is scoped by USER and LANGUAGE, because the thing it
 * reconciles against is scoped the same way.
 *
 * Language: story rows ship in BOTH the JA and KO courses, and the backfill
 * only ever walks one of them. A single global flag would let a JA pass burn
 * the credit a KO learner needs — permanently, since it never runs twice.
 *
 * User: `mockProgress` keys its store by `getActiveUserStorageId()`, so two
 * profiles on one browser have two different sets of completions. A shared
 * flag would hand the first profile's migration to the second.
 */
function flagKey(languageId: string): string {
  return `${FLAG_PREFIX}:${getActiveUserStorageId()}:${languageId}`;
}

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
 * RUNS EXACTLY ONCE per user per language, which is the whole point. If it ran
 * on every load it would also credit the node the instant a learner finished
 * the module's last lesson, and the story would never be asked for. After the
 * flag is set, new learners meet the story the normal way.
 *
 * Zero XP: this is bookkeeping for work already done, not a reward.
 */
export function backfillStoryNodes(languageId: string): number {
  if (typeof window === "undefined") return 0;
  // No language, no course to walk — and burning a flag for a course the
  // learner may not even be studying is exactly the failure this guards.
  if (!languageId) return 0;
  const key = flagKey(languageId);
  try {
    if (localStorage.getItem(key)) return 0;
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
    localStorage.setItem(key, new Date().toISOString());
  } catch {
    /* a failed flag write means it retries next load — harmless, idempotent */
  }
  return credited;
}
