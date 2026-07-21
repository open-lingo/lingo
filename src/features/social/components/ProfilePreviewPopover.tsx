/**
 * Click-to-open profile preview. Steam / Discord style mini-card with key
 * stats, language, and quick actions. Mock-only — real impl will be a
 * controlled Popover with backend-fetched profile data.
 */
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { UserAvatar } from "./UserAvatar";
import { UsernameDisplay } from "./UsernameDisplay";
import type { SocialUser } from "../types";

type Props = {
  user: SocialUser;
  /** Optional override for the trigger; defaults to the user's avatar. */
  children?: React.ReactNode;
};

export function ProfilePreviewPopover({ user, children }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // Flip the 288px panel to the right edge when opening from a trigger in the
  // right half of the viewport, so it never overflows off-screen on mobile.
  const [alignRight, setAlignRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function toggle() {
    setOpen((o) => {
      const next = !o;
      if (next && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const PANEL_WIDTH = 288; // w-72
        const MARGIN = 8;
        setAlignRight(rect.left + PANEL_WIDTH > window.innerWidth - MARGIN);
      }
      return next;
    });
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={toggle}
        className="cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {children ?? (
          <UserAvatar
            name={user.name}
            imageUrl={user.imageUrl}
            status={user.status}
            frame={user.frame}
            size="md"
          />
        )}
      </button>

      {open ? (
        <>
          {/* Backdrop to close on outside click */}
          <button
            type="button"
            aria-label="Close profile preview"
            className="fixed inset-0 z-30 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            className={cn(
              "absolute top-full z-40 mt-2 w-72 max-w-[calc(100vw-1rem)] rounded-card border border-border bg-surface shadow-card",
              alignRight ? "right-0" : "left-0",
            )}
          >
            <div className="flex items-start gap-3 p-4">
              <UserAvatar
                name={user.name}
                imageUrl={user.imageUrl}
                status={user.status}
                frame={user.frame}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <UsernameDisplay name={user.name} cosmetic={user.cosmetic} className="text-base" />
                </div>
                <p className="mt-0.5 text-xs text-text-muted">
                  <span aria-hidden>{user.language.flag}</span> {user.language.label} ·{" "}
                  {user.lastActiveLabel}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-border px-4 py-3 text-center">
              <Stat label="Streak" value={`${user.streakDays}d`} icon="flame" />
              <Stat label="XP" value={user.totalXp.toLocaleString()} icon="star" />
              <Stat label="Lessons" value={String(user.lessonsCompleted)} icon="graduationCap" />
            </div>
            <div className="flex gap-2 border-t border-border px-4 py-3">
              <Link
                to={`/u/${encodeURIComponent(user.name)}`}
                onClick={() => setOpen(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
              >
                <Icon name="user" size={14} aria-hidden />
                {t("social.preview.viewProfile", "View profile")}
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: "flame" | "star" | "graduationCap" }) {
  return (
    <div>
      <div className="inline-flex items-center gap-1 text-xs text-text-muted">
        <Icon name={icon} size={11} aria-hidden />
        {label}
      </div>
      <div className="text-sm font-bold text-text-primary">{value}</div>
    </div>
  );
}
