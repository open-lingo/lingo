import { ModalBase } from "./ModalBase";
import { Button } from "@/shared/components/ui/Button";

export type ConfirmModalProps = {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Use danger styling for destructive actions */
  danger?: boolean;
};

/**
 * Confirmation dialog using ModalBase + shared Button primitives.
 */
export function ConfirmModal({
  title,
  message,
  cancelLabel,
  confirmLabel,
  onConfirm,
  onCancel,
  danger,
}: ConfirmModalProps) {
  return (
    <ModalBase onClose={onCancel} title={title} maxWidth="max-w-md">
      <div className="px-6 py-4">
        <p className="text-sm text-text-secondary">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </ModalBase>
  );
}
