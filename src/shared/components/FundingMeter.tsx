import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useFundingTransparency } from "@/features/funding/useFundingTransparency";

const SESSION_KEY = "open-lingo-funding-collapsed";
const SCROLL_AUTO_COLLAPSE_PX = 120;

/**
 * Funding transparency panel — slides in from the right edge under the nav
 * bar on session load. Reminds the user how the free tier is funded. Can be
 * collapsed to a small pill anchored to the right edge; the collapsed state
 * persists in sessionStorage (fresh tab/session reopens the panel).
 */
export function FundingMeter() {
  const { t } = useTranslation();
  const { data } = useFundingTransparency();
  const adPercent = data?.adFundedPercent ?? 40;
  const source = data?.source ?? "estimated";
  const period = data?.periodLabel ?? "Last 30 days";

  const location = useLocation();

  // Read sessionStorage synchronously on first render so the panel doesn't
  // flash open before collapsing.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (collapsed) {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } else {
      window.sessionStorage.removeItem(SESSION_KEY);
    }
  }, [collapsed]);

  // Auto-collapse on route change so the panel doesn't follow the user across
  // every page they navigate to. Compare against the last-seen pathname rather
  // than a mount flag — strict-mode double-effects re-fire the mount effect
  // and would otherwise flip a mount-flag past its guard.
  const lastPathname = useRef<string | null>(null);
  useEffect(() => {
    if (lastPathname.current === null) {
      lastPathname.current = location.pathname;
      return;
    }
    if (lastPathname.current !== location.pathname) {
      lastPathname.current = location.pathname;
      setCollapsed(true);
    }
  }, [location.pathname]);

  // Auto-collapse once the user scrolls meaningfully — they're past the
  // first-render attention moment, panel becomes a distraction.
  useEffect(() => {
    if (collapsed) return;
    const onScroll = () => {
      if (window.scrollY > SCROLL_AUTO_COLLAPSE_PX) setCollapsed(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [collapsed]);

  // Lesson-flow surfaces (lessons, placement test, test-out) are full-focus —
  // the floating pill overlapped step content there. Hide it entirely; the
  // Learn hub and the rest of the app still show it.
  const isLessonFlow = /\/learn\/(lessons\/|placement-test|test-out\/)/.test(
    location.pathname,
  );
  if (isLessonFlow) return null;

  const ariaLabel = t("funding.ariaLabel", {
    adPercent,
    defaultValue: "{{adPercent}}% ad-funded",
  });

  return (
    <div
      className="pointer-events-none static flex justify-end px-3 pt-3 sm:fixed sm:right-0 sm:top-[var(--header-height,3rem)] sm:z-30 sm:px-4"
      role="status"
      aria-label={ariaLabel}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label={t("funding.expand", "Show funding details")}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-l-full border border-r-0 border-border bg-surface py-1.5 pl-3 pr-3 text-xs font-medium text-text-secondary shadow-popover transition hover:text-text-primary"
        >
          <span className="h-2 w-2 rounded-full bg-warning" aria-hidden />
          {t("funding.adFunded", { percent: adPercent })}
          <Icon name="chevronLeft" size={14} aria-hidden />
        </button>
      ) : (
        <div className="pointer-events-auto w-72 max-w-[calc(100vw-1.5rem)] origin-top-right animate-[funding-slide-in_220ms_ease-out] rounded-xl border border-border bg-surface p-4 shadow-popover">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-text-primary">
              {t("funding.panelTitle", "How Open Lingo stays free")}
            </h2>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label={t("funding.collapse", "Collapse funding panel")}
              className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-warning transition-[width] duration-500"
                style={{ width: `${adPercent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-text-secondary">
              {t("funding.adFunded", { percent: adPercent })}
            </span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-text-secondary">
            {t("funding.panelBody", {
              adPercent,
              defaultValue:
                "Light, optional ads cover about {{adPercent}}% of our costs — the goal is to stay free on ads alone, never on the learning path. We never sell your data.",
            })}
          </p>

          <p className="mt-2 text-[11px] text-text-muted">
            {t("funding.panelPeriod", {
              period,
              source,
              defaultValue: "{{period}} · {{source}} data",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
