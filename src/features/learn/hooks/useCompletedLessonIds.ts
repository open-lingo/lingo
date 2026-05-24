import { useEffect, useState } from "react";
import {
  getMockCompletedLessonIds,
  subscribeLessonProgress,
} from "@/shared/domain/mockProgress";

/** Reactive lesson completion ids — updates after server hydrate or local finish. */
export function useCompletedLessonIds(): string[] {
  const [ids, setIds] = useState(() => getMockCompletedLessonIds());

  useEffect(() => {
    return subscribeLessonProgress(() => {
      setIds(getMockCompletedLessonIds());
    });
  }, []);

  return ids;
}
