import type { ReactNode } from "react";
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
};

export type FacetSidebarProps = {
  facets: Facet[];
  selections: Record<string, string[]>;
  onToggle: (facetId: string, value: string) => void;
  onClearAll?: () => void;
  search?: string;
  onSearchChange?: (s: string) => void;
  searchPlaceholder?: string;
  clearAllLabel?: string;
  className?: string;
};

export function FacetSidebar({
  facets,
  selections,
  onToggle,
  onClearAll,
  search,
  onSearchChange,
  searchPlaceholder,
  clearAllLabel = "Clear all",
  className,
}: FacetSidebarProps) {
  return (
    <aside
      className={cn(
        "w-full shrink-0 space-y-5 lg:w-64 lg:sticky lg:top-4 lg:self-start",
        className,
      )}
    >
      {onSearchChange && (
        <div>
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
        return (
          <div key={facet.id} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              {facet.label}
            </h3>
            <ul className="space-y-1">
              {facet.options.map((opt) => {
                const isChecked = selected.includes(opt.value);
                return (
                  <li key={opt.value}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-surface-muted",
                        isChecked && "bg-surface-muted",
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
                      <span className="min-w-0 flex-1 truncate text-text-primary">
                        {opt.label}
                      </span>
                      {typeof opt.count === "number" && (
                        <span className="shrink-0 text-xs tabular-nums text-text-muted">
                          {opt.count}
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
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
