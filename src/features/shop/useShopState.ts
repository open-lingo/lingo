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
  const { isAuthenticated } = useAuth();
  const { users } = useApi();
  const { stats, isReady: statsReady, refetch: refetchStats } = useUserStats();

  const settingsQuery = useQuery({
    queryKey: ["users", "settings", "shop"],
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
    void queryClient.invalidateQueries({ queryKey: ["users", "settings", "shop"] });
  };
}
