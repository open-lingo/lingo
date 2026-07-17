import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { inputClassName } from "@/shared/components/ui/formStyles";
import { cn } from "@/shared/components/ui/cn";

/**
 * Award-XP dialog. Admin enters an amount + reason; the server endpoint
 * updates the user row + leaderboard. Amount validation + the mutation live
 * in the parent so the toast copy stays with the other admin actions.
 */
export function AwardXpModal({
  username,
  amount,
  reason,
  onAmountChange,
  onReasonChange,
  onSubmit,
  onClose,
  submitting,
}: {
  username: string;
  amount: string;
  reason: string;
  onAmountChange: (v: string) => void;
  onReasonChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="award-xp-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-card border border-border bg-surface p-5 shadow-xl"
      >
        <h2 id="award-xp-title" className="text-base font-semibold text-text-primary">
          {t("admin.awardXp.title", "Award XP")}
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          {t(
            "admin.awardXp.subtitle",
            "Adds XP to @{{name}}. Use a negative amount to subtract. Leaderboards update for opted-in users.",
            { name: username },
          )}
        </p>
        <label className="mt-4 block text-xs font-medium text-text-secondary">
          {t("admin.awardXp.amountLabel", "Amount")}
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            autoFocus
            disabled={submitting}
            className={cn("mt-1 w-full", inputClassName)}
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-text-secondary">
          {t("admin.awardXp.reasonLabel", "Reason")}
          <input
            type="text"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={t("admin.awardXp.reasonPlaceholder", "e.g. 'leaderboard test'")}
            disabled={submitting}
            maxLength={500}
            className={cn("mt-1 w-full", inputClassName)}
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {t("forum.cancel")}
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? t("common.loading") : t("admin.awardXp.submit", "Award")}
          </Button>
        </div>
      </form>
    </div>
  );
}
