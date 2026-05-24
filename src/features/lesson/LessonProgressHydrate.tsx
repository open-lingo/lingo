import { useEffect, useRef } from "react";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { ensureUserConsistency } from "@/features/settings/storage";
import { hydrateLessonProgressFromServer } from "./engine/progressSync";
import { performLessonSync } from "./engine";

/**
 * On sign-in: hydrate lesson completions from GET /progress/me
 * (pathway unlocks), then flush any buffered attempts from a prior session.
 */
export function LessonProgressHydrate() {
  const { isAuthenticated, user } = useAuth();
  const { progress } = useApi();
  const ranForUserRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.sub;
    if (!isAuthenticated || !userId) {
      ranForUserRef.current = null;
      return;
    }
    if (ranForUserRef.current === userId) return;
    ranForUserRef.current = userId;
    ensureUserConsistency(userId);

    (async () => {
      try {
        await hydrateLessonProgressFromServer(() => progress.getMe());
      } catch {
        /* local cache may still be usable */
      }
      try {
        await performLessonSync((payload) => progress.batchAttempts(payload));
      } catch {
        ranForUserRef.current = null;
      }
    })();
  }, [isAuthenticated, user?.sub, progress]);

  return null;
}
