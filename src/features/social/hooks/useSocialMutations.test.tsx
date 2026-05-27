/**
 * Mutation hook tests for `useSocialMutations.ts`.
 *
 * Each test mocks the `useApi` provider with a stub SocialApi so we don't
 * need a real backend. Assertions cover:
 *   - success path → query invalidations + success toast.
 *   - optimistic update for accept-friend-request + react-to-activity.
 *   - rollback on error.
 *   - useRedeemInvite success path with reward payload.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/shared/contexts/ToastContext";
import type {
  ActivityFeedResponse,
  FriendRequestsBundle,
  Friend as ApiFriend,
} from "@/shared/api/social";
import { SOCIAL_QUERY_KEYS } from "./useSocial";
import {
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useReactToActivity,
  useRedeemInvite,
  useSendFriendRequest,
  useUnfriend,
} from "./useSocialMutations";

// ─── API stubs ────────────────────────────────────────────────────────────────

const social = {
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  deleteFriendRequest: vi.fn(),
  unfriend: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
  reactToActivity: vi.fn(),
  redeemInvite: vi.fn(),
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
      queries: {
        retry: false,
        // Keep observer-less cache entries alive so optimistic-update
        // assertions can still read cached values after onSettled runs
        // invalidateQueries (which would otherwise GC them at gcTime=0).
        gcTime: Number.POSITIVE_INFINITY,
        staleTime: 0,
      },
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
  return { client, Wrapper };
}

beforeEach(() => {
  for (const fn of Object.values(social)) fn.mockReset();
});

// ─── send friend request ─────────────────────────────────────────────────────

describe("useSendFriendRequest", () => {
  it("calls the API and invalidates friend-requests on success", async () => {
    social.sendFriendRequest.mockResolvedValue({ status: "pending" });
    const { client, Wrapper } = buildWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useSendFriendRequest(), { wrapper: Wrapper });
    await act(async () => {
      result.current.mutate({ toUsername: "kenji" });
    });

    await waitFor(() => expect(social.sendFriendRequest).toHaveBeenCalledOnce());
    // Hook spreads snake_case alongside camelCase so the FastAPI server reads
    // the field correctly. See useSocialMutations.useSendFriendRequest.
    expect(social.sendFriendRequest).toHaveBeenCalledWith(
      expect.objectContaining({ to_username: "kenji" }),
    );
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: SOCIAL_QUERY_KEYS.friendRequests,
      }),
    );
  });
});

// ─── accept friend request — optimistic ───────────────────────────────────────

describe("useAcceptFriendRequest (optimistic)", () => {
  it("removes the request from incoming + adds the placeholder to friends synchronously, then invalidates on settle", async () => {
    social.acceptFriendRequest.mockResolvedValue({ status: "accepted" });
    const { client, Wrapper } = buildWrapper();

    const incomingReq: FriendRequestsBundle = {
      incoming: [
        {
          user_id: "u-luca",
          username: "luca",
          display_name: "Luca",
          requestedAt: "2026-05-25T10:00:00Z",
        },
      ],
      outgoing: [],
    };
    const existingFriend: ApiFriend = {
      user_id: "u-anna",
      username: "anna",
      display_name: "Anna",
      profile_picture_key: null,
      xp: 100,
      streak: 5,
      lastActiveAt: null,
      friendedAt: "2026-05-01T00:00:00Z",
    };
    client.setQueryData(SOCIAL_QUERY_KEYS.friendRequests, incomingReq);
    client.setQueryData(SOCIAL_QUERY_KEYS.friends, [existingFriend]);

    const { result } = renderHook(() => useAcceptFriendRequest(), { wrapper: Wrapper });
    act(() => {
      result.current.mutate("u-luca");
    });

    // Optimistic: cache slot updated synchronously inside onMutate.
    await waitFor(() => {
      const after = client.getQueryData<FriendRequestsBundle>(SOCIAL_QUERY_KEYS.friendRequests);
      expect(after?.incoming.find((r) => r.user_id === "u-luca")).toBeUndefined();
    });
    const friendsAfterOptimistic = client.getQueryData<ApiFriend[]>(SOCIAL_QUERY_KEYS.friends);
    expect(friendsAfterOptimistic?.some((f) => f.user_id === "u-luca")).toBe(true);

    await waitFor(() => expect(social.acceptFriendRequest).toHaveBeenCalledWith("u-luca"));
  });

  it("rolls back to the snapshot when the server rejects", async () => {
    social.acceptFriendRequest.mockRejectedValue(new Error("boom"));
    const { client, Wrapper } = buildWrapper();

    const incoming: FriendRequestsBundle = {
      incoming: [
        {
          user_id: "u-luca",
          username: "luca",
          display_name: "Luca",
          requestedAt: "2026-05-25T10:00:00Z",
        },
      ],
      outgoing: [],
    };
    client.setQueryData(SOCIAL_QUERY_KEYS.friendRequests, incoming);
    client.setQueryData(SOCIAL_QUERY_KEYS.friends, []);

    const { result } = renderHook(() => useAcceptFriendRequest(), { wrapper: Wrapper });
    act(() => {
      result.current.mutate("u-luca");
    });

    // Wait for the mutation to settle into error state.
    await waitFor(() => expect(result.current.isError).toBe(true));
    const rolledBack = client.getQueryData<FriendRequestsBundle>(
      SOCIAL_QUERY_KEYS.friendRequests,
    );
    expect(rolledBack?.incoming.some((r) => r.user_id === "u-luca")).toBe(true);
  });
});

// ─── decline friend request — optimistic ─────────────────────────────────────

describe("useDeclineFriendRequest (optimistic)", () => {
  it("drops the request from incoming immediately on mutate", async () => {
    social.deleteFriendRequest.mockResolvedValue(undefined);
    const { client, Wrapper } = buildWrapper();
    client.setQueryData<FriendRequestsBundle>(SOCIAL_QUERY_KEYS.friendRequests, {
      incoming: [
        {
          user_id: "u-luca",
          username: "luca",
          display_name: "Luca",
          requestedAt: "2026-05-25T10:00:00Z",
        },
      ],
      outgoing: [],
    });

    const { result } = renderHook(() => useDeclineFriendRequest(), { wrapper: Wrapper });
    act(() => {
      result.current.mutate("u-luca");
    });

    await waitFor(() => {
      const next = client.getQueryData<FriendRequestsBundle>(SOCIAL_QUERY_KEYS.friendRequests);
      expect(next?.incoming).toHaveLength(0);
    });
  });
});

// ─── unfriend ────────────────────────────────────────────────────────────────

describe("useUnfriend", () => {
  it("invalidates friends + leaderboards on success", async () => {
    social.unfriend.mockResolvedValue(undefined);
    const { client, Wrapper } = buildWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUnfriend(), { wrapper: Wrapper });
    act(() => {
      result.current.mutate("u-anna");
    });
    await waitFor(() => expect(social.unfriend).toHaveBeenCalledWith("u-anna"));
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: SOCIAL_QUERY_KEYS.friends }),
    );
  });
});

// ─── react to activity — optimistic + rollback ───────────────────────────────

describe("useReactToActivity (optimistic)", () => {
  function seedActivity(client: QueryClient) {
    const feed: ActivityFeedResponse = {
      cursor: null,
      items: [
        {
          id: "a-1",
          user_id: "u-anna",
          username: "anna",
          display_name: "Anna",
          profile_picture_key: null,
          kind: "lesson_completed",
          payload: { lessonId: "ja-m3-l1", score: 0.92 },
          created_at: "2026-05-25T10:00:00Z",
          reactions: [{ kind: "fire", count: 1, mine: false }],
        },
      ],
    };
    client.setQueryData(SOCIAL_QUERY_KEYS.activity, feed);
  }

  it("bumps the count + flips mine optimistically when adding a reaction", async () => {
    social.reactToActivity.mockResolvedValue({ kind: "fire", count: 2, mine: true });
    const { client, Wrapper } = buildWrapper();
    seedActivity(client);

    const { result } = renderHook(() => useReactToActivity(), { wrapper: Wrapper });
    act(() => {
      result.current.mutate({ activityId: "a-1", kind: "fire" });
    });

    await waitFor(() => {
      const feed = client.getQueryData<ActivityFeedResponse>(SOCIAL_QUERY_KEYS.activity);
      const bucket = feed?.items[0].reactions?.find((r) => r.kind === "fire");
      expect(bucket?.mine).toBe(true);
      expect(bucket?.count).toBeGreaterThanOrEqual(2);
    });
  });

  it("rolls back when the server rejects", async () => {
    social.reactToActivity.mockRejectedValue(new Error("nope"));
    const { client, Wrapper } = buildWrapper();
    seedActivity(client);

    const { result } = renderHook(() => useReactToActivity(), { wrapper: Wrapper });
    act(() => {
      result.current.mutate({ activityId: "a-1", kind: "fire" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const feed = client.getQueryData<ActivityFeedResponse>(SOCIAL_QUERY_KEYS.activity);
    const bucket = feed?.items[0].reactions?.find((r) => r.kind === "fire");
    // Back to seeded values.
    expect(bucket?.mine).toBe(false);
    expect(bucket?.count).toBe(1);
  });
});

// ─── redeem invite ───────────────────────────────────────────────────────────

describe("useRedeemInvite", () => {
  it("returns the lingot + ad-free payload and invalidates inviteOffer + progress", async () => {
    social.redeemInvite.mockResolvedValue({
      status: "ok",
      lingot_reward: 100,
      ad_free_minutes: 60,
    });
    const { client, Wrapper } = buildWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useRedeemInvite(), { wrapper: Wrapper });
    act(() => {
      result.current.mutate("xxxx-yyyy-zzzz");
    });

    await waitFor(() => expect(result.current.data?.lingot_reward).toBe(100));
    expect(social.redeemInvite).toHaveBeenCalledWith("xxxx-yyyy-zzzz");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: SOCIAL_QUERY_KEYS.inviteOffer,
    });
  });
});
