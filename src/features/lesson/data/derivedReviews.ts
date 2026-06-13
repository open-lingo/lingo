/**
 * Derived module-review due-state (retention Phase 4). REPLACES the blind
 * per-module calendar (`moduleReviewSchedule`, fixed 1/3/7/14/30/90d) as the
 * driver of the Learn "🔄 N reviews due" chip. A module is "due for review"
 * when it actually has due items — Track A vocab (`open-lingo-srs:v2`) or
 * Track B grammar (`open-lingo-srs-grammar:v1`) — so the chip reflects real
 * FSRS state instead of a clock that ignores whether anything stuck.
 *
 * The stage/★ mastery in `moduleReviewSchedule` is untouched; only the chip
 * source moves to this performance-based view.
 */
import type { Course } from "@/shared/domain/course";
import { JA_COURSE_ATOMS, isSrsEligibleAtom } from "@/features/languages/ja/courseAtoms";
import { getCardState } from "@/features/flashcards/engine/srsStorage";
import { isDue } from "@/features/flashcards/engine/srs";
import { getGrammarCardState } from "@/features/flashcards/engine/grammarSrs";
import grammarPointsJson from "./n5-grammar-points.json";
import type { GrammarPoint } from "@/features/flashcards/engine/grammarSrs";

const GRAMMAR_POINTS = grammarPointsJson as GrammarPoint[];

export type DerivedDueReview = {
  moduleId: string;
  /** Due Track A + Track B items for this module. */
  dueCount: number;
};

/** Modules with ≥1 actually-due review item (vocab or grammar), most-due
 *  first. Only counts items that HAVE FSRS state (reviewed at least once) —
 *  never-touched content doesn't show as "overdue." */
export function getDerivedDueReviews(course: Course): DerivedDueReview[] {
  const moduleIds = new Set(course.modules.map((m) => m.id));
  const counts = new Map<string, number>();

  for (const atom of JA_COURSE_ATOMS) {
    if (!atom.fromModule || !moduleIds.has(atom.fromModule)) continue;
    if (!isSrsEligibleAtom(atom)) continue;
    const state = getCardState(atom.id);
    if (state && isDue(state)) {
      counts.set(atom.fromModule, (counts.get(atom.fromModule) ?? 0) + 1);
    }
  }

  for (const p of GRAMMAR_POINTS) {
    if (p.status !== "shipped" || !moduleIds.has(p.module)) continue;
    const state = getGrammarCardState(p.id);
    if (state && isDue(state)) {
      counts.set(p.module, (counts.get(p.module) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([moduleId, dueCount]) => ({ moduleId, dueCount }))
    .sort((a, b) => b.dueCount - a.dueCount);
}
