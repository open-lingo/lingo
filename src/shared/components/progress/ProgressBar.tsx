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
          {label && <span className="text-gray-900 dark:text-white">{label}</span>}
          {valueLabel && (
            <span className="text-gray-600 dark:text-gray-400">{valueLabel}</span>
          )}
        </div>
      )}
      <div
        className={`overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${heightClass}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <div
          className="h-full rounded-full bg-emerald-500 dark:bg-emerald-600 transition-[width]"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}
