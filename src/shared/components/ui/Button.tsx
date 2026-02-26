import { forwardRef } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Accent-colored outline (for outline variant). */
  accent?: boolean;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover",
  secondary:
    "border border-border bg-surface text-text-primary hover:bg-surface-muted",
  ghost:
    "text-text-primary hover:bg-surface-muted",
  outline:
    "border border-border bg-transparent text-text-primary hover:bg-surface-muted",
  danger:
    "border border-error bg-error/10 text-error hover:bg-error/20",
};

const accentOutlineClasses =
  "border-accent text-accent hover:bg-accent-muted";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      accent = false,
      className,
      children,
      type = "button",
      ...props
    },
    ref
  ) {
    const variantClass =
      variant === "outline" && accent ? accentOutlineClasses : variantClasses[variant];

    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseClasses, variantClass, className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
