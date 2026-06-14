import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sheet } from "@/shared/components/ui";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import type { ConceptRollup } from "@/shared/api/progress";

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

type Props = {
  open: boolean;
  onClose: () => void;
  label: string;
  rollup: ConceptRollup | null;
  /** Where "Practice this" sends the learner (e.g. flashcards review). */
  practiceTo: string;
};

/**
 * Contextual drill-in for a single concept — the "good on context" modal
 * pattern harvested from the dashboard's BaseModal, as a right-edge Sheet.
 * Shows mastery history without leaving the Journey page, and offers a jump
 * straight into practice for the concept.
 */
export function ConceptDrillSheet({ open, onClose, label, rollup, practiceTo }: Props) {
  const { t } = useTranslation();
  const total = rollup ? rollup.correctCount + rollup.incorrectCount : 0;
  const accuracy = total > 0 ? Math.round((rollup!.correctCount / total) * 100) : 0;
  const recent = rollup?.recentResults ?? [];

  return (
    <Sheet open={open} onClose={onClose} side="right" title={label}>
      {rollup ? (
        <div className="space-y-5">
          {/* Recent results strip — the at-a-glance momentum read */}
          <div>
            <p className="text-xs uppercase tracking-wider text-text-muted">
              {t("journey.drill.recent", "Recent results")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recent.length === 0 ? (
                <span className="text-sm text-text-muted">
                  {t("journey.drill.noRecent", "No recent reviews")}
                </span>
              ) : (
                recent.map((ok, i) => (
                  <span
                    key={i}
                    className="h-5 w-5 rounded-[4px]"
                    style={{
                      backgroundColor: ok ? "var(--color-success)" : "var(--color-error)",
                    }}
                    title={ok ? t("journey.drill.correct", "Correct") : t("journey.drill.wrong", "Missed")}
                    aria-label={ok ? "correct" : "missed"}
                  />
                ))
              )}
            </div>
          </div>

          {/* Stat rows */}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Stat label={t("journey.drill.accuracy", "Accuracy")} value={`${accuracy}%`} />
            <Stat label={t("journey.drill.encounters", "Encounters")} value={String(rollup.encounters)} />
            <Stat label={t("journey.drill.firstSeen", "First seen")} value={fmt(rollup.firstSeenAt)} />
            <Stat label={t("journey.drill.lastCorrect", "Last correct")} value={fmt(rollup.lastCorrectAt)} />
          </dl>

          <Link
            to={practiceTo}
            onClick={onClose}
            className={composeButtonClasses({ variant: "primary", className: "w-full" })}
          >
            {t("journey.drill.practice", "Practice this")}
          </Link>
        </div>
      ) : (
        <p className="text-sm text-text-muted">{t("journey.drill.missing", "No data for this concept.")}</p>
      )}
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-muted bg-surface-muted px-3 py-2">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-text-primary">{value}</dd>
    </div>
  );
}
