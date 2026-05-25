import { cn } from "@/shared/components/ui/cn";

export type QuestProgressBarProps = {
  /** Whole-percent progress, 0–100. */
  percent: number;
  /** Tone of the fill — "primary" (default accent), "warning" (amber). */
  tone?: "primary" | "warning";
  /** Aria-label for screen readers. */
  ariaLabel?: string;
  className?: string;
};

/**
 * Small purpose-built progress bar for quest cards. Lives under
 * `features/quests/components/` (not shared/) because it's slightly
 * thicker + carries the "tone" variant for warning hues used by daily
 * quests — the shared `ProgressRow` covers the row case but quests
 * render bare bars without the row chrome.
 */
export function QuestProgressBar({
  percent,
  tone = "primary",
  ariaLabel,
  className,
}: QuestProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-surface-muted",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "warning" ? "bg-warning" : "bg-accent",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
