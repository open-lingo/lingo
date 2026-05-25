/**
 * Friends surfaces — split into named exports so the unified social page
 * can compose them flexibly (e.g., requests + suggestions live in a side
 * column on the one-page layout). The `FriendsSection` wrapper keeps the
 * legacy stacked composition available for tab-style routes.
 *
 * Buttons in this section are wired to mutations in `useSocialMutations.ts`
 * which talk to the real SocialApi when `VITE_SOCIAL_API` is on. The mock
 * fallback still works for storybook / preview rendering — the mutations
 * just no-op silently because no provider supplies a `social` client to
 * fire against.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { EmptyState } from "@/shared/components/EmptyState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { UsernameDisplay } from "../components/UsernameDisplay";
import { ProfilePreviewPopover } from "../components/ProfilePreviewPopover";
import { ActivityFeedStrip } from "./ActivityFeedStrip";
import { InviteFriendsCard } from "./InviteFriendsCard";
import {
  useFriendRequests,
  useFriends,
  useFriendSuggestions,
} from "../hooks/useSocial";
import {
  useAcceptFriendRequest,
  useBlockUser,
  useDeclineFriendRequest,
  useSendFriendRequest,
  useUnfriend,
} from "../hooks/useSocialMutations";
import type { SocialUser } from "../mock/mockSocial";

export function FriendsSection() {
  return (
    <div className="space-y-5">
      <FriendsSearchAndList />
      <InviteFriendsCard />
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
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const { data, isLoading } = useFriends();

  const friends = data ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => f.name.toLowerCase().includes(q));
  }, [friends, query]);

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

  // Empty-state: user has no friends at all (vs. just no search matches).
  if (!isLoading && friends.length === 0) {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-muted text-accent">
            <Icon name="users" size={11} aria-hidden />
          </span>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {t("social.friends.title", "Your friends")}
          </h3>
        </div>
        <div className="p-4">
          <EmptyState
            icon={<Icon name="userPlus" size={20} aria-hidden />}
            title={t("social.friends.emptyTitle", "Nobody here yet")}
            description={t(
              "social.friends.emptyDesc",
              "Add a friend or send an invite link to start trading streaks and reactions.",
            )}
            action={{
              label: t("social.friends.emptyAction", "Find friends"),
              onClick: () => {
                /* MOCK: real impl opens the find-friends modal. */
              },
            }}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none" className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-muted text-accent">
          <Icon name="users" size={11} aria-hidden />
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {t("social.friends.title", "Your friends")}
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
            placeholder={t("social.friends.searchPlaceholder", "Search friends…")}
            className="h-7 w-full rounded-md border border-border bg-surface-muted pl-7 pr-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:bg-surface focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <FriendsListSkeleton />
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          {t("social.friends.noMatch", "No friends match “{{query}}”.", { query })}
        </p>
      ) : (
        <ul className="grid max-h-[520px] auto-rows-min grid-cols-1 content-start gap-px overflow-y-auto bg-border md:grid-cols-2">
          {grouped.active.length > 0 ? (
            <SectionDivider
              label={t("social.friends.onlineNow", "Online now")}
              count={grouped.active.length}
              dotClassName="bg-success"
            />
          ) : null}
          {grouped.active.map((u) => (
            <FriendRow key={u.id} user={u} />
          ))}
          {grouped.idle.length > 0 ? (
            <SectionDivider
              label={t("social.friends.recentlyActive", "Recently active")}
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

function FriendsListSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-px bg-border md:grid-cols-2" aria-hidden>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <li key={i} className="flex animate-pulse items-center gap-3 bg-surface px-3 py-2.5">
          <div className="h-8 w-8 rounded-full bg-border" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded bg-border" />
            <div className="h-2.5 w-16 rounded bg-border" />
          </div>
        </li>
      ))}
    </ul>
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
  const { t } = useTranslation();
  const { data, isLoading } = useFriendRequests();
  if (isLoading) return null;
  const requests = data ?? [];
  if (requests.length === 0) return null;
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent text-on-accent">
          <Icon name="userPlus" size={11} aria-hidden />
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {t("social.requests.title", "Requests")}
          <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-accent px-1.5 py-px text-[10px] font-bold text-on-accent">
            {requests.length}
          </span>
        </h3>
        <button
          type="button"
          className="ml-auto text-[11px] font-medium text-accent hover:text-accent-hover"
        >
          {t("social.requests.seeAll", "See all")}
        </button>
      </div>
      <ul className="divide-y divide-border">
        {requests.map((u) => (
          <FriendRequestRow key={u.id} user={u} />
        ))}
      </ul>
    </Card>
  );
}

export function FriendSuggestionsPanel() {
  const { t } = useTranslation();
  const { data, isLoading } = useFriendSuggestions();
  if (isLoading) return null;
  const suggestions = data ?? [];
  if (suggestions.length === 0) return null;
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-muted text-accent">
          <Icon name="sparkles" size={11} aria-hidden />
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {t("social.suggested.title", "Suggested")}
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {suggestions.map(({ user, reason }) => (
          <SuggestionRow key={user.id} user={user} reason={reason} />
        ))}
      </ul>
    </Card>
  );
}

function SuggestionRow({ user, reason }: { user: SocialUser; reason: string }) {
  const { t } = useTranslation();
  const send = useSendFriendRequest();
  const [pendingLocally, setPendingLocally] = useState(false);
  return (
    <li className="flex items-center gap-2.5 bg-surface px-3 py-2">
      <ProfilePreviewPopover user={user} />
      <Link
        to={`/u/${encodeURIComponent(user.name)}`}
        className="min-w-0 flex-1 hover:underline focus:underline focus:outline-none"
      >
        <UsernameDisplay
          name={user.name}
          cosmetic={user.cosmetic}
          className="truncate text-xs"
        />
        <p className="truncate text-[10px] text-text-muted">{reason}</p>
      </Link>
      <button
        type="button"
        disabled={send.isPending || pendingLocally}
        onClick={() => {
          send.mutate(
            { toUserId: user.id },
            { onSuccess: () => setPendingLocally(true) },
          );
        }}
        className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
      >
        {pendingLocally
          ? t("social.suggested.pending", "Pending")
          : send.isPending
            ? "…"
            : t("social.suggested.add", "Add")}
      </button>
    </li>
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
  const { t } = useTranslation();
  const langPath = useLangPath();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "unfriend" | "block">(null);
  const unfriend = useUnfriend();
  const block = useBlockUser();

  return (
    <li className="group flex items-center gap-3 bg-surface px-3 py-2.5 transition hover:bg-surface-muted">
      <ProfilePreviewPopover user={user} />
      <div className="min-w-0 flex-1">
        <Link
          to={`/u/${encodeURIComponent(user.name)}`}
          className="flex items-center gap-1.5 hover:underline focus:underline focus:outline-none"
          aria-label={t("social.friends.openProfileAria", "Open {{name}}'s profile", {
            name: user.name,
          })}
        >
          <UsernameDisplay name={user.name} cosmetic={user.cosmetic} className="truncate text-[13px]" />
          <span className="text-[11px]" aria-hidden>
            {user.language.flag}
          </span>
        </Link>
        <p className="truncate text-[11px] text-text-muted">{user.lastActiveLabel}</p>
      </div>
      <span className="inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-1.5 py-0.5 text-[11px] font-bold text-warning">
        <Icon name="flame" size={10} aria-hidden />
        {user.streakDays}
      </span>
      <Link
        to={langPath(`messenger/${user.id}`)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition hover:bg-accent-muted hover:text-accent"
        aria-label={t("social.friends.messageAria", "Message {{name}}", { name: user.name })}
      >
        <Icon name="messageCircle" size={14} aria-hidden />
      </Link>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={t("social.friends.moreAria", "More actions for {{name}}", {
            name: user.name,
          })}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
        >
          <Icon name="moreHorizontal" size={14} aria-hidden />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 w-44 rounded-md border border-border bg-surface py-1 shadow-popover"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              role="menuitem"
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-muted"
              onClick={() => {
                setMenuOpen(false);
                setConfirm("unfriend");
              }}
            >
              {t("social.friends.unfriend", "Unfriend")}
            </button>
            <button
              role="menuitem"
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-error hover:bg-error/10"
              onClick={() => {
                setMenuOpen(false);
                setConfirm("block");
              }}
            >
              {t("social.friends.block", "Block")}
            </button>
          </div>
        ) : null}
      </div>
      {confirm === "unfriend" ? (
        <ConfirmModal
          title={t("social.friends.unfriendConfirmTitle", "Unfriend {{name}}?", {
            name: user.name,
          })}
          message={t(
            "social.friends.unfriendConfirmBody",
            "You'll stop seeing each other on leaderboards and the activity feed.",
          )}
          cancelLabel={t("social.friends.cancel", "Cancel")}
          confirmLabel={t("social.friends.unfriend", "Unfriend")}
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
          title={t("social.friends.blockConfirmTitle", "Block {{name}}?", { name: user.name })}
          message={t(
            "social.friends.blockConfirmBody",
            "Blocked users can't message you, see your profile, or appear in your leaderboards.",
          )}
          cancelLabel={t("social.friends.cancel", "Cancel")}
          confirmLabel={t("social.friends.block", "Block")}
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

function FriendRequestRow({ user }: { user: SocialUser }) {
  const { t } = useTranslation();
  const accept = useAcceptFriendRequest();
  const decline = useDeclineFriendRequest();
  const isBusy = accept.isPending || decline.isPending;

  return (
    <li className="flex items-center gap-2.5 bg-accent-muted/30 px-3 py-2">
      <ProfilePreviewPopover user={user} />
      <Link
        to={`/u/${encodeURIComponent(user.name)}`}
        className="min-w-0 flex-1 hover:underline focus:underline focus:outline-none"
        aria-label={t("social.requests.openProfileAria", "View {{name}}'s profile before accepting", {
          name: user.name,
        })}
      >
        <UsernameDisplay name={user.name} cosmetic={user.cosmetic} className="truncate text-xs" />
        <p className="truncate text-[10px] text-text-muted">
          {user.language.flag} {user.language.label}
        </p>
      </Link>
      <button
        type="button"
        disabled={isBusy}
        onClick={() => accept.mutate(user.id)}
        className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
        aria-label={t("social.requests.acceptAria", "Accept request from {{name}}", {
          name: user.name,
        })}
      >
        {accept.isPending ? "…" : t("social.requests.accept", "Accept")}
      </button>
      <button
        type="button"
        disabled={isBusy}
        onClick={() => decline.mutate(user.id)}
        className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-surface text-text-secondary transition hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
        aria-label={t("social.requests.declineAria", "Decline request from {{name}}", {
          name: user.name,
        })}
      >
        <Icon name="close" size={11} aria-hidden />
      </button>
    </li>
  );
}
