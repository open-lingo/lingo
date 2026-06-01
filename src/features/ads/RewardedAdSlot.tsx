// NOTE: AdSense's TOS discourages incentivized display-ad views. v1 ships as-is; future swap to a real rewarded-ad provider (H5 Games Ads, AdinPlay, etc.) via this same slot.

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { loadAdSenseScript, pushAdSenseSlot } from "./adsense";

/**
 * Read the AdSense publisher client id. Honors the spec's
 * `VITE_ADSENSE_CLIENT_ID` first, then falls back to the existing
 * `VITE_ADSENSE_CLIENT` already wired in `config.ts` so the user's
 * pre-existing AdSense setup keeps working.
 */
function readClientId(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return (env.VITE_ADSENSE_CLIENT_ID ?? env.VITE_ADSENSE_CLIENT ?? "").trim();
}

function readRewardedSlotId(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return (env.VITE_ADSENSE_REWARDED_SLOT_ID ?? "").trim();
}

/**
 * Encapsulates the AdSense in-article responsive ad unit used by the
 * rewarded modal. If the client or slot env var is missing, renders a
 * clearly-labeled placeholder div — the modal's timer + reward flow
 * still proceeds so dev environments without ad config can exercise the
 * full user journey.
 */
export function RewardedAdSlot({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const client = readClientId();
  const slotId = readRewardedSlotId();
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || !slotId) return;
    loadAdSenseScript();
  }, [client, slotId]);

  useEffect(() => {
    if (!client || !slotId) return;
    if (pushed.current) return;
    pushed.current = true;
    const id = window.setTimeout(() => pushAdSenseSlot(), 100);
    return () => window.clearTimeout(id);
  }, [client, slotId]);

  if (!client) {
    return (
      <div
        data-testid="rewarded-ad-placeholder"
        className={`flex min-h-[160px] w-full items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted px-4 py-6 text-center text-xs text-text-muted ${className}`}
      >
        {t("ads.rewarded.placeholderNoClient", {
          defaultValue: "[ad placeholder — set VITE_ADSENSE_CLIENT_ID]",
        })}
      </div>
    );
  }

  if (!slotId) {
    return (
      <div
        data-testid="rewarded-ad-placeholder"
        className={`flex min-h-[160px] w-full items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted px-4 py-6 text-center text-xs text-text-muted ${className}`}
      >
        {t("ads.rewarded.placeholderNoSlot", {
          defaultValue: "[ad placeholder — set VITE_ADSENSE_REWARDED_SLOT_ID]",
        })}
      </div>
    );
  }

  return (
    <ins
      data-testid="rewarded-ad-unit"
      className={`adsbygoogle block min-h-[160px] w-full ${className}`}
      style={{ display: "block", textAlign: "center" }}
      data-ad-client={client}
      data-ad-slot={slotId}
      data-ad-layout="in-article"
      data-ad-format="fluid"
    />
  );
}
