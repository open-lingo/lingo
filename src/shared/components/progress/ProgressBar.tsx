type ProgressBarProps = {
  percent: number;
  /** Accessible label. */
  ariaLabel?: string;
  /** Height: "sm" | "default" */
  size?: "sm" | "default";
  /** Optional label shown above the bar. */
  label?: React.ReactNode;
  /** Optional right-side label (e.g. "5/10"). */
  valueLabel?: React.ReactNode;
  className?: string;
};

export function ProgressBar({
  percent,
  ariaLabel,
  size = "default",
  label,
  valueLabel,
  className = "",
}: ProgressBarProps) {
  const heightClass = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={className}>
      {(label || valueLabel) && (
        <div className="mb-2 flex items-center justify-between text-sm">
          {label && <span className="text-text-primary">{label}</span>}
          {valueLabel && (
            <span className="text-text-muted">{valueLabel}</span>
          )}
        </div>
      )}
      <div
        className={`overflow-hidden rounded-full bg-surface-muted ${heightClass}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}
