type Props = {
  current: number;
  total: number;
};

export function LessonProgressBar({ current, total }: Props) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex flex-1 items-center gap-4">
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="min-w-[4ch] text-right text-base font-semibold tabular-nums text-gray-600 dark:text-gray-300">
        {current}/{total}
      </span>
    </div>
  );
}
