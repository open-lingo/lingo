import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getAdSenseClient, getAdSlotId, type AdSlotId } from "./config";
import { loadAdSenseScript, pushAdSenseSlot } from "./adsense";
import { useAdsEnabled } from "./useAdsEnabled";

type AdSlotProps = {
  slot: AdSlotId;
  format?: "auto" | "horizontal" | "rectangle";
  className?: string;
  /** When true, skip render (e.g. premium users). */
  premiumActive?: boolean;
};

/**
 * Single AdSense display unit. Requires slot id from AdSense → Ads → By ad unit.
 */
export function AdSlot({
  slot,
  format = "auto",
  className = "",
  premiumActive = false,
}: AdSlotProps) {
  const { t } = useTranslation();
  const enabled = useAdsEnabled(premiumActive);
  const slotId = getAdSlotId(slot);
  const client = getAdSenseClient();
  const pushed = useRef(false);

  useEffect(() => {
    if (!enabled || !slotId) return;
    loadAdSenseScript();
  }, [enabled, slotId]);

  useEffect(() => {
    if (!enabled || !slotId || pushed.current) return;
    pushed.current = true;
    const id = window.setTimeout(() => pushAdSenseSlot(), 100);
    return () => window.clearTimeout(id);
  }, [enabled, slotId]);

  if (!enabled || !slotId) return null;

  return (
    <div
      className={`overflow-hidden rounded-lg border border-border bg-surface-muted ${className}`}
      aria-label={t("ads.label", "Advertisement")}
    >
      <ins
        className="adsbygoogle block min-h-[50px] w-full"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={format === "auto" ? "true" : undefined}
      />
    </div>
  );
}
