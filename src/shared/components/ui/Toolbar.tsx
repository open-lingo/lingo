import { type ReactNode } from "react";
import { cn } from "./cn";

export type ToolbarProps = {
  /** Left-aligned content (title, breadcrumb). */
  leading?: ReactNode;
  /** Right-aligned actions group. */
  actions?: ReactNode;
  /** Optional secondary row beneath the main toolbar. */
  belowRow?: ReactNode;
  /** Sticky-top behavior. */
  sticky?: boolean;
  className?: string;
};

/**
 * Page-top toolbar — title on the left, actions on the right.
 *
 * Mobile behavior: actions wrap below the title when there isn't horizontal
 * room. Combine with {@link DropdownMenu} on mobile to collapse a long action
 * list into a "More" menu.
 */
export function Toolbar({
  leading,
  actions,
  belowRow,
  sticky,
  className,
}: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-border bg-surface px-4 py-3 sm:px-6",
        sticky && "sticky top-0 z-30",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">{leading}</div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {belowRow}
    </div>
  );
}
