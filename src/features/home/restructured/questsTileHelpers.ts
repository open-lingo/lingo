import type { Quest } from "@/features/quests/types";

export type QuestProgressView = {
  quest: Quest;
  percent: number;
  isClaimable: boolean;
};

/** Whole-percent progress for a quest, clamped 0–100. */
export function questPercent(q: Quest): number {
  const { current, target } = q.progress;
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

/**
 * The longer-arc goals shown in the home Quests tile. Today's Plan already
 * surfaces the *daily* checklist, so this tile complements it with the
 * weekly + bonus (random/friend) goals — the ones with chunkier rewards that
 * deserve a progress bar each. Claimable quests float to the top so the
 * reward CTA is one tap away; we never show already-completed quests here.
 */
export function selectGoalQuests(quests: Quest[], limit = 4): QuestProgressView[] {
  const eligible = quests.filter(
    (q) =>
      q.type !== "daily" &&
      (q.status === "active" || q.status === "claimable"),
  );
  const rank: Record<string, number> = { claimable: 0, active: 1 };
  return eligible
    .slice()
    .sort((a, b) => {
      const byStatus = (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
      if (byStatus !== 0) return byStatus;
      // Within the same status, surface the closest-to-done first.
      return questPercent(b) - questPercent(a);
    })
    .slice(0, limit)
    .map((quest) => ({
      quest,
      percent: questPercent(quest),
      isClaimable: quest.status === "claimable",
    }));
}
