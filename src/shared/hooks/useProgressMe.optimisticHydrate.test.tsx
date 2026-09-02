/**
 * Option B cold-start fix: hydrate `useProgressMe` from the last persisted
 * `/progress/me` snapshot so `HomePage` doesn't full-page-gate on the
 * network round-trip on every cold launch (a real-auth build otherwise
 * blanks the home screen while paying cold-Lambda latency).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type * as React from "react";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ProgressSummary } from "@/shared/api/progress";
import { readProgressSnapshot, writeProgressSnapshot } from "./progressSnapshotCache";

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

import { useProgressMe } from "./useProgressMe";

function wrapper(): (props: { children: ReactNode }) => React.JSX.Element {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const persisted: ProgressSummary = {
  stats: {
    streak: 3,
    bestStreak: 5,
    lastActiveDate: "2026-08-30",
    xp: 120,
    level: 2,
    lingots: 10,
  },
  lessons: [],
} as unknown as ProgressSummary;

describe("useProgressMe — optimistic hydration from a persisted snapshot", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetMe.mockReset();
  });

  it("reports ready with the persisted summary on first render, before the network resolves", () => {
    writeProgressSnapshot("dev|user-1", persisted);
    // Never resolves within this test — proves the ready state came from the
    // persisted snapshot, not the network round-trip.
    mockGetMe.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useProgressMe(), { wrapper: wrapper() });

    expect(result.current.isProgressReady).toBe(true);
    expect(result.current.summary).toEqual(persisted);
  });

  it("persists a freshly fetched summary for the next cold start", async () => {
    mockGetMe.mockResolvedValue(persisted);

    const { result } = renderHook(() => useProgressMe(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.summary).toEqual(persisted));

    expect(readProgressSnapshot("dev|user-1")?.data).toEqual(persisted);
  });

  it("ignores a persisted snapshot for a different user", () => {
    writeProgressSnapshot("dev|some-other-user", persisted);
    mockGetMe.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useProgressMe(), { wrapper: wrapper() });

    expect(result.current.summary).toBeNull();
    expect(result.current.isProgressReady).toBe(false);
  });
});
