/**
 * Left navigation rail for the social surface.
 *
 * Desktop (≥lg): a sticky vertical sidebar — identity header at the top
 * (avatar + name + quick stat chips), a primary "Add friend" CTA that opens
 * the search modal, then the tab nav buttons.
 *
 * Mobile (<lg): the same nav renders as a horizontal scrollable tab strip
 * (see `SocialPage`); this component is the desktop rail only.
 *
 * The avatar is resolved from `useMe()` (server `profile_picture_key`) with
 * the Auth0 user as fallback — the previous header only read the Auth0
 * `picture`, so users who uploaded an avatar but have no IdP picture rendered
 * a blank initial.
 */
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { cn } from "@/shared/components/ui/cn";
import { useAuth } from "@/shared/auth/useAuth";
import { useMe } from "@/shared/hooks/useMe";
import { resolveUserAvatarUrl } from "@/shared/auth/resolveUserAvatarUrl";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { UserAvatar } from "./UserAvatar";
import { UsernameDisplay } from "./UsernameDisplay";
import { useSocial } from "../hooks/useSocial";
import type { SocialTab } from "../socialTabs";
import { SOCIAL_TABS } from "../socialTabs";

type Props = {
  activeTab: SocialTab;
  onSelect: (tab: SocialTab) => void;
  onAddFriend: () => void;
  /** Unread message count, surfaced as a badge on the Messages tab. */
  unreadCount: number;
  /** Pending incoming friend requests, surfaced on the Friends tab. */
  requestCount: number;
};

const TAB_ICON: Record<SocialTab, IconName> = {
  overview: "sparkles",
  friends: "users",
  league: "trophy",
  messages: "messageCircle",
};

export function SocialSidebar({
  activeTab,
  onSelect,
  onAddFriend,
  unreadCount,
  requestCount,
}: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { me } = useMe();
  const { stats } = useUserStats();
  const { league, weeklyLeaderboard } = useSocial();

  const displayName =
    me?.display_name?.trim() ||
    user?.nickname ||
    user?.given_name ||
    user?.name ||
    "";
  const avatarUrl = resolveUserAvatarUrl(me ?? undefined, user ?? undefined);
  const myRow = weeklyLeaderboard.find((r) => r.isMe);

  return (
    <aside className="flex w-full flex-col gap-3">
      <div className="rounded-card border border-border bg-gradient-to-br from-accent/10 via-surface to-surface p-3">
        <div className="flex items-center gap-2.5">
          <UserAvatar
            name={displayName || "?"}
            imageUrl={avatarUrl}
            status="active"
            size="md"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {t("social.title", "Social")}
            </p>
            <h1 className="truncate text-base font-bold leading-tight text-text-primary">
              <UsernameDisplay name={displayName} />
            </h1>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {league ? (
            <StatChip
              icon="trophy"
              label={`${league.emoji} ${league.name}`}
              detail={myRow ? `#${myRow.rank}` : null}
            />
          ) : null}
          <StatChip icon="flame" label={`${stats.streak}d`} />
          <StatChip
            icon="star"
            label={`${myRow?.xp.toLocaleString() ?? 0} XP`}
            detail="/wk"
          />
        </div>

        <button
          type="button"
          onClick={onAddFriend}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-on-accent shadow-sm transition hover:bg-accent-hover"
        >
          <Icon name="userPlus" size={15} aria-hidden />
          {t("social.addFriend.add", "Add friend")}
        </button>
      </div>

      <nav
        className="flex flex-col gap-0.5 rounded-xl border border-border bg-surface p-1.5"
        aria-label={t("social.mobileNav.aria", "Social sections")}
      >
        {SOCIAL_TABS.map((tab) => {
          const isActive = tab === activeTab;
          const badge =
            tab === "messages" ? unreadCount : tab === "friends" ? requestCount : 0;
          return (
            <button
              key={tab}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSelect(tab)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition",
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
              )}
            >
              <Icon name={TAB_ICON[tab]} size={16} aria-hidden />
              <span className="flex-1 text-left">{tabLabel(t, tab)}</span>
              {badge > 0 ? (
                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export function tabLabel(
  t: (key: string, def: string) => string,
  tab: SocialTab,
): string {
  switch (tab) {
    case "overview":
      return t("social.tabs.overview", "Overview");
    case "friends":
      return t("social.tabs.friends", "Friends");
    case "league":
      return t("social.tabs.league", "League");
    case "messages":
      return t("social.tabs.messages", "Messages");
  }
}

function StatChip({
  icon,
  label,
  detail,
}: {
  icon: IconName;
  label: string;
  detail?: string | null;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
      <Icon name={icon} size={10} aria-hidden />
      <span>{label}</span>
      {detail ? <span className="font-bold text-text-primary">{detail}</span> : null}
    </span>
  );
}
