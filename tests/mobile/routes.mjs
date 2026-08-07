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

/**
 * Desktop viewports. The gate was phone-only through 2026-08, which is why the
 * test-out shell shipped with its CTA below the fold at 1080p and its option
 * tiles at 2× lesson width — no viewport in the matrix was wide enough to see
 * it (Spencer QA 2026-08-05). Laptop-720 is the short-height desktop case:
 * plenty of width, less vertical room than a tablet.
 * @type {Viewport[]}
 */
export const DESKTOP_VIEWPORTS = [
  { name: "laptop-720", width: 1280, height: 720 },
  { name: "desktop-1080p", width: 1920, height: 1080 },
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
  // ⚠️ Lesson ids must be LIVE ids from the course map (`shared/domain/mockCourse.ts`).
  // These pointed at `ja-m4-1-1` until 2026-08-05 — an id that moved to
  // `curriculum/_archive/` in the 2026-07-26 IR wave. The route rendered
  // "Lesson not found", which exposes no `[data-testid="primary-cta"]`, so the
  // cta-fold spec skipped-with-annotation and stayed green while covering
  // nothing. Steps are chosen for step types that actually render a CTA.
  { path: "/ja/learn/lessons/ja-m4-neo-1?step=1", auth: true, lang: "ja", primaryCta: true }, // build_sentence
  { path: "/ja/learn/lessons/ja-m4-neo-1?step=6", auth: true, lang: "ja", primaryCta: true }, // word_image_mcq
  { path: "/ja/learn/lessons/ja-m4-neo-1?step=8", auth: true, lang: "ja", primaryCta: true }, // build_sentence
  { path: "/ja/learn/placement-test", auth: true, lang: "ja", primaryCta: true },
  // Per-module test-out. Shares PlacementTestPage with placement-test but is
  // reached from the course map, and was uncovered here until 2026-08-05.
  { path: "/ja/learn/test-out/m11", auth: true, lang: "ja", primaryCta: true },

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
