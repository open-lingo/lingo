import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useAdsEnabled } from "./useAdsEnabled";
import { useAdProvider } from "./providers/AdProviderContext";

/**
 * localStorage key for the "user has seen the welcome banner today"
 * flag. Value is a YYYY-MM-DD date string in the user's local
 * timezone. Missing or stale = show the banner.
 */
export const DAILY_WELCOME_STORAGE_KEY = "lingo.ads.daily.lastShown";

/** Provider slot id used when requesting the daily banner unit. */
export const DAILY_WELCOME_SLOT = "daily-welcome";

/** Format a Date as YYYY-MM-DD using the user's local timezone fields. */
export function formatLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readLastShown(): string | null {
  try {
    return localStorage.getItem(DAILY_WELCOME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLastShown(value: string): void {
  try {
    localStorage.setItem(DAILY_WELCOME_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

/**
 * Top-of-page banner that surfaces a single ad on the user's first
 * authenticated render of each calendar day. Dismissible via a close
 * button; dismissal persists for the rest of the day.
 *
 * Mounted in `Layout.tsx` above the main content. Renders nothing
 * when ads are disabled (consent off, ad-free window active, premium,
 * etc.) or when the provider returns no fill.
 */
export function DailyWelcomeAd({ premiumActive = false }: { premiumActive?: boolean } = {}) {
  const { t } = useTranslation();
  const enabled = useAdsEnabled(premiumActive);
  const provider = useAdProvider();

  const todayKey = useMemo(() => formatLocalDateKey(new Date(Date.now())), []);
  const [dismissed, setDismissed] = useState<boolean>(() => readLastShown() === todayKey);

  // Request a fill once per mount; useMemo ties identity to dismissal/today/provider
  // so the same impression is re-used across re-renders inside the same render pass.
  const rendered = useMemo(() => {
    if (!enabled || dismissed) return null;
    return provider.request({ slot: DAILY_WELCOME_SLOT, format: "banner" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, dismissed, todayKey, provider.id]);

  if (!enabled || dismissed || !rendered) return null;

  const dismiss = () => {
    writeLastShown(todayKey);
    setDismissed(true);
  };

  return (
    <div
      data-testid="daily-welcome-ad"
      role="region"
      aria-label={t("ads.dailyWelcome.region", "Sponsored welcome")}
      className="border-b border-border bg-surface"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            <span>{t("ads.dailyWelcome.label", "Welcome back")}</span>
            <span aria-hidden>•</span>
            <span>{t("ads.sponsored", "Sponsored")}</span>
          </div>
          <div className="min-w-0">{rendered.node}</div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
          aria-label={t("ads.dailyWelcome.dismiss", "Dismiss for today")}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}
