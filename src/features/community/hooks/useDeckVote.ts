/**
 * useDeckVote — TanStack-Query backed vote state with optimistic UI.
 *
 * Pulls the current ``{count, voted}`` from ``GET /decks/:id/vote`` and
 * exposes a ``toggle()`` that does an optimistic flip + rolls back on
 * error. Unauthenticated viewers see ``count`` but their click triggers
 * Auth0 login (handled at the call site via ``isAuthenticated``).
 */

import { useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useApi } from "@/shared/api/provider";
import { useAuth } from "@/shared/auth/useAuth";
import type { DeckVoteState } from "@/shared/api/decks";

const KEY = (deckId: string) => ["decks", "vote", deckId] as const;

export type UseDeckVoteResult = {
  count: number;
  voted: boolean;
  isLoading: boolean;
  isPending: boolean;
  toggle: () => void;
};

export function useDeckVote(deckId: string | null | undefined): UseDeckVoteResult {
  const { decks } = useApi();
  const { isAuthenticated, login } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: KEY(deckId ?? ""),
    queryFn: () => decks.getDeckVoteState(deckId!),
    enabled: !!deckId,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (next: boolean): Promise<DeckVoteState> => {
      if (!deckId) throw new Error("useDeckVote called without deckId");
      return next
        ? decks.voteOnDeck(deckId)
        : decks.removeDeckVote(deckId);
    },
    // Optimistic: flip the cached state immediately so the UI snaps.
    onMutate: async (next) => {
      if (!deckId) return;
      await qc.cancelQueries({ queryKey: KEY(deckId) });
      const previous = qc.getQueryData<DeckVoteState>(KEY(deckId));
      const optimistic: DeckVoteState = previous
        ? {
            // Delta = +1 going voted, −1 going unvoted. Floors at 0 so a
            // stale server value never produces a negative count.
            count: Math.max(0, previous.count + (next ? 1 : -1)),
            voted: next,
          }
        : { count: next ? 1 : 0, voted: next };
      qc.setQueryData<DeckVoteState>(KEY(deckId), optimistic);
      return { previous };
    },
    onError: (_err, _next, ctx) => {
      if (deckId && ctx?.previous) {
        qc.setQueryData<DeckVoteState>(KEY(deckId), ctx.previous);
      }
    },
    onSettled: () => {
      if (deckId) {
        void qc.invalidateQueries({ queryKey: KEY(deckId) });
      }
    },
  });

  const toggle = useCallback(() => {
    if (!deckId) return;
    if (!isAuthenticated) {
      login();
      return;
    }
    const current = qc.getQueryData<DeckVoteState>(KEY(deckId));
    mutation.mutate(!(current?.voted ?? false));
  }, [deckId, isAuthenticated, login, mutation, qc]);

  return {
    count: query.data?.count ?? 0,
    voted: query.data?.voted ?? false,
    isLoading: query.isLoading,
    isPending: mutation.isPending,
    toggle,
  };
}
