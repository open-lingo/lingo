/**
 * useTopContributors — the people behind community content.
 *
 * Backend gap: there is no `/community/contributors` aggregate. We derive
 * contributors honestly from real signals already on the wire:
 *   - authored published decks (count + total upvotes), from the marketplace
 *     content feed (`useMarketplaceContent`)
 *   - resolved name / avatar / xp / streak from the discover directory
 *
 * A contributor must resolve to a known directory profile AND have authored at
 * least one piece of content — we never invent handles. When the aggregate
 * ships, replace the derivation with a single fetch; the `Contributor` shape
 * is intentionally close to what such an endpoint would return.
 */

import { useMemo } from "react";
import { useCreatorDirectory, type CreatorSummary } from "./useCreatorDirectory";
import { useMarketplaceContent } from "./useMarketplaceContent";

export type Contributor = CreatorSummary & {
  /** Pieces of published content authored. */
  contentCount: number;
  /** Total upvotes across authored content. */
  upvotes: number;
};

export type TopContributors = {
  contributors: Contributor[];
  isLoading: boolean;
};

export function useTopContributors(limit = 8): TopContributors {
  const { byId, isLoading: dirLoading } = useCreatorDirectory();
  const { items, isLoading: contentLoading } = useMarketplaceContent();

  const contributors = useMemo<Contributor[]>(() => {
    const bucket = new Map<string, Contributor>();
    for (const it of items) {
      if (!it.authorId) continue;
      const profile = byId.get(it.authorId);
      if (!profile) continue; // never fabricate an unknown author
      const existing = bucket.get(it.authorId);
      if (existing) {
        existing.contentCount += 1;
        existing.upvotes += it.upvoteCount;
      } else {
        bucket.set(it.authorId, {
          ...profile,
          contentCount: 1,
          upvotes: it.upvoteCount,
        });
      }
    }
    return Array.from(bucket.values())
      .sort((a, b) => b.contentCount - a.contentCount || b.upvotes - a.upvotes)
      .slice(0, limit);
  }, [items, byId, limit]);

  return { contributors, isLoading: dirLoading || contentLoading };
}
