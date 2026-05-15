/**
 * Turns a `RowDef` from `hiraganaCurriculum.ts` into a fully-shaped
 * `LessonContent` matching the structure of the hand-authored a-row lesson.
 *
 * Step sequence per row:
 *   1. info — what this lesson teaches
 *   for each kana introduced:
 *     2. symbol_intro
 *     3. symbol_recognition (4 options, 2×2 grid)
 *   4. teach steps for each anchor word
 *   5. match_pairs across all anchor words
 *   6. multiple_choice with audioOnlyPrompt — phoneme-isolation drill
 *   7. build_sentence — assemble the build target from tile bank
 *   8. info — wrap-up
 *
 * Distractor strategy for recognition steps: pull from this row's other
 * kana first (in-row visual similarity is the hardest learnable
 * distinction), then from CONFUSABLES, then a-row vowels as a safety net.
 */
import type {
  LessonContent,
  LessonStep,
  SymbolIntroStep,
  SymbolRecognitionStep,
  TeachStep,
  MultipleChoiceStep,
  MatchPairsStep,
  BuildSentenceStep,
  InfoStep,
} from "../types";
import { CONFUSABLES, type RowDef } from "./hiraganaCurriculum";

const A_ROW_VOWELS = ["あ", "い", "う", "え", "お"];

function pickDistractors(
  target: string,
  pool: string[],
  count: number,
): string[] {
  const out: string[] = [];
  const seen = new Set([target]);
  const tryAdd = (k: string) => {
    if (out.length >= count) return;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(k);
  };
  // 1: row-internal confusables (highest learnable signal)
  for (const k of CONFUSABLES[target] ?? []) tryAdd(k);
  // 2: in-pool kana (this row's other introductions)
  for (const k of pool) tryAdd(k);
  // 3: a-row vowels as universal fallback
  for (const k of A_ROW_VOWELS) tryAdd(k);
  // 4: top-of-confusables across the whole map if still short
  if (out.length < count) {
    for (const k of Object.keys(CONFUSABLES)) tryAdd(k);
  }
  return out.slice(0, count);
}

function buildRecognitionStep(
  row: RowDef,
  kana: string,
  romaji: string,
  hint: string,
  idx: number,
): SymbolRecognitionStep {
  const otherKana = row.introduces.map((k) => k.kana).filter((k) => k !== kana);
  const distractors = pickDistractors(kana, otherKana, 3);
  const opts = [
    { id: "a", symbol: kana },
    { id: "b", symbol: distractors[0] },
    { id: "c", symbol: distractors[1] },
    { id: "d", symbol: distractors[2] },
  ];
  return {
    id: `ja-${row.id}-recog-${idx}`,
    type: "symbol_recognition",
    payload: {
      symbol: kana,
      romanization: romaji,
      ipa: "",
      hint,
      scriptId: "hiragana",
      hasStrokeOrder: true,
    },
    options: opts,
    correctOptionId: "a",
  };
}

function buildIntroStep(
  row: RowDef,
  k: RowDef["introduces"][number],
  idx: number,
): SymbolIntroStep {
  return {
    id: `ja-${row.id}-intro-${idx}`,
    type: "symbol_intro",
    payload: {
      symbol: k.kana,
      romanization: k.romaji,
      ipa: "",
      hint: k.hint,
      note: k.note,
      scriptId: "hiragana",
      hasStrokeOrder: true,
    },
  };
}

function buildTeachStep(
  row: RowDef,
  w: RowDef["anchorWords"][number],
  idx: number,
): TeachStep {
  return {
    id: `ja-${row.id}-teach-${idx}`,
    type: "teach",
    content: {
      text: `${w.kana} means '${w.meaning}'.`,
      vocab: {
        term: w.kana,
        translation: w.meaning,
        annotation: [{ surface: w.kana, reading: w.kana }],
      },
    },
  };
}

function buildMatchStep(row: RowDef): MatchPairsStep {
  // Cap to 4 pairs so the grid is uniform.
  const pairs = row.anchorWords.slice(0, 4).map((w, i) => ({
    id: `p${i + 1}`,
    source: w.kana,
    target: w.meaning,
    sourceAnnotation: [{ surface: w.kana, reading: w.kana }],
  }));
  return {
    id: `ja-${row.id}-match`,
    type: "match_pairs",
    prompt: "Match each Japanese word to its meaning",
    pairs,
  };
}

function buildAudioPickStep(row: RowDef): MultipleChoiceStep {
  const target = row.audioPick.word[row.audioPick.pickIndex];
  const positionLabel = positionOrdinal(
    row.audioPick.pickIndex,
    Array.from(row.audioPick.word).length,
  );
  const opts = [
    { id: "a", text: target },
    { id: "b", text: row.audioPick.distractors[0] },
    { id: "c", text: row.audioPick.distractors[1] },
    { id: "d", text: row.audioPick.distractors[2] },
  ];
  return {
    id: `ja-${row.id}-audio-pick`,
    type: "multiple_choice",
    prompt: `Which kana is ${positionLabel} in the word you hear?`,
    audioOnlyPrompt: true,
    promptAudioText: row.audioPick.word,
    options: opts,
    correctOptionId: "a",
    explanation: `The word is '${row.audioPick.word}'. The ${positionLabel} kana is ${target}.`,
  };
}

function positionOrdinal(index: number, total: number): string {
  if (index === 0) return "at the start";
  if (index === total - 1) return "at the end";
  if (index === 1) return "second";
  return `at position ${index + 1}`;
}

function buildBuildSentence(row: RowDef): BuildSentenceStep {
  const answerChars = Array.from(row.build.answer);
  const tiles = [...answerChars, ...row.build.decoys];
  return {
    id: `ja-${row.id}-build`,
    type: "build_sentence",
    prompt: `Build the Japanese word for '${row.build.meaning}'`,
    targetSentence: row.build.answer,
    tiles,
    correctOrder: answerChars,
    granularity: "character",
    hint: row.build.answer.length <= 3
      ? "Tap the tiles in order."
      : "Tap the tiles in order to spell the word.",
    targetAnnotation: [{ surface: row.build.answer, reading: row.build.answer }],
  };
}

export function buildRowLesson(row: RowDef, _lessonNum: number = 0): LessonContent {
  const steps: LessonStep[] = [];

  const introInfo: InfoStep = {
    id: `ja-${row.id}-info-start`,
    type: "info",
    title: row.title,
    body: row.intro,
    variant: "default",
  };
  steps.push(introInfo);

  // Interleave intro + recognition for each kana.
  row.introduces.forEach((k, i) => {
    steps.push(buildIntroStep(row, k, i));
    steps.push(buildRecognitionStep(row, k.kana, k.romaji, k.hint, i));
  });

  // Teach each anchor word.
  row.anchorWords.forEach((w, i) => {
    steps.push(buildTeachStep(row, w, i));
  });

  steps.push(buildMatchStep(row));
  steps.push(buildAudioPickStep(row));
  steps.push(buildBuildSentence(row));

  steps.push({
    id: `ja-${row.id}-info-end`,
    type: "info",
    title: "Nice work!",
    body: `You learned ${row.introduces.length} hiragana and ${row.anchorWords.length} words built from them. Tap continue to finish.`,
    variant: "default",
  });

  return {
    id: `ja-m1-${row.id}`,
    moduleId: "m1",
    courseId: "mock-1",
    languageId: "ja",
    title: row.title,
    description: row.intro,
    estimatedMinutes: 6 + Math.ceil(row.introduces.length * 0.5),
    xpReward: 15,
    introducesVocabIds: row.anchorWords.map((w) => `${row.id}-${w.romaji}`),
    steps,
  };
}
