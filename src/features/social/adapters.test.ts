import { describe, it, expect } from "vitest";
import { toHomeFriendPreview } from "./adapters";
import type { SocialUser } from "./types";

describe("toHomeFriendPreview", () => {
  const baseUser: SocialUser = {
    id: "u-anna",
    name: "Anna",
    username: "anna",
    language: { code: "ja", flag: "🇯🇵", label: "Japanese" },
    streakDays: 23,
    totalXp: 4120,
    lessonsCompleted: 68,
    status: "active",
    lastActiveLabel: "Active now",
  };

  it("projects the five fields the home card consumes", () => {
    expect(toHomeFriendPreview(baseUser)).toEqual({
      id: "u-anna",
      name: "Anna",
      username: "anna",
      streak: 23,
      status: "active",
    });
  });

  it("passes through an idle status", () => {
    const idle = { ...baseUser, status: "idle" as const, streakDays: 0 };
    const preview = toHomeFriendPreview(idle);
    expect(preview.status).toBe("idle");
    expect(preview.streak).toBe(0);
  });

  it("preserves a missing username", () => {
    const noUsername = { ...baseUser, username: undefined };
    expect(toHomeFriendPreview(noUsername).username).toBeUndefined();
  });
});
