import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export type BadgeVariant =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  /**
   * The borderless ALL-CAPS label that sits above a prompt — "PICK WHAT FITS
   * THE BLANK", "QUICK FIX", "THE RULE". 23 step views typed
   * `text-xs font-bold uppercase tracking-wider text-<tone>` by hand
   * (`grep -c` on the exact literal: 23 hits), which is how two of them ended
   * up on `tracking-[0.1em]` instead. Not a pill: no background, no border,
   * no padding, no rounding — those are what `size` adds, and an eyebrow
   * takes none of them. Pick the colour with `tone`, not a class.
   */
  | "eyebrow";

/** Text colour for `variant="eyebrow"`. */
export type BadgeTone = "muted" | "accent" | "warning" | "success" | "info" | "error";

export type BadgeSize = "sm" | "md";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Render as a fully-rounded pill (default true). */
  pill?: boolean;
  /** Leading icon / dot. */
  leading?: ReactNode;
  /** `variant="eyebrow"` only — which text colour. Default `muted`. */
  tone?: BadgeTone;
  /**
   * Element to render. `variant="eyebrow"` defaults to `p` because that is
   * what every prompt eyebrow already is, and swapping a block `<p>` for an
   * inline `<span>` moves the line box wherever the parent is not a flex
   * container. Every other variant is a `span`, as before.
   */
  as?: "span" | "p" | "div";
};

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-text-secondary border border-border",
  accent: "bg-accent-muted text-accent border border-accent/30",
  success: "bg-success/10 text-success border border-success/30",
  warning: "bg-warning/10 text-warning border border-warning/30",
  error: "bg-error/10 text-error border border-error/30",
  info: "bg-info/10 text-info border border-info/30",
  // Never read — `variant="eyebrow"` returns before this map is consulted
  // (an eyebrow has no background, border or padding). Present so the
  // Record stays exhaustive and a future variant cannot be forgotten.
  eyebrow: "",
};

/** The eyebrow's own tone map — the only colours this label may take. */
const eyebrowTone: Record<BadgeTone, string> = {
  muted: "text-text-muted",
  accent: "text-accent",
  warning: "text-warning",
  success: "text-success",
  info: "text-info",
  error: "text-error",
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
  tone = "muted",
  as,
  className,
  children,
  ...rest
}: BadgeProps) {
  if (variant === "eyebrow") {
    // Deliberately NOT built from the base/pill/size classes above: an
    // eyebrow is type, not a chip. The class string below is exactly what
    // the 23 call sites shipped, so the swap is pixel-identical.
    const cls = cn(
      "text-xs font-bold uppercase tracking-wider",
      eyebrowTone[tone],
      className,
    );
    if (as === "span") return <span className={cls} {...rest}>{children}</span>;
    if (as === "div") return <div className={cls} {...rest}>{children}</div>;
    return <p className={cls} {...rest}>{children}</p>;
  }
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
