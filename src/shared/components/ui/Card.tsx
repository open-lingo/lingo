import { forwardRef } from "react";
import { cn } from "./cn";

type CardVariant = "default" | "muted" | "elevated";
type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
  as?: "div" | "section" | "article";
};

const variantClasses: Record<CardVariant, string> = {
  default:
    "rounded-xl border border-border bg-surface shadow-card",
  muted:
    "rounded-xl border border-border bg-surface-muted",
  elevated:
    "rounded-xl border border-border bg-surface-elevated shadow-popover",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card(
    { variant = "default", padding = "md", as: Component = "div", className, children, ...props },
    ref
  ) {
    return (
      <Component
        ref={ref}
        className={cn(
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
