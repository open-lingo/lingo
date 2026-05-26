import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useApi } from "@/shared/api/provider";
import { TabList, TabLink } from "@/shared/components/ui/Tabs";
import { CommunityRightRail } from "./CommunityRightRail";

type CommunityDecksLayoutProps = {
  /** Browse count — explore page provides its filtered count; others omit it. */
  browseCount?: number;
  /** Optional search input rendered next to the New Deck CTA in the header row. */
  searchSlot?: ReactNode;
  /** Optional override for the right rail. */
  rightRail?: ReactNode;
  /** Suppress the default right rail entirely (for editor / focused-form pages). */
  hideRightRail?: boolean;
  children: ReactNode;
};

export function CommunityDecksLayout({
  browseCount,
  searchSlot,
  rightRail,
  hideRightRail = false,
  children,
}: CommunityDecksLayoutProps) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { pathname } = useLocation();
  const { decks: decksApi, users: usersApi } = useApi();

  const [myDecksCount, setMyDecksCount] = useState<number | undefined>(undefined);
  const [subscribedCount, setSubscribedCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    let ok = true;
    decksApi
      .listMyDecks({ exclude_companion_decks: true })
      .then((decks) => {
        if (ok) setMyDecksCount(decks.length);
      })
      .catch(() => {
        if (ok) setMyDecksCount(0);
      });
    return () => {
      ok = false;
    };
  }, [decksApi]);

  useEffect(() => {
    let ok = true;
    usersApi
      .getSubscriptions({ contentType: "deck" })
      .then((subs) => {
        if (!ok) return;
        setSubscribedCount(subs.length);
      })
      .catch(() => {
        if (ok) setSubscribedCount(0);
      });
    return () => {
      ok = false;
    };
  }, [usersApi]);

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

  // Why: counts intentionally not rendered on the tab labels per maintainer.
  // The async-loading count badge caused a width shift, and the counts
  // themselves added noise (Browse total is irrelevant; Subscribed/Mine are
  // surfaced inside the pages).
  function tabLabel(label: string, _count: number | undefined) {
    return <span>{label}</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <TabList
          aria-label={t("community.contentBrowserTabsLabel", "Deck views")}
          className="border-b-0 pb-0"
        >
          <TabLink to={exploreTo} isActive={isExplore}>
            {tabLabel(t("community.contentBrowserTabBrowse"), browseCount)}
          </TabLink>
          <TabLink to={subscribedTo} isActive={isSubscribed}>
            {tabLabel(t("community.contentBrowserTabSubscribed"), subscribedCount)}
          </TabLink>
          <TabLink to={mineTo} isActive={isMine}>
            {tabLabel(t("community.contentBrowserTabMine"), myDecksCount)}
          </TabLink>
          <TabLink to={contributorsTo} isActive={isContributors}>
            {tabLabel(t("community.contentBrowserTabContributors", "Contributors"), undefined)}
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
