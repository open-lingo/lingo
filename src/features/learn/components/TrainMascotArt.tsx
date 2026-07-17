/**
 * Standalone version of the map's "you are here" train mascot (see
 * TrainMascot in TransitLearnPage) — same geometry, but themed with the
 * app color tokens instead of the `.tmc-root`-scoped `--tmc-*` vars so it
 * renders anywhere (e.g. the lesson-start wipe). Body rides the accent;
 * wheels/eyes read dark; windows are light.
 */
export function TrainMascotArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-22 -62 44 32"
      className={className}
      role="img"
      aria-hidden
    >
      {/* body */}
      <rect x={-18} y={-58} width={36} height={20} rx={6} fill="var(--color-accent)" />
      {/* roof highlight */}
      <rect x={-18} y={-58} width={36} height={5} rx={2.5} fill="var(--color-text-primary)" opacity={0.28} />
      {/* windows */}
      <circle cx={-7} cy={-47} r={4.6} fill="#ffffff" />
      <circle cx={7} cy={-47} r={4.6} fill="#ffffff" />
      {/* eyes */}
      <circle cx={-6} cy={-47} r={1.9} fill="var(--color-text-primary)" />
      <circle cx={8} cy={-47} r={1.9} fill="var(--color-text-primary)" />
      {/* smile */}
      <path
        d="M -3 -41.5 Q 0 -39.5 3 -41.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      {/* wheels */}
      <circle cx={-10} cy={-37} r={3} fill="var(--color-text-primary)" />
      <circle cx={10} cy={-37} r={3} fill="var(--color-text-primary)" />
    </svg>
  );
}
