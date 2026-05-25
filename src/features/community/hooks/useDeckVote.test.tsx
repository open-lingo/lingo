/**
 * useDeckVote tests — focus on the optimistic-update + rollback contract.
 * The query path is incidental; what matters is that a click flips the
 * UI immediately, an error rolls back, and an unauthenticated click
 * triggers login instead of a mutation.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockGet = vi.fn();
const mockVote = vi.fn();
const mockUnvote = vi.fn();
const mockLogin = vi.fn();

let authed = true;

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({
    decks: {
      getDeckVoteState: mockGet,
      voteOnDeck: mockVote,
      removeDeckVote: mockUnvote,
    },
  }),
}));

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: authed,
    isLoading: false,
    user: { sub: "auth0|viewer" },
    error: undefined,
    login: mockLogin,
    signup: () => {},
    logout: () => {},
  }),
}));

import { useDeckVote } from "./useDeckVote";

function wrap() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useDeckVote", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockVote.mockReset();
    mockUnvote.mockReset();
    mockLogin.mockReset();
    authed = true;
  });

  it("optimistically flips voted=true on toggle and lands the count", async () => {
    mockGet.mockResolvedValue({ count: 4, voted: false });
    // Resolve the mutation slowly so we have a window to observe the
    // optimistic value before the server response settles.
    let resolveVote: (v: { count: number; voted: boolean }) => void = () => {};
    mockVote.mockReturnValue(
      new Promise<{ count: number; voted: boolean }>((resolve) => {
        resolveVote = resolve;
      }),
    );
    const { result } = renderHook(() => useDeckVote("deck-1"), { wrapper: wrap() });

    await waitFor(() => expect(result.current.count).toBe(4));
    expect(result.current.voted).toBe(false);

    await act(async () => {
      result.current.toggle();
    });

    // Optimistic snap to voted=true, count + 1.
    await waitFor(() => expect(result.current.voted).toBe(true));
    expect(result.current.count).toBe(5);
    expect(mockVote).toHaveBeenCalledWith("deck-1");

    // Let the mutation resolve so cleanup doesn't fire on a pending promise.
    await act(async () => {
      resolveVote({ count: 5, voted: true });
    });
  });

  it("rolls back on mutation error", async () => {
    mockGet.mockResolvedValue({ count: 2, voted: false });
    let rejectVote: (reason: unknown) => void = () => {};
    mockVote.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectVote = reject;
      }),
    );
    const { result } = renderHook(() => useDeckVote("deck-2"), { wrapper: wrap() });

    await waitFor(() => expect(result.current.count).toBe(2));

    await act(async () => {
      result.current.toggle();
    });
    // Optimistic flip lands before the mutation resolves.
    await waitFor(() => expect(result.current.voted).toBe(true));
    expect(result.current.count).toBe(3);

    // Reject the mutation. The cache should roll back to the snapshot.
    await act(async () => {
      rejectVote(new Error("boom"));
    });
    await waitFor(() => expect(result.current.voted).toBe(false));
    expect(result.current.count).toBe(2);
  });

  it("triggers login instead of mutating when unauthenticated", async () => {
    authed = false;
    mockGet.mockResolvedValue({ count: 0, voted: false });
    const { result } = renderHook(() => useDeckVote("deck-3"), { wrapper: wrap() });
    await waitFor(() => expect(result.current.count).toBe(0));

    act(() => {
      result.current.toggle();
    });
    expect(mockLogin).toHaveBeenCalled();
    expect(mockVote).not.toHaveBeenCalled();
  });
});
