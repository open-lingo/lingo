import { type ReactNode } from "react";
import { Modal, type ModalSize } from "./Modal";
import { Button } from "./Button";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Either a string description or arbitrary content. */
  description?: ReactNode;
  /** Primary action label. */
  confirmLabel: string;
  /** Cancel action label. */
  cancelLabel: string;
  onConfirm: () => void;
  /** Use the danger variant for the primary action. */
  danger?: boolean;
  /** Disable the confirm button (e.g. while submitting). */
  confirmDisabled?: boolean;
  /** Loading-state label for the confirm button. */
  confirmBusyLabel?: string;
  /** Confirm button shows the busy label and is disabled. */
  busy?: boolean;
  size?: ModalSize;
};

/**
 * Dialog primitive — confirmation modal with title, description, confirm + cancel.
 *
 * Mobile behavior: inherits Modal's bottom-sheet behavior on < sm viewports.
 *
 * For destructive actions, pass `danger` to switch the primary button to the
 * danger variant. For richer / branched flows, use {@link Modal} directly.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  danger,
  confirmDisabled,
  confirmBusyLabel,
  busy,
  size = "md",
}: DialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={confirmDisabled || busy}
          >
            {busy && confirmBusyLabel ? confirmBusyLabel : confirmLabel}
          </Button>
        </>
      }
    >
      {typeof description === "string" ? (
        <p className="text-sm text-text-secondary">{description}</p>
      ) : (
        description
      )}
    </Modal>
  );
}

/**
 * AlertDialog — same shape as Dialog, but the cancel button is omitted. Use
 * when there's nothing for the user to decline (e.g. "Session expired").
 */
export type AlertDialogProps = Omit<DialogProps, "cancelLabel" | "onConfirm"> & {
  /** Primary action; defaults to closing. */
  onConfirm?: () => void;
};

export function AlertDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
  danger,
  size = "md",
}: AlertDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm ?? onClose}>
          {confirmLabel}
        </Button>
      }
    >
      {typeof description === "string" ? (
        <p className="text-sm text-text-secondary">{description}</p>
      ) : (
        description
      )}
    </Modal>
  );
}
