type Checkpoint = {
  id: string;
  label?: string;
  completed?: boolean;
};

type ProgressBarWithCheckpointsProps = {
  completed: number;
  total: number;
  checkpoints: Checkpoint[];
  ariaLabel?: string;
  className?: string;
};

export function ProgressBarWithCheckpoints({
  completed,
  total,
  checkpoints,
  ariaLabel,
  className = "",
}: ProgressBarWithCheckpointsProps) {
  const percent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className={className}>
      <div
        className="relative h-2 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={ariaLabel}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${percent}%` }}
        />
        {checkpoints.map((cp, i) => {
          const position = ((i + 0.5) / total) * 100;
          return (
            <span
              key={cp.id}
              className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-border-muted"
              style={{ left: `${position}%`, transform: "translate(-50%, -50%)" }}
              title={cp.label ? `${cp.label}${cp.completed ? " ✓" : ""}` : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
