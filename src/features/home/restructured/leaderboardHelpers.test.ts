import { describe, expect, it } from "vitest";
import type { LeaderboardRow } from "@/features/social/types";
import { buildLeaderboardView } from "./leaderboardHelpers";

function row(over: Partial<LeaderboardRow> & { rank: number; xp: number }): LeaderboardRow {
  return {
    rank: over.rank,
    xp: over.xp,
    lessons: over.lessons ?? 0,
    delta: over.delta ?? "same",
    isMe: over.isMe,
    user: over.user ?? {
      id: `u${over.rank}`,
      name: `User ${over.rank}`,
      status: "idle",
      language: { code: "ja", flag: "🇯🇵", label: "Japanese" },
      streakDays: 0,
      totalXp: over.xp,
      lessonsCompleted: 0,
      lastActiveLabel: "",
    },
  };
}

describe("buildLeaderboardView", () => {
  it("returns empties for no rows", () => {
    const v = buildLeaderboardView([]);
    expect(v.visible).toEqual([]);
    expect(v.myRow).toBeNull();
    expect(v.xpToOvertake).toBeNull();
  });

  it("computes XP to overtake the friend directly above", () => {
    const rows = [
      row({ rank: 1, xp: 500 }),
      row({ rank: 2, xp: 300 }),
      row({ rank: 3, xp: 200, isMe: true }),
    ];
    const v = buildLeaderboardView(rows);
    expect(v.myRow?.rank).toBe(3);
    expect(v.aboveMe?.rank).toBe(2);
    expect(v.xpToOvertake).toBe(101); // 300 - 200 + 1
  });

  it("has no overtake target when the viewer leads", () => {
    const v = buildLeaderboardView([
      row({ rank: 1, xp: 500, isMe: true }),
      row({ rank: 2, xp: 300 }),
    ]);
    expect(v.xpToOvertake).toBeNull();
    expect(v.aboveMe).toBeNull();
  });

  it("keeps the viewer in view even when ranked below the cutoff", () => {
    const rows = [
      row({ rank: 1, xp: 900 }),
      row({ rank: 2, xp: 800 }),
      row({ rank: 3, xp: 700 }),
      row({ rank: 4, xp: 600 }),
      row({ rank: 5, xp: 500 }),
      row({ rank: 6, xp: 100, isMe: true }),
    ];
    const v = buildLeaderboardView(rows, 4);
    expect(v.visible).toHaveLength(4);
    expect(v.visible[v.visible.length - 1].isMe).toBe(true);
    expect(v.visible[0].rank).toBe(1);
  });

  it("does not duplicate the viewer when already within the cutoff", () => {
    const rows = [
      row({ rank: 1, xp: 900 }),
      row({ rank: 2, xp: 800, isMe: true }),
      row({ rank: 3, xp: 700 }),
    ];
    const v = buildLeaderboardView(rows, 4);
    expect(v.visible.filter((r) => r.isMe)).toHaveLength(1);
    expect(v.visible).toHaveLength(3);
  });
});
