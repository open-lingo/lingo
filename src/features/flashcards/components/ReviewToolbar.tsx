import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";

/**
 * The session's control row.
 *
 * `compact={false}` (md and up) renders a FRAGMENT of the two rows the reviewer
 * has always had — the back link + icon cluster + anchored settings popover,
 * then the progress bar — so they stay direct children of the column and its
 * `space-y-4` keeps spacing them exactly as before. Desktop DOM is unchanged.
 *
 * `compact` (below md) collapses both into one slim row, because below `md` the
 * app header, breadcrumbs and bottom tab bar are gone (Decision 2, Spencer
 * 2026-09-02) and this row is the ONLY chrome: exit, progress, the two sheet
 * affordances, and the undo chip when there is something to undo.
 */
type Props = {
  compact: boolean;
  hubPath: string;
  progressPct: number;
  againQueued: number;
  canUndo: boolean;
  onUndo: () => void;
  onOpenInfo: () => void;
  onOpenSettings: () => void;
  settingsOpen: boolean;
  settingsPopover?: ReactNode;
  onOpenDetails?: () => void;
  detailsEnabled: boolean;
};

export function ReviewToolbar({
  compact,
  hubPath,
  progressPct,
  againQueued,
  canUndo,
  onUndo,
  onOpenInfo,
  onOpenSettings,
  settingsOpen,
  settingsPopover,
  onOpenDetails,
  detailsEnabled,
}: Props) {
  const { t } = useTranslation();

  const progressBar = (
    <div
      className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progressPct}
      aria-label={t("flashcards.sessionProgress", "Session progress")}
    >
      <div
        className="h-full rounded-full bg-success transition-all duration-300"
        style={{ width: `${progressPct}%` }}
      />
    </div>
  );

  if (!compact) {
    return (
      <>
        <div className="relative flex items-center justify-between">
          <Link
            to={hubPath}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            {t("flashcards.backToHub")}
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenInfo}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
              aria-label={t("flashcards.info.openLabel", "How review works")}
            >
              <Icon name="info" size={20} />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
              aria-label={t("flashcards.reviewSettings", "Review settings")}
              aria-expanded={settingsOpen}
            >
              <Icon name="settings" size={20} />
            </button>
          </div>
          {settingsPopover}
        </div>
        <div className="flex items-center gap-2">
          {progressBar}
          {againQueued > 0 && (
            <span className="shrink-0 text-xs text-warning">
              +{againQueued} {t("flashcards.againCount")}
            </span>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to={hubPath}
        // 44px square, not the 24px WCAG floor: it is the exit, it sits in the
        // top-left thumb-hostile corner, and the app header that used to carry
        // the way out is hidden on this surface.
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
        aria-label={t("flashcards.backToHub")}
      >
        <Icon name="close" size={22} />
      </Link>
      {progressBar}
      {againQueued > 0 && (
        <span className="shrink-0 text-xs text-warning">+{againQueued}</span>
      )}
      {canUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
          aria-label={t("flashcards.undo", "Undo last grade")}
        >
          <Icon name="rotateCcw" size={18} />
        </button>
      )}
      <button
        type="button"
        onClick={onOpenDetails}
        disabled={!detailsEnabled}
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary disabled:opacity-40"
        aria-label={t("flashcards.detailsLabel", "Card details")}
      >
        <Icon name="list" size={20} />
      </button>
      <button
        type="button"
        onClick={onOpenSettings}
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
        aria-label={t("flashcards.reviewSettings", "Review settings")}
      >
        <Icon name="settings" size={20} />
      </button>
    </div>
  );
}
