import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  recordAtomOutcome,
  flushAtomOutcomes,
  registerAtomOutcomeSender,
  unregisterAtomOutcomeSender,
  getQueuedAtomOutcomeCount,
  __resetAtomOutcomeStateForTest,
  MAX_BATCH_EVENTS,
  FLUSH_INTERVAL_MS,
  type AtomOutcomeEvent,
  type SendAtomOutcomesFn,
} from "./atomOutcome";
import * as featureFlagsModule from "@/shared/config/featureFlags";

// This test mocks a @/shared/** module (featureFlags) — per lane doctrine
// (2026-09-18 isolate:false leak class), verify with:
//   npx vitest run --project app --maxWorkers=1 src/shared/telemetry/atomOutcome.test.ts
vi.mock("@/shared/config/featureFlags", async () => {
  const actual = await vi.importActual<typeof featureFlagsModule>(
    "@/shared/config/featureFlags",
  );
  return {
    ...actual,
    getCachedFeatureFlags: vi.fn(() => actual.DEFAULT_FEATURE_FLAGS),
  };
});

const mockedGetCachedFeatureFlags = vi.mocked(featureFlagsModule.getCachedFeatureFlags);

function withFlagOn<T>(fn: () => T): T {
  mockedGetCachedFeatureFlags.mockReturnValue({
    ...featureFlagsModule.DEFAULT_FEATURE_FLAGS,
    telemetry: { atomOutcomes: true },
  });
  return fn();
}

function withFlagOff<T>(fn: () => T): T {
  mockedGetCachedFeatureFlags.mockReturnValue(featureFlagsModule.DEFAULT_FEATURE_FLAGS);
  return fn();
}

function event(overrides: Partial<AtomOutcomeEvent> = {}): AtomOutcomeEvent {
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
    buildNumber: "29",
    ...overrides,
  };
}

describe("atomOutcome — flag off = zero requests", () => {
  beforeEach(() => {
    __resetAtomOutcomeStateForTest();
    withFlagOff(() => {});
  });
  afterEach(() => {
    __resetAtomOutcomeStateForTest();
    vi.useRealTimers();
  });

  it("recordAtomOutcome never queues anything while the flag is off", () => {
    withFlagOff(() => {
      recordAtomOutcome(event());
      recordAtomOutcome(event());
      expect(getQueuedAtomOutcomeCount()).toBe(0);
    });
  });

  it("never calls the registered sender while the flag is off", async () => {
    const send = vi.fn<SendAtomOutcomesFn>().mockResolvedValue({ ok: true, status: 202 });
    registerAtomOutcomeSender(send);
    withFlagOff(() => {
      for (let i = 0; i < MAX_BATCH_EVENTS + 5; i++) recordAtomOutcome(event());
    });
    await flushAtomOutcomes();
    expect(send).not.toHaveBeenCalled();
  });
});

describe("atomOutcome — batching (flag on)", () => {
  beforeEach(() => {
    __resetAtomOutcomeStateForTest();
  });
  afterEach(() => {
    __resetAtomOutcomeStateForTest();
    vi.useRealTimers();
  });

  it("buffers events without sending until the batch or timer trigger fires", () => {
    const send = vi.fn<SendAtomOutcomesFn>().mockResolvedValue({ ok: true, status: 202 });
    registerAtomOutcomeSender(send);
    withFlagOn(() => recordAtomOutcome(event()));
    expect(getQueuedAtomOutcomeCount()).toBe(1);
    expect(send).not.toHaveBeenCalled();
  });

  it("flushes automatically once the buffer reaches MAX_BATCH_EVENTS", async () => {
    const send = vi.fn<SendAtomOutcomesFn>().mockResolvedValue({ ok: true, status: 202 });
    registerAtomOutcomeSender(send);
    withFlagOn(() => {
      for (let i = 0; i < MAX_BATCH_EVENTS; i++) recordAtomOutcome(event({ stepIndex: i }));
    });
    // The size trigger schedules a microtask send.
    await Promise.resolve();
    await Promise.resolve();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toHaveLength(MAX_BATCH_EVENTS);
    expect(getQueuedAtomOutcomeCount()).toBe(0);
  });

  it("flushes on the 30s timer even with a batch far under the size trigger", async () => {
    vi.useFakeTimers();
    const send = vi.fn<SendAtomOutcomesFn>().mockResolvedValue({ ok: true, status: 202 });
    registerAtomOutcomeSender(send);
    withFlagOn(() => recordAtomOutcome(event()));
    expect(send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(FLUSH_INTERVAL_MS);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toHaveLength(1);
  });

  it("flushAtomOutcomes() sends immediately (lesson-end path)", async () => {
    const send = vi.fn<SendAtomOutcomesFn>().mockResolvedValue({ ok: true, status: 202 });
    registerAtomOutcomeSender(send);
    withFlagOn(() => recordAtomOutcome(event()));
    await flushAtomOutcomes();
    expect(send).toHaveBeenCalledTimes(1);
    expect(getQueuedAtomOutcomeCount()).toBe(0);
  });

  it("chunks a queue larger than MAX_BATCH_EVENTS into multiple sends", async () => {
    const send = vi.fn<SendAtomOutcomesFn>().mockResolvedValue({ ok: true, status: 202 });
    registerAtomOutcomeSender(send);
    // Stay under the size trigger by registering the sender only after
    // buffering, so nothing auto-flushes mid-loop.
    unregisterAtomOutcomeSender();
    withFlagOn(() => {
      for (let i = 0; i < MAX_BATCH_EVENTS + 10; i++) recordAtomOutcome(event({ stepIndex: i }));
    });
    registerAtomOutcomeSender(send);
    await flushAtomOutcomes();
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0]).toHaveLength(MAX_BATCH_EVENTS);
    expect(send.mock.calls[1][0]).toHaveLength(10);
  });

  it("flushAtomOutcomes with no registered sender is a safe no-op", async () => {
    withFlagOn(() => recordAtomOutcome(event()));
    await expect(flushAtomOutcomes()).resolves.toBeUndefined();
    // Still queued — never silently dropped just because no sender exists yet.
    expect(getQueuedAtomOutcomeCount()).toBe(1);
  });
});

describe("atomOutcome — failure handling", () => {
  beforeEach(() => {
    __resetAtomOutcomeStateForTest();
  });
  afterEach(() => {
    __resetAtomOutcomeStateForTest();
    vi.useRealTimers();
  });

  it("keeps events queued on a 5xx and backs off (no immediate re-send)", async () => {
    const send = vi
      .fn<SendAtomOutcomesFn>()
      .mockResolvedValue({ ok: false, status: 500 });
    registerAtomOutcomeSender(send);
    withFlagOn(() => recordAtomOutcome(event()));
    await flushAtomOutcomes();
    expect(getQueuedAtomOutcomeCount()).toBe(1);
    // A second flush during backoff must not call send again.
    await flushAtomOutcomes();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("keeps events queued on a network error (status 0)", async () => {
    const send = vi.fn<SendAtomOutcomesFn>().mockRejectedValue(new Error("offline"));
    registerAtomOutcomeSender(send);
    withFlagOn(() => recordAtomOutcome(event()));
    await flushAtomOutcomes();
    expect(getQueuedAtomOutcomeCount()).toBe(1);
  });

  it("drops a non-retryable 4xx chunk instead of retrying it forever", async () => {
    const send = vi.fn<SendAtomOutcomesFn>().mockResolvedValue({ ok: false, status: 422 });
    registerAtomOutcomeSender(send);
    withFlagOn(() => recordAtomOutcome(event()));
    await flushAtomOutcomes();
    expect(getQueuedAtomOutcomeCount()).toBe(0);
  });

  it("a keepalive (background) flush drops a failed chunk rather than retrying it", async () => {
    const send = vi.fn<SendAtomOutcomesFn>().mockResolvedValue({ ok: false, status: 500 });
    registerAtomOutcomeSender(send);
    withFlagOn(() => recordAtomOutcome(event()));
    await flushAtomOutcomes({ keepalive: true });
    expect(send).toHaveBeenCalledWith(expect.any(Array), { keepalive: true });
    expect(getQueuedAtomOutcomeCount()).toBe(0);
  });
});

describe("atomOutcome — register/unregister", () => {
  beforeEach(() => {
    __resetAtomOutcomeStateForTest();
  });
  afterEach(() => {
    __resetAtomOutcomeStateForTest();
  });

  it("unregisterAtomOutcomeSender stops future flushes from sending", async () => {
    const send = vi.fn<SendAtomOutcomesFn>().mockResolvedValue({ ok: true, status: 202 });
    registerAtomOutcomeSender(send);
    unregisterAtomOutcomeSender();
    withFlagOn(() => recordAtomOutcome(event()));
    await flushAtomOutcomes();
    expect(send).not.toHaveBeenCalled();
    expect(getQueuedAtomOutcomeCount()).toBe(1);
  });

  it("registering a sender while events are already queued flushes them", async () => {
    withFlagOn(() => recordAtomOutcome(event()));
    expect(getQueuedAtomOutcomeCount()).toBe(1);
    const send = vi.fn<SendAtomOutcomesFn>().mockResolvedValue({ ok: true, status: 202 });
    registerAtomOutcomeSender(send);
    await Promise.resolve();
    await Promise.resolve();
    expect(send).toHaveBeenCalledTimes(1);
  });
});
