import { cn } from "@/shared/components/ui/cn";

export type ProgressTone = "accent" | "warning" | "success";

const FILL: Record<ProgressTone, string> = {
  accent: "bg-accent",
  warning: "bg-warning",
  success: "bg-success",
};

type ProgressBarProps = {
  percent: number;
  /** Accessible label. */
  ariaLabel?: string;
  /** Height: "xs" (thin inline meters) | "sm" | "default" */
  size?: "xs" | "sm" | "default";
  /** Fill color. Defaults to accent. */
  tone?: ProgressTone;
  /** Optional label shown above the bar. */
  label?: React.ReactNode;
  /** Optional right-side label (e.g. "5/10"). */
  valueLabel?: React.ReactNode;
  /** Wrapper class (e.g. a fixed width for an inline meter). */
  className?: string;
};

/**
 * The app's one progress bar. The track is `bg-border` (NOT `surface-muted`,
 * which vanishes against a card) so the fill length always reads. Every
 * meter — sidebar level/quests, module rows, placement, home tiles — should
 * use this instead of hand-rolling a track, to stay consistent.
 */
export function ProgressBar({
  percent,
  ariaLabel,
  size = "default",
  tone = "accent",
  label,
  valueLabel,
  className = "",
}: ProgressBarProps) {
  const heightClass = size === "xs" ? "h-1.5" : size === "sm" ? "h-2" : "h-2.5";
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={className}>
      {(label || valueLabel) && (
        <div className="mb-2 flex items-center justify-between text-sm">
          {label && <span className="text-text-primary">{label}</span>}
          {valueLabel && <span className="text-text-muted">{valueLabel}</span>}
        </div>
      )}
      <div
        className={cn("overflow-hidden rounded-full bg-border", heightClass)}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", FILL[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
