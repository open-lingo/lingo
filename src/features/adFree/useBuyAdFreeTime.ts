import { useCallback } from "react";
import { useApi } from "@/shared/api";
import { ApiError } from "@/shared/api/client";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { useInvalidateShopQueries } from "@/features/shop/useShopState";
import {
  AD_FREE_DAILY_CAP_MS,
  GRIND_WINDOW_MS,
  getSku,
  type AdFreeProductId,
} from "./config";
import { getGrindSnapshot } from "./grindDetector";
import {
  appendAdFreePurchase,
  extendAdFreeUntil,
  readAdFreePurchases,
} from "./storage";

export type AdFreePurchaseSuccess = { ok: true; newUntil: number };
export type AdFreePurchaseFailure = {
  ok: false;
  reason: "insufficient_lingots" | "grind_lock" | "cap_reached";
};
export type AdFreePurchaseResult = AdFreePurchaseSuccess | AdFreePurchaseFailure;

/** Sum of `durationMs` for purchases inside the last 24h. */
export function purchasedMsInWindow(now: number): number {
  const cutoff = now - GRIND_WINDOW_MS;
  return readAdFreePurchases()
    .filter((p) => p.ts >= cutoff)
    .reduce((sum, p) => sum + p.durationMs, 0);
}

/**
 * Buy a chunk of ad-free time with lingots.
 *
 * Order of checks (all must pass):
 *   1. Lingot balance ≥ price
 *   2. Grind detector says we're NOT grinding
 *   3. Rolling-24h cap on purchased duration not exceeded
 *
 * On success: extends `adFreeUntil` in localStorage, logs the purchase
 * for cap accounting, calls the server `purchaseShopItem` so lingots
 * get deducted server-side (404/501 tolerated — backend not yet
 * wired), invalidates stats/shop queries so the next render reflects
 * the new balance.
 */
export function useBuyAdFreeTime(): (
  productId: AdFreeProductId,
) => Promise<AdFreePurchaseResult> {
  const { progress } = useApi();
  const { stats, isReady } = useUserStats();
  const invalidateShop = useInvalidateShopQueries();

  return useCallback(
    async (productId: AdFreeProductId): Promise<AdFreePurchaseResult> => {
      const sku = getSku(productId);
      const now = Date.now();

      // 1. balance
      if (!isReady || stats.lingots < sku.price) {
        return { ok: false, reason: "insufficient_lingots" };
      }

      // 2. grind lock
      if (getGrindSnapshot(now).isGrinding) {
        return { ok: false, reason: "grind_lock" };
      }

      // 3. rolling 24h cap
      if (purchasedMsInWindow(now) + sku.durationMs > AD_FREE_DAILY_CAP_MS) {
        return { ok: false, reason: "cap_reached" };
      }

      // Commit local state first so the user sees instant feedback even
      // if the backend round-trip is slow / 501 / offline. If the
      // server later 400s we'd refund (see catch); the optimistic
      // window stays — the cost is a few minutes of ad-free that the
      // user gets without server-side deduction, which is acceptable
      // at this stage (backend endpoint isn't wired yet anyway).
      const newUntil = extendAdFreeUntil(now, sku.durationMs);
      appendAdFreePurchase({ ts: now, durationMs: sku.durationMs });

      try {
        await progress.purchaseShopItem(sku.catalogId);
        invalidateShop();
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 400) {
          // Server says: not enough lingots. Roll back local state
          // (the user's `stats` was stale).
          // We can't easily "un-append" without re-reading, but the
          // extension is on a single key so we can shorten it.
          // Simpler: shorten the deadline by the duration we added.
          extendAdFreeUntil(now, -sku.durationMs);
          // And drop the most recent purchase log entry.
          const purchases = readAdFreePurchases();
          purchases.pop();
          // Best-effort write.
          try {
            window.localStorage.setItem(
              "lingo.ads.adFreePurchases",
              JSON.stringify(purchases),
            );
          } catch {
            /* ignore */
          }
          return { ok: false, reason: "insufficient_lingots" };
        }
        // Other errors (network, 5xx, 501) — keep the optimistic local
        // state. Backend not wired is the common case today.
      }

      return { ok: true, newUntil };
    },
    [progress, stats.lingots, isReady, invalidateShop],
  );
}
