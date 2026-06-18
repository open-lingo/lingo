import { describe, it, expect } from "vitest";
import { iconRegistry } from "@/shared/iconRegistry";
import { questIcon } from "./questIcon";
import { buildMockQuestCatalog } from "./mockQuests";

describe("questIcon", () => {
  it("maps every seed quest to a registered lucide icon (no emoji)", () => {
    for (const q of buildMockQuestCatalog(0)) {
      const name = questIcon(q);
      expect(iconRegistry[name]).toBeTruthy();
    }
  });

  it("resolves known ids to their semantic glyph", () => {
    expect(questIcon({ id: "daily-fifty-xp", type: "daily", emoji: "⚡" })).toBe(
      "zap",
    );
    expect(
      questIcon({ id: "weekly-master-row", type: "weekly", emoji: "★" }),
    ).toBe("trophy");
  });

  it("falls back to the quest type for unknown ids/emoji", () => {
    expect(questIcon({ id: "unknown-x", type: "friend", emoji: "" })).toBe(
      "users",
    );
    expect(questIcon({ id: "unknown-y", type: "random", emoji: "" })).toBe(
      "sparkles",
    );
  });
});
