import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export type InputSize = "sm" | "md" | "lg";

const sizeClasses: Record<InputSize, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-3.5 py-2.5 text-base",
};

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size">;

export type InputProps = NativeInputProps & {
  /** Visual size token. Default `md`. */
  inputSize?: InputSize;
  /** Show an invalid border (independent of native `aria-invalid` semantics). */
  invalid?: boolean;
  /** Leading adornment (icon, prefix text, etc.). */
  leading?: ReactNode;
  /** Trailing adornment. */
  trailing?: ReactNode;
};

/**
 * Themed text input — usable for all `<input type="text|email|url|...">` shapes.
 *
 * Mobile behavior: 16px minimum font on iOS (size `md` defaults to text-sm; pass
 * `inputSize="lg"` if you want to prevent iOS zoom-on-focus). Tap target meets
 * 36px height at `md`.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = "md", invalid, leading, trailing, className, ...rest },
  ref,
) {
  const inputEl = (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border bg-surface text-text-primary placeholder:text-text-muted",
        "transition focus:outline-none focus:ring-2 focus:ring-accent/30",
        "disabled:cursor-not-allowed disabled:opacity-60",
        sizeClasses[inputSize],
        invalid
          ? "border-error focus:border-error focus:ring-error/30"
          : "border-border focus:border-accent",
        leading ? "pl-9" : "",
        trailing ? "pr-9" : "",
        className,
      )}
      aria-invalid={invalid || rest["aria-invalid"]}
      {...rest}
    />
  );

  if (!leading && !trailing) return inputEl;

  return (
    <span className="relative block">
      {leading && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-text-muted">
          {leading}
        </span>
      )}
      {inputEl}
      {trailing && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-text-muted">
          {trailing}
        </span>
      )}
    </span>
  );
});
