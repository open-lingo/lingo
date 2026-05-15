import { useEffect, useRef, type ReactNode } from "react";

type ModalBackdropProps = {
  onClose: () => void;
  children: ReactNode;
  ariaLabelledBy?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
};

/**
 * Overlay + dismissal for rich modals that need custom inner layout (not ModalBase headers).
 */
export function ModalBackdrop({
  onClose,
  children,
  ariaLabelledBy,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: ModalBackdropProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, closeOnEscape]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      onClick={(e) => {
        if (
          closeOnBackdropClick &&
          panelRef.current &&
          !panelRef.current.contains(e.target as Node)
        ) {
          onClose();
        }
      }}
    >
      <div ref={panelRef}>{children}</div>
    </div>
  );
}
