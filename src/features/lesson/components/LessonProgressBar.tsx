type Props = {
  current: number;
  total: number;
};

export function LessonProgressBar({ current, total }: Props) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex flex-1 items-center gap-4">
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Lesson progress: ${current} of ${total}`}
        className="h-4 flex-1 overflow-hidden rounded-full border-[1.5px] border-border bg-surface-muted"
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="min-w-[4ch] text-right text-base font-bold tabular-nums text-text-secondary">
        {current}/{total}
      </span>
    </div>
  );
}
