import { useEffect, useState } from "react";
import { AD_FREE_TICK_MS } from "./config";
import { readAdFreeUntil } from "./storage";

export type AdFreeStatus = {
  isActive: boolean;
  until: number | null;
  remainingMs: number;
};

function computeStatus(now: number): AdFreeStatus {
  const until = readAdFreeUntil();
  if (until === null || until <= now) {
    return { isActive: false, until: null, remainingMs: 0 };
  }
  return { isActive: true, until, remainingMs: until - now };
}

/**
 * Reactive ad-free status.
 *
 * Reads `adFreeUntil` from localStorage on mount, refreshes on a 30s
 * tick while active (so countdown copy updates without an explicit
 * re-render trigger), and listens for in-app `lingo:ad-free-updated`
 * events + cross-tab `storage` events so a purchase in another tab
 * lights up the pill immediately.
 *
 * The ad provider DI (in `features/ads/`) consumes this hook via
 * `isActive` — when true, all ad surfaces should hide.
 */
export function useAdFreeStatus(): AdFreeStatus {
  const [status, setStatus] = useState<AdFreeStatus>(() =>
    computeStatus(Date.now()),
  );

  useEffect(() => {
    let cancelled = false;

    const recompute = () => {
      if (cancelled) return;
      setStatus(computeStatus(Date.now()));
    };

    // First recompute immediately in case mount-time state was stale
    // (e.g. SSR pre-render, tab restore).
    recompute();

    const interval = setInterval(recompute, AD_FREE_TICK_MS);

    const onLocalEvent = () => recompute();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("lingo.ads.")) recompute();
    };

    window.addEventListener("lingo:ad-free-updated", onLocalEvent);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onLocalEvent);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("lingo:ad-free-updated", onLocalEvent);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onLocalEvent);
    };
  }, []);

  return status;
}
