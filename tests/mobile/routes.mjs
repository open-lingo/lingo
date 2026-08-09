/**
 * Single source of truth for the mobile pipeline's viewport × route matrix.
 *
 * Plain ESM so it can be imported by BOTH the Playwright gate specs (via
 * `_matrix.ts`, which re-exports these with TS types + a co-located
 * `routes.d.ts` declaration) AND the `scripts/mobile-matrix.mjs` visual sweep.
 * Keeping the arrays here — not duplicated in each file — is what stops the two
 * route lists from drifting.
 *
 * @typedef {{ top: number, right: number, bottom: number, left: number }} Insets
 * @typedef {{ name: string, width: number, height: number, insets: Insets, legacy?: boolean }} Viewport
 * @typedef {{ path: string, auth: boolean, lang: ("ja"|"ko"|null), primaryCta?: boolean }} RouteTarget
 */

/**
 * Safe-area insets, in CSS px, pushed into the browser before each navigation
 * (`_seed.ts` → `Emulation.setSafeAreaInsetsOverride`).
 *
 * ⚠️ WITHOUT THESE, `env(safe-area-inset-*)` IS ZERO IN CHROMIUM, and every
 * `*-safe` utility in `tailwind.config.js` resolves to its fallback — which is
 * why this gate ran for months structurally unable to see a Dynamic Island
 * overlap, and why the bug had to be found by hand on a phone (2026-08-08).
 *
 * Values model the app inside the Capacitor wrapper with `viewport-fit=cover`,
 * NOT a browser tab: on a home-button iPhone the status bar sits outside a
 * normal tab's web view (inset 0) but inside the wrapper's (inset 20).
 *
 * Provenance — `iphone-14-promax` (59/34) is the published pair for the device
 * the app is actually being tested on. The rest are representative for their
 * device class, and `android-small` is deliberately all-zero so the matrix
 * keeps one no-inset control.
 */
/**
 * `legacy: true` — a device outside the support target.
 *
 * Product call (Spencer 2026-08-09): "we want to optimize for devices newer
 * than 6 years or so; if some older ones get squished or small text or weird
 * but functional views, then it's not too big of a deal."
 *
 * 360x640 is a ~2015 Android. It stays in the matrix because the checks that
 * are about a page still WORKING there are cheap and worth keeping — no
 * horizontal scroll, nothing off the right edge, no render errors, tap targets
 * still hittable. What it no longer does is hard-fail on comfort: a step that
 * fits everywhere else and has to scroll a little here is "squished but
 * functional", which is explicitly acceptable.
 *
 * Nothing else is legacy. 375x667 is the iPhone SE, still sold and squarely in
 * the support window, so it is held to the full standard.
 */
/** @type {Viewport[]} */
export const VIEWPORTS = [
  { name: "android-small", width: 360, height: 640, insets: { top: 0, right: 0, bottom: 0, left: 0 }, legacy: true },
  { name: "iphone-se", width: 375, height: 667, insets: { top: 20, right: 0, bottom: 0, left: 0 } },
  { name: "pixel-7", width: 412, height: 915, insets: { top: 24, right: 0, bottom: 24, left: 0 } },
  { name: "iphone-14-promax", width: 430, height: 932, insets: { top: 59, right: 0, bottom: 34, left: 0 } },
  { name: "tablet-portrait", width: 768, height: 1024, insets: { top: 24, right: 0, bottom: 20, left: 0 } },
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
  { name: "laptop-720", width: 1280, height: 720, insets: { top: 0, right: 0, bottom: 0, left: 0 } },
  { name: "desktop-1080p", width: 1920, height: 1080, insets: { top: 0, right: 0, bottom: 0, left: 0 } },
];

/**
 * Anonymous routes this app actually serves.
 *
 * ⚠️ SHORT ON PURPOSE — three entries were removed 2026-08-07 because they were
 * not pages of this app and the gate was measuring the public internet:
 *
 *   /landing -> https://openlingoapp.com/            (live marketing site)
 *   /about   -> https://openlingoapp.com/            (same)
 *   /login   -> https://dev-….us.auth0.com/authorize (live Auth0 hosted page)
 *
 * The marketing pages moved to the `lingo-landing` repo and are served from the
 * apex while this app lives at `app.<domain>` (`shared/config/marketing.ts`), so
 * `/landing` and `/about` match no route here; the SPA fallback serves
 * index.html, the router finds nothing, and `MarketingRedirect` leaves the
 * origin. `/login` hands off to Auth0 on mount.
 *
 * The gate was therefore asserting layout on origins this repo does not build
 * or deploy. That is what turned CI red on 2026-08-06: a fixed-width decorative
 * div overflowing at every phone width — on the marketing site. Nothing here
 * could fix it, and CI's colour depended on a third party being up and
 * unchanged. `_seed.ts` now fails any test whose navigation leaves the origin,
 * so this cannot silently come back.
 *
 * Add a path here only if it renders IN THIS APP for a signed-out visitor.
 * @type {RouteTarget[]}
 */
export const PUBLIC_ROUTES = [
  { path: "/get-started", auth: false, lang: null },
  { path: "/try", auth: false, lang: "ja" },
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
  // NO `/ja/practice/reading` — it has never been a route. The reader lives at
  // `practice/stories` (above) and `practice/stories/:storyId`;
  // `features/practice/reading/` is a folder of SHARED HOOKS, not a page, and
  // PracticeBreadcrumbs.tsx says so explicitly ("routes are FLAT siblings and
  // nesting them under `practice/reading/…` would be" wrong). The entry sat
  // here rendering the not-found page and the gate never noticed, because
  // `MOBILE_PUBLIC_ONLY=1` in ci.yml skips every authed route. Found by a
  // manual 42-route sweep 2026-08-08.
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
