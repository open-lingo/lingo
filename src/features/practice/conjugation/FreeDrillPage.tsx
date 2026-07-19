import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import type { ConjugationTrainerProvider, ConjFreeDrillQuestion } from "@/shared/conjugation/types";
import { useCourseLevel } from "../useCourseLevel";
import { useConjugation } from "./useConjugation";

type SessionStats = { correct: number; total: number; streak: number };

/**
 * Free drill — its own route (`practice/grammar/conjugation/free`). Provider-driven:
 * only languages that expose `provider.freeDrill` reach here (the hub hides the
 * Mix tile otherwise). Free play, weighted by the provider; writes no SRS.
 */
export function FreeDrillPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const conj = useConjugation();

  if (!conj?.freeDrill) {
    return <Navigate to={langPath("practice/grammar/conjugation")} replace />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          to={langPath("practice/grammar/conjugation")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-muted"
          aria-label={t("practice.conjugation.backToTrainer", { defaultValue: "Back to trainer" })}
        >
          <Icon name="arrowLeft" size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {t("practice.conjugation.freeDrillTitle", { defaultValue: "Free drill" })}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("practice.conjugation.freeDrillSub", {
              defaultValue: "Any forms, any pace — doesn't affect your review schedule.",
            })}
          </p>
        </div>
      </div>

      <FreeDrill conj={conj} />
    </div>
  );
}

function FreeDrill({ conj }: { conj: ConjugationTrainerProvider }) {
  const { t } = useTranslation();
  const free = conj.freeDrill!;
  const courseLevel = useCourseLevel();

  const [category, setCategory] = useState<string>(free.categories[0]?.id ?? "");
  const [maxModule, setMaxModule] = useState<number>(Math.max(courseLevel, free.minModule));
  const [selectedForms, setSelectedForms] = useState<Set<string>>(() => new Set(free.defaultForms));
  const [stats, setStats] = useState<SessionStats>({ correct: 0, total: 0, streak: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [question, setQuestion] = useState<ConjFreeDrillQuestion | null>(null);

  const formKeys = useMemo(() => free.formsFor(category), [free, category]);

  const generateQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setQuestion(free.buildQuestion(category, maxModule, selectedForms));
  }, [free, category, maxModule, selectedForms]);

  useMemo(() => {
    if (!question) generateQuestion();
  }, []);

  const handleAnswer = (answer: string) => {
    if (showResult || !question) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    const isCorrect = answer === question.correct;
    setStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      streak: isCorrect ? prev.streak + 1 : 0,
    }));
    free.recordResult(category, question.itemId, isCorrect);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!question) return;
    if (showResult && e.key === "Enter") {
      generateQuestion();
      return;
    }
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= question.options.length && !showResult) {
      handleAnswer(question.options[num - 1]);
    }
  };

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={-1}>
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            {t("practice.conjugation.freeMode", { defaultValue: "Mode" })}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setQuestion(null);
                setTimeout(generateQuestion, 0);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              {free.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            {t("practice.conjugation.freeLevel", { defaultValue: "Level" })}
            <select
              value={maxModule}
              onChange={(e) => {
                setMaxModule(Number(e.target.value));
                setQuestion(null);
                setTimeout(generateQuestion, 0);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              {Array.from(
                { length: Math.max(courseLevel - free.minModule + 1, 1) },
                (_, i) => i + free.minModule,
              ).map((m) => (
                <option key={m} value={m}>
                  {t("practice.conjugation.freeUpTo", { defaultValue: "Up to M{{module}}", module: m })}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {formKeys.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
            >
              <input
                type="checkbox"
                checked={selectedForms.has(key)}
                onChange={(e) => {
                  const next = new Set(selectedForms);
                  if (e.target.checked) next.add(key);
                  else next.delete(key);
                  setSelectedForms(next);
                }}
                className="accent-accent"
              />
              {label}
            </label>
          ))}
        </div>
      </Card>

      {question && (
        <Card padding="lg" className="text-center">
          <p className="text-3xl font-bold text-text-primary">{question.prompt}</p>
          <p className="mt-1 text-sm text-text-muted">{question.meaning}</p>
          <p className="mt-3 text-sm font-medium text-accent">→ {question.formLabel}</p>

          <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2">
            {question.options.map((opt, i) => {
              const isCorrect = opt === question.correct;
              const isSelected = opt === selectedAnswer;
              let btnClass = "rounded-lg border px-4 py-3 text-sm font-medium transition";
              if (showResult) {
                if (isCorrect) {
                  btnClass += " border-success bg-success/10 text-success";
                } else if (isSelected && !isCorrect) {
                  btnClass += " border-error bg-error/10 text-error";
                } else {
                  btnClass += " border-border bg-surface text-text-secondary opacity-50";
                }
              } else {
                btnClass +=
                  " border-border bg-surface text-text-primary hover:border-accent hover:bg-surface-muted";
              }
              return (
                <button
                  key={opt + i}
                  type="button"
                  onClick={() => handleAnswer(opt)}
                  disabled={showResult}
                  className={btnClass}
                >
                  <span className="mr-1.5 text-xs text-text-muted">{i + 1}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="mt-4">
              {selectedAnswer === question.correct ? (
                <p className="text-sm font-semibold text-accent">
                  <Icon name="check" size={16} className="mr-1 inline" />
                  {t("practice.conjugation.correct", { defaultValue: "Correct!" })}
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  <Icon name="close" size={16} className="mr-1 inline" />
                  {t("practice.conjugation.answerWas", { defaultValue: "Answer:" })}{" "}
                  <span>{question.correct}</span>
                </p>
              )}
              <button
                type="button"
                onClick={generateQuestion}
                className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
              >
                {t("practice.conjugation.next", { defaultValue: "Next →" })}
              </button>
            </div>
          )}
        </Card>
      )}

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2">
        <span className="text-sm text-text-secondary">
          {t("practice.conjugation.freeScore", {
            defaultValue: "Score: {{correct}}/{{total}}",
            correct: stats.correct,
            total: stats.total,
          })}
          {stats.total > 0 && (
            <span className="ml-2 text-text-muted">
              ({Math.round((stats.correct / stats.total) * 100)}%)
            </span>
          )}
        </span>
        <span className="text-sm text-text-secondary">
          <Icon name="flame" size={14} className="mr-1 inline text-warning" />
          {t("practice.conjugation.freeStreak", { defaultValue: "Streak: {{count}}", count: stats.streak })}
        </span>
      </div>
    </div>
  );
}
