/**
 * useMarketplaceContent — the data layer for the community marketplace home.
 *
 * Fetches published community content (flashcard decks + browse stories +
 * community addons), normalizes it into a single `MarketplaceItem` shape, and
 * attaches resolved creator metadata (via the discover-backed creator
 * directory). The home page composes its rails (featured / new / by-language)
 * from this one normalized list so new content types slot in by extending the
 * normalizer rather than adding bespoke fetch wiring per rail.
 *
 * Backend gaps surfaced here (degraded, not faked):
 *   - No "featured" / curation flag on content → featured rail derives from
 *     vote count (`voteCount`), highest first.
 *   - No download / install metric → omitted (the old explore page multiplied
 *     upvotes for a fake number; we don't carry that into the marketplace).
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/api/provider";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import type { DeckResponse } from "@/shared/api/decks";
import type { StoryResponse } from "@/shared/api/stories";
import { useCreatorDirectory, type CreatorSummary } from "./useCreatorDirectory";

export type MarketplaceKind = "flashcard-pack" | "story" | "course";

export type MarketplaceItem = {
  id: string;
  kind: MarketplaceKind;
  languageId: string;
  name: string;
  description: string;
  /** Card / lesson count where meaningful. */
  itemCount?: number;
  upvoteCount: number;
  updatedAt: string;
  image?: string | null;
  /** Opaque author id from the content payload (may be unresolved). */
  authorId?: string;
  /** Resolved creator (name + avatar) when the author is in the directory. */
  creator?: CreatorSummary;
  /** Underlying deck payload, when the item is a deck (enables preview). */
  deck?: DeckResponse;
  /** Underlying story payload, when the item is a story (enables preview). */
  story?: StoryResponse;
};

export type MarketplaceContent = {
  items: MarketplaceItem[];
  isLoading: boolean;
  isError: boolean;
};

export function useMarketplaceContent(): MarketplaceContent {
  const { decks, stories } = useApi();
  const flags = useFeatureFlags();
  const explore = flags.community.explore;
  const { resolveCreator, isLoading: dirLoading } = useCreatorDirectory();

  const decksQuery = useQuery<DeckResponse[]>({
    queryKey: ["community", "marketplace", "decks"],
    queryFn: () => decks.listAdminDecks({ status: "published" }),
    enabled: explore.flashcardDecks,
    staleTime: 60_000,
  });

  const storiesQuery = useQuery<StoryResponse[]>({
    queryKey: ["community", "marketplace", "stories"],
    queryFn: () => stories.listBrowseStories({}),
    enabled: explore.stories,
    staleTime: 60_000,
  });

  const items = useMemo<MarketplaceItem[]>(() => {
    const out: MarketplaceItem[] = [];

    if (explore.flashcardDecks) {
      for (const d of decksQuery.data ?? []) {
        // Companion decks are study-only and excluded from community browse.
        if (d.companionToStoryId) continue;
        out.push({
          id: d.id,
          kind: "flashcard-pack",
          languageId: d.languageId,
          name: d.name,
          description: d.description ?? "",
          itemCount: d.cardCount,
          upvoteCount: d.voteCount ?? 0,
          updatedAt: d.updatedAt ?? d.createdAt ?? "",
          image: d.image,
          authorId: d.authorId,
          creator: resolveCreator(d.authorId),
          deck: d,
        });
      }
    }

    if (explore.stories) {
      for (const s of storiesQuery.data ?? []) {
        out.push({
          id: s.id,
          kind: "story",
          languageId: s.languageId,
          name: s.title,
          description: s.description ?? "",
          upvoteCount: 0,
          updatedAt: s.updatedAt ?? s.createdAt ?? "",
          authorId: s.authorId,
          creator: resolveCreator(s.authorId),
          story: s,
        });
      }
    }

    return out;
  }, [decksQuery.data, storiesQuery.data, explore.flashcardDecks, explore.stories, resolveCreator]);

  return {
    items,
    isLoading: decksQuery.isLoading || storiesQuery.isLoading || dirLoading,
    isError: decksQuery.isError || storiesQuery.isError,
  };
}
