/**
 * FacetSidebar — a finding aid for browsing a curated library.
 *
 * Design notes (don't make this generic again — it earns its character):
 *   - Section labels: small-caps in the display serif. Reads like a library
 *     catalog header, not a SaaS sidebar.
 *   - Active filter rows: a tinted bar on the left edge + accent text. No
 *     full-row background — keeps the list scannable.
 *   - Active filter count: a serif numeral next to the section label so the
 *     count feels part of the heading, not a UI tag.
 *   - No nested cards. The sidebar is one panel with hairline dividers
 *     between sections. Less chrome, more legibility.
 *   - Top-level search box: open, with a serif italic placeholder for tone.
 */
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
  /** Optional "only this" handler — when provided, each row gets a hover
   *  affordance that clears other selections in the facet and sets just
   *  this value. Caller implements (typically: `onClear(facetId)` then
   *  `onToggle(facetId, value)`). */
  onOnly?: (facetId: string, value: string) => void;
  search?: string;
  onSearchChange?: (s: string) => void;
  searchPlaceholder?: string;
  clearAllLabel?: string;
  resetLabel?: string;
  searchWithinPlaceholder?: string;
  onlyLabel?: string;
  className?: string;
  /**
   * Compact density — tighter padding + smaller option rows so the sidebar
   * takes far less vertical/horizontal space. Use on dense browse surfaces.
   */
  compact?: boolean;
};

// Lower threshold than the previous 8 — most facets are ≤10 options and the
// search-within input is unobtrusive enough to surface earlier.
const DEFAULT_SEARCH_THRESHOLD = 4;

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={12}
      height={12}
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

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function FacetSidebar({
  facets,
  selections,
  onToggle,
  onClear,
  onClearAll,
  onOnly,
  search,
  onSearchChange,
  searchPlaceholder,
  clearAllLabel = "Clear all",
  resetLabel = "reset",
  searchWithinPlaceholder = "filter…",
  onlyLabel = "Only",
  className,
  compact = false,
}: FacetSidebarProps) {
  // Density tokens — `compact` shrinks every gutter + row so the finding aid
  // reads as a tight index rather than a roomy SaaS panel.
  const headerPad = compact ? "px-3 pb-2 pt-2.5" : "px-5 pb-3 pt-4";
  const searchPad = compact ? "px-3 py-2" : "px-5 py-4";
  const sectionPad = compact ? "px-3 py-2" : "px-5 py-3.5";
  const optionRow = compact ? "py-0.5 pl-2.5 pr-1.5" : "py-1.5 pl-3 pr-2";
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    facets.forEach((f, i) => {
      out[f.id] = f.defaultCollapsed ?? i >= 2;
    });
    return out;
  });

  const [withinSearch, setWithinSearch] = useState<Record<string, string>>({});

  const totalActive = Object.values(selections).reduce(
    (sum, vals) => sum + (vals?.length ?? 0),
    0,
  );

  return (
    <aside
      className={cn(
        // Width is owned by the consumer (wrapper or `className`) so it always
        // matches its column — a hardcoded width here fought the caller's width
        // (cn() doesn't dedupe Tailwind conflicts) and overflowed the column.
        "w-full shrink-0 rounded-card border border-border bg-surface lg:sticky lg:top-4 lg:self-start",
        // Subtle inner edge for depth without a heavy shadow.
        "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]",
        className,
      )}
    >
      <header className={cn("flex items-baseline justify-between border-b border-border/70", headerPad)}>
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Refine
          </span>
          {totalActive > 0 && (
            <span className="text-xs font-semibold tabular-nums leading-none text-accent">
              {totalActive} active
            </span>
          )}
        </div>
        {totalActive > 0 && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-medium uppercase tracking-wider text-text-muted underline-offset-2 hover:text-accent hover:underline"
          >
            {clearAllLabel}
          </button>
        )}
      </header>

      {onSearchChange && (
        <div className={cn("border-b border-border/70", searchPad)}>
          <label htmlFor="facet-search" className="sr-only">
            {searchPlaceholder ?? "Search"}
          </label>
          <div className="group relative">
            <SearchGlyph className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-text-muted transition group-focus-within:text-accent" />
            <input
              id="facet-search"
              type="search"
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full border-0 border-b border-border bg-transparent py-1.5 pl-6 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      )}

      <div className="divide-y divide-border/70">
        {facets.map((facet) => {
          const selected = selections[facet.id] ?? [];
          const multi = facet.multiSelect ?? true;
          const isCollapsed = !!collapsed[facet.id];
          const threshold = facet.searchableAfter ?? DEFAULT_SEARCH_THRESHOLD;
          const showWithinSearch =
            threshold > 0 && facet.options.length > threshold;
          const q = (withinSearch[facet.id] ?? "").trim().toLowerCase();
          const visibleOptions = q
            ? facet.options.filter((o) => o.label.toLowerCase().includes(q))
            : facet.options;
          const hasSelection = selected.length > 0;

          return (
            <section key={facet.id} className={sectionPad}>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      [facet.id]: !prev[facet.id],
                    }))
                  }
                  className="group flex min-w-0 flex-1 items-baseline gap-2 text-left"
                  aria-expanded={!isCollapsed}
                >
                  <ChevronDown
                    className={cn(
                      "translate-y-[2px] shrink-0 text-text-muted transition-transform group-hover:text-text-primary",
                      isCollapsed && "-rotate-90",
                    )}
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-primary group-hover:text-accent">
                    {facet.label}
                  </span>
                  {hasSelection && (
                    <span className="text-xs font-semibold tabular-nums leading-none text-accent">
                      · {selected.length}
                    </span>
                  )}
                </button>
                {hasSelection && onClear && (
                  <button
                    type="button"
                    onClick={() => onClear(facet.id)}
                    className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-text-muted underline-offset-2 hover:text-accent hover:underline"
                  >
                    {resetLabel}
                  </button>
                )}
              </div>

              {!isCollapsed && (
                <div className={cn(compact ? "mt-1.5" : "mt-3", "space-y-1")}>
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
                      className="mb-2 w-full border-0 border-b border-border/70 bg-transparent py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-0"
                    />
                  )}
                  <ul className="space-y-px">
                    {visibleOptions.map((opt) => {
                      const isChecked = selected.includes(opt.value);
                      return (
                        <li key={opt.value}>
                          <label
                            className={cn(
                              "group/option relative flex cursor-pointer items-center rounded-md text-sm transition-colors",
                              compact ? "gap-2" : "gap-2.5",
                              optionRow,
                              "hover:bg-accent/[0.04]",
                              isChecked && "text-accent",
                            )}
                          >
                            {/* Active-state bar on the left edge */}
                            <span
                              className={cn(
                                "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-sm transition-all",
                                isChecked
                                  ? "bg-accent opacity-100"
                                  : "bg-transparent opacity-0 group-hover/option:bg-accent/40 group-hover/option:opacity-100",
                              )}
                              aria-hidden
                            />
                            <input
                              type={multi ? "checkbox" : "radio"}
                              name={multi ? undefined : facet.id}
                              checked={isChecked}
                              onChange={() => onToggle(facet.id, opt.value)}
                              className="sr-only"
                            />
                            {/* Custom indicator — small square / circle */}
                            <span
                              className={cn(
                                "flex h-3.5 w-3.5 shrink-0 items-center justify-center border transition-colors",
                                multi ? "rounded-[3px]" : "rounded-full",
                                isChecked
                                  ? "border-accent bg-accent"
                                  : "border-border bg-transparent group-hover/option:border-accent/60",
                              )}
                              aria-hidden
                            >
                              {isChecked && (
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3.5"
                                  className="text-accent-foreground"
                                >
                                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                            {opt.icon && (
                              <span className="shrink-0 text-base leading-none" aria-hidden>
                                {opt.icon}
                              </span>
                            )}
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate",
                                isChecked
                                  ? "font-medium text-accent"
                                  : "text-text-secondary group-hover/option:text-text-primary",
                              )}
                            >
                              {opt.label}
                            </span>
                            {typeof opt.count === "number" && (
                              <span
                                className={cn(
                                  "shrink-0 text-[11px] tabular-nums leading-none transition-colors",
                                  isChecked
                                    ? "text-accent"
                                    : "text-text-muted group-hover/option:text-text-secondary",
                                  // Hide on hover when the "Only" action is
                                  // available so the count doesn't fight the
                                  // hover affordance for real estate.
                                  onOnly &&
                                    "group-hover/option:invisible [@media(pointer:coarse)]:invisible",
                                )}
                              >
                                {opt.count}
                              </span>
                            )}
                            {onOnly && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onOnly(facet.id, opt.value);
                                }}
                                tabIndex={-1}
                                aria-label={`${onlyLabel} ${opt.label}`}
                                className="invisible absolute right-2 text-[10px] font-semibold uppercase tracking-wider text-accent underline-offset-2 hover:underline group-hover/option:visible [@media(pointer:coarse)]:visible"
                              >
                                {onlyLabel}
                              </button>
                            )}
                          </label>
                        </li>
                      );
                    })}
                    {visibleOptions.length === 0 && (
                      <li className="px-3 py-2 text-xs italic text-text-muted">
                        no matches
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
