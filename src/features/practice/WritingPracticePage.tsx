import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useCourseLevel } from "./useCourseLevel";
import type { SpeakingPrompt } from "./data/ja-speaking-prompts";
import { getSpeakingPrompts, getTtsLang } from "./data/practiceDataLoader";
import { normalizeTypedAnswer } from "./data/drillUtils";
import { playJaAudio } from "@/shared/tts";
import { recordPracticeResult } from "./practiceStats";
import {
  romajaToHangul,
  koreanInputMatches,
} from "@/features/languages/ko/romanization/romajaToHangul";

/**
 * Type it — the minimal writing trainer for the Writing pillar. Shows a
 * phrase's meaning; the learner types it in the target script (IME input
 * is the writing practice). Audio replay unlocks after answering so it
 * can't leak the answer.
 */
export function WritingPracticePage() {
  const { t } = useTranslation();
  const courseLevel = useCourseLevel();
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  const ttsLang = getTtsLang(langId);
  const isKo = langId === "ko";

  const allPrompts = useMemo(() => getSpeakingPrompts(langId), [langId]);
  const minLevel =
    allPrompts.length > 0 ? Math.min(...allPrompts.map((p) => p.minModule)) : 1;

  const [maxModule, setMaxModule] = useState<number>(Math.max(courseLevel, minLevel));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState<null | boolean>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const prompts = useMemo(
    () => allPrompts.filter((p) => p.minModule <= maxModule),
    [allPrompts, maxModule],
  );

  const prompt = prompts[currentIdx] as SpeakingPrompt | undefined;

  const handlePlay = useCallback(() => {
    if (prompt) {
      void playJaAudio(prompt.targetPhrase, ttsLang);
    }
  }, [prompt, ttsLang]);

  // Korean: accept Hangul (IME) OR romaja typed on a plain keyboard. Every
  // other language keeps the exact normalized compare.
  const korePreview = isKo ? romajaToHangul(typed) : "";
  const showPreview = isKo && korePreview !== typed && /[가-힣]/.test(korePreview);

  const handleCheck = () => {
    if (!prompt || checked !== null || typed.trim() === "") return;
    const correct = isKo
      ? koreanInputMatches(typed, prompt.targetPhrase)
      : normalizeTypedAnswer(typed) === normalizeTypedAnswer(prompt.targetPhrase);
    setChecked(correct);
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    recordPracticeResult("writing", prompt.id, correct);
  };

  const handleNext = () => {
    setTyped("");
    setChecked(null);
    setCurrentIdx((i) => (i + 1) % Math.max(1, prompts.length));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t("practice.typeIt.title", { defaultValue: "Type It" })}
        </h1>
        <p className="text-sm text-text-secondary">
          {t("practice.typeIt.subtitle", {
            defaultValue: "See the meaning, type the phrase",
          })}
        </p>
      </div>

      {/* Controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            {t("practice.typeIt.level", { defaultValue: "Level" })}
            <select
              value={maxModule}
              onChange={(e) => {
                setMaxModule(Number(e.target.value));
                setCurrentIdx(0);
                setTyped("");
                setChecked(null);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              {Array.from(
                { length: Math.max(1, courseLevel - (minLevel - 1)) },
                (_, i) => i + minLevel,
              ).map((m) => (
                <option key={m} value={m}>
                  {t("practice.typeIt.upToModule", {
                    defaultValue: "Up to M{{module}}",
                    module: m,
                  })}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {/* Prompt card */}
      {prompt ? (
        <Card padding="lg" className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            {t("practice.typeIt.instruction", {
              defaultValue: "Type this in {{language}}:",
              language: language?.name ?? langId,
            })}
          </p>

          <p className="mt-4 text-2xl font-bold text-text-primary">{prompt.translation}</p>

          <form
            className="mx-auto mt-5 flex max-w-md items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleCheck();
            }}
          >
            <input
              type="text"
              lang={ttsLang}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={checked !== null}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={
                isKo
                  ? t("practice.typeIt.placeholderKo", {
                      defaultValue: "Type Korean or romanization…",
                    })
                  : t("practice.typeIt.placeholder", {
                      defaultValue: "Type your answer…",
                    })
              }
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-lg text-text-primary focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={checked !== null || typed.trim() === ""}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("practice.typeIt.check", { defaultValue: "Check" })}
            </button>
          </form>

          {/* Korean romaja → Hangul live preview: type "annyeong" on a plain
              keyboard, see 안녕. Keeps the raw input intact (IME-safe) and just
              mirrors the composed form so the learner can confirm it. */}
          {showPreview && checked === null && (
            <p className="mx-auto mt-3 max-w-md text-center text-sm text-text-secondary">
              <span className="mr-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                {t("practice.typeIt.hangul", { defaultValue: "Hangul" })}
              </span>
              <span lang="ko" className="text-lg font-semibold text-text-primary">
                {korePreview}
              </span>
            </p>
          )}
          {isKo && checked === null && (
            <p className="mx-auto mt-1 max-w-md text-center text-xs text-text-muted">
              {t("practice.typeIt.koHint", {
                defaultValue:
                  "No Korean keyboard? Just type it in English letters — it converts to Hangul.",
              })}
            </p>
          )}

          {checked !== null && (
            <div
              className={`mx-auto mt-4 max-w-md rounded-lg border p-3 ${
                checked
                  ? "border-success bg-success/10"
                  : "border-error bg-error/10"
              }`}
            >
              <p className="text-xs text-text-muted">
                {checked
                  ? t("practice.typeIt.correct", { defaultValue: "Correct!" })
                  : t("practice.typeIt.incorrect", { defaultValue: "Not quite — the answer was:" })}
              </p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <p className="text-xl font-bold text-text-primary">{prompt.targetPhrase}</p>
                <button
                  type="button"
                  onClick={handlePlay}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface transition hover:bg-surface-muted"
                  aria-label={t("practice.typeIt.playAria", { defaultValue: "Play audio" })}
                >
                  <Icon name="volume" size={16} className="text-accent" />
                </button>
              </div>
            </div>
          )}

          {checked !== null && (
            <div className="mt-4 flex items-center justify-center">
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent-hover"
              >
                {t("practice.typeIt.next", { defaultValue: "Next →" })}
              </button>
            </div>
          )}
        </Card>
      ) : (
        <Card padding="lg" className="text-center">
          <p className="text-text-muted">
            {t("practice.typeIt.empty", {
              defaultValue: "No prompts available at this level.",
            })}
          </p>
        </Card>
      )}

      {/* Score bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2">
        <span className="text-sm text-text-secondary">
          {t("practice.typeIt.progress", {
            defaultValue: "Progress: {{current}}/{{total}}",
            current: prompts.length ? currentIdx + 1 : 0,
            total: prompts.length,
          })}
        </span>
        <span className="text-sm text-text-secondary">
          {t("practice.typeIt.score", {
            defaultValue: "Score: {{correct}}/{{total}}",
            correct: score.correct,
            total: score.total,
          })}
        </span>
      </div>
    </div>
  );
}
