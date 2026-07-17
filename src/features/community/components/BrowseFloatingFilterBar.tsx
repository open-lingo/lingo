import { useEffect, useState } from "react";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";

export type BrowseFloatingFilterBarProps = {
  /** Number of active filters (excluding sort + type), drives the badge. */
  activeCount: number;
  /** Current result count, shown inline. */
  resultCount: number;
  /** Human label for the active sort, shown as a quick chip. */
  sortLabel: string;
  /** Cycle to the next sort option. */
  onCycleSort: () => void;
  /** Open / scroll to the faceted sidebar. */
  onOpenFilters: () => void;
  /** i18n labels. */
  filtersLabel: string;
  sortByLabel: string;
  resultsLabel: string;
  /** Show the bar after the window scrolls past this many px (default 280). */
  showAfter?: number;
};

/**
 * Floating pill filter bar — a fixed, bottom-centered control that fades in
 * once the user scrolls past the static filter chrome. Gives one-tap access to
 * filters + sort without scrolling back up. Mirrors the in-page state; it does
 * not own any filter logic.
 */
export function BrowseFloatingFilterBar({
  activeCount,
  resultCount,
  sortLabel,
  onCycleSort,
  onOpenFilters,
  filtersLabel,
  sortByLabel,
  resultsLabel,
  showAfter = 280,
}: BrowseFloatingFilterBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > showAfter);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfter]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 transition-all duration-200",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border bg-surface/95 px-1.5 py-1.5 shadow-card backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-text-primary transition hover:bg-surface-muted"
        >
          <Icon name="slidersHorizontal" size={15} aria-hidden />
          <span>{filtersLabel}</span>
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold tabular-nums text-accent-foreground">
              {activeCount}
            </span>
          )}
        </button>
        <span className="h-5 w-px bg-border" aria-hidden />
        <button
          type="button"
          onClick={onCycleSort}
          title={sortByLabel}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
        >
          <Icon name="trendingUp" size={15} aria-hidden />
          <span>{sortLabel}</span>
        </button>
        <span className="h-5 w-px bg-border" aria-hidden />
        <span className="px-2 text-xs tabular-nums text-text-muted">
          <span className="font-semibold text-text-primary">{resultCount}</span>{" "}
          {resultsLabel}
        </span>
      </div>
    </div>
  );
}
