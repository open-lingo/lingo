import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  /** Full-width row for menus (account dropdown, etc.). */
  | "menu";

export type ButtonSize = "md" | "sm" | "icon";

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  /** Accent-colored outline (for outline variant). */
  accent?: boolean;
  size?: ButtonSize;
  className?: string;
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "rounded-lg px-4 py-2.5 text-sm font-medium",
  sm: "rounded-md px-3 py-1.5 text-xs font-medium",
  icon: "size-9 shrink-0 rounded-full p-0",
};

const menuRowLayout =
  "w-full justify-start gap-3 rounded-none px-4 py-2 text-left text-sm font-normal";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover hover:text-accent-foreground",
  secondary:
    "border border-border bg-surface text-text-primary hover:bg-surface-muted",
  ghost: "text-text-primary hover:bg-surface-muted",
  outline:
    "border border-border bg-transparent text-text-primary hover:bg-surface-muted",
  danger: "border border-error bg-error/10 text-error hover:bg-error/20",
  menu: "text-text-primary hover:bg-surface-muted",
};

const accentOutlineClasses =
  "border-accent text-accent hover:bg-accent-muted hover:text-accent";

const baseBehavior =
  "inline-flex items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-50";

/** Shared class names for `<button>` / `<Link>` so menu rows match `Button`. */
export function composeButtonClasses({
  variant = "primary",
  accent = false,
  size = "md",
  className,
}: ButtonStyleOptions): string {
  const layout = variant === "menu" ? menuRowLayout : sizeClasses[size];
  const variantClass =
    variant === "outline" && accent ? accentOutlineClasses : variantClasses[variant];
  return cn(baseBehavior, layout, variantClass, className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleOptions;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    accent = false,
    size = "md",
    className,
    children,
    type = "button",
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={composeButtonClasses({ variant, accent, size, className })}
      {...props}
    >
      {children}
    </button>
  );
});
