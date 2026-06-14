import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { TabList, TabLink } from "@/shared/components/ui/Tabs";
import { CommunityRightRail } from "./CommunityRightRail";

type CommunityDecksLayoutProps = {
  /** Optional search input rendered next to the New Deck CTA in the header row. */
  searchSlot?: ReactNode;
  /** Optional override for the right rail. */
  rightRail?: ReactNode;
  /** Suppress the default right rail entirely (for editor / focused-form pages). */
  hideRightRail?: boolean;
  children: ReactNode;
};

export function CommunityDecksLayout({
  searchSlot,
  rightRail,
  hideRightRail = false,
  children,
}: CommunityDecksLayoutProps) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { pathname } = useLocation();

  const exploreTo = langPath("community/explore");
  const subscribedTo = langPath("community/subscribed");
  const mineTo = langPath("community/decks/mine");
  const contributorsTo = langPath("community/contributors");
  const newTo = langPath("community/decks/new");

  const isExplore =
    pathname === exploreTo ||
    pathname.endsWith("/community") ||
    pathname.endsWith("/community/explore");
  const isSubscribed = pathname.endsWith("/community/subscribed");
  const isMine = pathname.endsWith("/community/decks/mine");
  const isContributors = pathname.includes("/community/contributors");

  const showRail = !hideRightRail;

  // Counts intentionally not rendered on tab labels: the async-loading badge
  // caused a width shift, and the counts added noise (Browse total is
  // irrelevant; Subscribed/Mine are surfaced inside the pages).
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <TabList
          aria-label={t("community.contentBrowserTabsLabel", "Deck views")}
          className="border-b-0 pb-0"
        >
          <TabLink to={exploreTo} isActive={isExplore}>
            <span>{t("community.contentBrowserTabBrowse")}</span>
          </TabLink>
          <TabLink to={subscribedTo} isActive={isSubscribed}>
            <span>{t("community.contentBrowserTabSubscribed")}</span>
          </TabLink>
          <TabLink to={mineTo} isActive={isMine}>
            <span>{t("community.contentBrowserTabMine")}</span>
          </TabLink>
          <TabLink to={contributorsTo} isActive={isContributors}>
            <span>{t("community.contentBrowserTabContributors", "Contributors")}</span>
          </TabLink>
        </TabList>
        <div className="flex items-center gap-2">
          {searchSlot}
          <Link
            to={newTo}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover"
          >
            <Icon name="plus" size={16} aria-hidden />
            {t("community.contentBrowserNewDeck")}
          </Link>
        </div>
      </div>

      {showRail ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0">{children}</div>
          <aside className="hidden lg:block">
            <div className="sticky top-4">{rightRail ?? <CommunityRightRail />}</div>
          </aside>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
