/**
 * One-tap kudos button (👋 wave / 🔥 cheer). Pure-presentational, mock state.
 * MOCK: tap toggles a local "did I give kudos?" state; real impl posts to API.
 */
import { useState } from "react";
import { cn } from "@/shared/components/ui/cn";

type Props = {
  initialCount: number;
  /** Pick the emoji per use site — "👋" for activity, "🔥" for streaks, etc. */
  emoji?: string;
  /** Compact mode for tight rows. */
  size?: "sm" | "md";
};

export function KudosButton({ initialCount, emoji = "👋", size = "sm" }: Props) {
  const [given, setGiven] = useState(false);
  const count = initialCount + (given ? 1 : 0);

  return (
    <button
      type="button"
      onClick={() => setGiven((g) => !g)}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold transition",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        given
          ? "border-accent bg-accent-muted text-accent"
          : "border-border bg-surface text-text-secondary hover:border-accent hover:bg-accent-muted hover:text-accent",
      )}
      aria-pressed={given}
      aria-label={given ? "Remove kudos" : "Give kudos"}
    >
      <span aria-hidden>{emoji}</span>
      <span>{count}</span>
    </button>
  );
}
