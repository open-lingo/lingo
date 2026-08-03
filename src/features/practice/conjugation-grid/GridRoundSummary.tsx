import { useTranslation } from "react-i18next";
import { Card, cn } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { GridQuestion } from "./gridSession";

/**
 * End-of-round summary: n/6 score plus the per-cell rundown (the finished
 * paradigm, marked). Practice-only by design — the ES course has no Track B
 * conjugation points yet, so nothing is scheduled for review.
 */
export function GridRoundSummary({
  questions,
  results,
  showLemma,
  onRetry,
  retryLabel,
  onBack,
}: {
  questions: GridQuestion[];
  results: boolean[];
  /** Mix rounds name each cell's verb. */
  showLemma: boolean;
  /** Same round again — new seed, fresh shuffle. */
  onRetry: () => void;
  retryLabel: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const total = results.length;
  const score = results.filter(Boolean).length;

  return (
    <Card padding="lg" className="space-y-5 text-center">
      <div>
        <h2 className="text-lg font-bold text-text-primary">
          {t("practice.conjugationGrid.summaryTitle", { defaultValue: "Round complete" })}
        </h2>
        <p className="mt-1 text-3xl font-bold text-accent">
          {t("practice.conjugationGrid.summaryScore", {
            defaultValue: "{{score}} / {{total}} correct",
            score,
            total,
          })}
        </p>
      </div>

      <div className="mx-auto max-w-sm space-y-1.5 text-left">
        {questions.map((q, i) => (
          <div
            key={`${q.verbId}:${q.person}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <span className="truncate text-text-secondary">
              {showLemma ? `${q.lemma} · ${q.personLabel}` : q.personLabel}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span lang="es" className="text-text-primary">
                {q.correct}
              </span>
              <Icon
                name={results[i] ? "check" : "close"}
                size={14}
                className={cn(
                  results[i] ? "text-success" : "text-error",
                )}
                aria-hidden
              />
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          {retryLabel}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
        >
          {t("practice.conjugationGrid.backToPicker", { defaultValue: "Choose another verb" })}
        </button>
      </div>
    </Card>
  );
}
