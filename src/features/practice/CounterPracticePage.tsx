import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useCourseLevel } from "./useCourseLevel";
import { getCountersUpToModule, type CounterDef } from "./data/ja-counters";
import { playJaAudio } from "@/shared/japanese/tts";

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type Question = {
  counter: CounterDef;
  number: number;
  correct: string;
  options: string[];
};

function generateQuestion(counters: CounterDef[]): Question | null {
  if (counters.length === 0) return null;
  const counter = counters[Math.floor(Math.random() * counters.length)];
  const reading = counter.readings[Math.floor(Math.random() * counter.readings.length)];

  const distractors = new Set<string>();

  for (const r of counter.readings) {
    if (r.reading !== reading.reading) distractors.add(r.reading);
  }

  for (const other of counters) {
    if (other.id === counter.id) continue;
    const sameNum = other.readings.find((r) => r.number === reading.number);
    if (sameNum) distractors.add(sameNum.reading);
  }

  distractors.delete(reading.reading);
  const picked = shuffle([...distractors]).slice(0, 3);
  const options = shuffle([reading.reading, ...picked]);

  return {
    counter,
    number: reading.number,
    correct: reading.reading,
    options,
  };
}

export function CounterPracticePage() {
  const { t } = useTranslation();
  const courseLevel = useCourseLevel();

  const [maxModule, setMaxModule] = useState<number>(Math.max(courseLevel, 5));
  const [selectedCounter, setSelectedCounter] = useState<string>("all");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0 });

  const counters = useMemo(() => getCountersUpToModule(maxModule), [maxModule]);

  const pool = useMemo(
    () => (selectedCounter === "all" ? counters : counters.filter((c) => c.id === selectedCounter)),
    [counters, selectedCounter],
  );

  const [question, setQuestion] = useState<Question | null>(() => generateQuestion(pool));

  const nextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setQuestion(generateQuestion(pool));
  }, [pool]);

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
    if (isCorrect) {
      playJaAudio(question.correct);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!question) return;
    if (showResult && e.key === "Enter") {
      nextQuestion();
      return;
    }
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= question.options.length && !showResult) {
      handleAnswer(question.options[num - 1]);
    }
  };

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={-1}>
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t("practice.counters.title", { defaultValue: "Counter Practice" })}
        </h1>
        <p className="text-sm text-text-secondary">
          {t("practice.counters.subtitle", {
            defaultValue: "Master irregular counter word readings",
          })}
        </p>
      </div>

      {/* Controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            Counter
            <select
              value={selectedCounter}
              onChange={(e) => {
                setSelectedCounter(e.target.value);
                setQuestion(null);
                setTimeout(nextQuestion, 0);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              <option value="all">All</option>
              {counters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.kanji} ({c.meaning})
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            Level
            <select
              value={maxModule}
              onChange={(e) => {
                setMaxModule(Number(e.target.value));
                setQuestion(null);
                setTimeout(nextQuestion, 0);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              {Array.from({ length: Math.max(1, courseLevel - 4) }, (_, i) => i + 5).map((m) => (
                <option key={m} value={m}>
                  Up to M{m}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {/* Question card */}
      {question ? (
        <Card padding="lg" className="text-center">
          <p className="text-4xl font-bold text-text-primary">
            {question.counter.kanji}
          </p>
          <p className="mt-1 text-sm text-text-muted">{question.counter.meaning}</p>
          <p className="mt-3 text-lg font-medium text-accent">
            {question.number} — How do you count this?
          </p>

          <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2">
            {question.options.map((opt, i) => {
              const isCorrect = opt === question.correct;
              const isSelected = opt === selectedAnswer;
              let cls = "rounded-lg border px-4 py-3 text-sm font-medium transition";
              if (showResult) {
                if (isCorrect) {
                  cls += " border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300";
                } else if (isSelected && !isCorrect) {
                  cls += " border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300";
                } else {
                  cls += " border-border bg-surface text-text-secondary opacity-50";
                }
              } else {
                cls += " border-border bg-surface text-text-primary hover:border-accent hover:bg-surface-muted";
              }
              return (
                <button
                  key={opt + i}
                  type="button"
                  onClick={() => handleAnswer(opt)}
                  disabled={showResult}
                  className={cls}
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
                onClick={nextQuestion}
                className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Next →
              </button>
            </div>
          )}
        </Card>
      ) : (
        <Card padding="lg" className="text-center">
          <p className="text-text-muted">No counters available at this level.</p>
        </Card>
      )}

      {/* Stats */}
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
