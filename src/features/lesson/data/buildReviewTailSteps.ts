/**
 * Per-lesson review tail — 3-4 retrieval items appended at the END of every
 * normal sub-lesson, drawing from kana introduced in PRIOR sub-lessons
 * (cross-row interleaving). Struggle-biased via the existing struggleStore.
 *
 * Pedagogy: Karpicke (retrieval-based recency) + Cepeda (spacing) + Hwang/
 * Yan interleaving. The tail lives between the row-final match/build and
 * the wrap-up info step so the learner's last interaction is recall.
 *
 * Gating rules (spec §B):
 *   - Skip if `priorLessons` is empty (first lesson — nothing to review).
 *   - Skip for sub-lessons that ARE the row test or module recap (those
 *     are themselves comprehensive review).
 *   - Skip if the cross-row pool is empty (e.g. first row of first module).
 *
 * Step mix (random, capped at `count`):
 *   ~50% multiple-choice (audio → kana / romaji → kana)
 *   ~30% match-pairs (one micro-match step)
 *   ~20% build-sentence (only if a qualifying anchor exists)
 *
 * Step ids are deterministically derived from `currentLessonId` so re-runs
 * of the same lesson produce stable item ids — important for testing and
 * for the existing per-step progress persistence.
 */
import type {
  LessonStep,
  MatchPairsStep,
  BuildSentenceStep,
} from "../types";
import type { AnchorWord, RowDef } from "./hiraganaCurriculum";
import { ALL_ROWS } from "./hiraganaCurriculum";
import { topStruggleKana } from "@/features/japanese/kanaMastery/struggleStore";
import { getTtsUrl } from "@/shared/japanese/tts";
import { tokenizeJapanese } from "@/shared/japanese/kanaTable";

export type ReviewTailOptions = {
  /** Id of the lesson the tail is being built for. Used to seed item ids. */
  currentLessonId: string;
  /** Row id of the current sub-lesson. Items from THIS row are excluded
   *  (already covered by the within-row carry-over match). */
  currentRowId: string;
  /** Ids of lessons the learner has marked done so far (cross-row pool). */
  priorLessonIds: ReadonlySet<string>;
  /** Per-language struggle scores. Defaults to ja. */
  lang?: string;
  /** Target item count. 3 default; bumped to 4 if struggleStore has >6 entries. */
  count?: 3 | 4;
};

/** Deterministic seeded shuffle so item id derivations stay stable. */
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
 * Yōon row ids — recognized as the "post-ya block" introduced in M2 under
 * the curriculum-restructure (2026-05-15). When the learner is on a
 * hiragana (M1) sub-lesson, the review tail must NOT draw items from
 * these rows or it'll cross-contaminate (small ゃゅょ before the ya-row
 * is taught). Encoded as a name prefix so adding more yōon rows later
 * doesn't require touching this file.
 */
function isYoonRowId(rowId: string): boolean {
  return rowId.startsWith("yoon-");
}

/**
 * Detect whether the current lesson is a hiragana (M1) lesson — used to
 * gate yōon items out of the cross-row review tail. We use the lesson id
 * shape (every M1 row sub-lesson follows `ja-m1-…`); the dakuten + yōon
 * rows also live under `ja-m1-` prefix per the builder, so we instead
 * check the row id against the HIRAGANA_ROWS set.
 */
function isHiraganaRowId(rowId: string): boolean {
  // Walk the curriculum catalog. HIRAGANA_ROWS are the 9 basic rows.
  for (const row of ALL_ROWS) {
    if (row.id !== rowId) continue;
    // Hiragana basic rows have no prerequisites and aren't yōon/dakuten.
    // Cheapest discriminator: row id is one of the basic 9 (ka/sa/.../wa).
    return BASIC_HIRAGANA_IDS.has(rowId);
  }
  return false;
}
const BASIC_HIRAGANA_IDS = new Set([
  "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa",
]);

/**
 * Walk the row catalog and collect anchor words from rows that have ANY
 * completed sub-lesson in `priorLessonIds`, EXCLUDING the current row.
 * The pool is the universe of items the tail can draw from.
 *
 * When the current row is a hiragana M1 row, yōon rows are excluded from
 * the pool too — small ゃゅょ items can't pre-empt the ya-row teaching.
 */
function collectReviewPool(
  currentRowId: string,
  priorLessonIds: ReadonlySet<string>,
): {
  anchorWords: AnchorWord[];
  introducedKana: Set<string>;
  rowsTouched: RowDef[];
} {
  const anchorWords: AnchorWord[] = [];
  const introducedKana = new Set<string>();
  const rowsTouched: RowDef[] = [];
  const anchorSeen = new Set<string>();
  const skipYoon = isHiraganaRowId(currentRowId);
  for (const row of ALL_ROWS) {
    if (row.id === currentRowId) continue;
    if (skipYoon && isYoonRowId(row.id)) continue;
    // Did the learner complete any sub-lesson of this row?
    const subs = row.subLessons ?? [];
    let hit = false;
    for (const sub of subs) {
      const lessonId = `ja-m1-${row.id}-${sub.suffix}`;
      if (priorLessonIds.has(lessonId)) {
        hit = true;
        // Track which kana the learner has been introduced to (from
        // non-test sub-lessons only — test sub-lessons don't "introduce").
        if (!sub.isTest) {
          for (const k of sub.introduces) introducedKana.add(k.kana);
        }
      }
    }
    if (!hit) continue;
    rowsTouched.push(row);
    for (const w of row.anchorWords) {
      if (anchorSeen.has(w.kana)) continue;
      anchorSeen.add(w.kana);
      anchorWords.push(w);
    }
  }
  return { anchorWords, introducedKana, rowsTouched };
}

/**
 * Rank candidate anchors so struggle-priority items float to the front.
 * "Struggle priority" = the word contains a kana in the struggle store's
 * top-N. Ties are broken randomly (seeded) so we don't always serve the
 * same items.
 */
function rankByStruggle(
  candidates: AnchorWord[],
  lang: string,
  seed: string,
): AnchorWord[] {
  const top = new Set(topStruggleKana(lang, 8));
  const scored = candidates.map((w) => {
    const hit = Array.from(w.kana).filter((c) => top.has(c)).length;
    return { w, score: hit };
  });
  // Stable shuffle within each score bucket.
  const shuffled = seededShuffle(scored, seed);
  shuffled.sort((a, b) => b.score - a.score);
  return shuffled.map((s) => s.w);
}

function buildReviewMatchStep(
  anchors: AnchorWord[],
  currentLessonId: string,
  idx: number,
): MatchPairsStep | null {
  if (anchors.length < 2) return null;
  const pairs = anchors.slice(0, 4).map((w, i) => ({
    id: `p${i + 1}`,
    source: w.kana,
    target: w.meaning,
    sourceAnnotation: [{ surface: w.kana, reading: w.kana }],
  }));
  return {
    id: `${currentLessonId}-tail-match-${idx}`,
    type: "match_pairs",
    prompt: "Match each Japanese word to its meaning",
    pairs,
  };
}

function buildReviewBuildStep(
  anchor: AnchorWord,
  currentLessonId: string,
  idx: number,
): BuildSentenceStep | null {
  const answerMora = tokenizeJapanese(anchor.kana)
    .filter((t) => t.kana)
    .map((t) => t.text);
  if (answerMora.length < 2) return null;
  // Decoys: pad with single-character variants. Use the anchor's last
  // mora variant as a placeholder decoy. Keep the bank small.
  const decoys = answerMora.slice(0, 1);
  const tiles = seededShuffle(
    [...answerMora, ...decoys],
    `${currentLessonId}-tail-build-${idx}`,
  );
  const audioUrl = getTtsUrl(anchor.kana);
  return {
    id: `${currentLessonId}-tail-build-${idx}`,
    type: "build_sentence",
    prompt: `Build the Japanese word for "${anchor.meaning}"`,
    targetSentence: anchor.kana,
    tiles,
    correctOrder: answerMora,
    granularity: "character",
    audioKey: audioUrl ?? undefined,
    targetAnnotation: [{ surface: anchor.kana, reading: anchor.kana }],
  };
}

/**
 * Build the review-tail step list. Returns an empty array when the source
 * pool is empty — callers should treat that as "no tail this lesson".
 */
export function buildReviewTailSteps(opts: ReviewTailOptions): LessonStep[] {
  const {
    currentLessonId,
    currentRowId,
    priorLessonIds,
    lang = "ja",
    count: countOpt,
  } = opts;
  if (priorLessonIds.size === 0) return [];

  const { anchorWords } = collectReviewPool(
    currentRowId,
    priorLessonIds,
  );
  if (anchorWords.length === 0) return [];

  // 4 items if struggle store has many entries, else 3.
  const struggleTopCount = topStruggleKana(lang, 7).length;
  const count = countOpt ?? (struggleTopCount > 6 ? 4 : 3);

  const ranked = rankByStruggle(
    anchorWords,
    lang,
    `${currentLessonId}-tail-rank`,
  );

  const steps: LessonStep[] = [];
  // Step mix: 1 match if anchors >= 2, then optionally a build at the
  // end. Cap to `count`.
  //
  // The previous mix also emitted "Which kana means '<word>'?" MC items
  // via buildReviewMcStep, but that prompt is incoherent for multi-kana
  // anchors (e.g. pond = いけ → no single kana "means" pond). Pruned
  // 2026-05-17; helper deleted. Match + build still serve retrieval.

  // Track anchors used so we don't reuse the same word in multiple steps.
  const used = new Set<string>();

  // 1) Match step (1 step, uses up to 4 anchors)
  const matchAnchors = ranked.slice(0, 4).filter((w) => !used.has(w.kana));
  const match = buildReviewMatchStep(matchAnchors, currentLessonId, 0);
  if (match) {
    matchAnchors.slice(0, 4).forEach((w) => used.add(w.kana));
    steps.push(match);
  }

  // 2) Optional build at the end if we still have room and a qualifying
  //    multi-mora anchor remains.
  if (steps.length < count) {
    for (const anchor of ranked) {
      if (used.has(anchor.kana)) continue;
      const build = buildReviewBuildStep(anchor, currentLessonId, 0);
      if (build) {
        steps.push(build);
        used.add(anchor.kana);
        break;
      }
    }
  }

  return steps.slice(0, count);
}
