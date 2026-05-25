import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./cn";

export type SelectSize = "sm" | "md" | "lg";

const sizeClasses: Record<SelectSize, string> = {
  sm: "px-2.5 py-1.5 pr-7 text-xs",
  md: "px-3 py-2 pr-8 text-sm",
  lg: "px-3.5 py-2.5 pr-9 text-base",
};

type NativeSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">;

export type SelectProps = NativeSelectProps & {
  selectSize?: SelectSize;
  invalid?: boolean;
};

/**
 * Native `<select>` themed to match other form controls. Use the native variant
 * unless you need search / virtualization / custom item rendering — native
 * selects are vastly better on mobile (system wheel picker, no portal headaches).
 *
 * Mobile behavior: defers to the OS picker UI. Custom selects can come later.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { selectSize = "md", invalid, className, children, ...rest },
  ref,
) {
  return (
    <span className="relative inline-flex w-full">
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-lg border bg-surface text-text-primary",
          "transition focus:outline-none focus:ring-2 focus:ring-accent/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
          sizeClasses[selectSize],
          invalid
            ? "border-error focus:border-error focus:ring-error/30"
            : "border-border focus:border-accent",
          className,
        )}
        aria-invalid={invalid || rest["aria-invalid"]}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </span>
  );
});
