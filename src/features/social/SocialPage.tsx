/**
 * Social page — responsive layout.
 *
 * Mobile (<lg): 3-tab strip — Spotlight / Friends / Messages.
 *   Spotlight tab: LeagueSpotlightCard (compact) + FriendsLeaderboardWidget
 *     + ActivityFeedStrip + InviteFriendsCard.
 *   Friends tab:   FriendsSearchAndList + InviteFriendsCard + FriendRequests
 *     + FriendSuggestions + ActivityFeedStrip.
 *   Messages tab:  MessagesSection.
 *
 * Desktop (≥lg): full-width LeagueSpotlightCard, then a 12-col grid:
 *   - col-span-8: ActivityFeedStrip + FriendsSearchAndList
 *   - col-span-4: FriendsLeaderboardWidget + InviteFriendsCard
 *                  + FriendRequestsPanel + FriendSuggestionsPanel
 *                  + CompactUnifiedLeaderboardCard
 *   The leaderboard card anchors `#leaderboards` for the spotlight
 *   "See full leaderboard" jump.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { LeaguesModal } from "./components/LeaguesModal";
import { SocialHeader } from "./components/SocialHeader";
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
import { MessagesSection } from "./sections/MessagesSection";

type MobileTab = "spotlight" | "friends" | "messages";

export default function SocialPage() {
  const { t } = useTranslation();
  const [mobileTab, setMobileTab] = useState<MobileTab>("spotlight");
  const [leaguesOpen, setLeaguesOpen] = useState(false);
  // Pull the league info via useSocial so the modal knows which row to
  // highlight as "You're here". Falls back to null when unavailable.
  const social = useSocial();
  const currentTierIndex = social.league?.tierIndex ?? null;

  return (
    <div className="flex flex-col gap-3">
      <SocialHeader />

      <LeaguesModal
        open={leaguesOpen}
        onClose={() => setLeaguesOpen(false)}
        currentTierIndex={currentTierIndex}
      />

      {/* Mobile: 3-tab strip */}
      <nav
        className="flex gap-1 rounded-xl border border-border bg-surface p-1 lg:hidden"
        role="tablist"
        aria-label={t("social.mobileNav.aria", "Social sections")}
      >
        <MobileTabButton
          tab="spotlight"
          active={mobileTab}
          onClick={setMobileTab}
          icon="trophy"
          label={t("social.mobileNav.spotlight", "Spotlight")}
        />
        <MobileTabButton
          tab="friends"
          active={mobileTab}
          onClick={setMobileTab}
          icon="users"
          label={t("social.mobileNav.friends", "Friends")}
        />
        <MobileTabButton
          tab="messages"
          active={mobileTab}
          onClick={setMobileTab}
          icon="messageCircle"
          label={t("social.mobileNav.messages", "Messages")}
        />
      </nav>

      {/* Mobile panes — one visible at a time, all hidden ≥lg. */}
      <div className={cn("flex flex-col gap-3 lg:hidden")}>
        {mobileTab === "spotlight" ? (
          <>
            <LeagueSpotlightCard scrollToId="leaderboards" compact />
            <ViewAllLeaguesButton onOpen={() => setLeaguesOpen(true)} />
            <FriendsLeaderboardWidget />
            <ActivityFeedStrip />
            <InviteFriendsCard />
          </>
        ) : null}
        {mobileTab === "friends" ? (
          <>
            <FriendsSearchAndList />
            <InviteFriendsCard />
            <FriendRequestsPanel />
            <FriendSuggestionsPanel />
            <ActivityFeedStrip />
          </>
        ) : null}
        {mobileTab === "messages" ? <MessagesSection /> : null}
      </div>

      {/* Desktop: spotlight full-width, then 12-col grid. */}
      <div className="hidden flex-col gap-3 lg:flex">
        <LeagueSpotlightCard scrollToId="leaderboards" />
        <ViewAllLeaguesButton onOpen={() => setLeaguesOpen(true)} />

        <ActivityFeedStrip />

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-8 flex flex-col gap-3">
            <FriendsSearchAndList />
          </div>
          <div className="col-span-4 flex flex-col gap-3">
            <FriendsLeaderboardWidget />
            <InviteFriendsCard />
            <FriendRequestsPanel />
            <FriendSuggestionsPanel />
            <section id="leaderboards" aria-label="Full leaderboards">
              <CompactUnifiedLeaderboardCard />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewAllLeaguesButton({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="view-all-leagues-trigger"
      className="self-start rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary shadow-sm hover:bg-surface-muted hover:text-text-primary"
    >
      {t("social.leagues.viewAll", "View all leagues")} →
    </button>
  );
}

function MobileTabButton({
  tab,
  active,
  onClick,
  icon,
  label,
}: {
  tab: MobileTab;
  active: MobileTab;
  onClick: (t: MobileTab) => void;
  icon: "trophy" | "users" | "messageCircle";
  label: string;
}) {
  const isActive = tab === active;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onClick(tab)}
      className={cn(
        "flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition",
        isActive
          ? "bg-accent text-on-accent shadow-sm"
          : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
      )}
    >
      <Icon name={icon} size={15} aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}
