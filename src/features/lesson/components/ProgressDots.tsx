/**
 * Vertical column of progress dots, designed to sit alongside the drawing
 * canvas. `filled` fills the first N dots emerald; remaining dots are gray.
 * For a single-attempt step (production), pass `total = 1`; the single dot
 * still reads as a meaningful "did it" marker.
 */
type Props = {
  filled: number;
  total: number;
  ariaLabel?: string;
  /** When true, renders a "N/total" text next to the dots so they read as a
   *  progress meter rather than mystery affordance. */
  showCount?: boolean;
  /** Lay dots vertically (default — fits beside a canvas) or horizontally
   *  (fits inside a controls row). */
  orientation?: "vertical" | "horizontal";
};

export function ProgressDots({
  filled,
  total,
  ariaLabel,
  showCount,
  orientation = "vertical",
}: Props) {
  const isHorizontal = orientation === "horizontal";
  return (
    <div
      role="status"
      aria-label={ariaLabel ?? `${filled} of ${total} correct`}
      className={
        isHorizontal
          ? "flex flex-row items-center gap-2"
          : "flex flex-col items-center gap-2.5"
      }
    >
      {isHorizontal ? (
        <>
          <div className="flex flex-row items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                  i < filled ? "bg-accent" : "bg-border"
                }`}
              />
            ))}
          </div>
          {showCount && (
            <span
              className="text-sm font-medium text-text-secondary"
              aria-hidden
            >
              {filled}/{total}
            </span>
          )}
        </>
      ) : (
        <>
          {showCount && (
            <span
              className="text-[11px] font-medium text-text-muted"
              aria-hidden
            >
              {filled}/{total}
            </span>
          )}
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-full transition-colors duration-300 ${
                i < filled ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </>
      )}
    </div>
  );
}
