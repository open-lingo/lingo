import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { seededShuffle } from "@/shared/utils/seededShuffle";
import type { ListeningBuildStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { getTtsUrl, playJaAudio } from "@/shared/tts";
import {
  BuildTileSurface,
  useBuildTileKanji,
  useTileRomajiPeek,
} from "./BuildTileSurface";
import { playLocalAudio } from "@/shared/audio/volume";
import { playSfx } from "@/shared/audio/sfx";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { formatPrompt } from "../formatPrompt";

const CELEBRATE_MS = 1100;

type Props = {
  step: ListeningBuildStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Split a prompt on single-quoted spans for emphasis. Quote boundaries are
 * position-aware: an opening `'` must follow start-of-string/whitespace and
 * a closing `'` must NOT be followed by a word character — so apostrophes
 * inside contractions ("'I'm studying right now.'") stay part of the quoted
 * span instead of terminating it (the naive `'([^']+)'` split bolded "I"
 * and ate both apostrophes). Odd indices are the emphasized spans.
 */
export function splitQuotedEmphasis(text: string): string[] {
  return text.split(/(?<=^|\s)'(.+?)'(?!\w)/g);
}

/**
 * Render the prompt with any single-quoted span bolded — gives the
 * "the word for 'love'" pattern a clear emphasis without restructuring
 * the prop into separate fields. Falls back to the raw string when no
 * quoted segment exists, so prompts authored without quotes still
 * render cleanly.
 */
function PromptWithEmphasis({ text }: { text: string }) {
  const parts = splitQuotedEmphasis(text);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-bold text-text-primary">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function ListeningBuildStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  // Bank INDICES, not texts — with duplicate glyphs (いいえ has two い)
  // text-tracking ghosted the leftmost instance instead of the tile the
  // learner actually clicked (Spencer 2026-06-13).
  const [placedIdx, setPlacedIdx] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  // Kana-row banks are authored answer-first ([...required, ...extras])
  // and the vowel rows in plain あいうえお order — both leak the answer.
  // Shuffle once at render, seeded on the step id so the order is stable
  // across re-renders and resumes.
  const bankTiles = useMemo(
    () => seededShuffle(step.tiles, step.id),
    [step.tiles, step.id],
  );

  // Position-stable tile bar: render every bank tile in its shuffled
  // order, never reflow. The EXACT instance the learner clicked ghosts
  // (index membership), so duplicate glyphs behave intuitively.
  const tileUsedFlags: boolean[] = bankTiles.map((_, i) =>
    placedIdx.includes(i),
  );

  const placed = placedIdx.map((i) => bankTiles[i]);
  const isCorrect = JSON.stringify(placed) === JSON.stringify(step.correctOrder);

  // DISPLAY-ONLY kanji-fication (Spencer 2026-07-17): unlocked words show
  // their kanji form (furigana until FSRS-mastered) on bank/tray/ghost
  // tiles alike. Grading (`placed` vs `correctOrder` above) stays kana.
  // Character-granularity kana-row banks are excluded inside the hook.
  const tileKanji = useBuildTileKanji(step.tiles, step.granularity);

  // Romaji peek on character-build tiles (Spencer 2026-07-19): hover-dwell
  // or tap reveals a tile's romaji, forced past the global script guard —
  // beginners see romaji outright, post-cutoff learners get an on-demand
  // hint instead of nothing. Word builds are excluded: their word-level
  // romaji follows the normal ladder and kanji tiles never carry romaji.
  const peek = useTileRomajiPeek(step.granularity === "character");

  // Single-answer listening "builds" are an MCQ wearing tray clothes — see
  // BuildSentenceStepView's isSingleAnswerPicker (Spencer QA 2026-07-16).
  const isSingleAnswerPicker = step.correctOrder.length === 1;

  function addTile(originalIndex: number) {
    if (submitted) return;
    // Tap counts as an intentional look — reveal the romaji hint (no-op on
    // word builds; the peek hook is disabled there).
    peek.reveal(originalIndex);
    if (isSingleAnswerPicker) {
      // Single-select: tapping an option REPLACES the pick.
      playSfx("tile");
      setPlacedIdx([originalIndex]);
      return;
    }
    if (placedIdx.includes(originalIndex)) return;
    playSfx("tile");
    setPlacedIdx((prev) => [...prev, originalIndex]);
  }

  function removeTile(trayPosition: number) {
    if (submitted) return;
    setPlacedIdx((prev) => prev.filter((_, i) => i !== trayPosition));
  }

  function handleSubmit() {
    setSubmitted(true);
    onComplete(step.id, isCorrect);
    if (isCorrect) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  const handleEnter = useCallback(() => {
    if (!submitted && placed.length > 0) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, placed.length, onContinue]);

  useLessonKeyboard({ onEnter: handleEnter });

  // Non-JA courses may ship no recorded clip; fall back to the platform
  // voice so the listen-and-build exercise stays playable.
  const audioUrl = getTtsUrl(step.targetSentence);
  function handlePlay() {
    if (audioUrl) {
      playLocalAudio(audioUrl);
      return;
    }
    playJaAudio(step.targetSentence);
  }

  const hasSubmittedWrong = submitted && !isCorrect;

  return (
    <div className="relative flex flex-1 flex-col gap-7">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      {/* Content cluster starts at the top; the CTA block below carries
          mt-auto so it pins to the shared bottom action slot. */}
      <div className="flex flex-col gap-7">
      {/* Prompt row — bigger play button + larger text. Quoted meanings
       *  get auto-bolded via PromptWithEmphasis. */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handlePlay}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-accent-hover bg-accent text-white shadow-[0_3px_0_0_rgb(var(--color-accent-hover))] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_4px_0_0_rgb(var(--color-accent-hover))] active:translate-y-px active:shadow-[0_1px_0_0_rgb(var(--color-accent-hover))]"
          aria-label="Play audio"
        >
          <Icon name="play" size={28} />
        </button>
        <p className="text-lg leading-snug text-text-secondary">
          <PromptWithEmphasis text={formatPrompt(step.prompt)} />
        </p>
      </div>

      {/* Drop area — ~20% taller. The min-h floor matters when no tiles
       *  are placed; once tiles arrive, flex-wrap handles overflow.
       *  TODO: account for long-word text wrapping when we ship phrases
       *  that exceed one line. */}
      {/* Tray is pre-sized by an invisible ghost of the FULL answer, so
          placing tiles never grows it — no reflow of the bank/CTA below
          mid-interaction. Real tiles render in an overlay with identical
          layout classes, so wrapping matches the ghost. */}
      {isSingleAnswerPicker ? (
        /* MCQ-SHAPED SINGLE-ANSWER PICKER: no tray, no bank row below —
           the bank tiles ARE the options (MultipleChoiceStepView's visual
           language). Tap selects (replacing any prior pick); Check
           submits via the existing generic submit path. */
        <div
          className="relative grid gap-3"
          style={{ minHeight: "min(32.5rem, 44cqh)" }}
        >
          {bankTiles.map((tile, i) => {
            const isSelected = placedIdx.includes(i);
            const isAnswer = tile === step.correctOrder[0];
            let optionStyle =
              "border-border bg-surface text-text-primary hover:border-accent";
            if (submitted && isAnswer) {
              optionStyle = "border-accent bg-accent text-white";
            } else if (submitted && isSelected && !isAnswer) {
              optionStyle = "border-error bg-error/15 text-error";
            } else if (isSelected) {
              optionStyle = "border-accent bg-accent-muted text-accent";
            }
            return (
              <button
                key={`tile-${i}`}
                type="button"
                disabled={submitted}
                aria-pressed={isSelected}
                onClick={() => addTile(i)}
                onMouseEnter={() => peek.hoverStart(i)}
                onMouseLeave={peek.hoverEnd}
                className={`flex items-center justify-center rounded-xl border-2 px-4 py-6 text-xl font-bold transition-colors duration-150 ${optionStyle} ${submitted ? "cursor-default" : "cursor-pointer"}`}
              >
                <BuildTileSurface
                  tile={tile}
                  kanji={tileKanji.get(tile)}
                  forceHelper={peek.revealed.has(i)}
                />
              </button>
            );
          })}
        </div>
      ) : (
      <>
      <div className="relative min-h-[80px] rounded-2xl border-2 border-dashed border-border bg-surface-muted px-4 py-4">
        <div aria-hidden className="invisible flex flex-wrap gap-2.5">
          {step.correctOrder.map((tile, i) => (
            <span
              key={`ghost-${i}`}
              className="rounded-xl border-2 px-5 py-2.5 text-2xl sm:text-3xl font-bold"
            >
              {/* Ghost sizing MUST use the same glyphs (kanji + rt) as the
                  real tiles or the tray mis-sizes. */}
              <BuildTileSurface tile={tile} kanji={tileKanji.get(tile)} />
            </span>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-wrap content-start gap-2.5 px-4 py-4">
          {placed.length === 0 ? (
            <span className="self-center text-base text-text-muted">
              Tap tiles to build what you hear
            </span>
          ) : (
            placed.map((tile, i) => (
              <button
                key={`${tile}-${i}`}
                type="button"
                disabled={submitted}
                onClick={() => removeTile(i)}
                onMouseEnter={() => peek.hoverStart(placedIdx[i])}
                onMouseLeave={peek.hoverEnd}
                className="rounded-xl border-2 border-accent bg-accent-muted px-5 py-2.5 text-2xl sm:text-3xl font-bold text-accent transition-colors duration-150 hover:bg-accent hover:text-white"
              >
                <BuildTileSurface
                  tile={tile}
                  kanji={tileKanji.get(tile)}
                  forceHelper={peek.revealed.has(placedIdx[i])}
                />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Tile bank — buttons ~50% bigger font + matching padding. */}
      <div className="relative flex flex-wrap gap-3">
        {bankTiles.map((tile, i) => {
          const used = tileUsedFlags[i];
          return (
            <button
              key={`tile-${i}`}
              type="button"
              disabled={submitted || used}
              onClick={() => addTile(i)}
              onMouseEnter={() => peek.hoverStart(i)}
              onMouseLeave={peek.hoverEnd}
              aria-pressed={used}
              className={
                used
                  ? "rounded-xl border-2 border-border bg-surface-muted px-5 py-3 text-2xl sm:py-4 sm:text-3xl font-bold text-text-muted opacity-40"
                  : "rounded-xl border-2 border-border bg-surface px-5 py-3 text-2xl sm:py-4 sm:text-3xl font-bold text-text-primary transition-colors duration-150 hover:border-accent disabled:opacity-50"
              }
            >
              <BuildTileSurface
                tile={tile}
                kanji={tileKanji.get(tile)}
                forceHelper={peek.revealed.has(i)}
              />
            </button>
          );
        })}
      </div>
      </>
      )}
      </div>

      {/* Single bottom-anchored block: wrong-answer banner + CTA live
          together so the button NEVER moves on submit — the banner grows
          the block upward while the CTA stays pinned. Correct answers
          celebrate via toast only (no banner, no shift). */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6" data-testid="primary-cta">
        {celebrating && <CelebrationToast text={celebrationText} />}
        {submitted && !isCorrect && <Feedback correct={false} />}
        {submitted && !isCorrect && (
          <p className="text-base text-text-secondary">
            Correct:{" "}
            <span className="font-bold text-text-primary">
              {step.correctOrder.join(step.granularity === "character" ? "" : " ")}
            </span>
          </p>
        )}
        {!submitted ? (
          <ContinueButton onClick={handleSubmit} label="Check" disabled={placed.length === 0} />
        ) : (
          <ContinueButton onClick={onContinue} variant={isCorrect ? "correct" : "incorrect"} />
        )}
      </div>
    </div>
  );
}
