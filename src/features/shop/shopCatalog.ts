export type ShopItemCategory = "powerups" | "cosmetics" | "adFree";

export type ShopItem = {
  id: string;
  price: number;
  category: ShopItemCategory;
  consumable: boolean;
  /** i18n key under shop.items.<key> */
  titleKey: string;
  descriptionKey: string;
  /** lucide icon name shown in shop card (no emoji). */
  iconName: string;
  /** When set, equipping this item renders a decorator ring. Must match decoratorStyles key. */
  decoratorId?: string;
  /**
   * When set, this item is a wearable profile title. The text rendered
   * under the user's display name comes from
   * ``shop.items.<titleKey>.wear`` in the i18n bundle.
   */
  titleId?: string;
  /**
   * When set, this item is a profile banner. The id maps into
   * ``bannerStyles.ts`` for the inline-SVG art that renders both the
   * shop-card thumbnail and the equipped hero on PublicProfilePage.
   */
  bannerId?: string;
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
    iconName: "sparkles",
  },
  {
    id: "hint-pack",
    price: 5,
    category: "powerups",
    consumable: true,
    titleKey: "hintPack.title",
    descriptionKey: "hintPack.description",
    iconName: "lightbulb",
  },
  {
    id: "profile-frame-gold",
    price: 25,
    category: "cosmetics",
    consumable: false,
    titleKey: "profileFrameGold.title",
    descriptionKey: "profileFrameGold.description",
    iconName: "sparkles",
    decoratorId: "profile-frame-gold",
  },
  {
    id: "profile-frame-silver",
    price: 250,
    category: "cosmetics",
    consumable: false,
    titleKey: "profileFrameSilver.title",
    descriptionKey: "profileFrameSilver.description",
    iconName: "sparkles",
    decoratorId: "profile-frame-silver",
  },
  {
    id: "profile-frame-bronze",
    price: 150,
    category: "cosmetics",
    consumable: false,
    titleKey: "profileFrameBronze.title",
    descriptionKey: "profileFrameBronze.description",
    iconName: "sparkles",
    decoratorId: "profile-frame-bronze",
  },
  {
    id: "profile-frame-blue",
    price: 500,
    category: "cosmetics",
    consumable: false,
    titleKey: "profileFrameBlue.title",
    descriptionKey: "profileFrameBlue.description",
    iconName: "sparkles",
    decoratorId: "profile-frame-blue",
  },
  {
    id: "profile-frame-emerald",
    price: 500,
    category: "cosmetics",
    consumable: false,
    titleKey: "profileFrameEmerald.title",
    descriptionKey: "profileFrameEmerald.description",
    iconName: "sparkles",
    decoratorId: "profile-frame-emerald",
  },
  {
    id: "profile-frame-rose",
    price: 500,
    category: "cosmetics",
    consumable: false,
    titleKey: "profileFrameRose.title",
    descriptionKey: "profileFrameRose.description",
    iconName: "sparkles",
    decoratorId: "profile-frame-rose",
  },
  {
    id: "profile-frame-plasma",
    price: 1000,
    category: "cosmetics",
    consumable: false,
    titleKey: "profileFramePlasma.title",
    descriptionKey: "profileFramePlasma.description",
    iconName: "sparkles",
    decoratorId: "profile-frame-plasma",
  },
  {
    id: "title-night-owl",
    price: 15,
    category: "cosmetics",
    consumable: false,
    titleKey: "titleNightOwl.title",
    descriptionKey: "titleNightOwl.description",
    iconName: "crown",
    titleId: "title-night-owl",
  },

  // ─── Profile banners ──────────────────────────────────────────────────────
  // Inline-SVG art lives in `bannerSvgs.tsx`; the catalog only carries the
  // SKU + price + a `bannerId` pointer. Prices follow the same accessibility
  // floor as titles/frames (100-500 lingots) with the more elaborate art
  // priced higher.
  {
    id: "banner-sakura",
    price: 200,
    category: "cosmetics",
    consumable: false,
    titleKey: "bannerSakura.title",
    descriptionKey: "bannerSakura.description",
    iconName: "sparkles",
    bannerId: "banner-sakura",
  },
  {
    id: "banner-vaporwave-sun",
    price: 350,
    category: "cosmetics",
    consumable: false,
    titleKey: "bannerVaporwaveSun.title",
    descriptionKey: "bannerVaporwaveSun.description",
    iconName: "sparkles",
    bannerId: "banner-vaporwave-sun",
  },
  {
    id: "banner-starry-night",
    price: 250,
    category: "cosmetics",
    consumable: false,
    titleKey: "bannerStarryNight.title",
    descriptionKey: "bannerStarryNight.description",
    iconName: "sparkles",
    bannerId: "banner-starry-night",
  },
  {
    id: "banner-hearts-confetti",
    price: 150,
    category: "cosmetics",
    consumable: false,
    titleKey: "bannerHeartsConfetti.title",
    descriptionKey: "bannerHeartsConfetti.description",
    iconName: "heart",
    bannerId: "banner-hearts-confetti",
  },
  {
    id: "banner-coffee-steam",
    price: 150,
    category: "cosmetics",
    consumable: false,
    titleKey: "bannerCoffeeSteam.title",
    descriptionKey: "bannerCoffeeSteam.description",
    iconName: "sparkles",
    bannerId: "banner-coffee-steam",
  },
  {
    id: "banner-sunset-mountains",
    price: 300,
    category: "cosmetics",
    consumable: false,
    titleKey: "bannerSunsetMountains.title",
    descriptionKey: "bannerSunsetMountains.description",
    iconName: "sparkles",
    bannerId: "banner-sunset-mountains",
  },
  {
    id: "banner-ocean-boat",
    price: 300,
    category: "cosmetics",
    consumable: false,
    titleKey: "bannerOceanBoat.title",
    descriptionKey: "bannerOceanBoat.description",
    iconName: "sparkles",
    bannerId: "banner-ocean-boat",
  },
  {
    id: "banner-meadow",
    price: 200,
    category: "cosmetics",
    consumable: false,
    titleKey: "bannerMeadow.title",
    descriptionKey: "bannerMeadow.description",
    iconName: "sparkles",
    bannerId: "banner-meadow",
  },
];

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}

/** All items that function as avatar decorators. */
export const DECORATOR_ITEMS = SHOP_ITEMS.filter((i) => i.decoratorId != null);

/** All items that function as wearable profile titles. */
export const TITLE_ITEMS = SHOP_ITEMS.filter((i) => i.titleId != null);

/** All items that function as profile banners. */
export const BANNER_ITEMS = SHOP_ITEMS.filter((i) => i.bannerId != null);

/** All cosmetic items (decorators, titles, banners). */
export const COSMETIC_ITEMS = SHOP_ITEMS.filter((i) => i.category === "cosmetics");
