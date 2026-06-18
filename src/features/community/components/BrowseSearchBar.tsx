import { type ReactNode } from "react";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { SearchInput } from "@/shared/components/ui/SearchInput";
import { SegmentedControl } from "@/shared/components/ui/SegmentedControl";
import { cn } from "@/shared/components/ui/cn";
import {
  CommunitySelectedChips,
  type ChipDescriptor,
} from "./CommunitySelectedChips";

export type BrowseTypeOption = {
  value: string;
  label: string;
  icon?: IconName;
};

export type BrowseSearchBarProps = {
  /** Search text + setter. */
  search: string;
  onSearchChange: (s: string) => void;
  searchPlaceholder: string;
  /** Content-type segmented control. Empty list hides the control. */
  typeOptions: BrowseTypeOption[];
  typeValue: string;
  onTypeChange: (value: string) => void;
  typeAriaLabel: string;
  /** Active-filter chips (language / level / tag / …). */
  chips: ChipDescriptor[];
  onRemoveChip: (facetId: string, value: string) => void;
  onClearAll: () => void;
  clearAllLabel: string;
  /** Result count summary rendered at the trailing edge of the type row. */
  resultSummary?: ReactNode;
};

/**
 * BrowseSearchBar — the centralized, filterable search header for the community
 * Browse surface. One cohesive control that owns: the rich search box, the
 * content-type selector (flashcards / courses / stories), the active-filter
 * chip strip, and an optional result-count summary. Keeps search + type +
 * applied-filter state visually unified instead of scattered around the page.
 */
export function BrowseSearchBar({
  search,
  onSearchChange,
  searchPlaceholder,
  typeOptions,
  typeValue,
  onTypeChange,
  typeAriaLabel,
  chips,
  onRemoveChip,
  onClearAll,
  clearAllLabel,
  resultSummary,
}: BrowseSearchBarProps) {
  return (
    <div className="space-y-3 rounded-card border border-border bg-surface p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onValueChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="sm:max-w-md"
        />
        {typeOptions.length > 0 && (
          <SegmentedControl
            value={typeValue}
            onChange={onTypeChange}
            ariaLabel={typeAriaLabel}
            size="sm"
            className="sm:ml-auto"
            options={typeOptions.map((o) => ({
              value: o.value,
              label: (
                <span className="inline-flex items-center gap-1.5">
                  {o.icon && <Icon name={o.icon} size={14} aria-hidden />}
                  {o.label}
                </span>
              ),
            }))}
          />
        )}
      </div>

      {(chips.length > 0 || resultSummary) && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-3 gap-y-2",
            chips.length > 0 && "border-t border-border/60 pt-3",
          )}
        >
          {chips.length > 0 && (
            <CommunitySelectedChips
              chips={chips}
              onRemove={onRemoveChip}
              onClearAll={onClearAll}
              clearAllLabel={clearAllLabel}
            />
          )}
          {resultSummary && (
            <div className="ml-auto text-sm text-text-secondary">
              {resultSummary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
