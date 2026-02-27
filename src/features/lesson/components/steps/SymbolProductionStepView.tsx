import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SymbolProductionStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { DrawingCanvas, type DrawingCanvasHandle } from "../DrawingCanvas";
import { compareProductionDrawingToSymbol } from "@/features/practice/alphabet/drawingComparison";
import {
  autoPlayAlphabetAudio,
  getAlphabetAudioUrl,
} from "@/shared/audio/alphabetAudio";
import { Icon } from "@/shared/components/Icon";

type Props = {
  step: SymbolProductionStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function SymbolProductionStepView({
  step,
  onComplete,
  onContinue,
}: Props) {
  const { t } = useTranslation();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<"good" | "try" | null>(null);
  const [done, setDone] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const passed = correctCount >= step.minCorrectAttempts;

  useEffect(() => {
    autoPlayAlphabetAudio(step.payload.audioKey, `production-${step.id}`);
  }, [step.payload.audioKey, step.id]);

  function handlePlay() {
    if (!step.payload.audioKey) return;
    const audio = new Audio(getAlphabetAudioUrl(step.payload.audioKey));
    audio.play().catch(() => {});
  }

  const handleCheck = useCallback(() => {
    setFeedback(null);
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      const result = compareProductionDrawingToSymbol(
        canvas,
        step.payload.symbol,
      );
      if (result.pass) {
        const next = correctCount + 1;
        setCorrectCount(next);
        if (next >= step.minCorrectAttempts) {
          setDone(true);
          onComplete(step.id, true);
        }
        setFeedback("good");
        canvasRef.current?.clear();
        return;
      }
    }
    const nextFailed = failedAttempts + 1;
    setFailedAttempts(nextFailed);
    if (nextFailed === 2) {
      // Mark this symbol as needing a review-round production attempt.
      onComplete(`prodReview-${step.payload.symbol}-0`, false);
    }
    setFeedback("try");
    canvasRef.current?.clear();
  }, [
    step.payload.symbol,
    step.minCorrectAttempts,
    step.id,
    onComplete,
    correctCount,
    failedAttempts,
  ]);

  const handleContinue = useCallback(() => {
    if (passed) onComplete(step.id, true);
    onContinue();
  }, [passed, step.id, onComplete, onContinue]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t(
          "alphabet.listenAndWrite",
          "Listen, then write the symbol from memory.",
        )}
      </p>
      <button
        type="button"
        onClick={handlePlay}
        className="mx-auto rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        aria-label="Play sound"
      >
        <Icon name="play" size={14} className="mr-1 inline" /> Play
      </button>
      <div className="flex flex-col items-center gap-4">
        <DrawingCanvas
          ref={canvasRef}
          guideSymbol={failedAttempts >= 2 ? step.payload.symbol : undefined}
          guideOpacity={0.25}
          aria-label={t("alphabet.drawHere", "Draw here")}
        />
        {feedback === "good" && (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {t("alphabet.goodShape", "Good shape")}
          </p>
        )}
        {feedback === "try" && (
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            {t("alphabet.tryAgain", "Try again")}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {correctCount} / {step.minCorrectAttempts}{" "}
          {t("alphabet.correctTraces", "correct")}
        </p>
      </div>
      {!done && (
        <ContinueButton
          onClick={handleCheck}
          label={t("alphabet.check", "Check")}
        />
      )}
      {done && <ContinueButton onClick={handleContinue} />}
    </div>
  );
}
