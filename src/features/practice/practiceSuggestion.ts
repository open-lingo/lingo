import type { Pillar } from "./pillars";
import type { DueReview } from "@/features/lesson/data/moduleReviewSchedule";
import type { IconName } from "@/shared/iconRegistry";

/** Skill pillars eligible for the "caught up, sharpen X" rotation, in a fixed
 *  order so the daily pick is deterministic. Vocabulary is excluded — it's the
 *  SRS pillar, already covered by the due-cards case. */
export const ROTATION_PILLAR_IDS = [
  "grammar",
  "reading",
  "listening",
  "speaking",
  "writing",
] as const;

export type Suggestion =
  | { kind: "srs"; dueCount: number; to: string }
  | { kind: "module"; moduleId: string; to: string }
  | { kind: "pillar"; pillar: Pillar; to: string }
  | { kind: "start"; to: string };

export type SuggestionInput = {
  dueCount: number;
  totalCards: number;
  dueReviews: DueReview[];
  pillars: Pillar[];
  langId: string;
  /** Days since epoch — deterministic per calendar day (passed by the caller). */
  dayIndex: number;
  /** Maps a due module id to its review-lesson id fragment. */
  reviewModuleIdFor: (moduleId: string) => string;
};

export type QuickStart = {
  icon: IconName;
  labelKey: string;
  labelDefault: string;
  params?: Record<string, string | number>;
  to: string;
};

/** Numeric part of a module id ("m4" -> "4"), for display. */
export function moduleNumber(moduleId: string): string {
  return moduleId.match(/\d+/)?.[0] ?? moduleId;
}

/**
 * Pick the single best practice suggestion, by priority:
 *   1. SRS cards due
 *   2. Module reviews due
 *   3. Caught up → rotate a skill pillar (stable within a day)
 *   4. Brand-new user (no cards) → start flashcards
 */
export function pickSuggestion(input: SuggestionInput): Suggestion {
  const { dueCount, totalCards, dueReviews, pillars, langId, dayIndex, reviewModuleIdFor } = input;

  if (dueCount > 0) {
    return { kind: "srs", dueCount, to: "practice/flashcards/review" };
  }

  if (dueReviews.length > 0) {
    const moduleId = dueReviews[0].moduleId;
    const reviewId = reviewModuleIdFor(moduleId);
    return { kind: "module", moduleId, to: `learn/lessons/${langId}-${reviewId}-1` };
  }

  const rotation = ROTATION_PILLAR_IDS.map((id) =>
    pillars.find((p) => p.id === id),
  ).filter((p): p is Pillar => Boolean(p));

  if (totalCards > 0 && rotation.length > 0) {
    const pillar = rotation[dayIndex % rotation.length];
    return { kind: "pillar", pillar, to: pillar.route };
  }

  return { kind: "start", to: "practice/flashcards" };
}

/**
 * Contextual quick-start chips ("Jump back in"), max 3, excluding whichever
 * candidate already IS the primary suggestion (dedupe by route).
 */
export function buildQuickStarts(args: {
  suggestion: Suggestion;
  dueCount: number;
  dueReviews: DueReview[];
  langId: string;
  reviewModuleIdFor: (moduleId: string) => string;
}): QuickStart[] {
  const { suggestion, dueCount, dueReviews, langId, reviewModuleIdFor } = args;
  const items: QuickStart[] = [];

  if (dueCount > 0) {
    items.push({
      icon: "refresh",
      labelKey: "practice.hero.chipDue",
      labelDefault: "{{count}} cards due",
      params: { count: dueCount },
      to: "practice/flashcards/review",
    });
  }
  if (dueReviews.length > 0) {
    const moduleId = dueReviews[0].moduleId;
    items.push({
      icon: "target",
      labelKey: "practice.hero.chipModule",
      labelDefault: "Module {{n}} review",
      params: { n: moduleNumber(moduleId) },
      to: `learn/lessons/${langId}-${reviewModuleIdFor(moduleId)}-1`,
    });
  }
  items.push({
    icon: "graduationCap",
    labelKey: "practice.hero.chipNew",
    labelDefault: "Learn new words",
    to: "practice/flashcards",
  });

  return items.filter((c) => c.to !== suggestion.to).slice(0, 3);
}
