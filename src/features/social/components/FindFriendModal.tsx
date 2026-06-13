/**
 * FindFriendModal — search-driven "add a friend" dialog.
 *
 * Debounced search against `users.discover({ q })`, which returns
 * discoverable learners plus their `friendship_status` so each row can show
 * the correct affordance (Add / Pending / Friends / You) without a second
 * round-trip. Sending a request fires `useSendFriendRequest` by user id and
 * optimistically flips the row to "Pending".
 *
 * Replaces the old blind "type a username and hope it exists" flow.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/shared/api/provider";
import type { PublicUserSummary } from "@/shared/api/users";
import { Icon } from "@/shared/components/Icon";
import { Modal } from "@/shared/components/ui/Modal";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { inputClassName } from "@/shared/components/ui/formStyles";
import { UserAvatar } from "./UserAvatar";
import { useSendFriendRequest } from "@/features/social/hooks/useSocialMutations";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function FindFriendModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const { users } = useApi();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const debounceRef = useRef<number | null>(null);

  // Reset on close so the next open starts clean.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const result = useQuery({
    queryKey: ["users", "discover", debounced],
    queryFn: ({ signal }) => users.discover({ q: debounced, limit: 12 }, signal),
    enabled: open && debounced.length >= 1,
    staleTime: 30_000,
  });

  const rows = result.data?.users ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("social.findFriend.title", "Add a friend")}
      size="md"
    >
      <p className="text-xs text-text-muted">
        {t(
          "social.findFriend.subtitle",
          "Search by username or display name. We'll send a friend request — they have to accept before you appear in each other's lists.",
        )}
      </p>

      <div className="relative mt-3">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          <Icon name="search" size={15} aria-hidden />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("social.findFriend.searchPlaceholder", "Search learners…")}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          className={`${inputClassName} pl-9`}
        />
      </div>

      <div className="mt-3 min-h-[180px]">
        {debounced.length < 1 ? (
          <p className="py-10 text-center text-xs text-text-muted">
            {t("social.findFriend.hint", "Start typing to search for people to add.")}
          </p>
        ) : result.isLoading ? (
          <SearchSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Icon name="search" size={20} aria-hidden />}
            title={t("social.findFriend.noResultsTitle", "No matches")}
            description={t(
              "social.findFriend.noResultsDesc",
              "No learners match that search. Try a different username.",
            )}
          />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((u) => (
              <SearchResultRow key={u.user_id} user={u} />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function SearchResultRow({ user }: { user: PublicUserSummary }) {
  const { t } = useTranslation();
  const send = useSendFriendRequest();
  const [sent, setSent] = useState(false);

  const status = sent ? "request_out" : user.friendship_status;
  const name = user.display_name || user.username;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <UserAvatar
        name={name}
        imageUrl={user.profile_picture_key ?? undefined}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{name}</p>
        <p className="truncate text-[11px] text-text-muted">
          @{user.username}
          {user.weekly_xp > 0
            ? ` · ${user.weekly_xp.toLocaleString()} ${t("social.findFriend.xpWk", "XP/wk")}`
            : ""}
        </p>
      </div>
      <StatusAction
        status={status}
        pending={send.isPending}
        onAdd={() =>
          send.mutate(
            { toUserId: user.user_id },
            { onSuccess: () => setSent(true) },
          )
        }
      />
    </li>
  );
}

function StatusAction({
  status,
  pending,
  onAdd,
}: {
  status: PublicUserSummary["friendship_status"];
  pending: boolean;
  onAdd: () => void;
}) {
  const { t } = useTranslation();

  if (status === "self") {
    return (
      <span className="rounded-md px-2 py-1 text-[11px] font-medium text-text-muted">
        {t("social.addFriend.self", "You")}
      </span>
    );
  }
  if (status === "friend") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-[11px] font-semibold text-success">
        <Icon name="check" size={12} aria-hidden />
        {t("social.addFriend.friends", "Friends")}
      </span>
    );
  }
  if (status === "request_out") {
    return (
      <span className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-text-secondary">
        {t("social.addFriend.pending", "Pending")}
      </span>
    );
  }
  if (status === "request_in") {
    return (
      <span className="rounded-md bg-accent-muted px-2 py-1 text-[11px] font-semibold text-accent">
        {t("social.findFriend.respond", "Respond")}
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="rounded-md px-2 py-1 text-[11px] font-medium text-text-muted">
        {t("social.findFriend.blocked", "Blocked")}
      </span>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onAdd}
      className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1 text-xs font-semibold text-on-accent shadow-sm transition hover:bg-accent-hover disabled:opacity-50"
    >
      <Icon name="userPlus" size={13} aria-hidden />
      {pending
        ? t("social.addFriend.sending", "Sending…")
        : t("social.addFriend.add", "Add friend")}
    </button>
  );
}

function SearchSkeleton() {
  return (
    <ul className="divide-y divide-border" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex animate-pulse items-center gap-3 py-2.5">
          <div className="h-9 w-9 rounded-full bg-border" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 rounded bg-border" />
            <div className="h-2.5 w-20 rounded bg-border" />
          </div>
          <div className="h-6 w-16 rounded bg-border" />
        </li>
      ))}
    </ul>
  );
}
