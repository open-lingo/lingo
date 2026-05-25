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
import type { FriendshipStatus } from "@/shared/api/social";
import { usePublicProfile } from "./usePublicProfile";

type ActionState = "idle" | "pending" | "done";

function formatJoinDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, { year: "numeric", month: "long" });
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
    void runAction(social.sendFriendRequest({ toUsername: username! }));
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

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label={t("profile.publicStreakLabel", "Streak")} value={`${streak} 🔥`} />
          <Stat label={t("profile.publicXpLabel", "XP")} value={xp.toLocaleString()} />
          {learningLanguage && (
            <Stat
              label={t("profile.publicLearningLabel", "Learning")}
              value={learningLanguage.toUpperCase()}
            />
          )}
          {joined && (
            <Stat label={t("profile.publicJoinedLabel", "Joined")} value={joined} />
          )}
        </dl>

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
