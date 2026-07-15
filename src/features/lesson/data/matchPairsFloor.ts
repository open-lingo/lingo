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
 * Pools are LANGUAGE-KEYED (2026-07-15): ja grids fill from the ja pools
 * above, es meaning grids fill from the ES atom registry (same ordering
 * discipline), and any other language's lesson is returned UNTOUCHED —
 * before the dispatch this pass ran for every language and would have
 * backfilled a short es/ko meaning grid with JAPANESE pairs.
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
// ES pool: the aggregate registry is a LAZY getter (it breaks the
// courseAtoms ↔ curriculum/m{n} import cycle) — call getEsCourseAtoms()
// at fill time only, never snapshot it at module scope.
import {
  getEsCourseAtoms,
  type EsAtom,
} from "@/features/languages/es/courseAtoms";
import { KANA_ROMAJI } from "@/shared/japanese/kanaTable";
import { CONFUSABLES } from "./hiraganaCurriculum";
import {
  getSRSStore,
  canonicalizeCardId,
  type SRSStore,
} from "@/features/flashcards/engine/srsStorage";
import { seededShuffle } from "@/shared/utils/seededShuffle";

export const MATCH_PAIRS_FLOOR = 6;

type GridShape = "romaji" | "meaning" | "other";

/**
 * Infer a grid's relation from its existing pairs.
 *  - romaji: every source is a single kana unit from the romanization
 *    table AND every target is a short lowercase-latin sound. Structural,
 *    not string-equal: authored romanization variants (ヲ→"wo" where the
 *    table says "o") must still classify as a sound grid — the strict
 *    equality check silently reclassified m12's ワ/ヲ/ン grid as "meaning"
 *    and padded vocab sentences into a "match the sounds" prompt
 *    (QA 2026-07-11). Vocab sources (うみ, multi-kana words) are never
 *    KANA_ROMAJI keys, so meaning grids with short glosses stay "meaning".
 *  - meaning: every target contains a latin letter (English gloss).
 *  - other: anything else (number grids いち→1, conjugation たべる→たべます,
 *    Korean blocks, …) — left untouched.
 */
export function matchGridShape(pairs: readonly MatchPair[]): GridShape {
  if (pairs.length === 0) return "other";
  if (
    pairs.every(
      (p) =>
        KANA_ROMAJI[p.source] !== undefined && /^[a-z]{1,4}$/.test(p.target),
    )
  )
    return "romaji";
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

let esFrequencyIndex: Map<string, number> | null = null;

/**
 * ES analog of getFrequencyIndex: how often each atom surface appears
 * across the raw ES lessons. Latin script needs word-boundary matching —
 * bare .includes() counts "el" inside "hello", and \b misfires on
 * accented letters (í/ñ sit outside \w) — so match on \p{L} edges.
 */
function getEsFrequencyIndex(
  rawLessons: readonly LessonContent[],
): Map<string, number> {
  if (esFrequencyIndex) return esFrequencyIndex;
  const counts = new Map<string, number>();
  const surfaces = [...new Set(getEsCourseAtoms().map((a) => a.surface))];
  const matchers = surfaces.map((surface) => ({
    surface,
    re: new RegExp(`(?<![\\p{L}])${escapeRegex(surface)}(?![\\p{L}])`, "iu"),
  }));
  for (const lesson of rawLessons) {
    if (lesson.languageId !== "es") continue;
    const blob = JSON.stringify(lesson.steps);
    for (const m of matchers) {
      if (m.re.test(blob)) {
        counts.set(m.surface, (counts.get(m.surface) ?? 0) + 1);
      }
    }
  }
  esFrequencyIndex = counts;
  return counts;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
function weaknessScore(
  atomId: string,
  todayMs: number,
  store: SRSStore,
): number {
  const state = store[canonicalizeCardId(atomId)];
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
  /** Course-ordered module ids for the context's language — the es
   *  meaning-fill module cutoff. Derived from the live course, which
   *  skips unauthored stub modules, so a stub module's atoms (registered
   *  but never taught) never enter the pool. The ja path derives its
   *  cutoff via getAtomsUpToModule instead and ignores this. */
  moduleOrder: readonly string[];
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
  // Language dispatch: fill pools are language-keyed, and only ja and es
  // have one. Any other language returns UNCHANGED — a short grid beats
  // one "fixed" with another language's vocabulary. `ctx` must be built
  // for `lesson.languageId` (getMatchPadContext caches one per language).
  if (lesson.languageId !== "ja" && lesson.languageId !== "es") return lesson;
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
      const extra = buildFill(step, pairs, need, ctx, lesson, shape);
      if (extra.length > 0) next = [...pairs, ...extra];
    }
    if (!deduped && next === pairs) return step;
    changed = true;
    return { ...step, pairs: next };
  });
  return changed ? { ...lesson, steps } : lesson;
}

/** Route a short grid to its language's fill pool (see header). */
function buildFill(
  step: LessonStep & { type: "match_pairs" },
  pairs: readonly MatchPair[],
  need: number,
  ctx: MatchPadContext,
  lesson: LessonContent,
  shape: Exclude<GridShape, "other">,
): MatchPair[] {
  if (lesson.languageId === "es") {
    // A "romaji" classification on Latin-script es can only mean
    // mis-authored kana sources — never pad those from the ja pool.
    return shape === "meaning"
      ? buildEsMeaningFill(step, pairs, need, ctx, lesson.moduleId)
      : [];
  }
  return shape === "romaji"
    ? buildRomajiFill(step, pairs, need, ctx, lesson.id)
    : buildMeaningFill(step, pairs, need, ctx, lesson.moduleId);
}

/**
 * Pick up to `need` fill candidates whose source AND target text collide
 * with nothing already in the grid or already picked. Two visually
 * identical tiles turn a 3-strike match grid into a coin flip — found
 * live with homophone atoms (花/鼻 both render はな), and latent on the
 * romaji path (ず/づ both "zu"). Ranking upstream is SRS-state-dependent,
 * so uniqueness must be enforced at pick time, not assumed from the pool.
 */
export function pickNonColliding<T>(
  ranked: readonly T[],
  need: number,
  usedSources: Set<string>,
  usedTargets: Set<string>,
  getSource: (c: T) => string,
  getTarget: (c: T) => string,
): T[] {
  const picked: T[] = [];
  for (const c of ranked) {
    if (picked.length >= need) break;
    const s = getSource(c);
    const t = getTarget(c).toLowerCase();
    if (usedSources.has(s) || usedTargets.has(t)) continue;
    usedSources.add(s);
    usedTargets.add(t);
    picked.push(c);
  }
  return picked;
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
  const usedTargets = new Set(pairs.map((p) => p.target.toLowerCase()));
  return pickNonColliding(
    ranked,
    need,
    present,
    usedTargets,
    (kana) => kana,
    (kana) => KANA_ROMAJI[kana] ?? "",
  ).map((kana, i) => ({
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
  // step id — ja-m1-* landmine). WORDS ONLY: phrase-kind atoms (full
  // example sentences like これは あおいです) wrap to two-line cards and
  // don't belong in a word↔meaning grid (Spencer QA 2026-07-13, found
  // padded into ja-m3-2-1's review match). The whitespace check backstops
  // atoms whose kind is missing or mislabeled.
  const prior = getAtomsUpToModule(moduleId).filter(
    (a) =>
      isSrsEligibleAtom(a) &&
      !present.has(a.kana) &&
      /[a-zA-Z]/.test(a.meaningEn) &&
      a.kind !== "phrase" &&
      !/\s/.test(a.kana),
  );
  if (prior.length === 0) return [];
  const freq = getFrequencyIndex(ctx.rawLessons);
  const seed = step.id;
  const shuffled = seededShuffle(prior, seed);
  // Read the SRS store ONCE and precompute each atom's weakness before
  // sorting. Calling weaknessScore inside the comparator re-parsed the
  // entire localStorage store on every comparison — O(P·logP) full-store
  // JSON.parses — which pins the main thread once a real backlog exists
  // (e.g. after an Anki import seeds hundreds of cards).
  const store = getSRSStore();
  const weakness = new Map<string, number>();
  for (const atom of prior) {
    weakness.set(atom.id, weaknessScore(atom.id, ctx.todayMs, store));
  }
  const ranked = [...shuffled].sort((a, b) => {
    const wa = weakness.get(a.id) ?? 0;
    const wb = weakness.get(b.id) ?? 0;
    if (wa !== wb) return wb - wa; // weakest first
    // tie-break: rarer (less-reviewed) first
    const fa = freq.get(a.kana) ?? 0;
    const fb = freq.get(b.kana) ?? 0;
    return fa - fb;
  });
  const usedSources = new Set(pairs.map((p) => p.source));
  const usedTargets = new Set(pairs.map((p) => p.target.toLowerCase()));
  return pickNonColliding(
    ranked,
    need,
    usedSources,
    usedTargets,
    (atom) => atom.kana,
    (atom) => atom.meaningEn,
  ).map((atom: CourseAtom, i) => ({
    id: `${step.id}-fill-${i}`,
    source: atom.kana,
    target: atom.meaningEn,
    // sourceAnnotation omitted — AnnotatedText renders bare kana fine, and
    // the singleton-annotation helper isn't exported.
  }));
}

/**
 * ES meaning backfill — buildMeaningFill's ordering discipline (seeded
 * shuffle → FSRS weakness → corpus rarity) over the live ES atom
 * registry. Prior-only via the es course module order carried on the
 * context (`ctx.moduleOrder`, at-or-before this lesson's module). Phrase
 * atoms are excluded for the same reason as ja: full sentences wrap to
 * two-line cards and don't belong in a word↔meaning grid.
 */
function buildEsMeaningFill(
  step: LessonStep & { type: "match_pairs" },
  pairs: readonly MatchPair[],
  need: number,
  ctx: MatchPadContext,
  moduleId: string,
): MatchPair[] {
  const present = new Set(pairs.map((p) => p.source));
  const cutoff = ctx.moduleOrder.indexOf(moduleId);
  if (cutoff === -1) return [];
  const taught = new Set(ctx.moduleOrder.slice(0, cutoff + 1));
  const prior = getEsCourseAtoms().filter(
    (a) =>
      a.srsEligible &&
      a.fromModule !== undefined &&
      taught.has(a.fromModule) &&
      !present.has(a.surface) &&
      /[a-zA-Z]/.test(a.gloss) &&
      a.kind !== "phrase",
  );
  if (prior.length === 0) return [];
  const freq = getEsFrequencyIndex(ctx.rawLessons);
  const shuffled = seededShuffle(prior, step.id);
  // One store read + precomputed weakness — same O(P) discipline as the
  // ja path (see the comparator note in buildMeaningFill).
  const store = getSRSStore();
  const weakness = new Map<string, number>();
  for (const atom of prior) {
    weakness.set(atom.id, weaknessScore(atom.id, ctx.todayMs, store));
  }
  const ranked = [...shuffled].sort((a, b) => {
    const wa = weakness.get(a.id) ?? 0;
    const wb = weakness.get(b.id) ?? 0;
    if (wa !== wb) return wb - wa; // weakest first
    // tie-break: rarer (less-reviewed) first
    const fa = freq.get(a.surface) ?? 0;
    const fb = freq.get(b.surface) ?? 0;
    return fa - fb;
  });
  const usedSources = new Set(pairs.map((p) => p.source));
  const usedTargets = new Set(pairs.map((p) => p.target.toLowerCase()));
  return pickNonColliding(
    ranked,
    need,
    usedSources,
    usedTargets,
    (atom) => atom.surface,
    (atom) => atom.gloss,
  ).map((atom: EsAtom, i) => ({
    id: `${step.id}-fill-${i}`,
    source: atom.surface,
    target: atom.gloss,
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
  esFrequencyIndex = null;
  priorKanaByLesson = null;
}
