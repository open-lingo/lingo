/**
 * Leaderboards tab — segmented control across Weekly Sprint / Monthly /
 * Friends. Weekly uses a Duolingo-style league card with promotion +
 * demotion zones; Monthly + Friends use plain top-N tables.
 *
 * Wired to the real social API via `useWeeklyLeaderboard`,
 * `useMonthlyLeaderboard`, `useFriendsLeaderboard`, and `useLeagueSpotlight`
 * (the latter gives us the league name/emoji/zone metadata that used to come
 * from `MOCK_LEAGUE`). Skeleton + empty states are surfaced inline so the
 * card can stand alone on the social page.
 */
import { useState } from "react";
import { userSlug } from "@/features/social/userSlug";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { UsernameDisplay } from "../components/UsernameDisplay";
import { ProfilePreviewPopover } from "../components/ProfilePreviewPopover";
import { useLangPath } from "@/shared/hooks/useLangPath";
import {
  useFriendsLeaderboard,
  useLeaderboardBundle,
  useLeagueSpotlight,
  useMonthlyLeaderboard,
  useWeeklyLeaderboard,
} from "../hooks/useSocial";
import type { LeaderboardRow } from "../mock/mockSocial";
import type { LeagueSpotlight } from "../hooks/useSocial.types";

type Tab = "weekly" | "monthly" | "friends";

const TABS: { id: Tab; labelKey: string; fallback: string; iconName: "flame" | "trophy" | "users" }[] = [
  { id: "weekly", labelKey: "social.leaderboards.tabWeekly", fallback: "Weekly Sprint", iconName: "flame" },
  { id: "monthly", labelKey: "social.leaderboards.tabMonthly", fallback: "Monthly", iconName: "trophy" },
  { id: "friends", labelKey: "social.leaderboards.tabFriends", fallback: "Friends", iconName: "users" },
];

export function LeaderboardsSection() {
  return <UnifiedLeaderboardCard />;
}

/**
 * Single Card containing all three leaderboard variants behind a tab
 * switcher. Header carries the section title + period info so this card can
 * stand alone on the social page.
 */
export function UnifiedLeaderboardCard() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("weekly");
  // Single batched fetch covers all four reads (weekly + monthly + friends +
  // spotlight). React Query dedupes the request when LeagueSpotlightCard
  // mounts on the same page, so the social page still fires only one call.
  const bundle = useLeaderboardBundle();

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Card header */}
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted text-accent">
            <Icon name="trophy" size={18} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("social.leaderboards.kicker", "Leaderboards")}
            </p>
            <h2 className="text-lg font-semibold text-text-primary">
              {t("social.leaderboards.title", "This sprint and beyond")}
            </h2>
          </div>
        </div>
        <p className="text-xs text-text-muted sm:text-right">
          {t(
            "social.leaderboards.resetCadence",
            "Weekly resets Sunday · Monthly resets the 1st",
          )}
        </p>
      </div>

      {/* Tab strip */}
      <div className="flex border-b border-border bg-surface-muted px-2 pt-2">
        {TABS.map((tabDef) => {
          const isActive = tab === tabDef.id;
          return (
            <button
              key={tabDef.id}
              type="button"
              onClick={() => setTab(tabDef.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold transition",
                isActive
                  ? "text-accent"
                  : "text-text-secondary hover:text-text-primary",
              )}
              aria-pressed={isActive}
            >
              <Icon name={tabDef.iconName} size={14} aria-hidden />
              {t(tabDef.labelKey, tabDef.fallback)}
              {isActive ? (
                <span
                  aria-hidden
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Tab body — flush content, no inner padding so league/board cards
          render edge-to-edge with the card border. */}
      <div>
        {tab === "weekly" ? (
          <WeeklyLeagueBody
            spotlight={bundle.data?.spotlight ?? null}
            rows={bundle.data?.weekly ?? []}
            isLoading={bundle.isLoading}
          />
        ) : null}
        {tab === "monthly" ? (
          <MonthlyBody rows={bundle.data?.monthly ?? []} isLoading={bundle.isLoading} />
        ) : null}
        {tab === "friends" ? (
          <FriendsBody rows={bundle.data?.friends ?? []} isLoading={bundle.isLoading} />
        ) : null}
      </div>
    </Card>
  );
}

/**
 * Narrow-rail variant of the unified card. Compact tab strip, no card header
 * (the inline "League" pill replaces it), 5-row preview per tab with a
 * "See full" link out to the dedicated leaderboards page. Designed to slot
 * into a ~360-420px wide column on the social page right rail.
 */
export function CompactUnifiedLeaderboardCard({
  limit = 5,
}: { limit?: number } = {}) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const [tab, setTab] = useState<Tab>("weekly");
  const spotlight = useLeagueSpotlight();
  const weekly = useWeeklyLeaderboard();
  const monthly = useMonthlyLeaderboard();
  const friends = useFriendsLeaderboard();

  const resetLabel = spotlight.data?.league.resetLabel ?? "";

  return (
    <Card padding="none" className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-muted text-accent">
          <Icon name="trophy" size={11} aria-hidden />
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {t("social.leaderboards.kicker", "Leaderboards")}
        </h3>
        {resetLabel ? (
          <p className="ml-auto text-[10px] text-text-muted">{resetLabel}</p>
        ) : null}
      </div>

      <div className="flex border-b border-border bg-surface-muted">
        {TABS.map((tabDef) => {
          const isActive = tab === tabDef.id;
          return (
            <button
              key={tabDef.id}
              type="button"
              onClick={() => setTab(tabDef.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-semibold transition",
                isActive
                  ? "text-accent"
                  : "text-text-secondary hover:text-text-primary",
              )}
              aria-pressed={isActive}
            >
              <Icon name={tabDef.iconName} size={11} aria-hidden />
              {t(tabDef.labelKey, tabDef.fallback)}
              {isActive ? (
                <span
                  aria-hidden
                  className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-accent"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "weekly" ? (
        <CompactRows
          rows={weekly.data ?? []}
          isLoading={weekly.isLoading}
          limit={limit}
          pillEmoji={spotlight.data?.league.emoji}
          pillLabel={spotlight.data?.league.name}
        />
      ) : null}
      {tab === "monthly" ? (
        <CompactRows
          rows={monthly.data ?? []}
          isLoading={monthly.isLoading}
          limit={limit}
        />
      ) : null}
      {tab === "friends" ? (
        <CompactRows
          rows={friends.data ?? []}
          isLoading={friends.isLoading}
          limit={limit}
        />
      ) : null}

      <Link
        to={langPath("community/leaderboard")}
        className="mt-auto border-t border-border bg-surface-muted px-3 py-1.5 text-center text-[11px] font-medium text-accent hover:bg-accent-muted"
      >
        {t("social.leaderboards.seeFull", "See full leaderboard →")}
      </Link>
    </Card>
  );
}

function CompactRows({
  rows,
  isLoading,
  limit,
  pillEmoji,
  pillLabel,
}: {
  rows: LeaderboardRow[];
  isLoading: boolean;
  limit: number;
  pillEmoji?: string;
  pillLabel?: string;
}) {
  const { t } = useTranslation();
  if (isLoading) return <CompactRowsSkeleton count={limit} />;
  if (rows.length === 0) {
    return (
      <p className="px-3 py-4 text-center text-[11px] text-text-muted">
        {t("social.leaderboards.empty", "No rankings yet. Earn some XP to land on the board!")}
      </p>
    );
  }

  const meIdx = rows.findIndex((r) => r.isMe);
  // Top N + always include "me" if outside the window.
  const baseIndexes = new Set<number>();
  for (let i = 0; i < Math.min(limit, rows.length); i++) baseIndexes.add(i);
  if (meIdx >= 0 && !baseIndexes.has(meIdx)) baseIndexes.add(meIdx);
  const visible = [...baseIndexes].sort((a, b) => a - b);

  return (
    <div className="flex flex-1 flex-col">
      {pillLabel ? (
        <div className="flex items-center gap-2 border-b border-border bg-gradient-to-br from-accent/15 via-accent-muted to-surface px-3 py-1.5">
          {pillEmoji ? (
            <span aria-hidden className="text-base">
              {pillEmoji}
            </span>
          ) : null}
          <p className="text-[11px] font-bold text-text-primary">{pillLabel}</p>
        </div>
      ) : null}
      <ul className="divide-y divide-border">
        {visible.map((idx, i) => {
          const row = rows[idx];
          const prev = i > 0 ? visible[i - 1] : -1;
          const gap = prev >= 0 && idx - prev > 1;
          return (
            <li key={row.user.id}>
              {gap ? (
                <div className="border-t border-dashed border-border bg-surface-muted px-3 py-0.5 text-center text-[9px] tracking-widest text-text-muted">
                  · · ·
                </div>
              ) : null}
              <Link
                to={`/u/${userSlug(row.user)}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  row.isMe ? "bg-accent-muted" : "hover:bg-surface-muted",
                )}
              >
                <CompactRank rank={row.rank} />
                <UsernameDisplay
                  name={row.user.name}
                  cosmetic={row.user.cosmetic}
                  className="truncate text-xs"
                />
                {row.isMe ? (
                  <span className="rounded-full bg-accent px-1 py-px text-[9px] font-bold uppercase text-on-accent">
                    {t("social.leaderboards.you", "You")}
                  </span>
                ) : null}
                <span className="ml-auto text-[11px] font-bold text-text-primary">
                  {row.xp.toLocaleString()}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CompactRowsSkeleton({ count }: { count: number }) {
  return (
    <ul className="divide-y divide-border" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-2 px-3 py-1.5">
          <div className="h-5 w-5 rounded-full bg-border" />
          <div className="h-2.5 w-24 rounded bg-border" />
          <div className="ml-auto h-2.5 w-10 rounded bg-border" />
        </li>
      ))}
    </ul>
  );
}

function CompactRank({ rank }: { rank: number }) {
  if (rank <= 3) {
    const colors: Record<number, string> = {
      1: "bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900",
      2: "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800",
      3: "bg-gradient-to-br from-amber-500 to-amber-700 text-amber-50",
    };
    return (
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
          colors[rank],
        )}
      >
        {rank === 1 ? <Icon name="crown" size={10} aria-hidden /> : rank}
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[10px] font-bold text-text-secondary">
      {rank}
    </span>
  );
}

function MonthlyBody({
  rows,
  isLoading,
}: {
  rows: LeaderboardRow[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid gap-px bg-border md:grid-cols-2">
        <FlatBoardSkeleton title={t("social.leaderboards.topXp", "Top XP")} />
        <FlatBoardSkeleton
          title={t("social.leaderboards.topLessons", "Top lessons completed")}
        />
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-xs text-text-muted">
        {t("social.leaderboards.emptyMonthly", "No monthly rankings yet — be the first.")}
      </p>
    );
  }

  // Monthly board doesn't carry lesson counts from the API; surface XP only.
  return (
    <div className="grid gap-px bg-border">
      <FlatBoard title={t("social.leaderboards.topXp", "Top XP")} rows={rows} metric="xp" />
    </div>
  );
}

function FriendsBody({
  rows,
  isLoading,
}: {
  rows: LeaderboardRow[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <FlatBoardSkeleton title={t("social.leaderboards.friendsXp", "Friends only — Weekly XP")} />
    );
  }
  if (rows.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-xs text-text-muted">
        {t(
          "social.leaderboards.emptyFriends",
          "Add friends to start a friends-only leaderboard.",
        )}
      </p>
    );
  }
  return (
    <FlatBoard
      title={t("social.leaderboards.friendsXp", "Friends only — Weekly XP")}
      rows={rows}
      metric="xp"
      footer={t(
        "social.leaderboards.friendsFooter",
        "Want bigger competition? Promote out of your friends list — Weekly Sprint pits you against everyone.",
      )}
    />
  );
}

/**
 * Edge-to-edge board variant rendered directly inside the unified card.
 */
function FlatBoard({
  title,
  rows,
  metric,
  footer,
}: {
  title: string;
  rows: LeaderboardRow[];
  metric: "xp" | "lessons";
  footer?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-surface">
      <div className="border-b border-border px-5 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li
            key={`${title}-${row.user.id}`}
            className={cn(
              "flex items-center gap-3 px-5 py-2.5 transition",
              row.isMe ? "bg-accent-muted" : "hover:bg-surface-muted",
            )}
          >
            <RankBadge rank={row.rank} />
            <ProfilePreviewPopover user={row.user} />
            <Link
              to={`/u/${userSlug(row.user)}`}
              className="min-w-0 flex-1 hover:underline focus:underline focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <UsernameDisplay
                  name={row.user.name}
                  cosmetic={row.user.cosmetic}
                  className="truncate text-sm"
                />
                {row.isMe ? (
                  <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase text-on-accent">
                    {t("social.leaderboards.you", "You")}
                  </span>
                ) : null}
                {row.user.language.flag ? (
                  <span className="text-xs" aria-hidden>
                    {row.user.language.flag}
                  </span>
                ) : null}
              </div>
              {row.user.lastActiveLabel ? (
                <p className="text-xs text-text-muted">{row.user.lastActiveLabel}</p>
              ) : null}
            </Link>
            <div className="text-right">
              <p className="text-sm font-bold text-text-primary">
                {metric === "xp" ? row.xp.toLocaleString() : row.lessons}
              </p>
              <p className="text-[10px] text-text-muted">
                {metric === "xp"
                  ? t("social.leaderboards.xpUnit", "XP")
                  : t("social.leaderboards.lessonsUnit", "lessons")}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {footer ? (
        <p className="border-t border-border bg-surface-muted px-5 py-3 text-xs text-text-muted">
          {footer}
        </p>
      ) : null}
    </div>
  );
}

function FlatBoardSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-surface">
      <div className="border-b border-border px-5 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </h3>
      </div>
      <ul className="divide-y divide-border" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex animate-pulse items-center gap-3 px-5 py-3">
            <div className="h-8 w-8 rounded-full bg-border" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded bg-border" />
              <div className="h-2.5 w-20 rounded bg-border" />
            </div>
            <div className="h-4 w-12 rounded bg-border" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Weekly league rendered edge-to-edge for the unified card. Keeps the
 * gradient header + zone legend + full row list. Uses spotlight data for the
 * league chrome (name/emoji/zones) and the live weekly board for rows.
 */
function WeeklyLeagueBody({
  spotlight,
  rows,
  isLoading,
}: {
  spotlight: LeagueSpotlight | null;
  rows: LeaderboardRow[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  if (isLoading || !spotlight) {
    return <WeeklyLeagueSkeleton />;
  }
  if (rows.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-xs text-text-muted">
        {t("social.leaderboards.emptyWeekly", "No weekly rankings yet — earn XP to join the sprint.")}
      </p>
    );
  }

  const { league } = spotlight;
  const { promotionZone, demotionZone } = league;
  const total = rows.length;
  const demotionStart = total - demotionZone + 1;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-accent/15 via-accent-muted to-surface px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-2xl shadow-sm">
            <span aria-hidden>{league.emoji}</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("social.leaderboards.currentLeague", "Current league")}
            </p>
            <h3 className="text-lg font-bold text-text-primary">{league.name}</h3>
            <p className="text-xs text-text-muted">
              {t("social.leaderboards.tierOf", "Tier {{n}} of {{total}}", {
                n: league.tierIndex,
                total: league.tierTotal,
              })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">
            {t("social.leaderboards.sprintEnds", "Sprint ends")}
          </p>
          <p className="text-sm font-bold text-text-primary">{league.resetLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 border-y border-border bg-surface-muted px-5 py-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-success">
          <span className="inline-block h-2 w-2 rounded-full bg-success" />
          {t("social.leaderboards.zonePromote", "Top {{n}} promote", { n: promotionZone })}
        </span>
        <span className="inline-flex items-center gap-1.5 text-warning">
          <span className="inline-block h-2 w-2 rounded-full bg-warning" />
          {t("social.leaderboards.zoneDemote", "Bottom {{n}} demote", { n: demotionZone })}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <LeagueRow
            key={row.user.id}
            row={row}
            zone={
              row.rank <= promotionZone
                ? "promote"
                : row.rank >= demotionStart
                  ? "demote"
                  : "safe"
            }
          />
        ))}
      </ul>
    </div>
  );
}

function WeeklyLeagueSkeleton() {
  return (
    <div aria-hidden>
      <div className="flex items-center gap-3 bg-surface-muted px-5 py-4">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-border" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-border" />
          <div className="h-4 w-32 animate-pulse rounded bg-border" />
        </div>
      </div>
      <ul className="divide-y divide-border">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex animate-pulse items-center gap-3 px-5 py-3">
            <div className="h-8 w-8 rounded-full bg-border" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded bg-border" />
              <div className="h-2.5 w-20 rounded bg-border" />
            </div>
            <div className="h-4 w-12 rounded bg-border" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function LeagueRow({
  row,
  zone,
}: {
  row: LeaderboardRow;
  zone: "promote" | "demote" | "safe";
}) {
  const { t } = useTranslation();
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-5 py-3 transition",
        row.isMe ? "bg-accent-muted" : "hover:bg-surface-muted",
      )}
    >
      <RankBadge rank={row.rank} />
      <ProfilePreviewPopover user={row.user} />
      <Link
        to={`/u/${userSlug(row.user)}`}
        className="min-w-0 flex-1 hover:underline focus:underline focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <UsernameDisplay
            name={row.user.name}
            cosmetic={row.user.cosmetic}
            className="truncate text-sm"
          />
          {row.isMe ? (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase text-on-accent">
              {t("social.leaderboards.you", "You")}
            </span>
          ) : null}
          {row.user.language.flag ? (
            <span className="text-xs" aria-hidden>
              {row.user.language.flag}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {row.lessons > 0 ? (
            <span className="inline-flex items-center gap-0.5">
              <Icon name="graduationCap" size={11} aria-hidden />
              {t("social.leaderboards.lessonsCount", "{{n}} lessons", { n: row.lessons })}
            </span>
          ) : null}
          {row.user.streakDays > 0 ? (
            <span className="inline-flex items-center gap-0.5">
              <Icon name="flame" size={11} aria-hidden />
              {row.user.streakDays}d
            </span>
          ) : null}
        </div>
      </Link>
      <DeltaIndicator delta={row.delta} />
      <div className="text-right">
        <p className="text-sm font-bold text-text-primary">{row.xp.toLocaleString()}</p>
        <p className="text-[10px] text-text-muted">{t("social.leaderboards.xpUnit", "XP")}</p>
      </div>
      <ZoneTag zone={zone} />
    </li>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const isTop3 = rank <= 3;
  if (isTop3) {
    const colors: Record<number, string> = {
      1: "bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900",
      2: "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800",
      3: "bg-gradient-to-br from-amber-500 to-amber-700 text-amber-50",
    };
    return (
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm",
          colors[rank],
        )}
        aria-label={`Rank ${rank}`}
      >
        {rank === 1 ? <Icon name="crown" size={14} aria-hidden /> : rank}
      </div>
    );
  }
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-text-secondary"
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </div>
  );
}

function DeltaIndicator({ delta }: { delta: LeaderboardRow["delta"] }) {
  if (delta === "same") {
    return <span className="text-xs text-text-muted">—</span>;
  }
  const isUp = delta === "up";
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-semibold",
        isUp ? "text-success" : "text-warning",
      )}
      aria-label={isUp ? "moved up" : "moved down"}
    >
      <Icon name={isUp ? "chevronUp" : "chevronDown"} size={14} aria-hidden />
    </span>
  );
}

function ZoneTag({ zone }: { zone: "promote" | "demote" | "safe" }) {
  if (zone === "safe") return null;
  return (
    <span
      className={cn(
        "hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase sm:inline-flex",
        zone === "promote" ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
      )}
    >
      {zone}
    </span>
  );
}
