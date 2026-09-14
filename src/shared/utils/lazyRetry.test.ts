/**
 * prod #86 (2026-09-14): a tab left open across two deploys burned its
 * one automatic chunk-reload on the FIRST deploy and never got another
 * one, so the second deploy's "failed to fetch dynamically imported
 * module" went straight to the error boundary. The reload guard is now
 * keyed on `__LINGO_BUILD_ID__` — these tests cover the four cases that
 * matter: succeed-after-retry, first failure-for-this-build reloads,
 * a repeat failure for the SAME build does not reload again, and a
 * failure carrying a flag from a DIFFERENT (older) build reloads again.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHUNK_RELOAD_FLAG, loadChunkWithRetry } from "./lazyRetry";

function mockReload(): ReturnType<typeof vi.fn> {
  const reload = vi.fn();
  vi.stubGlobal("location", { ...window.location, reload });
  return reload;
}

function flakyFactory(failCount: number): () => Promise<{ default: string }> {
  let calls = 0;
  return vi.fn(async (): Promise<{ default: string }> => {
    calls++;
    if (calls <= failCount) throw new Error(`chunk load failed (attempt ${calls})`);
    return { default: "ok" };
  });
}

async function settle<T>(promise: Promise<T>): Promise<T | unknown> {
  const result = promise.then(
    (v) => v,
    (e) => e,
  );
  await vi.runAllTimersAsync();
  return result;
}

describe("loadChunkWithRetry (prod #86 — build-keyed chunk reload)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("resolves after 2 failures without reloading", async () => {
    const reload = mockReload();
    const factory = flakyFactory(2);

    const result = await settle(loadChunkWithRetry(factory));

    expect(result).toEqual({ default: "ok" });
    expect(factory).toHaveBeenCalledTimes(3);
    expect(reload).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(CHUNK_RELOAD_FLAG)).toBeNull();
  });

  it("reloads once, flagged with the build id, on 3 failures with no prior flag", async () => {
    const reload = mockReload();
    const factory = flakyFactory(Infinity);

    const result = await settle(loadChunkWithRetry(factory));

    expect(result).toBeInstanceOf(Error);
    expect(factory).toHaveBeenCalledTimes(3);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(CHUNK_RELOAD_FLAG)).toBe(__LINGO_BUILD_ID__);
  });

  it("does not reload again when the flag already equals the current build id", async () => {
    sessionStorage.setItem(CHUNK_RELOAD_FLAG, __LINGO_BUILD_ID__);
    const reload = mockReload();
    const factory = flakyFactory(Infinity);

    const result = await settle(loadChunkWithRetry(factory));

    expect(result).toBeInstanceOf(Error);
    expect(factory).toHaveBeenCalledTimes(3);
    expect(reload).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(CHUNK_RELOAD_FLAG)).toBe(__LINGO_BUILD_ID__);
  });

  it("reloads again when the flag is from a different build id", async () => {
    sessionStorage.setItem(CHUNK_RELOAD_FLAG, "some-older-build-sha");
    const reload = mockReload();
    const factory = flakyFactory(Infinity);

    const result = await settle(loadChunkWithRetry(factory));

    expect(result).toBeInstanceOf(Error);
    expect(factory).toHaveBeenCalledTimes(3);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(CHUNK_RELOAD_FLAG)).toBe(__LINGO_BUILD_ID__);
  });
});
