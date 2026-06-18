/** Inputs from `useFlashcardDueSummary` that drive the Memory Strength tile. */
export type MemorySummaryInput = {
  learningCount: number;
  masteredCount: number;
  totalCount: number;
  weekReviews: number[];
};

export type MemoryStrengthView = {
  /** Cards currently in active learning (seen, not yet mastered). */
  learningCount: number;
  /** Cards graduated to mastered. */
  masteredCount: number;
  /** Cards the learner has started (learning + mastered). */
  startedCount: number;
  /** Mastered share of started cards, 0–100. 0 when nothing started. */
  masteredPct: number;
  /** Total reviews logged across the trailing 7 days. */
  weekTotal: number;
  /** Distinct days with ≥1 review in the trailing 7-day window. */
  activeDays: number;
  /** True once the learner has started at least one card. */
  hasStarted: boolean;
};

/**
 * Derive the Memory Strength display model from the raw SRS summary. Pure so
 * the tile stays dumb and the math is unit-tested. `masteredPct` is framed
 * against *started* cards (not the whole deck) so brand-new learners aren't
 * shown a demoralising 1% against 700 unlocked atoms.
 */
export function buildMemoryStrengthView(
  s: MemorySummaryInput,
): MemoryStrengthView {
  const startedCount = s.learningCount + s.masteredCount;
  const masteredPct =
    startedCount > 0
      ? Math.round((s.masteredCount / startedCount) * 100)
      : 0;
  const weekTotal = s.weekReviews.reduce((a, b) => a + b, 0);
  const activeDays = s.weekReviews.filter((v) => v > 0).length;
  return {
    learningCount: s.learningCount,
    masteredCount: s.masteredCount,
    startedCount,
    masteredPct,
    weekTotal,
    activeDays,
    hasStarted: startedCount > 0,
  };
}
