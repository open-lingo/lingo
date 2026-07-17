import { Check } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "./cn";

export type StepperStep = {
  /** Stable key. */
  key: string;
  /** Visible label. */
  label: ReactNode;
  /** Optional supporting description. */
  description?: ReactNode;
};

export type StepperProps = {
  steps: StepperStep[];
  /** 0-indexed active step. */
  activeIndex: number;
  /** Orientation. Default `horizontal`. */
  orientation?: "horizontal" | "vertical";
  className?: string;
};

/**
 * Step indicator (progress through a multi-step flow).
 *
 * Mobile behavior: horizontal stepper falls back to a compact "step n of N"
 * label on the smallest viewports — pass `orientation="vertical"` if you want
 * explicit vertical layout for taller mobile screens.
 */
export function Stepper({ steps, activeIndex, orientation = "horizontal", className }: StepperProps) {
  const isVertical = orientation === "vertical";

  return (
    <ol
      role="list"
      aria-label="Steps"
      className={cn(
        isVertical ? "flex flex-col gap-3" : "flex items-center gap-2",
        className,
      )}
    >
      {steps.map((step, idx) => {
        const isActive = idx === activeIndex;
        const isDone = idx < activeIndex;
        return (
          <li
            key={step.key}
            className={cn(
              "flex items-center gap-2",
              isVertical ? "w-full" : "min-w-0 flex-1",
            )}
            aria-current={isActive ? "step" : undefined}
          >
            <span
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                isDone
                  ? "border-accent bg-accent text-accent-foreground"
                  : isActive
                    ? "border-accent text-accent"
                    : "border-border text-text-muted",
              )}
            >
              {isDone ? <Check size={14} /> : idx + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate text-sm font-medium",
                  isActive ? "text-text-primary" : "text-text-secondary",
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="block truncate text-xs text-text-muted">
                  {step.description}
                </span>
              )}
            </span>
            {!isVertical && idx < steps.length - 1 && (
              <span
                className={cn(
                  "ml-2 hidden h-px flex-1 bg-border sm:block",
                  isDone && "bg-accent",
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
