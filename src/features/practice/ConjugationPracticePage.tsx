import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useCourseLevel } from "./useCourseLevel";
import {
  CONJUGATION_FORM_LABELS,
  ADJ_FORM_LABELS,
  getVerbsUpToModule,
  getAdjsUpToModule,
  type VerbEntry,
  type AdjEntry,
  type ConjugationForm,
  type AdjForm,
} from "./data/ja-conjugation-tables";

type Category = "verbs" | "i-adj" | "na-adj";
type Mode = "mcq" | "type";

type SessionStats = {
  correct: number;
  total: number;
  streak: number;
};

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateVerbDistractors(
  correct: string,
  verb: VerbEntry,
  targetForm: ConjugationForm,
  pool: VerbEntry[],
): string[] {
  const distractors = new Set<string>();

  // Same verb, wrong form
  for (const [form, value] of Object.entries(verb.forms)) {
    if (form !== targetForm && value !== correct) {
      distractors.add(value);
    }
  }

  // Same form, different verb
  for (const other of pool) {
    if (other.id !== verb.id) {
      distractors.add(other.forms[targetForm]);
    }
  }

  distractors.delete(correct);
  return shuffle([...distractors]).slice(0, 3);
}

function generateAdjDistractors(
  correct: string,
  adj: AdjEntry,
  targetForm: AdjForm,
  pool: AdjEntry[],
): string[] {
  const distractors = new Set<string>();

  for (const [form, value] of Object.entries(adj.forms)) {
    if (form !== targetForm && value !== correct) {
      distractors.add(value);
    }
  }

  for (const other of pool) {
    if (other.id !== adj.id) {
      distractors.add(other.forms[targetForm]);
    }
  }

  distractors.delete(correct);
  return shuffle([...distractors]).slice(0, 3);
}

export function ConjugationPracticePage() {
  const { t } = useTranslation();
  const courseLevel = useCourseLevel();

  const [category, setCategory] = useState<Category>("verbs");
  const [_mode] = useState<Mode>("mcq");
  const [maxModule, setMaxModule] = useState<number>(courseLevel);
  const [selectedForms, setSelectedForms] = useState<Set<string>>(
    () => new Set(["masu", "nai", "te", "ta"]),
  );
  const [stats, setStats] = useState<SessionStats>({ correct: 0, total: 0, streak: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const verbs = useMemo(() => getVerbsUpToModule(maxModule), [maxModule]);
  const adjs = useMemo(() => getAdjsUpToModule(maxModule), [maxModule]);

  const filteredAdjs = useMemo(
    () => adjs.filter((a) => (category === "i-adj" ? a.type === "i-adj" : a.type === "na-adj")),
    [adjs, category],
  );

  const [question, setQuestion] = useState<{
    prompt: string;
    meaning: string;
    formLabel: string;
    correct: string;
    options: string[];
  } | null>(null);

  const generateQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);

    if (category === "verbs") {
      if (verbs.length === 0) return;
      const verb = verbs[Math.floor(Math.random() * verbs.length)];
      const forms = [...selectedForms].filter(
        (f) => f in verb.forms && f !== "dictionary",
      ) as ConjugationForm[];
      if (forms.length === 0) return;
      const targetForm = forms[Math.floor(Math.random() * forms.length)];
      const correct = verb.forms[targetForm];
      const distractors = generateVerbDistractors(correct, verb, targetForm, verbs);
      const options = shuffle([correct, ...distractors]);
      setQuestion({
        prompt: verb.dictionary,
        meaning: verb.meaning,
        formLabel: CONJUGATION_FORM_LABELS[targetForm],
        correct,
        options,
      });
    } else {
      const pool = filteredAdjs;
      if (pool.length === 0) return;
      const adj = pool[Math.floor(Math.random() * pool.length)];
      const adjForms = (["present", "negative", "past", "past-negative"] as AdjForm[]).filter(
        (f) => selectedForms.has(f),
      );
      if (adjForms.length === 0) return;
      const targetForm = adjForms[Math.floor(Math.random() * adjForms.length)];
      const correct = adj.forms[targetForm];
      const distractors = generateAdjDistractors(correct, adj, targetForm, pool);
      const options = shuffle([correct, ...distractors]);
      setQuestion({
        prompt: adj.dictionary,
        meaning: adj.meaning,
        formLabel: ADJ_FORM_LABELS[targetForm],
        correct,
        options,
      });
    }
  }, [category, verbs, filteredAdjs, selectedForms]);

  // Initialize first question
  useMemo(() => {
    if (!question) generateQuestion();
  }, []);

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    const isCorrect = answer === question?.correct;
    setStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      streak: isCorrect ? prev.streak + 1 : 0,
    }));
  };

  const handleNext = () => {
    generateQuestion();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!question) return;
    if (showResult && e.key === "Enter") {
      handleNext();
      return;
    }
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= question.options.length && !showResult) {
      handleAnswer(question.options[num - 1]);
    }
  };

  const verbFormKeys = Object.keys(CONJUGATION_FORM_LABELS).filter(
    (k) => k !== "dictionary",
  ) as ConjugationForm[];
  const adjFormKeys = Object.keys(ADJ_FORM_LABELS) as AdjForm[];
  const currentFormKeys = category === "verbs" ? verbFormKeys : adjFormKeys;
  const currentFormLabels = category === "verbs" ? CONJUGATION_FORM_LABELS : ADJ_FORM_LABELS;

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={-1}>
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t("practice.conjugation.title", { defaultValue: "Conjugation Practice" })}
        </h1>
        <p className="text-sm text-text-secondary">
          {t("practice.conjugation.subtitle", {
            defaultValue: "Drill verb and adjective forms",
          })}
        </p>
      </div>

      {/* Controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            Mode
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as Category);
                setQuestion(null);
                setTimeout(generateQuestion, 0);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              <option value="verbs">Verbs</option>
              <option value="i-adj">i-Adjectives</option>
              <option value="na-adj">na-Adjectives</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            Level
            <select
              value={maxModule}
              onChange={(e) => {
                setMaxModule(Number(e.target.value));
                setQuestion(null);
                setTimeout(generateQuestion, 0);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              {Array.from({ length: courseLevel - 6 }, (_, i) => i + 7).map((m) => (
                <option key={m} value={m}>
                  Up to M{m}
                </option>
              ))}
              {courseLevel < 7 && <option value={7}>Up to M7</option>}
            </select>
          </label>
        </div>

        {/* Form checkboxes */}
        <div className="mt-2 flex flex-wrap gap-2">
          {currentFormKeys.map((form) => (
            <label
              key={form}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
            >
              <input
                type="checkbox"
                checked={selectedForms.has(form)}
                onChange={(e) => {
                  const next = new Set(selectedForms);
                  if (e.target.checked) next.add(form);
                  else next.delete(form);
                  setSelectedForms(next);
                }}
                className="accent-accent"
              />
              {(currentFormLabels as Record<string, string>)[form]}
            </label>
          ))}
        </div>
      </Card>

      {/* Question card */}
      {question && (
        <Card padding="lg" className="text-center">
          <p className="text-3xl font-bold text-text-primary">{question.prompt}</p>
          <p className="mt-1 text-sm text-text-muted">{question.meaning}</p>
          <p className="mt-3 text-sm font-medium text-accent">
            → {question.formLabel}
          </p>

          <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2">
            {question.options.map((opt, i) => {
              const isCorrect = opt === question.correct;
              const isSelected = opt === selectedAnswer;
              let btnClass =
                "rounded-lg border px-4 py-3 text-sm font-medium transition";
              if (showResult) {
                if (isCorrect) {
                  btnClass += " border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300";
                } else if (isSelected && !isCorrect) {
                  btnClass += " border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300";
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
                  {opt}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="mt-4">
              {selectedAnswer === question.correct ? (
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  <Icon name="check" size={16} className="mr-1 inline" />
                  Correct!
                </p>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400">
                  <Icon name="close" size={16} className="mr-1 inline" />
                  Answer: {question.correct}
                </p>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Next →
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Stats bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2">
        <span className="text-sm text-text-secondary">
          Score: {stats.correct}/{stats.total}
          {stats.total > 0 && (
            <span className="ml-2 text-text-muted">
              ({Math.round((stats.correct / stats.total) * 100)}%)
            </span>
          )}
        </span>
        <span className="text-sm text-text-secondary">
          <Icon name="flame" size={14} className="mr-1 inline text-warning" />
          Streak: {stats.streak}
        </span>
      </div>
    </div>
  );
}
