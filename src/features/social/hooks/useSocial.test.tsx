import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, cleanup, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/shared/contexts/ToastContext";
import type {
  ActivityFeedResponse,
  Friend as ApiFriend,
  InviteOffer as ApiInviteOffer,
  LeagueSpotlight as ApiLeagueSpotlight,
} from "@/shared/api/social";
import {
  useActivityFeed,
  useFriends,
  useInviteOffer,
  useLeagueSpotlight,
  useSocial,
} from "./useSocial";

const social = {
  getFriends: vi.fn(),
  getFriendRequests: vi.fn(),
  getSuggestions: vi.fn(),
  getActivity: vi.fn(),
  getThreads: vi.fn(),
  getInviteOffer: vi.fn(),
  getLeagueSpotlight: vi.fn(),
  getLeaderboardBundle: vi.fn(),
  getWeeklyLeaderboard: vi.fn(),
  getMonthlyLeaderboard: vi.fn(),
  getFriendsLeaderboard: vi.fn(),
  getStreakSnapshot: vi.fn(),
  listBlocks: vi.fn(),
};

vi.mock("@/shared/api", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api")>("@/shared/api");
  return {
    ...actual,
    useApiOptional: () => ({ social }),
    useApi: () => ({ social }),
  };
});

function buildWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    );
  }
  return Wrapper;
}

afterEach(() => {
  cleanup();
  for (const fn of Object.values(social)) fn.mockReset();
});

const friendFixture: ApiFriend = {
  user_id: "u-anna",
  username: "anna",
  display_name: "Anna",
  profile_picture_key: null,
  streak: 5,
  xp: 1200,
  lastActiveAt: new Date().toISOString(),
  friendedAt: new Date().toISOString(),
};

describe("useFriends", () => {
  it("resolves with adapted friends from the API", async () => {
    social.getFriends.mockResolvedValue([friendFixture]);
    const { result } = renderHook(() => useFriends(), { wrapper: buildWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data?.[0]?.name).toBe("Anna");
    expect(result.current.isEmpty).toBe(false);
  });

  it("marks empty when override is []", () => {
    const { result } = renderHook(
      () => useFriends({ override: [] }),
      { wrapper: buildWrapper() },
    );
    expect(result.current.data).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });
});

describe("useActivityFeed", () => {
  it("yields ActivityItems with reactions", async () => {
    const resp: ActivityFeedResponse = {
      items: [
        {
          id: "a-1",
          user_id: "u-anna",
          username: "anna",
          display_name: "Anna",
          profile_picture_key: null,
          kind: "lesson_completed",
          payload: { lessonId: "m2" },
          created_at: new Date().toISOString(),
          reactions: [{ kind: "wave", count: 2, mine: false }],
        },
      ],
      cursor: null,
    };
    social.getActivity.mockResolvedValue(resp);
    const { result } = renderHook(() => useActivityFeed(), { wrapper: buildWrapper() });
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data?.[0]?.reactions).toBeDefined();
  });
});

describe("useInviteOffer", () => {
  it("exposes the lingot + ad-free reward", async () => {
    const offer: ApiInviteOffer = {
      code: "abc",
      url: "https://lingo.app/invite/abc",
      lingot_reward_inviter: 100,
      lingot_reward_invitee: 100,
      ad_free_minutes_inviter: 60,
      ad_free_minutes_invitee: 60,
      redeemed_count_this_month: 0,
      monthly_cap: 10,
      first_lesson_required: false,
    };
    social.getInviteOffer.mockResolvedValue(offer);
    const { result } = renderHook(() => useInviteOffer(), { wrapper: buildWrapper() });
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data?.rewardLingots).toBe(100);
    expect(result.current.data?.rewardAdFreeHours).toBe(1);
  });
});

describe("useLeagueSpotlight", () => {
  it("derives the day-over-day rank delta from the API payload", async () => {
    const payload: ApiLeagueSpotlight = {
      league: "Sapphire League",
      league_tier: 4,
      promotion_threshold: 3,
      demotion_threshold: 2,
      my_row: null,
      rank: null,
      rank_yesterday: null,
      rank_delta_today: 2,
      daily_xp: [100, 120, 80, 90, 110],
      friend_median_daily_xp: [80, 90, 70, 75, 85],
      top_three: [],
    };
    social.getLeagueSpotlight.mockResolvedValue(payload);
    const { result } = renderHook(() => useLeagueSpotlight(), {
      wrapper: buildWrapper(),
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data?.rankDeltaToday).toBe(2);
    expect(result.current.data?.league.name).toBe("Sapphire League");
  });
});

describe("useSocial bundle", () => {
  it("returns empty defaults until the underlying queries resolve", () => {
    social.getFriends.mockResolvedValue([]);
    social.getFriendRequests.mockResolvedValue({ incoming: [], outgoing: [] });
    social.getSuggestions.mockResolvedValue({ items: [] });
    social.getActivity.mockResolvedValue({ items: [], cursor: null });
    social.getThreads.mockResolvedValue([]);
    social.getLeaderboardBundle.mockResolvedValue({
      weekly: { bucket: "weekly", entries: [], total: 0, my_rank: null },
      monthly: { bucket: "monthly", entries: [], total: 0, my_rank: null },
      friends: { bucket: "friends", entries: [], total: 0, my_rank: null },
      spotlight: {
        league: "",
        league_tier: 0,
        promotion_threshold: 0,
        demotion_threshold: 0,
        my_row: null,
        rank: null,
        rank_yesterday: null,
        rank_delta_today: 0,
        daily_xp: [],
        friend_median_daily_xp: [],
        top_three: [],
      },
    });
    const { result } = renderHook(() => useSocial(), { wrapper: buildWrapper() });
    expect(result.current.me).toBeNull();
    expect(result.current.friendQuest).toBeNull();
    expect(result.current.friends).toEqual([]);
    expect(result.current.weeklyLeaderboard).toEqual([]);
  });
});
