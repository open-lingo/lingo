/**
 * Ad-free time feature — purchasable, lingot-priced ad suppression.
 *
 * Public contract consumed by:
 *   - `features/ads/` (reads `useAdFreeStatus` to gate ad surfaces)
 *   - `features/shop/` (renders SKUs, calls `useBuyAdFreeTime`)
 *   - `routes/Layout.tsx` (header pill via `AdFreePill`)
 *
 * See `config.ts` for tunables. State lives in localStorage today;
 * migrating to a user-profile field is a backend-coordinated change.
 */
export { AD_FREE_STORAGE_KEY, AD_FREE_AMBER_MS, AD_FREE_SKUS } from "./config";
export type { AdFreeProductId, AdFreeSku } from "./config";

export { useAdFreeStatus } from "./useAdFreeStatus";
export type { AdFreeStatus } from "./useAdFreeStatus";

export {
  useBuyAdFreeTime,
  purchasedMsInWindow,
} from "./useBuyAdFreeTime";
export type {
  AdFreePurchaseResult,
  AdFreePurchaseSuccess,
  AdFreePurchaseFailure,
} from "./useBuyAdFreeTime";

export { getGrindSnapshot } from "./grindDetector";
export type { GrindSnapshot } from "./grindDetector";

export { recordLingotEarn } from "./recordLingotEarn";

export { AdFreePill } from "./AdFreePill";
