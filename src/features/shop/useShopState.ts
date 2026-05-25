import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { useUserStats } from "@/shared/hooks/useUserStats";

export type ShopState = {
  purchases: string[];
  inventory: Record<string, number>;
};

function parseShopState(raw: Record<string, unknown> | undefined): ShopState {
  const shop = raw?.shop;
  if (!shop || typeof shop !== "object") {
    return { purchases: [], inventory: {} };
  }
  const s = shop as Record<string, unknown>;
  const purchases = Array.isArray(s.purchases)
    ? s.purchases.filter((x): x is string => typeof x === "string")
    : [];
  const inventory: Record<string, number> = {};
  if (s.inventory && typeof s.inventory === "object") {
    for (const [k, v] of Object.entries(s.inventory as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v)) inventory[k] = v;
    }
  }
  return { purchases, inventory };
}

export function useShopState() {
  const { isAuthenticated, user } = useAuth();
  const { users } = useApi();
  const { stats, isReady: statsReady, refetch: refetchStats } = useUserStats();
  // Fix M8 — user-scoped key so the shop state from a previous account
  // doesn't briefly surface during a login switch.
  const userId = user?.sub ?? "anon";

  const settingsQuery = useQuery({
    queryKey: ["users", userId, "settings", "shop"],
    queryFn: async () => {
      const data = await users.getSettings();
      return parseShopState(data as Record<string, unknown>);
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const shop = settingsQuery.data ?? { purchases: [], inventory: {} };

  const isOwned = (itemId: string, consumable: boolean) => {
    if (consumable) return (shop.inventory[itemId] ?? 0) > 0;
    return shop.purchases.includes(itemId);
  };

  const ownedQuantity = (itemId: string) => shop.inventory[itemId] ?? 0;

  return {
    lingots: statsReady ? stats.lingots : null,
    statsReady,
    shop,
    isLoading: settingsQuery.isLoading,
    isOwned,
    ownedQuantity,
    refetchStats,
    refetchShop: settingsQuery.refetch,
  };
}

export function useInvalidateShopQueries() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["progress", "me"] });
    // Match the user-scoped shop key. invalidateQueries with a prefix
    // matches any extra segments, so ["users"] is sufficient — but be
    // narrower than that or we'll invalidate the entire users namespace.
    void queryClient.invalidateQueries({
      predicate: (q) => {
        const k = q.queryKey;
        return (
          Array.isArray(k) &&
          k[0] === "users" &&
          k.includes("settings") &&
          k.includes("shop")
        );
      },
    });
  };
}
