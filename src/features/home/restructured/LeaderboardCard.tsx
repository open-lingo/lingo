import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { cn } from "@/shared/components/ui/cn";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useFriendsLeaderboard } from "@/features/social/hooks/useSocial";
import { userSlug } from "@/features/social/userSlug";
import { buildLeaderboardView } from "./leaderboardHelpers";

/**
 * Competitive friend leaderboard — answers "what are my friends doing?" with a
 * who's-beating-whom framing rather than a flat name list. Real data via
 * `useFriendsLeaderboard`. The viewer's row is highlighted, with a one-line
 * "X XP to pass {name}" nudge.
 */
export function LeaderboardCard() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const lb = useFriendsLeaderboard();
  const rows = lb.data ?? [];

  const { visible, myRow, aboveMe, xpToOvertake } = buildLeaderboardView(rows);

  return (
    <Card padding="md" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("home.restructured.leaderboard.kicker", { defaultValue: "This week" })}
          </p>
          <h2 className="mt-0.5 flex items-center gap-1.5 text-base font-semibold text-text-primary sm:text-lg">
            <Icon name="trophy" size={18} className="text-warning" aria-hidden />
            {t("home.restructured.leaderboard.headline", { defaultValue: "Leaderboard" })}
          </h2>
        </div>
        <Link
          to={langPath("social")}
          className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20"
        >
          <Icon name="plus" size={14} aria-hidden />
          {t("home.restructured.leaderboard.addCta", { defaultValue: "Add" })}
        </Link>
      </div>

      {lb.isLoading ? (
        <ul className="mt-3 space-y-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex animate-pulse items-center gap-3">
              <div className="h-5 w-5 rounded bg-border" />
              <div className="h-7 w-7 rounded-full bg-border" />
              <div className="h-3 flex-1 rounded bg-border" />
              <div className="h-3 w-12 rounded bg-border" />
            </li>
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <div className="mt-3 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted p-4 text-center">
          <p className="text-sm font-medium text-text-primary">
            {t("home.restructured.leaderboard.emptyTitle", { defaultValue: "No friends yet" })}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {t("home.restructured.leaderboard.emptyDesc", {
              defaultValue: "Add friends to see who's ahead.",
            })}
          </p>
        </div>
      ) : (
        <ol className="mt-3 space-y-1">
          {visible.map((row) => {
            const slug = userSlug({ username: row.user.username, name: row.user.name });
            const isLeader = row.rank === 1;
            return (
              <li
                key={`${row.rank}-${row.user.name}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-1.5",
                  row.isMe ? "bg-accent-muted" : "",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isLeader
                      ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900"
                      : row.isMe
                        ? "bg-accent text-on-accent"
                        : "bg-surface-muted text-text-secondary",
                  )}
                >
                  {isLeader ? <Icon name="crown" size={13} aria-hidden /> : row.rank}
                </span>
                <UserAvatar name={row.user.name} size="sm" status={row.user.status} />
                <Link
                  to={`/u/${slug}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary hover:underline"
                >
                  {row.isMe
                    ? t("home.restructured.leaderboard.you", { defaultValue: "You" })
                    : row.user.name}
                </Link>
                <span className="shrink-0 text-sm font-bold text-text-primary">
                  {row.xp.toLocaleString()}
                  <span className="ml-0.5 text-xs font-medium text-text-muted">XP</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-auto pt-2">
        {xpToOvertake && aboveMe ? (
          <p className="flex items-center gap-1 text-xs text-text-secondary">
            <Icon name="arrowRight" size={12} aria-hidden className="text-accent" />
            {t("home.restructured.leaderboard.toOvertake", {
              defaultValue: "{{n}} XP to pass {{name}}",
              n: xpToOvertake.toLocaleString(),
              name: aboveMe.user.name,
            })}
          </p>
        ) : myRow && myRow.rank === 1 ? (
          <p className="text-xs font-semibold text-success">
            {t("home.restructured.leaderboard.youLead", {
              defaultValue: "You're leading — defend the top!",
            })}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
