import { useEffect, useState } from "react";
import { useAuth } from "@/shared/auth/useAuth";
import { getActiveUserStorageId } from "@/features/settings/storage";
import { useProgressMe } from "@/shared/hooks/useProgressMe";
import {
  getMockCompletedLessonIds,
  subscribeLessonProgress,
} from "@/shared/domain/mockProgress";

/** Reactive lesson completion ids — updates after server hydrate or local finish. */
export function useCompletedLessonIds(): string[] {
  const { user, isLoading: authLoading } = useAuth();
  const storageUserId = getActiveUserStorageId();
  const { isProgressReady } = useProgressMe();
  const [ids, setIds] = useState(() => getMockCompletedLessonIds());

  const reload = () => setIds(getMockCompletedLessonIds());

  // Re-read when auth + /progress/me hydrate have settled.
  useEffect(() => {
    if (authLoading || !isProgressReady) return;
    reload();
  }, [authLoading, isProgressReady, user?.sub, storageUserId]);

  useEffect(() => subscribeLessonProgress(reload), []);

  return ids;
}
