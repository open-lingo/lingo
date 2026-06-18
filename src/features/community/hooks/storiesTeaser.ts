import type { MarketplaceItem } from "./useMarketplaceContent";

/**
 * MOCK DATA — placeholder "Stories" teaser tiles.
 *
 * Interactive stories are not shipped yet. These clearly-fabricated tiles
 * advertise the upcoming feature on the Discover home so learners know it is
 * coming. They are rendered with `comingSoon` (non-interactive) and never
 * counted in any real metric. Delete this file when real stories ship.
 */
export const STORIES_TEASER_ITEMS: MarketplaceItem[] = [
  {
    id: "teaser-story-cafe",
    kind: "story",
    languageId: "ja",
    name: "A Morning at the Café",
    description: "Order breakfast and chat with the barista in beginner Japanese.",
    upvoteCount: 0,
    updatedAt: "",
    image: null,
  },
  {
    id: "teaser-story-market",
    kind: "story",
    languageId: "ko",
    name: "Lost at the Night Market",
    description: "Ask for directions and haggle for street food in Seoul.",
    upvoteCount: 0,
    updatedAt: "",
    image: null,
  },
  {
    id: "teaser-story-train",
    kind: "story",
    languageId: "es",
    name: "The Last Train Home",
    description: "Navigate a missed connection in conversational Spanish.",
    upvoteCount: 0,
    updatedAt: "",
    image: null,
  },
  {
    id: "teaser-story-roommate",
    kind: "story",
    languageId: "ja",
    name: "Meeting Your Roommate",
    description: "Introduce yourself and settle into a shared apartment.",
    upvoteCount: 0,
    updatedAt: "",
    image: null,
  },
];
