import type { ReactNode } from "react";
import { cn } from "@/shared/components/ui/cn";

/**
 * Shared layout for practice "hub" surfaces — the practice index and the
 * per-pillar hubs. Fills the viewport below the app chrome and centers the
 * panel vertically, capped in width and height so large screens stay a tidy
 * block instead of ballooning into oversized cards, and never body-scrolls
 * (the min-height yields rather than clipping on short viewports).
 *
 * Children arrange themselves in the flex column: put `flex-1` on the section
 * that should absorb the leftover height (e.g. the card grid) so there's no
 * dead margin.
 */
export function PracticeHubShell({
  children,
  className,
  /** rem to reserve for app chrome above the panel. The practice index has
   *  just the app header + main padding (~7.5rem); pillar hubs also sit below
   *  the practice breadcrumbs, so they pass a larger value. */
  chromeOffsetRem = 7.5,
  /** When true (default) the panel stretches to fill the height — use for
   *  content-rich grids that look good expanded (the 6-tile index). When
   *  false the panel keeps its natural height and is centered as a group —
   *  better for sparse pages that would otherwise leave hollow cards. */
  fill = true,
  /** Width cap (a single Tailwind max-w-* class). `cn` here is a plain join,
   *  not tailwind-merge, so pass the override through this prop rather than
   *  `className` to avoid a colliding max-w-* utility. */
  maxWidthClass = "max-w-7xl",
}: {
  children: ReactNode;
  className?: string;
  chromeOffsetRem?: number;
  fill?: boolean;
  maxWidthClass?: string;
}) {
  return (
    <div
      className="flex flex-col justify-center"
      style={{ minHeight: `calc(100dvh - ${chromeOffsetRem}rem)` }}
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-4 [max-height:62rem]",
          maxWidthClass,
          fill && "flex-1",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
