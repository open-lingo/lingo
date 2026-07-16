import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/shared/contexts/ToastContext";
import type { ReactNode } from "react";
import { vi } from "vitest";
import type {
  ActivityFeedItem,
  ActivityFeedResponse,
  Friend as ApiFriend,
  FriendRequestsBundle,
  FriendSuggestionsResponse,
  InviteOffer as ApiInviteOffer,
  LeaderboardBundle as ApiLeaderboardBundle,
  LeaderboardEntry,
  LeagueSpotlight as ApiLeagueSpotlight,
  StreakSnapshot as ApiStreakSnapshot,
} from "@/shared/api/social";

export function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function MockSocialProviders({
  children,
  client,
}: {
  children: ReactNode;
  client?: QueryClient;
}) {
  const qc = client ?? makeTestQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

const nowIso = () => new Date().toISOString();
const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();

function makeFriend(
  user_id: string,
  username: string,
  display_name: string,
  streak: number,
  xp: number,
  lastActiveMinutesAgo: number,
): ApiFriend {
  return {
    user_id,
    username,
    display_name,
    profile_picture_key: null,
    streak,
    xp,
    lastActiveAt: minutesAgo(lastActiveMinutesAgo),
    friendedAt: minutesAgo(60 * 24 * 7),
  };
}

export const FIXTURE_FRIENDS: ApiFriend[] = [
  makeFriend("u-anna", "anna", "Anna", 23, 4120, 2),
  makeFriend("u-kenji", "kenji", "Kenji", 47, 6890, 4),
  makeFriend("u-mei", "mei", "Mei", 12, 1850, 60),
  makeFriend("u-sam", "sam", "Sam", 30, 3210, 60 * 3),
  makeFriend("u-jordan", "jordan", "Jordan", 5, 980, 60 * 26),
  makeFriend("u-priya", "priya", "Priya", 64, 7740, 12),
  makeFriend("u-noor", "noor", "Noor", 28, 3940, 60 * 4),
];

export const FIXTURE_FRIEND_REQUESTS: FriendRequestsBundle = {
  incoming: [
    {
      user_id: "u-yuki",
      username: "yuki",
      display_name: "Yuki",
      requestedAt: minutesAgo(20),
    },
  ],
  outgoing: [],
};

export const FIXTURE_SUGGESTIONS: FriendSuggestionsResponse = {
  items: [
    {
      user_id: "u-tomo",
      username: "tomo",
      display_name: "Tomo",
      profile_picture_key: null,
      learning_language: "ja",
      streak: 8,
      xp: 1120,
      reason: "Studying Japanese · 2 mutual friends",
    },
  ],
};

const lessonActivity = (
  id: string,
  friend: ApiFriend,
  lessonId: string,
  minutesOld: number,
): ActivityFeedItem => ({
  id,
  user_id: friend.user_id,
  username: friend.username,
  display_name: friend.display_name,
  profile_picture_key: null,
  kind: "lesson_completed",
  payload: { lessonId },
  created_at: minutesAgo(minutesOld),
  reactions: [{ kind: "wave", count: 2, mine: false }],
});

const streakActivity = (
  id: string,
  friend: ApiFriend,
  minutesOld: number,
): ActivityFeedItem => ({
  id,
  user_id: friend.user_id,
  username: friend.username,
  display_name: friend.display_name,
  profile_picture_key: null,
  kind: "streak_milestone",
  payload: { streakDays: 64 },
  created_at: minutesAgo(minutesOld),
  reactions: [{ kind: "fire", count: 9, mine: false }],
});

export const FIXTURE_ACTIVITY: ActivityFeedResponse = {
  items: [
    lessonActivity("a-1", FIXTURE_FRIENDS[0], "Module 2 — Dakuten & Yōon", 12),
    streakActivity("a-2", FIXTURE_FRIENDS[5], 60),
  ],
  cursor: null,
};

export const FIXTURE_INVITE_OFFER: ApiInviteOffer = {
  code: "xxxx-yyyy-zzzz",
  url: "https://lingo.app/invite/xxxx-yyyy-zzzz",
  lingot_reward_inviter: 100,
  lingot_reward_invitee: 100,
  ad_free_minutes_inviter: 60,
  ad_free_minutes_invitee: 60,
  monthly_cap: 10,
  redeemed_count_this_month: 2,
  first_lesson_required: false,
};

export const FIXTURE_STREAK_SNAPSHOT: ApiStreakSnapshot = {
  my_streak_days: 8,
  friend_median_streak_days: 17,
  best_friend_streak_days: 64,
  best_friend_username: FIXTURE_FRIENDS[5].username,
};

function lbEntry(
  friend: ApiFriend,
  rank: number,
  xp: number,
): LeaderboardEntry {
  return {
    user_id: friend.user_id,
    username: friend.username,
    display_name: friend.display_name,
    profile_picture_key: null,
    xp_this_period: xp,
    rank,
  };
}

const FIXTURE_WEEKLY_ENTRIES: LeaderboardEntry[] = [
  lbEntry(FIXTURE_FRIENDS[5], 1, 1840),
  lbEntry(FIXTURE_FRIENDS[1], 2, 1620),
  lbEntry(FIXTURE_FRIENDS[6], 3, 1290),
  lbEntry(FIXTURE_FRIENDS[0], 4, 1080),
  {
    user_id: "me",
    username: "me",
    display_name: "Spencer",
    profile_picture_key: null,
    xp_this_period: 940,
    rank: 5,
  },
];

const FIXTURE_FRIENDS_ENTRIES: LeaderboardEntry[] = [
  lbEntry(FIXTURE_FRIENDS[1], 1, 1620),
  lbEntry(FIXTURE_FRIENDS[5], 2, 1290),
  {
    user_id: "me",
    username: "me",
    display_name: "Spencer",
    profile_picture_key: null,
    xp_this_period: 940,
    rank: 3,
  },
];

export const FIXTURE_LEAGUE_SPOTLIGHT: ApiLeagueSpotlight = {
  league: "Sapphire League",
  league_tier: 4,
  my_row: FIXTURE_WEEKLY_ENTRIES[4],
  rank: 5,
  rank_yesterday: 7,
  rank_delta_today: 2,
  daily_xp: [180, 220, 140, 200, 200],
  friend_median_daily_xp: [140, 160, 130, 150, 150],
  top_three: [
    {
      user_id: FIXTURE_FRIENDS[5].user_id,
      username: FIXTURE_FRIENDS[5].username,
      display_name: "Priya",
      profile_picture_key: null,
      xp_this_period: 1840,
      rank: 1,
    },
    {
      user_id: FIXTURE_FRIENDS[1].user_id,
      username: FIXTURE_FRIENDS[1].username,
      display_name: "Kenji",
      profile_picture_key: null,
      xp_this_period: 1620,
      rank: 2,
    },
    {
      user_id: FIXTURE_FRIENDS[6].user_id,
      username: FIXTURE_FRIENDS[6].username,
      display_name: "Noor",
      profile_picture_key: null,
      xp_this_period: 1290,
      rank: 3,
    },
  ],
  promotion_threshold: 3,
  demotion_threshold: 2,
};

export const FIXTURE_LEADERBOARD_BUNDLE: ApiLeaderboardBundle = {
  weekly: {
    bucket: "weekly",
    entries: FIXTURE_WEEKLY_ENTRIES,
    total: FIXTURE_WEEKLY_ENTRIES.length,
    my_rank: 5,
  },
  monthly: {
    bucket: "monthly",
    entries: FIXTURE_WEEKLY_ENTRIES,
    total: FIXTURE_WEEKLY_ENTRIES.length,
    my_rank: 5,
  },
  friends: {
    bucket: "friends",
    entries: FIXTURE_FRIENDS_ENTRIES,
    total: FIXTURE_FRIENDS_ENTRIES.length,
    my_rank: 3,
  },
  spotlight: FIXTURE_LEAGUE_SPOTLIGHT,
};

export function makeFixtureSocialApi() {
  return {
    getFriends: vi.fn().mockResolvedValue(FIXTURE_FRIENDS),
    getFriendRequests: vi.fn().mockResolvedValue(FIXTURE_FRIEND_REQUESTS),
    getSuggestions: vi.fn().mockResolvedValue(FIXTURE_SUGGESTIONS),
    getActivity: vi.fn().mockResolvedValue(FIXTURE_ACTIVITY),
    getInviteOffer: vi.fn().mockResolvedValue(FIXTURE_INVITE_OFFER),
    getStreakSnapshot: vi.fn().mockResolvedValue(FIXTURE_STREAK_SNAPSHOT),
    getLeagueSpotlight: vi.fn().mockResolvedValue(FIXTURE_LEAGUE_SPOTLIGHT),
    getLeaderboardBundle: vi.fn().mockResolvedValue(FIXTURE_LEADERBOARD_BUNDLE),
    getWeeklyLeaderboard: vi.fn().mockResolvedValue({
      bucket: "weekly",
      entries: FIXTURE_WEEKLY_ENTRIES,
      total: FIXTURE_WEEKLY_ENTRIES.length,
      my_rank: 5,
    }),
    getMonthlyLeaderboard: vi.fn().mockResolvedValue({
      bucket: "monthly",
      entries: FIXTURE_WEEKLY_ENTRIES,
      total: FIXTURE_WEEKLY_ENTRIES.length,
      my_rank: 5,
    }),
    getFriendsLeaderboard: vi.fn().mockResolvedValue({
      bucket: "friends",
      entries: FIXTURE_FRIENDS_ENTRIES,
      total: FIXTURE_FRIENDS_ENTRIES.length,
      my_rank: 3,
    }),
    listBlocks: vi.fn().mockResolvedValue([]),
    sendFriendRequest: vi.fn(),
    acceptFriendRequest: vi.fn(),
    deleteFriendRequest: vi.fn(),
    unfriend: vi.fn(),
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
    reactToActivity: vi.fn(),
    redeemInvite: vi.fn(),
    getPublicProfile: vi.fn(),
    searchUsers: vi.fn(),
    getQuestTargets: vi.fn(),
    _now: nowIso,
  };
}
