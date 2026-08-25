import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { seededShuffle } from "@/shared/utils/seededShuffle";
import { expandAcceptedAnswers } from "./translateVariants";
import { normalizeTypedAnswer } from "@/shared/speech";
import { getTrayOverride } from "../../data/devGates";
import type { BuildSentenceStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { useAutoPlayJaAudio, getTtsUrl, playJaAudio } from "@/shared/tts";
import { SortableBuildTiles } from "./SortableBuildTiles";
import {
  BuildTileSurface,
  useBuildTileKanji,
  useTileRomajiPeek,
} from "./BuildTileSurface";
import { playSfx } from "@/shared/audio/sfx";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { ExplainButton } from "../ExplainButton";
import { notoEmojiUrl } from "@/shared/assets/notoEmoji";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { formatPrompt } from "../formatPrompt";
import { useLessonModuleIndex } from "@/shared/contexts/LessonModuleContext";

const CELEBRATE_MS = 1100;

/**
 * Shortest answer that earns the "so close" grace, in tiles.
 *
 * Spencer m31 walk 2026-08-15: "the 'so close' feature on these bigger
 * sentences, where one missing word is forgivable". The floor is the whole
 * ruling — on a four-tile answer the missing word usually IS the lesson (a
 * particle drill is exactly "which one, and is it there"), so forgiving it
 * would forgive the thing being tested. Past six tiles the sentence has
 * enough moving parts that dropping one reads as a slip, not a gap.
 */
const SO_CLOSE_MIN_TILES = 6;

/**
 * Index of the ONE target word the learner left out, or null.
 *
 * Null unless `placed` is exactly `target` with a single element deleted —
 * every other word present, in the right order. A transposition, a wrong
 * word, or two omissions all return null: this is a grace for forgetting a
 * word, not for building a different sentence.
 */
export function missingOneTileIndex(
  placed: readonly string[],
  target: readonly string[],
): number | null {
  if (placed.length !== target.length - 1) return null;
  let skipped: number | null = null;
  let p = 0;
  for (let t = 0; t < target.length; t++) {
    if (p < placed.length && placed[p] === target[t]) {
      p++;
      continue;
    }
    if (skipped !== null) return null; // a second mismatch — not one omission
    skipped = t;
  }
  return p === placed.length ? skipped : null;
}

/**
 * The person being addressed, as a picture. Vendored Noto art when we have
 * it, the device glyph otherwise — the same fallback WordImageMcqStepView
 * uses, so an un-vendored emoji degrades to a glyph instead of a broken box
 * (👵 and 🧑‍🏫 are exactly the kind of late additions that may not be
 * vendored yet).
 */
function AudienceCue({
  emoji,
  label,
  politeness,
}: {
  emoji: string;
  label: string;
  politeness?: 1 | 2 | 3;
}) {
  const [failed, setFailed] = useState(false);
  const src = notoEmojiUrl(emoji);
  return (
    <div className="flex flex-col items-center gap-1.5" title={label}>
      {!src || failed ? (
        <span role="img" aria-label={label} className="text-6xl leading-none">
          {emoji}
        </span>
      ) : (
        <img
          src={src}
          alt={label}
          width={96}
          height={96}
          loading="eager"
          onError={() => setFailed(true)}
          className="h-20 w-20 select-none object-contain sm:h-24 sm:w-24"
          draggable={false}
        />
      )}
      {politeness && (
        /* Tobira's 丁寧度 meter: three dots, filled to the level this
           audience calls for. Purely visual — the accessible name carries
           the same information for screen readers without putting prose
           on screen. */
        <div
          className="flex gap-1"
          role="img"
          aria-label={`politeness level ${politeness} of 3`}
        >
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 w-1.5 rounded-full ${
                n <= politeness ? "bg-text-primary" : "bg-text-muted/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  step: BuildSentenceStep;
  onComplete: (
    stepId: string,
    correct: boolean,
    progressTicks?: number,
    answerText?: string,
  ) => void;
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
  // "So close" grace: ONE per step. `soClose` is the amber banner currently
  // showing; `graceUsed` is the spend, so a second omission grades normally.
  // Neither implies `submitted` — the whole point is that the tray stays live
  // and the learner slots the missing word in without leaving the step.
  const [soClose, setSoClose] = useState(false);
  const [graceUsed, setGraceUsed] = useState(false);
  // Character builds (granularity === "character") hide each bank tile's
  // romaji until the learner interacts with it — otherwise the labels
  // ("su/shi/...") spell the English answer and the kana is never read
  // (Spencer 2026-06-13). A tile reveals on tap (also plays its sound) or
  // after a short hover dwell; once revealed it stays revealed. The reveal
  // FORCES the helper on (2026-07-19), so the peek also works for learners
  // whose global romaji guard already flipped off — see useTileRomajiPeek.

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

  // Gates the register widening in expandAcceptedAnswers (ungraded until
  // module 20). Tiles can rarely spell a ます form anyway — this keeps the
  // build path honest with the typed path rather than relying on that.
  const moduleIndex = useLessonModuleIndex();

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
  // Grade against the SAME leniency machinery as typed translation
  // (Spencer walk 2026-07-24: きょう これを しない — the temporal-は-drop
  // ruling — was built correctly and marked wrong because builds demanded
  // the exact tile sequence; a leftover は tile is not an error when the
  // remaining sentence is correct Japanese). Word-granularity JA builds
  // only: character builds spell ONE word (exact by definition), and
  // listening builds stay exact — you build what you HEARD, は included.
  const acceptedBuildSurfaces = useMemo(() => {
    if (step.granularity !== "word") return null;
    const target = step.correctOrder.join("");
    if (!/[぀-ヿ]/.test(target)) return null;
    // Seed from the AUTHORED sentence — its spacing carries the word
    // grouping the variant regexes key on (きょうは, not きょう|は).
    const seed = step.targetSentence?.trim() || step.correctOrder.join(" ");
    return new Set(
      expandAcceptedAnswers([seed], { moduleIndex }).map((v) =>
        normalizeTypedAnswer(v),
      ),
    );
  }, [step.correctOrder, step.granularity, step.targetSentence, moduleIndex]);
  const isCorrect =
    JSON.stringify(placed) === JSON.stringify(step.correctOrder) ||
    (acceptedBuildSurfaces !== null &&
      acceptedBuildSurfaces.has(normalizeTypedAnswer(placed.join(""))));

  // DISPLAY-ONLY kanji-fication (Spencer 2026-07-17): once the lesson's
  // module unlocks a tile word's kanji, the tile shows the kanji form
  // (furigana until FSRS-mastered). `bankTiles`/`placed`/`correctOrder`
  // and every comparison above stay the kana strings — only the painted
  // glyphs change, via `BuildTileSurface`. Character builds are excluded
  // inside the hook (kana decoding — kana IS the content).
  const tileKanji = useBuildTileKanji(
    step.tiles,
    step.granularity,
    step.targetSentence,
    step.correctOrder,
  );

  // Two independent axes (Spencer 2026-06-13):
  //  - SIZE: small banks (≤6 tiles, words or short sentences) get
  //    display-size tiles; 8+ tile sentence banks stay dense.
  //  - COMPOSITION: only character-granularity WORD builds center and
  //    show answer slots — sentences keep reading order (left-aligned),
  //    and slot outlines only align when tile widths are uniform
  //    (single kana), which sentences aren't.
  const isWordBuild = step.granularity === "character";
  // Single-answer word "builds" are an MCQ wearing tray-and-bank clothes —
  // one word placed into a one-slot tray is just a multiple-choice pick
  // (Spencer QA 2026-07-16, ja-m28-review-2: "it can be replaced with mcq
  // ... it just looks tacky"). Render these as option buttons (matching
  // MultipleChoiceStepView's visual language) instead of an empty dashed
  // tray + a bank row below it. Grading/tiles/correctOrder/shuffle/kanji
  // surfaces are all unchanged — only the paint changes.
  const isSingleAnswerPicker =
    step.granularity === "word" && step.correctOrder.length === 1;
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
  // THREE SIZE TIERS, not two (Spencer m31 walk 2026-08-15: "increase the
  // element sizes in the middle of screen to about same at listen build").
  // A 7+ tile sentence bank used to drop straight to text-base/lg, so the
  // SAME word rendered visibly smaller here than on a listening_build tile —
  // it read as a lesser step type rather than the same drill with more tiles.
  //
  // The bump is `sm:`-only, and that is the whole design. Tile size is not
  // what overflows the fixed shell — ROW COUNT is, and row count is set by
  // the container's WIDTH. Below 640px the tiers are byte-identical to what
  // shipped before, so every phone measurement is unchanged; from `sm:` up
  // there is width to spend and the tiles take listening_build's size.
  //
  // Measured at ja-m31-neo-1 (stage `scrollHeight - clientHeight`, before →
  // after): 9-tile step 375×667 0→0, 390×844 0→0, 1440×900 0→0. The 15-tile
  // step is the module's worst bank: 375×667 185→185 (pre-existing, B092
  // class), 390×844 31→31, 1280×700 0→0. That last one is why 12+ banks get
  // their OWN tier — on the 2xl tier it measured 0→87 at 1280×700, and even
  // sm:text-xl with sm:py-2 left 3px. Zero regression at every viewport.
  const hugeBank = !bigTiles && step.tiles.length >= 12;
  const denseTileClass = hugeBank
    ? "px-3.5 py-1.5 text-base font-bold sm:px-4 sm:text-xl"
    : "px-3.5 py-1.5 text-base font-bold sm:px-4 sm:py-2 sm:text-2xl";
  const bankTileClass = bigTiles
    ? "px-5 py-3 text-[clamp(1.5rem,3.4cqh,2.25rem)] font-bold"
    : denseTileClass;
  const placedTileClass = bigTiles
    ? "px-5 py-3 text-[clamp(1.5rem,3.4cqh,2.25rem)] font-bold"
    : denseTileClass;

  const handleEnter = useCallback(() => {
    if (!submitted && placed.length > 0) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, placed.length]);

  useLessonKeyboard({
    onEnter: handleEnter,
  });

  // Hover-dwell peek on character-build tiles — enabled whether or not the
  // fade setting is on, so post-cutoff learners (global romaji guard off)
  // can still peek. See useTileRomajiPeek for the force semantics.
  const peek = useTileRomajiPeek(isWordBuild);

  function addTile(originalIndex: number) {
    if (submitted) return;
    peek.reveal(originalIndex);
    if (isSingleAnswerPicker) {
      // Single-select: tapping an option REPLACES the pick (there is only
      // ever one slot), unlike the multi-tile bank's append-only tray.
      playSfx("tile");
      setPlacedIdx([originalIndex]);
      return;
    }
    if (placedIdx.includes(originalIndex)) return;
    if (fadeTiles) {
      // Tap = hear the kana (the reveal happened above). Falls back to the
      // tile click sfx when a single-mora clip isn't in the manifest.
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
    // ONE forgivable omission on a long sentence, before anything is graded.
    // Deliberately does NOT name the missing word: the grace is a second look
    // at your own tray, not the answer. Nothing is reported to the lesson —
    // no onComplete, no `submitted` — so the tray stays live and the CTA
    // stays "Check". A second miss falls through and grades normally.
    if (
      !isCorrect &&
      !graceUsed &&
      step.granularity === "word" &&
      step.correctOrder.length >= SO_CLOSE_MIN_TILES &&
      missingOneTileIndex(placed, step.correctOrder) !== null
    ) {
      setGraceUsed(true);
      setSoClose(true);
      playSfx("tile"); // not the miss chime — this is not a verdict yet
      return;
    }
    setSoClose(false);
    setSubmitted(true);
    // Report WHAT THEY BUILT, not just the verdict. The reactive grammar tip
    // only fires when the learner actually produced the tip's anti-pattern
    // (reactiveTipGate), and builds used to pass no answer text — so the gate
    // was skipped and any miss in the span got the rule card's canned ✗/✓
    // pair (Spencer m31 walk 2026-08-15: a dropped だ drew the もらう card).
    // The tray IS the answer; normalizeTypedAnswer strips the join spaces.
    onComplete(step.id, isCorrect, undefined, placed.join(" "));
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
      {/* The cluster CENTRES in the space above the action block rather than
          starting at the top. Reading order is unchanged — the prompt is still
          the first thing the eye hits — but the tray and tiles are sized to
          their content, so top-aligning them stranded ~600px of empty stage
          between the last tile and the CTA on a tall phone (Spencer QA
          2026-08-07). The action block below keeps `mt-auto`, so it stays
          bottom-anchored and the fixed action bar does not move. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
      {step.audienceEmoji && (
        /* WHO you are speaking to, drawn rather than narrated. The label is
           the accessible name only — showing it as text would restore the
           prose cue this exists to delete. */
        <AudienceCue
          emoji={step.audienceEmoji}
          label={step.audienceLabel ?? ""}
          politeness={step.politenessHint}
        />
      )}
      <h2 className={`font-semibold text-text-primary ${bigTiles ? "text-xl sm:text-2xl" : "text-lg"} ${isWordBuild || step.audienceEmoji ? "text-center" : ""}`}>
        {formatPrompt(step.prompt)}
      </h2>

      {step.hint && !submitted && (
        <p className="text-sm text-text-muted">{step.hint}</p>
      )}

      {(step.frameBefore || step.frameAfter) && (
        /* Vocative frame: the addressee is named in Japanese, so no English
           scenario line is needed. The slot fills in as soon as a tile is
           picked, which is the whole read-back — you see the sentence you
           just built, addressed to the person named in it. */
        <div className="rounded-2xl border-[1.5px] border-border bg-surface px-4 py-4 text-center text-2xl font-bold tracking-wide text-text-primary">
          <span>{step.frameBefore}</span>
          <span
            className={`mx-1 inline-block min-w-[4.5rem] rounded-lg border-b-4 px-2 ${
              placed.length
                ? "border-accent text-text-primary"
                : "border-border text-text-muted/50"
            }`}
          >
            {placed.length ? placed.join("") : "◯◯"}
          </span>
          <span>{step.frameAfter}</span>
        </div>
      )}

      {step.referenceTable && !submitted && (
        /* Stage-1 cheat sheet — same visual language as TransformRuleTable
           so the two scaffolds read as one idea across the course. */
        <div className="rounded-2xl border-[1.5px] border-border bg-surface px-4 py-3">
          <p className="mb-2 text-center text-[10.5px] font-bold uppercase tracking-widest text-text-muted">
            {step.referenceTable.label}
          </p>
          <div className="flex flex-col gap-1">
            {step.referenceTable.rows.map((r) => (
              <div
                key={`${r.cue}-${r.form}`}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-2.5 py-1.5 odd:bg-surface-muted/40"
              >
                <span className="text-sm text-text-secondary">{r.cue}</span>
                <span className="text-lg font-bold text-text-primary">
                  {r.form}
                </span>
              </div>
            ))}
          </div>
        </div>
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

      {isSingleAnswerPicker ? (
        /* MCQ-SHAPED SINGLE-ANSWER PICKER: no tray, no bank row — the
           bank tiles ARE the options, styled like MultipleChoiceStepView.
           Tap selects (replacing any prior pick); Check submits via the
           existing generic submit path below. */
        <div
          className={
            bankTiles.length === 4
              ? "relative grid grid-cols-2 grid-rows-2 auto-rows-fr gap-3 sm:gap-4"
              : "relative grid auto-rows-fr gap-3"
          }
          style={{
            // Mirror MultipleChoiceStepView's sizing exactly — the picker
            // borrowed its look but not its GRID, so a 3-option bank was
            // stretching one short word each across a tall single column
            // (Spencer 2026-07-24: "≤3 tiles render as giant rows"). The
            // distractor floor guarantees 4 options, so the 2x2 is the live
            // path; the single-column branch is the fallback.
            // MERGE 2026-07-26: heights use the mobile-scaling branch's
            // container-query units (cqh) rather than dvh — same intent,
            // and it keeps this view correct inside the scaled shell.
            minHeight:
              bankTiles.length === 4
                ? "min(40rem, 52cqh)"
                : "min(32.5rem, 44cqh)",
          }}
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
                className={`flex items-center justify-center rounded-xl border-2 px-4 py-6 text-xl font-bold transition-colors duration-150 ${optionStyle} ${submitted ? "cursor-default" : "cursor-pointer"}`}
              >
                <BuildTileSurface tile={tile} kanji={tileKanji.get(tile)} />
              </button>
            );
          })}
        </div>
      ) : showSlots ? (
        /* WORD-BUILD SLOTS (first encounters): one outlined slot per
           answer kana — pre-sized by invisible copies of the answer
           tiles, so geometry is exact and nothing ever reflows. Placed
           tiles pop into the slots left-to-right. */
        <div className="mx-auto grid w-fit max-w-full">
          <div aria-hidden className="[grid-area:1/1] flex flex-wrap gap-2">
            {step.correctOrder.map((tile, i) => (
              <span
                key={`slot-${i}`}
                className={`rounded-xl border-2 border-dashed border-border bg-surface-muted ${placedTileClass}`}
              >
                <span className="invisible">
                  <BuildTileSurface tile={tile} kanji={tileKanji.get(tile)} />
                </span>
              </span>
            ))}
          </div>
          <SortableBuildTiles
            ids={placedIdx}
            tiles={placed}
            tileKanji={tileKanji}
            disabled={submitted}
            onRemove={removeTile}
            onReorder={setPlacedIdx}
            strategy="wrap"
            className="[grid-area:1/1] flex flex-wrap gap-2"
            tileClassName={`motion-safe:animate-tile-pop rounded-xl border-2 transition-colors duration-150 ${placedStateClass} ${placedTileClass}`}
          />
        </div>
      ) : isWordBuild ? (
        /* WORD-BUILD PILL (review contexts): no length hint — a compact
           centered tray that hugs its tiles and visibly grows as they
           pop in. The zero-width ghost fixes the height (words never
           wrap), so growth is horizontal-only: nothing below moves. */
        <div className="mx-auto flex min-h-[64px] w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-border bg-surface-muted px-4 py-2">
          <span aria-hidden className={`invisible w-0 overflow-hidden !px-0 ${placedTileClass}`}>
            <BuildTileSurface
              tile={step.correctOrder[0] ?? "あ"}
              kanji={tileKanji.get(step.correctOrder[0] ?? "あ")}
            />
          </span>
          <SortableBuildTiles
            ids={placedIdx}
            tiles={placed}
            tileKanji={tileKanji}
            disabled={submitted}
            onRemove={removeTile}
            onReorder={setPlacedIdx}
            strategy="wrap"
            className="flex flex-wrap items-center justify-center gap-2"
            tileClassName={`motion-safe:animate-tile-pop rounded-xl border-[1.5px] transition-colors duration-150 ${placedStateClass} ${placedTileClass}`}
          />
        </div>
      ) : (
        /* SENTENCE TRAY: an invisible ghost of the FULL answer sets the
           tray's FLOOR, so placing the expected tiles never reflows the
           bank below. It is a floor and not a cap: the bank carries
           distractors and addTile has no length limit, so a learner can
           place more tiles than the answer has (Spencer 2026-08-18 —
           10 placed vs a 7-tile answer spilled out of the box). Ghost and
           tiles share one grid cell, so the tray height is
           max(ghost, actual) and the box grows instead of overflowing.
           Left-aligned (reading order). */
        <div className="grid min-h-[56px] sm:min-h-[72px] rounded-2xl border-[1.5px] border-dashed border-border bg-surface-muted px-4 py-2.5">
          <div aria-hidden className="[grid-area:1/1] invisible flex flex-wrap gap-2 sm:gap-2.5">
            {step.correctOrder.map((tile, i) => (
              <span
                key={`ghost-${i}`}
                className={`rounded-xl border-[1.5px] ${placedTileClass}`}
              >
                {/* Ghost sizing MUST use the same glyphs (kanji + rt) as the
                    real tiles or the tray mis-sizes. */}
                <BuildTileSurface tile={tile} kanji={tileKanji.get(tile)} />
              </span>
            ))}
          </div>
          <div className="[grid-area:1/1] flex flex-wrap content-start gap-2 sm:gap-2.5">
            {placed.length === 0 ? (
              <span className="self-center text-base text-text-muted">
                {step.correctOrder.length === 1
                  ? "Tap the right tile to answer"
                  : "Tap tiles to build the sentence"}
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
                className="flex flex-wrap content-start gap-2 sm:gap-2.5"
                tileClassName={`rounded-xl border-[1.5px] transition-colors duration-150 ${placedStateClass} ${placedTileClass}`}
              />
            )}
          </div>
        </div>
      )}

      {!isSingleAnswerPicker && (
      <div className={`relative flex flex-wrap gap-2 sm:gap-2.5 ${isWordBuild ? "justify-center" : ""}`}>
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
                  ? `rounded-xl border-[1.5px] border-border bg-surface-muted text-text-muted opacity-40 ${bankTileClass}`
                  : `rounded-xl border-[1.5px] border-border bg-surface text-text-primary transition-colors duration-150 hover:border-accent disabled:opacity-50 ${bankTileClass}`
              }
            >
              <BuildTileSurface
                tile={tile}
                kanji={tileKanji.get(tile)}
                hideHelper={fadeTiles && !peek.revealed.has(i)}
                forceHelper={peek.revealed.has(i)}
              />
            </button>
          );
        })}
      </div>
      )}
      </div>

      {/* Single bottom-anchored block: wrong-answer banner + CTA live
          together so the button NEVER moves on submit — the banner grows
          the block upward while the CTA stays pinned. Correct answers
          celebrate via toast only (no banner, no shift). */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6" data-testid="primary-cta">
        {celebrating && <CelebrationToast text={celebrationText} />}
        {!submitted && soClose && (
          <Feedback
            correct={false}
            soClose
            soCloseNote="One word is missing — add it and check again."
          />
        )}
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
