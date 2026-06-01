import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useCourseLevel } from "./useCourseLevel";
import {
  KANJI_CATEGORIES,
  getKanjiUpToModule,
  type KanjiEntry,
  type KanjiCategory,
} from "./data/ja-n5-kanji";
import { playJaAudio } from "@/shared/tts";
import { recordPracticeResult, pickWeighted } from "./practiceStats";

type KanjiMode = "kanji-meaning" | "meaning-kanji" | "kanji-reading";

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type Question = {
  kanji: KanjiEntry;
  prompt: string;
  correct: string;
  options: string[];
  mode: KanjiMode;
};

function generateQuestion(
  pool: KanjiEntry[],
  mode: KanjiMode,
  allKanji: KanjiEntry[],
): Question | null {
  if (pool.length < 2) return null;
  const kanji = pickWeighted(pool, (k) => k.character, "kanji");
  const distractorPool = allKanji.filter(
    (k) => k.character !== kanji.character && k.category === kanji.category,
  );
  const fallbackPool = allKanji.filter((k) => k.character !== kanji.character);
  const dPool = distractorPool.length >= 3 ? distractorPool : fallbackPool;

  if (mode === "kanji-meaning") {
    const correct = kanji.meaning[0];
    const distractors = shuffle(dPool)
      .slice(0, 3)
      .map((k) => k.meaning[0]);
    return {
      kanji,
      prompt: kanji.character,
      correct,
      options: shuffle([correct, ...distractors.filter((d) => d !== correct)]).slice(0, 4),
      mode,
    };
  }

  if (mode === "meaning-kanji") {
    const correct = kanji.character;
    const distractors = shuffle(dPool)
      .slice(0, 3)
      .map((k) => k.character);
    return {
      kanji,
      prompt: kanji.meaning[0],
      correct,
      options: shuffle([correct, ...distractors.filter((d) => d !== correct)]).slice(0, 4),
      mode,
    };
  }

  // kanji-reading
  const readings = [...kanji.kunyomi, ...kanji.onyomi];
  const correct = readings[0] ?? kanji.onyomi[0] ?? "?";
  const otherReadings = shuffle(dPool)
    .slice(0, 3)
    .map((k) => [...k.kunyomi, ...k.onyomi][0] ?? "?");
  return {
    kanji,
    prompt: kanji.character,
    correct,
    options: shuffle([correct, ...otherReadings.filter((d) => d !== correct)]).slice(0, 4),
    mode,
  };
}

export function KanjiPracticePage() {
  const { t } = useTranslation();
  const courseLevel = useCourseLevel();

  const [mode, setMode] = useState<KanjiMode>("kanji-meaning");
  const [maxModule, setMaxModule] = useState<number>(Math.max(courseLevel, 3));
  const [categoryFilter, setCategoryFilter] = useState<KanjiCategory | "all">("all");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0 });

  const allAvailable = useMemo(() => getKanjiUpToModule(maxModule), [maxModule]);
  const pool = useMemo(
    () => (categoryFilter === "all" ? allAvailable : allAvailable.filter((k) => k.category === categoryFilter)),
    [allAvailable, categoryFilter],
  );

  const [question, setQuestion] = useState<Question | null>(() =>
    generateQuestion(pool, mode, allAvailable),
  );

  const nextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setQuestion(generateQuestion(pool, mode, allAvailable));
  }, [pool, mode, allAvailable]);

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
    recordPracticeResult("kanji", `${question.kanji.character}:${question.mode}`, isCorrect);
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

  const modeLabel = {
    "kanji-meaning": "Kanji → Meaning",
    "meaning-kanji": "Meaning → Kanji",
    "kanji-reading": "Kanji → Reading",
  };

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={-1}>
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t("practice.kanji.title", { defaultValue: "N5 Kanji Practice" })}
        </h1>
        <p className="text-sm text-text-secondary">
          {t("practice.kanji.subtitle", {
            defaultValue: "Recognize kanji characters, meanings, and readings",
          })}
        </p>
      </div>

      {/* Controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            Mode
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as KanjiMode);
                setQuestion(null);
                setTimeout(nextQuestion, 0);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              <option value="kanji-meaning">Kanji → Meaning</option>
              <option value="meaning-kanji">Meaning → Kanji</option>
              <option value="kanji-reading">Kanji → Reading</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            Set
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as KanjiCategory | "all");
                setQuestion(null);
                setTimeout(nextQuestion, 0);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              <option value="all">All ({allAvailable.length})</option>
              {KANJI_CATEGORIES.map((cat) => {
                const count = allAvailable.filter((k) => k.category === cat.id).length;
                if (count === 0) return null;
                return (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({count})
                  </option>
                );
              })}
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
              {Array.from({ length: Math.max(1, courseLevel - 2) }, (_, i) => i + 3).map((m) => (
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
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            {modeLabel[question.mode]}
          </p>

          {question.mode === "meaning-kanji" ? (
            <p className="mt-3 text-2xl font-bold text-text-primary">
              &ldquo;{question.prompt}&rdquo;
            </p>
          ) : (
            <p className="mt-3 text-6xl font-bold text-text-primary">{question.prompt}</p>
          )}

          {question.mode !== "meaning-kanji" && (
            <p className="mt-2 text-xs text-text-muted">
              {question.mode === "kanji-meaning" ? "What does this mean?" : "How is this read?"}
            </p>
          )}

          <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-2">
            {question.options.map((opt, i) => {
              const isCorrect = opt === question.correct;
              const isSelected = opt === selectedAnswer;
              let cls = "rounded-lg border px-4 py-3 font-medium transition";
              const isKanjiOption = question.mode === "meaning-kanji";
              cls += isKanjiOption ? " text-2xl" : " text-sm";
              if (showResult) {
                if (isCorrect) {
                  cls += " border-green-500 bg-green-50 text-green-800";
                } else if (isSelected && !isCorrect) {
                  cls += " border-red-500 bg-red-50 text-red-800";
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
                  <span className="mr-1 text-xs text-text-muted">{i + 1}</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Reveal after answer */}
          {showResult && (
            <div className="mt-5 space-y-3">
              {selectedAnswer === question.correct ? (
                <p className="text-sm font-semibold text-accent">
                  <Icon name="check" size={16} className="mr-1 inline" />
                  Correct!
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  <Icon name="close" size={16} className="mr-1 inline" />
                  Answer: {question.correct}
                </p>
              )}

              {/* Kanji detail reveal */}
              <div className="mx-auto max-w-xs rounded-lg border border-border bg-surface-muted p-3 text-left text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{question.kanji.character}</span>
                  <div>
                    <p className="font-medium text-text-primary">
                      {question.kanji.meaning.join(", ")}
                    </p>
                    {question.kanji.onyomi.length > 0 && (
                      <p className="text-text-muted">
                        On: {question.kanji.onyomi.join("・")}
                      </p>
                    )}
                    {question.kanji.kunyomi.length > 0 && (
                      <p className="text-text-muted">
                        Kun: {question.kanji.kunyomi.join("・")}
                      </p>
                    )}
                    <p className="text-text-muted">{question.kanji.strokeCount} strokes</p>
                  </div>
                </div>
                {question.kanji.anchorVocab.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {question.kanji.anchorVocab.slice(0, 3).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => playJaAudio(v)}
                        className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-0.5 text-[11px] text-accent hover:bg-accent-muted"
                      >
                        <Icon name="volume" size={10} />
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={nextQuestion}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Next →
              </button>
            </div>
          )}
        </Card>
      ) : (
        <Card padding="lg" className="text-center">
          <p className="text-text-muted">
            {pool.length === 0
              ? "No kanji available for this set at your current level."
              : "Loading..."}
          </p>
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
