/** AdSense publisher client (ca-pub-…). Required to show ads. */
export function getAdSenseClient(): string {
  return (import.meta.env.VITE_ADSENSE_CLIENT as string | undefined)?.trim() ?? "";
}

/** Master switch; defaults to on when a client id is configured. */
export function isAdsFeatureEnabled(): boolean {
  const flag = (import.meta.env.VITE_ADSENSE_ENABLED as string | undefined)?.trim();
  if (flag === "false" || flag === "0") return false;
  return Boolean(getAdSenseClient());
}

export type AdSlotId = "banner" | "inline";

const SLOT_ENV: Record<AdSlotId, string> = {
  banner: "VITE_ADSENSE_SLOT_BANNER",
  inline: "VITE_ADSENSE_SLOT_INLINE",
};

/** Ad unit slot id from AdSense UI (numeric string). */
export function getAdSlotId(slot: AdSlotId): string {
  const key = SLOT_ENV[slot];
  return (import.meta.env[key] as string | undefined)?.trim() ?? "";
}
