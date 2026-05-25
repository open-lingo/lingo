import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "./cn";
import { Portal } from "./Portal";
import { useEscapeKey } from "@/shared/hooks/useEscapeKey";

export type PopoverPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

export type PopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The element that anchors the popover. Click on it toggles. */
  trigger: ReactElement;
  /** Popover content. */
  children: ReactNode;
  /** Preferred placement. Default `bottom-start`. The popover flips if it overflows the viewport. */
  placement?: PopoverPlacement;
  /** Width override (Tailwind classes). Defaults to fit content. */
  width?: string;
  /** Extra classes for the surface. */
  className?: string;
};

type Position = { top: number; left: number };

/**
 * Lightweight popover with viewport collision handling. The trigger must accept
 * `ref` + `onClick`. Renders content in a portal anchored relative to the
 * trigger's bounding rect.
 *
 * Mobile behavior: prefer {@link Sheet} on mobile for menus that hold many
 * options. Popover stays useful for small, contextual surfaces.
 */
export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  placement = "bottom-start",
  width,
  className,
}: PopoverProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position | null>(null);
  const [actualPlacement, setActualPlacement] = useState<PopoverPlacement>(placement);

  const computePosition = useCallback(() => {
    const el = triggerRef.current;
    const panel = panelRef.current;
    if (!el || !panel) return;
    const rect = el.getBoundingClientRect();
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;

    let next: PopoverPlacement = placement;
    let top: number;
    let left: number;

    const wantsBottom = placement.startsWith("bottom");
    const wantsEnd = placement.endsWith("end");

    // Flip vertically if no room.
    if (wantsBottom && rect.bottom + ph + margin > vh && rect.top - ph - margin >= 0) {
      next = wantsEnd ? "top-end" : "top-start";
    } else if (!wantsBottom && rect.top - ph - margin < 0 && rect.bottom + ph + margin <= vh) {
      next = wantsEnd ? "bottom-end" : "bottom-start";
    }

    top = next.startsWith("bottom") ? rect.bottom + 4 : rect.top - ph - 4;
    left = next.endsWith("end") ? rect.right - pw : rect.left;

    // Clamp horizontally to viewport.
    if (left + pw + margin > vw) left = vw - pw - margin;
    if (left < margin) left = margin;
    // Clamp vertically.
    if (top + ph + margin > vh) top = vh - ph - margin;
    if (top < margin) top = margin;

    setActualPlacement(next);
    setPos({ top, left });
  }, [placement]);

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
  }, [open, computePosition]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => computePosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, computePosition]);

  useEscapeKey(open, () => onOpenChange(false));

  // Click outside to close.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onOpenChange(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onOpenChange]);

  if (!isValidElement(trigger)) return null;
  type TriggerProps = {
    ref?: React.Ref<HTMLElement>;
    onClick?: (e: React.MouseEvent) => void;
    "aria-expanded"?: boolean;
    "aria-haspopup"?: "dialog";
  };
  const triggerWithProps = trigger as ReactElement<TriggerProps>;
  const triggerProps = (triggerWithProps.props ?? {}) as TriggerProps;
  const triggerEl = cloneElement(triggerWithProps, {
    ref: triggerRef,
    onClick: (e: React.MouseEvent) => {
      onOpenChange(!open);
      triggerProps.onClick?.(e);
    },
    "aria-expanded": open,
    "aria-haspopup": "dialog",
  } as TriggerProps);

  return (
    <>
      {triggerEl}
      {open && (
        <Portal>
          <div
            ref={panelRef}
            role="dialog"
            data-placement={actualPlacement}
            style={{
              position: "fixed",
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              visibility: pos ? "visible" : "hidden",
            }}
            className={cn(
              "z-50 rounded-lg border border-border bg-surface-elevated p-2 shadow-popover",
              width,
              className,
            )}
          >
            {children}
          </div>
        </Portal>
      )}
    </>
  );
}
