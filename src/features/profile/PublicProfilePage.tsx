/**
 * PublicProfilePage — global ``/u/:username`` route. Visible to logged-out
 * viewers; works for self / friend / stranger views.
 *
 * Renders the correct primary action for the viewer↔target relationship:
 *
 *   ``self``         → "Edit profile" (opens settings)
 *   ``none``         → "Add friend" (POST /social/v1/friends/requests)
 *   ``request_out``  → "Request sent" (disabled)
 *   ``request_in``   → "Accept request" (POST .../accept)
 *   ``friend``       → "Friends" w/ dropdown to Unfriend / Block
 *   ``blocked``      → "Unblock" (DELETE /social/v1/blocks/{id})
 *
 * When the social endpoint 404s the page renders a "private profile" panel
 * — see usePublicProfile for the visibility flow.
 */

import { useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useApi } from "@/shared/api/provider";
import { useAuth } from "@/shared/auth/useAuth";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Button } from "@/shared/components/ui/Button";
import { ApiError } from "@/shared/api/client";
import type { AuthoredDeckSample, FriendshipStatus } from "@/shared/api/social";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { usePublicProfile } from "./usePublicProfile";

type ActionState = "idle" | "pending" | "done";

function formatJoinDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, { year: "numeric", month: "long" });
}

/**
 * Format a last-active timestamp. Recent activity collapses to relative
 * ("active 2h ago"), older falls back to absolute ("last seen May 25").
 */
function formatLastActive(
  iso: string | null | undefined,
  locale: string,
  t: TFunction,
): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const deltaMs = Date.now() - d.getTime();
  if (deltaMs < 0) {
    // Future clock skew; render as "active now" rather than "in 2h".
    return t("profile.publicLastActiveNow", "active now");
  }
  const mins = Math.floor(deltaMs / 60_000);
  if (mins < 1) return t("profile.publicLastActiveNow", "active now");
  if (mins < 60) return `active ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `active ${days}d ago`;
  return `last seen ${d.toLocaleDateString(locale, { month: "short", day: "numeric" })}`;
}

/**
 * Approximate XP curve for the "XP to next level" display. Mirrors the
 * back-end progression at a glance; exact values aren't load-bearing here
 * since the backend authoritatively assigns levels.
 */
function xpToNextLevel(level: number, xp: number): number {
  const nextThreshold = (level + 1) * 100 * (1 + (level - 1) * 0.15);
  const remaining = Math.max(0, Math.ceil(nextThreshold - xp));
  return remaining;
}

function formatLearningLanguage(code: string | null | undefined): string | null {
  if (!code) return null;
  const cfg = getLanguageConfig(code);
  if (cfg) return `${cfg.flag} ${cfg.name}`;
  return code.toUpperCase();
}

const PROFILE_CARD_STYLE: CSSProperties = {
  // Same surface treatment used by other detail pages; kept as inline style
  // to avoid pulling in a one-off util class.
  borderRadius: "0.75rem",
};

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { t, i18n } = useTranslation();
  const { social } = useApi();
  const { login, isAuthenticated } = useAuth();

  const { user, social: socialProfile, isPrivate, notFound, isLoading, isError, refetch } =
    usePublicProfile(username);

  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionError, setActionError] = useState<string | null>(null);

  const friendship: FriendshipStatus | null | undefined = socialProfile?.friendship_status;

  if (!username) {
    return <ProfileShell heading={t("profile.publicNotFound", "Profile not found")} />;
  }
  if (isLoading) {
    return (
      <ProfileShell heading={t("profile.publicLoading", "Loading profile…")}>
        <div className="motion-safe:animate-pulse text-sm text-text-muted">…</div>
      </ProfileShell>
    );
  }
  if (notFound || (!user && !socialProfile && !isPrivate)) {
    return (
      <ProfileShell heading={t("profile.publicNotFound", "Profile not found")}>
        <p className="text-sm text-text-secondary">
          {t(
            "profile.publicNotFoundDesc",
            "We couldn’t find a learner with that username.",
          )}
        </p>
      </ProfileShell>
    );
  }
  if (isPrivate) {
    return (
      <ProfileShell heading={t("profile.publicPrivate", "This profile is private")}>
        <p className="text-sm text-text-secondary">
          {t(
            "profile.publicPrivateDesc",
            "Only friends can view this learner’s profile.",
          )}
        </p>
      </ProfileShell>
    );
  }
  if (isError) {
    return (
      <ProfileShell heading={t("profile.publicError", "Something went wrong")}>
        <p className="text-sm text-text-secondary">
          {t("profile.publicErrorDesc", "Please try again.")}
        </p>
      </ProfileShell>
    );
  }

  // Prefer enriched social fields, fall back to plain user fields.
  const displayName = socialProfile?.display_name ?? user?.display_name ?? username;
  const avatarSrc =
    socialProfile?.profile_picture_key ?? user?.profile_picture_key ?? undefined;
  const bio = socialProfile?.bio ?? user?.bio ?? null;
  const learningLanguage = socialProfile?.learning_language ?? null;
  const xp = socialProfile?.xp ?? 0;
  const streak = socialProfile?.streak ?? 0;
  const joined = formatJoinDate(socialProfile?.joined_at ?? user?.created_at, i18n.language);
  // Enriched fields (Task 2). All optional on the type — degrade gracefully.
  const lingots = socialProfile?.lingots ?? 0;
  const level = socialProfile?.level ?? 1;
  const lastActiveLabel = formatLastActive(
    socialProfile?.last_active_date,
    i18n.language,
    t,
  );
  const learningLanguageLabel = formatLearningLanguage(learningLanguage);
  const authoredCount = socialProfile?.authored_deck_count ?? 0;
  const authoredSample: AuthoredDeckSample[] =
    socialProfile?.authored_decks_sample ?? [];
  const xpRemaining = xpToNextLevel(level, xp);
  const league = socialProfile?.league ?? null;

  async function runAction(p: Promise<unknown>, successOnDone = true) {
    setActionState("pending");
    setActionError(null);
    try {
      await p;
      setActionState(successOnDone ? "done" : "idle");
      await refetch();
    } catch (err) {
      setActionState("idle");
      setActionError(
        err instanceof ApiError && typeof err.body === "object" && err.body && "detail" in err.body
          ? String((err.body as { detail?: unknown }).detail)
          : t("profile.publicActionFailed", "Could not complete that action."),
      );
    }
  }

  function handleAddFriend() {
    if (!isAuthenticated) {
      login();
      return;
    }
    // Backend expects snake_case body fields. The legacy SocialApi types alias
    // them as camelCase; spread both so the request lands intact regardless of
    // which spelling Pydantic reads.
    void runAction(
      social.sendFriendRequest({
        toUsername: username!,
        ...({ to_username: username! } as Record<string, string>),
      } as Parameters<typeof social.sendFriendRequest>[0]),
    );
  }
  function handleAccept() {
    if (!socialProfile) return;
    void runAction(social.acceptFriendRequest(socialProfile.user_id));
  }
  function handleUnblock() {
    if (!socialProfile) return;
    void runAction(social.unblockUser(socialProfile.user_id));
  }
  function handleUnfriend() {
    if (!socialProfile) return;
    void runAction(social.unfriend(socialProfile.user_id));
  }
  function handleBlock() {
    if (!socialProfile) return;
    void runAction(social.blockUser(socialProfile.user_id));
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <section
        className="border border-border bg-surface p-6 shadow-sm"
        style={PROFILE_CARD_STYLE}
        data-testid="public-profile-card"
      >
        <header className="flex flex-wrap items-start gap-4">
          <UserAvatar name={displayName} src={avatarSrc} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-text-primary">
              {displayName}
            </h1>
            <p className="truncate text-sm text-text-muted">@{username}</p>
            {bio && (
              <p className="mt-2 max-w-prose text-sm text-text-secondary">{bio}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <FriendshipBadge status={friendship ?? null} t={t} />
            <PrimaryAction
              status={friendship ?? null}
              actionState={actionState}
              onAddFriend={handleAddFriend}
              onAccept={handleAccept}
              onUnblock={handleUnblock}
              onUnfriend={handleUnfriend}
              onBlock={handleBlock}
              t={t}
            />
          </div>
        </header>

        <dl className="mt-6 grid gap-3 sm:grid-cols-3" data-testid="public-profile-stats">
          <Stat label={t("profile.publicStreakLabel", "Streak")} value={`${streak} 🔥`} />
          <Stat label={t("profile.publicXpLabel", "XP")} value={xp.toLocaleString()} />
          <Stat
            label={t("profile.publicLevelLabel", "Level")}
            value={`Level ${level} · ${xpRemaining.toLocaleString()} XP to next`}
          />
          {league && (
            <Stat
              label={t("profile.publicLeagueLabel", "League")}
              value={`${league.emoji} ${league.name}`}
            />
          )}
          <Stat
            label={t("profile.publicLingotsLabel", "Lingots")}
            value={lingots.toLocaleString()}
          />
          {learningLanguageLabel && (
            <Stat
              label={t("profile.publicLearningLabel", "Learning")}
              value={learningLanguageLabel}
            />
          )}
          {lastActiveLabel && (
            <Stat
              label={t("profile.publicLastActiveLabel", "Last active")}
              value={lastActiveLabel}
            />
          )}
          {joined && (
            <Stat label={t("profile.publicJoinedLabel", "Joined")} value={joined} />
          )}
        </dl>

        {authoredCount > 0 && (
          <section className="mt-6" data-testid="public-profile-authored">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              {`Authored decks (${authoredCount})`}
            </h2>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {authoredSample.map((d) => (
                <li
                  key={d.id}
                  className="rounded-lg border border-border bg-surface-muted px-3 py-2"
                >
                  <Link
                    to={`/decks/${d.id}`}
                    className="block text-sm font-medium text-text-primary hover:underline"
                  >
                    {d.name || t("profile.publicUnnamedDeck", "(unnamed deck)")}
                  </Link>
                  {d.language && (
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-text-muted">
                      {d.language}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {authoredCount > authoredSample.length && (
              <p className="mt-2 text-xs text-text-muted">
                {`+ ${authoredCount - authoredSample.length} more`}
              </p>
            )}
          </section>
        )}

        {actionError && (
          <p
            role="alert"
            className="mt-4 rounded border border-error/40 bg-error/10 px-3 py-2 text-sm text-error"
          >
            {actionError}
          </p>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-text-primary">{value}</dd>
    </div>
  );
}

function ProfileShell({
  heading,
  children,
}: {
  heading: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-text-primary">{heading}</h1>
      {children && <div className="mt-3">{children}</div>}
    </main>
  );
}

function FriendshipBadge({
  status,
  t,
}: {
  status: FriendshipStatus | null;
  t: TFunction;
}) {
  if (!status || status === "self") return null;
  const label =
    status === "friend"
      ? t("profile.badgeFriend", "Friends")
      : status === "request_in"
        ? t("profile.badgeRequestIn", "Wants to be friends")
        : status === "request_out"
          ? t("profile.badgeRequestOut", "Request pending")
          : status === "blocked"
            ? t("profile.badgeBlocked", "Blocked")
            : null;
  if (!label) return null;
  const tone =
    status === "friend"
      ? "bg-accent-muted text-accent"
      : status === "blocked"
        ? "bg-error/15 text-error"
        : "bg-surface-muted text-text-secondary";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

function PrimaryAction({
  status,
  actionState,
  onAddFriend,
  onAccept,
  onUnblock,
  onUnfriend,
  onBlock,
  t,
}: {
  status: FriendshipStatus | null;
  actionState: ActionState;
  onAddFriend: () => void;
  onAccept: () => void;
  onUnblock: () => void;
  onUnfriend: () => void;
  onBlock: () => void;
  t: TFunction;
}) {
  const busy = actionState === "pending";

  if (status === "self") {
    return (
      <Link
        to="/settings/profile"
        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-muted"
      >
        {t("profile.publicEditProfile", "Edit profile")}
      </Link>
    );
  }
  if (status === "request_out") {
    return (
      <Button type="button" disabled variant="ghost" size="sm">
        {t("profile.publicRequestSent", "Request sent")}
      </Button>
    );
  }
  if (status === "request_in") {
    return (
      <Button type="button" onClick={onAccept} disabled={busy} variant="primary" size="sm">
        {busy ? "…" : t("profile.publicAcceptRequest", "Accept request")}
      </Button>
    );
  }
  if (status === "friend") {
    return (
      <FriendDropdown
        onUnfriend={onUnfriend}
        onBlock={onBlock}
        busy={busy}
        t={t}
      />
    );
  }
  if (status === "blocked") {
    return (
      <Button type="button" onClick={onUnblock} disabled={busy} variant="ghost" size="sm">
        {busy ? "…" : t("profile.publicUnblock", "Unblock")}
      </Button>
    );
  }
  // status === "none" or null (logged-out viewer)
  return (
    <Button type="button" onClick={onAddFriend} disabled={busy} variant="primary" size="sm">
      {busy ? "…" : t("profile.publicAddFriend", "Add friend")}
    </Button>
  );
}

function FriendDropdown({
  onUnfriend,
  onBlock,
  busy,
  t,
}: {
  onUnfriend: () => void;
  onBlock: () => void;
  busy: boolean;
  t: TFunction;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {busy ? "…" : t("profile.publicFriends", "Friends ▾")}
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 w-44 rounded-md border border-border bg-surface py-1 shadow-popover"
        >
          <button
            role="menuitem"
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-muted"
            onClick={() => {
              setOpen(false);
              onUnfriend();
            }}
          >
            {t("profile.publicUnfriend", "Unfriend")}
          </button>
          <button
            role="menuitem"
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-error hover:bg-error/10"
            onClick={() => {
              setOpen(false);
              onBlock();
            }}
          >
            {t("profile.publicBlock", "Block")}
          </button>
        </div>
      )}
    </div>
  );
}

export default PublicProfilePage;
