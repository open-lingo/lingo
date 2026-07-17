/**
 * Social page — sidebar-driven tabbed layout.
 *
 * Desktop (≥lg): a sticky left `SocialSidebar` (identity + Add-friend CTA +
 *   tab nav) beside a content pane that renders the active tab.
 * Mobile (<lg): the nav collapses to a horizontal scrollable tab strip above
 *   the content pane.
 *
 * Tabs (URL-synced via `?tab=`):
 *   - overview : LeagueSpotlight (compact) + friends-only activity feed +
 *                friends leaderboard widget + invite card.
 *   - friends  : friends list (search/menu) + requests + suggestions.
 *   - league   : full league spotlight + unified leaderboards (weekly /
 *                monthly / friends) so you can see where you stand.
 */
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { cn } from "@/shared/components/ui/cn";
import { FindFriendModal } from "./components/FindFriendModal";
import { LeaguesModal } from "./components/LeaguesModal";
import { SocialSidebar, tabLabel } from "./components/SocialSidebar";
import { useSocial } from "./hooks/useSocial";
import { ActivityFeedStrip } from "./sections/ActivityFeedStrip";
import {
  FriendsSearchAndList,
  FriendRequestsPanel,
  FriendSuggestionsPanel,
} from "./sections/FriendsSection";
import { CompactUnifiedLeaderboardCard } from "./sections/LeaderboardsSection";
import { LeagueSpotlightCard } from "./sections/LeagueSpotlightCard";
import { FriendsLeaderboardWidget } from "./sections/FriendsLeaderboardWidget";
import { InviteFriendsCard } from "./sections/InviteFriendsCard";
import {
  DEFAULT_SOCIAL_TAB,
  SOCIAL_TABS,
  isSocialTab,
  type SocialTab,
} from "./socialTabs";

const TAB_ICON: Record<SocialTab, IconName> = {
  overview: "sparkles",
  friends: "users",
  league: "trophy",
};

export default function SocialPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [findFriendOpen, setFindFriendOpen] = useState(false);

  const tabParam = params.get("tab");
  const activeTab: SocialTab = isSocialTab(tabParam) ? tabParam : DEFAULT_SOCIAL_TAB;

  const setTab = useCallback(
    (tab: SocialTab) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === DEFAULT_SOCIAL_TAB) next.delete("tab");
          else next.set("tab", tab);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // Counts for nav badges. `useSocial` batches its queries so reading it here
  // doesn't add network round-trips beyond what the panes already fetch.
  const { friendRequests } = useSocial();
  const requestCount = friendRequests.length;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
      <FindFriendModal open={findFriendOpen} onClose={() => setFindFriendOpen(false)} />

      {/* Desktop sidebar */}
      <div className="hidden w-60 shrink-0 lg:block lg:sticky lg:top-4">
        <SocialSidebar
          activeTab={activeTab}
          onSelect={setTab}
          onAddFriend={() => setFindFriendOpen(true)}
          requestCount={requestCount}
        />
      </div>

      {/* Mobile tab strip */}
      <nav
        className="-mx-1 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1 lg:hidden"
        role="tablist"
        aria-label={t("social.mobileNav.aria", "Social sections")}
      >
        {SOCIAL_TABS.map((tab) => {
          const isActive = tab === activeTab;
          const badge = tab === "friends" ? requestCount : 0;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(tab)}
              className={cn(
                "relative flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition",
                isActive
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
              )}
            >
              <Icon name={TAB_ICON[tab]} size={15} aria-hidden />
              <span>{tabLabel(t, tab)}</span>
              {badge > 0 ? (
                <span
                  className={cn(
                    "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    isActive ? "bg-accent-foreground text-accent" : "bg-accent text-accent-foreground",
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Mobile Add-friend CTA (sidebar holds it on desktop). */}
      <button
        type="button"
        onClick={() => setFindFriendOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent-hover lg:hidden"
      >
        <Icon name="userPlus" size={15} aria-hidden />
        {t("social.addFriend.add", "Add friend")}
      </button>

      {/* Content pane */}
      <div className="min-w-0 flex-1">
        {activeTab === "overview" ? <OverviewTab /> : null}
        {activeTab === "friends" ? <FriendsTab /> : null}
        {activeTab === "league" ? <LeagueTab /> : null}
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="flex flex-col gap-3">
      <LeagueSpotlightCard scrollToId="leaderboards" compact />
      <ActivityFeedStrip />
      <div className="grid gap-3 sm:grid-cols-2">
        <FriendsLeaderboardWidget />
        <InviteFriendsCard />
      </div>
    </div>
  );
}

function FriendsTab() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid items-start gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <FriendsSearchAndList />
        </div>
        <div className="flex flex-col gap-3">
          <FriendRequestsPanel />
          <FriendSuggestionsPanel />
          <InviteFriendsCard />
        </div>
      </div>
    </div>
  );
}

function LeagueTab() {
  const { t } = useTranslation();
  const { league } = useSocial();
  const [leaguesOpen, setLeaguesOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <LeaguesModal
        open={leaguesOpen}
        onClose={() => setLeaguesOpen(false)}
        currentTierIndex={league?.tierIndex ?? null}
      />
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">
          {t("social.tabs.league", "League")}
        </h2>
        <button
          type="button"
          onClick={() => setLeaguesOpen(true)}
          data-testid="view-all-leagues-trigger"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-secondary shadow-sm transition hover:bg-surface-muted hover:text-text-primary"
        >
          {t("social.leagues.viewAll", "View all leagues")}
          <Icon name="chevronRight" size={13} aria-hidden />
        </button>
      </div>
      <LeagueSpotlightCard scrollToId="leaderboards" />
      <section id="leaderboards" aria-label="Full leaderboards">
        <CompactUnifiedLeaderboardCard limit={20} />
      </section>
    </div>
  );
}
