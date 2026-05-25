import { useMemo } from "react";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { useCompletedLessonIds } from "@/features/learn/hooks/useCompletedLessonIds";
import { getCurrentModuleIndex } from "@/features/learn/moduleProgress";

/**
 * Returns the user's current module number (1-indexed) for the active language.
 * "Current" = the module they're working on (first incomplete module).
 * If all modules are complete, returns the total count.
 */
export function useCourseLevel(): number {
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";
  const completedIds = useCompletedLessonIds();
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const course = useMemo(() => getMockCourse(langId), [langId]);

  return useMemo(() => {
    const idx = getCurrentModuleIndex(course, completedSet);
    const mod = course.modules[idx];
    if (!mod) return 1;
    const num = parseInt(mod.id.replace(/^m/, ""), 10);
    return isNaN(num) ? idx + 1 : num;
  }, [course, completedSet]);
}
