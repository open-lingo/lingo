/**
 * AdjustAmountModal — generic "grant/retract" modal used for both XP and
 * lingot adjustments. Caller supplies the title + currency labels + reason
 * placeholder and gets back the parsed delta + reason on save. Empty reason
 * falls through as the "admin-lms" audit-log sentinel.
 */
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/components/ui/cn";
import { inputClassName } from "@/shared/components/ui/formStyles";

type Props = {
  open: boolean;
  title: string;
  currentLabel: string;
  currentValue: number;
  reasonPlaceholder: string;
  previewLabel: string;
  onClose: () => void;
  onSave: (amount: number, reason: string) => void;
  isPending: boolean;
};

export function AdjustAmountModal({
  open,
  title,
  currentLabel,
  currentValue,
  reasonPlaceholder,
  previewLabel,
  onClose,
  onSave,
  isPending,
}: Props) {
  const [amount, setAmount] = useState("0");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("0");
      setReason("");
    }
  }, [open]);

  const parsed = parseInt(amount, 10);
  const preview = isNaN(parsed) ? currentValue : Math.max(0, currentValue + parsed);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onSave(parsed, reason || "admin-lms")}
            disabled={isPending || isNaN(parsed) || parsed === 0}
          >
            {isPending ? "Applying…" : "Apply adjustment"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-card bg-surface-muted">
          <span className="text-sm text-text-muted">{currentLabel}</span>
          <span className="font-mono font-semibold">{currentValue.toLocaleString()}</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">
              Amount (positive = grant, negative = retract)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(inputClassName, "font-mono")}
            />
            {!isNaN(parsed) && parsed !== 0 && (
              <p className="text-xs text-text-muted mt-1">
                {previewLabel}{" "}
                <span className="font-mono font-semibold">{preview.toLocaleString()}</span>
                {parsed < 0 && preview === 0 && " (clamped to 0)"}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">
              Reason (for audit log)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              className={inputClassName}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default AdjustAmountModal;
