import type { Quest } from "./types";

/** Catalog of mock quests covering all four types. The hook composes
 *  progress + status onto this catalog on read so the UI always has a
 *  rich object even if storage hasn't persisted a row yet. */

const MS_PER_HOUR = 3600 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Build a quest catalog whose expiries are anchored to `now`. Pass a fixed
 *  timestamp from tests to keep expectations deterministic. */
export function buildMockQuestCatalog(now: number = Date.now()): Quest[] {
  return [
    {
      id: "daily-fifty-xp",
      type: "daily",
      title: "quests.daily.fiftyXp.title",
      description: "quests.daily.fiftyXp.desc",
      emoji: "⚡",
      progress: { current: 0, target: 50, unit: "XP" },
      rewards: { lingots: 5, xp: 10 },
      expiresAt: now + MS_PER_DAY,
      status: "active",
    },
    {
      id: "daily-flashcards",
      type: "daily",
      title: "quests.daily.flashcards.title",
      description: "quests.daily.flashcards.desc",
      emoji: "🃏",
      progress: { current: 0, target: 15, unit: "cards" },
      rewards: { lingots: 3, xp: 5 },
      expiresAt: now + MS_PER_DAY,
      status: "active",
    },
    {
      id: "weekly-three-lessons",
      type: "weekly",
      title: "quests.weekly.threeLessons.title",
      description: "quests.weekly.threeLessons.desc",
      emoji: "📚",
      progress: { current: 0, target: 5, unit: "lessons" },
      rewards: { lingots: 25, xp: 50, streakShield: true },
      expiresAt: now + 7 * MS_PER_DAY,
      status: "active",
    },
    {
      id: "weekly-master-row",
      type: "weekly",
      title: "quests.weekly.masterRow.title",
      description: "quests.weekly.masterRow.desc",
      emoji: "★",
      progress: { current: 0, target: 1, unit: "modules" },
      rewards: { lingots: 30, xp: 75 },
      expiresAt: now + 7 * MS_PER_DAY,
      status: "active",
    },
    {
      id: "random-try-story",
      type: "random",
      title: "quests.random.tryStory.title",
      description: "quests.random.tryStory.desc",
      emoji: "📖",
      progress: { current: 0, target: 1, unit: "stories" },
      rewards: { lingots: 8, adFreeMinutes: 15 },
      expiresAt: now + 6 * MS_PER_HOUR,
      status: "active",
    },
    {
      id: "friend-overtake-sora",
      type: "friend",
      title: "quests.friend.overtake.title",
      description: "quests.friend.overtake.desc",
      emoji: "🤝",
      progress: { current: 0, target: 100, unit: "XP" },
      rewards: { lingots: 20, xp: 40 },
      expiresAt: now + 7 * MS_PER_DAY,
      friendId: "user-sora",
      friendDisplayName: "Sora",
      status: "active",
    },
  ];
}
