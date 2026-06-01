import { useState } from "react";
import { ModalBase } from "@/shared/components/ModalBase";
import { Button } from "@/shared/components/ui/Button";

interface Props {
  targetUsername: string;
  targetDisplayName: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}

/**
 * Confirmation modal before an admin starts impersonating.
 *
 * Why a dedicated modal (not ConfirmModal): the spec requires an
 * "I understand" checkbox that must be checked before the primary
 * button enables, so admins can't muscle-memory through it.
 */
export function ImpersonateConfirmModal({
  targetUsername,
  targetDisplayName,
  onConfirm,
  onCancel,
  busy,
}: Props) {
  const [acknowledged, setAcknowledged] = useState(false);

  const name = targetDisplayName || targetUsername;

  return (
    <ModalBase
      onClose={onCancel}
      title="Act as user"
      maxWidth="max-w-md"
    >
      <div className="px-6 py-4 space-y-4">
        <p className="text-sm text-text-secondary">
          You will be acting as{" "}
          <span className="font-semibold text-text-primary">
            @{targetUsername}
          </span>
          {name !== targetUsername ? ` (${name})` : null}.
        </p>
        <ul className="list-disc pl-5 text-xs text-text-muted space-y-1">
          <li>
            Every action you take while impersonating is audit-logged with
            your admin id.
          </li>
          <li>
            Lessons completed, XP earned, and streak updates land on the
            target user's record — not yours.
          </li>
          <li>
            A persistent banner stays at the top of every page until you
            click Stop.
          </li>
        </ul>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            disabled={busy}
            data-testid="impersonate-ack"
            className="mt-0.5"
          />
          <span className="text-text-secondary">
            I understand and want to act as this user.
          </span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={!acknowledged || busy}
            data-testid="impersonate-start"
          >
            {busy ? "Starting…" : "Start impersonating"}
          </Button>
        </div>
      </div>
    </ModalBase>
  );
}
