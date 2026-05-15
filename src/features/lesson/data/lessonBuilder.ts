/**
 * Turns a `RowDef` from `hiraganaCurriculum.ts` into a fully-shaped
 * `LessonContent`.
 *
 * Two builder shapes coexist:
 *   - `buildRowLesson(row)` (legacy): one Lesson per row. Used as a fallback
 *     for any RowDef without `subLessons`. Kept for back-compat.
 *   - `buildRowSubLessons(row)` (alphabet-streamline): N+1 lessons per row,
 *     one per sub-lesson plus a row-test. Used whenever `row.subLessons` is
 *     populated (i.e. every production row after the streamline pass).
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
  MultipleChoiceStep,
  RowTestStep,
  RowTestItem,
  InfoStep,
} from "../types";
import {
  type RowDef,
  type SubLessonDef,
  type AnchorWord,
  type SentencePractice,
  type KanaIntro,
  YOON_ROWS,
} from "./hiraganaCurriculum";
import { tokenizeJapanese } from "@/shared/japanese/kanaTable";
import { getTtsUrl } from "@/shared/japanese/tts";
import { topStruggleKana } from "@/features/japanese/kanaMastery/struggleStore";

/**
 * Build a short, never-scolding explanation for a recognition MC. Always
 * teaches: shows the kana, its romaji, and (for yōon) decomposes it into
 * parent-consonant + small-ya/yu/yo. Capped under ~80 chars so it fits
 * cleanly in the Feedback banner. No emoji.
 *
 * Examples:
 *   あ → "あ is 'a'."
 *   きゃ → "きゃ = き + small ゃ → 'kya'."
 */
export function buildKanaRecognitionExplanation(
  kana: string,
  romaji: string,
): string {
  const chars = Array.from(kana);
  if (chars.length === 2 && /[ゃゅょャュョ]/.test(chars[1])) {
    return `${kana} = ${chars[0]} + small ${chars[1]} → '${romaji}'.`;
  }
  return `${kana} is '${romaji}'.`;
}

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

// ============================================================================
// Sub-lesson builder (alphabet-streamline)
// ============================================================================

/**
 * Build a sub-lesson scoped intro step. Mentions only the kana being
 * introduced in this slice, not the whole row.
 */
function buildSubLessonIntroInfo(row: RowDef, sub: SubLessonDef): InfoStep {
  const kanaList = sub.introduces.map((k) => k.kana).join(" ");
  const body =
    sub.introduces.length === 0
      ? `Review and consolidate what you learned in ${row.title.split(":")[0]}.`
      : sub.introduces.length === 1
        ? `${row.title.split(":")[0]} — meet ${kanaList} (${sub.introduces[0].romaji}).`
        : `${row.title.split(":")[0]} — meet ${kanaList}. We'll teach them one at a time.`;
  return {
    id: `ja-${row.id}-${sub.suffix}-info-start`,
    type: "info",
    title: sub.label,
    body,
    variant: "default",
  };
}

function buildSubLessonWrapInfo(row: RowDef, sub: SubLessonDef): InfoStep {
  const isFinalLearning =
    !sub.isTest &&
    sub.suffix === String(
      (row.subLessons ?? []).filter((s) => !s.isTest).length,
    );
  const body = isFinalLearning
    ? `Row review complete — next up the row test.`
    : sub.introduces.length > 0
      ? `Nice. Tap continue.`
      : `Tap continue.`;
  return {
    id: `ja-${row.id}-${sub.suffix}-info-end`,
    type: "info",
    title: "Nice work!",
    body,
    variant: "default",
  };
}

/**
 * Match-step over a small set of anchors. Used both inside sub-lessons and
 * by the row-test runner via a separate builder.
 */
function buildSubLessonMatchStep(
  row: RowDef,
  sub: SubLessonDef,
  carryOver: AnchorWord[],
  suffix: string = "match",
): MatchPairsStep | null {
  const pairsSource = [...sub.anchorWords, ...carryOver];
  // De-dup by kana.
  const seen = new Set<string>();
  const unique = pairsSource.filter((w) => {
    if (seen.has(w.kana)) return false;
    seen.add(w.kana);
    return true;
  });
  if (unique.length < 2) return null;
  const pairs = unique.slice(0, 6).map((w, i) => ({
    id: `p${i + 1}`,
    source: w.kana,
    target: w.meaning,
    sourceAnnotation: [{ surface: w.kana, reading: w.kana }],
  }));
  return {
    id: `ja-${row.id}-${sub.suffix}-${suffix}`,
    type: "match_pairs",
    prompt: "Match each Japanese word to its meaning",
    pairs,
  };
}

function buildSubLessonBuildStep(
  row: RowDef,
  sub: SubLessonDef,
): BuildSentenceStep | null {
  if (!sub.build) return null;
  const answerMora = tokenizeJapanese(sub.build.answer)
    .filter((t) => t.kana)
    .map((t) => t.text);
  const tiles = [...answerMora, ...sub.build.decoys];
  return {
    id: `ja-${row.id}-${sub.suffix}-build`,
    type: "build_sentence",
    prompt: `Build the Japanese word for '${sub.build.meaning}'`,
    targetSentence: sub.build.answer,
    tiles,
    correctOrder: answerMora,
    granularity: "character",
    hint: answerMora.length <= 3
      ? "Tap the tiles in order."
      : "Tap the tiles in order to spell the word.",
    targetAnnotation: [
      { surface: sub.build.answer, reading: sub.build.answer },
    ],
  };
}

/**
 * Pick struggle-weighted carry-over anchor words from earlier sub-lessons of
 * the same row. Returns up to `count` anchors whose kana set is biased
 * toward the top of the struggle store. Falls back to "most recently
 * introduced" anchors if the store is empty.
 */
function pickStruggleCarryOver(
  row: RowDef,
  subLessonIdx: number,
  count: number,
  lang: string,
): AnchorWord[] {
  const subLessons = row.subLessons ?? [];
  if (subLessonIdx === 0) return [];

  // Earlier-introduced kana for this row.
  const earlierKana = new Set<string>();
  const earlierWords: AnchorWord[] = [];
  for (let i = 0; i < subLessonIdx; i++) {
    for (const k of subLessons[i].introduces) earlierKana.add(k.kana);
    for (const w of subLessons[i].anchorWords) earlierWords.push(w);
  }
  if (earlierWords.length === 0) return [];

  const top = topStruggleKana(lang, 6, earlierKana);
  if (top.length === 0) {
    // No struggle data — pick the most recently introduced words.
    return earlierWords.slice(-count);
  }
  // Rank earlier words by whether their kana intersect the struggle top.
  const struggleSet = new Set(top);
  const scored = earlierWords.map((w) => {
    const hit = Array.from(w.kana).filter((c) => struggleSet.has(c)).length;
    return { w, score: hit };
  });
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.filter((s) => s.score > 0).map((s) => s.w);
  if (picked.length >= count) return picked.slice(0, count);
  // Pad with most recent.
  const padded = [...picked];
  for (const w of earlierWords.slice().reverse()) {
    if (padded.find((p) => p.kana === w.kana)) continue;
    padded.push(w);
    if (padded.length >= count) break;
  }
  return padded.slice(0, count);
}

/**
 * Build a single sub-lesson as a `LessonContent`. Lesson id is stable:
 * `ja-m1-${row.id}-${sub.suffix}`.
 *
 * Shape per spec:
 *   - intro info
 *   - per-kana cycle (intro → teach pair) for sub.introduces
 *   - carry-over match (1-2 struggle items + sub's anchors) — skipped on sub-lesson 1
 *   - sentence-example slides if any
 *   - sentence-practice drill(s) if any
 *   - build step if sub.build is set
 *   - wrap-up info
 */
function buildSubLessonContent(
  row: RowDef,
  sub: SubLessonDef,
  subLessonIdx: number,
  lang: string,
): LessonContent {
  if (sub.isTest) {
    return buildRowTestLesson(row, sub);
  }
  const steps: LessonStep[] = [];
  // Bookend info cards are valuable on sub-lesson 1 (welcome to the row,
  // closing recap). For sub-lessons 2+ they were filler and the teen audit
  // (Riley) flagged them as bail risk: "two info cards back-to-back =
  // I tab away." Keep the intro on sub-1 only; sub-2/3 jump straight into
  // the kana cycle. Row tests (`isTest`) own their own intro/outro.
  const isFirstSubLesson = sub.suffix === "1";
  if (isFirstSubLesson) {
    steps.push(buildSubLessonIntroInfo(row, sub));
  }

  // Per-kana cycle.
  const usedWords = new Set<string>();
  const wordTeachCount = new Map<string, number>();
  sub.introduces.forEach((k, i) => {
    steps.push(buildIntroStep(row, k, i));
    const example = pickExampleWord(k.kana, sub.anchorWords, usedWords);
    if (example) {
      usedWords.add(example.kana);
      const idx = wordTeachCount.size;
      wordTeachCount.set(example.kana, idx);
      steps.push(buildTeachStep(row, example, idx));
    }
  });

  // Carry-over match — struggle-biased pick from earlier sub-lessons.
  const carryOver = pickStruggleCarryOver(row, subLessonIdx, 2, lang);
  const carryMatch = buildSubLessonMatchStep(row, sub, carryOver, "match-carry");
  if (carryMatch) steps.push(carryMatch);

  // Anchor words not paired with an intro still get a teach so the match
  // step has full coverage.
  sub.anchorWords.forEach((w) => {
    if (usedWords.has(w.kana)) return;
    const idx = wordTeachCount.size;
    wordTeachCount.set(w.kana, idx);
    steps.push(buildTeachStep(row, w, idx));
  });

  // Sentence-example slides (orphan-kana notes).
  if (sub.sentenceExamples) {
    sub.sentenceExamples.forEach((ex, i) => {
      steps.push({
        id: `ja-${row.id}-${sub.suffix}-info-example-${i}`,
        type: "info",
        title: `Note on ${ex.kana}`,
        body: `${ex.sentence}  (${ex.reading}) — ${ex.meaning}`,
        variant: "tip",
      });
    });
  }

  // Sentence-practice (build_sentence with word tiles).
  (sub.sentencePractice ?? []).forEach((entry, i) => {
    steps.push(buildSentencePracticeStep(row, entry, i));
  });

  // Build (production) — only if this sub-lesson owns the row's build.
  const buildStep = buildSubLessonBuildStep(row, sub);
  if (buildStep) steps.push(buildStep);

  // Wrap-up info: only sub-lesson 1 gets the closing card. Sub-lessons
  // 2+ end on the last drill (match/build) so the learner's final beat
  // is recall, not a slide. Teen audit P0.
  if (isFirstSubLesson) {
    steps.push(buildSubLessonWrapInfo(row, sub));
  }

  return {
    id: `ja-m1-${row.id}-${sub.suffix}`,
    moduleId: "m1",
    courseId: "mock-1",
    languageId: "ja",
    title: `${row.title.split(":")[0]} — ${sub.label}`,
    description: row.intro,
    estimatedMinutes: 4 + Math.ceil(sub.introduces.length * 0.5),
    xpReward: 12,
    introducesVocabIds: sub.anchorWords.map((w) => `${row.id}-${w.romaji}`),
    steps,
  };
}

// ============================================================================
// Row-test builder
// ============================================================================

/**
 * Build the row-test items: a mix of recognition MC, match, and build,
 * struggle-biased at build time. Spec: ~12-15 items, ratio 60/30/10.
 *
 * Strategy:
 *   - MC: one per kana in the row (5-12), each is a "you hear X, pick the
 *     kana" recognition question.
 *   - Match: 1-2 match steps over the row's anchor words (5-6 pairs each).
 *   - Build: 1-2 build_sentence steps over the row's anchor words.
 */
/**
 * For the yōon capstone row, pull the test pool from every preceding yōon
 * row's `introduces` + anchor words. The capstone itself has empty
 * `introduces` (otherwise the curriculum-coverage test would assert the
 * kana live in a non-test sub-lesson on the capstone row).
 */
function yoonCapstoneKana(): KanaIntro[] {
  const out: KanaIntro[] = [];
  for (const r of YOON_ROWS) {
    if (r.id === "yoon-capstone") continue;
    for (const k of r.introduces) out.push(k);
  }
  return out;
}
function yoonCapstoneAnchors(): AnchorWord[] {
  const seen = new Set<string>();
  const out: AnchorWord[] = [];
  for (const r of YOON_ROWS) {
    if (r.id === "yoon-capstone") continue;
    for (const w of r.anchorWords) {
      if (seen.has(w.kana)) continue;
      seen.add(w.kana);
      out.push(w);
    }
  }
  return out;
}

export function buildRowTestSteps(row: RowDef): RowTestItem[] {
  const items: RowTestItem[] = [];
  const isYoonCapstone = row.id === "yoon-capstone";
  const introduces = isYoonCapstone ? yoonCapstoneKana() : row.introduces;
  const anchorWords = isYoonCapstone ? yoonCapstoneAnchors() : row.anchorWords;

  // Recognition MC per kana (one item per kana, prompt = audio).
  introduces.forEach((k, idx) => {
    const others = introduces.filter((other) => other.kana !== k.kana);
    const pool = [...others.map((o) => o.kana), ...row.audioPick.distractors];
    // De-dup.
    const distractorKana: string[] = [];
    for (const candidate of pool) {
      if (candidate === k.kana) continue;
      if (distractorKana.includes(candidate)) continue;
      distractorKana.push(candidate);
      if (distractorKana.length >= 3) break;
    }
    const options = [k.kana, ...distractorKana.slice(0, 3)].map((symbol, i) => ({
      id: `opt-${i}`,
      text: symbol,
    }));
    const correctId = options[0].id;
    // Seeded shuffle for reproducibility.
    const shuffled = seededShuffle(options, `${row.id}-test-mc-${k.kana}-${idx}`);
    const mc: MultipleChoiceStep = {
      id: `ja-${row.id}-test-mc-${idx}`,
      type: "multiple_choice",
      prompt: `Which kana is "${k.romaji}"?`,
      promptAudioText: k.kana,
      options: shuffled,
      correctOptionId: correctId,
      explanation: buildKanaRecognitionExplanation(k.kana, k.romaji),
    };
    items.push({ kind: "mc", payload: mc });
  });

  // Match step — anchor words ↔ meanings. One step is plenty for most rows.
  if (anchorWords.length >= 2) {
    const pairs = anchorWords.slice(0, 6).map((w, i) => ({
      id: `p${i + 1}`,
      source: w.kana,
      target: w.meaning,
      sourceAnnotation: [{ surface: w.kana, reading: w.kana }],
    }));
    items.push({
      kind: "match",
      payload: {
        id: `ja-${row.id}-test-match-0`,
        type: "match_pairs",
        prompt: "Match each Japanese word to its meaning",
        pairs,
      },
    });
  }

  // Build step — row's canonical build.
  const buildStep = buildBuildSentence(row);
  // Re-id so it doesn't collide with the legacy build step id.
  items.push({
    kind: "build",
    payload: { ...buildStep, id: `ja-${row.id}-test-build-0` },
  });

  return items;
}

/**
 * Wrap the row-test items as a one-step LessonContent. The single step is a
 * `RowTestStep` consumed by `RowTestStepView` (the runtime queue manager).
 */
function buildRowTestLesson(row: RowDef, sub: SubLessonDef): LessonContent {
  const items = buildRowTestSteps(row);
  const testStep: RowTestStep = {
    id: `ja-${row.id}-test`,
    type: "row_test",
    rowId: row.id,
    items,
    passThreshold: 0.7,
    maxRetries: 3,
  };
  const intro: InfoStep = {
    id: `ja-${row.id}-test-info-start`,
    type: "info",
    title: `${row.title.split(":")[0]} — Row test`,
    body: `Quick check on everything in this row. Pass with 70%+ to clear it. Miss an item? It comes back at the end of the queue. You can skip the test if you'd rather come back later.`,
    variant: "default",
  };
  return {
    id: `ja-m1-${row.id}-${sub.suffix}`,
    moduleId: "m1",
    courseId: "mock-1",
    languageId: "ja",
    title: `${row.title.split(":")[0]} — Row test`,
    description: `Row-test for ${row.title}.`,
    estimatedMinutes: 3,
    xpReward: 10,
    introducesVocabIds: [],
    steps: [intro, testStep],
  };
}

/**
 * Build every sub-lesson + the row-test as separate `LessonContent`s. When
 * `row.subLessons` is empty, falls back to `buildRowLesson(row)`.
 *
 * `lang` defaults to "ja" — used by the struggle-store carry-over picker.
 */
export function buildRowSubLessons(
  row: RowDef,
  lang: string = "ja",
): LessonContent[] {
  if (!row.subLessons || row.subLessons.length === 0) {
    return [buildRowLesson(row)];
  }
  return row.subLessons.map((sub, idx) =>
    buildSubLessonContent(row, sub, idx, lang),
  );
}
