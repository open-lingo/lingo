import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { cn } from "./cn";

export type ContentRailProps = {
  /** Section title. */
  title: ReactNode;
  /** Optional supporting line under the title. */
  subtitle?: ReactNode;
  /** Optional leading icon next to the title. */
  icon?: IconName;
  /** Optional "see all" affordance routed to a deeper view. */
  seeAllTo?: string;
  /** Label for the see-all link (defaults handled by caller via i18n). */
  seeAllLabel?: string;
  /**
   * Layout of the body. `scroll` = horizontal snap rail (default, streaming
   * style). `grid` = responsive wrapping grid (for contributor / category
   * tiles that read better tiled than scrolled).
   */
  layout?: "scroll" | "grid";
  /** Tailwind grid template applied when `layout === "grid"`. */
  gridClassName?: string;
  /** When true, renders the section heading even with no children (caller owns empty body). */
  children: ReactNode;
  className?: string;
};

/**
 * ContentRail — a titled section for the community marketplace home. Composes
 * a heading row (title + optional see-all) over either a horizontally
 * scrolling snap rail or a wrapping grid.
 *
 * The home page builds its surface from a list of these so new content types
 * (courses, stories, external content) slot in by appending another rail —
 * no bespoke section markup per type.
 *
 * Mobile behavior: the scroll rail keeps horizontal overflow with snap points
 * and edge padding; the grid collapses to a single column.
 */
export function ContentRail({
  title,
  subtitle,
  icon,
  seeAllTo,
  seeAllLabel,
  layout = "scroll",
  gridClassName,
  children,
  className,
}: ContentRailProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
            {icon ? <Icon name={icon} size={18} aria-hidden /> : null}
            <span className="truncate">{title}</span>
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
          ) : null}
        </div>
        {seeAllTo ? (
          <Link
            to={seeAllTo}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-accent transition hover:bg-accent-muted"
          >
            {seeAllLabel}
            <Icon name="chevronRight" size={16} aria-hidden />
          </Link>
        ) : null}
      </div>

      {layout === "grid" ? (
        <div className={cn("grid gap-4", gridClassName ?? "sm:grid-cols-2 lg:grid-cols-3")}>
          {children}
        </div>
      ) : (
        <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          {children}
        </div>
      )}
    </section>
  );
}
