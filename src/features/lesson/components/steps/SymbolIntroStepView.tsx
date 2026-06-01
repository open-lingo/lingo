import { useCallback, useEffect, useRef, useState } from "react";
import type { SymbolIntroStep } from "../../types";
import { Icon } from "@/shared/components/Icon";
import { ContinueButton } from "../ContinueButton";
import {
  autoPlayAlphabetAudio,
  getAlphabetAudioUrl,
} from "@/shared/audio/alphabetAudio";
import { playLocalAudio } from "@/shared/audio/volume";
import {
  getTtsUrl,
  playJaAudio,
  useAutoPlayJaAudio,
} from "@/shared/tts";
import {
  getReferenceFor,
  getSystemFontReferenceFor,
  renderStrokesProgressive,
  useStrokeAnimation,
  type SymbolReference,
} from "@/shared/glyphs";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

type Props = {
  step: SymbolIntroStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

const INTRO_CANVAS_SIZE = 340;
const INTRO_STROKE_PX = 18;

export function SymbolIntroStepView({ step, onComplete, onContinue }: Props) {
  const { payload } = step;

  const handleContinue = useCallback(() => {
    onComplete(step.id, true);
    onContinue();
  }, [step.id, onComplete, onContinue]);
  const [reference, setReference] = useState<SymbolReference>(() =>
    getSystemFontReferenceFor(payload.symbol),
  );
  // Bumping this tells the SymbolAnimation child to reset + replay.
  // We can't call `useStrokeAnimation` here because the canvas + render
  // logic live in the child; passing a replay key is the simplest bridge.
  const [replayKey, setReplayKey] = useState(0);
  // Gate the Continue button until the stroke animation has played at
  // least once — keeps learners from clicking past the lesson's whole
  // point. Replays keep this true (they've seen it). For glyphs without
  // stroke data (system-font fallback), nothing to wait on — see the
  // showAnimated branch below.
  const [animationSeen, setAnimationSeen] = useState(false);

  // Korean alphabet audio path stays for non-JA scripts. JA kana audio
  // routes through the new manifest-driven TTS, auto-playing 500ms after
  // mount in parallel with the stroke animation.
  useEffect(() => {
    autoPlayAlphabetAudio(payload.audioKey, `intro-${step.id}`);
  }, [payload.audioKey, step.id]);

  const isJaKana =
    payload.scriptId === "hiragana" || payload.scriptId === "katakana";
  useAutoPlayJaAudio(
    isJaKana ? payload.symbol : undefined,
    `intro-tts-${step.id}`,
  );

  useEffect(() => {
    let alive = true;
    getReferenceFor(payload.scriptId, payload.symbol).then((ref) => {
      if (alive) setReference(ref);
    });
    return () => {
      alive = false;
    };
  }, [payload.scriptId, payload.symbol]);

  const showAnimated = Boolean(payload.hasStrokeOrder && reference.glyph);
  // No animation = nothing to wait on. Continue is enabled immediately
  // for system-font fallback rendering.
  const continueReady = !showAnimated || animationSeen;

  useLessonKeyboard({
    onEnter: handleContinue,
    enabled: continueReady,
  });

  function handlePlay() {
    // Replay both: audio + stroke animation, so the learner gets the
    // same paired experience as the initial mount.
    setReplayKey((k) => k + 1);
    if (isJaKana && getTtsUrl(payload.symbol)) {
      playJaAudio(payload.symbol);
      return;
    }
    if (!payload.audioKey) return;
    playLocalAudio(getAlphabetAudioUrl(payload.audioKey));
  }

  // Layout intent (image-1 critique):
  //  - Symbol fills the upper section; smaller top padding.
  //  - Romaji + Play merge into one inline pill ("a ▶ Play").
  //  - Hint / example / note stack tight underneath.
  //  - Continue stays at the page bottom slot anchored by flex-1 spacer.
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col items-center gap-4">
        {showAnimated ? (
          <SymbolAnimation
            reference={reference}
            replayKey={replayKey}
            onDone={() => setAnimationSeen(true)}
          />
        ) : (
          <span
            className="font-japanese text-[220px] font-bold leading-none text-text-primary"
            aria-hidden
          >
            {payload.symbol}
          </span>
        )}
        {/* Inline pill: romaji is the play affordance. One control, one
         *  pronunciation surface — easier to find, fewer competing buttons. */}
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex items-center gap-3 rounded-full border-[1.5px] border-border bg-surface pl-5 pr-3 py-2.5 text-2xl font-semibold tracking-wide text-text-primary shadow-[var(--shadow-card)] transition-colors hover:border-accent"
          aria-label={`Play pronunciation: ${payload.romanization || payload.symbol}`}
        >
          <span>{payload.romanization || payload.symbol}</span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_2px_0_0_var(--color-accent-hover)]">
            <Icon name="play" size={14} />
          </span>
        </button>
        {payload.hint && payload.hint !== payload.romanization && (
          <p className="text-base text-text-secondary">{payload.hint}</p>
        )}
        {payload.note && (
          <p className="text-sm text-text-muted">{payload.note}</p>
        )}
        {/* `payload.example` intentionally not rendered. Anchor words are
         *  introduced by their own teach steps a few beats later — showing
         *  the same word above Continue both crowds the layout and reveals
         *  vocab before the lesson teaches it. */}
      </div>
      {/* Spacer absorbs leftover vertical space so Continue anchors at the
       *  card's bottom regardless of which optional fields are populated. */}
      <div className="flex-1" />
      <ContinueButton onClick={handleContinue} disabled={!continueReady} />
    </div>
  );
}

/**
 * Auto-plays the stroke-order animation once on mount, then leaves the final
 * glyph drawn. Respects `prefers-reduced-motion` via the hook.
 */
function SymbolAnimation({
  reference,
  replayKey,
  onDone,
}: {
  reference: SymbolReference;
  replayKey: number;
  onDone?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glyph = reference.glyph;
  const animation = useStrokeAnimation(glyph, { autoPlay: true });

  // When parent bumps replayKey, reset + play the animation again.
  // Skip the initial 0 — autoPlay already handles first mount.
  useEffect(() => {
    if (replayKey === 0) return;
    animation.reset();
    animation.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey]);

  // Surface completion to the parent so it can unlock Continue. `isDone`
  // is also true in reduced-motion mode (hook snaps to final frame).
  useEffect(() => {
    if (animation.isDone && onDone) onDone();
  }, [animation.isDone, onDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !glyph) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = INTRO_CANVAS_SIZE * dpr;
    canvas.height = INTRO_CANVAS_SIZE * dpr;
    canvas.style.width = `${INTRO_CANVAS_SIZE}px`;
    canvas.style.height = `${INTRO_CANVAS_SIZE}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, INTRO_CANVAS_SIZE, INTRO_CANVAS_SIZE);

    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");
    const completedColor = isDark ? "#f3f4f6" : "#111827";
    const fadedColor = isDark ? "#9ca3af" : "#6b7280";

    ctx.save();
    ctx.globalAlpha = 0.22;
    renderStrokesProgressive(
      ctx,
      glyph,
      INTRO_CANVAS_SIZE,
      INTRO_CANVAS_SIZE,
      { strokeIndex: glyph.strokes.length, strokeProgress: 0 },
      {
        lineWidth: INTRO_STROKE_PX,
        completedColor: fadedColor,
      },
    );
    ctx.restore();

    const frame = animation.frame ?? {
      strokeIndex: glyph.strokes.length,
      strokeProgress: 0,
    };
    renderStrokesProgressive(
      ctx,
      glyph,
      INTRO_CANVAS_SIZE,
      INTRO_CANVAS_SIZE,
      frame,
      {
        lineWidth: INTRO_STROKE_PX,
        completedColor,
        activeColor: "#0ea5e9",
      },
    );
  }, [glyph, animation.frame]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="rounded-lg"
      style={{ width: INTRO_CANVAS_SIZE, height: INTRO_CANVAS_SIZE }}
    />
  );
}
