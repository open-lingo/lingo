/** @see docs/ADS_PLACEMENT.md */
export { AdSlot } from "./AdSlot";
export { CollapsibleAdBanner } from "./CollapsibleAdBanner";
export { DailyWelcomeAd } from "./DailyWelcomeAd";
export { useAdsEnabled } from "./useAdsEnabled";
export { loadAdSenseScript } from "./adsense";
export { getAdSenseClient, isAdsFeatureEnabled } from "./config";

// Provider abstraction (DI).
export type { AdProvider, AdRequest, AdRendered } from "./providers/types";
export {
  AdProviderContext,
  AdProviderRoot,
  useAdProvider,
  selectDefaultProvider,
} from "./providers/AdProviderContext";
export { FakeAdProvider } from "./providers/FakeAdProvider";
export { AdSenseAdProvider } from "./providers/AdSenseAdProvider";

// Ad-free time contract (consumed inside `useAdsEnabled`; writer is owned
// by the lingot-spend feature).
export {
  AD_FREE_STORAGE_KEY,
  AD_FREE_CHANGE_EVENT,
  readAdFreeStatus,
  useAdFreeStatus,
  type AdFreeStatus,
} from "./adFree";
