import { useMemo } from "react";
import { useMarketplaceContent } from "@/features/community/hooks/useMarketplaceContent";

export type AuthoredDeck = {
  id: string;
  name: string;
  language: string | null;
  /** Card count where the payload carries it. */
  itemCount?: number;
  /** Per-deck upvotes (real, from `DeckResponse.voteCount`). */
  upvotes: number;
  updatedAt: string;
};

export type AuthoredDecks = {
  decks: AuthoredDeck[];
  totalUpvotes: number;
  isLoading: boolean;
};

/**
 * Resolve a profile owner's published decks WITH per-deck upvotes, derived
 * from the marketplace content feed (the only wire signal that carries
 * `voteCount` per deck). The public-profile response only ships
 * `authored_decks_sample` (id/name/language, no votes), so for community
 * standing we join against the marketplace by author id.
 *
 * Returns an empty list (not an error) when the owner has no published decks
 * or isn't in the marketplace feed yet.
 */
export function useAuthoredDecks(ownerUserId: string | null | undefined): AuthoredDecks {
  const { items, isLoading } = useMarketplaceContent();

  return useMemo<AuthoredDecks>(() => {
    if (!ownerUserId) return { decks: [], totalUpvotes: 0, isLoading };
    const decks: AuthoredDeck[] = items
      .filter((it) => it.kind === "flashcard-pack" && it.authorId === ownerUserId)
      .map((it) => ({
        id: it.id,
        name: it.name,
        language: it.languageId || null,
        itemCount: it.itemCount,
        upvotes: it.upvoteCount,
        updatedAt: it.updatedAt,
      }))
      .sort((a, b) => b.upvotes - a.upvotes || b.updatedAt.localeCompare(a.updatedAt));
    const totalUpvotes = decks.reduce((sum, d) => sum + d.upvotes, 0);
    return { decks, totalUpvotes, isLoading };
  }, [items, ownerUserId, isLoading]);
}
