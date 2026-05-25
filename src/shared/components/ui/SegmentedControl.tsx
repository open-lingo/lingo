import { type ReactNode } from "react";
import { cn } from "./cn";

export type SegmentedOption<V extends string> = {
  value: V;
  label: ReactNode;
  /** Optional leading icon. */
  leading?: ReactNode;
};

export type SegmentedControlProps<V extends string> = {
  value: V;
  onChange: (next: V) => void;
  options: SegmentedOption<V>[];
  /** ARIA label for the group. */
  ariaLabel?: string;
  /** Fill the full available width. */
  fullWidth?: boolean;
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses = {
  sm: "text-xs px-2.5 py-1",
  md: "text-sm px-3 py-1.5",
} as const;

/**
 * Segmented control — mobile-friendly alternative to top tabs. Renders a single
 * pill with N selectable cells.
 *
 * Mobile behavior: stretches full-width when `fullWidth`; cells share remaining
 * width equally.
 */
export function SegmentedControl<V extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  fullWidth,
  size = "md",
  className,
}: SegmentedControlProps<V>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-lg border border-border bg-surface-muted p-0.5",
        fullWidth && "flex w-full",
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition",
              fullWidth && "flex-1",
              sizeClasses[size],
              isActive
                ? "bg-surface text-text-primary shadow-card"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {opt.leading}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
