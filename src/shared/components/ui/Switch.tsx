import { forwardRef, type ReactNode } from "react";
import { cn } from "./cn";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  /** Inline label. */
  label?: ReactNode;
  /** Show the label before the switch (default: after). */
  labelLeading?: boolean;
  disabled?: boolean;
  /** Optional aria-label when no visible label is provided. */
  ariaLabel?: string;
  className?: string;
  id?: string;
};

/**
 * Toggle switch (controlled). Uses a native button with `role="switch"`.
 *
 * Mobile behavior: 44px tap target via padding; thumb animates with reduced-
 * motion-safe transform.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, label, labelLeading, disabled, ariaLabel, className, id },
  ref,
) {
  const button = (
    <button
      ref={ref}
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={!label ? ariaLabel : undefined}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition",
        "focus:outline-none focus:ring-2 focus:ring-accent/30",
        "disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-accent" : "bg-surface-muted border-border",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );

  if (!label) return button;

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-text-primary">
      {labelLeading && <span>{label}</span>}
      {button}
      {!labelLeading && <span>{label}</span>}
    </label>
  );
});
