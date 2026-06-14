import type { Quest } from "@/features/quests/types";

/** A daily quest counts as "done" once it's claimable/completed or progress
 *  meets target — used by Today's Plan to render the checklist + count. */
export function isQuestDone(q: Quest): boolean {
  return (
    q.status === "claimable" ||
    q.status === "completed" ||
    q.progress.current >= q.progress.target
  );
}

/** The daily-quest slice shown in Today's Plan + its completion count. */
export function summarizeDailyPlan(
  quests: Quest[],
  limit = 3,
): { daily: Quest[]; doneCount: number; allDone: boolean } {
  const daily = quests.filter((q) => q.type === "daily").slice(0, limit);
  const doneCount = daily.filter(isQuestDone).length;
  return { daily, doneCount, allDone: daily.length > 0 && doneCount === daily.length };
}
