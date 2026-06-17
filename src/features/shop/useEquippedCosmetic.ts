import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useUserSettings, type RawUserSettings } from "@/shared/hooks/useUserSettings";

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
function selectEquipped(settingsKey: string) {
  return (data: RawUserSettings): string | null => {
    const shop = data?.shop;
    if (!shop || typeof shop !== "object") return null;
    const eq = (shop as Record<string, unknown>)[settingsKey];
    if (typeof eq !== "string" || eq === "") return null;
    return eq;
  };
}

export function useEquippedCosmetic(settingsKey: string) {
  const { users } = useApi();
  const queryClient = useQueryClient();

  // Reads the equipped slot off the shared user-settings query (one fetch
  // shared with SettingsContext + the shop). The nav-avatar ring mounts the
  // decorator slot on every page, so deduping onto one cache entry — keyed by
  // identity in useUserSettings, 5 min staleTime — avoids a settings refetch
  // per navigation. The equip mutation below invalidates the settings key.
  const query = useUserSettings({ select: selectEquipped(settingsKey) });

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
