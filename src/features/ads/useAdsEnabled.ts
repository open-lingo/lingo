import { useSyncExternalStore } from "react";
import { isAdvertisingConsentGranted } from "@/shared/legal/cookieConsent";
import { getAdSenseClient, isAdsFeatureEnabled } from "./config";
import { useAdFreeStatus } from "./adFree";

function subscribeConsent(cb: () => void) {
  window.addEventListener("open-lingo-cookie-consent", cb);
  return () => window.removeEventListener("open-lingo-cookie-consent", cb);
}

/**
 * Whether we may render ad units (consent + config + not premium + no
 * active ad-free window). Pass `premiumActive: true` when Stripe
 * subscription is wired.
 *
 * Ad-free window is owned by the lingot-spend feature; we read its
 * timestamp via `useAdFreeStatus`.
 */
export function useAdsEnabled(premiumActive = false): boolean {
  const consent = useSyncExternalStore(
    subscribeConsent,
    isAdvertisingConsentGranted,
    () => false
  );
  const adFree = useAdFreeStatus();

  if (premiumActive) return false;
  if (adFree.isActive) return false;
  if (!isAdsFeatureEnabled()) return false;
  if (!getAdSenseClient()) return false;
  return consent;
}
