import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useCourseLevel } from "./useCourseLevel";
import type { SpeakingPrompt } from "./data/ja-speaking-prompts";
import { getSpeakingPrompts, getTtsLang } from "./data/practiceDataLoader";
import { buildListeningOptions } from "./data/drillUtils";
import { playJaAudio } from "@/shared/tts";
import { recordPracticeResult } from "./practiceStats";

/**
 * Listen & choose — the minimal listening trainer for the Listening pillar.
 * Plays TTS for a phrase from the speaking-prompt pool; the learner picks
 * its meaning from four options. Reuses the existing per-language prompt
 * data and TTS bank — no new content surface.
 */
export function ListeningPracticePage() {
  const { t } = useTranslation();
  const courseLevel = useCourseLevel();
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  const ttsLang = getTtsLang(langId);

  const allPrompts = useMemo(() => getSpeakingPrompts(langId), [langId]);
  const minLevel =
    allPrompts.length > 0 ? Math.min(...allPrompts.map((p) => p.minModule)) : 1;

  const [maxModule, setMaxModule] = useState<number>(Math.max(courseLevel, minLevel));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const prompts = useMemo(
    () => allPrompts.filter((p) => p.minModule <= maxModule),
    [allPrompts, maxModule],
  );

  const prompt = prompts[currentIdx] as SpeakingPrompt | undefined;
  const options = useMemo(
    () => (prompt ? buildListeningOptions(prompts, currentIdx) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerate per question
    [prompts, currentIdx],
  );

  const handlePlay = useCallback(() => {
    if (prompt) {
      void playJaAudio(prompt.targetPhrase, ttsLang);
    }
  }, [prompt, ttsLang]);

  const handleChoose = (option: string) => {
    if (!prompt || selected !== null) return;
    setSelected(option);
    const correct = option === prompt.translation;
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    recordPracticeResult("listening", prompt.id, correct);
  };

  const handleNext = () => {
    setSelected(null);
    setCurrentIdx((i) => (i + 1) % Math.max(1, prompts.length));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t("practice.listenChoose.title", { defaultValue: "Listen & Choose" })}
        </h1>
        <p className="text-sm text-text-secondary">
          {t("practice.listenChoose.subtitle", {
            defaultValue: "Hear a phrase, then pick its meaning",
          })}
        </p>
      </div>

      {/* Controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            {t("practice.listenChoose.level", { defaultValue: "Level" })}
            <select
              value={maxModule}
              onChange={(e) => {
                setMaxModule(Number(e.target.value));
                setCurrentIdx(0);
                setSelected(null);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              {Array.from(
                { length: Math.max(1, courseLevel - (minLevel - 1)) },
                (_, i) => i + minLevel,
              ).map((m) => (
                <option key={m} value={m}>
                  {t("practice.listenChoose.upToModule", {
                    defaultValue: "Up to M{{module}}",
                    module: m,
                  })}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {/* Question card */}
      {prompt ? (
        <Card padding="lg" className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            {t("practice.listenChoose.instruction", {
              defaultValue: "Tap play, then choose what you heard:",
            })}
          </p>

          <div className="mt-5 flex items-center justify-center">
            <button
              type="button"
              onClick={handlePlay}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-hover"
              aria-label={t("practice.listenChoose.playAria", { defaultValue: "Play audio" })}
            >
              <Icon name="volume" size={24} />
            </button>
          </div>

          {selected !== null && (
            <p className="mt-4 text-2xl font-bold text-text-primary">{prompt.targetPhrase}</p>
          )}

          <div className="mx-auto mt-5 grid max-w-md gap-2 sm:grid-cols-2">
            {options.map((option) => {
              const isCorrect = option === prompt.translation;
              const isPicked = option === selected;
              const revealed = selected !== null;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChoose(option)}
                  disabled={revealed}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                    revealed && isCorrect
                      ? "border-green-500 bg-green-500/10 text-text-primary"
                      : revealed && isPicked
                        ? "border-red-500 bg-red-500/10 text-text-primary"
                        : revealed
                          ? "border-border bg-surface text-text-muted"
                          : "border-border bg-surface text-text-primary hover:border-accent hover:bg-surface-muted"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="mt-4 flex items-center justify-center">
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
              >
                {t("practice.listenChoose.next", { defaultValue: "Next →" })}
              </button>
            </div>
          )}
        </Card>
      ) : (
        <Card padding="lg" className="text-center">
          <p className="text-text-muted">
            {t("practice.listenChoose.empty", {
              defaultValue: "No prompts available at this level.",
            })}
          </p>
        </Card>
      )}

      {/* Score bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2">
        <span className="text-sm text-text-secondary">
          {t("practice.listenChoose.progress", {
            defaultValue: "Progress: {{current}}/{{total}}",
            current: prompts.length ? currentIdx + 1 : 0,
            total: prompts.length,
          })}
        </span>
        <span className="text-sm text-text-secondary">
          {t("practice.listenChoose.score", {
            defaultValue: "Score: {{correct}}/{{total}}",
            correct: score.correct,
            total: score.total,
          })}
        </span>
      </div>
    </div>
  );
}
