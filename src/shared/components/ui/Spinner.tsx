import { Loader2 } from "lucide-react";
import { cn } from "./cn";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
  xl: 40,
};

export type SpinnerProps = {
  size?: SpinnerSize;
  /** Accessible label; if omitted the spinner is purely decorative. */
  label?: string;
  className?: string;
};

/**
 * Inline loading spinner. Use {@link CenteredLoader} for full-area loading.
 *
 * Mobile behavior: stable across viewports — purely an icon, no layout impact.
 */
export function Spinner({ size = "md", label, className }: SpinnerProps) {
  const px = sizeMap[size];
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("inline-flex text-text-muted", className)}
    >
      <Loader2 size={px} className="animate-spin" />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
