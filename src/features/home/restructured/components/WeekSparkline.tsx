type Props = {
  data: number[];
  /** Optional aria label for screen readers. */
  ariaLabel?: string;
};

export function WeekSparkline({ data, ariaLabel }: Props) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-1.5" aria-label={ariaLabel} role={ariaLabel ? "img" : undefined}>
      {data.map((v, i) => (
        <div
          key={i}
          className="w-3 rounded-sm bg-accent/80"
          style={{ height: `${Math.max(6, (v / max) * 36)}px`, opacity: v === 0 ? 0.25 : 1 }}
          aria-hidden
        />
      ))}
    </div>
  );
}
