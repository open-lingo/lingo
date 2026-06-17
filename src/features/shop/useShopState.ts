import { useQueryClient } from "@tanstack/react-query";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { useUserSettings, type RawUserSettings } from "@/shared/hooks/useUserSettings";

export type ShopState = {
  purchases: string[];
  inventory: Record<string, number>;
};

function parseShopState(raw: RawUserSettings | undefined): ShopState {
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
  const { stats, isReady: statsReady, refetch: refetchStats } = useUserStats();

  // Shares the one ``GET /users/me/settings`` fetch with SettingsContext and
  // the cosmetic slots — derives the shop slice via ``select``. Shop inventory
  // + purchases only change on a shop mutation, which already calls
  // useInvalidateShopQueries(); the 5 min staleTime lives on the shared query.
  const settingsQuery = useUserSettings({ select: parseShopState });

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
    // Shop state now lives on the unified user-settings query (shared with
    // SettingsContext + the cosmetic slots), so invalidate any settings key
    // under the users namespace rather than a shop-suffixed one.
    void queryClient.invalidateQueries({
      predicate: (q) => {
        const k = q.queryKey;
        return Array.isArray(k) && k[0] === "users" && k.includes("settings");
      },
    });
  };
}
