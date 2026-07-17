import type { ReactNode } from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

type ScrollDirection = "x" | "y" | "both";

type Props = {
  /** Scroll direction: x (horizontal), y (vertical), or both */
  direction?: ScrollDirection;
  /** Additional class names applied to the scroll host */
  className?: string;
  /** Content to scroll */
  children: ReactNode;
};

const overflowFor = (direction: ScrollDirection) => ({
  x: direction === "y" ? ("hidden" as const) : ("scroll" as const),
  y: direction === "x" ? ("hidden" as const) : ("scroll" as const),
});

/**
 * Scrollable area with the themed, floating overlay scrollbar.
 * Use instead of raw overflow-auto for consistent scrollbar styling.
 *
 * Wraps OverlayScrollbars, which hides the native bar and overlays the
 * Academia pill while keeping native scroll behaviour. Size the host via
 * `className` (e.g. `max-h-96`, `flex-1`) exactly as before — the overlay
 * viewport fills it.
 */
export function ScrollArea({
  direction = "y",
  className = "",
  children,
}: Props) {
  return (
    <OverlayScrollbarsComponent
      element="div"
      className={className}
      defer
      options={{
        overflow: overflowFor(direction),
        scrollbars: {
          theme: "os-theme-lingo",
          autoHide: "leave",
          autoHideDelay: 500,
          autoHideSuspend: true,
        },
      }}
    >
      {children}
    </OverlayScrollbarsComponent>
  );
}
