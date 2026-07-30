import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SymbolIntroStep } from "../../types";
import { Icon } from "@/shared/components/Icon";
import { ContinueButton } from "../ContinueButton";
import { useTheme } from "@/shared/contexts/ThemeContext";
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
  /** Replay runs skip the watch-the-strokes Continue lock — the learner
   *  has already completed this lesson at least once. */
  skipAnimationGate?: boolean;
};

const INTRO_CANVAS_MAX = 340;
const INTRO_STROKE_PX = 18;

/** Square canvas side, clamped to 36% of the viewport height so the
 *  romaji pill + Continue stay on-screen on short laptop viewports. */
function introCanvasSize(): number {
  if (typeof window === "undefined") return INTRO_CANVAS_MAX;
  return Math.min(INTRO_CANVAS_MAX, Math.round(window.innerHeight * 0.36));
}

export function SymbolIntroStepView({
  step,
  onComplete,
  onContinue,
  skipAnimationGate = false,
}: Props) {
  const { t } = useTranslation();
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

  // Gate on whether a RECORDING EXISTS, not on which script this is.
  //
  // This used to be `scriptId === "hiragana" || "katakana"`, which excluded
  // hangul by construction — so Korean fell through to the legacy alphabet-CDN
  // path, where `payload.audioKey` is null for every KO symbol step. The result
  // was total silence with no network request at all (Spencer, 2026-07-29).
  // The manifest does carry ko: clips for the vowels, so asking the resolver
  // fixes Korean and stays correct for any script added later.
  const hasTtsClip = Boolean(getTtsUrl(payload.symbol));
  useAutoPlayJaAudio(
    hasTtsClip ? payload.symbol : undefined,
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
  // for system-font fallback rendering, and on replay runs.
  const continueReady = skipAnimationGate || !showAnimated || animationSeen;

  useLessonKeyboard({
    onEnter: handleContinue,
    enabled: continueReady,
  });

  function handlePlay() {
    // Replay both: audio + stroke animation, so the learner gets the
    // same paired experience as the initial mount.
    setReplayKey((k) => k + 1);
    if (hasTtsClip) {
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
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
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
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_2px_0_0_rgb(var(--color-accent-hover))]">
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
      {/* Content block is `flex-1` + centered, so the glyph sits in the
       *  middle of the space above Continue instead of clinging to the top
       *  with a dead gap below (Spencer 2026-06-13 desktop dead-space fix).
       *  Continue stays bottom-anchored as the last flex child. */}
      <div className="mt-auto pt-6">
        <ContinueButton
          onClick={handleContinue}
          disabled={!continueReady}
          label={continueReady ? undefined : t("alphabet.watchStrokes", "Watch the strokes…")}
        />
      </div>
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
  // Sized once per mount — resizing mid-animation is rare and resets the
  // canvas anyway, so it isn't worth a ResizeObserver here.
  const [size] = useState(introCanvasSize);

  // Theme tokens so the stroke render matches Light/Dark/AMOLED (and custom
  // themes) automatically. Read once per theme change via context — NOT
  // inside the per-frame draw effect below, which reruns every rAF tick
  // (~60fps) and would otherwise force a style recalc every frame.
  const { activeTokens } = useTheme();
  const { completedColor, fadedColor, activeColor } = useMemo(
    () => ({
      completedColor: activeTokens.colors.textPrimary,
      fadedColor: activeTokens.colors.textMuted,
      activeColor: activeTokens.colors.accent,
    }),
    [activeTokens],
  );

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
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.globalAlpha = 0.22;
    renderStrokesProgressive(
      ctx,
      glyph,
      size,
      size,
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
      size,
      size,
      frame,
      {
        lineWidth: INTRO_STROKE_PX,
        completedColor,
        activeColor,
      },
    );
  }, [glyph, animation.frame, size, completedColor, fadedColor, activeColor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="rounded-lg"
      style={{ width: size, height: size }}
    />
  );
}
