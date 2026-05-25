import { describe, it, expect, afterEach } from "vitest";
import { renderHook, cleanup, waitFor } from "@testing-library/react";
import { MockSocialProviders } from "@/test/socialTestUtils";
import {
  isSocialApiEnabled,
  useActivityFeed,
  useFriends,
  useInviteOffer,
  useLeagueSpotlight,
  useSocial,
} from "./useSocial";

afterEach(() => cleanup());

const wrapper = MockSocialProviders;

describe("useSocial (bundle)", () => {
  it("returns synchronous mock data with the expected shape", () => {
    const { result } = renderHook(() => useSocial(), { wrapper });
    expect(result.current.source).toBe("mock");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.me.name).toBe("Spencer");
    expect(result.current.friends.length).toBeGreaterThan(0);
    expect(result.current.weeklyLeaderboard.length).toBeGreaterThan(0);
  });
});

describe("granular hooks", () => {
  it("useFriends resolves after the mock delay", async () => {
    const { result } = renderHook(() => useFriends(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });
    expect(result.current.data!.length).toBeGreaterThan(0);
    expect(result.current.isEmpty).toBe(false);
  });

  it("useFriends respects instant: true", () => {
    const { result } = renderHook(() => useFriends({ instant: true }), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.length).toBeGreaterThan(0);
  });

  it("useFriends marks empty when override is []", () => {
    const { result } = renderHook(
      () => useFriends({ instant: true, override: [] }),
      { wrapper },
    );
    expect(result.current.data).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });

  it("useActivityFeed yields ActivityItems with reactions", () => {
    const { result } = renderHook(() => useActivityFeed({ instant: true }), { wrapper });
    expect(result.current.data?.[0]?.reactions).toBeDefined();
  });

  it("useInviteOffer exposes the lingot + ad-free reward", () => {
    const { result } = renderHook(() => useInviteOffer({ instant: true }), { wrapper });
    expect(result.current.data?.rewardLingots).toBe(100);
    expect(result.current.data?.rewardAdFreeHours).toBe(1);
  });

  it("useLeagueSpotlight derives the day-over-day rank delta", () => {
    const { result } = renderHook(() => useLeagueSpotlight({ instant: true }), { wrapper });
    // MOCK_RANK_YESTERDAY (7) − today's rank (5) = +2
    expect(result.current.data?.rankDeltaToday).toBe(2);
    expect(result.current.data?.league.name).toBe("Sapphire League");
  });
});

describe("isSocialApiEnabled", () => {
  it("is false by default in tests", () => {
    expect(isSocialApiEnabled()).toBe(false);
  });
});
