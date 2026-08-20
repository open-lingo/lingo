/**
 * useProgressMe in a bypass build (VITE_NATIVE_AUTH_BYPASS): the shipped iOS
 * demo has no valid Auth0 token, so `/progress/me` can only 401. Firing it
 * blocks the home paint behind a cold-Lambda round-trip (+ retries) for
 * nothing — progress is local-first. When server sync is disabled the query
 * must NOT fire and the hook must report ready immediately so the home
 * screen paints from local progress.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type * as React from "react";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockGetMe = vi.fn();

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { sub: "dev|user-1" },
    error: undefined,
    login: () => {},
    signup: () => {},
    logout: () => {},
  }),
}));

vi.mock("@/shared/api", () => ({
  useApi: () => ({
    progress: { getMe: mockGetMe },
  }),
}));

// The lever under test: a bypass build has no server sync.
vi.mock("@/shared/auth/bypass", () => ({
  SERVER_SYNC_ENABLED: false,
}));

import { useProgressMe } from "./useProgressMe";

function wrapper(): (props: { children: ReactNode }) => React.JSX.Element {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useProgressMe — bypass build (no server sync)", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetMe.mockReset();
  });

  it("does not fetch and reports ready immediately", async () => {
    const { result } = renderHook(() => useProgressMe(), { wrapper: wrapper() });

    // Ready without any network — home paints from local-first progress.
    expect(result.current.isProgressReady).toBe(true);
    expect(result.current.isLoading).toBe(false);

    // Give any stray query a tick to (not) fire.
    await waitFor(() => expect(result.current.isProgressReady).toBe(true));
    expect(mockGetMe).not.toHaveBeenCalled();
  });
});
