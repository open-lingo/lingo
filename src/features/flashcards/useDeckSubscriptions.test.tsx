/**
 * Test for Fix M8 — useDeckSubscriptions includes userId in its query key
 * so a sign-in switch (user A → user B) does not surface A's subscriptions
 * as B's from cache before the new fetch completes.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Subscription } from "@/shared/api/users";

const mockGetSubscriptions = vi.fn();
const mockGetDecksBatch = vi.fn();

let mockUserId: string | undefined = "user-A";

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: mockUserId ? { sub: mockUserId } : null,
    error: undefined,
    login: () => {},
    signup: () => {},
    logout: () => {},
  }),
}));

vi.mock("@/shared/api", () => ({
  useApi: () => ({
    users: { getSubscriptions: mockGetSubscriptions },
    decks: { getDecksBatch: mockGetDecksBatch },
  }),
}));

// Imports use the mocks above.
import { useDeckSubscriptions } from "./useDeckSubscriptions";

const subsForA: Subscription[] = [
  {
    contentId: "deck-A1",
    contentType: "deck",
    addedAt: "2026-05-01T00:00:00Z",
  } as Subscription,
];
const subsForB: Subscription[] = [
  {
    contentId: "deck-B1",
    contentType: "deck",
    addedAt: "2026-05-15T00:00:00Z",
  } as Subscription,
];

function wrap(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useDeckSubscriptions — Fix M8 user-scoped query key", () => {
  beforeEach(() => {
    mockGetSubscriptions.mockReset();
    mockGetDecksBatch.mockReset();
    mockGetDecksBatch.mockResolvedValue([]);
    mockUserId = "user-A";
  });

  it("keys the subscriptions cache by userId so logout/login doesn't leak entries", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 5 * 60_000 } },
    });

    // User A signs in — getSubscriptions returns A's data, cached under user-A.
    mockGetSubscriptions.mockResolvedValueOnce(subsForA);
    const wrapper = wrap(client);
    const a = renderHook(() => useDeckSubscriptions(), { wrapper });
    await waitFor(() => expect(a.result.current.subscriptions).toHaveLength(1));
    expect(a.result.current.subscriptions[0].contentId).toBe("deck-A1");
    a.unmount();

    // User B signs in. Cache key includes userId so we don't get A's row.
    mockUserId = "user-B";
    mockGetSubscriptions.mockResolvedValueOnce(subsForB);
    const b = renderHook(() => useDeckSubscriptions(), { wrapper });

    // While B's fetch is in flight, the returned subs should NOT be A's row
    // (separate cache slot keyed by userId). It should be empty until B
    // resolves.
    expect(b.result.current.subscriptions.map((s) => s.contentId)).not.toContain("deck-A1");

    await waitFor(() => expect(b.result.current.subscriptions).toHaveLength(1));
    expect(b.result.current.subscriptions[0].contentId).toBe("deck-B1");

    // Confirm two distinct query entries exist under different user keys.
    const queries = client.getQueryCache().findAll({ queryKey: ["users"] });
    const subscriptionKeys = queries
      .map((q) => q.queryKey)
      .filter(
        (k): k is readonly unknown[] =>
          Array.isArray(k) && k.includes("subscriptions"),
      );
    const userIds = new Set(subscriptionKeys.map((k) => k[1]));
    expect(userIds).toEqual(new Set(["user-A", "user-B"]));
  });
});
