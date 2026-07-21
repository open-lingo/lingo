#!/usr/bin/env node
// Layer B of the mobile render pipeline (research §6): a visual sweep across the
// VIEWPORTS × ROUTES matrix. Generalizes scripts/batch-shots.mjs but:
//   - passes storageState: ".auth/user.json" (per shot.mjs:52) so authed routes
//     actually render authed (batch-shots.mjs omits this);
//   - uses the §6 mobile viewport matrix;
//   - writes <route-slug>--<viewport>.png;
//   - runs the assertion-1 overflow check per shot and prints PASS/FAIL,
//     exiting non-zero if any shot overflowed (so it can gate too).
//
// Usage:
//   node scripts/mobile-matrix.mjs [outDir] [--public-only] [--only=slug1,slug2]
//   PLAYWRIGHT_BASE_URL=http://localhost:5199 node scripts/mobile-matrix.mjs
//
// Route/viewport arrays mirror tests/mobile/_matrix.ts — keep them in sync.

import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const AUTH = ".auth/user.json";
const SETTINGS_KEY = "open-lingo-settings";
const EPS = 1;

const args = process.argv.slice(2);
const publicOnly = args.includes("--public-only") || process.env.MOBILE_PUBLIC_ONLY === "1";
const onlyArg = args.find((a) => a.startsWith("--only="));
const only = onlyArg ? new Set(onlyArg.slice(7).split(",")) : null;
const outDir = args.find((a) => !a.startsWith("--")) ?? "mobile-shots";
fs.mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  ["android-small", 360, 640],
  ["iphone-se", 375, 667],
  ["pixel-7", 412, 915],
  ["iphone-14-promax", 430, 932],
  ["tablet-portrait", 768, 1024],
];

// { path, auth, lang }
const PUBLIC_ROUTES = [
  { path: "/landing", auth: false, lang: null },
  { path: "/get-started", auth: false, lang: null },
  { path: "/try", auth: false, lang: "ja" },
  { path: "/login", auth: false, lang: null },
  { path: "/about", auth: false, lang: null },
];

const AUTHED_ROUTES = [
  { path: "/home", auth: true, lang: "ja" },
  { path: "/settings", auth: true, lang: "ja" },
  { path: "/ja/learn", auth: true, lang: "ja" },
  { path: "/ja/learn/course", auth: true, lang: "ja" },
  { path: "/ja/learn/lessons/ja-m4-1-1?step=0", auth: true, lang: "ja" },
  { path: "/ja/learn/lessons/ja-m4-1-1?step=2", auth: true, lang: "ja" },
  { path: "/ja/learn/lessons/ja-m4-1-1?step=6", auth: true, lang: "ja" },
  { path: "/ja/learn/placement-test", auth: true, lang: "ja" },
  { path: "/ja/practice", auth: true, lang: "ja" },
  { path: "/ja/practice/grammar", auth: true, lang: "ja" },
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
  { path: "/ja/vocab", auth: true, lang: "ja" },
  { path: "/ja/shop", auth: true, lang: "ja" },
  { path: "/ja/community/explore", auth: true, lang: "ja" },
  { path: "/ja/community/leaderboard", auth: true, lang: "ja" },
  { path: "/ja/social", auth: true, lang: "ja" },
  { path: "/ko/learn", auth: true, lang: "ko" },
  { path: "/ko/practice", auth: true, lang: "ko" },
  { path: "/ko/community/leaderboard", auth: true, lang: "ko" },
];

const ROUTES = publicOnly ? PUBLIC_ROUTES : [...PUBLIC_ROUTES, ...AUTHED_ROUTES];

function slug(p) {
  return (
    p
      .replace(/^\//, "")
      .replace(/\?.*$/, (q) => q.replace(/[?=&]/g, "-"))
      .replace(/\//g, "-")
      .replace(/[^a-z0-9-]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/-$/, "") || "root"
  );
}

const hasAuth = fs.existsSync(AUTH);
if (!publicOnly && !hasAuth) {
  console.warn(`[mobile-matrix] ${AUTH} missing — authed routes will bounce to /landing.`);
}

async function seed(page, route) {
  if (route.lang) {
    await page.addInitScript(
      ({ key, langId }) => {
        try {
          const raw = window.localStorage.getItem(key);
          const parsed = raw ? JSON.parse(raw) : {};
          parsed.learning = {
            learningLanguageId: langId,
            uiLocale: parsed.learning?.uiLocale ?? "en",
            showAlphabetRomanization: parsed.learning?.showAlphabetRomanization ?? true,
            showAlphabetFurigana: parsed.learning?.showAlphabetFurigana ?? true,
            showRomaji: parsed.learning?.showRomaji ?? true,
            ftueArcSeen: true,
          };
          window.localStorage.setItem(key, JSON.stringify(parsed));
        } catch {}
      },
      { key: SETTINGS_KEY, langId: route.lang },
    );
  }
  await page.addInitScript(() => {
    try {
      window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
      window.localStorage.setItem(
        "open-lingo-cookie-consent",
        JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-01-01T00:00:00.000Z" }),
      );
    } catch {}
  });
}

const browser = await chromium.launch();
let anyOverflow = false;
let anyError = false;

for (const [vpName, width, height] of VIEWPORTS) {
  for (const route of ROUTES) {
    const routeSlug = slug(route.path);
    if (only && !only.has(routeSlug)) continue;
    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      ...(hasAuth ? { storageState: AUTH } : {}),
    });
    const page = await ctx.newPage();
    try {
      await seed(page, route);
      await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(600);
      const o = await page.evaluate((eps) => {
        const el = document.scrollingElement || document.documentElement;
        return { sw: el.scrollWidth, cw: el.clientWidth, overflow: el.scrollWidth > el.clientWidth + eps };
      }, EPS);
      const file = path.join(outDir, `${routeSlug}--${vpName}.png`);
      await page.screenshot({ path: file, fullPage: true });
      if (o.overflow) {
        anyOverflow = true;
        console.log(`FAIL ${routeSlug}--${vpName}  overflow sw=${o.sw} cw=${o.cw}  ->  ${file}`);
      } else {
        console.log(`PASS ${routeSlug}--${vpName}  ->  ${file}`);
      }
    } catch (e) {
      anyError = true;
      console.error(`ERROR ${routeSlug}--${vpName}: ${e.message.split("\n")[0]}`);
    } finally {
      await ctx.close();
    }
  }
}
await browser.close();

if (anyOverflow) console.error("\nOverflow detected in one or more shots.");
if (anyError) console.error("One or more routes errored during the sweep.");
process.exit(anyOverflow || anyError ? 1 : 0);
