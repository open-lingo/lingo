import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

type NativeCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size">;

export type CheckboxProps = NativeCheckboxProps & {
  /** Optional inline label rendered to the right of the box. */
  label?: ReactNode;
};

/**
 * Themed checkbox using the native input + Tailwind `accent-accent`.
 *
 * Mobile behavior: 18px touch target on the box; wrap larger label for forgiving
 * tap area.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id, ...rest },
  ref,
) {
  const input = (
    <input
      ref={ref}
      type="checkbox"
      id={id}
      className={cn(
        "h-4 w-4 cursor-pointer rounded border-border text-accent accent-accent",
        "focus:outline-none focus:ring-2 focus:ring-accent/30",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...rest}
    />
  );

  if (!label) return input;

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-text-primary">
      {input}
      <span>{label}</span>
    </label>
  );
});
