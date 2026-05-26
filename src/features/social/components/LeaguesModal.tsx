/**
 * LeaguesModal — visual tier explorer.
 *
 * Vertical list of all tiers (Diamond at the top → Bronze at the bottom)
 * with the user's current league pinned to its row via a "You're here"
 * pill + accent ring. A faint connecting line on the left renders a
 * path-to-the-top progression visual.
 *
 * Opens via the standard `open` + `onClose` pair so the parent owns the
 * dialog state (mirrors `FindFriendModal`). Closing on backdrop click or
 * ESC; the modal traps focus via `aria-modal` only — no focus manager
 * (matches the existing dialog pattern in the codebase).
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/components/ui/cn";
import {
  LEAGUE_TIERS,
  LEAGUE_TIER_TOTAL,
  getLeagueTier,
  type LeagueTier,
} from "../data/leagueTiers";

type Props = {
  open: boolean;
  onClose: () => void;
  /**
   * The user's current tier index. Highlights the matching row.
   * Pass null when the player hasn't been placed yet — the modal still
   * renders the full ladder, just without a "You're here" pill.
   */
  currentTierIndex: number | null;
};

export function LeaguesModal({ open, onClose, currentTierIndex }: Props) {
  const { t } = useTranslation();

  // Close on ESC — the codebase has no focus-trap util yet, so a simple
  // global keydown listener is the path of least resistance.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Top-tier first (descending index) so the player sees the peak first.
  // Use a fresh array because LEAGUE_TIERS is exported as readonly.
  const orderedTiers: LeagueTier[] = [...LEAGUE_TIERS].reverse();
  const current =
    currentTierIndex !== null ? getLeagueTier(currentTierIndex) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leagues-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-border bg-surface shadow-xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2
              id="leagues-modal-title"
              className="text-base font-semibold text-text-primary"
            >
              {t("social.leagues.title", "Leagues")}
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {t(
                "social.leagues.subtitle",
                "Earn weekly XP to climb the ladder. Top tiers reset every Monday.",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted"
            aria-label={t("common.close", "Close")}
          >
            ✕
          </button>
        </header>

        <ol
          className="relative flex-1 overflow-y-auto px-5 py-4"
          data-testid="leagues-modal-list"
        >
          {/* Path-to-the-top connector — a single vertical line drawn
              behind the tier rows. Aligns with the emoji badge column. */}
          <span
            aria-hidden
            className="absolute bottom-6 left-[36px] top-6 w-px bg-gradient-to-b from-accent/40 via-border to-border"
          />

          {orderedTiers.map((tier, i) => {
            const isCurrent = current?.index === tier.index;
            const isAbove =
              current !== null && tier.index > current.index;
            return (
              <li
                key={tier.index}
                className={cn(
                  "relative flex items-start gap-3 rounded-lg px-2 py-3",
                  isCurrent
                    ? "bg-accent-muted ring-2 ring-accent"
                    : isAbove
                      ? "opacity-90"
                      : "",
                  i > 0 ? "mt-2" : "",
                )}
                data-testid={`leagues-modal-row-${tier.index}`}
                data-current={isCurrent ? "true" : undefined}
              >
                <div
                  className={cn(
                    "z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl shadow-sm",
                    isCurrent
                      ? "bg-accent text-on-accent"
                      : "bg-surface-muted",
                  )}
                  aria-hidden
                >
                  {tier.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary">
                      {tier.name}
                    </h3>
                    {isCurrent ? (
                      <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-accent">
                        {t("social.leagues.youreHere", "You're here")}
                      </span>
                    ) : null}
                    <span className="ml-auto shrink-0 text-[11px] text-text-muted">
                      {t("social.leagues.tierOf", "Tier {{n}} of {{total}}", {
                        n: tier.index + 1,
                        total: LEAGUE_TIER_TOTAL,
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {tier.description}
                  </p>
                  {tier.weeklyXpThreshold > 0 ? (
                    <p className="mt-1 text-[11px] font-medium text-text-muted">
                      {t(
                        "social.leagues.threshold",
                        "~{{n}} weekly XP to reach",
                        { n: tier.weeklyXpThreshold.toLocaleString() },
                      )}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] font-medium text-text-muted">
                      {t("social.leagues.starterTier", "Starting tier")}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <footer className="border-t border-border px-5 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-on-accent shadow-sm hover:bg-accent-hover"
          >
            {t("common.close", "Close")}
          </button>
        </footer>
      </div>
    </div>
  );
}
