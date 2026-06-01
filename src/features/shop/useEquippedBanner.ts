import { getBannerStyle, type BannerStyle } from "./bannerStyles";
import { useEquippedCosmetic } from "./useEquippedCosmetic";

/**
 * Reads and writes the user's equipped profile banner.
 *
 * Equipped banner shop-item-id is stored at ``settings.shop.equippedBanner``.
 * The PublicProfilePage renders the equipped banner as a hero behind /
 * above the avatar; the InventorySection lets the user equip/unequip.
 */
export function useEquippedBanner() {
  const base = useEquippedCosmetic("equippedBanner");
  const style: BannerStyle | null = getBannerStyle(base.equippedId);
  return { ...base, style };
}
