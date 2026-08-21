import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { cn } from "@/shared/components/ui/cn";
import { prefetchLearn, prefetchPractice } from "@/shared/utils/routePrefetch";

type Tab = {
  key: string;
  to: string;
  label: string;
  icon: IconName;
  active: boolean;
  prefetch?: () => void;
};

/**
 * Mobile primary navigation — a fixed, thumb-reachable bottom tab bar that
 * replaces the header hamburger dropdown. Mounted in Layout only when
 * `!focusedFlow` (so it never shows during a lesson/test) and hidden at `md+`
 * where the left sidebar rail takes over. Surfaces Shop, which was previously
 * reachable only through the gems chip.
 */
export function BottomTabBar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const langPath = useLangPath();

  const tabs: Tab[] = [
    { key: "home", to: "/home", label: t("nav.home"), icon: "layoutDashboard", active: pathname === "/home" },
    {
      key: "learn",
      to: langPath("learn"),
      label: t("nav.learn"),
      icon: "graduationCap",
      active: /^\/[^/]+\/learn/.test(pathname),
      prefetch: prefetchLearn,
    },
    {
      key: "practice",
      to: langPath("practice"),
      label: t("nav.practice"),
      icon: "dumbbell",
      active: /^\/[^/]+\/practice/.test(pathname),
      prefetch: prefetchPractice,
    },
    {
      key: "shop",
      to: langPath("shop"),
      label: t("nav.shop", "Shop"),
      icon: "gem",
      active: /^\/[^/]+\/shop/.test(pathname),
    },
  ];

  return (
    <nav
      aria-label={t("nav.primaryLabel", "Primary")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe pl-safe pr-safe backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {tabs.map((tab) => (
          <li key={tab.key} className="flex-1">
            <Link
              to={tab.to}
              onPointerEnter={tab.prefetch}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "relative flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold [touch-action:manipulation] transition-colors",
                tab.active ? "text-accent" : "text-text-secondary hover:text-text-primary",
              )}
            >
              {/* Transit-line active indicator — a short "rail" segment at the
                  top of the current tab, echoing the network-map motif rather
                  than a highlight pill. */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 top-0 mx-auto h-[3px] w-9 rounded-full transition-colors",
                  tab.active ? "bg-accent" : "bg-transparent",
                )}
              />
              <Icon name={tab.icon} size={24} aria-hidden />
              <span>{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
