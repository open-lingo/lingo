/**
 * Ad-free time SKUs + tunable thresholds.
 *
 * Pricing rationale (anchored vs Duolingo gem economy):
 * - 30 min @ 50 lingots  → 1.67 lingots/min
 * - 2 h   @ 150 lingots  → 1.25 lingots/min  (slight bulk break)
 * - 24 h  @ 800 lingots  → 0.56 lingots/min  (heavy-user discount)
 *
 * The short-pack price is intentionally close to "one solid practice
 * session" of earnings (~40-60 lingots from a clean lesson run).
 * The 24h pack rewards committed learners with a much lower per-minute
 * cost — that's the segment we want to convert to long sessions.
 */
export type AdFreeProductId = "30m" | "2h" | "24h";

export type AdFreeSku = {
  id: AdFreeProductId;
  /** Stable catalog id used for shop wiring + server purchase. */
  catalogId: string;
  /** Duration granted, in ms. */
  durationMs: number;
  /** Lingot cost. */
  price: number;
  /** i18n key suffix under `adFree.skus.<id>`. */
  i18nKey: AdFreeProductId;
};

/** TUNE: ad-free duration / price ladder. Adjust here. */
export const AD_FREE_SKUS: ReadonlyArray<AdFreeSku> = [
  {
    id: "30m",
    catalogId: "ad-free-30m",
    durationMs: 30 * 60 * 1000,
    price: 50,
    i18nKey: "30m",
  },
  {
    id: "2h",
    catalogId: "ad-free-2h",
    durationMs: 2 * 60 * 60 * 1000,
    price: 150,
    i18nKey: "2h",
  },
  {
    id: "24h",
    catalogId: "ad-free-24h",
    durationMs: 24 * 60 * 60 * 1000,
    price: 800,
    i18nKey: "24h",
  },
] as const;

export function getSku(id: AdFreeProductId): AdFreeSku {
  const sku = AD_FREE_SKUS.find((s) => s.id === id);
  if (!sku) throw new Error(`Unknown ad-free sku: ${id}`);
  return sku;
}

/** localStorage key for the active ad-free deadline (epoch ms, string). */
export const AD_FREE_STORAGE_KEY = "lingo.ads.adFreeUntil";

/** localStorage key for the rolling lingot-earn log (JSON). */
export const LINGOT_EVENTS_STORAGE_KEY = "lingo.economy.lingotEvents";

/** localStorage key for the rolling ad-free purchase log (for 24h cap). */
export const AD_FREE_PURCHASES_STORAGE_KEY = "lingo.ads.adFreePurchases";

/** How often `useAdFreeStatus` recomputes the countdown while active. */
export const AD_FREE_TICK_MS = 30_000;

/** Pill threshold — flips to amber when remaining time drops below this. */
export const AD_FREE_AMBER_MS = 5 * 60 * 1000;

/** TUNE: anti-grind thresholds.
 *
 *  The intent: a learner who genuinely uses the app earns lingots at a
 *  comfortable rate (one focused lesson run ≈ 40-60 lingots over ~6-8
 *  active minutes ≈ 5-10 lingots/min in bursts but ≪8/min averaged
 *  over a day). Lingot-grinding behaviour (reload-and-collect, easy
 *  practice spam, deck-clear loops) pushes both the absolute 24h
 *  total AND the per-active-minute rate above realistic learning
 *  values. Trip both signals → block ad-free purchase.
 *
 *  Tune by watching `getGrindSnapshot(now)` in dev tools.
 */
export const GRIND_WINDOW_MS = 24 * 60 * 60 * 1000;
export const GRIND_LINGOTS_24H_THRESHOLD = 500;
export const GRIND_LINGOTS_PER_MINUTE_THRESHOLD = 8;
/** Need at least this many active minutes before the per-minute rate is meaningful. */
export const GRIND_MIN_ACTIVE_MINUTES = 5;
/** Hard cap so localStorage doesn't grow unbounded. */
export const LINGOT_EVENTS_MAX = 100;

/** TUNE: maximum ad-free time purchasable in a rolling 24h window.
 *
 *  Set to 24h so the longest SKU (24h pack) fits cleanly. Smaller
 *  packs stack toward the same cap — you can buy roughly forty-eight
 *  30-minute packs OR twelve 2-hour packs OR one 24h pack OR mixes
 *  thereof in any rolling-24h window before the cap kicks in.
 *
 *  Originally proposed at 6h, raised to 24h so the 24h SKU is
 *  actually purchasable; the grind-lock heuristic is the real
 *  abuse-prevention lever — this cap is the belt-and-braces backup. */
export const AD_FREE_DAILY_CAP_MS = 24 * 60 * 60 * 1000;
