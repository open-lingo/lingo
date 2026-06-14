/**
 * Central match_pairs FLOOR pass (Spencer 2026-06-13).
 *
 * Every `match_pairs` grid must offer at least MATCH_PAIRS_FLOOR pairs, so a
 * learner can't brute-force the last match by elimination (a 3-pair grid
 * leaves the final pair forced). Rather than edit all ~13 construction
 * sites, this single post-pass runs in `getMockLessonContent` over the
 * fully-assembled lesson and backfills any short grid — turning the spare
 * slots into spaced review.
 *
 * Backfill is SHAPE-AWARE (only two paddable shapes; everything else is
 * left exactly as authored, which naturally exempts the m5 number grids
 * and the m7 conjugation grid):
 *
 *  - "romaji"  (kana → romaji, e.g. き→ki): backfill from already-learned
 *    kana of PRIOR lessons in course order, biased toward confusables.
 *    Solves the m2 yōon 3→6 case (only 3 yōon exist per consonant).
 *  - "meaning" (word → English, e.g. ビール→beer): backfill from prior
 *    SRS-eligible atoms (≤ this lesson's module), weighted by FSRS
 *    weakness (overdue / low stability / high difficulty, read-only) and
 *    falling back to corpus rarity then a deterministic seeded order.
 *
 * Invariants:
 *  - READ-ONLY against the SRS store. This pass NEVER writes card state —
 *    content-lesson SRS writes are forbidden (only review lessons write).
 *  - Prior-only: backfill never introduces a not-yet-taught word/kana.
 *  - Deterministic on the no-FSRS path (seeded by step id) so tests/SSR
 *    are stable; the FSRS path is intentionally per-learner adaptive.
 */
import type { LessonContent, LessonStep, MatchPair } from "../types";
import type { CourseAtom } from "@/features/languages/ja/courseAtoms";
import {
  JA_COURSE_ATOMS_BY_KANA,
  isSrsEligibleAtom,
} from "@/features/languages/ja/courseAtoms";
import { getAtomsUpToModule } from "./lessonAtomIndex";
import { KANA_ROMAJI } from "@/shared/japanese/kanaTable";
import { CONFUSABLES } from "./hiraganaCurriculum";
import { getCardState } from "@/features/flashcards/engine/srsStorage";
import { seededShuffle } from "@/shared/utils/seededShuffle";

export const MATCH_PAIRS_FLOOR = 6;

type GridShape = "romaji" | "meaning" | "other";

/**
 * Infer a grid's relation from its existing pairs.
 *  - romaji: every target is the romaji of its kana source.
 *  - meaning: every target contains a latin letter (English gloss) and is
 *    NOT the source's romaji.
 *  - other: anything else (number grids いち→1, conjugation たべる→たべます,
 *    Korean blocks, …) — left untouched.
 */
export function matchGridShape(pairs: readonly MatchPair[]): GridShape {
  if (pairs.length === 0) return "other";
  if (pairs.every((p) => KANA_ROMAJI[p.source] === p.target)) return "romaji";
  if (pairs.every((p) => /[a-zA-Z]/.test(p.target))) return "meaning";
  return "other";
}

/* ── corpus rarity index (no-FSRS fallback for "least reviewed first") ── */

let frequencyIndex: Map<string, number> | null = null;

/**
 * Count how often each atom kana appears across the raw curriculum so the
 * fallback backfill can surface UNDER-reviewed words first. Built lazily
 * from a raw-lesson provider (no post-passes) to avoid recursing through
 * `getMockLessonContent`.
 */
function getFrequencyIndex(
  rawLessons: readonly LessonContent[],
): Map<string, number> {
  if (frequencyIndex) return frequencyIndex;
  const counts = new Map<string, number>();
  for (const lesson of rawLessons) {
    const blob = JSON.stringify(lesson.steps);
    for (const kana of JA_COURSE_ATOMS_BY_KANA.keys()) {
      if (blob.includes(kana)) {
        counts.set(kana, (counts.get(kana) ?? 0) + 1);
      }
    }
  }
  frequencyIndex = counts;
  return counts;
}

/* ── course-order prior-kana index (for romaji grids) ── */

let priorKanaByLesson: Map<string, string[]> | null = null;

/**
 * For each lesson id (in course order), the list of single kana introduced
 * in STRICTLY EARLIER lessons — the legal backfill pool for a kana→romaji
 * grid in that lesson. Built from raw lessons; memoized.
 */
function getPriorKanaIndex(
  orderedLessonIds: readonly string[],
  rawById: ReadonlyMap<string, LessonContent>,
): Map<string, string[]> {
  if (priorKanaByLesson) return priorKanaByLesson;
  const out = new Map<string, string[]>();
  const seen: string[] = [];
  const seenSet = new Set<string>();
  for (const id of orderedLessonIds) {
    out.set(id, [...seen]);
    const lesson = rawById.get(id);
    if (!lesson) continue;
    for (const kana of collectKanaFromSteps(lesson.steps)) {
      if (!seenSet.has(kana) && KANA_ROMAJI[kana]) {
        seenSet.add(kana);
        seen.push(kana);
      }
    }
  }
  priorKanaByLesson = out;
  return out;
}

function collectKanaFromSteps(steps: readonly LessonStep[]): string[] {
  const kana: string[] = [];
  for (const s of steps as unknown as Array<Record<string, unknown>>) {
    // symbol_intro / symbol_recognition / symbol_to_sound carry payload.symbol
    const payload = s.payload as { symbol?: string } | undefined;
    if (payload?.symbol && KANA_ROMAJI[payload.symbol]) kana.push(payload.symbol);
    const pairs = s.pairs as MatchPair[] | undefined;
    if (pairs) for (const p of pairs) if (KANA_ROMAJI[p.source]) kana.push(p.source);
  }
  return kana;
}

/* ── FSRS-weakness scoring for "meaning" backfill ── */

const DAY_MS = 86_400_000;

/**
 * Higher = needs more review. Overdue days dominate; then low stability;
 * then high difficulty. Atoms with no card state score 0 here (handled by
 * the frequency fallback so brand-new learners still get a full grid).
 */
function weaknessScore(atomId: string, todayMs: number): number {
  const state = getCardState(atomId);
  if (!state) return 0;
  let worst = 0;
  for (const m of ["recognition", "production"] as const) {
    const sub = state[m];
    if (!sub) continue;
    const dueMs = new Date(sub.dueDate).getTime();
    const overdueDays = Number.isFinite(dueMs)
      ? Math.max(0, (todayMs - dueMs) / DAY_MS)
      : 0;
    const score =
      overdueDays * 10 +
      (sub.stability > 0 ? 100 / sub.stability : 100) +
      (sub.difficulty ?? 0);
    if (score > worst) worst = score;
  }
  return worst;
}

/* ── the pass ── */

export type MatchPadContext = {
  /** Raw (un-padded) lessons, for the rarity index. */
  rawLessons: readonly LessonContent[];
  /** Course-ordered lesson ids + raw lookup, for the prior-kana index. */
  orderedLessonIds: readonly string[];
  rawById: ReadonlyMap<string, LessonContent>;
  /** Today's epoch ms (injected so the pass stays pure/testable). */
  todayMs: number;
};

/**
 * Pad every short, paddable match_pairs grid in `lesson` to the floor.
 * Returns a new lesson when anything changed, else the original.
 */
export function padMatchPairsFloor(
  lesson: LessonContent,
  ctx: MatchPadContext,
): LessonContent {
  let changed = false;
  const steps = lesson.steps.map((step) => {
    if (step.type !== "match_pairs") return step;
    // Dedupe by source first — a duplicate source is a broken grid (some
    // authored review pools pick the same atom twice, e.g. すし×2 in
    // ja-m8-1-1). Dedupe then top back up to the floor.
    const pairs = dedupeBySource(step.pairs);
    const deduped = pairs.length !== step.pairs.length;
    const shape = matchGridShape(pairs);
    let next = pairs;
    if (shape !== "other" && pairs.length < MATCH_PAIRS_FLOOR) {
      const need = MATCH_PAIRS_FLOOR - pairs.length;
      const extra =
        shape === "romaji"
          ? buildRomajiFill(step, pairs, need, ctx, lesson.id)
          : buildMeaningFill(step, pairs, need, ctx, lesson.moduleId);
      if (extra.length > 0) next = [...pairs, ...extra];
    }
    if (!deduped && next === pairs) return step;
    changed = true;
    return { ...step, pairs: next };
  });
  return changed ? { ...lesson, steps } : lesson;
}

/** Drop pairs whose source already appeared (keep first occurrence). */
function dedupeBySource(pairs: readonly MatchPair[]): MatchPair[] {
  const seen = new Set<string>();
  const out: MatchPair[] = [];
  for (const p of pairs) {
    if (seen.has(p.source)) continue;
    seen.add(p.source);
    out.push(p);
  }
  return out;
}

function buildRomajiFill(
  step: LessonStep & { type: "match_pairs" },
  pairs: readonly MatchPair[],
  need: number,
  ctx: MatchPadContext,
  lessonId: string,
): MatchPair[] {
  const present = new Set(pairs.map((p) => p.source));
  // Prior-only: kana introduced in STRICTLY EARLIER lessons. Keyed by the
  // owning lesson id (NOT the step id — m2 rows carry ja-m1-* step ids).
  const priorKana = getPriorKanaIndex(ctx.orderedLessonIds, ctx.rawById).get(
    lessonId,
  );
  const pool = (priorKana ?? [...allPriorKana(ctx)]).filter(
    (k) => !present.has(k),
  );
  const ranked = confusableBias(pairs, pool);
  return ranked.slice(0, need).map((kana, i) => ({
    id: `${step.id}-fill-${i}`,
    source: kana,
    target: KANA_ROMAJI[kana] ?? "",
  }));
}

function buildMeaningFill(
  step: LessonStep & { type: "match_pairs" },
  pairs: readonly MatchPair[],
  need: number,
  ctx: MatchPadContext,
  moduleId: string,
): MatchPair[] {
  const present = new Set(pairs.map((p) => p.source));
  // Prior-only via module cutoff (lesson.moduleId, NOT parsed from the
  // step id — ja-m1-* landmine).
  const prior = getAtomsUpToModule(moduleId).filter(
    (a) => isSrsEligibleAtom(a) && !present.has(a.kana) && /[a-zA-Z]/.test(a.meaningEn),
  );
  if (prior.length === 0) return [];
  const freq = getFrequencyIndex(ctx.rawLessons);
  const seed = step.id;
  const shuffled = seededShuffle(prior, seed);
  const ranked = [...shuffled].sort((a, b) => {
    const wa = weaknessScore(a.id, ctx.todayMs);
    const wb = weaknessScore(b.id, ctx.todayMs);
    if (wa !== wb) return wb - wa; // weakest first
    // tie-break: rarer (less-reviewed) first
    const fa = freq.get(a.kana) ?? 0;
    const fb = freq.get(b.kana) ?? 0;
    return fa - fb;
  });
  return ranked.slice(0, need).map((atom: CourseAtom, i) => ({
    id: `${step.id}-fill-${i}`,
    source: atom.kana,
    target: atom.meaningEn,
    // sourceAnnotation omitted — AnnotatedText renders bare kana fine, and
    // the singleton-annotation helper isn't exported.
  }));
}

/** Confusable-biased ordering for romaji fill: confusables of present kana
 *  first (harder distractors), then the rest in deterministic seeded order. */
function confusableBias(
  pairs: readonly MatchPair[],
  pool: string[],
): string[] {
  const confusable = new Set<string>();
  for (const p of pairs) for (const c of CONFUSABLES[p.source] ?? []) confusable.add(c);
  const front = pool.filter((k) => confusable.has(k));
  const back = seededShuffle(
    pool.filter((k) => !confusable.has(k)),
    pairs.map((p) => p.source).join(""),
  );
  return [...front, ...back];
}

function allPriorKana(ctx: MatchPadContext): Set<string> {
  const all = new Set<string>();
  for (const list of getPriorKanaIndex(ctx.orderedLessonIds, ctx.rawById).values()) {
    for (const k of list) all.add(k);
  }
  return all;
}

/** Test hook: reset memoized indexes (call when curriculum data is mocked). */
export function __resetMatchPadIndexes(): void {
  frequencyIndex = null;
  priorKanaByLesson = null;
}
