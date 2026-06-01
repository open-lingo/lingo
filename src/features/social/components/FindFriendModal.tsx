/**
 * FindFriendModal — minimal "send friend request by username" dialog.
 *
 * Direct lookup, not freeform search — the backend's discover endpoint
 * is still in flight (per INPROGRESS.md). Once /api/core/v1/users/discover
 * lands, swap the username input for an autocompleting search field.
 */

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { useSendFriendRequest } from "@/features/social/hooks/useSocialMutations";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function FindFriendModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const send = useSendFriendRequest();

  if (!open) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim().replace(/^@/, "");
    if (!trimmed) return;
    send.mutate(
      { toUsername: trimmed },
      {
        onSuccess: () => {
          setUsername("");
          onClose();
        },
      },
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="find-friend-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-card"
      >
        <h2 id="find-friend-title" className="text-base font-semibold text-text-primary">
          {t("social.findFriend.title", "Add a friend")}
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          {t(
            "social.findFriend.subtitle",
            "Enter their username. We'll send a friend request — they have to accept before you appear in each other's lists.",
          )}
        </p>

        <label className="mt-4 block text-xs font-medium text-text-secondary">
          {t("social.findFriend.usernameLabel", "Username")}
          <div className="mt-1 flex items-center gap-1 rounded-md border border-border bg-surface-muted px-2 focus-within:border-accent focus-within:bg-surface">
            <span className="text-sm text-text-muted">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              disabled={send.isPending}
              className="h-8 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
        </label>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="submit"
            disabled={!username.trim() || send.isPending}
            className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-on-accent shadow-sm hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {send.isPending
              ? t("social.findFriend.sending", "Sending…")
              : t("social.findFriend.send", "Send request")}
          </button>
        </div>
      </form>
    </div>
  );
}
