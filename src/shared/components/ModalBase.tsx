import { useEffect, useRef } from "react";
import { Icon } from "@/shared/components/Icon";
import { Portal } from "@/shared/components/ui/Portal";
import { cn } from "@/shared/components/ui/cn";

export type ModalBaseMaxWidth =
  | "max-w-sm"
  | "max-w-md"
  | "max-w-lg"
  | "max-w-xl"
  | "max-w-2xl"
  | "max-w-3xl"
  | "max-w-4xl"
  | "max-w-5xl"
  | "max-w-6xl"
  | "max-w-7xl";

type ModalBaseProps = {
  /** Called when user closes via Escape, backdrop click (if enabled), close button (if visible), etc. */
  onClose: () => void;
  /** For aria-label and header title. */
  title: string;
  /** Optional left side of header (e.g. back button). */
  headerLeft?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: ModalBaseMaxWidth;
  /** Default true — click outside panel closes modal */
  closeOnBackdrop?: boolean;
  /** Default true */
  closeOnEscape?: boolean;
  /** Header close button visibility. Default true. */
  showCloseButton?: boolean;
  /**
   * Fill the viewport height (capped) instead of sizing to content. Turns the
   * panel into a fixed-height flex column: header pinned, body flexes + owns its
   * own scroll. Use for full-surface modals like Settings.
   */
  fullHeight?: boolean;
};

export function ModalBase({
  onClose,
  title,
  headerLeft,
  children,
  maxWidth = "max-w-lg",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  fullHeight = false,
}: ModalBaseProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!closeOnEscape) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, closeOnEscape]);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-overlay pt-16 sm:items-center sm:pt-0"
        onClick={(e) => {
          if (
            closeOnBackdrop &&
            panelRef.current &&
            !panelRef.current.contains(e.target as Node)
          ) {
            onClose();
          }
        }}
      >
        <div
          ref={panelRef}
          className={cn(
            "relative mx-4 flex w-full flex-col rounded-card border border-border bg-surface shadow-2xl",
            maxWidth,
            fullHeight
              ? // Mobile: backdrop offsets the panel 4rem from the top (pt-16),
                // so cap height to fit under that with a little bottom gap.
                "h-[calc(100dvh-6rem)] sm:h-[85vh]"
              : "max-h-[85vh] overflow-y-auto",
          )}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {headerLeft}
              {/* Wrap, don't truncate: at 390px "Welcome to flashcard
                  review" clipped to "…flashcard re…". Two lines beats an
                  ellipsis on a heading the user is meant to read. */}
              <h2 className="min-w-0 text-balance text-lg font-bold leading-snug text-text-primary">
                {title}
              </h2>
            </div>
            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
                aria-label="Close"
              >
                <Icon name="close" size={20} />
              </button>
            ) : null}
          </div>
          {fullHeight ? (
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          ) : (
            children
          )}
        </div>
      </div>
    </Portal>
  );
}
