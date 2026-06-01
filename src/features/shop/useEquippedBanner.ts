import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { getBannerStyle, type BannerStyle } from "./bannerStyles";

/**
 * Reads and writes the user's equipped profile banner.
 *
 * Equipped banner shop-item-id is stored at ``settings.shop.equippedBanner``.
 * The PublicProfilePage renders the equipped banner as a hero behind /
 * above the avatar; the InventorySection lets the user equip/unequip.
 *
 * Mirrors ``useEquippedTitle`` and ``useEquippedDecorator`` — same
 * unequip-via-empty-string encoding so the backend's deep-merge
 * actually overwrites the previous value instead of skipping a missing
 * key.
 */
export function useEquippedBanner() {
  const { isAuthenticated, user } = useAuth();
  const { users } = useApi();
  const queryClient = useQueryClient();
  const userId = user?.sub ?? "anon";

  const query = useQuery({
    queryKey: ["users", userId, "settings", "equippedBanner"],
    queryFn: async () => {
      const data = await users.getSettings();
      const shop = (data as Record<string, unknown>)?.shop;
      if (!shop || typeof shop !== "object") return null;
      const eq = (shop as Record<string, unknown>).equippedBanner;
      if (typeof eq !== "string" || eq === "") return null;
      return eq;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: async (itemId: string | null) => {
      const current = (await users.getSettings()) as Record<string, unknown>;
      const currentShop =
        current?.shop && typeof current.shop === "object"
          ? { ...(current.shop as Record<string, unknown>) }
          : {};
      // Empty string ⇒ unequip. See useEquippedDecorator for why we
      // can't just delete the key.
      currentShop.equippedBanner = itemId ?? "";
      await users.updateSettings({
        shop: currentShop,
      } as Record<string, unknown>);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          return (
            Array.isArray(k) && k[0] === "users" && k.includes("settings")
          );
        },
      });
    },
  });

  const equippedId = query.data ?? null;
  const style: BannerStyle | null = getBannerStyle(equippedId);

  return {
    equippedId,
    style,
    isLoading: query.isLoading,
    equip: mutation.mutate,
    isEquipping: mutation.isPending,
  };
}
