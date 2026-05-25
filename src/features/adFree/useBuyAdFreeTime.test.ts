import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  AD_FREE_PURCHASES_STORAGE_KEY,
  AD_FREE_STORAGE_KEY,
  AD_FREE_SKUS,
  LINGOT_EVENTS_STORAGE_KEY,
} from "./config";
import type { LingotEvent } from "./storage";

const NOW = 1_700_000_000_000;

const mockPurchaseShopItem = vi.fn();
const mockInvalidateShop = vi.fn();
let mockLingots = 1000;
let mockReady = true;

vi.mock("@/shared/api", () => ({
  useApi: () => ({
    progress: {
      purchaseShopItem: (id: string) => mockPurchaseShopItem(id),
    },
  }),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, msg: string) {
      super(msg);
      this.status = status;
    }
  },
}));

vi.mock("@/shared/api/client", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, msg: string) {
      super(msg);
      this.status = status;
    }
  },
}));

vi.mock("@/shared/hooks/useUserStats", () => ({
  useUserStats: () => ({
    stats: {
      streak: 0,
      bestStreak: 0,
      lastActiveDate: null,
      xp: 0,
      level: 1,
      lingots: mockLingots,
    },
    isReady: mockReady,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/features/shop/useShopState", () => ({
  useInvalidateShopQueries: () => mockInvalidateShop,
}));

// Imports use the mocks above — must come after vi.mock calls.
import { useBuyAdFreeTime } from "./useBuyAdFreeTime";

function setLingotEvents(events: LingotEvent[]) {
  window.localStorage.setItem(
    LINGOT_EVENTS_STORAGE_KEY,
    JSON.stringify(events),
  );
}

describe("useBuyAdFreeTime", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Pin Date.now() without enabling fake timers — we don't need to
    // advance the clock, and fake timers + async/await deadlocks
    // inside React's act() under happy-dom.
    vi.setSystemTime(new Date(NOW));
    mockPurchaseShopItem.mockReset();
    mockPurchaseShopItem.mockResolvedValue({
      itemId: "ad-free-30m",
      price: 50,
      lingotsRemaining: 950,
      owned: true,
      quantity: 1,
    });
    mockInvalidateShop.mockReset();
    mockLingots = 1000;
    mockReady = true;
  });

  afterEach(() => {
    vi.useRealTimers(); // also resets setSystemTime
    window.localStorage.clear();
  });

  it("buys 30m ad-free and sets the timestamp", async () => {
    const { result } = renderHook(() => useBuyAdFreeTime());
    let res;
    await act(async () => {
      res = await result.current("30m");
    });
    expect(res).toEqual({ ok: true, newUntil: NOW + 30 * 60_000 });
    expect(window.localStorage.getItem(AD_FREE_STORAGE_KEY)).toBe(
      String(NOW + 30 * 60_000),
    );
    expect(mockPurchaseShopItem).toHaveBeenCalledWith("ad-free-30m");
  });

  it("extends (does NOT replace) an active ad-free window", async () => {
    // Already 20 minutes into a 30-min window: 10 min remaining.
    const existingUntil = NOW + 10 * 60_000;
    window.localStorage.setItem(AD_FREE_STORAGE_KEY, String(existingUntil));

    const { result } = renderHook(() => useBuyAdFreeTime());
    await act(async () => {
      await result.current("30m");
    });

    // Should be existing 10 min + new 30 min = 40 min from NOW.
    expect(window.localStorage.getItem(AD_FREE_STORAGE_KEY)).toBe(
      String(existingUntil + 30 * 60_000),
    );
  });

  it("returns insufficient_lingots when balance < price", async () => {
    mockLingots = 10;
    const { result } = renderHook(() => useBuyAdFreeTime());
    let res;
    await act(async () => {
      res = await result.current("30m");
    });
    expect(res).toEqual({ ok: false, reason: "insufficient_lingots" });
    expect(mockPurchaseShopItem).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(AD_FREE_STORAGE_KEY)).toBeNull();
  });

  it("returns grind_lock when the user is grinding", async () => {
    // Bury the user under a grinding pattern.
    const events: LingotEvent[] = Array.from({ length: 50 }, (_, i) => ({
      ts: NOW - (50 - i) * 20_000,
      amount: 25,
      source: "practice",
    }));
    setLingotEvents(events);

    const { result } = renderHook(() => useBuyAdFreeTime());
    let res;
    await act(async () => {
      res = await result.current("30m");
    });
    expect(res).toEqual({ ok: false, reason: "grind_lock" });
    expect(mockPurchaseShopItem).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(AD_FREE_STORAGE_KEY)).toBeNull();
  });

  it("returns cap_reached when 24h cap would be exceeded", async () => {
    // Pre-load 23h45m of purchases in the last 24h — buying 30m more
    // crosses the 24h cap.
    const purchases = [
      { ts: NOW - 12 * 60 * 60_000, durationMs: 23 * 60 * 60_000 },
      { ts: NOW - 30 * 60_000, durationMs: 45 * 60_000 },
    ];
    window.localStorage.setItem(
      AD_FREE_PURCHASES_STORAGE_KEY,
      JSON.stringify(purchases),
    );

    const { result } = renderHook(() => useBuyAdFreeTime());
    let res;
    await act(async () => {
      res = await result.current("30m");
    });
    expect(res).toEqual({ ok: false, reason: "cap_reached" });
    expect(mockPurchaseShopItem).not.toHaveBeenCalled();
  });

  it("logs the purchase in the rolling cap window", async () => {
    const { result } = renderHook(() => useBuyAdFreeTime());
    await act(async () => {
      await result.current("2h");
    });
    const stored = JSON.parse(
      window.localStorage.getItem(AD_FREE_PURCHASES_STORAGE_KEY) ?? "[]",
    );
    expect(stored).toEqual([
      { ts: NOW, durationMs: AD_FREE_SKUS[1].durationMs },
    ]);
  });

  it("still grants ad-free locally when the server returns null (501/404)", async () => {
    mockPurchaseShopItem.mockResolvedValue(null);
    const { result } = renderHook(() => useBuyAdFreeTime());
    let res;
    await act(async () => {
      res = await result.current("24h");
    });
    expect(res).toEqual({ ok: true, newUntil: NOW + 24 * 60 * 60_000 });
  });
});
