/**
 * Frontend-only mock data for the Social page preview.
 * MOCK: every export is fake — replace with API queries when backend lands.
 *
 * Cosmetic samples deliberately demonstrate the slot system (no-frame,
 * solid-ring, gradient-ring) so Spencer can see what shipped cosmetics
 * will feel like. Cosmetic rarity tiers / pricing are out of scope.
 */
import type { AvatarFrame } from "../components/UserAvatar";
import type { UsernameCosmetic } from "../components/UsernameDisplay";

export type SocialUser = {
  id: string;
  name: string;
  /** Optional profile image. When absent, falls back to initial letter. */
  imageUrl?: string;
  /** Currently-studied language (display only). */
  language: { code: string; flag: string; label: string };
  streakDays: number;
  totalXp: number;
  lessonsCompleted: number;
  status: "active" | "idle";
  lastActiveLabel: string;
  /** Cosmetic slots — keep absent for the no-cosmetic baseline. */
  frame?: AvatarFrame;
  cosmetic?: UsernameCosmetic;
};

const langJa = { code: "ja", flag: "🇯🇵", label: "Japanese" };
const langKo = { code: "ko", flag: "🇰🇷", label: "Korean" };
const langEs = { code: "es", flag: "🇪🇸", label: "Spanish" };

export const MOCK_ME: SocialUser = {
  id: "me",
  name: "Spencer",
  language: langJa,
  streakDays: 8,
  totalXp: 2480,
  lessonsCompleted: 42,
  status: "active",
  lastActiveLabel: "Now",
  // Demo cosmetic: gradient ring + gradient username — the "premium" tier feel.
  frame: {
    kind: "gradient",
    gradient: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-warning) 100%)",
  },
  cosmetic: {
    gradient: "linear-gradient(90deg, var(--color-accent), var(--color-warning))",
    weight: "bold",
    badge: { iconName: "sparkles", tone: "warning" },
  },
};

export const MOCK_FRIENDS: SocialUser[] = [
  {
    id: "u-anna",
    name: "Anna",
    language: langJa,
    streakDays: 23,
    totalXp: 4120,
    lessonsCompleted: 68,
    status: "active",
    lastActiveLabel: "Active now",
    // No frame, no cosmetic — baseline default.
  },
  {
    id: "u-kenji",
    name: "Kenji",
    language: langJa,
    streakDays: 47,
    totalXp: 6890,
    lessonsCompleted: 104,
    status: "active",
    lastActiveLabel: "Active 2m ago",
    // Solid bronze ring — entry-tier cosmetic.
    frame: { kind: "solid", color: "#b87333" },
    cosmetic: { color: "#b87333", weight: "bold" },
  },
  {
    id: "u-mei",
    name: "Mei",
    language: langKo,
    streakDays: 12,
    totalXp: 1850,
    lessonsCompleted: 31,
    status: "idle",
    lastActiveLabel: "1h ago",
    // Solid gold ring + verified badge — mid-tier cosmetic.
    frame: { kind: "solid", color: "#d4a017" },
    cosmetic: {
      color: "#d4a017",
      weight: "bold",
      badge: { iconName: "check", tone: "accent" },
    },
  },
  {
    id: "u-sam",
    name: "Sam",
    language: langEs,
    streakDays: 30,
    totalXp: 3210,
    lessonsCompleted: 55,
    status: "idle",
    lastActiveLabel: "3h ago",
  },
  {
    id: "u-jordan",
    name: "Jordan",
    language: langJa,
    streakDays: 5,
    totalXp: 980,
    lessonsCompleted: 18,
    status: "idle",
    lastActiveLabel: "Yesterday",
  },
  {
    id: "u-priya",
    name: "Priya",
    language: langJa,
    streakDays: 64,
    totalXp: 7740,
    lessonsCompleted: 121,
    status: "active",
    lastActiveLabel: "Active 12m ago",
    // Animated gradient ring — top-tier cosmetic.
    frame: {
      kind: "animated",
      gradient: "conic-gradient(from 0deg, var(--color-accent), var(--color-warning), var(--color-success), var(--color-accent))",
    },
    cosmetic: {
      gradient: "linear-gradient(90deg, var(--color-accent), var(--color-warning))",
      weight: "bold",
      badge: { iconName: "crown", tone: "warning" },
    },
  },
  {
    id: "u-noor",
    name: "Noor",
    language: langJa,
    streakDays: 28,
    totalXp: 3940,
    lessonsCompleted: 62,
    status: "idle",
    lastActiveLabel: "4h ago",
  },
  {
    id: "u-elena",
    name: "Elena",
    language: langEs,
    streakDays: 11,
    totalXp: 1430,
    lessonsCompleted: 24,
    status: "idle",
    lastActiveLabel: "1d ago",
  },
  {
    id: "u-rio",
    name: "Rio",
    language: langJa,
    streakDays: 4,
    totalXp: 580,
    lessonsCompleted: 11,
    status: "idle",
    lastActiveLabel: "2d ago",
  },
  {
    id: "u-hana",
    name: "Hana",
    language: langJa,
    streakDays: 17,
    totalXp: 2310,
    lessonsCompleted: 38,
    status: "active",
    lastActiveLabel: "Active now",
    frame: { kind: "solid", color: "#b87333" },
    cosmetic: { color: "#b87333", weight: "bold" },
  },
  {
    id: "u-marcus",
    name: "Marcus",
    language: langKo,
    streakDays: 9,
    totalXp: 1180,
    lessonsCompleted: 21,
    status: "idle",
    lastActiveLabel: "8h ago",
  },
  {
    id: "u-yuna",
    name: "Yuna",
    language: langJa,
    streakDays: 38,
    totalXp: 4920,
    lessonsCompleted: 79,
    status: "active",
    lastActiveLabel: "Active 4m ago",
    frame: { kind: "solid", color: "#d4a017" },
    cosmetic: {
      color: "#d4a017",
      weight: "bold",
      badge: { iconName: "check", tone: "accent" },
    },
  },
  {
    id: "u-diego",
    name: "Diego",
    language: langEs,
    streakDays: 6,
    totalXp: 720,
    lessonsCompleted: 14,
    status: "idle",
    lastActiveLabel: "Yesterday",
  },
];

export const MOCK_FRIEND_REQUESTS: SocialUser[] = [
  {
    id: "u-yuki",
    name: "Yuki",
    language: langJa,
    streakDays: 3,
    totalXp: 420,
    lessonsCompleted: 9,
    status: "idle",
    lastActiveLabel: "20m ago",
  },
  {
    id: "u-luca",
    name: "Luca",
    language: langEs,
    streakDays: 14,
    totalXp: 1640,
    lessonsCompleted: 27,
    status: "active",
    lastActiveLabel: "Active now",
  },
];

export const MOCK_FRIEND_SUGGESTIONS: { user: SocialUser; reason: string }[] = [
  {
    user: {
      id: "u-tomo",
      name: "Tomo",
      language: langJa,
      streakDays: 8,
      totalXp: 1120,
      lessonsCompleted: 22,
      status: "active",
      lastActiveLabel: "Active now",
    },
    reason: "Studying Japanese · 2 mutual friends",
  },
  {
    user: {
      id: "u-aiden",
      name: "Aiden",
      language: langJa,
      streakDays: 19,
      totalXp: 2980,
      lessonsCompleted: 51,
      status: "idle",
      lastActiveLabel: "5h ago",
    },
    reason: "Same module · M2 dakuten",
  },
];

export type FriendQuest = {
  labelKey: string;
  labelDefault: string;
  you: number;
  friend: number;
  friendName: string;
  partnerId: string;
};

/** MOCK: replace with `social.getFriendQuest()` when API lands. */
export const MOCK_FRIEND_QUEST: FriendQuest = {
  labelKey: "home.restructured.social.friendQuestLabel",
  labelDefault: "Both finish a lesson today",
  you: 1,
  friend: 0,
  friendName: MOCK_FRIENDS[0]?.name ?? "Anna",
  partnerId: MOCK_FRIENDS[0]?.id ?? "u-anna",
};

/** Compact friend row for the home Social card. */
export type HomeFriendPreview = {
  id: string;
  name: string;
  streak: number;
  status: "active" | "idle";
};

export function toHomeFriendPreview(user: SocialUser): HomeFriendPreview {
  return {
    id: user.id,
    name: user.name,
    streak: user.streakDays,
    status: user.status,
  };
}

/** Top N friends for home — active first, then by streak. */
export function getHomeFriendsPreview(limit = 3): HomeFriendPreview[] {
  return [...MOCK_FRIENDS]
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "active" ? -1 : 1;
      return b.streakDays - a.streakDays;
    })
    .slice(0, limit)
    .map(toHomeFriendPreview);
}

// ────────────────────────────────────────────────────────────────────────────
// Activity feed
// ────────────────────────────────────────────────────────────────────────────

export type ActivityItem = {
  id: string;
  user: SocialUser;
  kind: "streak" | "module" | "league" | "joined" | "milestone";
  /** Human text rendered as-is. Real version pulls from i18n. */
  text: string;
  timeLabel: string;
  /** Pre-existing kudos count from other friends. */
  kudosCount: number;
};

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "a-1",
    user: MOCK_FRIENDS[0],
    kind: "module",
    text: "Finished Module 2 — Dakuten & Yōon",
    timeLabel: "12m ago",
    kudosCount: 4,
  },
  {
    id: "a-2",
    user: MOCK_FRIENDS[5],
    kind: "streak",
    text: "Hit a 64-day streak 🔥",
    timeLabel: "1h ago",
    kudosCount: 11,
  },
  {
    id: "a-3",
    user: MOCK_FRIENDS[1],
    kind: "league",
    text: "Promoted to Sapphire League",
    timeLabel: "Yesterday",
    kudosCount: 7,
  },
  {
    id: "a-4",
    user: MOCK_FRIENDS[3],
    kind: "milestone",
    text: "Reached 3,000 XP",
    timeLabel: "2d ago",
    kudosCount: 2,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Messages
// ────────────────────────────────────────────────────────────────────────────

export type ChatMessage = {
  id: string;
  /** Sender id — `"me"` for the current user. */
  fromId: string;
  text: string;
  /** ISO-ish absolute label for the message timestamp. Real impl uses Date. */
  timeLabel: string;
  /** Optional reactions from other users (emoji + count). */
  reactions?: { emoji: string; count: number; mine?: boolean }[];
};

export type ChatThread = {
  id: string;
  user: SocialUser;
  lastMessage: string;
  lastTimeLabel: string;
  unreadCount: number;
  messages: ChatMessage[];
};

export const MOCK_THREADS: ChatThread[] = [
  {
    id: "t-anna",
    user: MOCK_FRIENDS[0],
    lastMessage: "ありがとう! that build_sentence trick saved me",
    lastTimeLabel: "12m",
    unreadCount: 2,
    messages: [
      { id: "m1", fromId: "u-anna", text: "stuck on the ga-row 😅", timeLabel: "Today · 10:14" },
      { id: "m2", fromId: "me", text: "are you doing it on mobile? trace step gets way easier in landscape", timeLabel: "Today · 10:16" },
      {
        id: "m3",
        fromId: "u-anna",
        text: "oh damn that helps. also the build_sentence one — do you do the audio first or the tiles first?",
        timeLabel: "Today · 10:17",
      },
      {
        id: "m4",
        fromId: "me",
        text: "audio first always. read the tiles only after I've tried saying it",
        timeLabel: "Today · 10:18",
        reactions: [{ emoji: "🔥", count: 1, mine: false }],
      },
      {
        id: "m5",
        fromId: "u-anna",
        text: "ありがとう! that build_sentence trick saved me",
        timeLabel: "Today · 10:24",
      },
    ],
  },
  {
    id: "t-kenji",
    user: MOCK_FRIENDS[1],
    lastMessage: "studying tonight? leaderboard reset is in 2 days",
    lastTimeLabel: "1h",
    unreadCount: 0,
    messages: [],
  },
  {
    id: "t-mei",
    user: MOCK_FRIENDS[2],
    lastMessage: "👋",
    lastTimeLabel: "3h",
    unreadCount: 1,
    messages: [],
  },
  {
    id: "t-priya",
    user: MOCK_FRIENDS[5],
    lastMessage: "the は vs が thread on community is fire — check it out",
    lastTimeLabel: "Yesterday",
    unreadCount: 0,
    messages: [],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Leaderboards
// ────────────────────────────────────────────────────────────────────────────

export type LeaderboardRow = {
  rank: number;
  user: SocialUser;
  /** Primary metric in display (xp this period). */
  xp: number;
  /** Secondary metric (lessons completed this period). */
  lessons: number;
  /** Movement vs. last reset. */
  delta: "up" | "down" | "same";
  /** Whether this is the current user. */
  isMe?: boolean;
};

const lbUsers: SocialUser[] = [
  MOCK_FRIENDS[5], // Priya
  MOCK_FRIENDS[1], // Kenji
  {
    id: "u-noor",
    name: "Noor",
    language: langJa,
    streakDays: 28,
    totalXp: 3940,
    lessonsCompleted: 62,
    status: "idle",
    lastActiveLabel: "4h ago",
  },
  MOCK_FRIENDS[0], // Anna
  MOCK_ME,
  MOCK_FRIENDS[3], // Sam
  MOCK_FRIENDS[2], // Mei
  {
    id: "u-elena",
    name: "Elena",
    language: langEs,
    streakDays: 11,
    totalXp: 1430,
    lessonsCompleted: 24,
    status: "idle",
    lastActiveLabel: "1d ago",
  },
  MOCK_FRIENDS[4], // Jordan
  {
    id: "u-rio",
    name: "Rio",
    language: langJa,
    streakDays: 4,
    totalXp: 580,
    lessonsCompleted: 11,
    status: "idle",
    lastActiveLabel: "2d ago",
  },
];

const weeklyXp = [1840, 1620, 1290, 1080, 940, 820, 690, 540, 410, 280];
const weeklyLessons = [28, 24, 19, 17, 15, 13, 11, 9, 7, 5];
const deltas: ("up" | "down" | "same")[] = ["same", "up", "up", "down", "up", "same", "down", "up", "down", "same"];

export const MOCK_WEEKLY_LB: LeaderboardRow[] = lbUsers.map((u, i) => ({
  rank: i + 1,
  user: u,
  xp: weeklyXp[i],
  lessons: weeklyLessons[i],
  delta: deltas[i],
  isMe: u.id === "me",
}));

export const MOCK_LEAGUE = {
  name: "Sapphire League",
  tierIndex: 4,
  tierTotal: 10,
  emoji: "💎",
  /** Top N promote up a tier. */
  promotionZone: 3,
  /** Bottom N demote down a tier. */
  demotionZone: 2,
  /** Time until reset (display only). */
  resetLabel: "Resets in 2d 14h",
};

const monthlyXp = [7820, 6940, 5630, 4870, 4120, 3450, 2980, 2510, 2080, 1640];
const monthlyLessons = [142, 124, 98, 86, 71, 62, 54, 47, 39, 31];
export const MOCK_MONTHLY_LB: LeaderboardRow[] = lbUsers.map((u, i) => ({
  rank: i + 1,
  user: u,
  xp: monthlyXp[i],
  lessons: monthlyLessons[i],
  delta: deltas[i],
  isMe: u.id === "me",
}));

// Friends-only — just the user's friends + the user, ranked by weekly XP.
const friendsPool: SocialUser[] = [MOCK_ME, ...MOCK_FRIENDS];
const friendsWeeklyXp = [940, 1290, 1080, 820, 540, 410, 1620];
const friendsWeeklyLessons = [15, 19, 17, 13, 9, 7, 24];
export const MOCK_FRIENDS_LB: LeaderboardRow[] = friendsPool
  .map((u, i) => ({
    rank: 0,
    user: u,
    xp: friendsWeeklyXp[i] ?? 200,
    lessons: friendsWeeklyLessons[i] ?? 4,
    delta: deltas[i] ?? "same",
    isMe: u.id === "me",
  }))
  .sort((a, b) => b.xp - a.xp)
  .map((row, idx) => ({ ...row, rank: idx + 1 }));
