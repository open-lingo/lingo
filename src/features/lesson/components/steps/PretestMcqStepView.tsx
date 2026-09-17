import { useCallback, useState } from "react";
import type { PretestMcqStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Tile } from "../tiles/Tile";
import { TileTray } from "../tiles/TileTray";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { useTranslation } from "react-i18next";
import { getTtsUrl, playJaAudio } from "@/shared/tts";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { Icon } from "@/shared/components/Icon";

const CELEBRATE_MS = 1100;

type Props = {
  step: PretestMcqStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Pretest MCQ — guess-before-taught. See the type's doc block for the
 * pedagogy; the interaction contract here is:
 *
 *  - The guess is SAFE. A wrong pick renders in the warning tone, not
 *    error red — this step's promise is "you haven't learned this yet,
 *    guessing costs nothing", and red would break it. The correct option
 *    always lights up accent on commit, so the reveal reads the same
 *    whether the guess landed or not.
 *  - `onComplete` always reports `true`: this is a TEACH step (see
 *    `TEACH_STEP_KINDS`) and the signal is resume bookkeeping, not
 *    grading. The celebration toast still fires only on a right guess —
 *    the fun is real even when the stakes aren't.
 *  - Tap previews the option's TTS (same preview-on-tap contract as
 *    word_image_mcq); the reveal replays the taught surface.
 */
export function PretestMcqStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const guessedRight = selected === step.correctOptionId;
  const revealAudio = step.reveal.audioText ?? step.reveal.surface;

  const handleSubmit = useCallback(() => {
    if (!selected || submitted) return;
    setSubmitted(true);
    // Teach-step contract: always "correct" — the guess is not graded.
    onComplete(step.id, true);
    if (getTtsUrl(revealAudio)) playJaAudio(revealAudio);
    if (selected === step.correctOptionId) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }, [selected, submitted, step.id, step.correctOptionId, revealAudio, onComplete, t]);

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, selected, handleSubmit, onContinue]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= step.options.length) {
        handleTap(step.options[n - 1].id, step.options[n - 1].text);
      }
    },
  });

  function handleTap(optId: string, text: string) {
    if (submitted) return;
    if (getTtsUrl(text)) playJaAudio(text);
    setSelected(optId);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col stage-center gap-6">
        {/* The safety contract, stated up front: this is a guess, not a quiz. */}
        <div className="flex flex-col items-center gap-3">
          <span className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
            New phrase — take a guess
          </span>
          <h2 className="text-center text-xl font-medium leading-snug text-text-secondary sm:text-2xl">
            {step.situationEn}
          </h2>
        </div>

        {/* ON THE TILE PRIMITIVE (review P2, 2026-09-17): `size="pick"` is
            BuildSentenceStepView's single-answer-picker geometry — a
            centred, bold, stacked-column option, the same shape this list
            always was. `data-state` alone can't carry this step's
            pedagogy though: a wrong GUESS here must render in the WARNING
            tone, never error red (the contract in the file doc-block), and
            no Tile tone produces amber. The `!`-important overrides below
            are the documented escape hatch (`Tile.tsx`'s own comment: "the
            one case that legitimately needs to fight [the CSS block] …
            Tailwind's `!` modifier") — they reproduce this view's exact
            shipped colours (border-accent/bg-accent-10 reveal,
            border-warning/bg-warning-10 safe-miss, border-accent/bg-
            accent-5 pre-submit pick) pixel for pixel; only the geometry
            (padding/font/FIT/a11y-slider) now comes from the tile token. */}
        <TileTray kind="grid" gap="tight">
          {step.options.map((opt) => {
            const isSelected = selected === opt.id;
            const isAnswer = opt.id === step.correctOptionId;
            const state = submitted && isAnswer
              ? "correct"
              : submitted && isSelected
                ? "wrong"
                : isSelected
                  ? "selected"
                  : "idle";
            const toneOverride =
              submitted && isAnswer
                ? "!border-accent !bg-accent/10 !text-accent"
                : submitted && isSelected && !isAnswer
                  ? "!border-warning !bg-warning/10 !text-warning"
                  : isSelected
                    ? "!border-accent !bg-accent/5 !text-text-primary"
                    : "";
            return (
              <Tile
                key={opt.id}
                variant="option"
                size="pick"
                state={state}
                disabled={submitted}
                onClick={() => handleTap(opt.id, opt.text)}
                aria-label={`Hear and pick ${opt.text}`}
                className={toneOverride}
              >
                {opt.text}
              </Tile>
            );
          })}
        </TileTray>

        {submitted && (
          <div className="mx-auto w-full max-w-md rounded-2xl border-2 border-accent/40 bg-accent/5 p-5 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-bold text-text-primary">
                {step.reveal.surface}
              </span>
              {getTtsUrl(revealAudio) && (
                <button
                  type="button"
                  onClick={() => playJaAudio(revealAudio)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover"
                  aria-label="Play audio"
                >
                  <Icon name="play" size={18} />
                </button>
              )}
            </div>
            <p className="m-0 mt-1 text-base text-text-secondary">
              {step.reveal.meaningEn}
            </p>
            {step.reveal.hint && (
              <p className="m-0 mt-2 text-sm text-text-muted">{step.reveal.hint}</p>
            )}
          </div>
        )}
      </div>

      <div
        className="mx-auto mt-auto flex w-full max-w-md flex-col gap-4 pt-6"
        data-testid="primary-cta"
      >
        {celebrating && <CelebrationToast text={celebrationText} />}
        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            label="Check"
            disabled={!selected}
          />
        ) : (
          <ContinueButton
            onClick={onContinue}
            label={guessedRight ? undefined : "Got it"}
            variant={guessedRight ? "correct" : "primary"}
          />
        )}
      </div>
    </div>
  );
}
