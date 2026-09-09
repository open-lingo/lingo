#!/usr/bin/env node
// Usage: node scripts/shot.mjs <path-or-url> [width] [height] [--full] [--lang=<id>] [--no-lang] [--guest] [--touch] [--click=<selector>]
// Examples:
//   node scripts/shot.mjs /landing
//   node scripts/shot.mjs /home 1440 900
//   node scripts/shot.mjs /en/community/explore --full
//   node scripts/shot.mjs /home --lang=ja
//   node scripts/shot.mjs /home --no-lang        # see first-time language picker modal
//   node scripts/shot.mjs /landing --guest       # see the page as a logged-out visitor
//   node scripts/shot.mjs /ja/learn 390 844 --guest --touch --click=".lingo-node-disc"
//
// Loads .auth/user.json if present so authed pages render correctly.
// Pass --guest to render as a logged-out visitor (skips storage state entirely).
// Injects a learningLanguageId into localStorage before navigation so the
// first-time LanguagePickerModal doesn't block authed home/lang pages.
// Pass --no-lang to keep the modal (e.g. when debugging the picker itself).
// Pass --touch to emulate a coarse-pointer/touch context (mobile UI branches
// that key off `hasCoarsePointer()` render differently under plain desktop
// Chromium emulation without this).
// Pass --click=<selector> to click an element (after the extra wait) before
// the screenshot is taken — e.g. to open a modal triggered by a tap.
//
// Output: /tmp/shot.png (overwritten each run).

import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const AUTH = ".auth/user.json";
const OUT = process.env.SHOT_OUT ?? "/tmp/shot.png";
const SETTINGS_KEY = "open-lingo-settings";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "usage: node scripts/shot.mjs <path-or-url> [width] [height] [--full] [--lang=<id>] [--no-lang]",
  );
  process.exit(1);
}

const target = args[0];
const full = args.includes("--full");
const guest = args.includes("--guest");
const noLang = args.includes("--no-lang");
const touch = args.includes("--touch");
// Repeatable: --click=<selector> may be passed more than once to click a
// sequence of elements in order (e.g. dismiss a modal, then open another).
// Each click gets its own timeout; a selector that never appears is skipped
// with a warning rather than aborting the whole shot.
const clickSelectors = args
  .filter((a) => a.startsWith("--click="))
  .map((a) => a.slice("--click=".length));
const langArg = args.find((a) => a.startsWith("--lang="));
const lang = noLang ? null : langArg ? langArg.slice("--lang=".length) : "ko";
const numeric = args.filter((a) => /^\d+$/.test(a)).map(Number);
const width = numeric[0] ?? 1440;
const height = numeric[1] ?? 900;
const url = target.startsWith("http")
  ? target
  : `${BASE}${target.startsWith("/") ? "" : "/"}${target}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width, height },
  ...(touch ? { hasTouch: true, isMobile: true } : {}),
  ...(!guest && fs.existsSync(AUTH) ? { storageState: AUTH } : {}),
});
const page = await ctx.newPage();
try {
  // Set localStorage BEFORE navigation so first-render reads our values.
  if (lang) {
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
            // Preserve showRomaji (defaults on, per settings/types.ts) — the
            // prior wholesale replace dropped it, silently forcing romaji OFF
            // in every screenshot and misrepresenting the real default.
            showRomaji: parsed.learning?.showRomaji ?? true,
            // Screenshots are never a brand-new user's first session — keep
            // the FirstSessionArc survey modal from covering the page.
            ftueArcSeen: true,
          };
          window.localStorage.setItem(key, JSON.stringify(parsed));
        } catch {
          /* ignore — page may not be same-origin yet */
        }
      },
      { key: SETTINGS_KEY, langId: lang },
    );
  }
  // Pre-collapse the funding panel — it's persistent UX, but during
  // screenshot debugging it covers top-right page content.
  await page.addInitScript(() => {
    try {
      window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
  // --wait=<ms>: lesson routes cold-compile a large curriculum chunk in dev,
  // so networkidle can fire while the shell still shows the loading mascot.
  const extraWait = Number(process.argv.find((a) => a.startsWith("--wait="))?.slice(7) ?? 500);
  await page.waitForTimeout(extraWait);
  for (const sel of clickSelectors) {
    try {
      await page.click(sel, { timeout: 5000 });
      await page.waitForTimeout(400);
    } catch {
      console.warn(`--click selector never appeared, skipping: ${sel}`);
    }
  }
  await page.screenshot({ path: OUT, fullPage: full });
  console.log(path.resolve(OUT));
} finally {
  await browser.close();
}
