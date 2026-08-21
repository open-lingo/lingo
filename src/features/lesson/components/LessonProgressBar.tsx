type Props = {
  current: number;
  total: number;
};

export function LessonProgressBar({ current, total }: Props) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  // Numberless by design: for a fixed-arc lesson the bar IS the count —
  // a "3/19" readout duplicates it and reads as work remaining rather
  // than progress made. (Review queues are the opposite case and keep
  // their explicit counts.) Screen readers still get the exact position
  // via the progressbar values.
  return (
    <div className="flex flex-1 items-center gap-4">
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Lesson progress: ${current} of ${total}`}
        className="h-5 flex-1 overflow-hidden rounded-full border-2 border-border bg-border-muted"
      >
        <div
          className="h-full rounded-full bg-accent shadow-[inset_0_0_0_1px_rgb(var(--color-accent-hover))] transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
