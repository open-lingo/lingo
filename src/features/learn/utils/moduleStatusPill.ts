import type { ModuleStatus } from "../moduleProgress";

export type ModuleStatusPill = {
  text: string;
  /** locked | complete — drives icon in ModuleCard */
  variant?: "locked" | "complete" | "progress";
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
