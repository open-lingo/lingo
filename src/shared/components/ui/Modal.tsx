import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "./cn";
import { Portal } from "./Portal";
import { useEscapeKey } from "@/shared/hooks/useEscapeKey";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

const sizeClasses: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
};

export type ModalProps = {
  /** Whether the modal is open. */
  open: boolean;
  /** Called on escape / backdrop / close-button. */
  onClose: () => void;
  /** Header title (also used as aria-label fallback). */
  title?: string;
  /** Optional left adornment in the header (e.g. back button). */
  headerLeft?: ReactNode;
  /** Optional right adornment in the header (rendered before the close button). */
  headerRight?: ReactNode;
  /** Show the header divider. Default true when `title` or footer present. */
  showHeaderDivider?: boolean;
  /** Show the footer divider. Default true when `footer` present. */
  showFooterDivider?: boolean;
  /** Footer slot (e.g. action buttons). */
  footer?: ReactNode;
  /** Modal body. */
  children: ReactNode;
  /** Max width on tablet+. Default `lg`. */
  size?: ModalSize;
  /** Close when the backdrop is clicked. Default true. */
  closeOnBackdrop?: boolean;
  /** Close on Escape. Default true. */
  closeOnEscape?: boolean;
  /** Show the close button in the header. Default true. */
  showCloseButton?: boolean;
  /** Extra classes for the panel. */
  className?: string;
  /** Remove default body padding (useful for media that bleeds edge-to-edge). Default false. */
  unpadded?: boolean;
};

/**
 * Modal primitive with composition slots (header, body, footer).
 *
 * Mobile (< sm): renders as a bottom slide-up sheet pinned to the viewport
 * bottom, full-width with rounded top corners — Apple/Material-style sheet.
 * Tablet+ (>= sm): centered card with `max-w-<size>`.
 *
 * Behavior:
 *  - Portals into `document.body`.
 *  - Traps focus while open; restores focus to previously-active element on close.
 *  - Escape and backdrop click close (both opt-out via props).
 *  - Locks body scroll while open.
 */
export function Modal({
  open,
  onClose,
  title,
  headerLeft,
  headerRight,
  showHeaderDivider,
  showFooterDivider,
  footer,
  children,
  size = "lg",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  unpadded = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeKey(open && closeOnEscape, onClose);
  useFocusTrap(panelRef, open);

  // Body-scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const hasHeader = Boolean(title || headerLeft || headerRight || showCloseButton);
  const headerDivider = showHeaderDivider ?? hasHeader;
  const footerDivider = showFooterDivider ?? Boolean(footer);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-overlay backdrop-blur-sm sm:items-center"
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
            // Mobile: bottom sheet, full width, rounded top, slide-up animation.
            "relative w-full max-h-[90vh] overflow-hidden rounded-t-2xl border border-border bg-surface shadow-popover",
            // Tablet+: centered card, rounded all corners, fits to size.
            "sm:mx-4 sm:w-full sm:rounded-2xl sm:max-h-[85vh]",
            "flex flex-col",
            sizeClasses[size],
            "animate-fade-up",
            className,
          )}
        >
          {hasHeader && (
            <div
              className={cn(
                "flex items-center gap-3 px-5 py-3.5 sm:px-6",
                headerDivider && "border-b border-border",
              )}
            >
              {headerLeft}
              {title && (
                <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-text-primary sm:text-lg">
                  {title}
                </h2>
              )}
              {!title && <div className="flex-1" />}
              {headerRight}
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
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto",
              unpadded ? "" : "px-5 py-4 sm:px-6",
            )}
          >
            {children}
          </div>
          {footer && (
            <div
              className={cn(
                "flex flex-wrap items-center justify-end gap-2 px-5 py-3.5 sm:px-6",
                footerDivider && "border-t border-border",
              )}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
