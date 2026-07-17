import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import type { ConjTrainerQuestion } from "@/shared/conjugation/types";

/** 2.5 → "2½", 3 → "3" — halves come from cheat-sheet peeks. */
function fmtCredit(n: number): string {
  return Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`;
}

/**
 * End-of-drill summary, shared by the per-type and combined sessions. Results
 * are per-question credit (1 / 0.5 peeked / 0); the score line surfaces halves
 * explicitly so a peeked session reads honestly ("6 + 2½ / 10").
 */
export function SessionSummary({
  questions,
  results,
  practiceOnly = false,
  onAgain,
  againLabel,
  backTo,
}: {
  questions: ConjTrainerQuestion[];
  results: number[];
  /** v1.5 learn-ahead: the session drilled ahead of the learner's path and
   *  wrote no SRS — noted quietly under the score. */
  practiceOnly?: boolean;
  onAgain: () => void;
  againLabel: string;
  backTo: string;
}) {
  const { t } = useTranslation();

  const total = results.length;
  const score = results.reduce((acc, r) => acc + r, 0);
  const halves = results.filter((r) => r > 0 && r < 1).length;

  const perForm = useMemo(() => {
    const map = new Map<string, { score: number; total: number }>();
    questions.forEach((q, i) => {
      const entry = map.get(q.formLabel) ?? { score: 0, total: 0 };
      entry.total += 1;
      entry.score += results[i] ?? 0;
      map.set(q.formLabel, entry);
    });
    return [...map.entries()];
  }, [questions, results]);

  return (
    <Card padding="lg" className="space-y-5 text-center">
      <div>
        <h2 className="text-lg font-bold text-text-primary">
          {t("practice.conjugation.summaryTitle", { defaultValue: "Session complete" })}
        </h2>
        <p className="mt-1 text-3xl font-extrabold text-accent">
          {t("practice.conjugation.summaryScore", {
            defaultValue: "{{correct}} / {{total}} correct",
            correct: fmtCredit(score),
            total,
          })}
        </p>
        {halves > 0 && (
          <p className="mt-1 text-xs text-text-muted">
            {t("practice.conjugation.summaryHalves", {
              defaultValue: "½ marks are cheat-sheet peeks",
            })}
          </p>
        )}
        {practiceOnly && (
          <p className="mt-1 text-xs text-text-muted">
            {t("practice.conjugation.summaryPracticeOnly", {
              defaultValue:
                "Practice only — ahead of your path, so nothing was scheduled for review.",
            })}
          </p>
        )}
      </div>

      <div className="mx-auto max-w-sm text-left">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t("practice.conjugation.perFormBreakdown", { defaultValue: "By form" })}
        </p>
        <div className="space-y-1.5">
          {perForm.map(([label, stat]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="text-text-secondary">{label}</span>
              <span className="font-medium text-text-primary">
                {fmtCredit(stat.score)}/{stat.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onAgain}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          {againLabel}
        </button>
        <Link
          to={backTo}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
        >
          {t("practice.conjugation.backToTrainer", { defaultValue: "Back to trainer" })}
        </Link>
      </div>
    </Card>
  );
}
