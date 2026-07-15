import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, cn } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLessonKeyboard } from "@/features/lesson/hooks/useLessonKeyboard";
import type { EsVerbEntry } from "@/features/languages/es/conjugationTables";
import type { GridQuestion } from "./gridSession";

/**
 * One grid-cell MCQ. Owns the per-question lifecycle — REMOUNT PER QUESTION
 * (key={index}); internal state resets by construction. Modeled on the ja
 * trainer's DrillQuestionCard (centered word block, tall option tiles,
 * keyboard 1–4 / Enter, permanently-reserved feedback slot so options never
 * move on submit) minus the kanji/cheat-sheet machinery ES doesn't need.
 */
export function GridDrillCard({
  question,
  onResult,
  onNext,
}: {
  question: GridQuestion;
  /** Called once when the learner answers — correctness plus the picked option
   *  (the board strikes wrong picks through under the corrected form). */
  onResult: (correct: boolean, picked: string) => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const answer = (opt: string) => {
    if (showResult) return;
    setSelectedAnswer(opt);
    setShowResult(true);
    onResult(opt === question.correct, opt);
  };

  useLessonKeyboard({
    onNumber: (n) => {
      if (!showResult && n >= 1 && n <= question.options.length) {
        answer(question.options[n - 1]);
      }
    },
    onEnter: () => {
      if (showResult) onNext();
    },
  });

  const correct = selectedAnswer === question.correct;

  return (
    <Card padding="lg" className="flex flex-col">
      {/* Prompt block: class chip, lemma, meaning, target cell pills. */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <GroupChip group={question.group} />
        <p lang="es" className="break-words text-4xl font-bold leading-snug text-text-primary">
          {question.lemma}
        </p>
        <p className="text-sm text-text-muted">{question.meaning}</p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
          <span
            lang="es"
            className="rounded-full bg-accent-muted px-2.5 py-0.5 text-sm font-bold text-accent"
          >
            {question.personLabel}
          </span>
          <span
            lang="es"
            className="rounded-full bg-surface-muted px-2.5 py-0.5 text-sm font-semibold text-text-secondary"
          >
            {question.tenseLabel}
          </span>
        </div>
      </div>

      {/* Answer tiles — tall targets carry the card's height. */}
      <div className="mx-auto mt-6 flex w-full max-w-sm flex-1 flex-col gap-3">
        {question.options.map((opt, i) => {
          const isCorrect = opt === question.correct;
          const isSelected = opt === selectedAnswer;
          let stateClass = "";
          if (showResult) {
            if (isCorrect) {
              stateClass =
                "border-green-500 bg-green-50 text-green-800 dark:bg-green-500/15 dark:text-green-300";
            } else if (isSelected) {
              stateClass =
                "border-red-500 bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-300";
            } else {
              stateClass = "border-border bg-surface text-text-secondary opacity-40";
            }
          } else {
            stateClass =
              "border-border bg-surface text-text-primary hover:border-accent active:translate-y-[2px]";
          }
          return (
            <button
              key={opt + i}
              type="button"
              onClick={() => answer(opt)}
              disabled={showResult}
              className={cn(
                "flex min-h-[60px] flex-1 items-center justify-center rounded-xl border-2 px-4 py-3 text-center transition md:min-h-[68px]",
                stateClass,
              )}
            >
              <span lang="es" className="text-xl font-semibold leading-snug">
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback slot is permanently reserved (lesson UI stability rule:
          options must not move on submit). */}
      <div className="mx-auto mt-4 flex min-h-[96px] w-full max-w-sm flex-col justify-center">
        {!showResult && (
          <p className="hidden text-center text-xs text-text-muted sm:block">
            {t("practice.conjugationGrid.kbdHint", {
              defaultValue: "Press 1–4 to answer · Enter to continue",
            })}
          </p>
        )}
        {showResult && (
          <>
            {correct ? (
              <p className="text-center text-sm font-semibold text-accent">
                <Icon name="check" size={16} className="mr-1 inline" />
                {t("practice.conjugationGrid.correct", { defaultValue: "Correct!" })}
              </p>
            ) : (
              <p className="text-center text-sm text-destructive">
                <Icon name="close" size={16} className="mr-1 inline" />
                {t("practice.conjugationGrid.answerWas", { defaultValue: "Answer:" })}{" "}
                <span lang="es" className="font-semibold">
                  {question.correct}
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={onNext}
              className="mt-3 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-on-accent transition hover:bg-accent-hover active:translate-y-[2px]"
            >
              {t("practice.conjugationGrid.next", { defaultValue: "Next →" })}
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

/** Conjugation-class chip — irregulars stand out amber, like the ja trainer's
 *  WordClassChip, so learners absorb WHICH verbs don't follow the pattern. */
export function GroupChip({ group }: { group: EsVerbEntry["group"] }) {
  const { t } = useTranslation();
  const LABELS: Record<EsVerbEntry["group"], string> = {
    ar: t("practice.conjugationGrid.classAr", { defaultValue: "-ar verb" }),
    er: t("practice.conjugationGrid.classEr", { defaultValue: "-er verb" }),
    ir: t("practice.conjugationGrid.classIr", { defaultValue: "-ir verb" }),
    irregular: t("practice.conjugationGrid.classIrregular", {
      defaultValue: "Irregular verb",
    }),
  };
  const irregular = group === "irregular";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        irregular
          ? "border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          : "border-border bg-surface-muted text-text-secondary",
      )}
    >
      {irregular && <Icon name="sparkles" size={12} aria-hidden />}
      {LABELS[group]}
    </span>
  );
}
