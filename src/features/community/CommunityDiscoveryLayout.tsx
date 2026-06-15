import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { cn } from "@/shared/components/ui/cn";

type NavItem = {
  to: string;
  icon: IconName;
  label: string;
  isActive: boolean;
};

export type CommunityDiscoveryLayoutProps = {
  /** Optional search input rendered next to the primary CTA. */
  searchSlot?: ReactNode;
  children: ReactNode;
};

/**
 * CommunityDiscoveryLayout — the primary shell for the community marketplace
 * (discovery surface): Discover home, Browse all, Contributors. The personal
 * "Library" (subscribed + my decks) is a separate area, reachable from the
 * trailing Library link — discovery and personal content stay distinct.
 */
export function CommunityDiscoveryLayout({
  searchSlot,
  children,
}: CommunityDiscoveryLayoutProps) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { pathname } = useLocation();

  const homeTo = langPath("community/explore");
  const browseTo = langPath("community/browse");
  const contributorsTo = langPath("community/contributors");
  const libraryTo = langPath("community/library");
  const newTo = langPath("community/decks/new");

  const isHome =
    pathname === homeTo ||
    pathname.endsWith("/community") ||
    pathname.endsWith("/community/explore");
  const isBrowse = pathname.includes("/community/browse");
  const isContributors = pathname.includes("/community/contributors");

  const nav: NavItem[] = [
    { to: homeTo, icon: "compass", label: t("community.navDiscover", "Discover"), isActive: isHome },
    { to: browseTo, icon: "layoutGrid", label: t("community.navBrowse", "Browse"), isActive: isBrowse },
    {
      to: contributorsTo,
      icon: "users",
      label: t("community.contentBrowserTabContributors", "Contributors"),
      isActive: isContributors,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label={t("community.discoveryNavLabel", "Community sections")}
          className="flex flex-wrap items-center gap-1 rounded-card border border-border bg-surface-muted p-1 shadow-sm"
        >
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={item.isActive ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition",
                item.isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary",
              )}
            >
              <Icon name={item.icon} size={15} aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {searchSlot}
          <Link
            to={libraryTo}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition hover:border-accent hover:text-accent"
          >
            <Icon name="library" size={16} aria-hidden />
            {t("community.navLibrary", "My library")}
          </Link>
          <Link
            to={newTo}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover"
          >
            <Icon name="plus" size={16} aria-hidden />
            {t("community.contentBrowserNewDeck")}
          </Link>
        </div>
      </div>

      {children}
    </div>
  );
}
