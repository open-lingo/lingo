import { type ReactNode } from "react";
import { useBreakpoint, type Breakpoint } from "@/shared/hooks/useViewport";

type ShowProps =
  | { above: Breakpoint; below?: undefined; children: ReactNode }
  | { below: Breakpoint; above?: undefined; children: ReactNode };

/**
 * Declarative responsive wrapper. Renders `children` only when the viewport
 * satisfies the breakpoint constraint. Uses `matchMedia`, so it reacts to
 * viewport changes without resize-event spam.
 *
 * Mobile behavior: equivalent to Tailwind `md:hidden` / `hidden md:block`,
 * but JS-driven so children are not in the DOM when hidden (good for heavy
 * sidebars). Prefer Tailwind classes for purely visual hide/show.
 *
 * @example
 *   <Show above="md"><DesktopSidebar /></Show>
 *   <Show below="md"><MobileDrawerTrigger /></Show>
 */
export function Show({ above, below, children }: ShowProps) {
  const meetsAbove = useBreakpoint(above ?? "sm");
  if (above !== undefined) {
    return meetsAbove ? <>{children}</> : null;
  }
  const meetsBelow = useBreakpoint(below as Breakpoint);
  // `below` means strictly less than that breakpoint.
  return meetsBelow ? null : <>{children}</>;
}

type ResponsiveSwitchProps = {
  /** Boundary breakpoint. `mobile` renders when viewport < `at`. */
  at?: Breakpoint;
  mobile: ReactNode;
  desktop: ReactNode;
};

/**
 * Renders one of two layouts based on a single viewport boundary. Useful for
 * pages that explicitly opt into a wholly different mobile layout (vs CSS-only
 * responsive tweaks).
 *
 * Mobile behavior: below `at` (default `md`) renders `mobile`; otherwise `desktop`.
 */
export function ResponsiveSwitch({
  at = "md",
  mobile,
  desktop,
}: ResponsiveSwitchProps) {
  const above = useBreakpoint(at);
  return <>{above ? desktop : mobile}</>;
}
