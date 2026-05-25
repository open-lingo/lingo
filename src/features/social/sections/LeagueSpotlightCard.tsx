/**
 * Hero league card pinned to the top of the social page. Shows:
 *   - league badge + name + tier
 *   - my current rank + day-over-day delta
 *   - top-3 chips
 *   - a tiny daily-XP sparkline vs. friend median
 *   - promotion / demotion banner when in either zone
 *
 * Clicking the "See full leaderboard" link jumps to the leaderboards
 * section (in-page anchor) or `/leaderboard` if mounted standalone.
 */
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { UsernameDisplay } from "../components/UsernameDisplay";
import { useLeagueSpotlight, useWeeklyLeaderboard } from "../hooks/useSocial";

export type LeagueSpotlightCardProps = {
  /** When provided, the "See full" CTA scrolls to this in-page id. */
  scrollToId?: string;
  /** Compact rendering for the right rail / mobile. */
  compact?: boolean;
};

export function LeagueSpotlightCard({
  scrollToId,
  compact = false,
}: LeagueSpotlightCardProps) {
  const { t } = useTranslation();
  const spotlight = useLeagueSpotlight();
  const board = useWeeklyLeaderboard();

  if (spotlight.isLoading || board.isLoading || !spotlight.data || !board.data) {
    return <SpotlightSkeleton compact={compact} />;
  }

  const { league, myRow, rankDeltaToday, dailyXp, friendMedianDaily } = spotlight.data;
  const rows = board.data;
  const top3 = rows.slice(0, 3);
  const myRank = myRow?.rank ?? null;
  const inPromoteZone = myRank !== null && myRank <= league.promotionZone;
  const inDemoteZone =
    myRank !== null && myRank >= rows.length - league.demotionZone + 1;

  const myDailyTotal = dailyXp.reduce((s, n) => s + n, 0);
  const medianDailyTotal = friendMedianDaily.reduce((s, n) => s + n, 0);
  const diff = myDailyTotal - medianDailyTotal;

  const handleSeeFull = () => {
    if (!scrollToId) return;
    document
      .getElementById(scrollToId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Hero band */}
      <div className="flex flex-col gap-3 bg-gradient-to-br from-accent/20 via-accent-muted to-surface px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface text-3xl shadow-sm">
            <span aria-hidden>{league.emoji}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {t("social.spotlight.currentLeague", "Current league")}
            </p>
            <h2 className="text-xl font-bold leading-tight text-text-primary">
              {league.name}
            </h2>
            <p className="text-[11px] text-text-muted">
              {t("social.spotlight.tierOf", "Tier {{n}} of {{total}}", {
                n: league.tierIndex,
                total: league.tierTotal,
              })}{" "}
              · {league.resetLabel}
            </p>
          </div>
        </div>

        {/* Rank pill */}
        {myRank !== null ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-sm sm:ml-auto">
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {t("social.spotlight.yourRank", "Your rank")}
              </p>
              <p className="text-2xl font-bold leading-none text-text-primary">
                #{myRank}
              </p>
            </div>
            <RankDeltaBadge delta={rankDeltaToday} />
          </div>
        ) : null}
      </div>

      {/* Promotion / demotion banner */}
      {inPromoteZone ? (
        <div className="flex items-center gap-2 border-t border-success/30 bg-success/10 px-5 py-2 text-xs font-semibold text-success">
          <Icon name="chevronUp" size={14} aria-hidden />
          {t(
            "social.spotlight.inPromoteZone",
            "You're in the promotion zone — keep it up!",
          )}
        </div>
      ) : inDemoteZone ? (
        <div className="flex items-center gap-2 border-t border-warning/30 bg-warning/10 px-5 py-2 text-xs font-semibold text-warning">
          <Icon name="chevronDown" size={14} aria-hidden />
          {t(
            "social.spotlight.inDemoteZone",
            "You're in the demotion zone — a couple lessons could pull you out.",
          )}
        </div>
      ) : null}

      {/* Top-3 + sparkline row */}
      {!compact ? (
        <div className="grid gap-px border-t border-border bg-border sm:grid-cols-[1fr_220px]">
          <div className="bg-surface px-5 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {t("social.spotlight.podium", "This week's podium")}
            </p>
            <ol className="flex items-center gap-2">
              {top3.map((row) => (
                <li
                  key={row.user.id}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5"
                >
                  <PodiumRank rank={row.rank} />
                  <UsernameDisplay
                    name={row.user.name}
                    cosmetic={row.user.cosmetic}
                    className="truncate text-xs"
                  />
                  <span className="ml-auto shrink-0 text-[11px] font-bold text-text-primary">
                    {row.xp.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="bg-surface px-5 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {t("social.spotlight.thisWeek", "This week vs. friend median")}
            </p>
            <DailyBars mine={dailyXp} median={friendMedianDaily} />
            <p
              className={cn(
                "mt-1 text-[11px] font-semibold",
                diff >= 0 ? "text-success" : "text-warning",
              )}
            >
              {diff >= 0
                ? t("social.spotlight.aheadBy", "+{{n}} XP ahead", {
                    n: diff.toLocaleString(),
                  })
                : t("social.spotlight.behindBy", "{{n}} XP behind", {
                    n: Math.abs(diff).toLocaleString(),
                  })}
            </p>
          </div>
        </div>
      ) : null}

      {scrollToId ? (
        <button
          type="button"
          onClick={handleSeeFull}
          className="flex w-full items-center justify-center gap-1 border-t border-border bg-surface-muted px-3 py-2 text-[12px] font-semibold text-accent hover:bg-accent-muted"
        >
          {t("social.spotlight.seeFull", "See full leaderboard")} →
        </button>
      ) : null}
    </Card>
  );
}

function RankDeltaBadge({ delta }: { delta: number }) {
  const { t } = useTranslation();
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-text-muted">
        {t("social.spotlight.deltaSame", "—")}
      </span>
    );
  }
  const isUp = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
        isUp ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
      )}
      aria-label={
        isUp
          ? t("social.spotlight.deltaUp", "up {{n}} since yesterday", { n: delta })
          : t("social.spotlight.deltaDown", "down {{n}} since yesterday", {
              n: Math.abs(delta),
            })
      }
    >
      <Icon name={isUp ? "chevronUp" : "chevronDown"} size={12} aria-hidden />
      {Math.abs(delta)}
    </span>
  );
}

function PodiumRank({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900",
    2: "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800",
    3: "bg-gradient-to-br from-amber-500 to-amber-700 text-amber-50",
  };
  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
        colors[rank] ?? "bg-surface-muted text-text-secondary",
      )}
    >
      {rank === 1 ? <Icon name="crown" size={10} aria-hidden /> : rank}
    </span>
  );
}

function DailyBars({ mine, median }: { mine: number[]; median: number[] }) {
  const max = Math.max(...mine, ...median, 1);
  return (
    <div className="flex h-12 items-end gap-1.5" aria-hidden>
      {mine.map((v, i) => {
        const mineH = Math.round((v / max) * 100);
        const medianH = Math.round((median[i] / max) * 100);
        return (
          <div key={i} className="flex flex-1 items-end gap-0.5">
            <span
              className="block flex-1 rounded-sm bg-accent"
              style={{ height: `${Math.max(mineH, 4)}%` }}
            />
            <span
              className="block flex-1 rounded-sm bg-text-muted/30"
              style={{ height: `${Math.max(medianH, 4)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function SpotlightSkeleton({ compact }: { compact: boolean }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-3 bg-surface-muted px-5 py-4">
        <div className="h-14 w-14 animate-pulse rounded-2xl bg-border" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-border" />
          <div className="h-5 w-40 animate-pulse rounded bg-border" />
          <div className="h-3 w-32 animate-pulse rounded bg-border" />
        </div>
      </div>
      {!compact ? (
        <div className="grid grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-2">
          <div className="h-20 animate-pulse bg-surface" />
          <div className="h-20 animate-pulse bg-surface" />
        </div>
      ) : null}
    </Card>
  );
}
