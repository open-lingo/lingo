/**
 * Module recap lesson builder — Phase 2 spec §C.
 *
 * Final node of each module. Reuses the `RowTestStep` runner from #66 with
 * a wider item pool (full module instead of one row). Items are sourced
 * struggle-biased from the row catalog: every row that contributes
 * lessons to the module gets one MC item per introduced kana, plus a
 * match step over the union of anchor words.
 *
 * The recap is skippable like row tests and does NOT gate the next
 * module — the module already counts as "complete" when the recap node
 * appears. Retakes increment `reviewCount` (existing field), surfacing as
 * a small ×N badge on the recap node.
 */
import type {
  LessonContent,
  RowTestStep,
  RowTestItem,
  InfoStep,
  MultipleChoiceStep,
  MatchPairsStep,
} from "../types";
import { ALL_ROWS, type RowDef } from "./hiraganaCurriculum";
import { buildKanaRecognitionExplanation } from "./lessonBuilder";
import { padMatchPairsToTarget } from "@/features/languages/ja/curriculum/_consonantRowHelpers";

const RECAP_ITEM_COUNT = 15;
const RECAP_PASS_THRESHOLD = 0.7;
const RECAP_MAX_RETRIES = 3;

/**
 * Deterministic seeded Fisher-Yates so recap item ordering is stable
 * per module id (re-runs of the same recap don't shuffle differently).
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

/**
 * Build one MC recognition item per kana in `rows`'s introduces lists.
 * Prompt = "Which kana is 'X'?" with audio of the target kana. Distractors
 * are drawn from the same row's introduces + cross-row kana.
 */
function buildRecapMcItems(
  moduleId: string,
  rows: RowDef[],
): RowTestItem[] {
  const items: RowTestItem[] = [];
  const allKana = new Set<string>();
  for (const row of rows) {
    for (const k of row.introduces) allKana.add(k.kana);
  }
  for (const row of rows) {
    for (const k of row.introduces) {
      const distractorPool = Array.from(allKana).filter((c) => c !== k.kana);
      const distractors = seededShuffle(
        distractorPool,
        `${moduleId}-recap-distract-${k.kana}`,
      ).slice(0, 3);
      const optionTexts = [k.kana, ...distractors];
      const optionsRaw = optionTexts.map((symbol, i) => ({
        id: `opt-${i}`,
        text: symbol,
      }));
      const shuffled = seededShuffle(
        optionsRaw,
        `${moduleId}-recap-mc-shuf-${k.kana}`,
      );
      const correctOptionId =
        shuffled.find((o) => o.text === k.kana)?.id ?? "opt-0";
      const mc: MultipleChoiceStep = {
        id: `ja-${moduleId}-recap-mc-${k.kana}`,
        type: "multiple_choice",
        prompt: `Which kana is "${k.romaji}"?`,
        promptAudioText: k.kana,
        options: shuffled,
        correctOptionId,
        explanation: buildKanaRecognitionExplanation(k.kana, k.romaji),
        // Test mode: suppress the romaji ruby above kana options.
        optionsHideRomaji: true,
      };
      items.push({ kind: "mc", payload: mc });
    }
  }
  return items;
}

/**
 * One match step over the union of `rows`'s anchor words, capped at 6
 * pairs to fit the grid. Returns null if fewer than 2 anchors.
 */
function buildRecapMatchItem(
  moduleId: string,
  rows: RowDef[],
): RowTestItem | null {
  const seen = new Set<string>();
  const anchors: { kana: string; meaning: string }[] = [];
  for (const row of rows) {
    for (const w of row.anchorWords) {
      if (seen.has(w.kana)) continue;
      seen.add(w.kana);
      anchors.push({ kana: w.kana, meaning: w.meaning });
    }
  }
  if (anchors.length < 2) return null;
  // Cap at 6 for grid sanity, then backfill from M1_REVIEW_POOL if the
  // pool came in under 4 (2026-05-18 — empty match-pair slots are wasted
  // review surface per Spencer's tester walkthrough).
  const picked = seededShuffle(anchors, `${moduleId}-recap-match-pick`).slice(
    0,
    6,
  );
  const filled = padMatchPairsToTarget(`${moduleId}-recap-match`, picked, 4);
  const pairs = filled.map((w, i) => ({
    id: `p${i + 1}`,
    source: w.kana,
    target: w.meaning,
    sourceAnnotation: [{ surface: w.kana, reading: w.kana }],
  }));
  const match: MatchPairsStep = {
    id: `ja-${moduleId}-recap-match-0`,
    type: "match_pairs",
    prompt: "Match each Japanese word to its meaning",
    pairs,
  };
  return { kind: "match", payload: match };
}

/**
 * Extract the row id from a JA sub-lesson id. See mockLessons.ts for the
 * shared helper — duplicated here to keep this module dependency-free.
 */
function rowIdFromLessonId(lessonId: string): string | null {
  const m = /^ja-m\d+-(.+)$/.exec(lessonId);
  if (!m) return null;
  let tail = m[1];
  const sub = /^(.+)-(\d+|test|recap)$/.exec(tail);
  if (sub) tail = sub[1];
  return tail;
}

/**
 * Resolve every row referenced by `lessonIds`. Order matches the lesson-id
 * order so the recap items present in pedagogy order.
 */
function rowsForLessonIds(lessonIds: ReadonlyArray<string>): RowDef[] {
  const seen = new Set<string>();
  const rows: RowDef[] = [];
  const byId = new Map(ALL_ROWS.map((r) => [r.id, r]));
  for (const lid of lessonIds) {
    const rowId = rowIdFromLessonId(lid);
    if (!rowId || seen.has(rowId)) continue;
    const row = byId.get(rowId);
    if (!row) continue;
    seen.add(rowId);
    rows.push(row);
  }
  return rows;
}

/**
 * Build the recap lesson for a module. `lessonIds` is the list of every
 * lesson id in that module (used to identify which rows the recap should
 * cover). Returns null if the module has no row-backed lessons (e.g.
 * coming-soon stubs).
 */
export function buildRecapLesson(
  moduleId: string,
  moduleTitle: string,
  lessonIds: ReadonlyArray<string>,
): LessonContent | null {
  const rows = rowsForLessonIds(lessonIds);
  if (rows.length === 0) return null;

  const mc = buildRecapMcItems(moduleId, rows);
  const match = buildRecapMatchItem(moduleId, rows);
  const pool: RowTestItem[] = match ? [match, ...mc] : mc;

  // Cap to RECAP_ITEM_COUNT. Shuffle deterministically so the same recap
  // always presents items in the same order across renders.
  const shuffled = seededShuffle(pool, `${moduleId}-recap-pool`);
  const items = shuffled.slice(0, RECAP_ITEM_COUNT);

  const testStep: RowTestStep = {
    id: `ja-${moduleId}-recap-test`,
    type: "row_test",
    rowId: `${moduleId}-recap`,
    items,
    passThreshold: RECAP_PASS_THRESHOLD,
    maxRetries: RECAP_MAX_RETRIES,
  };

  const intro: InfoStep = {
    id: `ja-${moduleId}-recap-info-start`,
    type: "info",
    title: "Module recap",
    body: `Review of everything you learned in ${moduleTitle}. Pass with 70%+ to clear — miss an item and it comes back at the end of the queue. Skippable if you'd rather come back later.`,
    variant: "default",
  };

  const outro: InfoStep = {
    id: `ja-${moduleId}-recap-info-end`,
    type: "info",
    title: "Nice work!",
    body: "Module complete.",
    variant: "default",
  };

  return {
    id: `ja-${moduleId}-recap`,
    moduleId,
    courseId: "mock-1",
    languageId: "ja",
    title: `${moduleTitle} — Recap`,
    description: `Module-level recap for ${moduleTitle}.`,
    estimatedMinutes: 5,
    xpReward: 20,
    introducesVocabIds: [],
    steps: [intro, testStep, outro],
  };
}
