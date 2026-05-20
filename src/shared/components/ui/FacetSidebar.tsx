import { useState, type ReactNode } from "react";
import { cn } from "./cn";

export type FacetOption = {
  value: string;
  label: string;
  count?: number;
  icon?: ReactNode;
};

export type Facet = {
  id: string;
  label: string;
  options: FacetOption[];
  multiSelect?: boolean;
  /** Override search-within threshold for this facet (default: 8). 0 disables. */
  searchableAfter?: number;
  /** Default collapsed state on first render. */
  defaultCollapsed?: boolean;
};

export type FacetSidebarProps = {
  facets: Facet[];
  selections: Record<string, string[]>;
  onToggle: (facetId: string, value: string) => void;
  onClear?: (facetId: string) => void;
  onClearAll?: () => void;
  search?: string;
  onSearchChange?: (s: string) => void;
  searchPlaceholder?: string;
  clearAllLabel?: string;
  resetLabel?: string;
  searchWithinPlaceholder?: string;
  className?: string;
};

const DEFAULT_SEARCH_THRESHOLD = 8;

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function FacetSidebar({
  facets,
  selections,
  onToggle,
  onClear,
  onClearAll,
  search,
  onSearchChange,
  searchPlaceholder,
  clearAllLabel = "Clear all",
  resetLabel = "Reset",
  searchWithinPlaceholder = "Filter…",
  className,
}: FacetSidebarProps) {
  // Per-section collapse state. Default: first two open, rest closed.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    facets.forEach((f, i) => {
      out[f.id] = f.defaultCollapsed ?? i >= 2;
    });
    return out;
  });

  // Per-section search-within text.
  const [withinSearch, setWithinSearch] = useState<Record<string, string>>({});

  return (
    <aside
      className={cn(
        "w-full shrink-0 space-y-3 rounded-xl border border-border bg-surface-muted p-3 lg:w-64 lg:sticky lg:top-4 lg:self-start",
        className,
      )}
    >
      {onSearchChange && (
        <div className="pb-1">
          <label htmlFor="facet-search" className="sr-only">
            {searchPlaceholder ?? "Search"}
          </label>
          <input
            id="facet-search"
            type="search"
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      )}

      {facets.map((facet) => {
        const selected = selections[facet.id] ?? [];
        const multi = facet.multiSelect ?? true;
        const isCollapsed = !!collapsed[facet.id];
        const threshold = facet.searchableAfter ?? DEFAULT_SEARCH_THRESHOLD;
        const showWithinSearch = threshold > 0 && facet.options.length > threshold;
        const q = (withinSearch[facet.id] ?? "").trim().toLowerCase();
        const visibleOptions = q
          ? facet.options.filter((o) => o.label.toLowerCase().includes(q))
          : facet.options;
        const hasSelection = selected.length > 0;

        return (
          <div
            key={facet.id}
            className="rounded-lg border border-border/60 bg-surface/60"
          >
            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
              <button
                type="button"
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [facet.id]: !prev[facet.id] }))
                }
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-text-muted hover:text-text-primary"
                aria-expanded={!isCollapsed}
              >
                <ChevronDown
                  className={cn(
                    "shrink-0 transition-transform",
                    isCollapsed && "-rotate-90",
                  )}
                />
                <span className="truncate">{facet.label}</span>
                {hasSelection && (
                  <span className="rounded-full bg-accent-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-accent">
                    {selected.length}
                  </span>
                )}
              </button>
              {hasSelection && onClear && (
                <button
                  type="button"
                  onClick={() => onClear(facet.id)}
                  className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium text-text-secondary hover:bg-surface-muted hover:text-accent"
                >
                  {resetLabel}
                </button>
              )}
            </div>

            {!isCollapsed && (
              <div className="space-y-1 px-2 pb-2">
                {showWithinSearch && (
                  <input
                    type="search"
                    value={withinSearch[facet.id] ?? ""}
                    onChange={(e) =>
                      setWithinSearch((prev) => ({
                        ...prev,
                        [facet.id]: e.target.value,
                      }))
                    }
                    placeholder={searchWithinPlaceholder}
                    className="mb-1 w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                )}
                <ul className="space-y-0.5">
                  {visibleOptions.map((opt) => {
                    const isChecked = selected.includes(opt.value);
                    return (
                      <li key={opt.value}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm transition hover:bg-surface-muted",
                            isChecked &&
                              "bg-accent-muted/60 text-accent ring-1 ring-accent/30",
                          )}
                        >
                          <input
                            type={multi ? "checkbox" : "radio"}
                            name={multi ? undefined : facet.id}
                            checked={isChecked}
                            onChange={() => onToggle(facet.id, opt.value)}
                            className="shrink-0 rounded border-border bg-surface text-accent focus:ring-accent"
                          />
                          {opt.icon && (
                            <span className="shrink-0" aria-hidden>
                              {opt.icon}
                            </span>
                          )}
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate",
                              isChecked ? "text-accent" : "text-text-primary",
                            )}
                          >
                            {opt.label}
                          </span>
                          {typeof opt.count === "number" && (
                            <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] tabular-nums text-text-muted">
                              {opt.count}
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                  {visibleOptions.length === 0 && (
                    <li className="px-1.5 py-1 text-xs text-text-muted">—</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-md px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary"
        >
          {clearAllLabel}
        </button>
      )}
    </aside>
  );
}
