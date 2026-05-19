/**
 * Friends surfaces — split into named exports so the unified social page
 * can compose them flexibly (e.g., requests + suggestions live in a side
 * column on the one-page layout). The `FriendsSection` wrapper keeps the
 * legacy stacked composition available for tab-style routes.
 *
 * Every surface is MOCK; replace per the comments when backend lands.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { UsernameDisplay } from "../components/UsernameDisplay";
import { ProfilePreviewPopover } from "../components/ProfilePreviewPopover";
import { ActivityFeedStrip } from "./ActivityFeedStrip";
import {
  MOCK_FRIENDS,
  MOCK_FRIEND_REQUESTS,
  MOCK_FRIEND_SUGGESTIONS,
  type SocialUser,
} from "../mock/mockSocial";

export function FriendsSection() {
  return (
    <div className="space-y-5">
      <FriendsSearchAndList />
      <ActivityFeedStrip />
      <FriendRequestsPanel />
      <FriendSuggestionsPanel />
    </div>
  );
}

/**
 * Friends list with embedded search + add/invite controls. Designed for the
 * primary slot of the unified social page (full-width on mobile, ~2/3 of the
 * row on lg+).
 */
export function FriendsSearchAndList() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_FRIENDS;
    return MOCK_FRIENDS.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]);

  // Grouping: active first, then idle. Each group sorted by recency
  // (most-recently-online first). Real impl will use a numeric
  // `lastActiveAt` epoch ms; until then we parse the mock label.
  const grouped = useMemo(() => {
    const byRecency = (a: SocialUser, b: SocialUser) =>
      lastActiveScore(a.lastActiveLabel) - lastActiveScore(b.lastActiveLabel);
    const active = filtered.filter((f) => f.status === "active").sort(byRecency);
    const idle = filtered.filter((f) => f.status === "idle").sort(byRecency);
    return { active, idle };
  }, [filtered]);

  return (
    <Card padding="none" className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-muted text-accent">
          <Icon name="users" size={11} aria-hidden />
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Your friends
          <span className="ml-1.5 text-text-secondary">{filtered.length}</span>
        </h3>
        <div className="relative ml-auto w-full max-w-[260px]">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">
            <Icon name="search" size={13} aria-hidden />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends…"
            className="h-7 w-full rounded-md border border-border bg-surface-muted pl-7 pr-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:bg-surface focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          No friends match “{query}”.
        </p>
      ) : (
        <ul className="grid max-h-[520px] auto-rows-min grid-cols-1 content-start gap-px overflow-y-auto bg-border md:grid-cols-2">
          {grouped.active.length > 0 ? (
            <SectionDivider
              label="Online now"
              count={grouped.active.length}
              dotClassName="bg-success"
            />
          ) : null}
          {grouped.active.map((u) => (
            <FriendRow key={u.id} user={u} />
          ))}
          {grouped.idle.length > 0 ? (
            <SectionDivider
              label="Recently active"
              count={grouped.idle.length}
              dotClassName="bg-text-muted"
            />
          ) : null}
          {grouped.idle.map((u) => (
            <FriendRow key={u.id} user={u} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function SectionDivider({
  label,
  count,
  dotClassName,
}: {
  label: string;
  count: number;
  dotClassName: string;
}) {
  return (
    <li className="flex items-center gap-2 bg-surface-muted px-3 py-1.5 md:col-span-2">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClassName}`} aria-hidden />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span className="text-[10px] font-bold text-text-secondary">{count}</span>
    </li>
  );
}

/**
 * Friend requests panel. Hidden when empty. Stack-friendly: equal width on
 * mobile, single-column when used in a sidebar column on lg+.
 */
export function FriendRequestsPanel() {
  if (MOCK_FRIEND_REQUESTS.length === 0) return null;
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent text-on-accent">
          <Icon name="userPlus" size={11} aria-hidden />
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Requests
          <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-accent px-1.5 py-px text-[10px] font-bold text-on-accent">
            {MOCK_FRIEND_REQUESTS.length}
          </span>
        </h3>
        <button
          type="button"
          className="ml-auto text-[11px] font-medium text-accent hover:text-accent-hover"
        >
          See all
        </button>
      </div>
      <ul className="divide-y divide-border">
        {/* MOCK: MOCK_FRIEND_REQUESTS — replace with friend-request API. */}
        {MOCK_FRIEND_REQUESTS.map((u) => (
          <FriendRequestRow key={u.id} user={u} />
        ))}
      </ul>
    </Card>
  );
}

export function FriendSuggestionsPanel() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-muted text-accent">
          <Icon name="sparkles" size={11} aria-hidden />
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Suggested
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {/* MOCK: MOCK_FRIEND_SUGGESTIONS — replace with suggestion service. */}
        {MOCK_FRIEND_SUGGESTIONS.map(({ user, reason }) => (
          <li
            key={user.id}
            className="flex items-center gap-2.5 bg-surface px-3 py-2"
          >
            <ProfilePreviewPopover user={user} />
            <div className="min-w-0 flex-1">
              <UsernameDisplay
                name={user.name}
                cosmetic={user.cosmetic}
                className="truncate text-xs"
              />
              <p className="truncate text-[10px] text-text-muted">{reason}</p>
            </div>
            <button
              type="button"
              className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-on-accent transition hover:bg-accent-hover"
            >
              Follow
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** MOCK-only: parse "Active 2m ago" / "1h ago" / "Yesterday" → minutes ago. */
function lastActiveScore(label: string): number {
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

function FriendRow({ user }: { user: SocialUser }) {
  const langPath = useLangPath();
  return (
    <li className="group flex items-center gap-3 bg-surface px-3 py-2.5 transition hover:bg-surface-muted">
      <ProfilePreviewPopover user={user} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <UsernameDisplay name={user.name} cosmetic={user.cosmetic} className="truncate text-[13px]" />
          <span className="text-[11px]" aria-hidden>
            {user.language.flag}
          </span>
        </div>
        <p className="truncate text-[11px] text-text-muted">{user.lastActiveLabel}</p>
      </div>
      <span className="inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-1.5 py-0.5 text-[11px] font-bold text-warning">
        <Icon name="flame" size={10} aria-hidden />
        {user.streakDays}
      </span>
      <Link
        to={langPath(`messenger/${user.id}`)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition hover:bg-accent-muted hover:text-accent"
        aria-label={`Message ${user.name}`}
      >
        <Icon name="messageCircle" size={14} aria-hidden />
      </Link>
    </li>
  );
}

function FriendRequestRow({ user }: { user: SocialUser }) {
  return (
    <li className="flex items-center gap-2.5 bg-accent-muted/30 px-3 py-2">
      <ProfilePreviewPopover user={user} />
      <div className="min-w-0 flex-1">
        <UsernameDisplay name={user.name} cosmetic={user.cosmetic} className="truncate text-xs" />
        <p className="truncate text-[10px] text-text-muted">
          {user.language.flag} {user.language.label}
        </p>
      </div>
      <button
        type="button"
        className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-on-accent transition hover:bg-accent-hover"
        aria-label={`Accept request from ${user.name}`}
      >
        Accept
      </button>
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-surface text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
        aria-label={`Decline request from ${user.name}`}
      >
        <Icon name="close" size={11} aria-hidden />
      </button>
    </li>
  );
}
