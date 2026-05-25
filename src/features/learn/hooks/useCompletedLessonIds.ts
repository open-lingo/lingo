import { useEffect, useState } from "react";
import { useAuth } from "@/shared/auth/useAuth";
import { getActiveUserStorageId } from "@/features/settings/storage";
import {
  getMockCompletedLessonIds,
  subscribeLessonProgress,
} from "@/shared/domain/mockProgress";

/** Reactive lesson completion ids — updates after server hydrate or local finish. */
export function useCompletedLessonIds(): string[] {
  const { user, isLoading: authLoading } = useAuth();
  const storageUserId = getActiveUserStorageId();
  const [ids, setIds] = useState(() => getMockCompletedLessonIds());

  // Auth0 resolves after first paint — re-read once we know the real user key.
  useEffect(() => {
    if (authLoading) return;
    setIds(getMockCompletedLessonIds());
  }, [authLoading, user?.sub, storageUserId]);

  useEffect(() => {
    return subscribeLessonProgress(() => {
      setIds(getMockCompletedLessonIds());
    });
  }, []);

  return ids;
}
