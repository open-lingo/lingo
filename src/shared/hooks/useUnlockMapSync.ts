import { useEffect, useRef } from "react";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import {
  ATOMS_UNLOCKED_EVENT,
  getUnlockedAtomIds,
  mergeServerUnlockedAtomIds,
  type AtomsUnlockedDetail,
} from "@/features/lesson/data/unlockLessonAtoms";

/**
 * Server backup for the atom unlock ladder (M1, 2026-06-13).
 *
 * The unlock set (`lingo:unlocked-atoms`) was localStorage-only, so clearing
 * storage or switching device lost which course atoms were unlocked — review
 * lessons would then skip atoms the learner already earned. This hook keeps
 * the local set and the server set reconciled:
 *
 *   - On session start (once, after auth): GET the server set and UNION it
 *     into the local store — restores progression after a storage clear /
 *     device switch. Also pushes any LOCAL-only ids up, so a set built offline
 *     (or before this feature shipped) lands on the server.
 *   - On each local unlock: a `lingo:atoms-unlocked` window event fires with
 *     the newly-added ids; we fire-and-forget POST them. The server unions,
 *     never drops, so a stale push can't regress another device.
 *
 * Reconcile is a union in both directions and never blocks the lesson flow —
 * the lesson reads the local set; this is the only server round-trip and it
 * happens off the hot path.
 */
export function useUnlockMapSync(): void {
  const { isAuthenticated } = useAuth();
  const { progress } = useApi();
  const hydratedRef = useRef(false);

  // Push newly-unlocked ids as they happen. Registered for the whole session
  // (not gated on auth) — addUnlocks itself swallows pre-wire 404/501 and the
  // request just no-ops when signed out (token resolves to a dev/empty value).
  useEffect(() => {
    function onUnlocked(e: Event) {
      const detail = (e as CustomEvent<AtomsUnlockedDetail>).detail;
      const ids = detail?.atomIds ?? [];
      if (ids.length === 0) return;
      void progress.addUnlocks(ids);
    }
    window.addEventListener(ATOMS_UNLOCKED_EVENT, onUnlocked);
    return () => window.removeEventListener(ATOMS_UNLOCKED_EVENT, onUnlocked);
  }, [progress]);

  // Hydrate once per session: union server → local, then push local-only → server.
  useEffect(() => {
    if (!isAuthenticated || hydratedRef.current) return;
    hydratedRef.current = true;

    void (async () => {
      const serverIds = await progress.getUnlocks().catch(() => null);
      // null = backend not wired (404/501) or transient failure — keep local
      // set as-is; the next session retries.
      if (serverIds === null) return;

      if (serverIds.length > 0) mergeServerUnlockedAtomIds(serverIds);

      // Push any ids the server doesn't have yet (built offline / pre-feature).
      const serverSet = new Set(serverIds);
      const localOnly = [...getUnlockedAtomIds()].filter((id) => !serverSet.has(id));
      if (localOnly.length > 0) void progress.addUnlocks(localOnly);
    })();
  }, [isAuthenticated, progress]);
}
