import type { LessonContent, LessonStep } from "../types";
import type { CourseAtom } from "@/features/languages/ja/courseAtoms";
import { getAtomsUpToModule } from "./lessonAtomIndex";
import {
  getCardState,
  setCardState,
  canonicalizeCardId,
} from "@/features/flashcards/engine/srsStorage";
import { isDue, getDueModalities, createInitialState } from "@/features/flashcards/engine/srs";
import { getUnlockedAtomIds } from "./unlockLessonAtoms";
import type { SRSCardState } from "@/features/flashcards/data/types";
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

function pickProductionStep(
  idPrefix: string,
  target: ReviewAtom,
  pool: ReviewAtom[],
  variant: number,
): LessonStep {
  const v = variant % 3;
  if (v === 0) {
    return speaking(idPrefix, target.kana, target.meaningEn);
  }
  if (v === 1) {
    const distractorKanas = pool
      .filter((a) => a.kana !== target.kana)
      .slice(0, 2)
      .map((a) => a.kana);
    return build(
      idPrefix,
      target.meaningEn,
      target.kana,
      [target.kana, ...distractorKanas],
      [target.kana],
    );
  }
  try { return translationMcq(idPrefix, target, pool); } catch { /* fall through */ }
  return speaking(idPrefix, target.kana, target.meaningEn);
}

export function buildSrsReviewLesson(opts: {
  moduleId: string;
  position: 1 | 2;
  courseId: string;
  languageId: string;
}): LessonContent {
  const { moduleId, position, courseId, languageId } = opts;
  const allAtoms = getAtomsUpToModule(moduleId, languageId);
  const id = `ja-${moduleId}-review-${position}`;
  const isRecognitionHeavy = position === 1;

  const unlockedIds = getUnlockedAtomIds();
  const candidates: AtomWithState[] = [];
  for (const atom of allAtoms) {
    // The unlock store keys are canonical (`ja:<id>`); CourseAtom ids are
    // bare. Canonicalize before the membership check or nothing matches.
    if (!unlockedIds.has(canonicalizeCardId(atom.id))) continue;
    let state = getCardState(atom.id);
    const isNewCard = !state;
    if (!state) {
      state = createInitialState();
      setCardState(atom.id, state);
    }
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

  let lastType = "info";
  for (let i = 0; i < picked.length; i++) {
    const { atom, dueModalities, isNewCard } = picked[i];
    const target = atomToReviewAtom(atom);
    const stepId = `${id}-step-${i}`;

    let useProduction: boolean;
    if (isRecognitionHeavy) {
      useProduction = i % 4 === 3;
    } else {
      useProduction = i % 4 !== 0;
    }

    if (dueModalities.length === 1) {
      useProduction = dueModalities[0] === "production";
    }

    if (isNewCard) {
      useProduction = false;
    }

    let step: LessonStep;
    if (useProduction) {
      step = pickProductionStep(stepId, target, pool, i);
    } else {
      step = pickRecognitionStep(stepId, target, pool, i);
    }

    if (step.type === lastType && i < picked.length - 1) {
      step = useProduction
        ? pickRecognitionStep(stepId, target, pool, i + 7)
        : pickProductionStep(stepId, target, pool, i + 7);
    }

    lastType = step.type;
    steps.push(step);
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
