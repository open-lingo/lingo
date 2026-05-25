import { useSyncExternalStore } from "react";

/**
 * Ad-free time contract.
 *
 * "Ad-free time" is a window during which the user has paid (with
 * lingots) to hide ads. The lingot-spend UI and the write path are
 * owned by another feature. The ads subsystem only consumes the
 * timestamp.
 *
 * Storage key: `lingo.ads.adFreeUntil` (epoch ms; missing or numeric
 * garbage = no ad-free window). Writers MUST dispatch the
 * `lingo-ad-free-changed` window event after mutating the key so
 * subscribers (including `useAdFreeStatus`) re-read promptly.
 */
export const AD_FREE_STORAGE_KEY = "lingo.ads.adFreeUntil";
export const AD_FREE_CHANGE_EVENT = "lingo-ad-free-changed";

export type AdFreeStatus = {
  /** True iff `until > Date.now()`. */
  isActive: boolean;
  /** Epoch ms until which ads are hidden; `null` when not configured or unparsable. */
  until: number | null;
};

export function readAdFreeStatus(): AdFreeStatus {
  if (typeof localStorage === "undefined") {
    return INACTIVE;
  }
  const raw = localStorage.getItem(AD_FREE_STORAGE_KEY);
  if (!raw) return INACTIVE;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return INACTIVE;
  return { isActive: parsed > Date.now(), until: parsed };
}

const INACTIVE: AdFreeStatus = { isActive: false, until: null };

/**
 * Cached snapshot so `useSyncExternalStore` doesn't loop infinitely.
 * Recomputed only when the underlying values change.
 */
let cachedSnapshot: AdFreeStatus = INACTIVE;
function getCachedSnapshot(): AdFreeStatus {
  const fresh = readAdFreeStatus();
  if (
    fresh.isActive !== cachedSnapshot.isActive ||
    fresh.until !== cachedSnapshot.until
  ) {
    cachedSnapshot = fresh;
  }
  return cachedSnapshot;
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(AD_FREE_CHANGE_EVENT, cb);
  // Also catch cross-tab writes via the standard `storage` event.
  const onStorage = (e: StorageEvent) => {
    if (e.key === AD_FREE_STORAGE_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AD_FREE_CHANGE_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Subscribed read for use inside components / hooks. */
export function useAdFreeStatus(): AdFreeStatus {
  return useSyncExternalStore(subscribe, getCachedSnapshot, () => INACTIVE);
}
