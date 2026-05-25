import { useMemo, useState, useEffect } from "react";
import {
  getMockProgressSummary,
  getWeekPracticeMinutes,
  subscribeLessonProgress,
  type ProgressSummary,
} from "@/shared/domain/mockProgress";

/** Lesson-completion cache with live updates (localStorage + sync hydrate). */
export function useLocalProgressSummary(): {
  summary: ProgressSummary;
  weekMinutes: number[];
} {
  const [version, setVersion] = useState(0);

  useEffect(() => subscribeLessonProgress(() => setVersion((v) => v + 1)), []);

  return useMemo(
    () => ({
      summary: getMockProgressSummary(),
      weekMinutes: getWeekPracticeMinutes(),
    }),
    [version],
  );
}
