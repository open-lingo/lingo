import { useEffect, useRef, useState } from "react";
import type { SymbolIntroStep } from "../../types";
import { Icon } from "@/shared/components/Icon";
import { ContinueButton } from "../ContinueButton";
import {
  autoPlayAlphabetAudio,
  getAlphabetAudioUrl,
} from "@/shared/audio/alphabetAudio";
import {
  getTtsUrl,
  playJaAudio,
  useAutoPlayJaAudio,
} from "@/shared/japanese/tts";
import {
  getReferenceFor,
  getSystemFontReferenceFor,
  renderStrokesProgressive,
  useStrokeAnimation,
  type SymbolReference,
} from "@/shared/glyphs";

type Props = {
  step: SymbolIntroStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

const INTRO_CANVAS_SIZE = 340;
const INTRO_STROKE_PX = 18;

export function SymbolIntroStepView({ step, onComplete, onContinue }: Props) {
  const { payload } = step;

  const handleContinue = () => {
    onComplete(step.id, true);
    onContinue();
  };
  const [reference, setReference] = useState<SymbolReference>(() =>
    getSystemFontReferenceFor(payload.symbol),
  );

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

  function handlePlay() {
    // Prefer the JA TTS resolver for kana; fall back to the legacy alphabet
    // CDN for non-JA scripts that ship with an audioKey.
    if (isJaKana && getTtsUrl(payload.symbol)) {
      playJaAudio(payload.symbol);
      return;
    }
    if (!payload.audioKey) return;
    const audio = new Audio(getAlphabetAudioUrl(payload.audioKey));
    audio.play().catch(() => {});
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
          <SymbolAnimation reference={reference} />
        ) : (
          <span
            className="text-[220px] font-bold leading-none text-text-primary"
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
          className="inline-flex items-center gap-3 rounded-full border border-gray-300 bg-white pl-5 pr-4 py-2.5 text-2xl font-semibold tracking-wide text-text-primary shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label={`Play pronunciation: ${payload.romanization || payload.symbol}`}
        >
          <span>{payload.romanization || payload.symbol}</span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
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
      <ContinueButton onClick={handleContinue} />
    </div>
  );
}

/**
 * Auto-plays the stroke-order animation once on mount, then leaves the final
 * glyph drawn. Respects `prefers-reduced-motion` via the hook.
 */
function SymbolAnimation({ reference }: { reference: SymbolReference }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glyph = reference.glyph;
  const animation = useStrokeAnimation(glyph, { autoPlay: true });

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
