export type ShopItemCategory = "powerups" | "cosmetics" | "adFree";

export type ShopItem = {
  id: string;
  price: number;
  category: ShopItemCategory;
  consumable: boolean;
  /** i18n key under shop.items.<id> */
  titleKey: string;
  descriptionKey: string;
  emoji: string;
};

/** Sample catalog — prices must match lingo-core/app/progress/shop_catalog.py */
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "streak-freeze",
    price: 10,
    category: "powerups",
    consumable: true,
    titleKey: "streakFreeze.title",
    descriptionKey: "streakFreeze.description",
    emoji: "🧊",
  },
  {
    id: "hint-pack",
    price: 5,
    category: "powerups",
    consumable: true,
    titleKey: "hintPack.title",
    descriptionKey: "hintPack.description",
    emoji: "💡",
  },
  {
    id: "profile-frame-gold",
    price: 25,
    category: "cosmetics",
    consumable: false,
    titleKey: "profileFrameGold.title",
    descriptionKey: "profileFrameGold.description",
    emoji: "✨",
  },
  {
    id: "title-night-owl",
    price: 15,
    category: "cosmetics",
    consumable: false,
    titleKey: "titleNightOwl.title",
    descriptionKey: "titleNightOwl.description",
    emoji: "🦉",
  },
];

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}
