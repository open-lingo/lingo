import { describe, expect, it } from "vitest";
import type { Quest } from "@/features/quests/types";
import { questPercent, selectGoalQuests } from "./questsTileHelpers";

function makeQuest(over: Partial<Quest> & { id: string }): Quest {
  return {
    id: over.id,
    type: over.type ?? "weekly",
    title: over.title ?? `quests.${over.id}.title`,
    description: over.description ?? "",
    emoji: over.emoji ?? "★",
    progress: over.progress ?? { current: 0, target: 5, unit: "lessons" },
    rewards: over.rewards ?? { xp: 50 },
    status: over.status ?? "active",
  };
}

describe("questPercent", () => {
  it("computes a clamped whole percent", () => {
    expect(questPercent(makeQuest({ id: "a", progress: { current: 2, target: 5, unit: "x" } }))).toBe(40);
    expect(questPercent(makeQuest({ id: "b", progress: { current: 9, target: 5, unit: "x" } }))).toBe(100);
    expect(questPercent(makeQuest({ id: "c", progress: { current: 1, target: 0, unit: "x" } }))).toBe(0);
  });
});

describe("selectGoalQuests", () => {
  it("excludes daily quests (those live in Today's Plan)", () => {
    const goals = selectGoalQuests([
      makeQuest({ id: "d1", type: "daily" }),
      makeQuest({ id: "w1", type: "weekly" }),
      makeQuest({ id: "r1", type: "random" }),
    ]);
    expect(goals.map((g) => g.quest.id)).toEqual(["w1", "r1"]);
  });

  it("drops completed/expired and floats claimable to the top", () => {
    const goals = selectGoalQuests([
      makeQuest({ id: "active-low", type: "weekly", progress: { current: 1, target: 10, unit: "x" } }),
      makeQuest({ id: "done", type: "weekly", status: "completed" }),
      makeQuest({ id: "claim", type: "weekly", status: "claimable" }),
      makeQuest({ id: "gone", type: "random", status: "expired" }),
    ]);
    expect(goals.map((g) => g.quest.id)).toEqual(["claim", "active-low"]);
    expect(goals[0].isClaimable).toBe(true);
  });

  it("sorts active quests closest-to-done first and respects the limit", () => {
    const goals = selectGoalQuests(
      [
        makeQuest({ id: "w-20", type: "weekly", progress: { current: 1, target: 5, unit: "x" } }),
        makeQuest({ id: "w-80", type: "weekly", progress: { current: 4, target: 5, unit: "x" } }),
        makeQuest({ id: "w-50", type: "weekly", progress: { current: 1, target: 2, unit: "x" } }),
      ],
      2,
    );
    expect(goals.map((g) => g.quest.id)).toEqual(["w-80", "w-50"]);
  });
});
