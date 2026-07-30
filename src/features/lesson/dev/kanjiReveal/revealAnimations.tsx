import type { ReactNode } from "react";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import type { JapaneseAnnotation } from "@/shared/japanese/types";
import { KanjiWordStrokeDraw } from "@/shared/glyphs/KanjiStrokeDraw";
import {
  useRevealKeyframes,
  useRevealPhase,
} from "@/features/lesson/components/steps/kanjiReveal/revealKeyframes";
// The chosen sequence now backs a real step type, so the gallery imports the
// SHIPPED component rather than keeping its own copy — otherwise the candidate
// Spencer signed off on and the one learners get could drift apart.
import { RevealChoreo } from "@/features/lesson/components/steps/kanjiReveal/KanjiRevealAnimation";

/**
 * Candidate animations for the kana→kanji reveal — step 1 of the two-step
 * switchover beat (Spencer picked variant C on 2026-07-29 and asked for the
 * reveal to be ONE animated step, with a sentence question as step 2).
 *
 * Shared constraints every candidate is held to:
 *  1. It must END on the form the learner sees from now on. Most of them
 *     therefore hand off to the real `AnnotatedText` for the resting frame, so
 *     what is on screen when the Continue button lights up is the production
 *     renderer, not a mock of it.
 *  2. Nothing may be graded here. The retrieval is step 2. (The counter-case is
 *     on record — `docs/kanji-switchover-distributed-spec-2026-07-28.md` §6c,
 *     where both simulated learners tapped past an ungraded reveal. That is why
 *     each candidate reports whether it can gate its own Continue.)
 *  3. Transform/opacity/clip-path only, and `prefers-reduced-motion` snaps to
 *     the end state rather than skipping the reveal.
 */

export type RevealWord = {
  kana: string;
  kanji: string;
  gloss: string;
  /** Per-character sense. `null` where no honest standalone gloss exists. */
  parts: { glyph: string; sense: string | null }[];
  /** A sentence the learner can already read, containing the word. */
  sentence: { segments: JapaneseAnnotation[]; en: string };
  /** Index into `sentence.segments` of the word that switches. */
  targetIndex: number;
};

export type RevealProps = {
  word: RevealWord;
  replayKey: number;
  /** Fires when the sequence finishes — the gate for a "Continue" button. */
  onDone?: () => void;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Wipes and erases use LINEAR, never `EASE`.
 *
 * `EASE` is a strong ease-out — correct for something that flies in and settles,
 * and wrong for a clip-path wipe: it is 67% complete at 20% of its duration and
 * 92% at 40%, so an "erase" reads as the text blinking out and then the stage
 * sitting empty for the rest of the phase. A wipe has to look like one steady
 * hand crossing the word, which is exactly linear. (Measured, after the choreo
 * sequence showed a dead frame in capture.)
 */
const WIPE_EASE = "linear";

function Stage({ children, height = 200 }: { children: ReactNode; height?: number }) {
  return (
    <div
      className="relative flex w-full items-center justify-center overflow-hidden"
      style={{ height }}
    >
      {children}
    </div>
  );
}

function Gloss({ text, delayMs }: { text: string; delayMs: number }) {
  return (
    <p
      data-krv
      className="text-sm text-text-secondary"
      style={{
        animation: `krv-fade-up 320ms ${EASE} ${delayMs}ms both`,
      }}
    >
      {text}
    </p>
  );
}

// ---------------------------------------------------------------------------
// 1 · STROKES — the kanji writes itself.
// ---------------------------------------------------------------------------

/**
 * Real KanjiVG stroke data (`src/shared/glyphs/data/kanji.json`, all 147
 * catalog glyphs), drawn with CSS `stroke-dashoffset`. The kana stays on screen
 * the whole time as the anchor: this is not a new word, it is that word being
 * written.
 *
 * Cost note: this is the only candidate that needed new data, and it is now
 * built — so it is no longer the expensive option it looked like.
 */
export function RevealStrokes({ word, replayKey, onDone }: RevealProps) {
  useRevealKeyframes();
  // 友達 is 4+12 strokes ≈ 3.2s; a 1-stroke word would be ~0.5s. The phase
  // budget is deliberately generous so the slowest word in the catalog still
  // finishes before `done` fires.
  const { phase } = useRevealPhase([600, 3400, 400], replayKey, onDone);

  return (
    <div className="space-y-2 text-center">
      <Stage height={190}>
        <div className="flex flex-col items-center gap-3">
          <div
            data-krv
            className="text-xl tracking-widest text-text-muted"
            style={{ animation: `krv-fade-in 300ms ${EASE} both` }}
          >
            {word.kana}
          </div>
          {phase >= 1 && (
            <KanjiWordStrokeDraw
              word={word.kanji}
              size={96}
              replayKey={replayKey}
              className="text-text-primary"
            />
          )}
        </div>
      </Stage>
      {phase >= 2 && <Gloss text={word.gloss} delayMs={0} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2 · RUBY — the kana becomes the furigana.
// ---------------------------------------------------------------------------

/**
 * The literal one. The kana starts full size in the centre, then shrinks and
 * rises into ruby position while the kanji fades in beneath it. The end frame
 * IS the going-forward form, produced by `AnnotatedText` — so the animation
 * doesn't describe the new behaviour, it performs it.
 *
 * Of the candidates this is the only one whose motion carries the actual
 * information ("the thing you have been reading is now the small thing on
 * top"), which is why it is half of the recommended combo below.
 */
export function RevealRuby({ word, replayKey, onDone }: RevealProps) {
  useRevealKeyframes();
  const { phase } = useRevealPhase([500, 760, 300], replayKey, onDone);
  const settled = phase >= 2;

  return (
    <div className="space-y-2 text-center">
      <Stage height={190}>
        {settled ? (
          <div
            data-krv
            className="text-6xl leading-tight"
            style={{ animation: `krv-fade-in 200ms linear both` }}
          >
            <AnnotatedJa
              segments={[{ surface: word.kanji, reading: word.kana }]}
              forceShowHelper
            />
          </div>
        ) : (
          <div className="relative flex h-full w-full items-center justify-center">
            {/* Kana: centre → ruby slot. transform-only, so no reflow. */}
            <div
              data-krv
              className="absolute text-5xl tracking-wide"
              style={{
                animation:
                  phase >= 1
                    ? `krv-demote-kana 760ms ${EASE} both`
                    : `krv-fade-in 300ms ${EASE} both`,
              }}
            >
              {word.kana}
            </div>
            {phase >= 1 && (
              // Two nodes on purpose: the animation owns `transform`, so the
              // resting offset has to live on a wrapper or the keyframe wipes
              // it out on the first frame.
              <div className="absolute" style={{ transform: "translateY(14px)" }}>
                <div
                  data-krv
                  className="text-6xl font-medium"
                  style={{ animation: `krv-emerge 620ms ${EASE} 180ms both` }}
                >
                  {word.kanji}
                </div>
              </div>
            )}
          </div>
        )}
      </Stage>
      {phase >= 2 && <Gloss text={word.gloss} delayMs={80} />}
      {/* Scoped here rather than in the shared sheet: the travel distance is
          tied to this stage's height, so it does not generalize. */}
      <style>{`
        @keyframes krv-demote-kana {
          from { transform: translateY(0) scale(1); opacity: 1; }
          to   { transform: translateY(-46px) scale(0.36); opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3 · ASSEMBLE — components slide together.
// ---------------------------------------------------------------------------

/**
 * WaniKani-flavoured. Each character enters from its own side carrying its
 * sense, then they close up into the word and the part-labels fade.
 *
 * This is the candidate that exposes the honesty problem the design doc flagged
 * (§8.5): 友 = friend is clean, 達 is a pluralising suffix with no useful
 * standalone sense. `sense: null` renders a visible "—" rather than inventing
 * folk etymology, which makes the gap legible instead of hiding it. On a
 * single-character word there is nothing to assemble and it degrades to a pop.
 */
export function RevealAssemble({ word, replayKey, onDone }: RevealProps) {
  useRevealKeyframes();
  const { phase } = useRevealPhase([560, 620, 340], replayKey, onDone);
  const chars = [...word.kanji];

  return (
    <div className="space-y-2 text-center">
      <Stage height={190}>
        <div className="flex flex-col items-center gap-4">
          <div
            data-krv
            className="text-lg tracking-widest text-text-muted"
            style={{ animation: `krv-fade-in 260ms ${EASE} both` }}
          >
            {word.kana}
          </div>
          <div
            className="flex items-end justify-center"
            style={{ gap: phase >= 1 ? 2 : 22, transition: `gap 620ms ${EASE}` }}
          >
            {chars.map((c, i) => {
              const part = word.parts.find((p) => p.glyph === c);
              const fromLeft = i < chars.length / 2;
              return (
                <div key={`${c}-${i}`} className="flex flex-col items-center">
                  <span
                    data-krv
                    className="text-5xl leading-none"
                    style={{
                      animation:
                        chars.length === 1
                          ? `krv-pop 520ms ${EASE} both`
                          : `${fromLeft ? "krv-in-left" : "krv-in-right"} 520ms ${EASE} ${i * 90}ms both`,
                    }}
                  >
                    {c}
                  </span>
                  {phase < 2 && (
                    <span
                      data-krv
                      className="mt-2 text-[11px] text-text-muted"
                      style={{
                        animation: `krv-fade-in 300ms linear ${300 + i * 90}ms both`,
                      }}
                    >
                      {part?.sense ?? "—"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Stage>
      {phase >= 2 && <Gloss text={word.gloss} delayMs={0} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4 · SENTENCE — the swap happens in place, in a sentence.
// ---------------------------------------------------------------------------

/**
 * The only candidate that shows the switchover as the learner will actually
 * meet it: inside a sentence, with everything else unchanged. A highlight sweep
 * marks the one word that is about to change, it flips, and furigana appears.
 *
 * Its claim is the "brace yourself" job the steady learner in the simulation
 * said mattered most (§6e) — it names the change without teaching anything, and
 * it is the cheapest to author because the sentence already exists.
 */
export function RevealSentence({ word, replayKey, onDone }: RevealProps) {
  useRevealKeyframes();
  const { phase } = useRevealPhase([700, 520, 620, 300], replayKey, onDone);
  const kanaSegments = word.sentence.segments.map((s, i) =>
    i === word.targetIndex ? { ...s, surface: word.kana, reading: word.kana } : s,
  );

  return (
    <div className="space-y-3 text-center">
      <Stage height={190}>
        <div className="w-full space-y-4">
          <div className="relative mx-auto w-fit text-3xl leading-relaxed">
            {phase < 2 ? (
              <>
                {/* No `hideHelper` — the page wraps itself in a
                    LessonModuleProvider at the word's kanji module, so the
                    romaji ladder is already off the way it is in a real m19+
                    lesson. Suppressing it locally instead would hide the fact
                    that the provider is doing the work. */}
                <AnnotatedJa segments={kanaSegments} />
                {phase >= 1 && (
                  <span
                    data-krv
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -inset-x-2 bg-gradient-to-r from-transparent via-sky-400/35 to-transparent"
                    style={{ animation: `krv-sweep 520ms linear both` }}
                  />
                )}
              </>
            ) : (
              <span
                data-krv
                style={{ animation: `krv-fade-in 260ms linear both` }}
                className="inline-block"
              >
                <AnnotatedJa segments={word.sentence.segments} forceShowHelper />
              </span>
            )}
          </div>
          {phase >= 3 && (
            <p
              data-krv
              className="text-sm text-text-secondary"
              style={{ animation: `krv-fade-up 300ms ${EASE} both` }}
            >
              {word.sentence.en}
            </p>
          )}
        </div>
      </Stage>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5 · INK — a brush wipe writes over the kana.
// ---------------------------------------------------------------------------

/**
 * `clip-path` wipe left→right: the kana is underneath, the kanji paints over
 * it. Cheapest of the lot (one property, no data, no per-word authoring) and it
 * reads as "being written" without needing stroke data.
 *
 * Weakness worth being blunt about: the motion is pure decoration. Nothing
 * about a left-to-right wipe tells the learner anything the plain end frame
 * would not — compare candidate 2, where the movement is the lesson.
 */
export function RevealInk({ word, replayKey, onDone }: RevealProps) {
  useRevealKeyframes();
  const { phase } = useRevealPhase([520, 700, 320], replayKey, onDone);
  return (
    <div className="space-y-2 text-center">
      <Stage height={190}>
        <div className="relative flex h-full w-full items-center justify-center">
          <span
            data-krv
            className="absolute text-4xl tracking-widest text-text-muted"
            style={{
              animation:
                phase >= 1
                  ? `krv-fade-out 500ms linear 150ms both`
                  : `krv-fade-in 280ms ${EASE} both`,
            }}
          >
            {word.kana}
          </span>
          {phase >= 1 && (
            <span
              data-krv
              className="absolute text-6xl font-medium"
              style={{ animation: `krv-wipe 700ms ${WIPE_EASE} both` }}
            >
              {word.kanji}
            </span>
          )}
        </div>
      </Stage>
      {phase >= 2 && <Gloss text={word.gloss} delayMs={0} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6 · COMBO — ruby demote, then the kanji writes itself. (recommended)
// ---------------------------------------------------------------------------

/**
 * The two candidates that do real work, in the order that makes each one's job
 * clear: the kana demotes to ruby (binding: same word, new baseline), then the
 * kanji draws itself under it (shape: this is what it is made of). Ends on the
 * real `AnnotatedText`.
 *
 * ~3.5s for 友達 — the longest option here, and the reason a duration readout
 * sits next to every candidate on the gallery page. A beat this long is only
 * affordable once per word, which is exactly the budget the beat has.
 */
export function RevealCombo({ word, replayKey, onDone }: RevealProps) {
  useRevealKeyframes();
  const { phase } = useRevealPhase([460, 700, 3200, 300], replayKey, onDone);

  return (
    <div className="space-y-2 text-center">
      <Stage height={210}>
        {phase >= 3 ? (
          <div
            data-krv
            className="text-6xl leading-tight"
            style={{ animation: `krv-fade-in 200ms linear both` }}
          >
            <AnnotatedJa
              segments={[{ surface: word.kanji, reading: word.kana }]}
              forceShowHelper
            />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* `transform: scale` rather than a font-size transition — scaling
                text by font-size relayouts the column on every frame and drags
                the strokes below it around with it. */}
            <div
              className="text-5xl tracking-wide"
              style={{
                transformOrigin: "center bottom",
                transform: phase >= 1 ? "scale(0.34)" : "scale(1)",
                opacity: phase >= 1 ? 0.7 : 1,
                transition: `transform 700ms ${EASE}, opacity 700ms ${EASE}`,
              }}
            >
              {word.kana}
            </div>
            {/* Height is reserved before the strokes mount so the kana does not
                jump when they appear. */}
            <div style={{ height: 92 }}>
              {phase >= 2 && (
                <KanjiWordStrokeDraw
                  word={word.kanji}
                  size={92}
                  replayKey={replayKey}
                />
              )}
            </div>
          </div>
        )}
      </Stage>
      {phase >= 3 && <Gloss text={word.gloss} delayMs={80} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7 · CHOREO — erase the kana, assemble the kanji, the kana returns as furigana.
// ---------------------------------------------------------------------------

/**
 * Spencer's sequence (2026-07-29): *"ink wipe for 5 where it unwipes the
 * tomodachi kana, then 3 the components slide together, then unwipe tomodachi on
 * top in the furigana."*
 *
 * Four beats, one continuous left-to-right gesture:
 *   1. ともだち sits on the baseline.
 *   2. It is ERASED off the baseline (`krv-erase`).
 *   3. 友 and 達 slide in from the sides and close up into 友達 — which lands on
 *      the exact spot the kana just vacated.
 *   4. ともだち WIPES BACK IN (`krv-wipe`, the same direction), one slot higher,
 *      at furigana size.
 *
 * Why this beats candidates 2, 3 and 5 individually: it is the only one where
 * the kana's *departure from the baseline* and its *return as ruby* are separate
 * events, so the motion states the whole rule — this word keeps its sound, gives
 * up the baseline to the kanji, and moves upstairs. Candidate 2 asserts that in
 * one continuous shrink; here it is spelled out, and the vacated-then-occupied
 * baseline is what makes it legible.
 *
 * The furigana slot is reserved from the first frame even though it is empty
 * until beat 4, so the kanji lands exactly where the kana was and nothing on
 * screen ever jumps. That reserved-empty-slot is doing real work — without it
 * the kana sits centred, and the arrival of the ruby shoves the whole word down
 * at the last moment, which reads as a layout bug rather than as choreography.
 */
// ---------------------------------------------------------------------------
// Step 2's opening — the in-place swap, handing off to the real graded step.
// ---------------------------------------------------------------------------

/**
 * Plays the sentence swap and then gets out of the way: the kana sentence the
 * learner can already read, a highlight sweep over the one word that is about to
 * change, the swap, done. No English line and no gloss — this is an INTRO to a
 * graded step, not a step of its own, so it must end on exactly the frame the
 * real `multiple_choice` prompt renders and then hand over.
 *
 * `furiganaOn` is threaded through rather than hardcoded so the last frame here
 * and the first frame of the graded step agree. Ending on furigana and then
 * cutting to a bare prompt would pop, and would also hand the learner the
 * reading they are about to be tested on.
 *
 * The typography is deliberately copied from `MultipleChoiceStepView`'s prompt —
 * `text-xl font-semibold`, left-aligned in a flex row — and NOT centred at the
 * size a reveal wants to be. A first pass rendered it 3xl and centred, and the
 * handoff visibly jumped the sentence to a different size and side of the card.
 * The whole point of an intro animation is that the learner cannot tell where it
 * ends, so this must track that view if it ever restyles.
 */
export function SentenceSwapIntro({
  word,
  replayKey,
  furiganaOn,
  onDone,
}: RevealProps & { furiganaOn: boolean }) {
  useRevealKeyframes();
  const { phase } = useRevealPhase([760, 520, 560], replayKey, onDone);

  const kanaSegments = word.sentence.segments.map((s, i) =>
    i === word.targetIndex ? { ...s, surface: word.kana, reading: word.kana } : s,
  );
  const kanjiSegments = word.sentence.segments.map((s, i) => {
    if (i !== word.targetIndex) return s;
    return furiganaOn ? { ...s, furiganaWindowOpen: true } : { ...s, reading: s.surface };
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="relative w-fit text-xl font-semibold text-text-primary">
        {phase < 2 ? (
          <>
            <AnnotatedJa segments={kanaSegments} />
            {phase >= 1 && (
              <span
                data-krv
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -inset-x-2 bg-gradient-to-r from-transparent via-sky-400/35 to-transparent"
                style={{ animation: `krv-sweep 520ms linear both` }}
              />
            )}
          </>
        ) : (
          <span
            data-krv
            className="inline-block"
            style={{ animation: `krv-fade-in 260ms linear both` }}
          >
            <AnnotatedJa segments={kanjiSegments} forceShowHelper={furiganaOn} />
          </span>
        )}
      </h2>
    </div>
  );
}

export type RevealCandidate = {
  id: string;
  label: string;
  /** Rough wall time in ms, for the readout — measured against 友達. */
  approxMs: number;
  /** What the motion itself teaches, as opposed to what the end frame shows. */
  motionCarries: string;
  cost: string;
  risk: string;
  /** Can this candidate hold its own Continue until the reveal finishes? */
  gatesContinue: boolean;
  Component: (props: RevealProps) => ReactNode;
};

export const REVEAL_CANDIDATES: RevealCandidate[] = [
  {
    id: "choreo",
    label: "7 · Erase kana → assemble kanji → kana returns as furigana  ⭐ Spencer's sequence",
    approxMs: 2720,
    motionCarries:
      "The complete rule, as three separate events: the word gives up the baseline, the kanji takes it, the sound moves upstairs. Nothing else here separates the departure from the return.",
    cost:
      "Component senses authored per word (~112, same as candidate 3) — and only those. No stroke data needed, so it is cheaper than 6 and richer than 2.",
    risk:
      "Inherits candidate 3's honesty problem: 達 has no standalone sense and shows '—' mid-sequence. Erasing a word the learner knows may also read as 'wrong' for a beat before the kanji arrives.",
    gatesContinue: true,
    Component: RevealChoreo,
  },
  {
    id: "combo",
    label: "6 · Ruby demote → stroke draw",
    approxMs: 4660,
    motionCarries:
      "Both halves: the kana visibly becomes the furigana (binding), then the kanji is built stroke by stroke (shape).",
    cost: "Stroke data is built (147 glyphs, 120 KB lazy chunk). No per-word authoring — component glosses are not used.",
    risk:
      "Longest option at ~4.7s for 友達, and stroke order is production knowledge we never test. Superseded by 7 unless the stroke-by-stroke writing is the part you want.",
    gatesContinue: true,
    Component: RevealCombo,
  },
  {
    id: "ruby",
    label: "2 · Kana demotes to furigana",
    approxMs: 1560,
    motionCarries:
      "The whole lesson. The thing the learner has been reading physically moves into the ruby slot and the kanji takes the baseline.",
    cost: "Zero new data, zero authoring. Pure transform.",
    risk:
      "Teaches the binding but never the shape — the learner sees 友達 without ever looking at 友 or 達 as parts.",
    gatesContinue: true,
    Component: RevealRuby,
  },
  {
    id: "strokes",
    label: "1 · The kanji writes itself",
    approxMs: 4400,
    motionCarries:
      "Shape and stroke order. Says nothing about the kana relationship beyond keeping it on screen.",
    cost: "Needed `kanji.json` — now built and registered, so this is done.",
    risk:
      "Stroke order is production knowledge, and kanji production is explicitly out of scope (recognition-only policy). Risks implying a skill we never test.",
    gatesContinue: true,
    Component: RevealStrokes,
  },
  {
    id: "sentence",
    label: "4 · In-place swap, inside a sentence",
    approxMs: 2140,
    motionCarries:
      "That exactly one thing changed and everything else is unaffected — the 'brace yourself' job.",
    cost: "Zero — the sentence already exists in the lesson.",
    risk:
      "Teaches nothing about the form itself. Best case it is a warning, not a lesson; the retrieval in step 2 has to carry all the weight.",
    gatesContinue: true,
    Component: RevealSentence,
  },
  {
    id: "assemble",
    label: "3 · Components slide together",
    approxMs: 1520,
    motionCarries: "Decomposition — that the word is made of separable pieces.",
    cost: "Component senses must be authored per word (~112) and audited for honesty.",
    risk:
      "Only honest for some words. 達 has no useful standalone sense and renders '—', which is the truthful outcome but looks like a bug.",
    gatesContinue: true,
    Component: RevealAssemble,
  },
  {
    id: "ink",
    label: "5 · Ink wipe",
    approxMs: 1540,
    motionCarries: "Nothing. It is decoration over a crossfade.",
    cost: "Zero. One `clip-path`.",
    risk:
      "Cheapest and least informative. Kept in the gallery as the control: if a candidate can't beat this, its motion isn't earning its runtime.",
    gatesContinue: true,
    Component: RevealInk,
  },
];
