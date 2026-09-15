/**
 * Cross-step audio currentness guard (TestFlight #127, 2026-09-15).
 *
 * `PlacementTestPage.tsx`'s own fix only narrows the race (stops whatever
 * was ALREADY playing once the next item mounts); it can't reach a tap
 * whose network fetch is still in flight when the step changes. This is
 * the fix that closes it: capture the step id at tap time, and no-op
 * (plus a defensive `stopAllAudio()`) if a DIFFERENT step is current by
 * the time the clip resolves. `playJaAudio` / `playJaAudioToEnd` are
 * mocked with a manually-resolvable ("delayed") promise so the test can
 * advance the "current step" WHILE the fetch is still pending — exactly
 * the window the bug lived in.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import {
  useCurrentStepId,
  isStepStillCurrent,
  playStepAudio,
  playStepAudioToEnd,
} from "./useStepAudioGuard";

const playJaAudioMock = vi.fn();
const playJaAudioToEndMock = vi.fn();
const stopAllAudioMock = vi.fn();
vi.mock("@/shared/tts", () => ({
  playJaAudio: (...args: unknown[]) => playJaAudioMock(...args),
  playJaAudioToEnd: (...args: unknown[]) => playJaAudioToEndMock(...args),
  stopAllAudio: (...args: unknown[]) => stopAllAudioMock(...args),
}));

/** A promise the test can resolve on its own schedule — stands in for the
 *  network fetch + decode a cold TTS clip goes through. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useCurrentStepId / isStepStillCurrent", () => {
  it("a mounted step id is current; a step that never mounted is not", () => {
    renderHook(() => useCurrentStepId("step-a"));
    expect(isStepStillCurrent("step-a")).toBe(true);
    expect(isStepStillCurrent("step-b")).toBe(false);
  });

  it("mounting a NEW step id supersedes the old one — simulates the real remount (key={step.id})", () => {
    const first = renderHook(() => useCurrentStepId("step-a"));
    expect(isStepStillCurrent("step-a")).toBe(true);
    // LessonPage/PlacementTestPage render <StepRenderer key={step.id}> —
    // a step change is a full unmount + a fresh mount, not an update.
    first.unmount();
    renderHook(() => useCurrentStepId("step-b"));
    expect(isStepStillCurrent("step-a")).toBe(false);
    expect(isStepStillCurrent("step-b")).toBe(true);
  });
});

describe("playStepAudio (listen-build play button / PromptAudioButton callers)", () => {
  it("resolves normally when the step hasn't changed", async () => {
    const { promise, resolve } = deferred<"clip">();
    playJaAudioMock.mockReturnValue(promise);
    renderHook(() => useCurrentStepId("step-a"));

    const call = playStepAudio("こんにちは", "step-a");
    resolve("clip");
    await expect(call).resolves.toBe("clip");
    expect(stopAllAudioMock).not.toHaveBeenCalled();
  });

  it("no-ops and cuts the clip when the step changed while the fetch was in flight", async () => {
    const { promise, resolve } = deferred<"clip">();
    playJaAudioMock.mockReturnValue(promise);
    const first = renderHook(() => useCurrentStepId("step-a"));

    // Tap fires while step-a is on screen — the fetch is still pending.
    const call = playStepAudio("こんにちは", "step-a");

    // The step advances mid-flight: step-a unmounts, step-b mounts.
    first.unmount();
    renderHook(() => useCurrentStepId("step-b"));

    // NOW the fetch finally resolves — playBuffer would have just fired
    // inside the real playJaAudio.
    resolve("clip");
    await expect(call).resolves.toBeNull();
    expect(stopAllAudioMock).toHaveBeenCalledTimes(1);
  });
});

describe("playStepAudioToEnd (dialogue lines)", () => {
  it("resolves true and never stops when the step is still current", async () => {
    const { promise, resolve } = deferred<void>();
    playJaAudioToEndMock.mockReturnValue(promise);
    renderHook(() => useCurrentStepId("step-a"));

    const call = playStepAudioToEnd("いこう？", "step-a");
    resolve(undefined);
    await expect(call).resolves.toBe(true);
    expect(stopAllAudioMock).not.toHaveBeenCalled();
  });

  it("resolves false and stops when the step changed before the clip finished", async () => {
    const { promise, resolve } = deferred<void>();
    playJaAudioToEndMock.mockReturnValue(promise);
    const first = renderHook(() => useCurrentStepId("step-a"));

    const call = playStepAudioToEnd("いこう？", "step-a");
    first.unmount();
    renderHook(() => useCurrentStepId("step-b"));
    resolve(undefined);

    await expect(call).resolves.toBe(false);
    expect(stopAllAudioMock).toHaveBeenCalledTimes(1);
  });
});
