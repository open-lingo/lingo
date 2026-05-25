/**
 * Social feature data hooks — the seam between UI components and the
 * eventual `SocialApi` (FastAPI service).
 *
 * Two hook flavors live here:
 *
 * 1) `useSocial()` — synchronous bundle hook used by the home Social card
 *    and the page header. Returns all sub-resources at once for components
 *    that need the whole graph immediately and don't care about loading
 *    states (mock-backed; no flicker).
 *
 * 2) Granular per-resource hooks (`useActivityFeed`, `useFriends`,
 *    `useThreads`, `useWeeklyLeaderboard`, …) — each returns
 *    `{ data, isLoading, isEmpty }`. Used by the new social-page sections
 *    so they can render skeletons + empty states independently.
 *
 *    Each granular hook is mock-backed today (~80 ms `setTimeout` so
 *    skeletons get a chance to render). When the real API lands, swap
 *    the body for a `useQuery({ queryKey, queryFn: socialApi.* })` call
 *    — no consumer should need to change.
 *
 *    The API surface they wrap is `src/shared/api/social.ts` (`SocialApi`).
 *    Set `VITE_SOCIAL_API=1` to force the real path once it's wired
 *    through `ApiProvider`. (Provider wiring is a follow-up; today the
 *    flag is a no-op and mocks always win.)
 *
 * Contract every granular hook returns:
 *
 *   {
 *     data: T | null,        // null until first frame "lands"
 *     isLoading: boolean,    // true while the mock fetch is pending
 *     isEmpty: boolean,      // sugar: true when data resolved but empty
 *   }
 *
 * Tests can pass `{ instant: true }` to skip the delay.
 */
import { useEffect, useMemo, useState } from "react";
import {
  MOCK_ACTIVITY,
  MOCK_DAILY_XP,
  MOCK_FRIEND_MEDIAN_DAILY,
  MOCK_FRIEND_QUEST,
  MOCK_FRIEND_REQUESTS,
  MOCK_FRIEND_SUGGESTIONS,
  MOCK_FRIENDS,
  MOCK_FRIENDS_LB,
  MOCK_INVITE_OFFER,
  MOCK_LEAGUE,
  MOCK_ME,
  MOCK_MONTHLY_LB,
  MOCK_RANK_YESTERDAY,
  MOCK_STREAK_SNAPSHOT,
  MOCK_THREADS,
  MOCK_WEEKLY_LB,
  getHomeFriendsPreview,
  type ActivityItem,
  type ChatThread,
  type FriendQuest,
  type HomeFriendPreview,
  type InviteOffer,
  type LeaderboardRow,
  type SocialUser,
} from "../mock/mockSocial";

export type SocialDataSource = "mock" | "api";

/** Default settle delay for the mock fetch. Short enough to feel snappy. */
const MOCK_DELAY_MS = 80;

/** Returns true if the env flag opts in to the real API. Today this is a
 *  no-op switch (no provider wiring); future PR turns it into a real
 *  TanStack-backed source. */
export function isSocialApiEnabled(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flag = (import.meta as any).env?.VITE_SOCIAL_API;
  return flag === "1" || flag === "true";
}

// ────────────────────────────────────────────────────────────────────────────
// Bundle hook — synchronous, mock-backed, used by home + page header.
// ────────────────────────────────────────────────────────────────────────────

export type UseSocialResult = {
  source: SocialDataSource;
  isLoading: boolean;
  isError: boolean;
  me: SocialUser;
  friends: SocialUser[];
  /** Sorted subset for the home Social card. */
  homeFriendsPreview: HomeFriendPreview[];
  friendRequests: SocialUser[];
  friendSuggestions: { user: SocialUser; reason: string }[];
  primarySuggestion: { user: SocialUser; reason: string } | null;
  friendQuest: FriendQuest;
  activity: ActivityItem[];
  threads: ChatThread[];
  weeklyLeaderboard: typeof MOCK_WEEKLY_LB;
  monthlyLeaderboard: typeof MOCK_MONTHLY_LB;
  friendsLeaderboard: typeof MOCK_FRIENDS_LB;
  league: typeof MOCK_LEAGUE;
};

export function useSocial(options?: { homeFriendsLimit?: number }): UseSocialResult {
  const homeLimit = options?.homeFriendsLimit ?? 3;

  return useMemo(
    () => ({
      source: "mock",
      isLoading: false,
      isError: false,
      me: MOCK_ME,
      friends: MOCK_FRIENDS,
      homeFriendsPreview: getHomeFriendsPreview(homeLimit),
      friendRequests: MOCK_FRIEND_REQUESTS,
      friendSuggestions: MOCK_FRIEND_SUGGESTIONS,
      primarySuggestion: MOCK_FRIEND_SUGGESTIONS[0] ?? null,
      friendQuest: MOCK_FRIEND_QUEST,
      activity: MOCK_ACTIVITY,
      threads: MOCK_THREADS,
      weeklyLeaderboard: MOCK_WEEKLY_LB,
      monthlyLeaderboard: MOCK_MONTHLY_LB,
      friendsLeaderboard: MOCK_FRIENDS_LB,
      league: MOCK_LEAGUE,
    }),
    [homeLimit],
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Granular hooks — each `{ data, isLoading, isEmpty }`.
// ────────────────────────────────────────────────────────────────────────────

export type HookOptions = {
  /** If true, resolve synchronously on first render (tests). */
  instant?: boolean;
  /** Override the resolved value (tests / empty-state demos). */
  override?: unknown;
};

export type Result<T> = {
  data: T | null;
  isLoading: boolean;
  isEmpty: boolean;
};

function useMockResource<T>(value: T, options?: HookOptions): Result<T> {
  const instant = options?.instant ?? false;
  const override = options?.override as T | undefined;
  const resolved = override !== undefined ? override : value;

  const [data, setData] = useState<T | null>(instant ? resolved : null);

  useEffect(() => {
    if (instant) {
      setData(resolved);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      if (!cancelled) setData(resolved);
    }, MOCK_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // Intentionally not depending on `resolved` — would re-fire on every
    // render. Tests use `instant: true` if they need to swap value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instant]);

  return {
    data,
    isLoading: data === null,
    isEmpty: isEmptyValue(data),
  };
}

function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined) return false; // loading, not empty
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

export function useMe(options?: HookOptions): Result<SocialUser> {
  return useMockResource(MOCK_ME, options);
}

export function useFriends(options?: HookOptions): Result<SocialUser[]> {
  return useMockResource(MOCK_FRIENDS, options);
}

export function useFriendRequests(options?: HookOptions): Result<SocialUser[]> {
  return useMockResource(MOCK_FRIEND_REQUESTS, options);
}

export function useFriendSuggestions(
  options?: HookOptions,
): Result<{ user: SocialUser; reason: string }[]> {
  return useMockResource(MOCK_FRIEND_SUGGESTIONS, options);
}

export function useActivityFeed(options?: HookOptions): Result<ActivityItem[]> {
  return useMockResource(MOCK_ACTIVITY, options);
}

export function useThreads(options?: HookOptions): Result<ChatThread[]> {
  return useMockResource(MOCK_THREADS, options);
}

/** League info + the user's current row + day-over-day delta. */
export type LeagueSpotlight = {
  league: typeof MOCK_LEAGUE;
  myRow: LeaderboardRow | null;
  /** rankYesterday − rankToday (positive = climbed). */
  rankDeltaToday: number;
  dailyXp: number[];
  friendMedianDaily: number[];
};

export function useLeagueSpotlight(options?: HookOptions): Result<LeagueSpotlight> {
  const myRow = MOCK_WEEKLY_LB.find((r) => r.isMe) ?? null;
  const rankToday = myRow?.rank ?? 999;
  const spotlight: LeagueSpotlight = {
    league: MOCK_LEAGUE,
    myRow,
    rankDeltaToday: MOCK_RANK_YESTERDAY - rankToday,
    dailyXp: MOCK_DAILY_XP,
    friendMedianDaily: MOCK_FRIEND_MEDIAN_DAILY,
  };
  return useMockResource(spotlight, options);
}

export function useWeeklyLeaderboard(options?: HookOptions): Result<LeaderboardRow[]> {
  return useMockResource(MOCK_WEEKLY_LB, options);
}

export function useMonthlyLeaderboard(options?: HookOptions): Result<LeaderboardRow[]> {
  return useMockResource(MOCK_MONTHLY_LB, options);
}

export function useFriendsLeaderboard(options?: HookOptions): Result<LeaderboardRow[]> {
  return useMockResource(MOCK_FRIENDS_LB, options);
}

export function useStreakSnapshot(
  options?: HookOptions,
): Result<typeof MOCK_STREAK_SNAPSHOT> {
  return useMockResource(MOCK_STREAK_SNAPSHOT, options);
}

export function useInviteOffer(options?: HookOptions): Result<InviteOffer> {
  return useMockResource(MOCK_INVITE_OFFER, options);
}
