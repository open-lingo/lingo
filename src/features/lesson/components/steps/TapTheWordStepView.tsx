import { useCallback, useEffect, useRef, useState } from "react";
import type { TapTheWordStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { useTranslation } from "react-i18next";
import { getTtsUrl, playJaAudio } from "@/shared/tts";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { Icon } from "@/shared/components/Icon";
import { Tile } from "../tiles/Tile";
import type { TileState, TileText } from "../tiles/Tile";
import { TileTray } from "../tiles/TileTray";

const CELEBRATE_MS = 1100;

type Props = {
  step: TapTheWordStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Tap-the-word — see the type's doc block for the deduction contract.
 * Interaction notes:
 *
 *  - The sentence renders as a SENTENCE — a flowing line of word chips
 *    with natural wrap — not a tile grid. The chip affordance says
 *    "tappable"; the flow says "read me".
 *  - Single-target steps behave like a radio (a new tap moves the
 *    selection); multi-target steps toggle, and the prompt row states
 *    how many to find so the learner is never guessing the ARITY.
 *  - After commit, three states paint the deduction feedback: a correct
 *    pick fills accent, a missed target shows a dashed accent outline
 *    (here's what you didn't find), a wrong pick shows the error tone.
 *    `revealNote` then names the cue, so the strategy — not just the
 *    answer — is what the learner takes away.
 */
export function TapTheWordStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const targets = new Set(step.correctIndices);
  const multi = step.correctIndices.length > 1;
  const hasAudio = !!step.audioText && !!getTtsUrl(step.audioText);

  // Autoplay the sentence once — hearing it is part of the context that
  // powers deduction (same one-shot guard as word_image_mcq's audio mode).
  const autoplayedRef = useRef(false);
  useEffect(() => {
    if (autoplayedRef.current || !hasAudio) return;
    autoplayedRef.current = true;
    playJaAudio(step.audioText!);
  }, [hasAudio, step.audioText]);

  const isCorrect =
    selected.size === targets.size &&
    [...selected].every((i) => targets.has(i));

  const handleSubmit = useCallback(() => {
    if (selected.size === 0 || submitted) return;
    setSubmitted(true);
    const correct =
      selected.size === targets.size &&
      [...selected].every((i) => targets.has(i));
    onComplete(step.id, correct);
    if (correct) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
    // selected/targets are stable snapshots at commit time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, submitted, step.id, onComplete, t]);

  const handleEnter = useCallback(() => {
    if (!submitted && selected.size > 0) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, selected, handleSubmit, onContinue]);

  useLessonKeyboard({ onEnter: handleEnter });

  function handleTap(idx: number) {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        // Radio behavior on single-target steps: a new tap MOVES the
        // selection instead of stacking a guaranteed-wrong second pick.
        if (!multi) next.clear();
        next.add(idx);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col stage-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-center text-xl font-medium leading-snug text-text-secondary sm:text-2xl">
            {step.prompt}
          </h2>
          {multi && (
            <span className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
              Tap {step.correctIndices.length} words
            </span>
          )}
        </div>

        {/* The sentence: play button + flowing word chips, centered as one
            reading line that wraps naturally. */}
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4">
          <TileTray kind="options-row" className="items-center justify-center">
            {hasAudio && (
              <button
                type="button"
                onClick={() => playJaAudio(step.audioText!)}
                className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_3px_0_0_rgb(var(--color-accent-hover))] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover active:translate-y-px"
                aria-label="Play audio"
              >
                <Icon name="play" size={20} />
              </button>
            )}
            {step.tokens.map((token, idx) => {
              const isSelected = selected.has(idx);
              const isTarget = targets.has(idx);
              // ON THE TILE PRIMITIVE (review P3, 2026-09-17). Three of the
              // four post-submit looks map onto `tone="success"` states
              // exactly: a found target was already `border-accent
              // bg-accent/10 text-accent` (tone=success `selected`'s own
              // palette), a wrong pick was already the tone-agnostic
              // `wrong`, pre-submit selection was already close to the
              // tone-agnostic `selected`. The fourth — "missed target",
              // an UNSELECTED option that WAS a target, dashed-outlined —
              // has no dedicated TileState (idle/placed/selected/correct/
              // wrong/spent/ghost/slot); the closest state is `selected`
              // (right border+text colour), with the two properties that
              // differ (fill → transparent, solid → dashed) overridden via
              // `className`, using Tile.tsx's own documented escape hatch
              // ("must use `!` to override a property this block sets").
              // GAP for the Tile/TileTray owner: a `state="missed"` (or
              // similar) would let this drop the override.
              const isWrongPick = submitted && isSelected && !isTarget;
              const isMissed = submitted && !isSelected && isTarget;
              const state: TileState = isWrongPick
                ? "wrong"
                : isSelected || isMissed
                  ? "selected"
                  : "idle";
              const text: TileText =
                token.length >= 5 ? "sm" : token.length >= 3 ? "md" : "lg";
              return (
                <Tile
                  key={`${idx}-${token}`}
                  variant="option"
                  size="particle"
                  tone="success"
                  text={text}
                  state={state}
                  disabled={submitted}
                  onClick={() => handleTap(idx)}
                  aria-label={`Tap ${token}`}
                  aria-pressed={isSelected}
                  className={isMissed ? "!bg-surface border-dashed" : undefined}
                >
                  {token}
                </Tile>
              );
            })}
          </TileTray>
          {step.meaningEn && (
            // The gloss is deduction FUEL, not a caption — Spencer QA
            // 2026-08-20: "make the english translation a little bigger."
            <p className="m-0 text-center text-lg font-medium text-text-secondary sm:text-xl">
              &ldquo;{step.meaningEn}&rdquo;
            </p>
          )}
        </div>

        {submitted && step.revealNote && (
          <div className="mx-auto w-full max-w-xl rounded-2xl border-2 border-accent/40 bg-accent/5 p-4 text-center">
            <p className="m-0 text-sm text-text-secondary">{step.revealNote}</p>
          </div>
        )}
      </div>

      <div
        className="mx-auto mt-auto flex w-full max-w-xl flex-col gap-4 pt-6"
        data-testid="primary-cta"
      >
        {celebrating && <CelebrationToast text={celebrationText} />}
        {submitted && !isCorrect && <Feedback correct={false} />}
        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            label="Check"
            disabled={selected.size === 0}
          />
        ) : (
          <ContinueButton
            onClick={onContinue}
            variant={isCorrect ? "correct" : "incorrect"}
          />
        )}
      </div>
    </div>
  );
}
