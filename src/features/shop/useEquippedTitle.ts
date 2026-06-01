import { useEquippedCosmetic } from "./useEquippedCosmetic";

/**
 * Reads and writes the user's equipped profile title.
 *
 * Equipped title shop-item-id is stored at ``settings.shop.equippedTitle``.
 * The InventorySection shows owned titles and lets the user equip /
 * unequip; the PublicProfilePage renders the equipped title under the
 * display name.
 */
export function useEquippedTitle() {
  return useEquippedCosmetic("equippedTitle");
}
