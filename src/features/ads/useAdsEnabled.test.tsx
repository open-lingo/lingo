import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, cleanup, act } from "@testing-library/react";
import { useAdsEnabled } from "./useAdsEnabled";
import { saveCookieConsent, clearCookieConsent } from "@/shared/legal/cookieConsent";
import { AD_FREE_CHANGE_EVENT, AD_FREE_STORAGE_KEY } from "./adFree";

const NOW = 1_700_000_000_000;
let nowSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
  localStorage.clear();
  nowSpy = vi.spyOn(Date, "now").mockReturnValue(NOW);
  vi.stubEnv("VITE_ADSENSE_CLIENT", "ca-pub-test");
  vi.stubEnv("VITE_ADSENSE_ENABLED", "true");
});

afterEach(() => {
  cleanup();
  clearCookieConsent();
  localStorage.clear();
  vi.unstubAllEnvs();
  nowSpy?.mockRestore();
});

describe("useAdsEnabled + ad-free integration", () => {
  it("returns false when no advertising consent", () => {
    const { result } = renderHook(() => useAdsEnabled(false));
    expect(result.current).toBe(false);
  });

  it("returns true when consent is granted and ad-free is inactive", () => {
    const { result } = renderHook(() => useAdsEnabled(false));
    act(() => {
      saveCookieConsent(true);
    });
    expect(result.current).toBe(true);
  });

  it("returns false when an ad-free window is active, even with consent", () => {
    const { result } = renderHook(() => useAdsEnabled(false));
    act(() => {
      saveCookieConsent(true);
    });
    expect(result.current).toBe(true);

    const future = NOW + 60_000;
    act(() => {
      localStorage.setItem(AD_FREE_STORAGE_KEY, String(future));
      window.dispatchEvent(new CustomEvent(AD_FREE_CHANGE_EVENT));
    });
    expect(result.current).toBe(false);
  });

  it("returns false when premiumActive is passed in", () => {
    const { result } = renderHook(() => useAdsEnabled(true));
    act(() => {
      saveCookieConsent(true);
    });
    expect(result.current).toBe(false);
  });
});
