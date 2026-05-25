import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export type BadgeVariant =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info";

export type BadgeSize = "sm" | "md";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Render as a fully-rounded pill (default true). */
  pill?: boolean;
  /** Leading icon / dot. */
  leading?: ReactNode;
};

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-text-secondary border border-border",
  accent: "bg-accent-muted text-accent border border-accent/30",
  success: "bg-success/10 text-success border border-success/30",
  warning: "bg-warning/10 text-warning border border-warning/30",
  error: "bg-error/10 text-error border border-error/30",
  info: "bg-info/10 text-info border border-info/30",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px] font-medium",
  md: "px-2 py-0.5 text-xs font-medium",
};

/**
 * Small status indicator. `Badge`, `Tag`, and `Pill` are stylistic aliases — pick
 * whichever name reads best at the call site.
 *
 * Mobile behavior: scales fluidly; consider `size="sm"` in dense lists on mobile.
 */
export function Badge({
  variant = "neutral",
  size = "md",
  pill = true,
  leading,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap",
        pill ? "rounded-full" : "rounded-md",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {leading}
      {children}
    </span>
  );
}

/** Square-cornered alias of `Badge` — better for tag-like usage in cards. */
export function Tag(props: BadgeProps) {
  return <Badge {...props} pill={false} />;
}

/** Pill alias of `Badge` (explicit rounded). */
export function Pill(props: BadgeProps) {
  return <Badge {...props} pill />;
}
