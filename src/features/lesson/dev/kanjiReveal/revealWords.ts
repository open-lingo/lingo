import type { JapaneseAnnotation } from "@/shared/japanese/types";
import { seededShuffle } from "@/shared/utils/seededShuffle";
import { buildKanjiDistractors } from "@/features/languages/ja/secondScript/kanjiDistractorPool";
import type { LessonStep } from "../../types";
import type { RevealWord } from "./revealAnimations";

/**
 * The three word SHAPES the switchover beat has to survive. Picked so a
 * candidate animation that only works on one of them fails visibly on the
 * gallery page rather than in authoring.
 *
 *   友達  two glyphs, one honest component sense (友) and one that has none (達)
 *   明日  two glyphs, BOTH already taught — the only shape where a learner can
 *         reason their way to the reading (明 bright + 日 day)
 *   猫    one glyph, nothing to decompose, nothing to infer
 *
 * Real gaps from the 2026-07-28 probe: ねこ is taught m1 and 猫 lands m19 (gap
 * 18, one of the worst in the course).
 */

export type BeatWord = RevealWord & {
  id: string;
  /** Module the word is taught in, and the module its kanji unlocks. */
  taughtModule: number;
  kanjiModule: number;
  /** Wrong English answers for step 2's MCQ mode — see `sentenceStep`. */
  distractors: string[];
};

const p = (surface: string): JapaneseAnnotation => ({
  surface,
  reading: surface,
  role: "particle",
});

export const BEAT_WORDS: BeatWord[] = [
  {
    id: "tomodachi",
    kana: "ともだち",
    kanji: "友達",
    gloss: "friend",
    taughtModule: 3,
    kanjiModule: 19,
    parts: [
      { glyph: "友", sense: "friend" },
      // Deliberately null, not "(plural)". 達 is a pluralising suffix with no
      // useful standalone sense, and the gallery should show what the honest
      // answer looks like rather than hide the problem behind a plausible gloss.
      { glyph: "達", sense: null },
    ],
    sentence: {
      segments: [
        { surface: "友達", reading: "ともだち" },
        p("と"),
        { surface: "いきます", reading: "いきます" },
      ],
      en: "I'll go with a friend.",
    },
    targetIndex: 0,
    distractors: [
      "I'll go with my family.",
      "I'll go with my teacher.",
      "I'll go with a student.",
    ],
    },
  {
    id: "ashita",
    kana: "あした",
    kanji: "明日",
    gloss: "tomorrow",
    taughtModule: 5,
    kanjiModule: 22,
    parts: [
      { glyph: "明", sense: "bright" },
      { glyph: "日", sense: "day / sun" },
    ],
    sentence: {
      segments: [
        { surface: "明日", reading: "あした" },
        { surface: "いきます", reading: "いきます" },
      ],
      en: "I'll go tomorrow.",
    },
    targetIndex: 0,
    // All four options are "I'll go —": only the time word varies. An earlier
    // draft used "I went yesterday", which changes the tense as well, so the
    // learner could rule it out without reading 明日 — the exact §6f failure.
    distractors: ["I'll go today.", "I'll go every day.", "I'll go in the morning."],
    },
  {
    id: "neko",
    kana: "ねこ",
    kanji: "猫",
    gloss: "cat",
    taughtModule: 1,
    kanjiModule: 19,
    parts: [{ glyph: "猫", sense: null }],
    sentence: {
      segments: [
        { surface: "猫", reading: "ねこ" },
        p("が"),
        { surface: "います", reading: "います" },
      ],
      en: "There's a cat.",
    },
    targetIndex: 0,
    distractors: ["There's a fish.", "There's a flower.", "There's a car."],
    },
];

/**
 * Step 2 of the beat — the sentence question.
 *
 * Two things about it are load-bearing, and both come from
 * `kanji-switchover-distributed-spec-2026-07-28.md` §6f, which found that an
 * underspecified option set silently changes what is being tested:
 *
 *  1. **The distractors vary ONLY at the switched word.** Every option here is
 *     "I'll go with —", so the frame carries no information and the learner
 *     cannot get it by elimination. Vary the verb or the particle too and the
 *     step becomes solvable without reading 友達 at all.
 *  2. **Furigana on the target word is OFF.** This is the one place in the
 *     course where that happens inside the unlock window — everywhere else the
 *     unlock+2 rule keeps it on. The reveal just taught the reading three
 *     seconds ago; if it is floating above the word the step tests nothing.
 *     `furiganaOn` exists so that claim can be felt rather than argued about.
 */
export function sentenceStep(word: BeatWord, furiganaOn: boolean): LessonStep {
  const segments = word.sentence.segments.map((seg, i) => {
    if (i !== word.targetIndex) return seg;
    return furiganaOn
      ? { ...seg, furiganaWindowOpen: true }
      : // reading === surface leaves the renderer nothing to float.
        { ...seg, reading: seg.surface };
  });

  const stepId = `krv-s-${word.id}-${furiganaOn ? "furi" : "bare"}`;
  // `MultipleChoiceStepView` renders options in authored order — there is no
  // render-time shuffle for MCQs (unlike build-tile banks). Correct-first would
  // make the whole gallery tappable without reading, so seed a shuffle on the
  // step id: stable across re-renders, different per word.
  const options = seededShuffle(
    [word.sentence.en, ...word.distractors],
    stepId,
  ).map((text, i) => ({ id: `krv-s-${word.id}-o${i}`, text }));
  const correct = options.find((o) => o.text === word.sentence.en)!;

  return {
    id: stepId,
    type: "multiple_choice",
    prompt: word.sentence.en,
    promptAnnotation: segments,
    options,
    correctOptionId: correct.id,
    optionsHideRomaji: true,
  } as LessonStep;
}

/**
 * Step 2, cloze mode — Spencer 2026-07-29: *"maybe we want to make it a particle
 * cloze sentence build step instead of the sentence mcq and they can pick the
 * right kanji? becomes more effective after they have a few kanji."*
 *
 * Hosted on **`fill_blank`**, which is the step type CLAUDE.md lists as unused
 * with a standing "adopt or retire" decision — this adopts it. `particle_cloze`
 * was the other candidate and is worse here: its `prompt: {before, after}` are
 * plain strings, so the rest of the sentence cannot carry annotations, and its
 * view is particle-framed.
 *
 * Three things this step gets right, each for a reason that bit an earlier draft:
 *
 *  1. **The English cue is required, not decoration.** "___ といきます" is
 *     satisfied by friend, family, teacher OR student — the Japanese frame does
 *     not constrain the answer at all. Without the cue the step is unanswerable;
 *     with it, the learner must read the tiles to find the one meaning "friend".
 *  2. **`wordBankHideHelper`.** Bank tiles render through `AnnotatedText` in bare
 *     mode, which floats each word's kana above it. Left on, the bank reads
 *     ともだち / かぞく / せんせい / がくせい and no kanji is read at all.
 *  3. **The answer is the only tile carrying the switched word.** Distractors are
 *     other words' kanji, never 友達 in a step about 友達.
 *
 * SCOPE: distractors are drawn from real course-registry words by SHAPE, and may
 * use kanji the learner has never met (Spencer 2026-07-29). See
 * `kanjiDistractorPool.ts` for the pool, the numbers, and the honest note on what
 * unknown-kanji distractors do and do not test. That relaxation is what makes the
 * step viable from the first switchover: under the old already-taught-only rule
 * the pool was 0 words at m8.
 */
export function kanjiClozeStep(
  word: BeatWord,
  opts: { shareGlyph?: boolean } = {},
): LessonStep {
  const before = word.sentence.segments
    .slice(0, word.targetIndex)
    .map((s) => s.surface)
    .join("");
  const after = word.sentence.segments
    .slice(word.targetIndex + 1)
    .map((s) => s.surface)
    .join("");

  const stepId = `krv-cloze-${word.id}${opts.shareGlyph ? "-hard" : ""}`;
  const distractors = buildKanjiDistractors(word.kanji, word.kana, 3, stepId, {
    ...opts,
    excludeGloss: word.gloss,
  });
  return {
    id: stepId,
    type: "fill_blank",
    sentence: `${before}{{blank}}${after}`,
    // The cue. `hint` is the only slot FillBlankStepView offers for it, and it
    // renders small and muted — fine for a gallery, but a shipped version wants
    // it promoted to the prompt position.
    hint: word.sentence.en,
    blanks: [{ id: `${stepId}-b`, correctAnswer: word.kanji }],
    wordBank: seededShuffle([word.kanji, ...distractors], stepId),
    wordBankHideHelper: true,
  } as LessonStep;
}
