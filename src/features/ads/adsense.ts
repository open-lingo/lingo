import { getAdSenseClient } from "./config";
import { isAdvertisingConsentGranted } from "@/shared/legal/cookieConsent";
import { IS_NATIVE } from "@/shared/platform/native";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

export function isAdSenseScriptLoaded(): boolean {
  return typeof document !== "undefined" && !!document.querySelector('script[data-adsense="open-lingo"]');
}

/** Load the AdSense script once, after advertising cookie consent. */
export function loadAdSenseScript(): void {
  // Native guard lives HERE, not only in `isAdsFeatureEnabled()`, because
  // `routes/Layout.tsx` and `RewardedAdSlot.tsx` call this directly on consent
  // — the master switch never runs on that path. AdSense is a web-only
  // programme (apps must use AdMob), so injecting it into the Capacitor
  // WKWebView breaches Google's policy. See `adsense.native.test.ts`.
  if (IS_NATIVE) return;
  if (!isAdvertisingConsentGranted()) return;

  const client = getAdSenseClient();
  if (!client || typeof document === "undefined") return;
  if (isAdSenseScriptLoaded()) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  script.crossOrigin = "anonymous";
  script.dataset.adsense = "open-lingo";
  document.head.appendChild(script);
}

/** Request fill for one <ins class="adsbygoogle"> unit (call after mount). */
export function pushAdSenseSlot(): void {
  try {
    window.adsbygoogle = window.adsbygoogle ?? [];
    window.adsbygoogle.push({});
  } catch {
    /* Ad blockers or script not ready */
  }
}
