/**
 * b19, from the founder: "I close the app on my phone and nothing pushes,
 * and I open a lesson and nothing pushes."
 *
 * Both true. `LessonProgressHydrate` owns a 30s interval that only ticks
 * while the app is foregrounded, and `useLessonSyncSession` only warns on
 * beforeunload — a backgrounded iOS webview is frozen mid-timer, so the last
 * lesson of a session sat on the device until the next cold launch, and
 * coming back to the app never pulled what the other device had done.
 *
 * This hook is the missing pair of triggers: push on the way out, pull on
 * the way back in.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type * as React from "react";
import type { ReactNode } from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { clearTestOutSyncQueue, enqueueTestOutAttempts } from "@/shared/domain/testOutSyncQueue";
import { resetLessonSyncCoalescerForTests } from "./engine/progressSync";
import type { BatchAttemptSubmission } from "@/shared/api/progress";

const mockBatch = vi.fn();
const mockGetMe = vi.fn();

vi.mock("@/shared/api", () => ({
  useApi: () => ({ progress: { getMe: mockGetMe, batchAttempts: mockBatch } }),
}));

import { useAppLifecycleSync } from "./useAppLifecycleSync";

let client: QueryClient;

function wrapper(): (props: { children: ReactNode }) => React.JSX.Element {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function setVisibility(state: "hidden" | "visible"): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
}

function queueOneRow(): void {
  enqueueTestOutAttempts([
    {
      clientAttemptId: "testout-pending-1",
      lessonId: "ja-m1-l1",
      attemptedAt: "2026-09-15T12:00:00.000Z",
      durationSec: 5,
      passed: true,
      score: 1,
      stepResults: [],
      isTestOut: true,
    },
  ]);
}

describe("useAppLifecycleSync", () => {
  beforeEach(() => {
    localStorage.clear();
    clearTestOutSyncQueue();
    resetLessonSyncCoalescerForTests();
    mockBatch.mockReset();
    mockBatch.mockImplementation((payload: BatchAttemptSubmission) =>
      Promise.resolve({
        results: payload.attempts.map((a) => ({
          clientAttemptId: a.clientAttemptId,
          attemptId: `srv-${a.clientAttemptId}`,
          accepted: true,
          xpEarned: 0,
          streakAfter: 0,
          lingotsEarned: 0,
          dailyTotalLessons: 0,
        })),
      }),
    );
    mockGetMe.mockReset();
    mockGetMe.mockResolvedValue(null);
    setVisibility("visible");
  });

  afterEach(() => {
    setVisibility("visible");
  });

  it("pushes buffered rows when the app is backgrounded, with keepalive", async () => {
    queueOneRow();
    renderHook(() => useAppLifecycleSync(), { wrapper: wrapper() });
    // The hook preloads the sync engine on mount so the hide path never has
    // to wait on a dynamic import the process may not survive.
    await act(async () => {
      await import("./engine");
    });

    await act(async () => {
      setVisibility("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });

    await waitFor(() => expect(mockBatch).toHaveBeenCalledTimes(1));
    expect(mockBatch.mock.calls[0][1]).toEqual({ keepalive: true });
    expect(mockBatch.mock.calls[0][0].attempts[0].lessonId).toBe("ja-m1-l1");
  });

  it("also pushes on pagehide (iOS never fires unload)", async () => {
    queueOneRow();
    renderHook(() => useAppLifecycleSync(), { wrapper: wrapper() });

    await act(async () => {
      window.dispatchEvent(new Event("pagehide"));
      await Promise.resolve();
    });

    await waitFor(() => expect(mockBatch).toHaveBeenCalledTimes(1));
  });

  it("does not POST when there is nothing buffered", async () => {
    renderHook(() => useAppLifecycleSync(), { wrapper: wrapper() });
    await act(async () => {
      setVisibility("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it("debounces hide against the 30s tick so the same rows don't double-post", async () => {
    queueOneRow();
    renderHook(() => useAppLifecycleSync(), { wrapper: wrapper() });

    await act(async () => {
      setVisibility("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    await waitFor(() => expect(mockBatch).toHaveBeenCalledTimes(1));

    queueOneRow();
    await act(async () => {
      window.dispatchEvent(new Event("pagehide"));
      await Promise.resolve();
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(mockBatch).toHaveBeenCalledTimes(1);
  });

  it("pulls /progress/me on resume so the other device's progress lands", async () => {
    renderHook(() => useAppLifecycleSync(), { wrapper: wrapper() });
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(async () => {
      setVisibility("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      setVisibility("visible");
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["progress", "me"] });
  });
});
