/**
 * Discoverable add-friend CTA that derives its state from the current
 * friend list + outgoing friend requests cache. Renders one of:
 *
 *   • "You"       — self (disabled)
 *   • "Friends"   — already friends (disabled)
 *   • "Pending"   — outgoing request in flight (disabled)
 *   • "Add"       — call to action (enabled)
 *
 * Inline (vs. hidden inside a popover) so it's discoverable on mobile.
 *
 * The button is keyed by ``targetUsername`` because that's the only
 * stable identifier surfaces like the Contributors page expose. If the
 * caller knows the backend ``user_id`` it can pass it as well — the
 * cached friend rows + outgoing-request rows carry user IDs that we
 * cross-check against either field.
 */
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { useApiOptional } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import { useMe } from "@/shared/hooks/useMe";
import { useSendFriendRequest } from "../hooks/useSocialMutations";
import { SOCIAL_QUERY_KEYS } from "../hooks/useSocial";
import type { Friend as ApiFriend, FriendRequestsBundle } from "@/shared/api/social";

export type AddFriendButtonProps = {
  /** Public username (handle) of the target user. */
  targetUsername: string;
  /** Optional backend user id of the target — improves match accuracy. */
  targetUserId?: string;
  /** Compact vs default sizing. */
  size?: "sm" | "md";
  /** Render the actionable "Add" CTA as an icon-only button (label moves to
   *  `aria-label` + `title`). Resolved/disabled states still render their
   *  short text so the relationship stays legible. */
  iconOnly?: boolean;
  /** Extra classes to merge with the base styling. */
  className?: string;
};

type FriendState = "self" | "friend" | "pending" | "none" | "loading" | "anon";

function caseInsensitiveEqual(a: string | undefined | null, b: string | undefined | null) {
  if (!a || !b) return false;
  return a.toLocaleLowerCase() === b.toLocaleLowerCase();
}

/** Resolve current user's username via the shared `useMe()` query. Returns
 *  null when unauthenticated or the API client isn't mounted. */
function useMyUsername(): string | null {
  const { me } = useMe();
  return me?.username ?? null;
}

export function AddFriendButton({
  targetUsername,
  targetUserId,
  size = "sm",
  iconOnly = false,
  className,
}: AddFriendButtonProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const apiOpt = useApiOptional();
  const myUsername = useMyUsername();
  const qc = useQueryClient();

  // Read friends + friend-requests from the cache via passive queries. We
  // don't trigger network here — these queries are seeded by the Social
  // page surfaces. Without the seed the state stays "none" until the user
  // clicks; the click fires and onSuccess invalidates, refreshing for
  // future renders.
  const friends = qc.getQueryData<ApiFriend[]>(SOCIAL_QUERY_KEYS.friends) ?? [];
  const requests = qc.getQueryData<FriendRequestsBundle>(
    SOCIAL_QUERY_KEYS.friendRequests,
  );

  const state: FriendState = useMemo(() => {
    if (!isAuthenticated) return "anon";
    if (!apiOpt) return "loading";
    if (caseInsensitiveEqual(myUsername, targetUsername)) return "self";

    const isFriend = friends.some(
      (f) =>
        caseInsensitiveEqual(f.username, targetUsername) ||
        (targetUserId !== undefined && f.user_id === targetUserId),
    );
    if (isFriend) return "friend";

    const outgoing = requests?.outgoing ?? [];
    const incoming = requests?.incoming ?? [];
    const sentOut = outgoing.some(
      (r) =>
        caseInsensitiveEqual(r.username, targetUsername) ||
        (targetUserId !== undefined && r.user_id === targetUserId),
    );
    if (sentOut) return "pending";
    const incomingMatch = incoming.some(
      (r) =>
        caseInsensitiveEqual(r.username, targetUsername) ||
        (targetUserId !== undefined && r.user_id === targetUserId),
    );
    if (incomingMatch) return "pending";

    return "none";
  }, [apiOpt, isAuthenticated, myUsername, targetUsername, targetUserId, friends, requests]);

  const send = useSendFriendRequest();

  const onClick = () => {
    if (state !== "none") return;
    send.mutate({ toUsername: targetUsername });
  };

  const sizeClasses =
    size === "md"
      ? "px-3 py-1.5 text-sm gap-1.5"
      : "px-2 py-1 text-xs gap-1";

  if (state === "self") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-border bg-surface-muted text-text-muted",
          sizeClasses,
          className,
        )}
      >
        {t("social.addFriend.self", "You")}
      </span>
    );
  }

  if (state === "friend") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-accent-muted bg-accent-muted text-accent",
          sizeClasses,
          className,
        )}
      >
        <Icon name="check" size={size === "md" ? 14 : 12} aria-hidden />
        {t("social.addFriend.friends", "Friends")}
      </span>
    );
  }

  if (state === "pending") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-border bg-surface text-text-muted",
          sizeClasses,
          className,
        )}
      >
        {t("social.addFriend.pending", "Pending")}
      </span>
    );
  }

  const busy = send.isPending;
  const addLabel = busy
    ? t("social.addFriend.sending", "Sending…")
    : t("social.addFriend.add", "Add friend");

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy || state === "anon" || state === "loading"}
        aria-label={addLabel}
        title={addLabel}
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground shadow-sm transition hover:bg-accent-hover disabled:opacity-50 disabled:hover:bg-accent",
          size === "md" ? "h-8 w-8" : "h-7 w-7",
          className,
        )}
      >
        <Icon name="userPlus" size={size === "md" ? 15 : 13} aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || state === "anon" || state === "loading"}
      className={cn(
        "inline-flex items-center rounded-md bg-accent text-accent-foreground font-semibold shadow-sm transition hover:bg-accent-hover disabled:opacity-50 disabled:hover:bg-accent",
        sizeClasses,
        className,
      )}
    >
      <Icon name="userPlus" size={size === "md" ? 14 : 12} aria-hidden />
      {addLabel}
    </button>
  );
}

/** Hook export so callers can adapt their UI (e.g., a popover) based on
 *  whether the button would render an enabled CTA. */
export function useFriendState(targetUsername: string, targetUserId?: string): FriendState {
  const { isAuthenticated } = useAuth();
  const apiOpt = useApiOptional();
  const myUsername = useMyUsername();
  const qc = useQueryClient();
  const friends = qc.getQueryData<ApiFriend[]>(SOCIAL_QUERY_KEYS.friends) ?? [];
  const requests = qc.getQueryData<FriendRequestsBundle>(
    SOCIAL_QUERY_KEYS.friendRequests,
  );

  return useMemo<FriendState>(() => {
    if (!isAuthenticated) return "anon";
    if (!apiOpt) return "loading";
    if (caseInsensitiveEqual(myUsername, targetUsername)) return "self";
    const isFriend = friends.some(
      (f) =>
        caseInsensitiveEqual(f.username, targetUsername) ||
        (targetUserId !== undefined && f.user_id === targetUserId),
    );
    if (isFriend) return "friend";
    const outgoing = requests?.outgoing ?? [];
    const incoming = requests?.incoming ?? [];
    const sentOut = outgoing.some(
      (r) =>
        caseInsensitiveEqual(r.username, targetUsername) ||
        (targetUserId !== undefined && r.user_id === targetUserId),
    );
    if (sentOut) return "pending";
    const incomingMatch = incoming.some(
      (r) =>
        caseInsensitiveEqual(r.username, targetUsername) ||
        (targetUserId !== undefined && r.user_id === targetUserId),
    );
    if (incomingMatch) return "pending";
    return "none";
  }, [apiOpt, isAuthenticated, myUsername, targetUsername, targetUserId, friends, requests]);
}

// Re-export the small hook so callers can use it without importing twice.
export { useMyUsername };
