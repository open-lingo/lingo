import { useEffect, useRef } from "react";
import { getAdSenseClient, getAdSlotId, type AdSlotId } from "../config";
import { loadAdSenseScript, pushAdSenseSlot } from "../adsense";
import type { AdProvider, AdRendered, AdRequest } from "./types";

/**
 * AdSense provider. Wraps the legacy `adsense.ts` script loader so the
 * rest of the app can mount slots via the provider abstraction instead
 * of importing AdSense globals directly.
 *
 * STATUS: stub. Slot ids must map to `AdSlotId` (`"banner"` /
 * `"inline"`) defined in `config.ts`; arbitrary provider slot names
 * fall back to `null`. When real units exist, extend the
 * `slot -> AdSlotId` map below (or thread a richer mapping through
 * the provider deps).
 */
export type AdSenseProviderDeps = {
  /** Read the publisher client id (e.g. ca-pub-…). */
  getClient?: () => string;
  /** Map provider slot names to AdSense unit ids. */
  getSlotId?: (slot: string) => string;
  /** Load the AdSense JS once. Default: existing `loadAdSenseScript`. */
  loadScript?: () => void;
  /** Push a single unit fill request. Default: existing `pushAdSenseSlot`. */
  pushSlot?: () => void;
};

const DEFAULT_SLOT_TO_AD_UNIT: Record<string, AdSlotId | undefined> = {
  banner: "banner",
  inline: "inline",
  // `daily-welcome` reuses the banner unit until a dedicated slot id exists.
  "daily-welcome": "banner",
};

function defaultGetSlotId(slot: string): string {
  const adUnit = DEFAULT_SLOT_TO_AD_UNIT[slot];
  if (!adUnit) return "";
  return getAdSlotId(adUnit);
}

export class AdSenseAdProvider implements AdProvider {
  readonly id = "adsense";
  private readonly deps: Required<AdSenseProviderDeps>;

  constructor(deps: AdSenseProviderDeps = {}) {
    this.deps = {
      getClient: deps.getClient ?? getAdSenseClient,
      getSlotId: deps.getSlotId ?? defaultGetSlotId,
      loadScript: deps.loadScript ?? loadAdSenseScript,
      pushSlot: deps.pushSlot ?? pushAdSenseSlot,
    };
  }

  isReady(): boolean {
    return Boolean(this.deps.getClient());
  }

  request(req: AdRequest): AdRendered | null {
    if (!this.isReady()) return null;
    const adUnitId = this.deps.getSlotId(req.slot);
    if (!adUnitId) return null;
    const client = this.deps.getClient();
    const impressionId = `adsense-${req.slot}-${Math.random().toString(36).slice(2, 10)}`;
    return {
      impressionId,
      node: (
        <AdSenseUnit
          client={client}
          adUnitId={adUnitId}
          format={req.format}
          loadScript={this.deps.loadScript}
          pushSlot={this.deps.pushSlot}
        />
      ),
    };
  }
}

function AdSenseUnit({
  client,
  adUnitId,
  format,
  loadScript,
  pushSlot,
}: {
  client: string;
  adUnitId: string;
  format?: "banner" | "interstitial";
  loadScript: () => void;
  pushSlot: () => void;
}) {
  const pushed = useRef(false);

  useEffect(() => {
    loadScript();
  }, [loadScript]);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    const id = window.setTimeout(() => pushSlot(), 100);
    return () => window.clearTimeout(id);
  }, [pushSlot]);

  // Map provider format hint to AdSense's data-ad-format.
  const adFormat = format === "interstitial" ? "auto" : "horizontal";

  return (
    <ins
      className="adsbygoogle block min-h-[50px] w-full"
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={adUnitId}
      data-ad-format={adFormat}
    />
  );
}
