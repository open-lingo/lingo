import { useCallback, useEffect, useRef, useState } from "react";
import type { WordMapStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { MistakeDots } from "./MatchPairsStepView";
import { useTranslation } from "react-i18next";
import { getTtsUrl, playJaAudio } from "@/shared/tts";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { Icon } from "@/shared/components/Icon";
import { GENDER_STYLE } from "@/shared/language/genderColor";
import { Tile } from "../tiles/Tile";
import type { TileState, TileText } from "../tiles/Tile";
import { TileTray } from "../tiles/TileTray";

/**
 * `GENDER_STYLE[g].chip` is a plain Tailwind string ("border-sky-500/70
 * bg-sky-500/10 text-sky-700 dark:text-sky-300") written for a bare
 * `<button>`. On the Tile primitive every `data-state` sets border/bg/text
 * colour at (0,2,0)+ specificity (`src/index.css` § "States"), so a plain
 * className loses to it. Tile.tsx's own doc sanctions exactly this: "must
 * use `!` (Tailwind's important modifier) to override a property this
 * block sets." This bang-prefixes each class (including the `dark:`
 * variant, which needs the `!` AFTER the variant) rather than hand-editing
 * `genderColor.ts`, which is shared and out of this lane's ownership.
 */
function bangOverride(classes: string): string {
  return classes
    .split(" ")
    .map((c) => (c.startsWith("dark:") ? `dark:!${c.slice(5)}` : `!${c}`))
    .join(" ");
}

const CELEBRATE_MS = 1100;
/** Same budget as match_pairs — this is its sentence-shaped sibling. */
const MAX_MISTAKES = 3;
const ERROR_FLASH_MS = 550;

type Props = {
  step: WordMapStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Word-map — see the type's doc block for the authoring contract.
 * Interaction notes:
 *
 *  - TWO sentence lines: the English line on top (big — it is the cue,
 *    not a caption) with the current word highlighted accent and solved
 *    words quietly ticked; the target-language chips below, where every
 *    solved chip locks open with its English gloss underneath. The
 *    learner watches an interlinear translation assemble under their
 *    fingers — that artifact IS the payoff.
 *  - Process of elimination is real: solved chips leave the bank, so the
 *    tail of the sentence is deducible even when the words are unknown —
 *    the match-pairs ramp, applied to a sentence.
 *  - A wrong tap flashes error on the tapped chip and burns one of the
 *    match-pairs mistake budget (3); the prompt does not advance, so the
 *    learner retries the SAME word with one fewer candidate. At 3 the
 *    step fails immediately (match_pairs convention) but the remaining
 *    mappings fill in muted — the teaching lands even on a fail.
 */
export function WordMapStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  // tokenIndex → the pair's `en` gloss, for every solved mapping.
  const [solved, setSolved] = useState<Map<number, string>>(new Map());
  const [mistakes, setMistakes] = useState(0);
  const [errorIdx, setErrorIdx] = useState<number | null>(null);
  const [done, setDone] = useState<null | "clean" | "missed" | "failed">(null);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const errorTimer = useRef<number | null>(null);

  const current = done === null ? step.pairs[solved.size] : undefined;
  const hasAudio = !!step.audioText && !!getTtsUrl(step.audioText);

  const autoplayedRef = useRef(false);
  useEffect(() => {
    if (autoplayedRef.current || !hasAudio) return;
    autoplayedRef.current = true;
    playJaAudio(step.audioText!);
  }, [hasAudio, step.audioText]);

  useEffect(
    () => () => {
      if (errorTimer.current !== null) window.clearTimeout(errorTimer.current);
    },
    [],
  );

  const finish = useCallback(
    (verdict: "clean" | "missed" | "failed") => {
      setDone(verdict);
      onComplete(step.id, verdict !== "failed");
      if (verdict === "clean") {
        setCelebrationText(pickCelebrationText(t));
        setCelebrating(true);
        window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
      }
    },
    [onComplete, step.id, t],
  );

  function handleTap(idx: number) {
    if (done !== null || !current || solved.has(idx)) return;
    if (idx === current.tokenIndex) {
      const next = new Map(solved);
      next.set(idx, current.en);
      setSolved(next);
      // Hearing the word as it locks in binds sound to mapping — but only
      // when a word-level clip exists (sentence words often have none).
      if (getTtsUrl(step.tokens[idx])) playJaAudio(step.tokens[idx]);
      if (next.size === step.pairs.length) {
        finish(mistakes === 0 ? "clean" : "missed");
      }
    } else {
      const burned = mistakes + 1;
      setMistakes(burned);
      setErrorIdx(idx);
      if (errorTimer.current !== null) window.clearTimeout(errorTimer.current);
      errorTimer.current = window.setTimeout(() => setErrorIdx(null), ERROR_FLASH_MS);
      if (burned >= MAX_MISTAKES) {
        // Fail — but fill in what was left, muted, so the mapping still
        // teaches. (The reveal is display-only; `solved` keeps the honest
        // learner-built subset.)
        finish("failed");
      }
    }
  }

  const handleEnter = useCallback(() => {
    if (done !== null) onContinue();
  }, [done, onContinue]);
  useLessonKeyboard({ onEnter: handleEnter });

  /** Gloss to show under a chip: learner-solved, or the reveal on fail. */
  function glossFor(idx: number): string | undefined {
    const own = solved.get(idx);
    if (own !== undefined) return own;
    if (done === "failed") {
      return step.pairs.find((p) => p.tokenIndex === idx)?.en;
    }
    return undefined;
  }

  const isCorrect = done !== null && done !== "failed";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col stage-center gap-7">
        <h2 className="text-center text-lg font-medium leading-snug text-text-secondary sm:text-xl">
          {done === null
            ? "Tap the Spanish for the highlighted word."
            : "Every word, mapped."}
        </h2>

        {/* The ENGLISH line — the cue layer, deliberately big. */}
        <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-2 px-2">
          {step.pairs.map((pair, i) => {
            const isCurrent = current !== undefined && i === solved.size;
            const isSolved = i < solved.size || done !== null;
            return (
              <span
                key={`${i}-${pair.en}`}
                className={
                  isCurrent
                    ? "rounded-lg bg-accent px-2 py-0.5 text-2xl font-bold text-white sm:text-3xl"
                    : isSolved
                      ? "text-2xl font-bold text-text-muted line-through decoration-2 decoration-accent/50 sm:text-3xl"
                      : "text-2xl font-bold text-text-primary sm:text-3xl"
                }
              >
                {pair.en}
              </span>
            );
          })}
        </div>

        {/* The target-language chips — the bank, assembling interlinear
            glosses as mappings lock in. */}
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4">
          <TileTray kind="options-row" className="items-start justify-center">
            {hasAudio && (
              <button
                type="button"
                onClick={() => playJaAudio(step.audioText!)}
                className="mr-1 mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_3px_0_0_rgb(var(--color-accent-hover))] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover active:translate-y-px"
                aria-label="Play audio"
              >
                <Icon name="play" size={20} />
              </button>
            )}
            {step.tokens.map((token, idx) => {
              const gloss = glossFor(idx);
              const isRevealOnly = gloss !== undefined && !solved.has(idx);
              const isError = errorIdx === idx;
              // Solved chips take their GENDER hue when the author tinted
              // this token (see WordMapStep.tokenGenders) — an agreement
              // chain lights up in one color as the mapping fills in.
              const gender = step.tokenGenders?.[idx];
              const genderStyle = gender ? GENDER_STYLE[gender] : undefined;
              // ON THE TILE PRIMITIVE (review P3, 2026-09-17). A solved
              // chip was already `border-accent bg-accent/10 text-accent`
              // — the "placed" state's exact palette (`Tile`: "A tile the
              // learner has placed in the tray"). An error flash was
              // already the tone-agnostic `wrong`. The reveal-on-fail chip
              // (dashed, muted) is the tone-agnostic `spent` plus a
              // `border-dashed` className (no `!` needed — the primitive
              // never sets `border-style`). Gender tinting has no home in
              // the primitive's tone vocabulary (accent/success/card), so
              // it stays a `!`-overridden className per `bangOverride`
              // above rather than a fourth `tone`.
              const state: TileState = isError
                ? "wrong"
                : solved.has(idx)
                  ? "placed"
                  : isRevealOnly
                    ? "spent"
                    : "idle";
              const overrideClassName =
                solved.has(idx) && genderStyle
                  ? bangOverride(genderStyle.chip)
                  : isRevealOnly
                    ? "border-dashed"
                    : undefined;
              const text: TileText =
                token.length >= 5 ? "sm" : token.length >= 3 ? "md" : "lg";
              return (
                <div key={`${idx}-${token}`} className="flex flex-col items-center gap-1">
                  <Tile
                    variant="option"
                    size="particle"
                    text={text}
                    state={state}
                    disabled={done !== null || solved.has(idx)}
                    onClick={() => handleTap(idx)}
                    aria-label={`Pick ${token}`}
                    className={overrideClassName}
                  >
                    {token}
                  </Tile>
                  {/* The interlinear gloss, filling in as the learner maps. */}
                  <span className="flex min-h-4 items-center gap-1 text-xs font-semibold">
                    <span
                      className={
                        isRevealOnly
                          ? "text-text-muted"
                          : solved.has(idx) && genderStyle
                            ? genderStyle.text
                            : "text-accent"
                      }
                    >
                      {gloss ?? " "}
                    </span>
                    {/* Accessibility contract (genderColor.ts): the hue is
                        never the only carrier — a solved tinted chip pairs
                        it with the m/f/n letter. */}
                    {solved.has(idx) && genderStyle && (
                      <span
                        className={`rounded px-1 text-[10px] font-bold leading-4 ${genderStyle.badge}`}
                      >
                        {genderStyle.markerLetter}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </TileTray>
          <MistakeDots used={mistakes} max={MAX_MISTAKES} />
        </div>

        {done !== null && step.revealNote && (
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
        {done === "failed" && <Feedback correct={false} />}
        {done !== null && (
          <ContinueButton
            onClick={onContinue}
            variant={isCorrect ? "correct" : "incorrect"}
          />
        )}
      </div>
    </div>
  );
}
