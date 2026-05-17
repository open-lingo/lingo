import type { ModuleStatus } from "../moduleProgress";

export type ModuleStatusPill = {
  text: string;
  /** locked | complete | progress | mastery — drives icon + color in
   *  ModuleCard. `mastery` renders alongside `complete` for fully-
   *  mastered modules (sub-lessons done + every row-test passed). */
  variant?: "locked" | "complete" | "progress" | "mastery";
};

export function buildModuleStatusPill(
  moduleIndex: number,
  status: ModuleStatus,
  lessonsDone: number,
  totalLessons: number,
  comingSoon?: boolean,
): ModuleStatusPill | undefined {
  if (comingSoon) {
    return { text: "Coming soon", variant: "locked" };
  }
  if (totalLessons === 0) return undefined;

  const pct = Math.round((lessonsDone / totalLessons) * 100);
  if (pct >= 100) {
    return { text: "Complete · 100%", variant: "complete" };
  }
  if (pct === 0 && status === "locked") {
    return {
      text: moduleIndex > 0 ? `After Module ${moduleIndex - 1}` : "Locked",
      variant: "locked",
    };
  }
  return { text: `${pct}%`, variant: "progress" };
}

/**
 * Mastery pill — rendered to the RIGHT of the complete pill when a
 * module is fully mastered (sub-lessons done AND every row-test passed
 * un-skipped). Spencer's call: warning-color (gold-feel) star pill.
 */
export function buildMasteryPill(): ModuleStatusPill {
  return { text: "Mastered ★", variant: "mastery" };
}
