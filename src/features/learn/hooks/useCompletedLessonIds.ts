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
import { backfillStoryNodes } from "../storyNodeBackfill";

/** Reactive lesson completion ids — updates after server hydrate or local finish. */
export function useCompletedLessonIds(): string[] {
  const { user, isLoading: authLoading } = useAuth();
  const storageUserId = getActiveUserStorageId();
  const { isProgressReady } = useProgressMe();
  const { language, isLoading: languageLoading } = useLanguage();
  const [ids, setIds] = useState(() => getMockCompletedLessonIds());

  const reload = () => setIds(getMockCompletedLessonIds());

  // Re-read when auth + /progress/me hydrate have settled.
  useEffect(() => {
    if (authLoading || !isProgressReady) return;
    // One-time, and it has to happen HERE — after hydrate, before anything
    // derives a module index from the ids. Trainer and story nodes were added
    // to already-shipped modules; without the retro-credit a learner deep in
    // the course gets pulled back to the first module holding a new node.
    //
    // Both passes walk ONE course, so neither may run until we know WHICH.
    // `learningLanguageId` arrives with the Phase-2 server settings merge,
    // which races the /progress/me query gating `isProgressReady` — so an
    // unresolved language here is a real state, not a theoretical one. The
    // old `?? "ja"` default would spend a Korean learner's one-shot migration
    // on the Japanese course and strand their story nodes forever.
    //
    // Trainer first: story nodes count the trainer row as an "other" row, so
    // it has to be settled before the story pass reads completion.
    if (!languageLoading && language) {
      backfillTrainerNodes(language.id);
      backfillStoryNodes(language.id);
    }
    reload();
  }, [
    authLoading,
    isProgressReady,
    user?.sub,
    storageUserId,
    language?.id,
    languageLoading,
  ]);

  useEffect(() => subscribeLessonProgress(reload), []);

  return ids;
}
