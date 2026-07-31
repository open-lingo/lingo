import type { LessonContent, LessonStep } from "../types";
import { isDedicatedReviewLesson } from "./reviewTailSrs";
import {
  buildSwitchoverBeat,
  composeAtomSteps,
  scanReviewCandidates,
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
import { seededShuffle } from "@/shared/utils/seededShuffle";

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
 *   (b) due-atom review steps (sentence-context via the shared miner),
 *   (c) due Track B grammar-point steps,
 *   (d) reserved seats for new (never-reviewed) cards — the B065 intake.
 *
 * That is also the PRIORITY order when the segment is over budget: the beat
 * always ships whole, then due atoms, then grammar, then intake seats
 * (Spencer: "due-first when over budget").
 *
 * Grading needs NO new plumbing: the merged lesson keeps its
 * `ja-mN-neo-review-*` id, which `isDedicatedReviewLesson` already matches,
 * so `LessonPage.handleStepComplete` grades the prefix through the exact
 * gates the authored body uses (`shouldWriteSrs` → per-atom
 * `shouldWriteReviewLessonAtom`), and `latchCompletedSwitchover` pairs the
 * beat's reveal/cloze by id suffix on completion.
 *
 * EMPTY STATE: a learner with nothing due, nothing latched-pending and no
 * new candidates gets the authored lesson back BYTE-IDENTICAL (same object
 * reference — no copy, no reshuffle).
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

/**
 * Insert `steps` one at a time (priority order preserved) so that no two
 * adjacent steps share a type — including the seam against the last beat
 * step (`prevType`) and the first authored step (`followerType`). A step
 * with no legal slot is dropped: at CAP size that only happens to the
 * lowest-priority entries, which is the correct sacrifice.
 */
function placeAvoidingSameType(
  steps: readonly LessonStep[],
  prevType: string | undefined,
  followerType: string | undefined,
): LessonStep[] {
  const out: LessonStep[] = [];
  const typeAt = (i: number): string | undefined =>
    i < 0 ? prevType : out[i]?.type;

  const insertInterior = (step: LessonStep): boolean => {
    for (let i = out.length - 1; i >= 0; i--) {
      if (typeAt(i - 1) !== step.type && out[i].type !== step.type) {
        out.splice(i, 0, step);
        return true;
      }
    }
    return false;
  };

  for (const step of steps) {
    if (typeAt(out.length - 1) !== step.type) {
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

  // (b) Due atoms — priority claim on the remaining budget ("due-first when
  // over budget"). Seeded per DAY, not per call (`Date.now()` here would
  // reshuffle the prefix under a mid-lesson re-resolve and desync step ids).
  const due = scan.candidates.filter((c) => !c.isNewCard);
  const daySeed = `${lesson.id}-dyn-${getToday()}`;
  const duePicks = seededShuffle(due, daySeed).slice(0, Math.max(0, budget));
  budget -= duePicks.length;

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
  const picks: ReviewPick[] = [...duePicks, ...newSeats].map((c) => ({
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
