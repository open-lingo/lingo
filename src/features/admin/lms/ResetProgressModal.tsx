/**
 * ResetProgressModal — wipes lesson rollups + resets XP / streak / lingots
 * for a single user. Type-to-confirm gate. Backed by DELETE /admin/lms/{user_id}.
 */
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { inputClassName } from "@/shared/components/ui/formStyles";

type Props = {
  open: boolean;
  username: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
};

export function ResetProgressModal({ open, username, onClose, onConfirm, isPending }: Props) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (open) setConfirmText("");
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset progress — are you sure?"
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={isPending || confirmText !== "reset"}
          >
            {isPending ? "Resetting…" : "Reset all progress"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">
            This will permanently:
          </p>
          <ul className="text-sm text-red-700 dark:text-red-400 mt-1 list-disc list-inside space-y-0.5">
            <li>Delete all lesson completion records for @{username}</li>
            <li>Reset XP, level, streak, and lingots to zero</li>
            <li>Clear their last active date</li>
          </ul>
          <p className="text-sm text-red-800 dark:text-red-300 mt-2 font-medium">
            This cannot be undone.
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted block mb-1">
            Type{" "}
            <code className="font-mono bg-surface-muted px-1 rounded">reset</code> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="reset"
            className={inputClassName}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ResetProgressModal;
