import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AdSlotId } from "./config";
import { useAdsEnabled } from "./useAdsEnabled";
import { useAdProvider } from "./providers/AdProviderContext";

type AdSlotProps = {
  slot: AdSlotId;
  /** Layout hint passed to the provider. Provider may ignore. */
  format?: "auto" | "horizontal" | "rectangle";
  className?: string;
  /** When true, skip render (e.g. premium users). */
  premiumActive?: boolean;
};

/**
 * One ad unit. Resolves the actual creative through the configured
 * `AdProvider` (fake placeholder in dev/tests, AdSense in prod once
 * units are wired).
 */
export function AdSlot({
  slot,
  format = "auto",
  className = "",
  premiumActive = false,
}: AdSlotProps) {
  const { t } = useTranslation();
  const enabled = useAdsEnabled(premiumActive);
  const provider = useAdProvider();

  // Map AdSlot's display-format hint to the provider's coarser format.
  const providerFormat: "banner" | "interstitial" =
    format === "auto" ? "banner" : "banner";

  const rendered = useMemo(() => {
    if (!enabled) return null;
    return provider.request({ slot, format: providerFormat });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, slot, providerFormat, provider.id]);

  if (!enabled || !rendered) return null;

  return (
    <div
      className={`overflow-hidden rounded-lg border border-border bg-surface-muted ${className}`}
      aria-label={t("ads.label", "Advertisement")}
    >
      {rendered.node}
    </div>
  );
}
