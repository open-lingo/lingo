import { useEffect, useRef } from "react";
import { Icon } from "@/shared/components/Icon";
import { Portal } from "@/shared/components/ui/Portal";

export type ModalBaseMaxWidth =
  | "max-w-sm"
  | "max-w-md"
  | "max-w-lg"
  | "max-w-xl"
  | "max-w-2xl"
  | "max-w-3xl"
  | "max-w-4xl"
  | "max-w-6xl";

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
          className={`relative mx-4 w-full ${maxWidth} overflow-y-auto rounded-card border border-border bg-surface shadow-2xl`}
          style={{ maxHeight: "85vh" }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {headerLeft}
              <h2 className="truncate text-lg font-bold text-text-primary">
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
          {children}
        </div>
      </div>
    </Portal>
  );
}
