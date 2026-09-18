import { useState, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { seededShuffle } from "@/shared/utils/seededShuffle";
import type { ListeningBuildStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { playStepAudio, useCurrentStepId } from "../../hooks/useStepAudioGuard";
import { SortableBuildTiles } from "./SortableBuildTiles";
import { Tile } from "../tiles/Tile";
import { TileTray, tileRowAttrs } from "../tiles/TileTray";
import {
  BuildTileSurface,
  useBuildTileKanji,
  useTileRomajiPeek,
} from "./BuildTileSurface";
import { playSfx } from "@/shared/audio/sfx";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { formatPrompt } from "../formatPrompt";
import { ListenPromptHeader } from "./ListenPromptHeader";
import { logTileTap } from "@/shared/telemetry/sessionLog";
import { useSpentTileCollapse } from "../../hooks/useSpentTileCollapse";
import {
  useBoundedAnswerTray,
  useScrollNewestAnswerTileIntoView,
} from "../../hooks/useBoundedAnswerTray";

const CELEBRATE_MS = 1100;

/** Golden-learner replay (2026-09-17, lane A2d) — same localStorage key +
 *  shape `src/shared/dev/simProbe.ts`'s `readFontScaleSetting` reads, read
 *  directly (not via `useSettings()`) so this view doesn't take on a
 *  `SettingsContext` dependency just for one telemetry field. */
function readFontScalePct(): number {
  if (typeof window === "undefined") return 100;
  try {
    const raw = window.localStorage.getItem("open-lingo-settings");
    const parsed = raw ? JSON.parse(raw) : null;
    const v = parsed?.accessibility?.fontSize;
    return typeof v === "number" && Number.isFinite(v) ? Math.round(v * 100) : 100;
  } catch {
    return 100;
  }
}

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
  // TestFlight #127: registers this step as "current" so a play tap whose
  // network fetch outlives the step (a fast advance) can tell it's stale
  // once the clip resolves — see useStepAudioGuard's doc comment.
  useCurrentStepId(step.id);
  // Bank INDICES, not texts — with duplicate glyphs (いいえ has two い)
  // text-tracking ghosted the leftmost instance instead of the tile the
  // learner actually clicked (Spencer 2026-06-13).
  const [placedIdx, setPlacedIdx] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  // Golden-learner replay (2026-09-17, lane A2d) — see the matching ref in
  // BuildSentenceStepView.tsx; this component also remounts per step.
  const stepMountedAtRef = useRef(Date.now());

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

  // GHOST follow-up (2026-09-18, Spencer's standing "one behaviour across
  // EVERY build-type surface" rule, #137): the same pending->fade-to-
  // invisible collapse `BuildSentenceStepView`'s bank tiles get. Unused in
  // the `isSingleAnswerPicker` render branch below (that branch never reads
  // `bankCollapse`), same as `BuildSentenceStepView` calling it unconditionally.
  const bankCollapse = useSpentTileCollapse(placedIdx);

  // P3 residual (2026-09-18, lane LONGANS, T18) — same fix, same reasoning
  // as `BuildSentenceStepView`'s call: see `useBoundedAnswerTray`'s doc
  // comment. This is the view the repro route (`ja-m42-neo-challenge?step=11`,
  // a 21-tile answer) actually renders.
  const rootRef = useRef<HTMLDivElement>(null);
  useBoundedAnswerTray(rootRef, step.id);
  useScrollNewestAnswerTileIntoView(rootRef, placedIdx.length);

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

  // Golden-learner replay (2026-09-17, lane A2d, docs/golden-replay-2026-09-17.md).
  function emitTileTap(source: "bank" | "answer", label: string, position: number) {
    let stepIndex = -1;
    if (typeof window !== "undefined") {
      const raw = new URLSearchParams(window.location.search).get("step");
      const parsed = raw === null ? NaN : Number(raw);
      if (Number.isFinite(parsed)) stepIndex = parsed;
    }
    logTileTap({
      lessonId: step.id,
      stepIndex,
      stepType: step.type,
      label,
      source,
      position,
      tMs: Date.now() - stepMountedAtRef.current,
      fontScalePct: readFontScalePct(),
      viewportW: typeof window !== "undefined" ? window.innerWidth : 0,
    });
  }

  function addTile(originalIndex: number) {
    if (submitted) return;
    emitTileTap("bank", bankTiles[originalIndex], isSingleAnswerPicker ? 0 : placedIdx.length);
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
    emitTileTap("answer", bankTiles[placedIdx[trayPosition]], trayPosition);
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
    void playStepAudio(step.targetSentence, step.id).then((result) => {
      // `null` = the step changed while the clip was in flight — the
      // guard already cut it off; touching `audioSilent` here would be a
      // stale update for a step that isn't on screen anymore (TestFlight
      // #127).
      if (result === null) return;
      // JA forbids synthesis by design, so a failed clip there really is
      // silence — say so instead of leaving a dead button.
      setAudioSilent(result === "silent");
    });
  }

  const hasSubmittedWrong = submitted && !isCorrect;

  return (
    <div ref={rootRef} className="relative flex flex-1 flex-col gap-5 sm:gap-7">
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
       *  shadow it visually dominated the row. Shrunk to a smaller icon
       *  (28px→20px) so it reads as a compact instruction-row control
       *  rather than a standalone hero button. Quoted meanings get
       *  auto-bolded via PromptWithEmphasis.
       *
       *  #165 (founder, build 20): now shares `ListenPromptHeader` with
       *  ListeningComprehensionStepView — the button sizes off THIS row's
       *  own text-lg/leading-snug prompt font instead of the old literal
       *  h-11/sm:h-12, so it stays a true two-line-tall floor next to
       *  whatever the prompt actually renders at. */}
      <ListenPromptHeader onPlay={handlePlay} iconSize={20} fontRem={1.125} lineHeight={1.375}>
        {/* `data-lesson-prompt`: this view renders no `<h2>` (the prompt is
            this `<p>` inside the shared ListenPromptHeader), so the sim
            harness's `promptStable` verdict — which reads
            `[data-lesson-stage] h2` — had nothing to sample here and
            reported a vacuous PASS on every listening route. simProbe's
            PROMPT_SELECTOR now also matches this attribute, so the
            "nothing moves" ruling is checked against the element the
            learner actually reads. */}
        {/* TestFlight #199 (Spencer b30): the translation reveal used to be
            a SEPARATE paragraph below the tile bank, so it inserted new
            height into the scrolling cluster on a correct submit — with
            `mt-auto` splitting the freed space either side, that pushed the
            CTA down (read as "buttons resize"). Reveal now REPLACES this
            same prompt row in place instead: same slot, same line height,
            zero new space, CTA never moves. Never shown before a correct
            submit (`#142`'s no-leak rule is unchanged — see the reveal test
            file for the "before submit" / "wrong submit" assertions). */}
        <p data-lesson-prompt="" className="text-lg leading-snug text-text-secondary">
          {submitted && isCorrect && (step.translation ?? step.prompt) ? (
            step.translation ?? step.prompt
          ) : (
            <PromptWithEmphasis text={formatPrompt(step.prompt)} />
          )}
        </p>
        {audioSilent && (
          <p role="status" className="mt-1 text-sm text-warning">
            Audio unavailable right now — the sentence is shown below the tiles.
          </p>
        )}
      </ListenPromptHeader>

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
        <TileTray
          kind="grid"
          cols={1}
          gap="tight"
          style={{ minHeight: "min(32.5rem, 44cqh)" }}
        >
          {bankTiles.map((tile, i) => {
            const isSelected = placedIdx.includes(i);
            const isAnswer = tile === step.correctOrder[0];
            return (
              /* `size="pick-fluid"`: vertical padding is height-relative, not
                 fixed. A fixed `py-6` made each option 90px, and four of them
                 plus the play button, a two-line prompt and the CTA overflow
                 the fixed lesson shell below ~900pt: at 393x852 (a 15 Pro Max
                 in Display Zoom) that shows a scrollbar, and at 375x812 the
                 last option is clipped BEHIND the Check button —
                 unreachable. The clamp lives in the primitive now. */
              <Tile
                key={`tile-${i}`}
                variant="option"
                size="pick-fluid"
                state={
                  submitted && isAnswer
                    ? "correct"
                    : submitted && isSelected
                      ? "wrong"
                      : isSelected
                        ? "selected"
                        : "idle"
                }
                disabled={submitted}
                aria-pressed={isSelected}
                onClick={() => addTile(i)}
                onMouseEnter={() => peek.hoverStart(i)}
                onMouseLeave={peek.hoverEnd}
              >
                <BuildTileSurface
                  tile={tile}
                  kanji={tileKanji.get(tile)}
                  forceHelper={peek.revealed.has(i)}
                />
              </Tile>
            );
          })}
        </TileTray>
      ) : (
      <>
      {/* Phone tier (TestFlight 2026-09-05 #3): 64px tiles at text-2xl
          wrapped an 11-tile answer to four rows, so tray + bank alone were
          690px of a 743px scroller on a 15 Pro Max. Below `sm` the tiles
          take the sentence-build tier (text-xl, py-2 ≈ 48px); the two-row
          `max-height` cap that used to answer the 690px is GONE (see THE
          ONE RESERVATION below), and that overflow is now paid by the fit
          rule's own shrink half, once, before the first tap. */}
      {/* #75 sibling parity (BuildSentenceStepView shrunk its matching
          floors -15%): min-h 64px→54px, sm:80px→68px (the ghost cap
          108px→92px from the same patch is deleted). #69 sibling parity:
          tile px-4(16)→14, py-2(8)→7,
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
      <TileTray kind="tray" variant="listen">
        {/* THE ONE RESERVATION — the full answer, in as many ROWS as the
            answer actually needs (build 25, 2026-09-17; the same ruling
            BuildSentenceStepView's tray got in the same build, see THE ONE
            RESERVATION there).

            This row used to carry `clamp`, which resolved to a literal
            `max-height: 92px` + `overflow: hidden` in index.css. The
            comment on that rule claimed "two rows on phones"; a listen row
            is 59px in Chromium and 73-75px on the 15 Pro Max, so 92px was
            1.26-1.56 rows and the reservation was SHORT by the remainder.
            Measured (Chromium 430x932 DOM probe, ja-m34-neo-5?step=12,
            6-tile answer): the ghost row's own scrollHeight was 126px
            against a clamped clientHeight of 92px, and at tap 4 — when the
            placed tiles took their second row — the tray went 120 -> 154px
            (+34, exactly the clamped-away remainder), the column
            re-centred the prompt/tray up 17px and walked the bank down
            17px. On the device the same tap moved bankTop 459.9 -> 490.9 at
            100% and, at 125%, re-triggered the stage shrink (fit 1.05 ->
            0.92, font 33.94 -> 29.73, rowH 75 -> 66.5) — `--simulate build`
            scored 7/8 and 5/8.

            A tray that starts at its final height cannot grow, so there is
            nothing left to re-centre, push or re-price. The reservation is
            expressed in the only unit that cannot go stale: the answer's
            own tiles, wrapping into the rows they need. A long answer's
            overflow is paid by the fit rule's shrink half at step start
            (planStageFill's `shrinkBy`), which is a smaller CONSTANT tile
            — the lead's stated preference over a bigger one that shrinks
            mid-build. */}
        <TileTray kind="row" layer ghost aria-hidden>
          {step.correctOrder.map((tile, i) => (
            /* A pre-sizer MUST use the same glyphs (kanji + rt) AND the same
               box as the real tiles or the tray mis-sizes — `state="ghost"`
               is a state of the primitive for exactly that reason. */
            <Tile key={`ghost-${i}`} variant="listen" slot="tray" state="ghost">
              <BuildTileSurface tile={tile} kanji={tileKanji.get(tile)} />
            </Tile>
          ))}
        </TileTray>
        {/* One row, not a row inside a row — same #185 fix as the sentence
            tray in BuildSentenceStepView (see the comment there): the
            sortable element IS the layered row, or tileFit measures the
            placed tile against a shrink-wrapped inner row and floors it. */}
        {placed.length === 0 ? (
          <TileTray kind="row" layer align="start">
            <span className="self-center text-base text-text-muted">
              Tap tiles to build what you hear
            </span>
          </TileTray>
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
            rowAttrs={tileRowAttrs({ layer: true, align: "start" })}
            tile={{ variant: "listen", slot: "tray", state: "placed" }}
          />
        )}
      </TileTray>

      {/* Tile bank — buttons ~50% bigger font + matching padding. Gap is its
          own token (`--listen-bank-gap`, default 12px) rather than
          `--tile-gap` (default 8px) — TestFlight #125's "12px vs 8px"
          bank/tray mismatch is a disclosed default, not silently changed by
          this wiring (see the index.css token-block comment). */}
      <TileTray kind="bank" variant="listen">
        {bankTiles.map((tile, i) => {
          const used = tileUsedFlags[i];
          return (
            <Tile
              key={`tile-${i}`}
              variant="listen"
              slot="bank"
              state={used ? "spent" : "idle"}
              disabled={submitted || used}
              onClick={() => addTile(i)}
              onMouseEnter={() => peek.hoverStart(i)}
              onMouseLeave={peek.hoverEnd}
              aria-pressed={used}
              aria-label={t(
                "lesson.build.a11y.bankTileLabel",
                "{{word}}, {{state}}, position {{position}} of {{total}}",
                {
                  word: tile,
                  state: used
                    ? t("lesson.build.a11y.stateSpent", "used")
                    : t("lesson.build.a11y.stateAvailable", "available"),
                  position: i + 1,
                  total: bankTiles.length,
                },
              )}
              // GHOST follow-up (2026-09-18, P2 accessibility ruling — same
              // wiring as BuildSentenceStepView's bank tile): a spent slot is
              // a geometry placeholder, not a control; aria-hidden removes
              // the whole subtree (including the button role) from the a11y
              // tree without touching DOM order or the remaining tiles'
              // VoiceOver order. aria-pressed/aria-label stay (inert once
              // hidden).
              aria-hidden={used || undefined}
              collapse={bankCollapse[i]}
            >
              <BuildTileSurface
                tile={tile}
                kanji={tileKanji.get(tile)}
                forceHelper={peek.revealed.has(i)}
              />
            </Tile>
          );
        })}
      </TileTray>
      </>
      )}
      {/* TestFlight #142's translation reveal ("use the space: show the
          English when they get it right") now lives IN the prompt row
          above (see the comment there) instead of here — #199 moved it so
          it reuses existing space rather than growing the cluster. */}
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
