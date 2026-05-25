import { type ReactNode } from "react";
import { cn } from "./cn";

export type KeyValueEntry = {
  key: string;
  label: ReactNode;
  value: ReactNode;
};

export type DescriptionListProps = {
  entries: KeyValueEntry[];
  /** Layout. Default `stacked` on mobile, `inline` (label / value side-by-side) on larger viewports. */
  layout?: "stacked" | "inline" | "responsive";
  className?: string;
};

/**
 * Semantic description list — `<dl>` with `<dt>` / `<dd>` pairs.
 *
 * Mobile behavior: when `layout="responsive"` (default), labels stack above
 * values on mobile and align side-by-side from `sm:` upward.
 */
export function DescriptionList({
  entries,
  layout = "responsive",
  className,
}: DescriptionListProps) {
  const rowClass =
    layout === "stacked"
      ? "flex flex-col gap-1"
      : layout === "inline"
        ? "flex items-baseline gap-3"
        : "flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3";

  return (
    <dl className={cn("flex flex-col gap-3", className)}>
      {entries.map((e) => (
        <div key={e.key} className={rowClass}>
          <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-text-muted sm:w-32">
            {e.label}
          </dt>
          <dd className="min-w-0 flex-1 text-sm text-text-primary">{e.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export type KeyValueProps = {
  label: ReactNode;
  value: ReactNode;
  className?: string;
};

/** Single label / value pair. For lists of entries prefer {@link DescriptionList}. */
export function KeyValue({ label, value, className }: KeyValueProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}
