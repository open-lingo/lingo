/**
 * Social feature data hooks — the seam between UI components and the
 * `SocialApi` (FastAPI service).
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
 *    `{ data, isLoading, isEmpty }`. Used by the social-page sections so
 *    they can render skeletons + empty states independently.
 *
 *    When `VITE_SOCIAL_API` is set (default `"1"` in dev) each hook returns
 *    a TanStack-Query–backed result against `useApi().social.*` and adapts
 *    the server response into the UI types defined in `mock/mockSocial.ts`
 *    via `socialAdapters.ts`. When unset (or "0"), each hook falls back to
 *    the in-memory mock with the original `setTimeout(80)` "loading"
 *    behavior so tests + the legacy mockup flow keep working.
 *
 * Contract every granular hook returns:
 *
 *   {
 *     data: T | null,        // null until first frame "lands"
 *     isLoading: boolean,    // true while the fetch is pending
 *     isEmpty: boolean,      // sugar: true when data resolved but empty
 *     isError?: boolean,     // present on the API path
 *     refetch?: () => void,  // present on the API path
 *   }
 *
 * Tests can pass `{ instant: true }` to skip the mock delay. The API path
 * ignores `instant` (TanStack Query handles its own pending lifecycle).
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, type QueryKey } from "@tanstack/react-query";
import { useApiOptional } from "@/shared/api";
import type { SocialApi } from "@/shared/api/social";
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
import {
  adaptActivity,
  adaptFriend,
  adaptIncomingRequests,
  adaptInvite,
  adaptLeaderboardEntry,
  adaptSpotlight,
  adaptStreakSnapshot,
  adaptThread,
} from "./socialAdapters";
import type { LeagueSpotlight } from "./useSocial.types";

export type { LeagueSpotlight } from "./useSocial.types";

export type SocialDataSource = "mock" | "api";

/** Default settle delay for the mock fetch. Short enough to feel snappy. */
const MOCK_DELAY_MS = 80;

const SOCIAL_QUERY_KEYS = {
  friends: ["social", "friends"] as const,
  friendRequests: ["social", "friend-requests"] as const,
  blocks: ["social", "blocks"] as const,
  activity: ["social", "activity"] as const,
  threads: ["social", "threads"] as const,
  weeklyLb: (lang: string) => ["social", "leaderboard", "weekly", lang] as const,
  monthlyLb: (lang: string) => ["social", "leaderboard", "monthly", lang] as const,
  friendsLb: (lang: string | undefined) =>
    ["social", "leaderboard", "friends", lang ?? "*"] as const,
  spotlight: (lang: string) => ["social", "spotlight", lang] as const,
  streakSnapshot: ["social", "streak-snapshot"] as const,
  inviteOffer: ["social", "invite-offer"] as const,
  profile: (username: string) => ["social", "profile", username] as const,
  questTargets: ["social", "quest-targets"] as const,
} as const;

export { SOCIAL_QUERY_KEYS };

/** Returns true if the env flag opts in to the real API. Defaults to "1"
 *  (enabled) when the env var is unset so dev work hits the seeded backend
 *  by default. Tests run under vitest where `import.meta.env.MODE === "test"`
 *  — we force it OFF there so the existing mock-backed tests continue to
 *  work without a backend stub. */
export function isSocialApiEnabled(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env ?? {};
  if (env.MODE === "test") return env.VITE_SOCIAL_API === "1" || env.VITE_SOCIAL_API === "true";
  const flag = env.VITE_SOCIAL_API;
  if (flag === undefined || flag === null || flag === "") return true;
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
  /** If true, resolve synchronously on first render (mock path only). */
  instant?: boolean;
  /** Override the resolved value (tests / empty-state demos). */
  override?: unknown;
};

export type Result<T> = {
  data: T | null;
  isLoading: boolean;
  isEmpty: boolean;
  isError?: boolean;
  refetch?: () => void;
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

/**
 * Run a TanStack `useQuery` against the real social API and map it back to
 * the `{ data, isLoading, isEmpty, isError, refetch }` contract every
 * consumer expects. Provided as a tiny adapter so the per-resource hooks
 * stay one-liner thin.
 */
function useApiResource<TServer, TUi>(opts: {
  queryKey: QueryKey;
  queryFn: ((signal: AbortSignal) => Promise<TServer>) | null;
  select: (raw: TServer) => TUi;
  /** Honor the existing `override` hatch from `HookOptions`. */
  override?: TUi;
  staleTime?: number;
  enabled?: boolean;
}): Result<TUi> {
  const { queryKey, queryFn, select, override, staleTime, enabled } = opts;
  const finalEnabled = (enabled ?? true) && queryFn !== null;
  const q = useQuery<TServer, Error, TUi>({
    queryKey,
    queryFn: ({ signal }) => {
      if (!queryFn) return Promise.reject(new Error("queryFn unavailable"));
      return queryFn(signal);
    },
    select,
    staleTime: staleTime ?? 60_000,
    enabled: finalEnabled,
  });
  if (override !== undefined) {
    return { data: override, isLoading: false, isEmpty: isEmptyValue(override) };
  }
  return {
    data: q.data ?? null,
    isLoading: finalEnabled ? q.isLoading : true,
    isEmpty: isEmptyValue(q.data),
    isError: q.isError,
    refetch: () => {
      void q.refetch();
    },
  };
}

export function useMe(options?: HookOptions): Result<SocialUser> {
  // No API endpoint yet — keep mock-backed always.
  return useMockResource(MOCK_ME, options);
}

export function useFriends(options?: HookOptions): Result<SocialUser[]> {
  const enabled = isSocialApiEnabled();
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const apiResult = useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.friends,
    queryFn: social ? (signal) => social.getFriends(signal) : null,
    select: (data) => data.map(adaptFriend),
    override: options?.override as SocialUser[] | undefined,
    staleTime: 60_000,
    enabled,
  });
  const mockResult = useMockResource(MOCK_FRIENDS, options);
  return enabled ? apiResult : mockResult;
}

export function useFriendRequests(options?: HookOptions): Result<SocialUser[]> {
  const enabled = isSocialApiEnabled();
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const apiResult = useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.friendRequests,
    queryFn: social ? (signal) => social.getFriendRequests(signal) : null,
    select: adaptIncomingRequests,
    override: options?.override as SocialUser[] | undefined,
    staleTime: 60_000,
    enabled,
  });
  const mockResult = useMockResource(MOCK_FRIEND_REQUESTS, options);
  return enabled ? apiResult : mockResult;
}

export function useFriendSuggestions(
  options?: HookOptions,
): Result<{ user: SocialUser; reason: string }[]> {
  // No backend endpoint for suggestions yet — mock-backed always.
  return useMockResource(MOCK_FRIEND_SUGGESTIONS, options);
}

export function useActivityFeed(options?: HookOptions): Result<ActivityItem[]> {
  const enabled = isSocialApiEnabled();
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const apiResult = useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.activity,
    queryFn: social ? (signal) => social.getActivity(undefined, signal) : null,
    select: (resp) => resp.items.map(adaptActivity),
    override: options?.override as ActivityItem[] | undefined,
    staleTime: 30_000,
    enabled,
  });
  const mockResult = useMockResource(MOCK_ACTIVITY, options);
  return enabled ? apiResult : mockResult;
}

export function useThreads(options?: HookOptions): Result<ChatThread[]> {
  const enabled = isSocialApiEnabled();
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const apiResult = useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.threads,
    queryFn: social ? (signal) => social.getThreads(signal) : null,
    select: (data) => data.map(adaptThread),
    override: options?.override as ChatThread[] | undefined,
    staleTime: 30_000,
    enabled,
  });
  const mockResult = useMockResource(MOCK_THREADS, options);
  return enabled ? apiResult : mockResult;
}

export function useLeagueSpotlight(options?: HookOptions): Result<LeagueSpotlight> {
  const enabled = isSocialApiEnabled();
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  // Lang isn't dynamic yet — pin to ja until LanguageContext is threaded in.
  const lang = "ja";
  const apiResult = useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.spotlight(lang),
    queryFn: social ? (signal) => social.getLeagueSpotlight(lang, signal) : null,
    select: (s) => adaptSpotlight(s, null),
    override: options?.override as LeagueSpotlight | undefined,
    staleTime: 60_000,
    enabled,
  });

  // Mock path: synthesize the spotlight from the mock weekly leaderboard.
  const myRow = MOCK_WEEKLY_LB.find((r) => r.isMe) ?? null;
  const rankToday = myRow?.rank ?? 999;
  const mockSpotlight: LeagueSpotlight = {
    league: MOCK_LEAGUE,
    myRow,
    rankDeltaToday: MOCK_RANK_YESTERDAY - rankToday,
    dailyXp: MOCK_DAILY_XP,
    friendMedianDaily: MOCK_FRIEND_MEDIAN_DAILY,
  };
  const mockResult = useMockResource(mockSpotlight, options);
  return enabled ? apiResult : mockResult;
}

export function useWeeklyLeaderboard(options?: HookOptions): Result<LeaderboardRow[]> {
  const enabled = isSocialApiEnabled();
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const lang = "ja";
  const apiResult = useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.weeklyLb(lang),
    queryFn: social ? (signal) => social.getWeeklyLeaderboard(lang, undefined, signal) : null,
    select: (r) =>
      r.entries.map((e) =>
        adaptLeaderboardEntry(e, r.my_rank !== null && e.rank === r.my_rank),
      ),
    override: options?.override as LeaderboardRow[] | undefined,
    staleTime: 60_000,
    enabled,
  });
  const mockResult = useMockResource(MOCK_WEEKLY_LB, options);
  return enabled ? apiResult : mockResult;
}

export function useMonthlyLeaderboard(options?: HookOptions): Result<LeaderboardRow[]> {
  const enabled = isSocialApiEnabled();
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const lang = "ja";
  const apiResult = useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.monthlyLb(lang),
    queryFn: social ? (signal) => social.getMonthlyLeaderboard(lang, undefined, signal) : null,
    select: (r) =>
      r.entries.map((e) =>
        adaptLeaderboardEntry(e, r.my_rank !== null && e.rank === r.my_rank),
      ),
    override: options?.override as LeaderboardRow[] | undefined,
    staleTime: 60_000,
    enabled,
  });
  const mockResult = useMockResource(MOCK_MONTHLY_LB, options);
  return enabled ? apiResult : mockResult;
}

export function useFriendsLeaderboard(options?: HookOptions): Result<LeaderboardRow[]> {
  const enabled = isSocialApiEnabled();
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const apiResult = useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.friendsLb("ja"),
    queryFn: social ? (signal) => social.getFriendsLeaderboard({ lang: "ja" }, signal) : null,
    select: (r) =>
      r.entries.map((e) =>
        adaptLeaderboardEntry(e, r.my_rank !== null && e.rank === r.my_rank),
      ),
    override: options?.override as LeaderboardRow[] | undefined,
    staleTime: 60_000,
    enabled,
  });
  const mockResult = useMockResource(MOCK_FRIENDS_LB, options);
  return enabled ? apiResult : mockResult;
}

export function useStreakSnapshot(
  options?: HookOptions,
): Result<typeof MOCK_STREAK_SNAPSHOT> {
  const enabled = isSocialApiEnabled();
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const apiResult = useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.streakSnapshot,
    queryFn: social ? (signal) => social.getStreakSnapshot(signal) : null,
    select: adaptStreakSnapshot,
    override: options?.override as typeof MOCK_STREAK_SNAPSHOT | undefined,
    staleTime: 60_000,
    enabled,
  });
  const mockResult = useMockResource(MOCK_STREAK_SNAPSHOT, options);
  return enabled ? apiResult : mockResult;
}

export function useInviteOffer(options?: HookOptions): Result<InviteOffer> {
  const enabled = isSocialApiEnabled();
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const apiResult = useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.inviteOffer,
    queryFn: social ? (signal) => social.getInviteOffer(signal) : null,
    select: adaptInvite,
    override: options?.override as InviteOffer | undefined,
    staleTime: 60_000,
    enabled,
  });
  const mockResult = useMockResource(MOCK_INVITE_OFFER, options);
  return enabled ? apiResult : mockResult;
}
