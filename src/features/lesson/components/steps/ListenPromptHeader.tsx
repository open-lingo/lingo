import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/shared/components/Icon";

type ListenPromptHeaderProps = {
  onPlay: () => void;
  playAriaLabel?: string;
  iconSize?: number;
  /**
   * The prompt/sentence's own font-size (rem) and line-height (unitless
   * multiplier) — the button floors to `max(44px, 2 * fontRem * lineHeight)`
   * so it stays exactly as tall as two lines of the text it sits beside,
   * proportional to whichever text-size the caller is actually rendering
   * (JA's 1.2rem/leading-tight vs the build prompt's text-lg/leading-snug)
   * rather than a hardcoded pixel button that's sometimes taller than the
   * text and sometimes shorter.
   */
  fontRem: number;
  lineHeight: number;
  children: ReactNode;
};

/**
 * TestFlight #165 (founder, build 20 — "maybe audio play button sits on the
 * left of the sentence as a two-word-tall thing allowing sentence wrap for
 * space"). Shared by ListeningComprehensionStepView and
 * ListeningBuildStepView so the round play button + wrapping prompt text is
 * one primitive instead of two hand-tuned copies (CLAUDE.md: one primitive
 * per family). Pure layout — button left (`shrink-0`, sized off the caller's
 * own font tokens), content right (`min-w-0` so ruby/furigana text wraps
 * instead of overflowing). Content composition (eyebrow badge, audio-silent
 * message, the sentence itself) stays with each caller since the two views
 * order those elements differently.
 */
export function ListenPromptHeader({
  onPlay,
  playAriaLabel = "Play audio",
  iconSize = 22,
  fontRem,
  lineHeight,
  children,
}: ListenPromptHeaderProps) {
  const style = {
    "--lph-btn": `max(44px, calc(${fontRem}rem * ${lineHeight} * 2))`,
  } as CSSProperties;

  return (
    <div className="flex items-center gap-3" style={style}>
      <button
        type="button"
        onClick={onPlay}
        aria-label={playAriaLabel}
        className="flex h-[var(--lph-btn)] w-[var(--lph-btn)] shrink-0 items-center justify-center rounded-full border-2 border-accent-hover bg-accent text-white shadow-[0_2px_0_0_rgb(var(--color-accent-hover))] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_3px_0_0_rgb(var(--color-accent-hover))] active:translate-y-px active:shadow-[0_1px_0_0_rgb(var(--color-accent-hover))]"
      >
        <Icon name="play" size={iconSize} />
      </button>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
