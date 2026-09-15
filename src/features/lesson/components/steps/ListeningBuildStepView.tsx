import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { seededShuffle } from "@/shared/utils/seededShuffle";
import type { ListeningBuildStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { playJaAudio } from "@/shared/tts";
import { SortableBuildTiles } from "./SortableBuildTiles";
import {
  BuildTileSurface,
  useBuildTileKanji,
  useTileRomajiPeek,
} from "./BuildTileSurface";
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
  const tileKanji = useBuildTileKanji(
    step.tiles,
    step.granularity,
    step.targetSentence,
    step.correctOrder,
  );

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

  // Route EVERY play through playJaAudio.
  //
  // This used to call playLocalAudio directly whenever getTtsUrl returned a
  // URL. The TTS manifest is bundled into the JS, so a URL comes back even
  // when the CDN object is gone (a deploy once deleted the published corpus)
  // or the learner is offline — and playLocalAudio swallows both the `error`
  // event and the play() rejection. The learner tapped play in silence with no
  // affordance, and KO/ES never reached the synthesis fallback that would have
  // worked. playJaAudio already handles clip-then-synthesis correctly.
  const [audioSilent, setAudioSilent] = useState(false);
  function handlePlay() {
    void playJaAudio(step.targetSentence).then((result) =>
      // JA forbids synthesis by design, so a failed clip there really is
      // silence — say so instead of leaving a dead button.
      setAudioSilent(result === "silent"),
    );
  }

  const hasSubmittedWrong = submitted && !isCorrect;

  return (
    <div className="relative flex flex-1 flex-col gap-5 sm:gap-7">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      {/* The cluster CENTRES in the space above the action block rather than
          starting at the top. These steps size to their content, so
          top-aligning them stranded one large void between the last element
          and the CTA on a tall phone (Spencer QA 2026-08-07, measured at
          430x932). Reading order is unchanged; only the position moved. The
          action block below keeps `mt-auto`, so it stays bottom-anchored and
          the fixed action bar does not shift. */}
      <div className="flex min-h-0 flex-1 flex-col stage-center gap-5 sm:gap-7">
      {/* Prompt row — #69 (Spencer TestFlight b12, 2026-09-14): "the build
       *  what you hear takes up too much space... go research recent
       *  Duolingo screenshots." §4 of the scoping doc (unverified starting
       *  spec): the play control should read as a compact, single-line
       *  control on the instruction row, not a large stand-alone circle.
       *  It was already laid out inline (flex row) next to the prompt
       *  text, but at h-14/h-16 (56/64px) with a thick border + drop
       *  shadow it visually dominated the row. Shrunk to h-11/h-12
       *  (44/48px, the §4 "~44-48pt" figure) with a lighter shadow and a
       *  smaller icon (28px→20px) so it reads as a compact instruction-row
       *  control rather than a standalone hero button. Quoted meanings
       *  get auto-bolded via PromptWithEmphasis. */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlay}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-accent-hover sm:h-12 sm:w-12 bg-accent text-white shadow-[0_2px_0_0_rgb(var(--color-accent-hover))] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_3px_0_0_rgb(var(--color-accent-hover))] active:translate-y-px active:shadow-[0_1px_0_0_rgb(var(--color-accent-hover))]"
          aria-label="Play audio"
        >
          <Icon name="play" size={20} />
        </button>
        <div className="min-w-0">
          <p className="text-lg leading-snug text-text-secondary">
            <PromptWithEmphasis text={formatPrompt(step.prompt)} />
          </p>
          {audioSilent && (
            <p role="status" className="mt-1 text-sm text-warning">
              Audio unavailable right now — the sentence is shown below the tiles.
            </p>
          )}
        </div>
      </div>

      {/* Drop area. The min-h floor matters when no tiles are placed.
       *  An invisible ghost of the FULL answer sets the tray's floor so
       *  placing the expected tiles never reflows the bank/CTA below.
       *  It is a floor and not a cap — the bank carries distractors and
       *  addTile has no length limit, so more tiles than the answer can
       *  land here. Ghost and tiles share one grid cell, so the height is
       *  max(ghost, actual) and the box grows rather than spilling. Real
       *  tiles use layout classes identical to the ghost so wrapping
       *  matches. */}
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
                /* Vertical padding is height-relative, not fixed.
                   A fixed `py-6` made each option 90px, and four of them plus
                   the play button, a two-line prompt and the CTA overflow the
                   fixed lesson shell below ~900pt: at 393x852 (a 15 Pro Max in
                   Display Zoom) that shows a scrollbar, and at 375x812 the last
                   option is clipped BEHIND the Check button — unreachable.
                   `cqh` is already the unit this grid sizes with, so the
                   padding now shrinks with the container while the clamp keeps
                   the roomy look on tall screens. Measured at 375/393/430. */
                className={`flex items-center justify-center rounded-xl border-2 px-4 py-[clamp(0.5rem,2.6cqh,1.5rem)] text-xl font-bold transition-colors duration-150 ${optionStyle} ${submitted ? "cursor-default" : "cursor-pointer"}`}
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
      {/* Phone tier (TestFlight 2026-09-05 #3): 64px tiles at text-2xl
          wrapped an 11-tile answer to four rows, so tray + bank alone were
          690px of a 743px scroller on a 15 Pro Max. Below `sm` the tiles
          take the sentence-build tier (text-xl, py-2 ≈ 48px) and the ghost
          floor is capped at two rows; from `sm` up nothing changes. */}
      {/* #75 sibling parity (BuildSentenceStepView shrunk its matching
          floors -15%): min-h 64px→54px, sm:80px→68px, ghost cap
          108px→92px. #69 sibling parity: tile px-4(16)→14, py-2(8)→7,
          text-xl(20)→17, sm:px-5(20)→17.5, sm:py-2.5(10)→8.75,
          sm:text-3xl(30)→25.5 (all -15%/-12.5%, same factors as
          BuildSentenceStepView). */}
      {/* TOKENIZED (b16 2026-09-15, TestFlight #124/#125 "inconsistent
          across build types" — the ROOT of the complaint is that this view
          never read BuildSentenceStepView's tile tokens). px/py/font below
          are now `calc(var(--tile-px|py|font) * ratio)`, where each ratio
          is this view's CURRENT absolute value ÷ BuildSentenceStepView's
          dense-tier token — e.g. tray px 14/12.25=1.142857 (mobile),
          17.5/14=1.25 (desktop). This is an exact reproduction of today's
          numbers (verified pixel-identical, before/after shots), but now
          moves proportionally with the SAME `/qa/tiles` build-tile slider
          BuildSentenceStepView reads — one slider reaches both surfaces.
          Ratios are NOT equal across all four class groups (tray vs bank,
          mobile vs desktop) because the two views' numbers were tuned by
          separate patches over 9 days; unifying the underlying NUMBERS
          (not just the token wiring) is Spencer's call on the QA page,
          not this lane's.

          b16.1 (2026-09-15, same day — TestFlight #137 follow-up): the
          tray gap (`gap-2 sm:gap-2.5` = 8/10px) matched `--tile-tray-gap`'s
          OWN defaults exactly, so it now reads that token directly (zero
          value change). The bank gap (`gap-3` = 12px, no `sm:` step) did
          NOT match `--tile-gap` (8px default) — wiring it there would have
          shrunk it, so it gets its own `--listen-bank-gap` token
          (default 12px) instead: same #125 mismatch, now disclosed via a
          named token rather than a literal class. Both bank/tray tile
          boxes also pick up `--tile-box-h` (TestFlight #137, "every tile
          the same height") — the SAME token BuildSentenceStepView's dense/
          hugeBank/bigTiles tiers read, so "Lock tile heights" on the QA
          page reaches every build surface in one write. */}
      <div className="grid min-h-[54px] rounded-2xl border-2 border-dashed border-border bg-surface-muted px-4 py-3 sm:min-h-[68px] sm:py-4">
        <div aria-hidden className="[grid-area:1/1] invisible flex max-h-[92px] flex-wrap items-stretch gap-[var(--tile-tray-gap)] overflow-hidden sm:max-h-none">
          {step.correctOrder.map((tile, i) => (
            <span
              key={`ghost-${i}`}
              className="flex flex-col items-center justify-end rounded-[var(--tile-radius)] border-2 min-h-[var(--tile-box-h)] px-[calc(var(--tile-px)*1.142857)] py-[calc(var(--tile-py)*1.75)] text-[length:calc(var(--tile-font)*1.030303)] font-bold leading-tight sm:px-[calc(var(--tile-px)*1.25)] sm:py-[calc(var(--tile-py)*1.25)] sm:text-[length:calc(var(--tile-font)*1.25)]"
            >
              {/* Ghost sizing MUST use the same glyphs (kanji + rt) as the
                  real tiles or the tray mis-sizes. */}
              <BuildTileSurface tile={tile} kanji={tileKanji.get(tile)} />
            </span>
          ))}
        </div>
        <div className="[grid-area:1/1] flex flex-wrap content-start items-stretch gap-[var(--tile-tray-gap)]">
          {placed.length === 0 ? (
            <span className="self-center text-base text-text-muted">
              Tap tiles to build what you hear
            </span>
          ) : (
            <SortableBuildTiles
              ids={placedIdx}
              tiles={placed}
              tileKanji={tileKanji}
              disabled={submitted}
              onRemove={removeTile}
              onReorder={setPlacedIdx}
              strategy="wrap"
              onTileHoverStart={peek.hoverStart}
              onTileHoverEnd={peek.hoverEnd}
              forceHelperFor={(id) => peek.revealed.has(id)}
              className="flex flex-wrap content-start items-stretch gap-[var(--tile-tray-gap)]"
              tileClassName="flex flex-col items-center justify-end rounded-[var(--tile-radius)] border-2 border-accent bg-accent-muted text-accent min-h-[var(--tile-box-h)] px-[calc(var(--tile-px)*1.142857)] py-[calc(var(--tile-py)*1.75)] text-[length:calc(var(--tile-font)*1.030303)] font-bold leading-tight sm:px-[calc(var(--tile-px)*1.25)] sm:py-[calc(var(--tile-py)*1.25)] sm:text-[length:calc(var(--tile-font)*1.25)] transition-colors duration-150 hover:bg-accent hover:text-white"
            />
          )}
        </div>
      </div>

      {/* Tile bank — buttons ~50% bigger font + matching padding. Gap is its
          own token (`--listen-bank-gap`, default 12px) rather than
          `--tile-gap` (default 8px) — TestFlight #125's "12px vs 8px"
          bank/tray mismatch is a disclosed default, not silently changed by
          this wiring (see the index.css token-block comment). */}
      <div className="relative flex flex-wrap items-stretch gap-[var(--listen-bank-gap)]">
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
                  ? "flex flex-col items-center justify-end rounded-[var(--tile-radius)] border-2 border-border bg-surface-muted text-text-muted opacity-40 min-h-[var(--tile-box-h)] px-[calc(var(--tile-px)*1.142857)] py-[calc(var(--tile-py)*1.75)] text-[length:calc(var(--tile-font)*1.030303)] font-bold leading-tight sm:px-[calc(var(--tile-px)*1.25)] sm:py-[calc(var(--tile-py)*2)] sm:text-[length:calc(var(--tile-font)*1.25)]"
                  : "flex flex-col items-center justify-end rounded-[var(--tile-radius)] border-2 border-border bg-surface text-text-primary transition-colors duration-150 hover:border-accent disabled:opacity-50 min-h-[var(--tile-box-h)] px-[calc(var(--tile-px)*1.142857)] py-[calc(var(--tile-py)*1.75)] text-[length:calc(var(--tile-font)*1.030303)] font-bold leading-tight sm:px-[calc(var(--tile-px)*1.25)] sm:py-[calc(var(--tile-py)*2)] sm:text-[length:calc(var(--tile-font)*1.25)]"
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
