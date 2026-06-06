/**
 * Centralized mock data for the restructured home page.
 *
 * Every consumer of these exports should grep-able as a // MOCK: replacement
 * site. Replace fields here one-by-one as real data sources land.
 */
import type { IconName } from "@/shared/iconRegistry";

// MOCK: replace with SRS "next N due card fronts" query.
export const MOCK_CARDS_HOT_PREVIEW = ["か", "き", "く", "け", "こ"];

// MOCK: replace with useLastPractice() localStorage hook (future).
export const MOCK_RECENT_PRACTICE: {
  title: string;
  subtitleHoursAgo: number;
  iconName: IconName;
  href: string;
} = {
  title: "Alphabet — Hiragana",
  subtitleHoursAgo: 2,
  iconName: "bookText",
  href: "practice/alphabet",
};

// MOCK: replace with quest engine (definitions + per-day progress).
export type MockQuest = {
  id: string;
  labelKey: string;
  labelDefault: string;
  done: number;
  goal: number;
  xp: number;
  iconName: IconName;
};

export const MOCK_DAILY_QUESTS: MockQuest[] = [
  {
    id: "d1",
    labelKey: "home.restructured.quests.daily.lesson",
    labelDefault: "Complete a lesson",
    done: 1,
    goal: 1,
    xp: 15,
    iconName: "graduationCap",
  },
  {
    id: "d2",
    labelKey: "home.restructured.quests.daily.review20",
    labelDefault: "Review 20 flashcards",
    done: 11,
    goal: 20,
    xp: 10,
    iconName: "decks",
  },
  {
    id: "d3",
    labelKey: "home.restructured.quests.daily.fiveMin",
    labelDefault: "5 minutes of practice",
    done: 8,
    goal: 5,
    xp: 5,
    iconName: "dumbbell",
  },
];

export const MOCK_WEEKLY_QUEST = {
  labelKey: "home.restructured.quests.weekly.finishFive",
  labelDefault: "Finish 5 lessons",
  done: 3,
  goal: 5,
  xp: 75,
};
