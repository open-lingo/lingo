/**
 * Friend-scoped leaderboard widget. More emotionally sticky than the
 * global board — competing with people you know hits harder than rank
 * #14,217. Shows the top friend, the user, and a "you vs friend median"
 * line so it doubles as a streak/effort gauge.
 */
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { UsernameDisplay } from "../components/UsernameDisplay";
import { useFriendsLeaderboard, useStreakSnapshot } from "../hooks/useSocial";

export function FriendsLeaderboardWidget() {
  const { t } = useTranslation();
  const lb = useFriendsLeaderboard();
  const streaks = useStreakSnapshot();

  if (lb.isLoading || streaks.isLoading || !lb.data || !streaks.data) {
    return <WidgetSkeleton />;
  }

  const rows = lb.data;
  if (rows.length === 0) {
    return (
      <Card padding="md">
        <p className="text-xs text-text-muted">
          {t(
            "social.friendsLb.empty",
            "Add friends to see how you stack up against people you know.",
          )}
        </p>
      </Card>
    );
  }

  const meIdx = rows.findIndex((r) => r.isMe);
  const myRow = meIdx >= 0 ? rows[meIdx] : null;
  const aboveMe = meIdx > 0 ? rows[meIdx - 1] : null;
  const top = rows[0];
  const xpToOvertake = aboveMe && myRow ? aboveMe.xp - myRow.xp + 1 : null;

  const streakDiff = streaks.data.mine - streaks.data.friendMedian;

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-muted text-accent">
          <Icon name="users" size={11} aria-hidden />
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {t("social.friendsLb.title", "Friend leaderboard")}
        </h3>
        <span className="ml-auto text-[10px] text-text-muted">
          {t("social.friendsLb.thisWeek", "This week")}
        </span>
      </div>

      <ul className="divide-y divide-border">
        {/* Top friend — suppressed when the leader IS the current user
            (friendless boards would otherwise show the same person twice:
            "Friend leader" chip above "#1 You"). */}
        {!top.isMe && (
          <li className="flex items-center gap-2.5 bg-surface px-3 py-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 shadow-sm">
              <Icon name="crown" size={12} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {t("social.friendsLb.leader", "Friend leader")}
              </p>
              <UsernameDisplay
                name={top.user.name}
                cosmetic={top.user.cosmetic}
                className="truncate text-sm"
              />
            </div>
            <p className="text-sm font-bold text-text-primary">
              {top.xp.toLocaleString()} XP
            </p>
          </li>
        )}

        {/* Me */}
        {myRow ? (
          <li className="flex items-center gap-2.5 bg-accent-muted px-3 py-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm text-[11px] font-bold">
              #{myRow.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {t("social.friendsLb.you", "You")}
              </p>
              <UsernameDisplay
                name={myRow.user.name}
                cosmetic={myRow.user.cosmetic}
                className="truncate text-sm"
              />
            </div>
            <p className="text-sm font-bold text-text-primary">
              {myRow.xp.toLocaleString()} XP
            </p>
          </li>
        ) : null}
      </ul>

      {/* Action line */}
      <div className="border-t border-border bg-surface-muted px-3 py-2 text-[11px]">
        {xpToOvertake && aboveMe ? (
          <p className="text-text-secondary">
            <Icon
              name="arrowRight"
              size={11}
              aria-hidden
              className="mr-1 inline-block align-middle"
            />
            {t("social.friendsLb.toOvertake", "{{n}} XP to pass {{name}}", {
              n: xpToOvertake.toLocaleString(),
              name: aboveMe.user.name,
            })}
          </p>
        ) : myRow && myRow.rank === 1 ? (
          <p className="font-semibold text-success">
            {t("social.friendsLb.youLead", "You're leading your friends — defend the top!")}
          </p>
        ) : null}
      </div>

      {/* Streak comparison strip */}
      <div className="flex items-center gap-2 border-t border-border bg-surface px-3 py-2 text-[11px]">
        <span className="inline-flex items-center gap-1 text-warning">
          <Icon name="flame" size={12} aria-hidden />
          <span className="font-bold">{streaks.data.mine}d</span>
        </span>
        <span className="text-text-muted">
          {t("social.streak.vsMedian", "vs. friend median {{n}}d", {
            n: streaks.data.friendMedian,
          })}
        </span>
        <span
          className={cn(
            "ml-auto font-semibold",
            streakDiff >= 0 ? "text-success" : "text-warning",
          )}
        >
          {streakDiff >= 0 ? `+${streakDiff}d` : `${streakDiff}d`}
        </span>
      </div>
    </Card>
  );
}

function WidgetSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="h-8 animate-pulse border-b border-border bg-surface-muted" />
      <div className="space-y-px bg-border">
        <div className="h-12 animate-pulse bg-surface" />
        <div className="h-12 animate-pulse bg-surface" />
      </div>
      <div className="h-7 animate-pulse bg-surface-muted" />
    </Card>
  );
}
