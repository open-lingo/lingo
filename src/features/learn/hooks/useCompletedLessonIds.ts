import { useEffect, useState } from "react";
import { useAuth } from "@/shared/auth/useAuth";
import { getActiveUserStorageId } from "@/features/settings/storage";
import { useProgressMe } from "@/shared/hooks/useProgressMe";
import {
  getMockCompletedLessonIds,
  subscribeLessonProgress,
} from "@/shared/domain/mockProgress";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { backfillTrainerNodes } from "../trainerNodeBackfill";

/** Reactive lesson completion ids — updates after server hydrate or local finish. */
export function useCompletedLessonIds(): string[] {
  const { user, isLoading: authLoading } = useAuth();
  const storageUserId = getActiveUserStorageId();
  const { isProgressReady } = useProgressMe();
  const { language } = useLanguage();
  const [ids, setIds] = useState(() => getMockCompletedLessonIds());

  const reload = () => setIds(getMockCompletedLessonIds());

  // Re-read when auth + /progress/me hydrate have settled.
  useEffect(() => {
    if (authLoading || !isProgressReady) return;
    // One-time, and it has to happen HERE — after hydrate, before anything
    // derives a module index from the ids. Trainer nodes were added to
    // already-shipped modules; without the retro-credit a learner deep in the
    // course gets pulled back to the first module holding a new node.
    backfillTrainerNodes(language?.id ?? "ja");
    reload();
  }, [authLoading, isProgressReady, user?.sub, storageUserId, language?.id]);

  useEffect(() => subscribeLessonProgress(reload), []);

  return ids;
}
