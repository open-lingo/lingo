import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { getDecoratorStyle, type DecoratorStyle } from "./decoratorStyles";

/**
 * Reads and writes the user's equipped avatar decorator.
 *
 * Equipped decorator id is stored at `settings.shop.equippedDecorator`.
 * Callers get the style object (CSS gradient + label) directly so they
 * never need to import decoratorStyles themselves.
 */
export function useEquippedDecorator() {
  const { isAuthenticated, user } = useAuth();
  const { users } = useApi();
  const queryClient = useQueryClient();
  const userId = user?.sub ?? "anon";

  const query = useQuery({
    queryKey: ["users", userId, "settings", "equippedDecorator"],
    queryFn: async () => {
      const data = await users.getSettings();
      const shop = (data as Record<string, unknown>)?.shop;
      if (!shop || typeof shop !== "object") return null;
      const eq = (shop as Record<string, unknown>).equippedDecorator;
      return typeof eq === "string" ? eq : null;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: async (itemId: string | null) => {
      // Merge-patch just the equippedDecorator field inside the shop blob.
      // The settings endpoint does a shallow merge at the top level, so we
      // need to read current shop state, patch it, then write back the
      // whole shop sub-object to avoid clobbering purchases/inventory.
      const current = (await users.getSettings()) as Record<string, unknown>;
      const currentShop =
        current?.shop && typeof current.shop === "object"
          ? { ...(current.shop as Record<string, unknown>) }
          : {};
      if (itemId === null) {
        delete currentShop.equippedDecorator;
      } else {
        currentShop.equippedDecorator = itemId;
      }
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
  const style: DecoratorStyle | null = getDecoratorStyle(equippedId);

  return {
    equippedId,
    style,
    isLoading: query.isLoading,
    equip: mutation.mutate,
    isEquipping: mutation.isPending,
  };
}
