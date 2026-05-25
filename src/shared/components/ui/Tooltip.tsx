import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "./cn";
import { useViewport } from "@/shared/hooks/useViewport";

export type TooltipSide = "top" | "bottom" | "left" | "right";

export type TooltipProps = {
  /** Tooltip content (string or rich node). */
  label: ReactNode;
  /** The element the tooltip targets. Must accept refs / aria props. */
  children: ReactElement;
  /** Preferred side. Default `top`. */
  side?: TooltipSide;
  /** Disable on touch / mobile. Default true — tooltips are non-discoverable on touch. */
  disableOnMobile?: boolean;
  /** Extra classes for the tooltip body. */
  className?: string;
};

const sideClasses: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 -translate-y-1 mb-1",
  bottom: "top-full left-1/2 -translate-x-1/2 translate-y-1 mt-1",
  left: "right-full top-1/2 -translate-y-1/2 -translate-x-1 mr-1",
  right: "left-full top-1/2 -translate-y-1/2 translate-x-1 ml-1",
};

/**
 * Lightweight tooltip — pure CSS positioning around an anchor, focus + hover
 * triggered. Wraps a single child element.
 *
 * Mobile behavior: hidden by default on mobile (tooltips are non-discoverable
 * on touch). Set `disableOnMobile={false}` to keep them on focus only.
 *
 * For richer / collision-aware behavior, use {@link Popover}.
 */
export function Tooltip({
  label,
  children,
  side = "top",
  disableOnMobile = true,
  className,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const { isMobile } = useViewport();

  if (!isValidElement(children)) return children;
  if (disableOnMobile && isMobile) return children;

  type ChildProps = {
    "aria-describedby"?: string;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
  };
  const childWithProps = children as ReactElement<ChildProps>;
  const childProps = (childWithProps.props ?? {}) as ChildProps;

  const trigger = cloneElement(childWithProps, {
    "aria-describedby": id,
    onMouseEnter: (e: React.MouseEvent) => {
      setOpen(true);
      childProps.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      setOpen(false);
      childProps.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      setOpen(true);
      childProps.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      setOpen(false);
      childProps.onBlur?.(e);
    },
  } as ChildProps);

  return (
    <span className="relative inline-flex">
      {trigger}
      <span
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 max-w-xs whitespace-normal rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs text-text-primary shadow-popover transition-opacity",
          sideClasses[side],
          open ? "opacity-100" : "opacity-0",
          className,
        )}
      >
        {label}
      </span>
    </span>
  );
}
