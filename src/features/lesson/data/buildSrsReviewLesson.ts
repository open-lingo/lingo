import type { LessonContent, LessonStep } from "../types";
import type { CourseAtom } from "@/features/languages/ja/courseAtoms";
import { getAtomsUpToModule } from "./lessonAtomIndex";
import {
  getCardState,
  canonicalizeCardId,
} from "@/features/flashcards/engine/srsStorage";
import { isDue, isNew, getDueModalities, createInitialState } from "@/features/flashcards/engine/srs";
import { getUnlockedAtomIds } from "./unlockLessonAtoms";
import { buildGrammarReviewQueue } from "@/features/flashcards/engine/grammarSrs";
import {
  getGrammarReviewIndex,
  sentenceVocabAtomIds,
  clozeStepSentence,
} from "./grammarReviewIndex";
import type { SRSCardState } from "@/features/flashcards/data/types";
import {
  getMinedTranslatedSentences,
  type MinedTranslatedSentence,
} from "./minedSentences";
import {
  audioImageMcq,
  audioMeaningMcq,
  translationMcq,
  vocabMcq,
  speaking,
  build,
  reviewMatchPairs,
  listeningCompSentence,
  infoStep,
  type ReviewAtom,
  withoutMcqBlocked,
} from "@/features/languages/ja/grammarHelpers";

const MAX_ATOMS = 18;
const MAX_NEW = 5;
/** Track B grammar-point review steps appended per review lesson. Kept small
 *  so vocab still dominates; production-2 lessons lean a touch heavier. */
const MAX_GRAMMAR = 4;

type AtomWithState = {
  atom: CourseAtom;
  state: SRSCardState;
  dueModalities: Array<"recognition" | "production">;
  isNewCard: boolean;
};

function atomToReviewAtom(a: CourseAtom): ReviewAtom {
  return {
    kana: a.kana,
    meaningEn: a.meaningEn,
    emoji: a.emoji,
    fromModule: a.fromModule as ReviewAtom["fromModule"],
  };
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const out = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  for (let i = out.length - 1; i > 0; i--) {
    h = ((h << 5) - h + i) | 0;
    const j = ((h >>> 0) % (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickRecognitionStep(
  idPrefix: string,
  target: ReviewAtom,
  pool: ReviewAtom[],
  variant: number,
): LessonStep {
  const v = variant % 3;
  if (v === 0 && target.emoji) {
    try { return audioImageMcq(idPrefix, target, pool); } catch { /* fall through */ }
  }
  if (v === 1) {
    try { return audioMeaningMcq(idPrefix, target, pool); } catch { /* fall through */ }
  }
  try { return vocabMcq(idPrefix, target, pool); } catch { /* fall through */ }
  return listeningCompSentence({
    id: idPrefix,
    audioText: target.kana,
    correctMeaningEn: target.meaningEn,
    distractorsEn: pool
      .filter((a) => a.kana !== target.kana)
      .slice(0, 3)
      .map((a) => a.meaningEn) as [string, string, string],
  });
}

/** Word-level production fallback (no mined sentence available).
 *  Spencer QA 2026-07-16 (ja-m28-review-2): the old v===1 branch emitted a
 *  SINGLE-TILE build (correctOrder.length 1) — pure flashcard feel, and the
 *  single-answer build render is being redesigned. This generator no longer
 *  emits single-tile builds at all; word production rotates
 *  speaking ↔ translationMcq instead. */
function pickProductionStep(
  idPrefix: string,
  target: ReviewAtom,
  pool: ReviewAtom[],
  variant: number,
): LessonStep {
  const v = variant % 2;
  if (v === 0) {
    return speaking(idPrefix, target.kana, target.meaningEn);
  }
  try { return translationMcq(idPrefix, target, pool); } catch { /* fall through */ }
  return speaking(idPrefix, target.kana, target.meaningEn);
}

/* ── sentence-context steps (Spencer QA 2026-07-16, ja-m28-review-2) ──
 * "Purely MCQ or variations of it … effectively flash cards." Review
 * lessons now put each due word back into a real authored sentence via the
 * shared sentence miner. Recognition → listen to the mined sentence, pick
 * its translation; production → rebuild or speak the mined sentence.
 * Word-level steps remain for NEW cards (citation-form intro is correct
 * there) and as fallback when no mined sentence exists. */

/** Credit the target atom AND ride-along sentence vocab — mirrors how the
 *  grammar-cloze section credits its sentence's content words. */
function withSentenceCredit(
  step: LessonStep,
  targetAtomId: string,
  sentenceText: string,
): LessonStep {
  const exercisedAtoms = Array.from(
    new Set([targetAtomId, ...sentenceVocabAtomIds(sentenceText)]),
  );
  return { ...step, exercisedAtoms } as LessonStep;
}

/** Pick 3 distinct distractor translations from the mined-sentence pool
 *  (all sentence-level, so options stay aspect-consistent). Returns null
 *  when the pool can't cover 3 — caller falls back to word-level. */
function sentenceDistractors(
  correct: string,
  translationPool: readonly string[],
  offset: number,
): [string, string, string] | null {
  const seen = new Set([correct]);
  const out: string[] = [];
  const n = translationPool.length;
  for (let k = 0; k < n && out.length < 3; k++) {
    const t = translationPool[(offset + k) % n];
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.length === 3 ? (out as [string, string, string]) : null;
}

function sentenceRecognitionStep(
  idPrefix: string,
  targetAtomId: string,
  sent: MinedTranslatedSentence,
  translationPool: readonly string[],
  variant: number,
): LessonStep | null {
  const distractors = sentenceDistractors(
    sent.translation,
    translationPool,
    variant,
  );
  if (!distractors) return null;
  return withSentenceCredit(
    listeningCompSentence({
      id: idPrefix,
      audioText: sent.text,
      correctMeaningEn: sent.translation,
      distractorsEn: distractors,
    }),
    targetAtomId,
    sent.text,
  );
}

function sentenceProductionStep(
  idPrefix: string,
  targetAtomId: string,
  targetKana: string,
  sent: MinedTranslatedSentence,
  pool: ReviewAtom[],
  variant: number,
): LessonStep {
  if (variant % 2 === 0) {
    // Multi-tile sentence build: mined sentences are space-separated
    // authored text — the standard word split the authored builds use.
    const words = sent.text.split(" ").filter(Boolean);
    const distractorWords = pool
      .filter((a) => a.kana !== targetKana && !words.includes(a.kana))
      .slice(0, 2)
      .map((a) => a.kana);
    return withSentenceCredit(
      build(
        idPrefix,
        `Build the sentence meaning "${sent.translation}"`,
        sent.text,
        [...words, ...distractorWords],
        words,
      ),
      targetAtomId,
      sent.text,
    );
  }
  return withSentenceCredit(
    speaking(idPrefix, sent.text, sent.translation),
    targetAtomId,
    sent.text,
  );
}

/** One picked atom + the scheduling facts the composer needs. Exported so
 *  tests can drive `composeAtomSteps` with an injected pick list (the live
 *  builder shuffles with a Date.now() seed — deliberate variety). */
export type ReviewPick = {
  atom: CourseAtom;
  dueModalities: Array<"recognition" | "production">;
  isNewCard: boolean;
};

/**
 * Compose the per-atom review steps. Target composition (Spencer QA
 * 2026-07-16): ≥60% of atom steps in sentence context whenever miner
 * coverage allows — due atoms with a mined translated sentence ALWAYS get a
 * sentence step; word-level MCQs survive only as new-card intros and
 * miner-less fallbacks. Same-type adjacency guard preserved. Pure
 * construction (D4): no state writes here.
 */
export function composeAtomSteps(opts: {
  lessonId: string;
  picks: ReviewPick[];
  pool: ReviewAtom[];
  isRecognitionHeavy: boolean;
  mined: ReadonlyMap<string, MinedTranslatedSentence>;
}): LessonStep[] {
  const { lessonId, picks, pool, isRecognitionHeavy, mined } = opts;
  const translationPool = Array.from(
    new Set([...mined.values()].map((s) => s.translation)),
  );

  const pickStep = (
    stepId: string,
    pick: ReviewPick,
    useProduction: boolean,
    variant: number,
  ): LessonStep => {
    const target = atomToReviewAtom(pick.atom);
    // NEW cards keep word-level steps — citation-form intro is correct for
    // a first exposure; sentence context starts once the card has reps.
    const sent = pick.isNewCard
      ? undefined
      : mined.get(canonicalizeCardId(pick.atom.id));
    if (useProduction) {
      if (sent) {
        return sentenceProductionStep(
          stepId,
          pick.atom.id,
          target.kana,
          sent,
          pool,
          variant,
        );
      }
      return pickProductionStep(stepId, target, pool, variant);
    }
    if (sent) {
      const s = sentenceRecognitionStep(
        stepId,
        pick.atom.id,
        sent,
        translationPool,
        variant,
      );
      if (s) return s;
    }
    return pickRecognitionStep(stepId, target, pool, variant);
  };

  const steps: LessonStep[] = [];
  let lastType = "info";
  for (let i = 0; i < picks.length; i++) {
    const pick = picks[i];
    const stepId = `${lessonId}-step-${i}`;

    let useProduction: boolean;
    if (isRecognitionHeavy) {
      useProduction = i % 4 === 3;
    } else {
      useProduction = i % 4 !== 0;
    }

    if (pick.dueModalities.length === 1) {
      useProduction = pick.dueModalities[0] === "production";
    }

    if (pick.isNewCard) {
      useProduction = false;
    }

    let step = pickStep(stepId, pick, useProduction, i);

    if (step.type === lastType && i < picks.length - 1) {
      step = pickStep(stepId, pick, !useProduction, i + 7);
    }

    lastType = step.type;
    steps.push(step);
  }
  return steps;
}

export function buildSrsReviewLesson(opts: {
  moduleId: string;
  position: 1 | 2;
  courseId: string;
  languageId: string;
}): LessonContent {
  const { moduleId, position, courseId, languageId } = opts;
  const allAtoms = getAtomsUpToModule(moduleId, languageId);
  const id = `${languageId}-${moduleId}-review-${position}`;
  const isRecognitionHeavy = position === 1;

  const unlockedIds = getUnlockedAtomIds();
  const candidates: AtomWithState[] = [];
  for (const atom of allAtoms) {
    // The unlock store keys are canonical (`ja:<id>`); CourseAtom ids are
    // bare. Canonicalize before the membership check or nothing matches.
    if (!unlockedIds.has(canonicalizeCardId(atom.id))) continue;
    // Pure construction (D4, scheduling-model-2026-06-15): NEVER persist
    // state at build time — that seeded due-today on every course-deck build
    // (the sentence-miner constructs every review lesson). Use an in-memory
    // initial state for selection/step-building; the real write happens on
    // grade (LessonPage) or on unlock (seedUnlockedAtomsDueNextDay).
    const state = getCardState(atom.id) ?? createInitialState();
    const isNewCard = isNew(state); // reps 0 — includes unlock-seeded atoms
    const dueModalities = isDue(state) ? getDueModalities(state) : [];
    if (dueModalities.length > 0 || isNewCard) {
      candidates.push({ atom, state, dueModalities, isNewCard });
    }
  }

  if (candidates.length < 4) {
    return {
      id,
      moduleId,
      courseId,
      languageId,
      title: `Review ${position}`,
      description: "Complete more lessons to unlock review content.",
      estimatedMinutes: 1,
      xpReward: 0,
      steps: [
        infoStep(
          `${id}-info-empty`,
          "Nothing to review yet",
          "Complete more lessons to unlock vocabulary for review. Come back after finishing a few more sub-lessons!",
        ),
      ],
    };
  }

  const due = candidates.filter((c) => !c.isNewCard);
  const newCards = candidates.filter((c) => c.isNewCard).slice(0, MAX_NEW);
  const merged = [...due, ...newCards];
  const picked = seededShuffle(merged, `${id}-${Date.now()}`).slice(0, MAX_ATOMS);

  const pool: ReviewAtom[] = withoutMcqBlocked(
    allAtoms
      .filter((a) => getCardState(a.id))
      .map(atomToReviewAtom),
  );

  const steps: LessonStep[] = [
    infoStep(
      `${id}-info-start`,
      isRecognitionHeavy ? "Recognition review" : "Production review",
      isRecognitionHeavy
        ? "Can you recognize these words? Listen, look, and pick the right answer."
        : "Time to produce! Say the words aloud and build sentences from tiles.",
    ),
  ];

  const mined =
    languageId === "ja"
      ? getMinedTranslatedSentences()
      : new Map<string, MinedTranslatedSentence>();

  steps.push(
    ...composeAtomSteps({
      lessonId: id,
      picks: picked,
      pool,
      isRecognitionHeavy,
      mined,
    }),
  );

  // ── Track B: grammar-point review (retention 3b) ──
  // Reuse authored particle-cloze steps, tagged with the grammar point they
  // drill. Due points first, then new (seeded so completion grades them).
  // Production-2 lessons skew slightly heavier on grammar.
  const grammarIndex = getGrammarReviewIndex();
  const grammarQueue = buildGrammarReviewQueue(unlockedIds);
  const grammarCap = isRecognitionHeavy ? Math.floor(MAX_GRAMMAR / 2) : MAX_GRAMMAR;
  const grammarPicks = [...grammarQueue.review, ...grammarQueue.newItems]
    .filter((item) => grammarIndex.has(item.point.id))
    .slice(0, grammarCap);
  for (const item of grammarPicks) {
    const templates = grammarIndex.get(item.point.id);
    if (!templates || templates.length === 0) continue;
    // No build-time seed (D4: pure construction). Track B state is written on
    // grade by reviewGrammarPoint, which creates-if-missing.
    const tmpl = templates[0];
    // D4: the grammar review also gives full credit to the content vocab in
    // its sentence (not just the authored particle atom).
    const sentenceAtoms = sentenceVocabAtomIds(clozeStepSentence(tmpl));
    const exercisedAtoms = Array.from(
      new Set([...(tmpl.exercisedAtoms ?? []), ...sentenceAtoms]),
    );
    steps.push({
      ...tmpl,
      id: `${id}-grammar-${item.point.id}`,
      exercisedGrammar: [item.point.id],
      exercisedAtoms,
    });
  }

  if (picked.length >= 5) {
    const matchAtoms = picked.slice(0, Math.min(5, picked.length)).map((p) => atomToReviewAtom(p.atom));
    steps.push(reviewMatchPairs(`${id}-match`, matchAtoms));
  }

  steps.push(
    infoStep(
      `${id}-info-end`,
      "Review complete",
      `You reviewed ${picked.length} words. These are now tracked in your SRS — they'll come back at the right time via flashcards or future lessons.`,
      "win",
    ),
  );

  return {
    id,
    moduleId,
    courseId,
    languageId,
    title: isRecognitionHeavy
      ? `Module ${moduleId.replace("m", "")} — Review 1`
      : `Module ${moduleId.replace("m", "")} — Review 2`,
    description: isRecognitionHeavy
      ? "Recognition review — listen, look, and identify."
      : "Production review — speak, build, and recall.",
    estimatedMinutes: 8,
    xpReward: 20,
    steps,
  };
}
