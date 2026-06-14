import { describe, expect, it } from "vitest";
import type { Quest } from "@/features/quests/types";
import { isQuestDone, summarizeDailyPlan } from "./planHelpers";

function makeQuest(over: Partial<Quest> & { id: string }): Quest {
  return {
    id: over.id,
    type: over.type ?? "daily",
    title: over.title ?? `quests.${over.id}.title`,
    description: over.description ?? "",
    emoji: over.emoji ?? "",
    progress: over.progress ?? { current: 0, target: 1, unit: "lessons" },
    rewards: over.rewards ?? { xp: 10 },
    status: over.status ?? "active",
  };
}

describe("isQuestDone", () => {
  it("is true when progress meets target", () => {
    expect(
      isQuestDone(makeQuest({ id: "a", progress: { current: 5, target: 5, unit: "XP" } })),
    ).toBe(true);
  });

  it("is true when claimable or completed regardless of count", () => {
    expect(isQuestDone(makeQuest({ id: "b", status: "claimable" }))).toBe(true);
    expect(isQuestDone(makeQuest({ id: "c", status: "completed" }))).toBe(true);
  });

  it("is false when still in progress", () => {
    expect(
      isQuestDone(makeQuest({ id: "d", progress: { current: 1, target: 3, unit: "cards" } })),
    ).toBe(false);
  });
});

describe("summarizeDailyPlan", () => {
  it("keeps only daily quests, capped at the limit", () => {
    const quests = [
      makeQuest({ id: "d1", type: "daily" }),
      makeQuest({ id: "w1", type: "weekly" }),
      makeQuest({ id: "d2", type: "daily" }),
      makeQuest({ id: "d3", type: "daily" }),
      makeQuest({ id: "d4", type: "daily" }),
    ];
    const { daily } = summarizeDailyPlan(quests, 3);
    expect(daily.map((q) => q.id)).toEqual(["d1", "d2", "d3"]);
  });

  it("counts done quests and flags allDone only when every visible quest is done", () => {
    const partial = summarizeDailyPlan([
      makeQuest({ id: "d1", progress: { current: 1, target: 1, unit: "x" } }),
      makeQuest({ id: "d2", progress: { current: 0, target: 1, unit: "x" } }),
    ]);
    expect(partial.doneCount).toBe(1);
    expect(partial.allDone).toBe(false);

    const all = summarizeDailyPlan([
      makeQuest({ id: "d1", status: "completed" }),
      makeQuest({ id: "d2", progress: { current: 2, target: 1, unit: "x" } }),
    ]);
    expect(all.doneCount).toBe(2);
    expect(all.allDone).toBe(true);
  });

  it("never reports allDone for an empty plan", () => {
    expect(summarizeDailyPlan([]).allDone).toBe(false);
  });
});
