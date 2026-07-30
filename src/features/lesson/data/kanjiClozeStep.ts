import type { LessonStep } from "../types";
import { seededShuffle } from "@/shared/utils/seededShuffle";
import { buildKanjiDistractors } from "@/features/languages/ja/secondScript/kanjiDistractorPool";

/**
 * Step 2 of the switchover beat (B061) — the graded half.
 *
 * An English cue, a sentence with the switched word blanked, and four
 * shape-matched kanji tiles. Hosted on `fill_blank`, the step type CLAUDE.md
 * listed as unused with a standing "adopt or retire" decision; this adopts it.
 *
 * Three things are load-bearing, each of which was a defect first:
 *
 *  1. **The English cue is required, not decoration.** "___ といきます" is
 *     satisfied by friend, family, teacher AND student — the Japanese frame
 *     constrains nothing. Without the cue the step has no answer, which is why a
 *     word with no translated sentence yields null instead of a cue-less cloze.
 *  2. **`wordBankHideHelper`.** Bank tiles render through `AnnotatedText` in bare
 *     mode, which floats each word's kana above it. Left on, the bank reads
 *     ともだち / かぞく / せんせい / がくせい and no kanji is read at all.
 *  3. **The switched word's kanji is ONLY ever the correct tile.** Offering it as
 *     wrong would teach that a known word's written form is incorrect.
 *
 * The frame is DERIVED from a mined course sentence, not authored: 124 words
 * would each need one, and the miner already knows a real sentence containing
 * each word plus its English. The rest of the sentence stays kana, which has a
 * useful side effect — the only kanji on screen are the tiles, so there is no
 * ambiguity about which word is being asked for.
 */
export function buildKanjiClozeStep(
  stepId: string,
  word: { atomId: string; kana: string; kanji: string; gloss: string },
  sentence: { text: string; translation: string } | undefined,
): LessonStep | null {
  if (!sentence) return null;
  const at = sentence.text.indexOf(word.kana);
  // The miner guarantees the sentence CONTAINS the kana, but it is keyed by card
  // id and the guarantee is not worth trusting blind at build time.
  if (at === -1) return null;
  const before = sentence.text.slice(0, at);
  const after = sentence.text.slice(at + word.kana.length);

  const distractors = buildKanjiDistractors(word.kanji, word.kana, 3, stepId, {
    excludeGloss: word.gloss,
  });
  // Four tiles or nothing: a two-tile bank is a coin flip dressed as a step.
  if (distractors.length < 3) return null;

  return {
    id: stepId,
    type: "fill_blank",
    sentence: `${before}{{blank}}${after}`,
    hint: sentence.translation,
    blanks: [{ id: `${stepId}-b`, correctAnswer: word.kanji }],
    wordBank: seededShuffle([word.kanji, ...distractors], stepId),
    wordBankHideHelper: true,
    // Graded: this is the beat's retrieval, a correct answer is what latches the
    // switchover in LessonPage, and it is a legitimate recognition rep either way.
    exercisedAtoms: [word.atomId],
    modality: "recognition",
  } as LessonStep;
}
