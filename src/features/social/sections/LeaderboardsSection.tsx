/**
 * Leaderboards tab — segmented control across Weekly Sprint / Monthly /
 * Friends. Weekly uses a Duolingo-style league card with promotion +
 * demotion zones; Monthly + Friends use plain top-N tables.
 *
 * MOCK: every row is fake. Replace with backend queries scoped to period.
 */
import { useState } from "react";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { UsernameDisplay } from "../components/UsernameDisplay";
import { ProfilePreviewPopover } from "../components/ProfilePreviewPopover";
import {
  MOCK_LEAGUE,
  MOCK_WEEKLY_LB,
  MOCK_MONTHLY_LB,
  MOCK_FRIENDS_LB,
  type LeaderboardRow,
} from "../mock/mockSocial";

type Tab = "weekly" | "monthly" | "friends";

const TABS: { id: Tab; label: string; iconName: "flame" | "trophy" | "users" }[] = [
  { id: "weekly", label: "Weekly Sprint", iconName: "flame" },
  { id: "monthly", label: "Monthly", iconName: "trophy" },
  { id: "friends", label: "Friends", iconName: "users" },
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
  const [tab, setTab] = useState<Tab>("weekly");

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
              Leaderboards
            </p>
            <h2 className="text-lg font-semibold text-text-primary">
              This sprint and beyond
            </h2>
          </div>
        </div>
        <p className="text-xs text-text-muted sm:text-right">
          Weekly resets Sunday · Monthly resets the 1st
        </p>
      </div>

      {/* Tab strip */}
      <div className="flex border-b border-border bg-surface-muted px-2 pt-2">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold transition",
                isActive
                  ? "text-accent"
                  : "text-text-secondary hover:text-text-primary",
              )}
              aria-pressed={isActive}
            >
              <Icon name={t.iconName} size={14} aria-hidden />
              {t.label}
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
        {tab === "weekly" ? <WeeklyLeagueBody /> : null}
        {tab === "monthly" ? <MonthlyBody /> : null}
        {tab === "friends" ? <FriendsBody /> : null}
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
  const [tab, setTab] = useState<Tab>("weekly");

  return (
    <Card padding="none" className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-muted text-accent">
          <Icon name="trophy" size={11} aria-hidden />
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Leaderboards
        </h3>
        <p className="ml-auto text-[10px] text-text-muted">{MOCK_LEAGUE.resetLabel}</p>
      </div>

      <div className="flex border-b border-border bg-surface-muted">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-semibold transition",
                isActive
                  ? "text-accent"
                  : "text-text-secondary hover:text-text-primary",
              )}
              aria-pressed={isActive}
            >
              <Icon name={t.iconName} size={11} aria-hidden />
              {t.label}
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

      {tab === "weekly" ? <CompactRows rows={MOCK_WEEKLY_LB} limit={limit} pillEmoji={MOCK_LEAGUE.emoji} pillLabel={MOCK_LEAGUE.name} /> : null}
      {tab === "monthly" ? <CompactRows rows={MOCK_MONTHLY_LB} limit={limit} /> : null}
      {tab === "friends" ? <CompactRows rows={MOCK_FRIENDS_LB} limit={limit} /> : null}
    </Card>
  );
}

function CompactRows({
  rows,
  limit,
  pillEmoji,
  pillLabel,
}: {
  rows: LeaderboardRow[];
  limit: number;
  pillEmoji?: string;
  pillLabel?: string;
}) {
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
          <span aria-hidden className="text-base">{pillEmoji}</span>
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
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5",
                  row.isMe ? "bg-accent-muted" : "",
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
                    You
                  </span>
                ) : null}
                <span className="ml-auto text-[11px] font-bold text-text-primary">
                  {row.xp.toLocaleString()}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="mt-auto border-t border-border bg-surface-muted px-3 py-1.5 text-[11px] font-medium text-accent hover:bg-accent-muted"
      >
        See full leaderboard →
      </button>
    </div>
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

function MonthlyBody() {
  return (
    <div className="grid gap-px bg-border md:grid-cols-2">
      <FlatBoard title="Top XP" rows={MOCK_MONTHLY_LB} metric="xp" />
      <FlatBoard
        title="Top lessons completed"
        rows={[...MOCK_MONTHLY_LB]
          .sort((a, b) => b.lessons - a.lessons)
          .map((r, i) => ({ ...r, rank: i + 1 }))}
        metric="lessons"
      />
    </div>
  );
}

function FriendsBody() {
  return (
    <FlatBoard
      title="Friends only — Weekly XP"
      rows={MOCK_FRIENDS_LB}
      metric="xp"
      footer="Want bigger competition? Promote out of your friends list — Weekly Sprint pits you against everyone."
    />
  );
}

/**
 * Edge-to-edge board variant rendered directly inside the unified card.
 * Same row shape as `BoardCard` but without the wrapping Card border.
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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <UsernameDisplay
                  name={row.user.name}
                  cosmetic={row.user.cosmetic}
                  className="truncate text-sm"
                />
                {row.isMe ? (
                  <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase text-on-accent">
                    You
                  </span>
                ) : null}
                <span className="text-xs" aria-hidden>
                  {row.user.language.flag}
                </span>
              </div>
              <p className="text-xs text-text-muted">{row.user.lastActiveLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-text-primary">
                {metric === "xp" ? row.xp.toLocaleString() : row.lessons}
              </p>
              <p className="text-[10px] text-text-muted">
                {metric === "xp" ? "XP" : "lessons"}
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

/**
 * Weekly league rendered edge-to-edge for the unified card. Keeps the
 * gradient header + zone legend + full row list of the standalone variant.
 */
function WeeklyLeagueBody() {
  const rows = MOCK_WEEKLY_LB;
  const { promotionZone, demotionZone } = MOCK_LEAGUE;
  const total = rows.length;
  const demotionStart = total - demotionZone + 1;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-accent/15 via-accent-muted to-surface px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-2xl shadow-sm">
            <span aria-hidden>{MOCK_LEAGUE.emoji}</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Current league
            </p>
            <h3 className="text-lg font-bold text-text-primary">{MOCK_LEAGUE.name}</h3>
            <p className="text-xs text-text-muted">
              Tier {MOCK_LEAGUE.tierIndex} of {MOCK_LEAGUE.tierTotal}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">Sprint ends</p>
          <p className="text-sm font-bold text-text-primary">{MOCK_LEAGUE.resetLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 border-y border-border bg-surface-muted px-5 py-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-success">
          <span className="inline-block h-2 w-2 rounded-full bg-success" />
          Top {promotionZone} promote
        </span>
        <span className="inline-flex items-center gap-1.5 text-warning">
          <span className="inline-block h-2 w-2 rounded-full bg-warning" />
          Bottom {demotionZone} demote
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

export function WeeklyLeague() {
  const rows = MOCK_WEEKLY_LB;
  const { promotionZone, demotionZone } = MOCK_LEAGUE;
  const total = rows.length;
  const demotionStart = total - demotionZone + 1;

  return (
    <Card padding="none" className="overflow-hidden">
      {/* League header */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-br from-accent/15 via-accent-muted to-surface px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-2xl shadow-sm">
            <span aria-hidden>{MOCK_LEAGUE.emoji}</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Current league
            </p>
            <h3 className="text-lg font-bold text-text-primary">{MOCK_LEAGUE.name}</h3>
            <p className="text-xs text-text-muted">
              Tier {MOCK_LEAGUE.tierIndex} of {MOCK_LEAGUE.tierTotal}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">Sprint ends</p>
          <p className="text-sm font-bold text-text-primary">{MOCK_LEAGUE.resetLabel}</p>
        </div>
      </div>

      {/* Zone legend */}
      <div className="flex items-center gap-4 border-b border-border bg-surface-muted px-5 py-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-success">
          <span className="inline-block h-2 w-2 rounded-full bg-success" />
          Top {promotionZone} promote
        </span>
        <span className="inline-flex items-center gap-1.5 text-warning">
          <span className="inline-block h-2 w-2 rounded-full bg-warning" />
          Bottom {demotionZone} demote
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
    </Card>
  );
}

function LeagueRow({
  row,
  zone,
}: {
  row: LeaderboardRow;
  zone: "promote" | "demote" | "safe";
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-5 py-3 transition",
        row.isMe ? "bg-accent-muted" : "hover:bg-surface-muted",
      )}
    >
      <RankBadge rank={row.rank} />
      <ProfilePreviewPopover user={row.user} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <UsernameDisplay
            name={row.user.name}
            cosmetic={row.user.cosmetic}
            className="truncate text-sm"
          />
          {row.isMe ? (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase text-on-accent">
              You
            </span>
          ) : null}
          <span className="text-xs" aria-hidden>
            {row.user.language.flag}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-0.5">
            <Icon name="graduationCap" size={11} aria-hidden />
            {row.lessons} lessons
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Icon name="flame" size={11} aria-hidden />
            {row.user.streakDays}d
          </span>
        </div>
      </div>
      <DeltaIndicator delta={row.delta} />
      <div className="text-right">
        <p className="text-sm font-bold text-text-primary">{row.xp.toLocaleString()}</p>
        <p className="text-[10px] text-text-muted">XP</p>
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
        {rank === 1 ? (
          <Icon name="crown" size={14} aria-hidden />
        ) : (
          rank
        )}
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

export function MonthlyBoards() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <BoardCard title="Top XP — This month" rows={MOCK_MONTHLY_LB} metric="xp" />
      <BoardCard
        title="Top lessons completed — This month"
        rows={[...MOCK_MONTHLY_LB].sort((a, b) => b.lessons - a.lessons).map((r, i) => ({
          ...r,
          rank: i + 1,
        }))}
        metric="lessons"
      />
    </div>
  );
}

export function MonthlyTopXpCard({ limit = 10 }: { limit?: number }) {
  return (
    <BoardCard
      title="Top XP — This month"
      rows={MOCK_MONTHLY_LB.slice(0, limit)}
      metric="xp"
    />
  );
}

export function MonthlyTopLessonsCard({ limit = 10 }: { limit?: number }) {
  const sorted = [...MOCK_MONTHLY_LB]
    .sort((a, b) => b.lessons - a.lessons)
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return (
    <BoardCard title="Top lessons — This month" rows={sorted} metric="lessons" />
  );
}

export function FriendsBoard({ limit }: { limit?: number } = {}) {
  const rows = limit ? MOCK_FRIENDS_LB.slice(0, limit) : MOCK_FRIENDS_LB;
  return (
    <BoardCard
      title="Friends only — Weekly XP"
      rows={rows}
      metric="xp"
      footer="Want bigger competition? Promote out of your friends list — Weekly Sprint pits you against everyone."
    />
  );
}

/**
 * Sidebar variant of the Weekly League — top 3 promote zone + a window
 * around the current user. Used on the unified social page so leaderboards
 * stay glanceable next to the messages pane.
 */
export function CompactLeagueAside() {
  const rows = MOCK_WEEKLY_LB;
  const { promotionZone, demotionZone } = MOCK_LEAGUE;
  const total = rows.length;
  const demotionStart = total - demotionZone + 1;
  const meIdx = rows.findIndex((r) => r.isMe);

  // Always show top 3, then a window around "me" (me ± 1) — dedupe.
  const indexes = new Set<number>([0, 1, 2]);
  if (meIdx >= 0) {
    indexes.add(Math.max(0, meIdx - 1));
    indexes.add(meIdx);
    indexes.add(Math.min(total - 1, meIdx + 1));
  }
  const visible = [...indexes].sort((a, b) => a - b).map((i) => rows[i]);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-br from-accent/15 via-accent-muted to-surface px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-xl shadow-sm">
            <span aria-hidden>{MOCK_LEAGUE.emoji}</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              This week
            </p>
            <h3 className="text-sm font-bold text-text-primary">{MOCK_LEAGUE.name}</h3>
          </div>
        </div>
        <p className="text-right text-[10px] text-text-muted">{MOCK_LEAGUE.resetLabel}</p>
      </div>
      <ul className="divide-y divide-border">
        {visible.map((row, i) => {
          const prevIdx = i > 0 ? rows.indexOf(visible[i - 1]) : -1;
          const curIdx = rows.indexOf(row);
          const gap = prevIdx >= 0 && curIdx - prevIdx > 1;
          return (
            <li key={row.user.id}>
              {gap ? (
                <div className="border-t border-dashed border-border px-4 py-1 text-center text-[9px] uppercase tracking-wider text-text-muted">
                  · · ·
                </div>
              ) : null}
              <div
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2",
                  row.isMe ? "bg-accent-muted" : "",
                )}
              >
                <RankBadge rank={row.rank} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <UsernameDisplay
                      name={row.user.name}
                      cosmetic={row.user.cosmetic}
                      className="truncate text-xs"
                    />
                    {row.isMe ? (
                      <span className="rounded-full bg-accent px-1 py-px text-[8px] font-bold uppercase text-on-accent">
                        You
                      </span>
                    ) : null}
                  </div>
                </div>
                <ZoneTagMini
                  zone={
                    row.rank <= promotionZone
                      ? "promote"
                      : row.rank >= demotionStart
                        ? "demote"
                        : "safe"
                  }
                />
                <p className="text-xs font-bold text-text-primary">{row.xp.toLocaleString()}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ZoneTagMini({ zone }: { zone: "promote" | "demote" | "safe" }) {
  if (zone === "safe") return null;
  return (
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        zone === "promote" ? "bg-success" : "bg-warning",
      )}
      aria-label={zone}
    />
  );
}

function BoardCard({
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
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li
            key={`${title}-${row.user.id}`}
            className={cn(
              "flex items-center gap-3 px-5 py-3 transition",
              row.isMe ? "bg-accent-muted" : "hover:bg-surface-muted",
            )}
          >
            <RankBadge rank={row.rank} />
            <ProfilePreviewPopover user={row.user} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <UsernameDisplay
                  name={row.user.name}
                  cosmetic={row.user.cosmetic}
                  className="truncate text-sm"
                />
                {row.isMe ? (
                  <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase text-on-accent">
                    You
                  </span>
                ) : null}
                <span className="text-xs" aria-hidden>
                  {row.user.language.flag}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                {row.user.lastActiveLabel}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-text-primary">
                {metric === "xp" ? row.xp.toLocaleString() : row.lessons}
              </p>
              <p className="text-[10px] text-text-muted">
                {metric === "xp" ? "XP" : "lessons"}
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
    </Card>
  );
}
