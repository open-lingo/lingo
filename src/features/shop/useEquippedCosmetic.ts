import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";

/**
 * Shared read/write hook for any single-slot cosmetic stored under
 * ``settings.shop.<key>``. The three concrete hooks
 * (``useEquippedDecorator``, ``useEquippedTitle``, ``useEquippedBanner``)
 * are thin wrappers around this — they exist so callers see a name
 * that matches the cosmetic, and so each one can map its equipped id
 * into a domain style object.
 *
 * Unequip wire format: empty string. The backend repo deep-merges the
 * patch into the existing settings blob, so OMITTING the key keeps the
 * previous value. To clear an equipped cosmetic we MUST send an
 * explicit value the merge will overwrite — empty string does the job
 * and the read side treats "" as null.
 */
export function useEquippedCosmetic(settingsKey: string) {
  const { isAuthenticated, user } = useAuth();
  const { users } = useApi();
  const queryClient = useQueryClient();
  const userId = user?.sub ?? "anon";

  const query = useQuery({
    queryKey: ["users", userId, "settings", settingsKey],
    queryFn: async () => {
      const data = await users.getSettings();
      const shop = (data as Record<string, unknown>)?.shop;
      if (!shop || typeof shop !== "object") return null;
      const eq = (shop as Record<string, unknown>)[settingsKey];
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
      currentShop[settingsKey] = itemId ?? "";
      await users.updateSettings({
        shop: currentShop,
      } as Record<string, unknown>);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          if (!Array.isArray(k)) return false;
          // Viewer's own settings — nav-avatar ring + inventory.
          if (k[0] === "users" && k.includes("settings")) return true;
          // Public-profile response carries the owner-resolved equipped
          // ids, so equipping needs to refresh the viewer's own profile
          // immediately rather than waiting for a stale-time refetch.
          if (k[0] === "social" && k[1] === "profile") return true;
          return false;
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
