import { useCallback, useEffect, useMemo, useState } from "react";
import type { Quest, QuestStatus, QuestStorageEntry } from "./types";
import { buildMockQuestCatalog } from "./mockQuests";

/**
 * Local-first quest hook. Catalog comes from `mockQuests`; mutable state
 * (progress count + status flips) is persisted under one localStorage
 * key. Designed so the storage backend can be swapped for a backend
 * call later — the public surface (`{ quests, summary, addProgress,
 * complete, claim, refresh }`) is the stable contract.
 *
 * Contract for the future backend swap:
 *   - GET /quests/me  → list of QuestStorageEntry per user, server-merged
 *                       with the live catalog server-side.
 *   - POST /quests/{id}/progress  body: { delta }
 *   - POST /quests/{id}/claim     side effect: credit rewards
 *   - POST /quests/refresh        regenerate dailies on day-rollover
 *
 * For now everything is synchronous + local; the hook surfaces are
 * already in optimistic-update shape so wiring is mostly s/local/api/.
 */

export const QUESTS_STORAGE_KEY = "lingo_quests_v1";

type StoredMap = Record<string, QuestStorageEntry>;

function readStorage(): StoredMap {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(QUESTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as StoredMap;
  } catch {
    return {};
  }
}

function writeStorage(map: StoredMap): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

function mergeQuestState(catalog: Quest[], store: StoredMap): Quest[] {
  return catalog.map((q) => {
    const entry = store[q.id];
    if (!entry) return q;
    const status = computeStatus({
      current: entry.current,
      target: q.progress.target,
      stored: entry.status,
      expiresAt: q.expiresAt,
    });
    return {
      ...q,
      progress: { ...q.progress, current: entry.current },
      status,
    };
  });
}

function computeStatus(args: {
  current: number;
  target: number;
  stored: QuestStatus;
  expiresAt?: number;
}): QuestStatus {
  if (args.stored === "completed") return "completed";
  if (args.expiresAt && Date.now() > args.expiresAt) return "expired";
  if (args.current >= args.target) return "claimable";
  return "active";
}

export type QuestsSummary = {
  active: number;
  claimable: number;
  completed: number;
  expired: number;
  /** Total non-expired, non-completed — the badge count for the top-bar pill. */
  badgeCount: number;
};

function summarize(quests: Quest[]): QuestsSummary {
  let active = 0;
  let claimable = 0;
  let completed = 0;
  let expired = 0;
  for (const q of quests) {
    if (q.status === "active") active++;
    else if (q.status === "claimable") claimable++;
    else if (q.status === "completed") completed++;
    else if (q.status === "expired") expired++;
  }
  return {
    active,
    claimable,
    completed,
    expired,
    badgeCount: active + claimable,
  };
}

export type UseQuestsResult = {
  quests: Quest[];
  summary: QuestsSummary;
  /** Add `delta` to the quest's `progress.current`. Auto-flips to claimable. */
  addProgress: (id: string, delta: number) => void;
  /** Mark a claimable quest as completed (and persist). No-op otherwise. */
  claim: (id: string) => void;
  /**
   * Force-complete a quest by id (status → completed). Use sparingly —
   * normal flow is addProgress() → claim(). Kept for tests + dev panel.
   */
  complete: (id: string) => void;
  /** Wipe local progress and restart the catalog. */
  refresh: () => void;
};

export function useQuests(): UseQuestsResult {
  // Catalog snapshot is stable for the lifetime of the hook — daily
  // rotation is a follow-up (computeStatus already flips expired ones).
  const catalog = useMemo(() => buildMockQuestCatalog(), []);
  const [store, setStore] = useState<StoredMap>(() => readStorage());

  // Keep storage in sync.
  useEffect(() => {
    writeStorage(store);
  }, [store]);

  const quests = useMemo(
    () => mergeQuestState(catalog, store),
    [catalog, store],
  );
  const summary = useMemo(() => summarize(quests), [quests]);

  const addProgress = useCallback((id: string, delta: number) => {
    if (!Number.isFinite(delta) || delta === 0) return;
    setStore((prev) => {
      const existing = prev[id];
      const current = (existing?.current ?? 0) + delta;
      const status: QuestStatus = existing?.status === "completed"
        ? "completed"
        : "active";
      return {
        ...prev,
        [id]: {
          id,
          current: Math.max(0, current),
          status,
          claimedAt: existing?.claimedAt,
        },
      };
    });
  }, []);

  const claim = useCallback(
    (id: string) => {
      const q = quests.find((x) => x.id === id);
      if (!q) return;
      if (q.status !== "claimable") return;
      setStore((prev) => ({
        ...prev,
        [id]: {
          id,
          current: q.progress.current,
          status: "completed",
          claimedAt: Date.now(),
        },
      }));
    },
    [quests],
  );

  const complete = useCallback(
    (id: string) => {
      const q = quests.find((x) => x.id === id);
      if (!q) return;
      setStore((prev) => ({
        ...prev,
        [id]: {
          id,
          current: Math.max(q.progress.current, q.progress.target),
          status: "completed",
          claimedAt: Date.now(),
        },
      }));
    },
    [quests],
  );

  const refresh = useCallback(() => {
    setStore({});
  }, []);

  return { quests, summary, addProgress, claim, complete, refresh };
}
