import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAdFreeStatus } from "./useAdFreeStatus";
import {
  AD_FREE_STORAGE_KEY,
  AD_FREE_TICK_MS,
} from "./config";

const FIXED_NOW = 1_700_000_000_000; // arbitrary fixed epoch ms

describe("useAdFreeStatus", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Only fake the bits we need — leaving microtasks/promises alone
    // so React act() can still flush state updates in tests that don't
    // advance time.
    vi.useFakeTimers({
      toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"],
    });
    vi.setSystemTime(new Date(FIXED_NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("returns isActive=false when there is no stored timestamp", () => {
    const { result } = renderHook(() => useAdFreeStatus());
    expect(result.current.isActive).toBe(false);
    expect(result.current.until).toBeNull();
    expect(result.current.remainingMs).toBe(0);
  });

  it("returns isActive=false when the stored timestamp is in the past", () => {
    window.localStorage.setItem(
      AD_FREE_STORAGE_KEY,
      String(FIXED_NOW - 1_000),
    );
    const { result } = renderHook(() => useAdFreeStatus());
    expect(result.current.isActive).toBe(false);
    expect(result.current.until).toBeNull();
  });

  it("returns isActive=true with remainingMs when the timestamp is in the future", () => {
    const FUTURE = FIXED_NOW + 60 * 60 * 1000; // +1h
    window.localStorage.setItem(AD_FREE_STORAGE_KEY, String(FUTURE));
    const { result } = renderHook(() => useAdFreeStatus());
    expect(result.current.isActive).toBe(true);
    expect(result.current.until).toBe(FUTURE);
    expect(result.current.remainingMs).toBe(60 * 60 * 1000);
  });

  it("updates remainingMs after the interval tick", () => {
    const FUTURE = FIXED_NOW + 60 * 60 * 1000;
    window.localStorage.setItem(AD_FREE_STORAGE_KEY, String(FUTURE));
    const { result } = renderHook(() => useAdFreeStatus());
    const initial = result.current.remainingMs;

    // Advance time + flush the 30s interval. advanceTimersByTime
    // moves Date.now() and fires the interval callback.
    act(() => {
      vi.advanceTimersByTime(AD_FREE_TICK_MS);
    });

    expect(result.current.remainingMs).toBeLessThan(initial);
    expect(result.current.remainingMs).toBe(60 * 60 * 1000 - AD_FREE_TICK_MS);
  });

  it("flips to isActive=false once the deadline passes", () => {
    const FUTURE = FIXED_NOW + 10_000;
    window.localStorage.setItem(AD_FREE_STORAGE_KEY, String(FUTURE));
    const { result } = renderHook(() => useAdFreeStatus());
    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(AD_FREE_TICK_MS + 1);
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.remainingMs).toBe(0);
  });
});
