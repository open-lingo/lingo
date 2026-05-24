import type { ReactNode } from "react";
import { cn } from "./cn";

/** Shared text input styling — uses theme tokens only. */
export const inputClassName =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

type ChoiceChipProps = {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
};

/** Toggle chip for settings pickers (language, theme, etc.). */
export function ChoiceChip({ selected, onClick, children, className }: ChoiceChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
        selected
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface text-text-primary hover:bg-surface-muted",
        className
      )}
    >
      {children}
    </button>
  );
}
