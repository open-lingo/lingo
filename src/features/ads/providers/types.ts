import type { ReactNode } from "react";

/**
 * Ad provider abstraction. Lets the app swap real AdSense, a fake demo
 * placeholder, or a future house/affiliate engine without touching the
 * components that mount ad slots.
 *
 * Selection happens in `AdProviderContext`; consumers call
 * `useAdProvider()` rather than reaching for AdSense directly.
 */
export type AdRequest = {
  /** Stable identifier for the placement (e.g. "daily-welcome", "banner"). */
  slot: string;
  /** Layout hint — providers may ignore. */
  format?: "banner" | "interstitial";
  /** Pixel size hint — providers may ignore. */
  size?: { w: number; h: number };
};

export type AdRendered = {
  /** What to render. Provider-specific; opaque to call sites. */
  node: ReactNode;
  /** Stable id for this request — useful for impression dedup + analytics. */
  impressionId: string;
  /** Fired after the unit becomes visible. Optional; mainly for real providers. */
  onImpression?: () => void;
  /** Fired on user click. Optional. */
  onClick?: () => void;
};

export interface AdProvider {
  /** Stable identifier: "adsense" | "fake" | "house" | ... */
  readonly id: string;
  /** True once the provider can serve fills. Fake = always true. */
  isReady(): boolean;
  /**
   * Request a unit. Returns `null` when there is no fill (e.g. AdSense
   * disabled, slot id not configured, premium user). Call sites should
   * render nothing on null.
   */
  request(req: AdRequest): AdRendered | null;
}
