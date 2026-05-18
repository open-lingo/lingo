import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SymbolProductionStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { DrawingCanvas, type DrawingCanvasHandle } from "../DrawingCanvas";
import { compareProductionDrawingToSymbol } from "@/features/practice/alphabet/drawingComparison";
import { logAlphabetEvent } from "@/features/practice/alphabet/alphabetAnalytics";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { ProgressDots } from "../ProgressDots";
import { useCanvasSize } from "../useCanvasSize";

/** Celebration window between final pass and Continue button. */
const CELEBRATE_MS = 1100;
/** No horizontal reservation needed — dots now sit in the controls row. */
const SIDE_DOTS_RESERVED_PX = 0;
import {
  autoPlayAlphabetAudio,
  getAlphabetAudioUrl,
} from "@/shared/audio/alphabetAudio";
import { playLocalAudio } from "@/shared/audio/volume";
import { Icon } from "@/shared/components/Icon";
import {
  getReferenceFor,
  getSystemFontReferenceFor,
  useStrokeAnimation,
  type SymbolReference,
} from "@/shared/glyphs";

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
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [reference, setReference] = useState<SymbolReference>(() =>
    getSystemFontReferenceFor(step.payload.symbol),
  );
  const { wrapperRef: canvasWrapperRef, width: canvasW, height: canvasH } =
    useCanvasSize({ reservedHorizontalPx: SIDE_DOTS_RESERVED_PX });

  const hasStrokeOrder = Boolean(step.payload.hasStrokeOrder && reference.glyph);
  const animation = useStrokeAnimation(
    hasStrokeOrder ? reference.glyph : null,
  );

  const passed = correctCount >= step.minCorrectAttempts;

  useEffect(() => {
    autoPlayAlphabetAudio(step.payload.audioKey, `production-${step.id}`);
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

  function handlePlay() {
    if (!step.payload.audioKey) return;
    playLocalAudio(getAlphabetAudioUrl(step.payload.audioKey));
  }

  const handleCheck = useCallback(() => {
    setFeedback(null);
    const canvas = canvasRef.current?.getCanvas();
    const strokes = canvasRef.current?.getStrokes() ?? [];
    if (canvas) {
      const result = compareProductionDrawingToSymbol(canvas, reference, {
        debugLabel: step.payload.symbol,
      });
      logAlphabetEvent("trace_attempt", {
        mode: "production",
        symbol: step.payload.symbol,
        scriptId: step.payload.scriptId ?? null,
        pass: result.pass,
        score: result.score,
        userStrokePixels: result.userStrokePixels,
        canvasSize: { w: canvas.width, h: canvas.height },
        strokes,
        hasSvgReference: reference.glyph !== null,
        failedAttempts,
      });
      if (result.pass) {
        const next = correctCount + 1;
        setCorrectCount(next);
        if (next >= step.minCorrectAttempts) {
          // Final pass — celebrate, then reveal Continue. Leave the user's
          // drawing on the canvas so they see what they accomplished.
          onComplete(step.id, true);
          setFeedback(null);
          setCelebrationText(pickCelebrationText(t));
          setCelebrating(true);
          window.setTimeout(() => {
            setCelebrating(false);
            setDone(true);
          }, CELEBRATE_MS);
        } else {
          setFeedback("good");
          canvasRef.current?.clear();
        }
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
    t,
    reference,
    step.payload.symbol,
    step.payload.scriptId,
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
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Romaji is the cue — never the kana itself — otherwise the prompt
         *  literally shows the answer the user is supposed to recall. */}
        <h2 className="mr-1 text-lg font-medium text-text-secondary">
          {t("alphabet.taskDrawSymbolFor", "Draw the symbol for")}{" "}
          <span className="ml-1 text-2xl font-bold text-accent">
            {step.payload.romanization}
          </span>
        </h2>
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
          aria-label="Play sound"
        >
          <Icon name="play" size={14} /> {t("alphabet.play", "Play")}
        </button>
        {hasStrokeOrder && (
          <button
            type="button"
            onClick={animation.play}
            disabled={animation.isPlaying}
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-accent hover:text-text-primary disabled:opacity-50"
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
            // Production is "from memory" — no faded template. Replay button +
            // numbered dots are the hint surface; handwriting accuracy isn't
            // the drill we gate progress on.
            guideReference={null}
            strokeOrderGlyph={hasStrokeOrder ? reference.glyph : null}
            showStrokeNumbers={hasStrokeOrder && !animation.isPlaying}
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
          <span className="text-accent">
            {t("alphabet.goodShape", "Good shape")}
          </span>
        )}
        {feedback === "try" && (
          <span className="text-warning">
            {t("alphabet.tryAgain", "Try again")}
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
        <ContinueButton
          onClick={handleCheck}
          label={t("alphabet.check", "Check")}
        />
      )}
    </div>
  );
}
