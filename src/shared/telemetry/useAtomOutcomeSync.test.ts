/**
 * `useAtomOutcomeSync` — the one place that wires `atomOutcome.ts`'s
 * transport-agnostic engine to the authenticated `telemetryOutcomes` API
 * client, mirroring `useLessonSyncSession.test.ts`'s mocking style.
 *
 * This test mocks a @/shared/** module (`@/shared/api`) — per lane
 * doctrine (2026-09-18 isolate:false leak class), verify with:
 *   npx vitest run --project app --maxWorkers=1 src/shared/telemetry/useAtomOutcomeSync.test.ts
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const sendBatch = vi.fn().mockResolvedValue({ accepted: 1 });

vi.mock("@/shared/api", () => ({
  useApi: () => ({
    telemetryOutcomes: { sendBatch },
  }),
}));

import { useAtomOutcomeSync } from "./useAtomOutcomeSync";
import {
  recordAtomOutcome,
  getQueuedAtomOutcomeCount,
  __resetAtomOutcomeStateForTest,
  type AtomOutcomeEvent,
} from "./atomOutcome";
import * as featureFlagsModule from "@/shared/config/featureFlags";

function event(): AtomOutcomeEvent {
  return {
    lang: "ja",
    lessonId: "ja-m12-neo-3",
    stepIndex: 0,
    stepType: "build_sentence",
    atomIds: ["ja:vocab:taberu"],
    correct: true,
    msToAnswer: 2000,
    attempt: 1,
    srcSurface: "lesson",
  };
}

describe("useAtomOutcomeSync", () => {
  let flagSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetAtomOutcomeStateForTest();
    sendBatch.mockClear();
    flagSpy = vi
      .spyOn(featureFlagsModule, "getCachedFeatureFlags")
      .mockReturnValue({
        ...featureFlagsModule.DEFAULT_FEATURE_FLAGS,
        telemetry: { atomOutcomes: true },
      });
  });
  afterEach(() => {
    flagSpy.mockRestore();
    __resetAtomOutcomeStateForTest();
  });

  it("registers a sender that drains anything already queued on mount", async () => {
    recordAtomOutcome(event());
    expect(getQueuedAtomOutcomeCount()).toBe(1);
    renderHook(() => useAtomOutcomeSync());
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(sendBatch).toHaveBeenCalledTimes(1);
    expect(getQueuedAtomOutcomeCount()).toBe(0);
  });

  it("unmount flushes any still-buffered events with keepalive", async () => {
    const { unmount } = renderHook(() => useAtomOutcomeSync());
    recordAtomOutcome(event());
    unmount();
    await Promise.resolve();
    await Promise.resolve();
    expect(sendBatch).toHaveBeenCalledWith(expect.any(Array), { keepalive: true });
  });

  it("a hidden visibilitychange triggers a keepalive flush", async () => {
    renderHook(() => useAtomOutcomeSync());
    recordAtomOutcome(event());
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
    await Promise.resolve();
    expect(sendBatch).toHaveBeenCalledWith(expect.any(Array), { keepalive: true });
  });
});
