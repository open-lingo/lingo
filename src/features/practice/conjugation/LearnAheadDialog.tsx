import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox, Modal } from "@/shared/components/ui";

/**
 * "Looking ahead?" confirmation for locked hub tiles (v1.5). Shown once per
 * press until the learner ticks "Don't ask again" (persisted — learnAhead.ts).
 * Straight adult copy: states what jumping ahead means (untaught grammar,
 * practice-only — no reviews scheduled) and lets them decide.
 *
 * Render it conditionally (`{prompt && <LearnAheadDialog …/>}`) — mounting
 * fresh per prompt resets the checkbox by construction.
 */
export function LearnAheadDialog({
  typeTitle,
  unlockModule,
  onConfirm,
  onClose,
}: {
  typeTitle: string;
  unlockModule: number;
  /** Continue anyway — `dontAskAgain` mirrors the checkbox. */
  onConfirm: (dontAskAgain: boolean) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [dontAsk, setDontAsk] = useState(false);

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={t("practice.conjugation.learnAhead.title", { defaultValue: "Looking ahead?" })}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
          >
            {t("practice.conjugation.learnAhead.cancel", { defaultValue: "Not yet" })}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(dontAsk)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            {t("practice.conjugation.learnAhead.confirm", { defaultValue: "Continue anyway" })}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          {t("practice.conjugation.learnAhead.body", {
            defaultValue:
              "Module {{module}} introduces {{title}} — you can jump in now, but the drill assumes grammar you haven't been shown yet. Ahead-of-path practice doesn't schedule reviews.",
            module: unlockModule,
            title: typeTitle,
          })}
        </p>
        <Checkbox
          checked={dontAsk}
          onChange={(e) => setDontAsk(e.target.checked)}
          label={t("practice.conjugation.learnAhead.dontAsk", {
            defaultValue: "Don't ask again",
          })}
        />
      </div>
    </Modal>
  );
}
