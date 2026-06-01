import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiOptional } from "@/shared/api/provider";
import type { ServerQuest } from "@/shared/api/quests";
import type { Quest, QuestStatus } from "./types";

/**
 * Server-backed quest hook.
 *
 * Source of truth: lingo-core ``/api/core/v1/quests``. Quest progress is
 * advanced by the async pipeline (lingo-async → ``/_internal/{id}/progress``)
 * after XP / lesson / review events fire, so the hook just needs to read
 * the server's current state. We refetch on mount + every 10s while the
 * page is visible and invalidate after any client-side mutation
 * (``progress.batchAttempts`` resolution, claim, refresh).
 *
 * The local-mock + localStorage path is gone — the server is authoritative.
 * Older drafts kept a localStorage shadow for offline; that's a follow-up
 * once we have a clear offline story.
 */

export const QUESTS_QUERY_KEY = ["core", "quests", "list"] as const;
// Legacy localStorage key, exported so any leftover panels that referenced
// it during the local-mock era keep compiling. Safe to drop later.
export const QUESTS_STORAGE_KEY = "lingo_quests_v1";

const LIVE_REFETCH_MS = 10_000;

function fromServer(q: ServerQuest): Quest {
  return {
    id: q.id,
    type: q.type,
    title: q.title,
    description: q.description,
    emoji: q.emoji,
    progress: {
      current: q.progress.current,
      target: q.progress.target,
      unit: q.progress.unit,
    },
    rewards: {
      lingots: q.rewards?.lingots ?? undefined,
      xp: q.rewards?.xp ?? undefined,
      adFreeMinutes: q.rewards?.adFreeMinutes ?? undefined,
      streakShield: q.rewards?.streakShield ?? undefined,
    },
    expiresAt: q.expiresAt ?? undefined,
    friendId: q.friendId ?? undefined,
    friendDisplayName: q.friendDisplayName ?? undefined,
    status: q.status as QuestStatus,
  };
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
  isLoading: boolean;
  /** Bump quest progress server-side then refetch. Server is authoritative. */
  addProgress: (id: string, delta: number) => void;
  /** Claim a claimable quest (POST /quests/{id}/claim) then refetch. */
  claim: (id: string) => void;
  /** Force-complete via a large delta + claim. Kept for the dev panel. */
  complete: (id: string) => void;
  /** Server-side seed/regenerate of the catalog. */
  refresh: () => void;
};

export function useQuests(): UseQuestsResult {
  // useApiOptional lets the hook be called from component-tests that don't
  // wrap in <ApiProvider>. When ctx is null we return an empty + no-op
  // surface; pages that render in dev/prod always have the provider.
  const ctx = useApiOptional();
  const questsApi = ctx?.quests;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: QUESTS_QUERY_KEY,
    queryFn: () => questsApi!.list(),
    refetchInterval: LIVE_REFETCH_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
    enabled: !!questsApi,
  });

  const items = query.data?.items ?? [];
  const quests = useMemo(() => items.map(fromServer), [items]);
  const summary = useMemo(() => summarize(quests), [quests]);

  const bumpMutation = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      questsApi!.bumpProgress(id, delta),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUESTS_QUERY_KEY });
    },
  });

  const claimMutation = useMutation({
    mutationFn: (id: string) => questsApi!.claim(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUESTS_QUERY_KEY });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => questsApi!.refresh(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUESTS_QUERY_KEY });
    },
  });

  const addProgress = useCallback(
    (id: string, delta: number) => {
      if (!Number.isFinite(delta) || delta === 0) return;
      bumpMutation.mutate({ id, delta });
    },
    [bumpMutation],
  );

  const claim = useCallback(
    (id: string) => {
      claimMutation.mutate(id);
    },
    [claimMutation],
  );

  const complete = useCallback(
    (id: string) => {
      const q = quests.find((x) => x.id === id);
      if (!q) return;
      const need = Math.max(0, q.progress.target - q.progress.current);
      if (need > 0) bumpMutation.mutate({ id, delta: need });
      claimMutation.mutate(id);
    },
    [quests, bumpMutation, claimMutation],
  );

  const refresh = useCallback(() => {
    refreshMutation.mutate();
  }, [refreshMutation]);

  return {
    quests,
    summary,
    isLoading: query.isLoading,
    addProgress,
    claim,
    complete,
    refresh,
  };
}
