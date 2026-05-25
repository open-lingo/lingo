import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useCourseLevel } from "./useCourseLevel";
import type { ReadingPassage } from "./data/ja-reading-passages";
import { getReadingPassages } from "./data/practiceDataLoader";
import { recordPracticeResult } from "./practiceStats";

type FuriganaMode = "hover" | "always" | "never";

export function ReadingPracticePage() {
  const { t } = useTranslation();
  const courseLevel = useCourseLevel();
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  const isJapanese = langId === "ja";

  const allPassages = useMemo(() => getReadingPassages(langId), [langId]);
  const minLevel = allPassages.length > 0 ? Math.min(...allPassages.map((p) => p.level)) : 1;

  const [furiganaMode, setFuriganaMode] = useState<FuriganaMode>("hover");
  const [maxModule, setMaxModule] = useState<number>(Math.max(courseLevel, minLevel));
  const [currentPassageIdx, setCurrentPassageIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const availablePassages = useMemo(
    () => allPassages.filter((p) => p.level <= maxModule),
    [allPassages, maxModule],
  );

  const passage = availablePassages[currentPassageIdx] as ReadingPassage | undefined;
  const question = passage?.questions[currentQuestionIdx];

  const handleAnswer = (optionId: string) => {
    if (showResult || !question || !passage) return;
    setSelectedAnswer(optionId);
    setShowResult(true);
    const isCorrect = optionId === question.correctOptionId;
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    recordPracticeResult("reading", `${passage.id}:${question.id}`, isCorrect);
  };

  const handleNext = () => {
    if (!passage) return;
    setSelectedAnswer(null);
    setShowResult(false);

    if (currentQuestionIdx < passage.questions.length - 1) {
      setCurrentQuestionIdx((i) => i + 1);
    } else if (currentPassageIdx < availablePassages.length - 1) {
      setCurrentPassageIdx((i) => i + 1);
      setCurrentQuestionIdx(0);
    } else {
      setCurrentPassageIdx(0);
      setCurrentQuestionIdx(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!question) return;
    if (showResult && e.key === "Enter") {
      handleNext();
      return;
    }
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= question.options.length && !showResult) {
      handleAnswer(question.options[num - 1].id);
    }
  };

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={-1}>
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t("practice.reading.title", { defaultValue: "Reading Practice" })}
        </h1>
        <p className="text-sm text-text-secondary">
          {t("practice.reading.subtitle", {
            defaultValue: "Short passages with comprehension questions",
          })}
        </p>
      </div>

      {/* Controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            Level
            <select
              value={maxModule}
              onChange={(e) => {
                setMaxModule(Number(e.target.value));
                setCurrentPassageIdx(0);
                setCurrentQuestionIdx(0);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              {Array.from({ length: Math.max(1, courseLevel - (minLevel - 1)) }, (_, i) => i + minLevel).map((m) => (
                <option key={m} value={m}>
                  Up to M{m}
                </option>
              ))}
            </select>
          </label>

          {isJapanese && (
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              Furigana
              <select
                value={furiganaMode}
                onChange={(e) => setFuriganaMode(e.target.value as FuriganaMode)}
                className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
              >
                <option value="always">Always show</option>
                <option value="hover">Show on hover</option>
                <option value="never">Hidden</option>
              </select>
            </label>
          )}
        </div>
      </Card>

      {passage ? (
        <>
          {/* Passage card */}
          <Card padding="lg">
            {passage.contextHint && (
              <p className="mb-2 text-xs font-medium text-text-muted">{passage.contextHint}</p>
            )}
            <div className="whitespace-pre-line text-lg leading-relaxed text-text-primary">
              {passage.passage}
            </div>
          </Card>

          {/* Question */}
          {question && (
            <Card padding="lg">
              <p className="mb-3 text-sm font-medium text-text-primary">
                Q{currentQuestionIdx + 1}: {question.prompt}
              </p>
              <div className="space-y-2">
                {question.options.map((opt, i) => {
                  const isCorrect = opt.id === question.correctOptionId;
                  const isSelected = opt.id === selectedAnswer;
                  let cls = "w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition";
                  if (showResult) {
                    if (isCorrect) {
                      cls += " border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300";
                    } else if (isSelected) {
                      cls += " border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300";
                    } else {
                      cls += " border-border bg-surface text-text-secondary opacity-50";
                    }
                  } else {
                    cls += " border-border bg-surface text-text-primary hover:border-accent hover:bg-surface-muted";
                  }
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleAnswer(opt.id)}
                      disabled={showResult}
                      className={cls}
                    >
                      <span className="mr-2 text-xs text-text-muted">{i + 1}</span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>

              {showResult && (
                <div className="mt-4">
                  {selectedAnswer === question.correctOptionId ? (
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      <Icon name="check" size={16} className="mr-1 inline" />
                      Correct!
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <Icon name="close" size={16} className="mr-1 inline" />
                      {question.explanation || "Try again next time!"}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleNext}
                    className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                  >
                    {currentQuestionIdx < passage.questions.length - 1
                      ? "Next question →"
                      : "Next passage →"}
                  </button>
                </div>
              )}
            </Card>
          )}
        </>
      ) : (
        <Card padding="lg" className="text-center">
          <p className="text-text-muted">No passages available at this level yet.</p>
        </Card>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2">
        <span className="text-sm text-text-secondary">
          Score: {score.correct}/{score.total}
        </span>
        <span className="text-xs text-text-muted">
          Passage {currentPassageIdx + 1}/{availablePassages.length}
        </span>
      </div>
    </div>
  );
}
