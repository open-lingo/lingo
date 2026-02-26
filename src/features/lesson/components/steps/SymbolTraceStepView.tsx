<<<<<<< HEAD
import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { SymbolTraceStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { DrawingCanvas, type DrawingCanvasHandle } from "../DrawingCanvas";
import { compareDrawingToSymbol } from "@/features/practice/alphabet/drawingComparison";

type Props = {
  step: SymbolTraceStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function SymbolTraceStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<"good" | "try" | null>(null);
  const [done, setDone] = useState(false);

  const passed = correctCount >= step.minCorrectAttempts;

  const handleCheck = useCallback(() => {
    setFeedback(null);
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      const result = compareDrawingToSymbol(canvas, step.payload.symbol);
      if (result.pass) {
        const next = correctCount + 1;
        setCorrectCount(next);
        setDone(next >= step.minCorrectAttempts);
        if (next >= step.minCorrectAttempts) onComplete(step.id, true);
        setFeedback("good");
        canvasRef.current?.clear();
        return;
      }
    }
    setFeedback("try");
    canvasRef.current?.clear();
  }, [step.payload.symbol, step.minCorrectAttempts, step.id, onComplete, correctCount]);

  const handleContinue = useCallback(() => {
    if (passed) onComplete(step.id, true);
    onContinue();
  }, [passed, step.id, onComplete, onContinue]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t("alphabet.traceWithAudio", "Draw over the template. Play the sound and say it aloud while you write.")}
      </p>
      <div className="flex justify-center">
        <button
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          aria-label="Play sound"
        >
          ▶ Play
        </button>
      </div>
      <div className="flex flex-col items-center gap-4">
        <DrawingCanvas
          ref={canvasRef}
          guideSymbol={step.showGuide ? step.payload.symbol : undefined}
          guideOpacity={step.showGuide ? 0.25 : undefined}
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
=======
import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { SymbolTraceStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { DrawingCanvas, type DrawingCanvasHandle } from "../DrawingCanvas";
import { compareDrawingToSymbol } from "@/features/practice/alphabet/drawingComparison";
import { Icon } from "@/shared/components/Icon";

type Props = {
  step: SymbolTraceStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function SymbolTraceStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<"good" | "try" | null>(null);
  const [done, setDone] = useState(false);

  const passed = correctCount >= step.minCorrectAttempts;

  const handleCheck = useCallback(() => {
    setFeedback(null);
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      const result = compareDrawingToSymbol(canvas, step.payload.symbol);
      if (result.pass) {
        const next = correctCount + 1;
        setCorrectCount(next);
        setDone(next >= step.minCorrectAttempts);
        if (next >= step.minCorrectAttempts) onComplete(step.id, true);
        setFeedback("good");
        canvasRef.current?.clear();
        return;
      }
    }
    setFeedback("try");
    canvasRef.current?.clear();
  }, [step.payload.symbol, step.minCorrectAttempts, step.id, onComplete, correctCount]);

  const handleContinue = useCallback(() => {
    if (passed) onComplete(step.id, true);
    onContinue();
  }, [passed, step.id, onComplete, onContinue]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t("alphabet.traceWithAudio", "Draw over the template. Play the sound and say it aloud while you write.")}
      </p>
      <div className="flex justify-center">
        <button
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          aria-label="Play sound"
        >
          <Icon name="play" size={14} className="mr-1 inline" /> Play
        </button>
      </div>
      <div className="flex flex-col items-center gap-4">
        <DrawingCanvas
          ref={canvasRef}
          guideSymbol={step.showGuide ? step.payload.symbol : undefined}
          guideOpacity={step.showGuide ? 0.25 : undefined}
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
>>>>>>> refs/remotes/origin/main
