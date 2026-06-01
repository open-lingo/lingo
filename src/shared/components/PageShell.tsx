import type { ReactNode } from "react";
import { cn } from "@/shared/components/ui/cn";

/**
 * Standard content shell for user-facing pages.
 *
 * Use this instead of ad-hoc `max-w-2xl` / `max-w-3xl` / `max-w-6xl` wrappers
 * so reading width is consistent across the app.
 *
 * Variants:
 *   - `narrow` — single-column reading / forms / simple pages (~max 3xl).
 *   - `wide`   — multi-column dashboards / list+detail / forum (~max 6xl).
 *   - `full`   — no max-width (lets the page own its own layout).
 *
 * Always applies horizontal centering + responsive horizontal padding.
 * Optional `spaceY` adds vertical rhythm between direct children.
 */
type Variant = "narrow" | "wide" | "full";
type SpaceY = "none" | "sm" | "md" | "lg";

type PageShellProps = {
  variant?: Variant;
  spaceY?: SpaceY;
  className?: string;
  children: ReactNode;
};

const VARIANT_CLASS: Record<Variant, string> = {
  narrow: "mx-auto w-full max-w-3xl px-4 sm:px-6",
  wide: "mx-auto w-full max-w-6xl px-4 sm:px-6",
  full: "w-full",
};

const SPACE_Y_CLASS: Record<SpaceY, string> = {
  none: "",
  sm: "space-y-4",
  md: "space-y-6",
  lg: "space-y-8",
};

export function PageShell({
  variant = "narrow",
  spaceY = "none",
  className,
  children,
}: PageShellProps) {
  return (
    <div className={cn(VARIANT_CLASS[variant], SPACE_Y_CLASS[spaceY], className)}>
      {children}
    </div>
  );
}
