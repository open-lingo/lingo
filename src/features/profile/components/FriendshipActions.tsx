import { useState } from "react";
import type { TFunction } from "i18next";
import { Button } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import type { FriendshipStatus } from "@/shared/api/social";
import type { ActionState } from "../useProfileRelationshipActions";

export type ProfileMenuItem = {
  key: string;
  label: string;
  icon: IconName;
  danger?: boolean;
  onSelect: () => void;
};

/**
 * Friendship pill — small chip that sits inline with the byline. No
 * background fill except for the destructive states; this is metadata,
 * not a call to action.
 */
export function FriendshipPill({
  status,
  t,
}: {
  status: FriendshipStatus | null;
  t: TFunction;
}) {
  if (!status || status === "self" || status === "none") return null;

  const labelAndIcon: { label: string; icon: IconName; tone: string } | null =
    status === "friend"
      ? {
          label: t("profile.badgeFriend", "Friends"),
          icon: "check",
          tone: "border-accent/40 text-accent bg-accent-muted/40",
        }
      : status === "request_in"
        ? {
            label: t("profile.badgeRequestIn", "Wants to be friends"),
            icon: "userPlus",
            tone: "border-border text-text-secondary bg-surface-muted",
          }
        : status === "request_out"
          ? {
              label: t("profile.badgeRequestOut", "Request pending"),
              icon: "users",
              tone: "border-border text-text-muted bg-surface-muted",
            }
          : status === "blocked"
            ? {
                label: t("profile.badgeBlocked", "Blocked"),
                icon: "shield",
                tone: "border-error/40 text-error bg-error/10",
              }
            : null;

  if (!labelAndIcon) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${labelAndIcon.tone}`}
    >
      <Icon name={labelAndIcon.icon} size={12} strokeWidth={2.5} aria-hidden />
      {labelAndIcon.label}
    </span>
  );
}

export function PrimaryAction({
  status,
  actionState,
  onAddFriend,
  onAccept,
  onUnblock,
  onUnfriend,
  onBlock,
  canImpersonate,
  onImpersonate,
  t,
}: {
  status: FriendshipStatus | null;
  actionState: ActionState;
  onAddFriend: () => void;
  onAccept: () => void;
  onUnblock: () => void;
  onUnfriend: () => void;
  onBlock: () => void;
  /** Viewer is a site admin → expose "Act as user" in the dropdown. */
  canImpersonate: boolean;
  onImpersonate: () => void;
  t: TFunction;
}) {
  const busy = actionState === "pending";

  // status === "self" is handled by the top-right action bar; the right
  // column never renders a self action here.
  if (status === "self") return null;

  // Friends get a dropdown (Unfriend / Block). When the viewer is an admin we
  // fold "Act as user" into that same dropdown — and, for non-friend statuses
  // that otherwise have no menu, render a standalone admin dropdown beside the
  // primary button so impersonation is always reachable.
  const adminItem: ProfileMenuItem | null = canImpersonate
    ? {
        key: "impersonate",
        label: t("profile.publicActAsUser", "Act as user"),
        icon: "venetianMask",
        onSelect: onImpersonate,
      }
    : null;

  if (status === "friend") {
    return (
      <FriendDropdown
        items={[
          {
            key: "unfriend",
            label: t("profile.publicUnfriend", "Unfriend"),
            icon: "userMinus",
            onSelect: onUnfriend,
          },
          {
            key: "block",
            label: t("profile.publicBlock", "Block"),
            icon: "shield",
            danger: true,
            onSelect: onBlock,
          },
          ...(adminItem ? [adminItem] : []),
        ]}
        busy={busy}
        t={t}
      />
    );
  }

  let primary: React.ReactNode;
  if (status === "request_out") {
    primary = (
      <Button type="button" disabled variant="ghost" size="sm">
        {t("profile.publicRequestSent", "Request sent")}
      </Button>
    );
  } else if (status === "request_in") {
    primary = (
      <Button type="button" onClick={onAccept} disabled={busy} variant="primary" size="sm">
        {busy ? "…" : t("profile.publicAcceptRequest", "Accept request")}
      </Button>
    );
  } else if (status === "blocked") {
    primary = (
      <Button type="button" onClick={onUnblock} disabled={busy} variant="ghost" size="sm">
        {busy ? "…" : t("profile.publicUnblock", "Unblock")}
      </Button>
    );
  } else {
    // status === "none" or null (logged-out viewer)
    primary = (
      <Button type="button" onClick={onAddFriend} disabled={busy} variant="primary" size="sm">
        {busy ? "…" : t("profile.publicAddFriend", "Add friend")}
      </Button>
    );
  }

  // For non-friend statuses, attach the admin dropdown alongside the primary
  // button (the dropdown holds only the admin action here).
  if (adminItem) {
    return (
      <div className="flex items-center gap-2">
        {primary}
        <FriendDropdown
          items={[adminItem]}
          busy={busy}
          label={t("profile.publicAdminActions", "Admin")}
          t={t}
        />
      </div>
    );
  }

  return <>{primary}</>;
}

export function FriendDropdown({
  items,
  busy,
  label,
  t,
}: {
  items: ProfileMenuItem[];
  busy: boolean;
  /** Trigger label. Defaults to "Friends". */
  label?: string;
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
        className="!gap-1.5"
      >
        {busy ? "…" : (label ?? t("profile.publicFriends", "Friends"))}
        <Icon name="chevronDown" size={13} strokeWidth={2.25} aria-hidden />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-border bg-surface py-1 shadow-popover"
        >
          {items.map((item) => (
            <button
              key={item.key}
              role="menuitem"
              type="button"
              className={
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm " +
                (item.danger
                  ? "text-error hover:bg-error/10"
                  : "text-text-primary hover:bg-surface-muted")
              }
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              <Icon name={item.icon} size={14} strokeWidth={2.25} aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
