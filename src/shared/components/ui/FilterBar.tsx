import { useState, type ReactNode } from "react";
import { Filter as FilterIcon, RefreshCw } from "lucide-react";
import { cn } from "./cn";
import { Sheet } from "./Sheet";
import { Field } from "./Field";
import { Select } from "./Select";
import { SearchInput } from "./SearchInput";
import { useViewport } from "@/shared/hooks/useViewport";

export type FilterOption = { label: string; value: string };

export type FilterDefinition = {
  /** Stable key for React lists. */
  key: string;
  /** Visible label. */
  label: string;
  /** Current value (controlled). */
  value: string;
  options: FilterOption[];
  onChange: (next: string) => void;
};

export type FilterBarSearch = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  /** Optional refresh button shown inside the search input. */
  onRefresh?: () => void;
};

export type FilterBarLabels = {
  /** Aria label for the mobile collapse button. Default "Filters". */
  filtersButton?: string;
  /** Heading of the mobile filter sheet. Default "Filters". */
  sheetTitle?: string;
  /** Sheet "apply" / dismiss button. Default "Done". */
  doneButton?: string;
  /** Sheet reset / clear button label. */
  resetButton?: string;
  /** Aria label for the refresh button. Default "Refresh". */
  refreshLabel?: string;
};

export type FilterBarProps = {
  filters: FilterDefinition[];
  search?: FilterBarSearch;
  /** Optional trailing slot (e.g. a "New" button). */
  trailing?: ReactNode;
  /** When true, force the desktop horizontal layout regardless of viewport. */
  alwaysExpanded?: boolean;
  /** Optional active-filter count override (otherwise computed: non-`""` filters). */
  activeCount?: number;
  /** Reset all filters callback (renders a reset button inside the sheet). */
  onReset?: () => void;
  labels?: FilterBarLabels;
  className?: string;
};

/**
 * Top-of-page filter row.
 *
 * Mobile behavior: below the `md` breakpoint, all `<Select>` filters collapse
 * into a single "Filters" icon button that opens a {@link Sheet} containing the
 * full filter set. The search input stays inline. A small badge on the icon
 * shows how many filters are active.
 *
 * Desktop behavior: filters render inline as a horizontal bar, identical in
 * spirit to the original `data/FilterBar.tsx` (kept for backwards-compat under
 * `shared/components/data/`).
 */
export function FilterBar({
  filters,
  search,
  trailing,
  alwaysExpanded,
  activeCount,
  onReset,
  labels = {},
  className,
}: FilterBarProps) {
  const { isMobile } = useViewport();
  const collapse = !alwaysExpanded && isMobile && filters.length > 0;
  const [sheetOpen, setSheetOpen] = useState(false);

  const resolvedActive =
    activeCount ??
    filters.filter((f) => f.value !== "" && f.value !== "all").length;

  const desktopFilters = !collapse && filters.length > 0 && (
    <div className="flex flex-wrap items-end gap-3">
      {filters.map((f) => (
        <Field key={f.key} label={f.label}>
          <Select
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            selectSize="sm"
          >
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
      ))}
    </div>
  );

  const filtersButtonLabel = labels.filtersButton ?? "Filters";
  const sheetTitle = labels.sheetTitle ?? "Filters";
  const doneButton = labels.doneButton ?? "Done";
  const resetButton = labels.resetButton ?? "Reset";
  const refreshLabel = labels.refreshLabel ?? "Refresh";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-muted p-3",
        className,
      )}
    >
      {collapse ? (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-primary transition hover:bg-surface-muted"
          aria-label={filtersButtonLabel}
        >
          <FilterIcon size={16} />
          {resolvedActive > 0 && (
            <span
              aria-hidden
              className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground"
            >
              {resolvedActive}
            </span>
          )}
        </button>
      ) : (
        desktopFilters
      )}

      {search && (
        <div className="min-w-[160px] flex-1">
          <SearchInput
            value={search.value}
            onValueChange={search.onChange}
            placeholder={search.placeholder}
            aria-label={search.label}
          />
        </div>
      )}

      {search?.onRefresh && (
        <button
          type="button"
          onClick={search.onRefresh}
          aria-label={refreshLabel}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
        >
          <RefreshCw size={16} />
        </button>
      )}

      {trailing}

      {collapse && (
        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          side="bottom"
          title={sheetTitle}
          footer={
            <>
              {onReset && (
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
                >
                  {resetButton}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
              >
                {doneButton}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            {filters.map((f) => (
              <Field key={f.key} label={f.label}>
                <Select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                >
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
