import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  /** Full-width row for menus (account dropdown, etc.). */
  | "menu"
  /**
   * Hero CTA with a hard offset shadow + press-snap. The visual language
   * for every primary "advance" action across landing, lesson flow, test
   * gates, and the post-lesson summary. Mirrors the pathway Start pill.
   */
  | "primary-3d";

export type ButtonSize = "md" | "sm" | "icon" | "hero";

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
  /** Landing hero row — matches primary-3d footprint (padding + min height). */
  hero: "min-h-12 gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold",
};

// `!justify-start` overrides the `justify-center` in baseBehavior — menu
// rows are left-aligned (icon + label), not centered. Without `!important`
// Tailwind's class declaration order leaves the layout ambiguous.
//
// `min-h-[44px]` makes every menu row a comfortable touch target on
// mobile while still reading as compact on desktop (py-2 keeps the
// vertical density on rows whose content already pushes past 44px).
const menuRowLayout =
  "min-h-[44px] w-full !justify-start gap-3 rounded-none px-4 py-2 text-left text-sm font-normal";

// Layout is variant-owned (not size-driven) — primary-3d is a single
// hero spec across landing + lesson, not a size scale.
const primary3dLayout =
  "min-h-12 gap-2 rounded-xl border-[1.5px] px-6 py-3 text-base font-bold uppercase tracking-wide";

// Filled accent variants get a solid muted disabled treatment instead of
// opacity — fading white-on-accent to 50% drops the label below WCAG
// contrast (~2.3:1). Non-filled variants keep the classic opacity fade.
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover hover:text-accent-foreground disabled:bg-surface-muted disabled:text-text-muted disabled:shadow-none",
  secondary:
    "border border-border bg-surface text-text-primary hover:bg-surface-muted disabled:opacity-50",
  ghost: "text-text-primary hover:bg-surface-muted disabled:opacity-50",
  outline:
    "border border-border bg-transparent text-text-primary hover:bg-surface-muted disabled:opacity-50",
  danger:
    "border border-error bg-error/10 text-error hover:bg-error/20 disabled:opacity-50",
  menu: "text-text-primary hover:bg-surface-muted disabled:opacity-50",
  "primary-3d":
    "border-accent-hover bg-accent text-accent-foreground shadow-[0_3px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_4px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)] disabled:border-border disabled:bg-surface-muted disabled:text-text-muted disabled:shadow-[0_3px_0_0_var(--color-border)] disabled:hover:translate-y-0 disabled:hover:bg-surface-muted disabled:hover:shadow-[0_3px_0_0_var(--color-border)]",
};

const accentOutlineClasses =
  "border-accent text-accent hover:bg-accent-muted hover:text-accent disabled:opacity-50";

const baseBehavior =
  "inline-flex items-center justify-center transition disabled:cursor-not-allowed";

/** Shared class names for `<button>` / `<Link>` so menu rows match `Button`. */
export function composeButtonClasses({
  variant = "primary",
  accent = false,
  size = "md",
  className,
}: ButtonStyleOptions): string {
  const layout =
    variant === "menu"
      ? menuRowLayout
      : variant === "primary-3d"
        ? primary3dLayout
        : sizeClasses[size];
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
