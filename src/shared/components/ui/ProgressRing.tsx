type Props = {
  percent: number;
  size?: number;
  stroke?: number;
  label: string;
  sublabel?: string;
  accentClass?: string;
};

export function ProgressRing({
  percent,
  size = 84,
  stroke = 8,
  label,
  sublabel,
  accentClass = "text-accent",
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = (clamped / 100) * c;

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-surface-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className={accentClass}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-text-primary leading-none">{label}</span>
        {sublabel ? (
          <span className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
