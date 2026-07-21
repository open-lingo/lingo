import { cn } from "./cn";

export type ResponsiveTableProps = {
  /** The `<table>` element. Give it `min-w-full` so wide content scrolls
   *  instead of compressing its columns. */
  children: React.ReactNode;
  /** Chrome for the scroll container (border / rounded / bg). The scroll +
   *  rounded clip live on the same element, matching the DataTable pattern. */
  className?: string;
};

/**
 * A horizontal scroll container for hand-rolled `<table>` markup.
 *
 * The correct mobile pattern is `overflow-x-auto` (scroll the overflow) rather
 * than `overflow-hidden` (clip the right columns). Mirrors the canonical
 * `DataTable` wrapper. Prefer `DataTable` for real data grids; reach for this
 * when a surface authors its own `<table>`.
 */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return <div className={cn("overflow-x-auto", className)}>{children}</div>;
}
