import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

/**
 * Themed multi-line text input.
 *
 * Mobile behavior: full-width; pair with `rows` or Tailwind `min-h-*` to control
 * height. Touch users can resize via the corner handle.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted",
          "transition focus:outline-none focus:ring-2 focus:ring-accent/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
          invalid
            ? "border-error focus:border-error focus:ring-error/30"
            : "border-border focus:border-accent",
          className,
        )}
        aria-invalid={invalid || rest["aria-invalid"]}
        {...rest}
      />
    );
  },
);
