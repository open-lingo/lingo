import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Portal } from "@/shared/components/ui/Portal";
import { Icon } from "@/shared/components/Icon";
import { useEscapeKey } from "@/shared/hooks/useEscapeKey";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";

type InventoryPopoutProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Slide-in popout sidebar from the right edge, used by the profile page
 * to surface the decorator inventory. Portals to document.body so it
 * escapes any transform/stacking contexts on the host page.
 *
 * Behavior:
 *  - Escape closes.
 *  - Click outside the panel closes.
 *  - Focus is trapped inside the panel while open.
 *  - Body scroll is locked while open.
 *  - No dim/blur backdrop — the page behind stays at full brightness so
 *    this reads as a side panel rather than a takeover modal.
 */
export function InventoryPopout({ open, onClose, children }: InventoryPopoutProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useEscapeKey(open, onClose);
  useFocusTrap(panelRef, open);

  // Lock body scroll while the popout is open.
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
      {/* Transparent capture layer for click-outside-to-close. The page
          beneath stays at full brightness — no dim/blur overlay — so the
          inventory feels like a sidebar that slid in rather than a modal
          that took over the viewport. */}
      <div
        className="fixed inset-0 z-50 flex justify-end"
        onMouseDown={(e) => {
          if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
            onClose();
          }
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("shop.inventoryAria", "Inventory")}
          tabIndex={-1}
          className="pointer-events-auto flex h-full w-full max-w-sm flex-col border-l border-border bg-surface shadow-popover animate-slide-in-right"
        >
          <header className="flex items-center gap-3 border-b border-border px-5 py-3.5">
            <Icon name="package" size={18} className="shrink-0 text-text-muted" aria-hidden />
            <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-text-primary">
              {t("shop.inventoryTitle", "Inventory")}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
              aria-label={t("common.close", "Close")}
            >
              <Icon name="close" size={20} aria-hidden />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        </div>
      </div>
    </Portal>
  );
}
