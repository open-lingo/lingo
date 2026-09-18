import { describe, expect, it } from "vitest";
import { questRewardText, questTimeRemainingLabel } from "./homeVariantContent";
import type { Quest } from "@/features/quests/types";

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: "q1",
    type: "daily",
    title: "Finish 2 lessons",
    description: "Finish 2 lessons today",
    emoji: "⚡",
    progress: { current: 1, target: 2, unit: "lessons" },
    rewards: { lingots: 5, xp: 10 },
    status: "active",
    ...overrides,
  };
}

describe("questRewardText", () => {
  it("joins XP and gem rewards with a middle dot", () => {
    expect(questRewardText(makeQuest())).toBe("+10 XP · 5 gems");
  });

  it("omits absent reward fields", () => {
    expect(questRewardText(makeQuest({ rewards: { xp: 15 } }))).toBe("+15 XP");
  });
});

describe("questTimeRemainingLabel", () => {
  it("returns null when there is no expiry", () => {
    expect(questTimeRemainingLabel(undefined)).toBeNull();
  });

  it("returns null once the deadline has passed", () => {
    expect(questTimeRemainingLabel(Date.now() - 1000)).toBeNull();
  });

  it("formats sub-day remainders in hours", () => {
    const label = questTimeRemainingLabel(Date.now() + 3 * 60 * 60 * 1000);
    expect(label).toBe("3h left");
  });

  it("formats multi-day remainders in days", () => {
    const label = questTimeRemainingLabel(Date.now() + 50 * 60 * 60 * 1000);
    expect(label).toBe("2d left");
  });

  it("floors to at least 1 minute for imminent expiries", () => {
    const label = questTimeRemainingLabel(Date.now() + 10 * 1000);
    expect(label).toBe("1m left");
  });
});
