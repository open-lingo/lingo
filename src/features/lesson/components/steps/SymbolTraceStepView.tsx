import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SymbolTraceStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { DrawingCanvas, type DrawingCanvasHandle } from "../DrawingCanvas";
import { compareDrawingToSymbol } from "@/features/practice/alphabet/drawingComparison";
import { logAlphabetEvent } from "@/features/practice/alphabet/alphabetAnalytics";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { ProgressDots } from "../ProgressDots";
import { useCanvasSize } from "../useCanvasSize";
import { Icon } from "@/shared/components/Icon";
import { autoPlayAlphabetAudio, getAlphabetAudioUrl } from "@/shared/audio/alphabetAudio";

/** No horizontal reservation needed — dots now sit in the controls row. */
const SIDE_DOTS_RESERVED_PX = 0;
import {
  getReferenceFor,
  getSystemFontReferenceFor,
  useStrokeAnimation,
  type SymbolReference,
} from "@/shared/glyphs";

type Props = {
  step: SymbolTraceStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/** Celebration window between final pass and Continue button. */
const CELEBRATE_MS = 1100;

export function SymbolTraceStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [correctCount, setCorrectCount] = useState(
    step.initialCorrectCount ?? 0,
  );
  const [feedback, setFeedback] = useState<"good" | "try" | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [done, setDone] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const [reference, setReference] = useState<SymbolReference>(() =>
    getSystemFontReferenceFor(step.payload.symbol),
  );
  /** Skip surfaces after this many failed attempts on the current letter. */
  const SKIP_AFTER_FAILS = 2;
  /** Fade-out duration for user strokes on Check. */
  const FADE_MS = 750;

  const hasStrokeOrder = Boolean(step.payload.hasStrokeOrder && reference.glyph);
  const animation = useStrokeAnimation(
    hasStrokeOrder ? reference.glyph : null,
  );
  const { wrapperRef: canvasWrapperRef, width: canvasW, height: canvasH } =
    useCanvasSize({ reservedHorizontalPx: SIDE_DOTS_RESERVED_PX });

  const passed = correctCount >= step.minCorrectAttempts;

  useEffect(() => {
    autoPlayAlphabetAudio(step.payload.audioKey, `trace-${step.id}`);
  }, [step.payload.audioKey, step.id]);

  useEffect(() => {
    let alive = true;
    getReferenceFor(step.payload.scriptId, step.payload.symbol).then((ref) => {
      if (alive) setReference(ref);
    });
    return () => {
      alive = false;
    };
  }, [step.payload.scriptId, step.payload.symbol]);

  const handlePlay = useCallback(() => {
    if (!step.payload.audioKey) return;
    const audio = new Audio(getAlphabetAudioUrl(step.payload.audioKey));
    audio.play().catch(() => {});
  }, [step.payload.audioKey]);

  const handleCheck = useCallback(() => {
    setFeedback(null);
    const canvas = canvasRef.current?.getCanvas();
    const strokes = canvasRef.current?.getStrokes() ?? [];
    if (canvas) {
      const result = compareDrawingToSymbol(canvas, reference, {
        debugLabel: step.payload.symbol,
      });
      setLastScore(result.score);
      logAlphabetEvent("trace_attempt", {
        mode: "trace",
        symbol: step.payload.symbol,
        scriptId: step.payload.scriptId ?? null,
        pass: result.pass,
        score: result.score,
        userStrokePixels: result.userStrokePixels,
        canvasSize: { w: canvas.width, h: canvas.height },
        strokes,
        hasSvgReference: reference.glyph !== null,
      });
      if (result.pass) {
        const next = correctCount + 1;
        setCorrectCount(next);
        // Persist partial trace progress on EVERY pass, not just final. The
        // parent's handler increments the saved traceCount so dropping mid
        // trace step doesn't lose the pass on resume.
        onComplete(step.id, true);
        if (next >= step.minCorrectAttempts) {
          // Final pass — celebrate, then reveal Continue. Leave the user's
          // last drawing on the canvas so they can see what they accomplished
          // (instead of staring at a wiped board).
          setFeedback(null);
          setCelebrationText(pickCelebrationText(t));
          setCelebrating(true);
          window.setTimeout(() => {
            setCelebrating(false);
            setDone(true);
          }, CELEBRATE_MS);
        } else {
          setFeedback("good");
          canvasRef.current?.fadeAndClear(FADE_MS);
        }
        return;
      }
    }
    setFeedback("try");
    setFailCount((n) => n + 1);
    canvasRef.current?.fadeAndClear(FADE_MS);
  }, [
    t,
    reference,
    step.payload.symbol,
    step.payload.scriptId,
    step.minCorrectAttempts,
    step.id,
    onComplete,
    correctCount,
  ]);

  const handleSkip = useCallback(() => {
    logAlphabetEvent("trace_skip", {
      symbol: step.payload.symbol,
      scriptId: step.payload.scriptId ?? null,
      failCount,
      lastScore,
    });
    onComplete(step.id, false);
    onContinue();
  }, [step.id, step.payload.symbol, step.payload.scriptId, failCount, lastScore, onComplete, onContinue]);

  const handleContinue = useCallback(() => {
    if (passed) onComplete(step.id, true);
    onContinue();
  }, [passed, step.id, onComplete, onContinue]);

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* Single controls row: task title (verb + emerald symbol), Play,
       *  Replay stroke order, then horizontal progress dots + count. */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <h2 className="mr-1 text-lg font-medium text-text-secondary">
          {t("alphabet.taskTrace", "Trace")}{" "}
          <span className="ml-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {step.payload.symbol}
          </span>
        </h2>
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          aria-label="Play sound"
        >
          <Icon name="play" size={14} /> {t("alphabet.play", "Play")}
        </button>
        {hasStrokeOrder && step.showGuide && (
          <button
            type="button"
            onClick={animation.play}
            disabled={animation.isPlaying}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            aria-label={t("alphabet.replayStrokeOrder", "Replay stroke order")}
          >
            <Icon name="play" size={14} />
            {t("alphabet.replayStrokeOrder", "Replay stroke order")}
          </button>
        )}
        <ProgressDots
          filled={correctCount}
          total={step.minCorrectAttempts}
          showCount
          orientation="horizontal"
          ariaLabel={t("alphabet.progressAria", {
            count: correctCount,
            total: step.minCorrectAttempts,
            defaultValue: "{{count}} of {{total}} correct",
          })}
        />
      </div>
      <div
        ref={canvasWrapperRef}
        className="flex w-full items-center justify-center"
      >
        <div className="relative">
          <DrawingCanvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            guideReference={step.showGuide && !animation.isPlaying ? reference : null}
            guideOpacity={step.showGuide ? 0.25 : undefined}
            strokeOrderGlyph={hasStrokeOrder ? reference.glyph : null}
            showStrokeNumbers={hasStrokeOrder && step.showGuide && !animation.isPlaying}
            animationFrame={animation.isPlaying ? animation.frame : null}
            aria-label={t("alphabet.drawHere", "Draw here")}
          />
          {celebrating && <CelebrationToast text={celebrationText} />}
        </div>
      </div>
      {/* Fixed-height slot so the column doesn't jump when feedback toggles. */}
      <p
        aria-live="polite"
        className="min-h-5 text-center text-sm font-medium leading-5"
      >
        {feedback === "good" && (
          <span className="text-emerald-600 dark:text-emerald-400">
            {t("alphabet.goodShape", "Good shape")}
            {lastScore !== null &&
              ` — ${Math.round(lastScore * 100)}%`}
          </span>
        )}
        {feedback === "try" && (
          <span className="text-amber-600 dark:text-amber-400">
            {t("alphabet.tryAgain", "Try again")}
            {lastScore !== null &&
              ` — ${Math.round(lastScore * 100)}%`}
          </span>
        )}
      </p>
      {/* Button slot: stays a constant height across all three phases so the
          lesson card doesn't shrink-then-grow during celebration. */}
      {done ? (
        <div className="motion-safe:animate-fade-up">
          <ContinueButton onClick={handleContinue} />
        </div>
      ) : celebrating ? (
        <div className="invisible" aria-hidden>
          <ContinueButton onClick={() => {}} />
        </div>
      ) : (
        <div className="flex flex-col items-stretch gap-2">
          <ContinueButton
            onClick={handleCheck}
            label={t("alphabet.check", "Check")}
          />
          {failCount >= SKIP_AFTER_FAILS && (
            <button
              type="button"
              onClick={handleSkip}
              className="motion-safe:animate-fade-up self-center text-sm font-medium text-gray-500 underline decoration-dotted underline-offset-4 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {t("alphabet.skipLetter", "Skip this letter")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
