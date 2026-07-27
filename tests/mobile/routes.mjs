/**
 * Single source of truth for the mobile pipeline's viewport × route matrix.
 *
 * Plain ESM so it can be imported by BOTH the Playwright gate specs (via
 * `_matrix.ts`, which re-exports these with TS types + a co-located
 * `routes.d.ts` declaration) AND the `scripts/mobile-matrix.mjs` visual sweep.
 * Keeping the arrays here — not duplicated in each file — is what stops the two
 * route lists from drifting.
 *
 * @typedef {{ name: string, width: number, height: number }} Viewport
 * @typedef {{ path: string, auth: boolean, lang: ("ja"|"ko"|null), primaryCta?: boolean }} RouteTarget
 */

/** @type {Viewport[]} */
export const VIEWPORTS = [
  { name: "android-small", width: 360, height: 640 },
  { name: "iphone-se", width: 375, height: 667 },
  { name: "pixel-7", width: 412, height: 915 },
  { name: "iphone-14-promax", width: 430, height: 932 },
  { name: "tablet-portrait", width: 768, height: 1024 },
];

/** @type {RouteTarget[]} */
export const PUBLIC_ROUTES = [
  { path: "/landing", auth: false, lang: null },
  { path: "/get-started", auth: false, lang: null },
  { path: "/try", auth: false, lang: "ja" },
  { path: "/login", auth: false, lang: null },
  { path: "/about", auth: false, lang: null },
];

/** @type {RouteTarget[]} */
export const AUTHED_ROUTES = [
  { path: "/home", auth: true, lang: "ja" },
  { path: "/settings", auth: true, lang: "ja" },

  // Learn + lesson player (LessonPage god file — highest overflow risk)
  { path: "/ja/learn", auth: true, lang: "ja" },
  { path: "/ja/learn/course", auth: true, lang: "ja" },
  { path: "/ja/learn/lessons/ja-m4-1-1?step=0", auth: true, lang: "ja", primaryCta: true },
  { path: "/ja/learn/lessons/ja-m4-1-1?step=2", auth: true, lang: "ja", primaryCta: true },
  { path: "/ja/learn/lessons/ja-m4-1-1?step=6", auth: true, lang: "ja", primaryCta: true },
  { path: "/ja/learn/placement-test", auth: true, lang: "ja", primaryCta: true },

  // Practice pillars
  { path: "/ja/practice", auth: true, lang: "ja" },
  { path: "/ja/practice/grammar", auth: true, lang: "ja" },
  { path: "/ja/practice/grammar/review", auth: true, lang: "ja" },
  { path: "/ja/practice/grammar/conjugation", auth: true, lang: "ja" },
  { path: "/ja/practice/flashcards", auth: true, lang: "ja" },
  { path: "/ja/practice/flashcards/review", auth: true, lang: "ja" },
  { path: "/ja/practice/flashcards/cards", auth: true, lang: "ja" },
  { path: "/ja/practice/flashcards/decks", auth: true, lang: "ja" },
  { path: "/ja/practice/alphabet", auth: true, lang: "ja" },
  { path: "/ja/practice/alphabet/hiragana", auth: true, lang: "ja" },
  { path: "/ja/practice/kanji", auth: true, lang: "ja" },
  { path: "/ja/practice/stories", auth: true, lang: "ja" },
  { path: "/ja/practice/journey", auth: true, lang: "ja" },
  { path: "/ja/practice/reading", auth: true, lang: "ja" },
  { path: "/ja/practice/speaking", auth: true, lang: "ja" },
  { path: "/ja/practice/listening", auth: true, lang: "ja" },
  { path: "/ja/practice/writing", auth: true, lang: "ja" },

  // Content + social
  { path: "/ja/vocab", auth: true, lang: "ja" },
  { path: "/ja/shop", auth: true, lang: "ja" },
  { path: "/ja/community/explore", auth: true, lang: "ja" },
  { path: "/ja/community/leaderboard", auth: true, lang: "ja" },
  { path: "/ja/social", auth: true, lang: "ja" },

  // Korean subset — CJK/long-string wrapping regression coverage
  { path: "/ko/learn", auth: true, lang: "ko" },
  { path: "/ko/practice", auth: true, lang: "ko" },
  { path: "/ko/community/leaderboard", auth: true, lang: "ko" },
];
