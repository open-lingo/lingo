#!/usr/bin/env node
// Usage: node scripts/shot.mjs <path-or-url> [width] [height] [--full] [--lang=<id>] [--no-lang] [--guest]
// Examples:
//   node scripts/shot.mjs /landing
//   node scripts/shot.mjs /home 1440 900
//   node scripts/shot.mjs /en/community/explore --full
//   node scripts/shot.mjs /home --lang=ja
//   node scripts/shot.mjs /home --no-lang        # see first-time language picker modal
//   node scripts/shot.mjs /landing --guest       # see the page as a logged-out visitor
//
// Loads .auth/user.json if present so authed pages render correctly.
// Pass --guest to render as a logged-out visitor (skips storage state entirely).
// Injects a learningLanguageId into localStorage before navigation so the
// first-time LanguagePickerModal doesn't block authed home/lang pages.
// Pass --no-lang to keep the modal (e.g. when debugging the picker itself).
//
// Output: /tmp/shot.png (overwritten each run).

import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const AUTH = ".auth/user.json";
const OUT = "/tmp/shot.png";
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
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT, fullPage: full });
  console.log(path.resolve(OUT));
} finally {
  await browser.close();
}
