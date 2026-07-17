import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { seededShuffle } from "@/shared/utils/seededShuffle";
import { getTrayOverride } from "../../data/devGates";
import type { BuildSentenceStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { useAutoPlayJaAudio, getTtsUrl, playJaAudio } from "@/shared/tts";
import { playSfx } from "@/shared/audio/sfx";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;
/** Hover dwell before a bank tile's romaji is revealed on character
 *  builds. Long enough that a passing cursor doesn't leak the answer,
 *  short enough to feel like an intentional peek. */
const HOVER_REVEAL_MS = 500;

type Props = {
  step: BuildSentenceStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
  /** Review context (replay run or SRS review lesson): word builds drop
   *  the answer-length slots (a scaffold for first encounters) and use
   *  the growing-pill tray instead. */
  isReplayRun?: boolean;
};

export function BuildSentenceStepView({ step, onComplete, onContinue, isReplayRun = false }: Props) {
  const { t } = useTranslation();
  // Bank INDICES, not texts — with duplicate glyphs (いいえ has two い)
  // text-tracking ghosted the leftmost instance instead of the tile the
  // learner actually clicked (Spencer 2026-06-13).
  const [placedIdx, setPlacedIdx] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  // Character builds (granularity === "character") hide each bank tile's
  // romaji until the learner interacts with it — otherwise the labels
  // ("su/shi/...") spell the English answer and the kana is never read
  // (Spencer 2026-06-13). A tile reveals on tap (also plays its sound) or
  // after a short hover dwell; once revealed it stays revealed.
  const [revealedTiles, setRevealedTiles] = useState<Set<number>>(
    () => new Set(),
  );
  const hoverTimer = useRef<number | null>(null);

  // CHARACTER builds (kana decoding) speak the target on mount — mapping
  // sound↔script is the drill (tester #R1-defer-G, 2026-05-17). WORD
  // builds must stay SILENT pre-answer: they are translation production
  // (EN prompt → assemble JA), and auto-playing the target sentence turns
  // them into transcription — the learner writes what they hear instead
  // of producing (Spencer QA 2026-07-13). The model plays after submit.
  useAutoPlayJaAudio(
    step.granularity === "character" ? step.targetSentence : undefined,
    `build-${step.id}`,
  );

  // Kana-module build banks predate the m8+ data scramble and are mostly
  // authored answer-first; shuffle at render (seeded on step id, so the
  // order is stable across re-renders/resumes) to close the leak for
  // every module. Already-scrambled m8+ banks just re-shuffle — harmless.
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

  // Two independent axes (Spencer 2026-06-13):
  //  - SIZE: small banks (≤6 tiles, words or short sentences) get
  //    display-size tiles; 8+ tile sentence banks stay dense.
  //  - COMPOSITION: only character-granularity WORD builds center and
  //    show answer slots — sentences keep reading order (left-aligned),
  //    and slot outlines only align when tile widths are uniform
  //    (single kana), which sentences aren't.
  const isWordBuild = step.granularity === "character";
  // Hide-until-reveal on character-build tiles. Off (romaji shown) by
  // default as a beginner scaffold; auto-flips ON at Module 5 and is
  // learner-toggleable in Settings. Only character builds fade — sentence
  // builds keep their word-level romaji (Spencer 2026-06-13).
  const hideBuildTileRomaji =
    useSettings().settings.learning.hideBuildTileRomaji ?? false;
  const fadeTiles = isWordBuild && hideBuildTileRomaji;
  const bigTiles = isWordBuild || step.tiles.length <= 6;
  // Slots telegraph word length — scaffolding for first encounters.
  // Review contexts drop them: same step, no length hint. `?tray=` dev
  // dial overrides for demo/QA.
  const trayOverride = getTrayOverride();
  const showSlots =
    isWordBuild &&
    (trayOverride ? trayOverride === "slots" : !isReplayRun);
  const bankTileClass = bigTiles
    ? "px-5 py-3 text-[clamp(1.5rem,3.4dvh,2.25rem)] font-bold"
    : "px-3.5 py-1.5 text-base sm:text-lg font-medium";
  const placedTileClass = bigTiles
    ? "px-5 py-3 text-[clamp(1.5rem,3.4dvh,2.25rem)] font-bold"
    : "px-3.5 py-1.5 text-base sm:text-lg font-semibold";

  const handleEnter = useCallback(() => {
    if (!submitted && placed.length > 0) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, placed.length]);

  useLessonKeyboard({
    onEnter: handleEnter,
  });

  const revealTile = useCallback((i: number) => {
    setRevealedTiles((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  }, []);

  // Hover-dwell peek (faded char builds only): reveal a tile's romaji
  // after a short delay so a passing cursor doesn't leak the answer.
  function handleTileHoverStart(i: number) {
    if (!fadeTiles || revealedTiles.has(i)) return;
    hoverTimer.current = window.setTimeout(
      () => revealTile(i),
      HOVER_REVEAL_MS,
    );
  }
  function handleTileHoverEnd() {
    if (hoverTimer.current != null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }

  function addTile(originalIndex: number) {
    if (submitted) return;
    if (placedIdx.includes(originalIndex)) return;
    if (fadeTiles) {
      // Tap = hear the kana + reveal its romaji. Falls back to the tile
      // click sfx when a single-mora clip isn't in the manifest.
      revealTile(originalIndex);
      const kana = bankTiles[originalIndex];
      if (getTtsUrl(kana)) void playJaAudio(kana);
      else playSfx("tile");
    } else {
      playSfx("tile");
    }
    setPlacedIdx((prev) => [...prev, originalIndex]);
  }

  function removeTile(trayPosition: number) {
    if (submitted) return;
    setPlacedIdx((prev) => prev.filter((_, i) => i !== trayPosition));
  }

  function handleSubmit() {
    setSubmitted(true);
    onComplete(step.id, isCorrect);
    // Word builds held the audio back pre-answer (production, not
    // transcription) — model the full sentence now that they've produced.
    if (step.granularity !== "character" && getTtsUrl(step.targetSentence)) {
      void playJaAudio(step.targetSentence);
    }
    if (isCorrect) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  const hasSubmittedWrong = submitted && !isCorrect;

  // Placed-tile state coloring. Pre-submit (and correct) tiles wear the
  // accent "staged" tint; after a WRONG submit they must flip to the error
  // palette — leaving the learner's wrong answer green-tinted reads as
  // "this was right" at the exact moment the verdict says otherwise.
  const placedStateClass = hasSubmittedWrong
    ? "border-error bg-error/10 text-error"
    : "border-accent bg-accent-muted text-accent hover:bg-accent hover:text-white";

  return (
    // QA 2026-07-12 (workshop C): tightened stacked gaps — tiles stay at
    // the 44px tap floor and the tray keeps its anti-jump reservation;
    // the recoverable space was the spacing, not the tiles.
    <div className="relative flex flex-1 flex-col gap-5">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      {/* Content cluster starts at the top of the step area (prompt is the
          first thing the eye should hit); the action block below carries
          mt-auto so it pins to the bottom regardless of content height. */}
      <div className="flex flex-col gap-4">
      <h2 className={`font-semibold text-text-primary ${bigTiles ? "text-xl sm:text-2xl" : "text-lg"} ${isWordBuild ? "text-center" : ""}`}>
        {step.prompt}
      </h2>

      {step.hint && !submitted && (
        <p className="text-sm text-text-muted">{step.hint}</p>
      )}

      {step.sourceSentence && (
        /* Transform mode: the source sentence the learner rewrites. Reads
           as given-material (muted card), never as the answer — the target
           is assembled from the tiles below. */
        <div className="mx-auto flex w-fit items-center gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3">
          <span className="text-xl text-text-primary" data-testid="transform-source">
            {step.sourceAnnotation ? (
              <AnnotatedJa segments={step.sourceAnnotation} />
            ) : (
              <AnnotatedJa text={step.sourceSentence} />
            )}
          </span>
          {step.transformLabel && (
            <span className="whitespace-nowrap rounded-full bg-accent-muted px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-accent">
              {step.transformLabel}
            </span>
          )}
        </div>
      )}

      {showSlots ? (
        /* WORD-BUILD SLOTS (first encounters): one outlined slot per
           answer kana — pre-sized by invisible copies of the answer
           tiles, so geometry is exact and nothing ever reflows. Placed
           tiles pop into the slots left-to-right. */
        <div className="relative mx-auto w-fit">
          <div aria-hidden className="flex gap-2">
            {step.correctOrder.map((tile, i) => (
              <span
                key={`slot-${i}`}
                className={`rounded-xl border-2 border-dashed border-border bg-surface-muted ${placedTileClass}`}
              >
                <span className="invisible">
                  <AnnotatedJa text={tile} />
                </span>
              </span>
            ))}
          </div>
          <div className="absolute inset-0 flex gap-2">
            {placed.map((tile, i) => (
              <button
                key={`${tile}-${i}`}
                type="button"
                disabled={submitted}
                onClick={() => removeTile(i)}
                className={`motion-safe:animate-tile-pop rounded-xl border-2 transition-colors duration-150 ${placedStateClass} ${placedTileClass}`}
              >
                <AnnotatedJa text={tile} />
              </button>
            ))}
          </div>
        </div>
      ) : isWordBuild ? (
        /* WORD-BUILD PILL (review contexts): no length hint — a compact
           centered tray that hugs its tiles and visibly grows as they
           pop in. The zero-width ghost fixes the height (words never
           wrap), so growth is horizontal-only: nothing below moves. */
        <div className="mx-auto flex min-h-[64px] w-fit min-w-[10rem] items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-border bg-surface-muted px-4 py-2">
          <span aria-hidden className={`invisible w-0 overflow-hidden !px-0 ${placedTileClass}`}>
            <AnnotatedJa text={step.correctOrder[0] ?? "あ"} />
          </span>
          {placed.map((tile, i) => (
            <button
              key={`${tile}-${i}`}
              type="button"
              disabled={submitted}
              onClick={() => removeTile(i)}
              className={`motion-safe:animate-tile-pop rounded-xl border-[1.5px] transition-colors duration-150 ${placedStateClass} ${placedTileClass}`}
            >
              <AnnotatedJa text={tile} />
            </button>
          ))}
        </div>
      ) : (
        /* SENTENCE TRAY: pre-sized by an invisible ghost of the FULL
           answer so placement never reflows; left-aligned (reading
           order). */
        <div className="relative min-h-[56px] rounded-2xl border-[1.5px] border-dashed border-border bg-surface-muted px-4 py-2.5">
          <div aria-hidden className="invisible flex flex-wrap gap-2">
            {step.correctOrder.map((tile, i) => (
              <span
                key={`ghost-${i}`}
                className={`rounded-xl border-[1.5px] ${placedTileClass}`}
              >
                <AnnotatedJa text={tile} />
              </span>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-wrap content-start gap-2 px-4 py-2.5">
            {placed.length === 0 ? (
              <span className="self-center text-sm text-text-muted">
                {step.correctOrder.length === 1
                  ? "Tap the right tile to answer"
                  : "Tap tiles to build the sentence"}
              </span>
            ) : (
              placed.map((tile, i) => (
                <button
                  key={`${tile}-${i}`}
                  type="button"
                  disabled={submitted}
                  onClick={() => removeTile(i)}
                  className={`rounded-xl border-[1.5px] transition-colors duration-150 ${placedStateClass} ${placedTileClass}`}
                >
                  <AnnotatedJa text={tile} />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className={`relative flex flex-wrap gap-2 ${isWordBuild ? "justify-center" : ""}`}>
        {bankTiles.map((tile, i) => {
          const used = tileUsedFlags[i];
          return (
            <button
              key={`tile-${i}`}
              type="button"
              disabled={submitted || used}
              onClick={() => addTile(i)}
              onMouseEnter={() => handleTileHoverStart(i)}
              onMouseLeave={handleTileHoverEnd}
              aria-pressed={used}
              className={
                used
                  ? `rounded-xl border-[1.5px] border-border bg-surface-muted text-text-muted opacity-40 ${bankTileClass}`
                  : `rounded-xl border-[1.5px] border-border bg-surface text-text-primary transition-colors duration-150 hover:border-accent disabled:opacity-50 ${bankTileClass}`
              }
            >
              <AnnotatedJa text={tile} hideHelper={fadeTiles && !revealedTiles.has(i)} />
            </button>
          );
        })}
      </div>
      </div>

      {/* Single bottom-anchored block: wrong-answer banner + CTA live
          together so the button NEVER moves on submit — the banner grows
          the block upward while the CTA stays pinned. Correct answers
          celebrate via toast only (no banner, no shift). */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6">
        {celebrating && <CelebrationToast text={celebrationText} />}
        {submitted && !isCorrect && (
          <Feedback
            correct={false}
            correctAnswer={
              <span lang="ja">
                {step.correctOrder.join(step.granularity === "character" ? "" : " ")}
              </span>
            }
          />
        )}
        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            label="Check"
            disabled={placed.length === 0}
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
