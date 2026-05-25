import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./cn";

export type PaginationProps = {
  /** 1-indexed current page. */
  page: number;
  /** Total page count (`Math.ceil(total / pageSize)`). */
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Maximum number of numbered buttons (excluding prev/next). Default 5. */
  maxVisible?: number;
  /** Accessible label for the nav. */
  ariaLabel?: string;
  className?: string;
};

function buildRange(page: number, totalPages: number, maxVisible: number): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Pagination control with prev / numbered pages / next.
 *
 * Mobile behavior: numbered buttons may overflow on very narrow viewports;
 * pass a smaller `maxVisible` (e.g. 3) for mobile-first lists.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  maxVisible = 5,
  ariaLabel = "Pagination",
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const range = buildRange(page, totalPages, maxVisible);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav
      aria-label={ariaLabel}
      className={cn("inline-flex items-center gap-1", className)}
    >
      <button
        type="button"
        onClick={() => canPrev && onPageChange(page - 1)}
        disabled={!canPrev}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary transition hover:bg-surface-muted hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      {range[0]! > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm text-text-secondary hover:bg-surface-muted"
          >
            1
          </button>
          {range[0]! > 2 && <span className="px-1 text-text-muted">…</span>}
        </>
      )}
      {range.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPageChange(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition",
            n === page
              ? "border-accent bg-accent-muted text-accent"
              : "border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary",
          )}
        >
          {n}
        </button>
      ))}
      {range[range.length - 1]! < totalPages && (
        <>
          {range[range.length - 1]! < totalPages - 1 && (
            <span className="px-1 text-text-muted">…</span>
          )}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm text-text-secondary hover:bg-surface-muted"
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => canNext && onPageChange(page + 1)}
        disabled={!canNext}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary transition hover:bg-surface-muted hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
