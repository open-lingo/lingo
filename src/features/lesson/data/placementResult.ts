/**
 * Placement test scoring and application.
 *
 * After the learner completes the placement test, this module:
 *   1. Buckets per-step correctness into sections (hiragana, katakana,
 *      dakuten, grammar).
 *   2. Determines which modules to skip (>=80% accuracy on the section's
 *      steps).
 *   3. Applies the result by marking all lessons in skipped modules as
 *      completed and unlocking their atoms.
 *
 * The placement test itself is a diagnostic — no XP is awarded for skipped
 * lessons (they get `xpEarned: 0`).
 */
import { PLACEMENT_STEP_SECTIONS, type PlacementSection } from "./buildPlacementTest";
import { markLessonCompleted } from "@/shared/domain/mockProgress";
import { unlockLessonAtoms } from "./unlockLessonAtoms";
import { getMockCourse } from "@/shared/domain/mockCourse";

const PASS_THRESHOLD = 0.8;

const PLACEMENT_DISMISSED_KEY = "lingo_placement_dismissed_v1_ja";

export type PlacementResult = {
  /** Per-section accuracy, 0..1. */
  sectionScores: Record<PlacementSection, number>;
  /** Module IDs the learner demonstrated mastery of. */
  skippedModules: string[];
  /** Total lesson IDs that were auto-completed. */
  skippedLessonCount: number;
};

/**
 * Compute which modules the learner can skip based on step-level results.
 *
 * Scoring rules:
 *   - hiragana section passes → skip M1
 *   - dakuten section passes → skip M2 (only if M1 also passes)
 *   - katakana + grammar sections both pass → skip M3 (only if M1+M2 pass)
 *
 * The cascading requirement prevents a learner who aces grammar but can't
 * read hiragana from landing in M3 without M1.
 */
export function computePlacementResult(
  results: Record<string, boolean>,
): PlacementResult {
  // Bucket results by section.
  const buckets: Record<PlacementSection, { correct: number; total: number }> = {
    hiragana: { correct: 0, total: 0 },
    katakana: { correct: 0, total: 0 },
    dakuten:  { correct: 0, total: 0 },
    grammar:  { correct: 0, total: 0 },
  };

  for (const [stepId, wasCorrect] of Object.entries(results)) {
    const section = PLACEMENT_STEP_SECTIONS[stepId];
    if (!section) continue;
    buckets[section].total += 1;
    if (wasCorrect) buckets[section].correct += 1;
  }

  const score = (section: PlacementSection): number => {
    const b = buckets[section];
    return b.total === 0 ? 0 : b.correct / b.total;
  };

  const sectionScores: Record<PlacementSection, number> = {
    hiragana: score("hiragana"),
    katakana: score("katakana"),
    dakuten:  score("dakuten"),
    grammar:  score("grammar"),
  };

  const skippedModules: string[] = [];

  const m1Pass = sectionScores.hiragana >= PASS_THRESHOLD;
  const m2Pass = sectionScores.dakuten >= PASS_THRESHOLD;
  const m3Pass =
    sectionScores.katakana >= PASS_THRESHOLD &&
    sectionScores.grammar >= PASS_THRESHOLD;

  if (m1Pass) skippedModules.push("m1");
  if (m1Pass && m2Pass) skippedModules.push("m2");
  if (m1Pass && m2Pass && m3Pass) skippedModules.push("m3");

  return {
    sectionScores,
    skippedModules,
    skippedLessonCount: 0, // filled by applyPlacement
  };
}

/**
 * Apply a placement result: mark all lessons in skipped modules as
 * completed and unlock their atoms.
 *
 * Returns the updated result with `skippedLessonCount` filled in.
 */
export function applyPlacement(result: PlacementResult): PlacementResult {
  if (result.skippedModules.length === 0) return result;

  const course = getMockCourse("ja");
  const skippedSet = new Set(result.skippedModules);
  let count = 0;

  for (const mod of course.modules) {
    if (!skippedSet.has(mod.id)) continue;
    for (const lesson of mod.lessons) {
      markLessonCompleted(lesson.id, {
        accuracy: 1,
        xpEarned: 0,
        isReview: false,
      });
      unlockLessonAtoms(lesson.id);
      count += 1;
    }
  }

  // Mark the placement test itself as completed.
  markLessonCompleted("ja-placement", {
    accuracy: 1,
    xpEarned: 0,
    isReview: false,
  });

  return { ...result, skippedLessonCount: count };
}

// ---------------------------------------------------------------------------
// Persistence helpers — track whether the user has seen / dismissed the
// placement prompt so we don't ask every visit.
// ---------------------------------------------------------------------------

/** Returns true if the placement test has been dismissed (taken or skipped). */
export function isPlacementDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(PLACEMENT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Mark the placement prompt as dismissed (user took or skipped it). */
export function dismissPlacement(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLACEMENT_DISMISSED_KEY, "1");
  } catch {
    // ignore quota errors
  }
}
