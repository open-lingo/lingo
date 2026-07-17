/**
 * Deck-editor server state — TanStack Query wrappers around the raw
 * `decksApi` promises the DeckEditor previously drove by hand.
 *
 * - `useDeckEditorDeck` loads an existing deck (real loading/error state).
 *   The "new deck" path (no deckId / "new") stays disabled and returns no data.
 * - `useUpdateDeck` / `useCreateDeck` are the dedicated mutation hooks. On
 *   success they refresh the editor's cached copy and invalidate the community
 *   marketplace listings. Navigation-after-save stays at the call site so the
 *   story-editor return flow + `bypassBlocker` handling is preserved exactly.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useApi } from "@/shared/api/provider";
import type {
  DeckCreate,
  DeckResponse,
  DeckUpdate,
} from "@/shared/api/decks";

export const communityDeckEditKey = (deckId: string | null | undefined) =>
  ["community", "deck", "edit", deckId ?? ""] as const;

function isRealDeckId(deckId: string | null | undefined): deckId is string {
  return !!deckId && deckId !== "new";
}

export function useDeckEditorDeck(
  deckId: string | null | undefined,
  opts?: { enabled?: boolean },
) {
  const { decks } = useApi();
  return useQuery({
    queryKey: communityDeckEditKey(deckId),
    queryFn: () => decks.getDeck(deckId as string),
    enabled: (opts?.enabled ?? true) && isRealDeckId(deckId),
    staleTime: 30_000,
  });
}

export function useUpdateDeck() {
  const { decks } = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deckId, body }: { deckId: string; body: DeckUpdate }) =>
      decks.updateDeck(deckId, body),
    onSuccess: (res: DeckResponse) => {
      qc.setQueryData(communityDeckEditKey(res.id), res);
      void qc.invalidateQueries({ queryKey: ["community", "marketplace"] });
    },
  });
}

export function useCreateDeck() {
  const { decks } = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DeckCreate) => decks.createDeck(body),
    onSuccess: (res: DeckResponse) => {
      qc.setQueryData(communityDeckEditKey(res.id), res);
      void qc.invalidateQueries({ queryKey: ["community", "marketplace"] });
    },
  });
}
