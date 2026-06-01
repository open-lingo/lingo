/**
 * Banner SKU id → inline SVG component + a11y label.
 *
 * Mirrors the shape of `decoratorStyles.ts` so consumers can stay
 * symmetrical. The component is passed `SVGProps<SVGSVGElement>` so
 * callers can size it freely (banners render as 6:1 strips on the
 * profile page hero but render as ~60px tall thumbnails inside shop
 * cards).
 */

import type { SVGProps } from "react";
import {
  SakuraBanner,
  VaporwaveSunBanner,
  StarryNightBanner,
  HeartsConfettiBanner,
  CoffeeSteamBanner,
  SunsetMountainsBanner,
  OceanBoatBanner,
  MeadowBanner,
} from "./bannerSvgs";

export type BannerStyle = {
  /** React component that renders the inline banner SVG. */
  Svg: (props: SVGProps<SVGSVGElement>) => React.ReactNode;
  /** Screen-reader label — used when the banner stands alone. */
  label: string;
};

export const BANNER_STYLES: Record<string, BannerStyle> = {
  "banner-sakura": { Svg: SakuraBanner, label: "Sakura branch banner" },
  "banner-vaporwave-sun": { Svg: VaporwaveSunBanner, label: "Vaporwave sun banner" },
  "banner-starry-night": { Svg: StarryNightBanner, label: "Starry night banner" },
  "banner-hearts-confetti": {
    Svg: HeartsConfettiBanner,
    label: "Pastel hearts banner",
  },
  "banner-coffee-steam": { Svg: CoffeeSteamBanner, label: "Coffee steam banner" },
  "banner-sunset-mountains": {
    Svg: SunsetMountainsBanner,
    label: "Sunset mountains banner",
  },
  "banner-ocean-boat": { Svg: OceanBoatBanner, label: "Ocean sailboat banner" },
  "banner-meadow": { Svg: MeadowBanner, label: "Meadow flowers banner" },
};

/** Returns the style for a given item id, or null if not a banner. */
export function getBannerStyle(itemId: string | null | undefined): BannerStyle | null {
  if (!itemId) return null;
  return BANNER_STYLES[itemId] ?? null;
}

/** All item ids that are banners (for filtering the shop catalog). */
export const BANNER_IDS = new Set(Object.keys(BANNER_STYLES));
