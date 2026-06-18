/**
 * usePendingReviewCount — live count of items awaiting moderation:
 * draft community decks (excluding seeded vocab-* decks) + draft stories.
 *
 * Shared by the dashboard metrics/nav and the admin sidebar badge so the
 * count stays consistent across the console. Returns `undefined` while
 * either query is still loading.
 */
import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/shared/api/provider";

export function usePendingReviewCount(): number | undefined {
  const { admin, decks: decksApi } = useApi();

  const pendingDecks = useQuery({
    queryKey: ["admin", "dashboard", "pendingDecks"],
    queryFn: async () => {
      const items = await decksApi.listAdminDecks({ status: "draft" });
      return items.filter((d) => !d.id.startsWith("vocab-")).length;
    },
    staleTime: 60_000,
  });

  const pendingStories = useQuery({
    queryKey: ["admin", "dashboard", "pendingStories"],
    queryFn: async () => {
      const items = await admin.listStories({ status: "draft" });
      return items.length;
    },
    staleTime: 60_000,
  });

  if (pendingDecks.data === undefined || pendingStories.data === undefined) {
    return undefined;
  }
  return pendingDecks.data + pendingStories.data;
}
