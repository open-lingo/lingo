import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, cleanup, act } from "@testing-library/react";
import {
  AD_FREE_CHANGE_EVENT,
  AD_FREE_STORAGE_KEY,
  readAdFreeStatus,
  useAdFreeStatus,
} from "./adFree";

const NOW = 1_700_000_000_000;
let nowSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
  localStorage.clear();
  nowSpy = vi.spyOn(Date, "now").mockReturnValue(NOW);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  nowSpy?.mockRestore();
});

describe("readAdFreeStatus", () => {
  it("reports inactive when nothing is stored", () => {
    expect(readAdFreeStatus()).toEqual({ isActive: false, until: null });
  });

  it("reports inactive when the stored timestamp is in the past", () => {
    const past = NOW - 60_000;
    localStorage.setItem(AD_FREE_STORAGE_KEY, String(past));
    expect(readAdFreeStatus()).toEqual({ isActive: false, until: past });
  });

  it("reports active when the stored timestamp is in the future", () => {
    const future = NOW + 60_000;
    localStorage.setItem(AD_FREE_STORAGE_KEY, String(future));
    expect(readAdFreeStatus()).toEqual({ isActive: true, until: future });
  });

  it("ignores non-numeric garbage and reports inactive", () => {
    localStorage.setItem(AD_FREE_STORAGE_KEY, "not-a-number");
    expect(readAdFreeStatus()).toEqual({ isActive: false, until: null });
  });
});

describe("useAdFreeStatus", () => {
  it("re-reads when the ad-free change event fires", () => {
    const { result } = renderHook(() => useAdFreeStatus());
    expect(result.current.isActive).toBe(false);

    const future = NOW + 60_000;
    act(() => {
      localStorage.setItem(AD_FREE_STORAGE_KEY, String(future));
      window.dispatchEvent(new CustomEvent(AD_FREE_CHANGE_EVENT));
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.until).toBe(future);
  });
});
