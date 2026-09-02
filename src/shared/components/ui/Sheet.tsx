import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";
import { Portal } from "./Portal";
import { useEscapeKey } from "@/shared/hooks/useEscapeKey";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";

export type SheetSide = "left" | "right" | "bottom" | "top" | "auto";

/**
 * `auto` is the responsive pairing the app kept hand-rolling: a bottom sheet on
 * a phone (thumb-reachable, and the platform idiom for secondary detail) and a
 * right drawer at `md`+ where there is horizontal room and a bottom sheet would
 * waste it. Same shape `ui/Modal` already uses for its mobile bottom-sheet
 * form, expressed as one class string so callers pick an intent, not an edge.
 *
 * `pb-safe` on both bottom-anchored variants: a panel pinned to `bottom-0` in
 * the full-bleed iOS WKWebView puts its last control under the home indicator
 * (34pt on a 15 Pro Max). `pb-safe` = `max(env(safe-area-inset-bottom), 0px)`,
 * so it is a literal no-op in a browser tab and on desktop. `md:pb-0` takes it
 * back off in the drawer form, where the panel is inset-y-0 and not on the
 * bottom edge at all.
 */
const sideClasses: Record<SheetSide, string> = {
  left: "inset-y-0 left-0 h-full w-[88vw] max-w-sm border-r rounded-r-2xl",
  right: "inset-y-0 right-0 h-full w-[88vw] max-w-sm border-l rounded-l-2xl",
  bottom: "inset-x-0 bottom-0 max-h-[88vh] border-t rounded-t-2xl pb-safe",
  top: "inset-x-0 top-0 max-h-[88vh] border-b rounded-b-2xl",
  auto:
    "inset-x-0 bottom-0 max-h-[88vh] border-t rounded-t-2xl pb-safe " +
    "md:inset-y-0 md:left-auto md:right-0 md:h-full md:max-h-none md:w-[88vw] " +
    "md:max-w-sm md:rounded-l-2xl md:rounded-t-none md:border-l md:border-t-0 md:pb-0",
};

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Which edge the panel attaches to. Default `right` (desktop drawer). `bottom` for a mobile sheet; `auto` for bottom-below-md / right-above. */
  side?: SheetSide;
  /** Header title. */
  title?: string;
  /** Footer slot. */
  footer?: ReactNode;
  /** Body content. */
  children: ReactNode;
  /** Show the close button. Default true. */
  showCloseButton?: boolean;
  /** Close on Escape. Default true. */
  closeOnEscape?: boolean;
  /** Close on backdrop click. Default true. */
  closeOnBackdrop?: boolean;
  /** Extra classes for the panel. */
  className?: string;
};

/**
 * Sheet / Drawer primitive — slide-in panel anchored to an edge.
 *
 * Mobile behavior: pair with `Sheet side="bottom"` for a mobile-friendly bottom
 * sheet (e.g. filter sheet). On larger viewports prefer `side="right"` or
 * `side="left"` for a drawer.
 *
 * Behavior:
 *  - Portals into `document.body`.
 *  - Traps focus while open.
 *  - Escape + backdrop click close.
 *  - Locks body scroll while open.
 */
export function Sheet({
  open,
  onClose,
  side = "right",
  title,
  footer,
  children,
  showCloseButton = true,
  closeOnEscape = true,
  closeOnBackdrop = true,
  className,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeKey(open && closeOnEscape, onClose);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 bg-overlay"
        onMouseDown={(e) => {
          if (!closeOnBackdrop) return;
          if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
            onClose();
          }
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={cn(
            "fixed flex flex-col border-border bg-surface shadow-popover animate-fade-up",
            sideClasses[side],
            className,
          )}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
              {title && (
                <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-text-primary sm:text-lg">
                  {title}
                </h2>
              )}
              {!title && <div className="flex-1" />}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-lg p-1.5 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}

/** Alias for semantics — `Drawer` reads better when attached to a side edge. */
export const Drawer = Sheet;
export type DrawerProps = SheetProps;
