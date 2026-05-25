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
          className="w-3 rounded-sm bg-accent"
          // Tailwind v3 cannot synthesize the alpha-variant of a CSS-variable
          // colour (`bg-accent/80` emits no CSS), so we drive the soft-tone
          // look via inline `opacity` instead of `bg-accent/80` + `opacity` on
          // top of nothing. Empty days dim to 0.25 so the row still reads as
          // seven cells. See report 2026-05-25.
          style={{
            height: `${Math.max(6, (v / max) * 36)}px`,
            opacity: v === 0 ? 0.25 : 0.8,
          }}
          aria-hidden
        />
      ))}
    </div>
  );
}
