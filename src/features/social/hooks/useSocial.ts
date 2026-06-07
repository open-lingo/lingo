import { useMemo } from "react";
import { useQuery, type QueryKey } from "@tanstack/react-query";
import { useApiOptional } from "@/shared/api";
import type {
  BlockedUser as ApiBlockedUser,
  FriendRequestsBundle,
  LeaderboardBundle as ApiLeaderboardBundle,
  SocialApi,
} from "@/shared/api/social";
import type {
  ActivityItem,
  ChatThread,
  FriendQuest,
  HomeFriendPreview,
  InviteOffer,
  LeaderboardRow,
  LeagueInfo,
  SocialUser,
  StreakSnapshot,
} from "../types";
import { toHomeFriendPreview } from "../adapters";
import {
  adaptActivity,
  adaptFriend,
  adaptFriendRequest,
  adaptIncomingRequests,
  adaptInvite,
  adaptLeaderboardEntry,
  adaptSpotlight,
  adaptStreakSnapshot,
  adaptThread,
} from "./socialAdapters";
import type { LeagueSpotlight } from "./useSocial.types";

export type { LeagueSpotlight } from "./useSocial.types";

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
  leaderboardBundle: (lang: string) =>
    ["social", "leaderboard", "bundle", lang] as const,
  streakSnapshot: ["social", "streak-snapshot"] as const,
  inviteOffer: ["social", "invite-offer"] as const,
  profile: (username: string) => ["social", "profile", username] as const,
  questTargets: ["social", "quest-targets"] as const,
  suggestions: (limit: number) => ["social", "suggestions", limit] as const,
} as const;

export { SOCIAL_QUERY_KEYS };

export type HookOptions = {
  override?: unknown;
};

export type Result<T> = {
  data: T | null;
  isLoading: boolean;
  isEmpty: boolean;
  isError?: boolean;
  refetch?: () => void;
};

function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function useApiResource<TServer, TUi>(opts: {
  queryKey: QueryKey;
  queryFn: ((signal: AbortSignal) => Promise<TServer>) | null;
  select: (raw: TServer) => TUi;
  override?: TUi;
  staleTime: number;
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
    staleTime,
    enabled: finalEnabled,
  });
  if (override !== undefined) {
    return { data: override, isLoading: false, isEmpty: isEmptyValue(override) };
  }
  return {
    data: q.data ?? null,
    isLoading: finalEnabled ? q.isLoading : false,
    isEmpty: isEmptyValue(q.data),
    isError: q.isError,
    refetch: () => {
      void q.refetch();
    },
  };
}

export type UseSocialResult = {
  isLoading: boolean;
  isError: boolean;
  me: SocialUser | null;
  friends: SocialUser[];
  homeFriendsPreview: HomeFriendPreview[];
  friendRequests: SocialUser[];
  friendSuggestions: { user: SocialUser; reason: string }[];
  primarySuggestion: { user: SocialUser; reason: string } | null;
  friendQuest: FriendQuest | null;
  activity: ActivityItem[];
  threads: ChatThread[];
  weeklyLeaderboard: LeaderboardRow[];
  monthlyLeaderboard: LeaderboardRow[];
  friendsLeaderboard: LeaderboardRow[];
  league: LeagueInfo | null;
};

export function useSocial(options?: { homeFriendsLimit?: number }): UseSocialResult {
  const homeLimit = options?.homeFriendsLimit ?? 3;
  const friends = useFriends();
  const friendRequests = useFriendRequests();
  const friendSuggestions = useFriendSuggestions();
  const activity = useActivityFeed();
  const threads = useThreads();
  const bundle = useLeaderboardBundle();

  return useMemo(() => {
    const friendsData = friends.data ?? [];
    const suggestionsData = friendSuggestions.data ?? [];
    const homeFriendsPreview = [...friendsData]
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "active" ? -1 : 1;
        return b.streakDays - a.streakDays;
      })
      .slice(0, homeLimit)
      .map(toHomeFriendPreview);

    return {
      isLoading:
        friends.isLoading ||
        friendRequests.isLoading ||
        friendSuggestions.isLoading ||
        activity.isLoading ||
        threads.isLoading ||
        bundle.isLoading,
      isError:
        Boolean(friends.isError) ||
        Boolean(friendRequests.isError) ||
        Boolean(friendSuggestions.isError) ||
        Boolean(activity.isError) ||
        Boolean(threads.isError) ||
        Boolean(bundle.isError),
      me: null,
      friends: friendsData,
      homeFriendsPreview,
      friendRequests: friendRequests.data ?? [],
      friendSuggestions: suggestionsData,
      primarySuggestion: suggestionsData[0] ?? null,
      friendQuest: null,
      activity: activity.data ?? [],
      threads: threads.data ?? [],
      weeklyLeaderboard: bundle.data?.weekly ?? [],
      monthlyLeaderboard: bundle.data?.monthly ?? [],
      friendsLeaderboard: bundle.data?.friends ?? [],
      league: bundle.data?.spotlight.league ?? null,
    };
  }, [
    homeLimit,
    friends.data,
    friends.isLoading,
    friends.isError,
    friendRequests.data,
    friendRequests.isLoading,
    friendRequests.isError,
    friendSuggestions.data,
    friendSuggestions.isLoading,
    friendSuggestions.isError,
    activity.data,
    activity.isLoading,
    activity.isError,
    threads.data,
    threads.isLoading,
    threads.isError,
    bundle.data,
    bundle.isLoading,
    bundle.isError,
  ]);
}

export function useFriends(options?: HookOptions): Result<SocialUser[]> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.friends,
    queryFn: social ? (signal) => social.getFriends(signal) : null,
    select: (data) => data.map(adaptFriend),
    override: options?.override as SocialUser[] | undefined,
    staleTime: 60_000,
  });
}

export function useFriendRequests(options?: HookOptions): Result<SocialUser[]> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.friendRequests,
    queryFn: social ? (signal) => social.getFriendRequests(signal) : null,
    select: adaptIncomingRequests,
    override: options?.override as SocialUser[] | undefined,
    staleTime: 60_000,
  });
}

export function useFriendSuggestions(
  options?: HookOptions & { limit?: number },
): Result<{ user: SocialUser; reason: string }[]> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const limit = options?.limit ?? 10;
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.suggestions(limit),
    queryFn: social ? (signal) => social.getSuggestions(limit, signal) : null,
    select: (resp) =>
      resp.items.map((it) => ({
        user: {
          id: it.user_id,
          name: it.display_name || it.username,
          username: it.username,
          imageUrl: it.profile_picture_key ?? undefined,
          language: { code: "", flag: "", label: "" },
          streakDays: it.streak,
          totalXp: it.xp,
          lessonsCompleted: 0,
          status: "idle" as const,
          lastActiveLabel: "",
        },
        reason: it.reason,
      })),
    override: options?.override as
      | { user: SocialUser; reason: string }[]
      | undefined,
    staleTime: 60_000,
  });
}

export function useActivityFeed(options?: HookOptions): Result<ActivityItem[]> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.activity,
    queryFn: social ? (signal) => social.getActivity(undefined, signal) : null,
    select: (resp) => resp.items.map(adaptActivity),
    override: options?.override as ActivityItem[] | undefined,
    staleTime: 30_000,
  });
}

export function useThreads(options?: HookOptions): Result<ChatThread[]> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.threads,
    queryFn: social ? (signal) => social.getThreads(signal) : null,
    select: (data) => data.map(adaptThread),
    override: options?.override as ChatThread[] | undefined,
    staleTime: 30_000,
  });
}

export function useLeagueSpotlight(options?: HookOptions): Result<LeagueSpotlight> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const lang = "ja";
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.spotlight(lang),
    queryFn: social ? (signal) => social.getLeagueSpotlight(lang, signal) : null,
    select: (s) => adaptSpotlight(s, null),
    override: options?.override as LeagueSpotlight | undefined,
    staleTime: 60_000,
  });
}

export function useWeeklyLeaderboard(options?: HookOptions): Result<LeaderboardRow[]> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const lang = "ja";
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.weeklyLb(lang),
    queryFn: social ? (signal) => social.getWeeklyLeaderboard(lang, undefined, signal) : null,
    select: (r) =>
      r.entries.map((e) =>
        adaptLeaderboardEntry(e, r.my_rank !== null && e.rank === r.my_rank),
      ),
    override: options?.override as LeaderboardRow[] | undefined,
    staleTime: 60_000,
  });
}

export function useMonthlyLeaderboard(options?: HookOptions): Result<LeaderboardRow[]> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const lang = "ja";
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.monthlyLb(lang),
    queryFn: social ? (signal) => social.getMonthlyLeaderboard(lang, undefined, signal) : null,
    select: (r) =>
      r.entries.map((e) =>
        adaptLeaderboardEntry(e, r.my_rank !== null && e.rank === r.my_rank),
      ),
    override: options?.override as LeaderboardRow[] | undefined,
    staleTime: 60_000,
  });
}

export type UseLeaderboardBundleResult = Result<{
  weekly: LeaderboardRow[];
  monthly: LeaderboardRow[];
  friends: LeaderboardRow[];
  spotlight: LeagueSpotlight;
}>;

export function useLeaderboardBundle(options?: HookOptions): UseLeaderboardBundleResult {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  const lang = "ja";

  return useApiResource<
    ApiLeaderboardBundle,
    {
      weekly: LeaderboardRow[];
      monthly: LeaderboardRow[];
      friends: LeaderboardRow[];
      spotlight: LeagueSpotlight;
    }
  >({
    queryKey: SOCIAL_QUERY_KEYS.leaderboardBundle(lang),
    queryFn: social ? (signal) => social.getLeaderboardBundle(lang, undefined, signal) : null,
    select: (b) => {
      const weekly = b.weekly.entries.map((e) =>
        adaptLeaderboardEntry(e, b.weekly.my_rank !== null && e.rank === b.weekly.my_rank),
      );
      const monthly = b.monthly.entries.map((e) =>
        adaptLeaderboardEntry(e, b.monthly.my_rank !== null && e.rank === b.monthly.my_rank),
      );
      const friends = b.friends.entries.map((e) =>
        adaptLeaderboardEntry(e, b.friends.my_rank !== null && e.rank === b.friends.my_rank),
      );
      const myWeeklyRow = weekly.find((r) => r.isMe) ?? null;
      return {
        weekly,
        monthly,
        friends,
        spotlight: adaptSpotlight(b.spotlight, myWeeklyRow),
      };
    },
    override: options?.override as
      | {
          weekly: LeaderboardRow[];
          monthly: LeaderboardRow[];
          friends: LeaderboardRow[];
          spotlight: LeagueSpotlight;
        }
      | undefined,
    staleTime: 60_000,
  });
}

export function useFriendsLeaderboard(options?: HookOptions): Result<LeaderboardRow[]> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.friendsLb("ja"),
    queryFn: social ? (signal) => social.getFriendsLeaderboard({ lang: "ja" }, signal) : null,
    select: (r) =>
      r.entries.map((e) =>
        adaptLeaderboardEntry(e, r.my_rank !== null && e.rank === r.my_rank),
      ),
    override: options?.override as LeaderboardRow[] | undefined,
    staleTime: 60_000,
  });
}

export function useStreakSnapshot(options?: HookOptions): Result<StreakSnapshot> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.streakSnapshot,
    queryFn: social ? (signal) => social.getStreakSnapshot(signal) : null,
    select: adaptStreakSnapshot,
    override: options?.override as StreakSnapshot | undefined,
    staleTime: 60_000,
  });
}

export function useInviteOffer(options?: HookOptions): Result<InviteOffer> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.inviteOffer,
    queryFn: social ? (signal) => social.getInviteOffer(signal) : null,
    select: adaptInvite,
    override: options?.override as InviteOffer | undefined,
    staleTime: 60_000,
  });
}

export function useFriendRequestsBundle(
  options?: HookOptions,
): Result<{ incoming: SocialUser[]; outgoing: SocialUser[] }> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.friendRequests,
    queryFn: social ? (signal) => social.getFriendRequests(signal) : null,
    select: (bundle: FriendRequestsBundle) => ({
      incoming: (bundle.incoming ?? []).map(adaptFriendRequest),
      outgoing: (bundle.outgoing ?? []).map(adaptFriendRequest),
    }),
    override: options?.override as
      | { incoming: SocialUser[]; outgoing: SocialUser[] }
      | undefined,
    staleTime: 60_000,
  });
}

export function useBlocks(options?: HookOptions): Result<ApiBlockedUser[]> {
  const api = useApiOptional();
  const social: SocialApi | null = api?.social ?? null;
  return useApiResource({
    queryKey: SOCIAL_QUERY_KEYS.blocks,
    queryFn: social ? (signal) => social.listBlocks(signal) : null,
    select: (rows: ApiBlockedUser[]) => rows,
    override: options?.override as ApiBlockedUser[] | undefined,
    staleTime: 60_000,
  });
}
