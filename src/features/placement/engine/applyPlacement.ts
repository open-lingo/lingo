import { getMockCourse } from "@/shared/domain/mockCourse";
import { markLessonCompleted } from "@/shared/domain/mockProgress";
import {
  unlockLessonAtoms,
  unlockAtomIds,
} from "@/features/lesson/data/unlockLessonAtoms";
import {
  getCardState,
  setCardState,
} from "@/features/flashcards/engine/srsStorage";
import {
  getCourseAtoms,
  isLanguageRegistered,
} from "@/shared/language/registry";
import type { SRSCardState } from "@/features/flashcards/data/types";

import type { MissedSkill } from "./adaptiveEngine";

export type PlacementResult = {
  /** Modules the learner PROVED — their lessons were completed. */
  passedModules: string[];
  /** Modules assumed from the floor estimate. Policy change (Spencer QA
   *  2026-07-12): assumed modules are ALSO marked complete — a learner who
   *  placed above them shouldn't be told "we didn't test you, go do them
   *  now." Their vocab is seeded into SRS review, which is where any real
   *  gaps will surface and get drilled. */
  assumedModules: string[];
  skippedLessonCount: number;
  seededAtomCount: number;
  /** Grammar points the learner missed, grouped for the gap report. */
  missedSkills: MissedSkill[];
};

function createPlacementSeedState(): SRSCardState {
  const today = new Date().toISOString().slice(0, 10);
  const sub = {
    stability: 0,
    difficulty: 0,
    state: "learning" as const,
    interval: 0,
    dueDate: today,
    lastReviewDate: today,
    reps: 0,
    lapses: 0,
  };
  return { recognition: { ...sub }, production: { ...sub } };
}

/**
 * Per-language placement quirks. `reviewLessonRe` matches lessons that should
 * stay AVAILABLE after a test-out (the learner's first SRS review opportunity);
 * `scriptModules` are the alphabet/script modules to auto-complete once any
 * later grammar module passes, so the linear unlock chain isn't broken.
 *
 * A language absent from this map gets safe defaults (no review-lesson skip,
 * no forced script unlock) — adding a course needs question-bank items, not an
 * entry here, unless it has these specific quirks.
 */
const LANGUAGE_PLACEMENT_CONFIG: Record<
  string,
  { reviewLessonRe: RegExp | null; scriptModules: readonly string[] }
> = {
  ja: { reviewLessonRe: /^ja-m\d+-review-[12]$/, scriptModules: ["m1", "m2"] },
  ko: { reviewLessonRe: null, scriptModules: ["m1", "m2"] },
};

export function applyPlacementResult(
  passedModules: string[],
  languageId: string = "ja",
  opts?: { assumedModules?: string[]; missedSkills?: MissedSkill[] },
): PlacementResult {
  const assumedModules = opts?.assumedModules ?? [];
  const missedSkills = opts?.missedSkills ?? [];
  const empty: PlacementResult = {
    passedModules,
    assumedModules,
    skippedLessonCount: 0,
    seededAtomCount: 0,
    missedSkills,
  };
  if (passedModules.length === 0 && assumedModules.length === 0) {
    return empty;
  }
  if (!isLanguageRegistered(languageId)) {
    return empty;
  }

  const cfg = LANGUAGE_PLACEMENT_CONFIG[languageId] ?? {
    reviewLessonRe: null,
    scriptModules: [],
  };

  const course = getMockCourse(languageId);
  const passedSet = new Set(passedModules);
  const assumedSet = new Set(assumedModules);
  const seedModuleSet = new Set([...passedModules, ...assumedModules]);

  // If any grammar module passed, the learner clearly knows the script —
  // auto-complete the script/alphabet modules so the linear unlock chain
  // isn't broken. (Only when at least one non-script module passed.)
  const passedNonScript = passedModules.some(
    (m) => !cfg.scriptModules.includes(m),
  );
  if (passedNonScript) {
    for (const script of cfg.scriptModules) {
      if (!passedSet.has(script)) passedSet.add(script);
    }
  }
  // Seed vocab for every verified (incl. auto-completed script) + assumed
  // module; only verified modules get their lessons completed below.
  for (const m of passedSet) seedModuleSet.add(m);

  let lessonCount = 0;

  for (const mod of course.modules) {
    // Proved AND assumed modules complete — assumed vocab lives in SRS
    // review where real gaps surface; the course map shouldn't nag.
    if (!passedSet.has(mod.id) && !assumedSet.has(mod.id)) continue;
    for (const lesson of mod.lessons) {
      // Don't pre-complete review lessons — they're the learner's first SRS
      // review opportunity and should remain available.
      if (cfg.reviewLessonRe?.test(lesson.id)) continue;
      markLessonCompleted(lesson.id, {
        accuracy: 1,
        xpEarned: 0,
        isReview: false,
      });
      unlockLessonAtoms(lesson.id);
      lessonCount++;
    }
  }

  const seedState = createPlacementSeedState();
  const seededIds: string[] = [];
  for (const atom of getCourseAtoms(languageId)) {
    if (!atom.srsEligible) continue;
    if (atom.fromModule === undefined) continue;
    if (!seedModuleSet.has(atom.fromModule)) continue;
    // Don't clobber a real schedule — mirrors seedSchedule.ts's
    // seed-on-unlock guard. Without this, re-running placement (or
    // placement over an atom the learner already has SRS progress on)
    // silently wipes that progress back to a fresh "learning" seed.
    if (getCardState(atom.id)) continue;
    setCardState(atom.id, seedState);
    seededIds.push(atom.id);
  }
  // M8+ atoms carry module-level attribution only (no introducedByLessonId),
  // so the per-lesson unlock above can't reach them — unlock the seeded
  // atoms directly or SRS review lessons will skip them.
  unlockAtomIds(seededIds);
  const atomCount = seededIds.length;

  const allPassed = [...passedSet];
  // Assumed modules are those that weren't promoted to verified/script-passed.
  const finalAssumed = assumedModules.filter((m) => !passedSet.has(m));
  return {
    passedModules: allPassed,
    assumedModules: finalAssumed,
    skippedLessonCount: lessonCount,
    seededAtomCount: atomCount,
    missedSkills,
  };
}
