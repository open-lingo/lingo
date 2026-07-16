/**
 * /:lang/social/friends — deep friend-management surface.
 *
 * Three tabs at the top:
 *   - "All friends" — searchable, sortable, language-filtered list with
 *     per-row Message / Unfriend / Block actions.
 *   - "Requests" — incoming (Accept/Decline) + outgoing (Cancel). Uses the
 *     new `useFriendRequestsBundle()` hook so both halves render together.
 *   - "Blocked" — list with Unblock action. Backed by `useBlocks()` →
 *     `GET /api/core/v1/social/blocks`.
 *
 * Header carries summary counts ("48 friends · 3 pending · 0 blocked") so the
 * tab labels stay short.
 *
 * Sits behind `RequireAuth` via the `:lang` route group in `App.tsx`. Reuses
 * the existing mutation hooks (`useUnfriend`, `useBlockUser`, etc.) and the
 * existing `ConfirmModal` for destructive actions.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { OverflowMenu } from "@/shared/components/ui/OverflowMenu";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { cn } from "@/shared/components/ui/cn";
import { userSlug } from "@/features/social/userSlug";
import { UsernameDisplay } from "./components/UsernameDisplay";
import { UserAvatar } from "./components/UserAvatar";
import { ProfilePreviewPopover } from "./components/ProfilePreviewPopover";
import { useBlocks, useFriendRequestsBundle, useFriends } from "./hooks/useSocial";
import {
  useAcceptFriendRequest,
  useBlockUser,
  useDeclineFriendRequest,
  useUnblockUser,
  useUnfriend,
} from "./hooks/useSocialMutations";
import type { SocialUser } from "./types";
import { LEAGUE_TIERS } from "./data/leagueTiers";

type Tab = "all" | "requests" | "blocked";
type SortKey = "name" | "streak" | "activity";

/** Map a friend's `totalXp` to a rough league tier. SocialUser carries
 *  cumulative XP, not weekly — we divide by 20 to approximate "recent
 *  activity tier" before snapping to the ladder. This is intentionally
 *  rough; once the backend ships per-friend league data we swap this for
 *  the real value. */
function leagueTierFor(totalXp: number) {
  const approxWeekly = Math.max(0, Math.floor(totalXp / 20));
  let tier = LEAGUE_TIERS[0];
  for (const t of LEAGUE_TIERS) {
    if (approxWeekly >= t.weeklyXpThreshold) tier = t;
  }
  return tier;
}

/** Parse a friend's `lastActiveLabel` ("Active now" / "12m ago" / "2d ago"
 *  / "Yesterday") into a coarse minutes-ago value. Older labels sort last.
 *  Mirrors the parser in FriendsSection but kept local so this page can
 *  evolve independently. */
function lastActiveScore(label: string): number {
  if (!label) return Number.MAX_SAFE_INTEGER;
  if (/now/i.test(label)) return 0;
  const m = label.match(/(\d+)\s*(m|h|d)\b/i);
  if (m) {
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    return unit === "d" ? n * 1440 : unit === "h" ? n * 60 : n;
  }
  if (/yesterday/i.test(label)) return 1440;
  return Number.MAX_SAFE_INTEGER;
}

export function FriendsPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const [tab, setTab] = useState<Tab>("all");

  const friends = useFriends();
  const requests = useFriendRequestsBundle();
  const blocks = useBlocks();

  const friendsCount = friends.data?.length ?? 0;
  const pendingCount =
    (requests.data?.incoming.length ?? 0) + (requests.data?.outgoing.length ?? 0);
  const blockedCount = blocks.data?.length ?? 0;

  // Richer header: derive a few at-a-glance stats from the friend list. All
  // real data already on the wire (no extra fetch).
  const overview = useMemo(() => {
    const list = friends.data ?? [];
    const activeNow = list.filter((f) => f.status === "active").length;
    const topStreak = list.reduce((m, f) => Math.max(m, f.streakDays), 0);
    const totalXp = list.reduce((sum, f) => sum + f.totalXp, 0);
    return { activeNow, topStreak, totalXp };
  }, [friends.data]);

  return (
    <div className="space-y-4">
      {/* Back link — sub-route, primary egress is the social page above. */}
      <Link
        to={langPath("social")}
        className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary transition hover:text-accent"
      >
        <span aria-hidden>←</span>
        {t("social.friendsPage.back", "Back to social")}
      </Link>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("social.friendsPage.eyebrow", "Social")}
          </p>
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
            {t("social.friendsPage.title", "Friends")}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t(
              "social.friendsPage.summary",
              "{{friends}} friends · {{pending}} pending · {{blocked}} blocked",
              {
                friends: friendsCount,
                pending: pendingCount,
                blocked: blockedCount,
              },
            )}
          </p>
        </div>
        <Link
          to={langPath("social")}
          className="inline-flex items-center gap-1.5 self-start rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary sm:self-end"
        >
          <Icon name="chevronLeft" size={13} aria-hidden />
          {t("social.friendsPage.backToSocial", "Back to Social")}
        </Link>
      </header>

      {friendsCount > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <OverviewStat
            icon="users"
            label={t("social.friendsPage.statFriends", "Friends")}
            value={friendsCount.toLocaleString()}
          />
          <OverviewStat
            icon="circle"
            label={t("social.friendsPage.statActive", "Active now")}
            value={overview.activeNow.toLocaleString()}
            accent={overview.activeNow > 0}
          />
          <OverviewStat
            icon="flame"
            label={t("social.friendsPage.statTopStreak", "Top streak")}
            value={overview.topStreak.toLocaleString()}
          />
          <OverviewStat
            icon="sparkles"
            label={t("social.friendsPage.statTotalXp", "Combined XP")}
            value={overview.totalXp.toLocaleString()}
          />
        </div>
      ) : null}

      <nav
        className="flex gap-1 rounded-card border border-border bg-surface p-1"
        role="tablist"
        aria-label={t("social.friendsPage.tabsAria", "Friend-management sections")}
      >
        <TabButton
          tab="all"
          active={tab}
          onClick={setTab}
          label={t("social.friendsPage.tabAll", "All friends")}
          count={friendsCount}
        />
        <TabButton
          tab="requests"
          active={tab}
          onClick={setTab}
          label={t("social.friendsPage.tabRequests", "Requests")}
          count={pendingCount}
        />
        <TabButton
          tab="blocked"
          active={tab}
          onClick={setTab}
          label={t("social.friendsPage.tabBlocked", "Blocked")}
          count={blockedCount}
        />
      </nav>

      {tab === "all" ? <AllFriendsTab /> : null}
      {tab === "requests" ? <RequestsTab /> : null}
      {tab === "blocked" ? <BlockedTab /> : null}
    </div>
  );
}

export default FriendsPage;

function OverviewStat({
  icon,
  label,
  value,
  accent,
}: {
  icon: "users" | "circle" | "flame" | "sparkles";
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-card border border-border bg-surface px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-text-muted">
        <Icon name={icon} size={13} aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "mt-1 text-xl font-bold tabular-nums",
          accent ? "text-accent" : "text-text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TabButton({
  tab,
  active,
  onClick,
  label,
  count,
}: {
  tab: Tab;
  active: Tab;
  onClick: (t: Tab) => void;
  label: string;
  count: number;
}) {
  const isActive = tab === active;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onClick(tab)}
      className={cn(
        "flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
        isActive
          ? "bg-accent text-on-accent shadow-sm"
          : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
          isActive ? "bg-on-accent/20 text-on-accent" : "bg-surface-muted text-text-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// All friends tab — search, sort, language filter, per-row actions.
// ────────────────────────────────────────────────────────────────────────────

function AllFriendsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langPath = useLangPath();
  const { data, isLoading } = useFriends();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("activity");
  const [langFilter, setLangFilter] = useState<string>("all");

  const friends = data ?? [];

  // Languages present in the list become filter options. Always include "all"
  // first; alphabetize the rest by label so the dropdown stays predictable.
  const languageOptions = useMemo(() => {
    const seen = new Map<string, { code: string; flag: string; label: string }>();
    for (const f of friends) {
      if (f.language?.code && !seen.has(f.language.code)) {
        seen.set(f.language.code, f.language);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [friends]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return friends.filter((f) => {
      if (langFilter !== "all" && f.language?.code !== langFilter) return false;
      if (!q) return true;
      return (
        (f.name ?? "").toLowerCase().includes(q) ||
        (f.username ?? "").toLowerCase().includes(q)
      );
    });
  }, [friends, query, langFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === "name") {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "streak") {
      arr.sort((a, b) => b.streakDays - a.streakDays);
    } else {
      arr.sort(
        (a, b) =>
          lastActiveScore(a.lastActiveLabel) - lastActiveScore(b.lastActiveLabel),
      );
    }
    return arr;
  }, [filtered, sort]);

  if (!isLoading && friends.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Icon name="userPlus" size={20} aria-hidden />}
          title={t("social.friendsPage.emptyTitle", "No friends yet")}
          description={t(
            "social.friendsPage.emptyDesc",
            "Find learners to follow in the community, or share your invite link.",
          )}
          action={
            <button
              type="button"
              onClick={() => navigate(langPath("community/contributors"))}
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              {t("social.friendsPage.emptyAction", "Browse community")}
            </button>
          }
        />
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">
            <Icon name="search" size={14} aria-hidden />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "social.friendsPage.searchPlaceholder",
              "Search by name or @username…",
            )}
            className="h-9 w-full rounded-md border border-border bg-surface-muted pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:bg-surface focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-text-muted">
            <span>{t("social.friendsPage.sortBy", "Sort:")}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-8 rounded-md border border-border bg-surface px-2 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
              aria-label={t("social.friendsPage.sortAria", "Sort friends")}
            >
              <option value="activity">
                {t("social.friendsPage.sortActivity", "Last active")}
              </option>
              <option value="name">
                {t("social.friendsPage.sortName", "Name")}
              </option>
              <option value="streak">
                {t("social.friendsPage.sortStreak", "Streak")}
              </option>
            </select>
          </label>
          <label className="flex items-center gap-1 text-xs text-text-muted">
            <span>{t("social.friendsPage.langFilter", "Lang:")}</span>
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface px-2 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
              aria-label={t("social.friendsPage.langFilterAria", "Filter by language")}
            >
              <option value="all">{t("social.friendsPage.langAll", "All")}</option>
              {languageOptions.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <FriendsTableSkeleton />
      ) : sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">
          {t("social.friendsPage.noMatch", "No friends match these filters.")}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((u) => (
            <FriendRow key={u.id} user={u} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function FriendRow({ user }: { user: SocialUser }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<null | "unfriend" | "block">(null);
  const unfriend = useUnfriend();
  const block = useBlockUser();
  const tier = leagueTierFor(user.totalXp);

  return (
    <li className="group flex items-center gap-3 bg-surface px-4 py-3 transition hover:bg-surface-muted">
      <ProfilePreviewPopover user={user} />
      <div className="min-w-0 flex-1">
        <Link
          to={`/u/${userSlug(user)}`}
          className="flex items-center gap-1.5 hover:underline focus:underline focus:outline-none"
          aria-label={t(
            "social.friendsPage.openProfileAria",
            "Open {{name}}'s profile",
            { name: user.name },
          )}
        >
          <UsernameDisplay
            name={user.name}
            cosmetic={user.cosmetic}
            className="truncate text-sm"
          />
          <span className="text-[11px]" aria-hidden>
            {user.language?.flag}
          </span>
        </Link>
        <p className="truncate text-[11px] text-text-muted">
          {user.lastActiveLabel}
        </p>
      </div>

      {/* Stats: streak / xp / league. Hide the last two on narrow viewports
       *  to keep the row tappable on phones. */}
      <span
        className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-bold text-warning"
        title={t("social.friendsPage.streakLabel", "{{count}}-day streak", {
          count: user.streakDays,
        })}
      >
        <Icon name="flame" size={11} aria-hidden />
        {user.streakDays}
      </span>
      <span
        className="hidden shrink-0 items-center gap-0.5 rounded-full bg-accent-muted px-2 py-0.5 text-[11px] font-bold text-accent sm:inline-flex"
        title={t("social.friendsPage.xpLabel", "{{xp}} XP", {
          xp: user.totalXp,
        })}
      >
        <Icon name="sparkles" size={11} aria-hidden />
        {user.totalXp.toLocaleString()}
      </span>
      <span
        className="hidden shrink-0 items-center gap-1 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-text-secondary lg:inline-flex"
        title={tier.name}
      >
        <span aria-hidden>{tier.emoji}</span>
        {tier.name.replace(" League", "")}
      </span>

      <OverflowMenu
        orientation="horizontal"
        ariaLabel={t("social.friendsPage.moreAria", "More actions for {{name}}", {
          name: user.name,
        })}
        items={[
          {
            key: "view",
            label: t("social.friendsPage.menuView", "View profile"),
            leading: <Icon name="user" size={14} aria-hidden />,
            onSelect: () => navigate(`/u/${userSlug(user)}`),
          },
          {
            key: "unfriend",
            label: t("social.friendsPage.unfriend", "Unfriend"),
            leading: <Icon name="userMinus" size={14} aria-hidden />,
            onSelect: () => setConfirm("unfriend"),
          },
          {
            key: "block",
            label: t("social.friendsPage.block", "Block"),
            leading: <Icon name="shield" size={14} aria-hidden />,
            danger: true,
            onSelect: () => setConfirm("block"),
          },
        ]}
      />
      {confirm === "unfriend" ? (
        <ConfirmModal
          title={t("social.friendsPage.unfriendConfirmTitle", "Unfriend {{name}}?", {
            name: user.name,
          })}
          message={t(
            "social.friendsPage.unfriendConfirmBody",
            "You'll stop seeing each other on leaderboards and the activity feed.",
          )}
          cancelLabel={t("social.friendsPage.cancel", "Cancel")}
          confirmLabel={t("social.friendsPage.unfriend", "Unfriend")}
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            unfriend.mutate(user.id);
          }}
        />
      ) : null}
      {confirm === "block" ? (
        <ConfirmModal
          title={t("social.friendsPage.blockConfirmTitle", "Block {{name}}?", {
            name: user.name,
          })}
          message={t(
            "social.friendsPage.blockConfirmBody",
            "Blocked users can't message you, see your profile, or appear in your leaderboards.",
          )}
          cancelLabel={t("social.friendsPage.cancel", "Cancel")}
          confirmLabel={t("social.friendsPage.block", "Block")}
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            block.mutate(user.id);
          }}
        />
      ) : null}
    </li>
  );
}

function FriendsTableSkeleton() {
  return (
    <ul className="divide-y divide-border" aria-hidden>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <li key={i} className="flex animate-pulse items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-border" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 rounded bg-border" />
            <div className="h-2.5 w-20 rounded bg-border" />
          </div>
          <div className="h-5 w-12 rounded-full bg-border" />
          <div className="h-5 w-14 rounded-full bg-border" />
          <div className="h-8 w-8 rounded-md bg-border" />
        </li>
      ))}
    </ul>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Requests tab — incoming + outgoing.
// ────────────────────────────────────────────────────────────────────────────

function RequestsTab() {
  const { t } = useTranslation();
  const { data, isLoading } = useFriendRequestsBundle();
  const incoming = data?.incoming ?? [];
  const outgoing = data?.outgoing ?? [];

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-text-muted">
          {t("social.friendsPage.loading", "Loading…")}
        </p>
      </Card>
    );
  }

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Icon name="userPlus" size={20} aria-hidden />}
          title={t("social.friendsPage.requestsEmptyTitle", "No pending requests")}
          description={t(
            "social.friendsPage.requestsEmptyDesc",
            "Friend requests you send or receive will show up here.",
          )}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {incoming.length > 0 ? (
        <Card padding="none" className="overflow-hidden">
          <SectionHeader
            label={t("social.friendsPage.incoming", "Incoming")}
            count={incoming.length}
            tone="accent"
          />
          <ul className="divide-y divide-border">
            {incoming.map((u) => (
              <IncomingRequestRow key={u.id} user={u} />
            ))}
          </ul>
        </Card>
      ) : null}
      {outgoing.length > 0 ? (
        <Card padding="none" className="overflow-hidden">
          <SectionHeader
            label={t("social.friendsPage.outgoing", "Outgoing")}
            count={outgoing.length}
            tone="muted"
          />
          <ul className="divide-y divide-border">
            {outgoing.map((u) => (
              <OutgoingRequestRow key={u.id} user={u} />
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function SectionHeader({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "accent" | "muted";
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-md",
          tone === "accent" ? "bg-accent text-on-accent" : "bg-surface-muted text-text-muted",
        )}
      >
        <Icon name="userPlus" size={11} aria-hidden />
      </span>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
        <span
          className={cn(
            "ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-px text-[10px] font-bold",
            tone === "accent" ? "bg-accent text-on-accent" : "bg-surface-muted text-text-secondary",
          )}
        >
          {count}
        </span>
      </h3>
    </div>
  );
}

function IncomingRequestRow({ user }: { user: SocialUser }) {
  const { t } = useTranslation();
  const accept = useAcceptFriendRequest();
  const decline = useDeclineFriendRequest();
  const isBusy = accept.isPending || decline.isPending;

  return (
    <li className="flex items-center gap-3 bg-surface px-4 py-3">
      <ProfilePreviewPopover user={user} />
      <Link
        to={`/u/${userSlug(user)}`}
        className="min-w-0 flex-1 hover:underline focus:underline focus:outline-none"
      >
        <UsernameDisplay
          name={user.name}
          cosmetic={user.cosmetic}
          className="truncate text-sm"
        />
        <p className="truncate text-[11px] text-text-muted">
          {user.lastActiveLabel}
        </p>
      </Link>
      <button
        type="button"
        disabled={isBusy}
        onClick={() => accept.mutate(user.id)}
        className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
      >
        {accept.isPending
          ? t("social.friendsPage.accepting", "Accepting…")
          : t("social.friendsPage.accept", "Accept")}
      </button>
      <button
        type="button"
        disabled={isBusy}
        onClick={() => decline.mutate(user.id)}
        className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
      >
        {t("social.friendsPage.decline", "Decline")}
      </button>
    </li>
  );
}

function OutgoingRequestRow({ user }: { user: SocialUser }) {
  const { t } = useTranslation();
  // Cancelling an outgoing request reuses the decline endpoint — both fire
  // DELETE /social/friends/requests/{otherId}, which works for either side
  // of the bundle.
  const cancel = useDeclineFriendRequest();

  return (
    <li className="flex items-center gap-3 bg-surface px-4 py-3">
      <ProfilePreviewPopover user={user} />
      <Link
        to={`/u/${userSlug(user)}`}
        className="min-w-0 flex-1 hover:underline focus:underline focus:outline-none"
      >
        <UsernameDisplay
          name={user.name}
          cosmetic={user.cosmetic}
          className="truncate text-sm"
        />
        <p className="truncate text-[11px] text-text-muted">
          {t("social.friendsPage.pending", "Pending")} · {user.lastActiveLabel}
        </p>
      </Link>
      <button
        type="button"
        disabled={cancel.isPending}
        onClick={() => cancel.mutate(user.id)}
        className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
      >
        {t("social.friendsPage.cancel", "Cancel")}
      </button>
    </li>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Blocked tab.
// ────────────────────────────────────────────────────────────────────────────

function BlockedTab() {
  const { t } = useTranslation();
  const { data, isLoading } = useBlocks();
  const blocked = data ?? [];

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-text-muted">
          {t("social.friendsPage.loading", "Loading…")}
        </p>
      </Card>
    );
  }

  if (blocked.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Icon name="shield" size={20} aria-hidden />}
          title={t("social.friendsPage.blockedEmptyTitle", "No blocked users")}
          description={t(
            "social.friendsPage.blockedEmptyDesc",
            "Users you block will show up here so you can unblock them later.",
          )}
        />
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <SectionHeader
        label={t("social.friendsPage.blocked", "Blocked")}
        count={blocked.length}
        tone="muted"
      />
      <ul className="divide-y divide-border">
        {blocked.map((u) => (
          <BlockedRow
            key={u.user_id}
            userId={u.user_id}
            username={u.username}
            displayName={u.display_name}
          />
        ))}
      </ul>
    </Card>
  );
}

function BlockedRow({
  userId,
  username,
  displayName,
}: {
  userId: string;
  username: string;
  displayName: string;
}) {
  const { t } = useTranslation();
  const unblock = useUnblockUser();
  const name = displayName || username;

  return (
    <li className="flex items-center gap-3 bg-surface px-4 py-3">
      <UserAvatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{name}</p>
        <p className="truncate text-[11px] text-text-muted">@{username}</p>
      </div>
      <button
        type="button"
        disabled={unblock.isPending}
        onClick={() => unblock.mutate(userId)}
        className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
      >
        {unblock.isPending
          ? t("social.friendsPage.unblocking", "Unblocking…")
          : t("social.friendsPage.unblock", "Unblock")}
      </button>
    </li>
  );
}
