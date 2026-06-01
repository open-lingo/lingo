import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";

/**
 * Reads and writes the user's equipped profile title.
 *
 * Equipped title shop-item-id is stored at ``settings.shop.equippedTitle``.
 * The InventorySection shows owned titles and lets the user equip /
 * unequip; the PublicProfilePage renders the equipped title under the
 * display name.
 *
 * Mirrors ``useEquippedDecorator`` — same unequip-via-empty-string
 * encoding so the backend's deep-merge actually overwrites the previous
 * value instead of skipping a missing key.
 */
export function useEquippedTitle() {
  const { isAuthenticated, user } = useAuth();
  const { users } = useApi();
  const queryClient = useQueryClient();
  const userId = user?.sub ?? "anon";

  const query = useQuery({
    queryKey: ["users", userId, "settings", "equippedTitle"],
    queryFn: async () => {
      const data = await users.getSettings();
      const shop = (data as Record<string, unknown>)?.shop;
      if (!shop || typeof shop !== "object") return null;
      const eq = (shop as Record<string, unknown>).equippedTitle;
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
      currentShop.equippedTitle = itemId ?? "";
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

  return {
    equippedId: query.data ?? null,
    isLoading: query.isLoading,
    equip: mutation.mutate,
    isEquipping: mutation.isPending,
  };
}
