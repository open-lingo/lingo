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
import { enqueueBulkOp, resetBulkQueueForTests } from "@/shared/domain/testOutSyncQueue";
import { resetLessonSyncCoalescerForTests } from "./engine/progressSync";
import type { BulkCompleteSubmission } from "@/shared/api/progress";

const mockBatch = vi.fn();
const mockBulkComplete = vi.fn();
const mockGetMe = vi.fn();

vi.mock("@/shared/api", () => ({
  useApi: () => ({ progress: { getMe: mockGetMe, batchAttempts: mockBatch, bulkComplete: mockBulkComplete } }),
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
  enqueueBulkOp({
    clientOpId: "testout-pending-1",
    lang: "ja",
    source: "test_out",
    lessonIds: ["ja-m1-l1"],
    completedAt: "2026-09-15T12:00:00.000Z",
  });
}

describe("useAppLifecycleSync", () => {
  beforeEach(() => {
    localStorage.clear();
    resetBulkQueueForTests();
    resetLessonSyncCoalescerForTests();
    mockBulkComplete.mockReset();
    mockBulkComplete.mockImplementation((payload: BulkCompleteSubmission) =>
      Promise.resolve({ accepted: payload.lessonIds.length, alreadyComplete: 0, total: payload.lessonIds.length }),
    );
    mockBatch.mockReset();
    mockBatch.mockImplementation((payload: { attempts: { clientAttemptId: string }[] }) =>
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

  it("pushes buffered rows when the app is backgrounded", async () => {
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

    await waitFor(() => expect(mockBulkComplete).toHaveBeenCalledTimes(1));
    expect(mockBulkComplete.mock.calls[0][0].lessonIds).toEqual(["ja-m1-l1"]);
  });

  it("also pushes on pagehide (iOS never fires unload)", async () => {
    queueOneRow();
    renderHook(() => useAppLifecycleSync(), { wrapper: wrapper() });

    await act(async () => {
      window.dispatchEvent(new Event("pagehide"));
      await Promise.resolve();
    });

    await waitFor(() => expect(mockBulkComplete).toHaveBeenCalledTimes(1));
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
    expect(mockBulkComplete).not.toHaveBeenCalled();
  });

  it("debounces hide against the 30s tick so the same rows don't double-post", async () => {
    queueOneRow();
    renderHook(() => useAppLifecycleSync(), { wrapper: wrapper() });

    await act(async () => {
      setVisibility("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    await waitFor(() => expect(mockBulkComplete).toHaveBeenCalledTimes(1));

    queueOneRow();
    await act(async () => {
      window.dispatchEvent(new Event("pagehide"));
      await Promise.resolve();
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(mockBulkComplete).toHaveBeenCalledTimes(1);
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

/**
 * The native half. `visibilitychange` is not reliable in a backgrounded
 * WKWebView — the signal that is reliable is Capacitor's `appStateChange`,
 * and it only exists if `@capacitor/app` is both installed AND synced into
 * the iOS project (`ios/App/CapApp-SPM/Package.swift` carries CapacitorApp,
 * so it is). This pins that the listener is actually registered on native
 * and that both directions are wired.
 */
describe("useAppLifecycleSync — native (Capacitor) lifecycle", () => {
  it("registers appStateChange and flushes on background, pulls on foreground", async () => {
    vi.resetModules();
    localStorage.clear();
    resetBulkQueueForTests();
    resetLessonSyncCoalescerForTests();

    let handler: ((s: { isActive: boolean }) => void) | undefined;
    const remove = vi.fn();
    vi.doMock("@/shared/platform/native", () => ({ IS_NATIVE: true }));
    vi.doMock("@capacitor/app", () => ({
      App: {
        addListener: vi.fn((event: string, cb: (s: { isActive: boolean }) => void) => {
          if (event === "appStateChange") handler = cb;
          return Promise.resolve({ remove });
        }),
      },
    }));

    const { useAppLifecycleSync: hook } = await import("./useAppLifecycleSync");
    queueOneRow();
    renderHook(() => hook(), { wrapper: wrapper() });
    await act(async () => {
      await import("./engine");
    });
    await waitFor(() => expect(handler).toBeTypeOf("function"));

    const invalidate = vi.spyOn(client, "invalidateQueries");
    await act(async () => {
      handler!({ isActive: false });
      await Promise.resolve();
    });
    await waitFor(() => expect(mockBulkComplete).toHaveBeenCalledTimes(1));

    await act(async () => {
      handler!({ isActive: true });
      await Promise.resolve();
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["progress", "me"] });

    vi.doUnmock("@capacitor/app");
    vi.doUnmock("@/shared/platform/native");
  });
});
