import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";

/**
 * One slot in the stats grid. The numeral is the loud part; the label is
 * the small kicker above it. Separation comes from a vertical border
 * between siblings on tablet+.
 */
export function NumberStat({
  icon,
  label,
  value,
  caption,
  accentValue,
  progress,
}: {
  icon: IconName;
  label: string;
  value: string;
  caption?: string;
  accentValue?: boolean;
  progress?: number; // 0..1, optional micro progress bar
}) {
  return (
    <div className="relative px-1 sm:px-5 sm:first:pl-0 sm:last:pr-0 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-border">
      <div className="flex items-center gap-1.5 text-text-muted">
        <Icon name={icon} size={14} strokeWidth={2.25} aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div
        className={
          "mt-1.5 text-2xl font-semibold tabular-nums sm:text-3xl " +
          (accentValue ? "text-accent" : "text-text-primary")
        }
      >
        {value}
      </div>
      {caption && (
        <div className="mt-1.5 text-xs text-text-muted">{caption}</div>
      )}
      {typeof progress === "number" && (
        <div
          className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-border"
          aria-hidden
        >
          <div
            className="h-full bg-text-primary/70 transition-[width] duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
