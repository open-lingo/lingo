import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { AdSlot } from "./AdSlot";
import { useAdsEnabled } from "./useAdsEnabled";

const COLLAPSED_KEY = "open-lingo-ad-banner-collapsed";

function readCollapsed(): boolean {
  try {
    return sessionStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Bottom banner ad (above funding meter). Collapses to a slim bar for the session.
 */
export function CollapsibleAdBanner({ premiumActive = false }: { premiumActive?: boolean }) {
  const { t } = useTranslation();
  const enabled = useAdsEnabled(premiumActive);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  if (!enabled) return null;

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      sessionStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-[var(--funding-meter-height,4.5rem)] z-40 border-t border-border bg-surface shadow-card"
      role="region"
      aria-label={t("ads.bannerRegion", "Sponsored")}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-1 sm:px-6">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          {t("ads.sponsored", "Sponsored")}
        </span>
        <button
          type="button"
          onClick={toggle}
          className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-text-muted hover:bg-surface-muted hover:text-text-primary"
          aria-expanded={!collapsed}
        >
          {collapsed ? t("ads.expand", "Show ad") : t("ads.collapse", "Hide ad")}
          <Icon name={collapsed ? "chevronUp" : "chevronDown"} size={14} />
        </button>
      </div>
      {!collapsed ? (
        <div className="mx-auto max-w-7xl px-3 pb-2 sm:px-6">
          <AdSlot slot="banner" format="horizontal" premiumActive={premiumActive} />
        </div>
      ) : null}
    </div>
  );
}
