/**
 * Social page header. Compact single-row layout: avatar + name + you-stats
 * chips on the left, Messages / Add friend / Invite CTAs on the right.
 *
 * Display name and avatar come from the authenticated user (useAuth);
 * streak comes from useUserStats; league + weekly rank come from useSocial.
 */
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useAuth } from "@/shared/auth/useAuth";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { UserAvatar } from "./UserAvatar";
import { UsernameDisplay } from "./UsernameDisplay";
import { useSocial } from "../hooks/useSocial";

export function SocialHeader() {
  const langPath = useLangPath();
  const { user } = useAuth();
  const { stats } = useUserStats();
  const { me, league, weeklyLeaderboard, threads } = useSocial();
  const myRow = weeklyLeaderboard.find((r) => r.isMe);
  const unreadCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  const displayName =
    user?.nickname ?? user?.given_name ?? user?.name ?? me.name;

  return (
    <Card
      as="section"
      padding="none"
      className="flex flex-wrap items-center gap-3 bg-gradient-to-br from-accent/10 via-surface to-surface px-4 py-2.5 sm:flex-nowrap"
    >
      <UserAvatar
        name={displayName}
        frame={me.frame}
        status="active"
        size="md"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Social
          </p>
        </div>
        <h1 className="text-lg font-bold leading-tight text-text-primary">
          <UsernameDisplay name={displayName} cosmetic={me.cosmetic} />
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <StatChip
          icon="trophy"
          tone="accent"
          label={`${league.emoji} ${league.name}`}
          detail={myRow ? `#${myRow.rank}` : null}
        />
        <StatChip icon="flame" tone="warning" label={`${stats.streak}d`} />
        <StatChip
          icon="star"
          tone="success"
          label={`${myRow?.xp.toLocaleString() ?? 0} XP`}
          detail="/wk"
        />
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <Link
          to={langPath("messenger")}
          className="relative inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
        >
          <Icon name="messageCircle" size={13} aria-hidden />
          Messages
          {unreadCount > 0 ? (
            <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent">
              {unreadCount}
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent shadow-sm transition hover:bg-accent-hover"
        >
          <Icon name="userPlus" size={13} aria-hidden />
          Add friend
        </button>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
          aria-label="Invite friend"
        >
          <Icon name="link" size={13} aria-hidden />
        </button>
      </div>
    </Card>
  );
}

const TONE = {
  accent: "border-accent/30 bg-accent-muted text-accent",
  warning: "border-warning/30 bg-warning/10 text-warning",
  success: "border-success/30 bg-success/10 text-success",
};

function StatChip({
  icon,
  tone,
  label,
  detail,
}: {
  icon: "trophy" | "flame" | "star";
  tone: keyof typeof TONE;
  label: string;
  detail?: string | null;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONE[tone]}`}
    >
      <Icon name={icon} size={10} aria-hidden />
      <span>{label}</span>
      {detail ? <span className="font-bold">{detail}</span> : null}
    </span>
  );
}
