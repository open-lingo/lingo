import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  safeLocalStorageWrite,
  STORAGE_QUOTA_EVENT,
  NEAR_QUOTA_RATIO,
  __resetStorageQuotaThrottle,
  type StorageQuotaDetail,
} from "./storageQuota";

/**
 * Force the next `localStorage.setItem` to throw — works whether happy-dom
 * exposes setItem on the instance or the prototype. Returns a restore fn.
 */
function stubSetItemThrows(err: unknown): () => void {
  const original = localStorage.setItem.bind(localStorage);
  const fake = () => {
    throw err;
  };
  Object.defineProperty(localStorage, "setItem", {
    configurable: true,
    writable: true,
    value: fake,
  });
  return () => {
    Object.defineProperty(localStorage, "setItem", {
      configurable: true,
      writable: true,
      value: original,
    });
  };
}

function captureQuotaEvents() {
  const events: StorageQuotaDetail[] = [];
  const handler = (e: Event) => {
    events.push((e as CustomEvent<StorageQuotaDetail>).detail);
  };
  window.addEventListener(STORAGE_QUOTA_EVENT, handler);
  return {
    events,
    stop: () => window.removeEventListener(STORAGE_QUOTA_EVENT, handler),
  };
}

describe("safeLocalStorageWrite", () => {
  beforeEach(() => {
    localStorage.clear();
    __resetStorageQuotaThrottle();
    // Suppress the intentional console.warn breadcrumb in test output.
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Remove any estimate stub.
    // @ts-expect-error optional in jsdom/happy-dom
    delete navigator.storage;
  });

  it("writes normally and emits no warning under quota", () => {
    const { events, stop } = captureQuotaEvents();
    const ok = safeLocalStorageWrite("k", "v");
    stop();
    expect(ok).toBe(true);
    expect(localStorage.getItem("k")).toBe("v");
    expect(events).toHaveLength(0);
  });

  it("warns (not silently drops) on QuotaExceededError", () => {
    const restore = stubSetItemThrows(
      new DOMException("quota", "QuotaExceededError"),
    );

    const { events, stop } = captureQuotaEvents();
    const ok = safeLocalStorageWrite("k", "v");
    stop();
    restore();

    expect(ok).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0].reason).toBe("exceeded");
    expect(console.warn).toHaveBeenCalled();
  });

  it("re-throws non-quota errors instead of swallowing them", () => {
    const restore = stubSetItemThrows(new TypeError("boom"));
    expect(() => safeLocalStorageWrite("k", "v")).toThrow("boom");
    restore();
  });

  it("warns when a near-quota estimate crosses the threshold", async () => {
    // Stub navigator.storage.estimate to report usage above the threshold.
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({
          usage: NEAR_QUOTA_RATIO + 0.05,
          quota: 1,
        }),
      },
    });

    const { events, stop } = captureQuotaEvents();
    const ok = safeLocalStorageWrite("k", "v");
    expect(ok).toBe(true);
    // estimate resolves on a microtask — let it flush.
    await Promise.resolve();
    await Promise.resolve();
    stop();

    expect(events).toHaveLength(1);
    expect(events[0].reason).toBe("near");
    expect(events[0].ratio).toBeGreaterThanOrEqual(NEAR_QUOTA_RATIO);
  });

  it("does not warn when estimate is comfortably under the threshold", async () => {
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({ usage: 0.1, quota: 1 }),
      },
    });

    const { events, stop } = captureQuotaEvents();
    safeLocalStorageWrite("k", "v");
    await Promise.resolve();
    await Promise.resolve();
    stop();

    expect(events).toHaveLength(0);
  });
});
