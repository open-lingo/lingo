/**
 * Turns a `RowDef` from `hiraganaCurriculum.ts` into a fully-shaped
 * `LessonContent`.
 *
 * Per-kana cycle (the user-validated pedagogy):
 *   1. symbol_intro — meet the new kana
 *   2. teach        — see a word that uses it
 *
 * Then once after all kana are introduced:
 *   3. match_pairs   — kana words ↔ meanings (review)
 *   4. build_sentence — assemble a word from tiles (production)
 *
 * Recognition tests right after the intro were dropped per user feedback
 * ("they just learned it, don't immediately test recognition"). The audio
 * phoneme-isolation drill was also dropped — it indexed by codepoint
 * which produced wrong-but-technically-valid answers for yōon words.
 */
import type {
  LessonContent,
  LessonStep,
  SymbolIntroStep,
  TeachStep,
  MatchPairsStep,
  BuildSentenceStep,
  InfoStep,
} from "../types";
import { type RowDef, type SentencePractice } from "./hiraganaCurriculum";
import { tokenizeJapanese } from "@/shared/japanese/kanaTable";
import { getTtsUrl } from "@/shared/japanese/tts";

/**
 * Deterministic seeded Fisher-Yates shuffle. Keyed off a stable string
 * (row id + sentence index) so tile order is reproducible across runs —
 * tests stay stable and the same lesson always presents the same bank.
 */
function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h = h >>> 0;
    return h / 0x100000000;
  };
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildSentencePracticeStep(
  row: RowDef,
  entry: SentencePractice,
  idx: number,
): BuildSentenceStep {
  const seed = `${row.id}-sentence-${idx}`;
  const tiles = seededShuffle([...entry.correctOrder, ...entry.decoys], seed);
  const audioUrl = getTtsUrl(entry.target);
  return {
    id: `ja-${row.id}-sentence-${idx}`,
    type: "build_sentence",
    prompt: entry.prompt,
    targetSentence: entry.target,
    tiles,
    correctOrder: entry.correctOrder,
    granularity: "word",
    audioKey: audioUrl ?? undefined,
    targetAnnotation: [{ surface: entry.target, reading: entry.target }],
  };
}

/**
 * Find a good example word for `kana` from the row's unused anchor words.
 * Returns null if every word that contains `kana` is already paired with
 * another intro — better to skip the teach than emit a duplicate the
 * learner just saw.
 */
function pickExampleWord(
  kana: string,
  words: RowDef["anchorWords"],
  used: Set<string>,
): RowDef["anchorWords"][number] | null {
  for (const w of words) {
    if (used.has(w.kana)) continue;
    if (w.kana.includes(kana)) return w;
  }
  return null;
}

function buildIntroStep(
  row: RowDef,
  k: RowDef["introduces"][number],
  idx: number,
): SymbolIntroStep {
  const isMultiChar = Array.from(k.kana).length > 1;
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
      hasStrokeOrder: !isMultiChar,
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
  // Cap to 6 pairs so every row's anchor set fits (most rows have 5-6 once
  // orphan-kana anchors are added). 6 stays within a reasonable grid.
  const pairs = row.anchorWords.slice(0, 6).map((w, i) => ({
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

function buildBuildSentence(row: RowDef): BuildSentenceStep {
  // Tokenize by mora, not by codepoint, so yōon (e.g. ちゃ) stays a single
  // tile. Without this, おちゃ becomes 3 tiles [お, ち, ゃ] and the user
  // can't reassemble it from the mora-form decoys (e.g. しゃ, ちょ).
  const answerMora = tokenizeJapanese(row.build.answer)
    .filter((t) => t.kana)
    .map((t) => t.text);
  const tiles = [...answerMora, ...row.build.decoys];
  return {
    id: `ja-${row.id}-build`,
    type: "build_sentence",
    prompt: `Build the Japanese word for '${row.build.meaning}'`,
    targetSentence: row.build.answer,
    tiles,
    correctOrder: answerMora,
    granularity: "character",
    hint: answerMora.length <= 3
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

  // Per-kana cycle: intro → example word that uses the kana. Each anchor
  // word is consumed at most once during this loop; any leftover anchors
  // get appended after for completeness (the match step needs them).
  const usedWords = new Set<string>();
  const wordTeachCount = new Map<string, number>();
  row.introduces.forEach((k, i) => {
    steps.push(buildIntroStep(row, k, i));
    const example = pickExampleWord(k.kana, row.anchorWords, usedWords);
    if (example) {
      usedWords.add(example.kana);
      const idx = wordTeachCount.size;
      wordTeachCount.set(example.kana, idx);
      steps.push(buildTeachStep(row, example, idx));
    }
  });

  // Any anchor words not paired with an intro (extras) still get a teach
  // pass so the match step has full coverage.
  row.anchorWords.forEach((w) => {
    if (usedWords.has(w.kana)) return;
    const idx = wordTeachCount.size;
    wordTeachCount.set(w.kana, idx);
    steps.push(buildTeachStep(row, w, idx));
  });

  // Multi-tile sentence-practice drills, inserted after the per-kana cycle
  // but before the wrap-up match + build. Each entry becomes one
  // build_sentence step with word-granularity tiles.
  (row.sentencePractice ?? []).forEach((entry, i) => {
    steps.push(buildSentencePracticeStep(row, entry, i));
  });

  steps.push(buildMatchStep(row));
  steps.push(buildBuildSentence(row));

  // Sentence-example slides for orphan kana with no clean anchor word.
  // Each becomes one InfoStep wedged in just before the wrap-up.
  if (row.sentenceExamples && row.sentenceExamples.length > 0) {
    row.sentenceExamples.forEach((ex, i) => {
      steps.push({
        id: `ja-${row.id}-info-example-${i}`,
        type: "info",
        title: `Note on ${ex.kana}`,
        body: `${ex.sentence}  (${ex.reading}) — ${ex.meaning}`,
        variant: "tip",
      });
    });
  }

  // Wa-row gets a one-line particle-は note in the wrap-up — pairs the just-
  // met わ (syllable 'wa') with the topic-marker は (particle, also 'wa').
  const wrapBody =
    row.id === "wa"
      ? `You learned ${row.introduces.length} hiragana and ${row.anchorWords.length} words built from them. One note: when は is used as a topic-marker particle (as in わたし は...), it's pronounced "wa" — the same sound as わ. Spelled differently, same sound.`
      : `You learned ${row.introduces.length} hiragana and ${row.anchorWords.length} words built from them. Tap continue to finish.`;
  steps.push({
    id: `ja-${row.id}-info-end`,
    type: "info",
    title: "Nice work!",
    body: wrapBody,
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
