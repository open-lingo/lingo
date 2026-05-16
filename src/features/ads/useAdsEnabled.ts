import { useSyncExternalStore } from "react";
import { isAdvertisingConsentGranted } from "@/shared/legal/cookieConsent";
import { getAdSenseClient, isAdsFeatureEnabled } from "./config";

function subscribeConsent(cb: () => void) {
  window.addEventListener("open-lingo-cookie-consent", cb);
  return () => window.removeEventListener("open-lingo-cookie-consent", cb);
}

/**
 * Whether we may render AdSense units (consent + config + not premium).
 * Pass `premiumActive: true` when Stripe subscription is wired.
 */
export function useAdsEnabled(premiumActive = false): boolean {
  const consent = useSyncExternalStore(
    subscribeConsent,
    isAdvertisingConsentGranted,
    () => false
  );

  if (premiumActive) return false;
  if (!isAdsFeatureEnabled()) return false;
  if (!getAdSenseClient()) return false;
  return consent;
}
