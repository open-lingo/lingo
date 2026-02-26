import type { ReactNode } from "react";

type ScrollDirection = "x" | "y" | "both";

type Props = {
  /** Scroll direction: x (horizontal), y (vertical), or both */
  direction?: ScrollDirection;
  /** Additional class names */
  className?: string;
  /** Content to scroll */
  children: ReactNode;
};

const overflowClass: Record<ScrollDirection, string> = {
  x: "overflow-x-auto overflow-y-hidden",
  y: "overflow-y-auto overflow-x-hidden",
  both: "overflow-auto",
};

/**
 * Scrollable area with themed, rounded floating scrollbar.
 * Use instead of raw overflow-auto for consistent scrollbar styling.
 */
export function ScrollArea({
  direction = "y",
  className = "",
  children,
}: Props) {
  return (
    <div
      className={`scrollbar-theme ${overflowClass[direction]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
