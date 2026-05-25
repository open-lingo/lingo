/**
 * Lightweight profile preview popover for surfaces where we only know a
 * user's public handle + display name — contributor lists, deck
 * maintainer chips, the community right rail, etc. Shows a "card" with:
 *
 *   • Display name + @handle
 *   • Optional inline stats (when caller passes them)
 *   • "View profile" link → /u/<username>
 *   • <AddFriendButton /> for the actual friend mutation
 *
 * For the richer popover used on the social activity feed (with full
 * `SocialUser` shape, stats grid, frames, cosmetics) see
 * `ProfilePreviewPopover.tsx`. This component intentionally takes only
 * the cheap inputs the marketplace surfaces have on hand.
 */
import { useState, type ReactNode, type MouseEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Avatar } from "@/features/community/components/Avatar";
import { cn } from "@/shared/components/ui/cn";
import { AddFriendButton } from "./AddFriendButton";

export type UserPreviewPopoverProps = {
  /** Public username / handle — used for routing + add-friend mutation. */
  username: string;
  /** Display name for the popover heading. Falls back to ``@username``. */
  displayName?: string;
  /** Optional avatar image URL (when known from backend). */
  imageUrl?: string;
  /** Optional inline stats row — e.g. ``"18 decks · 312 followers"``. */
  statsLine?: string;
  /** Trigger element (avatar+name link, etc). Click toggles the popover. */
  children: ReactNode;
  /** Render trigger inline (default) or as a block-level container. */
  inline?: boolean;
  /** Extra classes for the trigger wrapper. */
  className?: string;
};

export function UserPreviewPopover({
  username,
  displayName,
  imageUrl,
  statsLine,
  children,
  inline = true,
  className,
}: UserPreviewPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const onTriggerClick = (e: MouseEvent) => {
    // Prevent the wrapped Link / Card from navigating when the user is
    // trying to peek at the profile.
    e.preventDefault();
    e.stopPropagation();
    setOpen((o) => !o);
  };

  const onTriggerKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((o) => !o);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const Wrapper = inline ? "span" : "div";

  return (
    <Wrapper className={cn(inline ? "relative inline-block" : "relative block", className)}>
      <span
        role="button"
        tabIndex={0}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKey}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="cursor-pointer rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {children}
      </span>

      {open ? (
        <>
          <button
            type="button"
            aria-label={t("common.close")}
            className="fixed inset-0 z-30 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label={t("social.preview.dialogLabel", "Profile preview")}
            className="absolute left-0 top-full z-40 mt-2 w-72 rounded-xl border border-border bg-surface shadow-card"
          >
            <div className="flex items-start gap-3 p-4">
              <Avatar name={displayName ?? username} src={imageUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {displayName ?? `@${username}`}
                </p>
                <p className="truncate text-xs text-text-muted">@{username}</p>
                {statsLine ? (
                  <p className="mt-1 truncate text-xs text-text-secondary">{statsLine}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-border px-4 py-3">
              <AddFriendButton targetUsername={username} size="md" className="w-full justify-center" />
              <Link
                to={`/u/${encodeURIComponent(username)}`}
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
              >
                <Icon name="user" size={14} aria-hidden />
                {t("social.preview.viewProfile", "View profile")}
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </Wrapper>
  );
}
