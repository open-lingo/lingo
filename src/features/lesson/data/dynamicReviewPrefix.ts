import type { LessonContent, LessonStep } from "../types";
import { isDedicatedReviewLesson } from "./reviewTailSrs";
import {
  buildSwitchoverBeat,
  composeAtomSteps,
  scanReviewCandidates,
  selectReviewHalves,
  type ReviewCandidate,
  type ReviewPick,
} from "./buildSrsReviewLesson";
import { getMinedTranslatedSentences } from "./minedSentences";
import {
  getGrammarReviewIndex,
  sentenceVocabAtomIds,
  clozeStepSentence,
} from "./grammarReviewIndex";
import { buildGrammarReviewQueue } from "@/features/flashcards/engine/grammarSrs";
import { isDue, getToday } from "@/features/flashcards/engine/srs";
import { parseModuleIndex } from "@/shared/settings/romanizationAutoFlip";
import {
  SENTENCE_REUSE_MIN_GAP,
  primarySentenceOf,
} from "./contentFloors";

/**
 * B069 phase 1 (Spencer 2026-07-30, decision-brief-2026-07-29 §1, option 3):
 * a render-time DYNAMIC SEGMENT prepended onto the STATIC authored review
 * lessons (`ja-mN-neo-review-*`) at content-load time — the same layer where
 * `kanaReviewTails` appends its tails. The authored IR review bodies are
 * untouched (phase 2, IR dynamic-slot interleaving, is deliberately
 * deferred); the dynamic behaviours that used to live only inside the
 * dormant `buildSrsReviewLesson` ride on top:
 *
 *   (a) the kana→kanji switchover beat (B061) when a candidate is ready,
 *   (b) the review portion — half FSRS-due, half recent (RULE 3, 2026-09-15;
 *       sentence-context via the shared miner),
 *   (c) due Track B grammar-point steps,
 *   (d) reserved seats for new (never-reviewed) cards — the B065 intake.
 *
 * That is also the PRIORITY order when the segment is over budget: the beat
 * always ships whole, then the review portion, then grammar, then intake seats
 * (Spencer: "due-first when over budget" — and within the review portion, due
 * is the half that never yields, see `selectReviewHalves`).
 *
 * Grading needs NO new plumbing: the merged lesson keeps its
 * `ja-mN-neo-review-*` id, which `isDedicatedReviewLesson` already matches,
 * so `LessonPage.handleStepComplete` grades the prefix through the exact
 * gates the authored body uses (`shouldWriteSrs` → per-atom
 * `shouldWriteReviewLessonAtom`), and `latchCompletedSwitchover` pairs the
 * beat's reveal/cloze by id suffix on completion.
 *
 * EMPTY STATE: a learner with NOTHING UNLOCKED gets the authored lesson back
 * BYTE-IDENTICAL (same object reference — no copy, no reshuffle), as does one
 * with nothing due, nothing recent-and-studied, nothing latched-pending and no
 * new candidates. Note that since RULE 3 the second case is rarer: an active
 * learner always has recent non-due material, and giving them half a lesson of
 * it is the point (#91/#116).
 */

/**
 * Hard cap on the dynamic segment. Authored review lessons already run
 * 15–20 steps (measured across m9/m16/m22, 2026-07-30), so the prefix must
 * stay a minority of the session or replays stop being sane. 10 covers the
 * worst-case beat (one-time explainer + 2 reveal/cloze pairs = 5 steps)
 * while still leaving ≥5 seats for due material under it.
 */
export const DYNAMIC_REVIEW_PREFIX_CAP = 10;

/** Track B steps in the prefix. Small so vocab dominates — the full builder
 *  uses 2–4 for a whole lesson; the prefix is a fraction of one. */
const PREFIX_MAX_GRAMMAR = 2;

/** RULE 2's key for a step, or "" when it is not sentence-level. */
function sentenceKeyOf(step: LessonStep): string {
  const { key, tokens } = primarySentenceOf(step);
  return tokens >= 2 ? key : "";
}

/**
 * Insert `steps` one at a time (priority order preserved) so that no two
 * adjacent steps share a type — including the seam against the last beat
 * step (`prevType`) and the first authored step (`followerType`) — and so
 * that no two steps within `SENTENCE_REUSE_MIN_GAP` share a SENTENCE (RULE 2,
 * Spencer 2026-09-15: "one sentence should NEVER be less than two steps
 * between re-uses even if the step type is different").
 *
 * The sentence half matters here specifically because the prefix is composed
 * from mined sentences and then glued in front of an AUTHORED body it has
 * never seen: the merged lesson is the surface the learner walks, so the rule
 * has to hold across the seam (`followerSentences`), not just inside the
 * prefix. The compiler enforces the same rule for the authored body itself.
 *
 * A step with no legal slot is dropped: at CAP size that only happens to the
 * lowest-priority entries, which is the correct sacrifice.
 *
 * Exported for `reviewSplit.test.ts`: the live fixtures' mined sentences do not
 * happen to collide with their authored bodies, so the seam guard is
 * defensive there — the only way to show it works is to plant a collision.
 */
export function placeAvoidingSameType(
  steps: readonly LessonStep[],
  prevType: string | undefined,
  followerType: string | undefined,
  prevSentences: readonly string[] = [],
  followerSentences: readonly string[] = [],
): LessonStep[] {
  const out: LessonStep[] = [];
  const typeAt = (i: number): string | undefined =>
    i < 0 ? prevType : out[i]?.type;
  /** Sentence at absolute position `i` of [prev… , out…, follower…]. */
  const sentenceAt = (i: number): string => {
    if (i < 0) {
      // -1 is the step immediately before `out[0]`, -2 the one before that.
      const back = prevSentences[prevSentences.length + i];
      return back ?? "";
    }
    if (i < out.length) return sentenceKeyOf(out[i]);
    return followerSentences[i - out.length] ?? "";
  };
  /** Would placing `key` at index `i` sit within the gap of the same sentence? */
  const sentenceClashAt = (key: string, i: number): boolean => {
    if (!key) return false;
    for (let d = 1; d < SENTENCE_REUSE_MIN_GAP; d++) {
      if (sentenceAt(i - d) === key) return true;
      // `i` is an INSERT position: what currently sits at i shifts to i+1, so
      // the forward neighbours are at i, i+1, …
      if (sentenceAt(i + d - 1) === key) return true;
    }
    return false;
  };

  const insertInterior = (step: LessonStep): boolean => {
    const key = sentenceKeyOf(step);
    for (let i = out.length - 1; i >= 0; i--) {
      if (
        typeAt(i - 1) !== step.type &&
        out[i].type !== step.type &&
        !sentenceClashAt(key, i)
      ) {
        out.splice(i, 0, step);
        return true;
      }
    }
    return false;
  };

  for (const step of steps) {
    if (
      typeAt(out.length - 1) !== step.type &&
      !sentenceClashAt(sentenceKeyOf(step), out.length)
    ) {
      out.push(step);
      continue;
    }
    insertInterior(step); // no slot → dropped
  }
  // Seam with the authored body: the last prefix step must not share the
  // authored first step's type. Reinsertion never lands at the tail, so this
  // loop strictly shrinks or fixes.
  while (
    out.length > 0 &&
    followerType !== undefined &&
    out[out.length - 1].type === followerType
  ) {
    const last = out.pop()!;
    if (!insertInterior(last)) break; // dropped
  }
  return out;
}

/**
 * Build the dynamic segment for one dedicated review lesson from the
 * learner's live FSRS/unlock/latch state. Pure construction (D4): reads
 * state, never writes it. Returns [] when there is nothing dynamic to say.
 */
export function buildDynamicReviewPrefix(lesson: LessonContent): LessonStep[] {
  if (lesson.languageId !== "ja") return [];
  const scan = scanReviewCandidates(lesson.moduleId, lesson.languageId);
  // Nothing unlocked → nothing due, nothing latched-pending, no intake. Bail
  // before touching the sentence miner so a fresh profile (and every clean
  // test store) never pays the whole-course walk.
  if (scan.unlockedIds.size === 0) return [];

  // Prefix ids carry a `-dyn` marker: distinguishable from authored step ids
  // (tests + QA lean on it) while keeping the lesson id itself unchanged for
  // the grading gates.
  const prefixId = `${lesson.id}-dyn`;
  const learnerModule = parseModuleIndex(lesson.moduleId);
  const mined = getMinedTranslatedSentences();

  // (a) The switchover beat leads and always ships whole — reveal and cloze
  // are a matched pair (latch pairs them by id), so the cap never splits it.
  const beat = buildSwitchoverBeat(
    prefixId,
    learnerModule,
    scan.unlockedIds,
    mined,
  );
  let budget = DYNAMIC_REVIEW_PREFIX_CAP - beat.length;

  // (b) The REVIEW PORTION — half FSRS-due, half recent (RULE 3, Spencer
  // 2026-09-15: "so half recent things, half fsrs learnings"). The split and
  // the six-module window both live in `selectReviewHalves`, shared with the
  // review-lesson tail builder; see its doc comment for the algorithm and the
  // full quote.
  //
  // This replaces a due-only draw. Due-only is what shipped #91/#116: with
  // nothing due the prefix was empty and the lesson fell back to compiled
  // filler drawn from 574 words of met vocabulary, so an m31 learner got いいえ.
  // Due still has the priority claim when the budget is tight — `slots` is
  // what is left after the switchover beat, and `selectReviewHalves`
  // backfills either half from the other.
  //
  // Seeded per DAY, not per call (`Date.now()` here would reshuffle the prefix
  // under a mid-lesson re-resolve and desync step ids).
  const daySeed = `${lesson.id}-dyn-${getToday()}`;
  const halves = selectReviewHalves({
    scan,
    slots: Math.max(0, budget),
    seed: daySeed,
  });
  const reviewPicks = [...halves.due, ...halves.recent];
  budget -= reviewPicks.length;

  // (c) Due Track B grammar. Due points only — new-point seeding stays with
  // the grammar review session; the prefix is retrieval, not grammar intake.
  const grammarSteps: LessonStep[] = [];
  if (budget > 0) {
    const grammarIndex = getGrammarReviewIndex();
    const grammarQueue = buildGrammarReviewQueue(scan.unlockedIds);
    const grammarPicks = grammarQueue.review
      .filter((item) => (grammarIndex.get(item.point.id)?.length ?? 0) > 0)
      .slice(0, Math.min(PREFIX_MAX_GRAMMAR, budget));
    for (const item of grammarPicks) {
      const tmpl = grammarIndex.get(item.point.id)![0];
      // Full credit to the sentence's content vocab, mirroring the full
      // builder's Track B section.
      const sentenceAtoms = sentenceVocabAtomIds(clozeStepSentence(tmpl));
      const exercisedAtoms = Array.from(
        new Set([...(tmpl.exercisedAtoms ?? []), ...sentenceAtoms]),
      );
      grammarSteps.push({
        ...tmpl,
        id: `${prefixId}-grammar-${item.point.id}`,
        exercisedGrammar: [item.point.id],
        exercisedAtoms,
      });
    }
    budget -= grammarSteps.length;
  }

  // (d) Reserved seats for new cards (B065 intake). Registry order, NEVER
  // shuffled — oldest never-reviewed atoms first is what keeps same-day
  // words out of the seats. On top of that, D6 is structural here: an
  // unlock-seeded card is due NEXT day (`createSeededState`), so requiring
  // `isDue` excludes anything seeded today — a seat step both introduces and
  // grades, and same-day grading of just-introduced words is the thing D6
  // forbids. The NEXT session (once the seed matures) takes the seat.
  const newSeats: ReviewCandidate[] =
    budget > 0
      ? scan.candidates
          .filter((c) => c.isNewCard && isDue(c.state))
          .slice(0, budget)
      : [];

  // Compose atom steps in one call so the same-type adjacency guard sees the
  // whole pick list. `-review-2` skews production like the full builder's
  // position 2; everything else stays recognition-heavy.
  const isRecognitionHeavy = !/-review-2$/.test(lesson.id);
  const picks: ReviewPick[] = [...reviewPicks, ...newSeats].map((c) => ({
    atom: c.atom,
    dueModalities: c.dueModalities,
    isNewCard: c.isNewCard,
  }));
  const atomSteps =
    picks.length > 0
      ? composeAtomSteps({
          lessonId: prefixId,
          picks,
          pool: scan.pool,
          isRecognitionHeavy,
          mined,
        })
      : [];

  const tail = placeAvoidingSameType(
    [...atomSteps, ...grammarSteps],
    beat[beat.length - 1]?.type,
    lesson.steps[0]?.type,
    // RULE 2 across both seams: the beat's tail behind, the authored body's
    // head ahead. `SENTENCE_REUSE_MIN_GAP - 1` steps on each side is exactly
    // the reach of the rule.
    beat.slice(-(SENTENCE_REUSE_MIN_GAP - 1)).map(sentenceKeyOf),
    lesson.steps.slice(0, SENTENCE_REUSE_MIN_GAP - 1).map(sentenceKeyOf),
  );
  return [...beat, ...tail];
}

/** Re-entrancy latch. The sentence miner and the grammar-review harvest both
 *  materialize lessons THROUGH `getMockLessonContent`, and this decorator's
 *  own prefix build consumes both — without the latch, building the prefix
 *  for one review lesson would recurse into building prefixes for every
 *  other one, forever. While a prefix build is in flight, nested lesson
 *  resolutions get the undecorated lesson (which is also the right corpus
 *  for the harvesters: authored content only). */
let buildingPrefix = false;

/**
 * The B069 phase-1 wiring: prepend the dynamic segment to every dedicated
 * review lesson at content-load time. Same decoration layer as
 * `withKanaReviewTail` — call it from `getMockLessonContent`, before the
 * pad/kanji passes so the dynamic steps get tile floors + kanji surfaces
 * exactly like authored ones.
 *
 * Deliberately NO try/catch: a throw here fails loudly in tests and dev. A
 * silent fallback to the authored lesson would recreate the exact failure
 * B069 exists to prevent — the beat going dormant with nothing noticing.
 */
export function withDynamicReviewPrefix(lesson: LessonContent): LessonContent {
  if (buildingPrefix) return lesson;
  if (!isDedicatedReviewLesson(lesson.id)) return lesson;
  buildingPrefix = true;
  let prefix: LessonStep[];
  try {
    prefix = buildDynamicReviewPrefix(lesson);
  } finally {
    buildingPrefix = false;
  }
  // Empty state → the authored lesson, byte-identical (same reference).
  if (prefix.length === 0) return lesson;
  return { ...lesson, steps: [...prefix, ...lesson.steps] };
}
