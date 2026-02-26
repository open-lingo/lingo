import { useEffect, useRef } from "react";
import { Icon } from "@/shared/components/Icon";

type ModalBaseProps = {
  /** Called when user closes via Escape, backdrop click, or close button. */
  onClose: () => void;
  /** For aria-label. */
  title: string;
  /** Optional left side of header (e.g. back button). */
  headerLeft?: React.ReactNode;
  children: React.ReactNode;
  /** Max width class. Default max-w-lg. */
  maxWidth?: "max-w-sm" | "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl";
};

export function ModalBase({
  onClose,
  title,
  headerLeft,
  children,
  maxWidth = "max-w-lg",
}: ModalBaseProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-overlay pt-16 backdrop-blur-sm sm:items-center sm:pt-0"
      onClick={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        className={`relative mx-4 w-full ${maxWidth} overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl`}
        style={{ maxHeight: "85vh" }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {headerLeft}
            <h2 className="text-lg font-bold text-text-primary truncate">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
            aria-label="Close"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
