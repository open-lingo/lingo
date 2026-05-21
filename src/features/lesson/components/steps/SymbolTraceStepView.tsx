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
import { playLocalAudio } from "@/shared/audio/volume";
import { getTtsUrl, playJaAudio } from "@/shared/japanese/tts";

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
  // Locked during fadeAndClear so a fast double-click can't re-pass on
  // the still-visible stroke data from the previous attempt.
  const [checkLocked, setCheckLocked] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  // Tracks whether the user has drawn anything on the current attempt so the
  // Clear button can hide until it's useful. Reset when we wipe the canvas.
  const [hasStrokes, setHasStrokes] = useState(false);
  const [reference, setReference] = useState<SymbolReference>(() =>
    getSystemFontReferenceFor(step.payload.symbol),
  );
  /** Skip surfaces after this many failed attempts on the current letter. */
  const SKIP_AFTER_FAILS = 2;
  /** Fade-out duration for user strokes on Check. Short enough that fast
   *  users don't sit waiting, long enough to read as a clear "your stroke
   *  is gone" affordance. Check is locked for this window. */
  const FADE_MS = 450;
  /** Brief mid-attempt celebration window. Shorter than the final-pass
   *  CELEBRATE_MS — this one shouldn't gate the user, just warm up the
   *  transition to the next attempt. */
  const INTER_ATTEMPT_CELEBRATE_MS = 900;
  const multiAttempt = step.minCorrectAttempts > 1;

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

  const handleClear = useCallback(() => {
    // Wipe without scoring — testers asked for a fast reset for misstrokes.
    // Not a fail: failCount is untouched, attempt progress is preserved.
    canvasRef.current?.clear();
    setHasStrokes(false);
    setFeedback(null);
    logAlphabetEvent("trace_clear", {
      symbol: step.payload.symbol,
      scriptId: step.payload.scriptId ?? null,
      correctCount,
    });
  }, [step.payload.symbol, step.payload.scriptId, correctCount]);

  const handlePlay = useCallback(() => {
    if (!step.payload.audioKey) return;
    playLocalAudio(getAlphabetAudioUrl(step.payload.audioKey));
  }, [step.payload.audioKey]);

  const handleCheck = useCallback(() => {
    if (checkLocked) return;
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
        // Reinforce the visual ↔ sound link on success. Play the kana's
        // TTS right as the user sees their pass — pairs the motor memory
        // of writing it with the sound. Only on success (failure already
        // shows the "try again" feedback; piling audio on top of a miss
        // muddies the feedback signal).
        const isJaKana =
          step.payload.scriptId === "hiragana" ||
          step.payload.scriptId === "katakana";
        if (isJaKana && getTtsUrl(step.payload.symbol)) {
          playJaAudio(step.payload.symbol);
        } else if (step.payload.audioKey) {
          playLocalAudio(getAlphabetAudioUrl(step.payload.audioKey));
        }
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
          // Inter-attempt celebration — testers reported a mechanical feel
          // between pass 1 and pass 2 with zero acknowledgement of the win.
          setFeedback(null);
          setCelebrationText(
            t("alphabet.celebrate.oneMoreTime", "Nice! One more time."),
          );
          setCelebrating(true);
          canvasRef.current?.fadeAndClear(FADE_MS);
          setCheckLocked(true);
          window.setTimeout(() => {
            setCheckLocked(false);
            setCelebrating(false);
          }, INTER_ATTEMPT_CELEBRATE_MS);
          setHasStrokes(false);
        }
        return;
      }
    }
    setFeedback("try");
    setFailCount((n) => n + 1);
    canvasRef.current?.fadeAndClear(FADE_MS);
    setHasStrokes(false);
    setCheckLocked(true);
    window.setTimeout(() => setCheckLocked(false), FADE_MS);
  }, [
    t,
    reference,
    step.payload.symbol,
    step.payload.scriptId,
    step.minCorrectAttempts,
    step.id,
    onComplete,
    correctCount,
    checkLocked,
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
          <span className="font-japanese ml-1 text-2xl font-bold text-accent">
            {step.payload.symbol}
          </span>
          {step.payload.romanization && (
            // Romaji riding next to the kana — kana + sound + motor act
            // get encoded together, not in three separate moments.
            <span className="ml-2 text-base font-semibold tracking-wide text-text-secondary">
              {step.payload.romanization}
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
          aria-label="Play sound"
        >
          <Icon name="volume" size={14} /> {t("alphabet.play", "Play")}
        </button>
        {hasStrokeOrder && step.showGuide && (
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
        <div className="flex items-center gap-2">
          {multiAttempt && (
            <span
              className="text-sm font-semibold text-text-secondary"
              aria-live="polite"
            >
              {t("alphabet.attemptOf", {
                current: Math.min(correctCount + 1, step.minCorrectAttempts),
                total: step.minCorrectAttempts,
                defaultValue: "Attempt {{current}} of {{total}}",
              })}
            </span>
          )}
          <ProgressDots
            filled={correctCount}
            total={step.minCorrectAttempts}
            showCount={!multiAttempt}
            orientation="horizontal"
            ariaLabel={t("alphabet.progressAria", {
              count: correctCount,
              total: step.minCorrectAttempts,
              defaultValue: "{{count}} of {{total}} correct",
            })}
          />
        </div>
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
            onStrokeStart={() => setHasStrokes(true)}
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
            {lastScore !== null &&
              ` — ${Math.round(lastScore * 100)}%`}
          </span>
        )}
        {feedback === "try" && (
          <span className="text-warning">
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
            disabled={checkLocked}
            label={t("alphabet.check", "Check")}
          />
          {hasStrokes && !checkLocked && (
            <button
              type="button"
              onClick={handleClear}
              className="motion-safe:animate-fade-up inline-flex items-center justify-center gap-1.5 self-center text-sm font-medium text-text-muted underline decoration-dotted underline-offset-4 transition hover:text-text-primary"
              aria-label={t("alphabet.clearCanvas", "Clear canvas")}
            >
              <Icon name="refresh" size={14} />
              {t("alphabet.clear", "Clear")}
            </button>
          )}
          {failCount >= SKIP_AFTER_FAILS && (
            <button
              type="button"
              onClick={handleSkip}
              className="motion-safe:animate-fade-up self-center text-sm font-medium text-text-muted underline decoration-dotted underline-offset-4 transition hover:text-text-primary"
            >
              {t("alphabet.skipLetter", "Skip this letter")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
