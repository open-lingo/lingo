/**
 * PickFriendModal — "Start a new conversation" picker.
 *
 * Lists the caller's friends with a search filter; selecting one fires the
 * passed `onPick(friend)` callback so the parent surface can open (or
 * create) the thread. Shape mirrors `FindFriendModal` (same z-50 backdrop,
 * same close-on-backdrop click) so the messenger stays consistent with the
 * existing friend-request modal.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Icon } from "@/shared/components/Icon";
import { UserAvatar } from "./UserAvatar";
import { UsernameDisplay } from "./UsernameDisplay";
import { useFriends } from "../hooks/useSocial";
import type { SocialUser } from "../mock/mockSocial";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (friend: SocialUser) => void;
};

export function PickFriendModal({ open, onClose, onPick }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const { data, isLoading } = useFriends();

  const friends = data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.username ?? "").toLowerCase().includes(q),
    );
  }, [friends, query]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pick-friend-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
      >
        <div className="border-b border-border p-5">
          <h2 id="pick-friend-title" className="text-base font-semibold text-text-primary">
            {t("social.messages.pickFriendTitle", "Start a new conversation")}
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            {t(
              "social.messages.pickFriendSubtitle",
              "Pick a friend to message.",
            )}
          </p>
          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">
              <Icon name="search" size={14} aria-hidden />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                "social.messages.pickFriendSearch",
                "Search friends…",
              )}
              autoFocus
              className="h-9 w-full rounded-md border border-border bg-surface-muted pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:bg-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="max-h-[50vh] min-h-[200px] overflow-y-auto">
          {isLoading ? (
            <p className="px-5 py-8 text-center text-sm text-text-muted">
              {t("social.messages.pickFriendLoading", "Loading friends…")}
            </p>
          ) : friends.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-text-muted">
              {t(
                "social.messages.pickFriendNoneEmpty",
                "Add a friend first — you can't message someone who isn't on your friends list.",
              )}
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-text-muted">
              {t("social.messages.pickFriendNoMatch", "No friends match.")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((friend) => (
                <li key={friend.id}>
                  <button
                    type="button"
                    onClick={() => onPick(friend)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-surface-muted"
                  >
                    <UserAvatar
                      name={friend.name}
                      imageUrl={friend.imageUrl}
                      status={friend.status}
                      frame={friend.frame}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <UsernameDisplay
                        name={friend.name}
                        cosmetic={friend.cosmetic}
                        className="truncate text-sm"
                      />
                      <p className="truncate text-[11px] text-text-muted">
                        {friend.lastActiveLabel}
                      </p>
                    </div>
                    <Icon
                      name="chevronRight"
                      size={14}
                      className="text-text-muted"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end border-t border-border p-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
          >
            {t("common.cancel", "Cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
