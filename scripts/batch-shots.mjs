#!/usr/bin/env node
// Batch screenshot sweep for the UI review. Based on scripts/shot.mjs seeding.
// Usage: node batch-shots.mjs <outDir> [--only=name1,name2]
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const SETTINGS_KEY = "open-lingo-settings";
const outDir = process.argv[2];
if (!outDir) { console.error("usage: node batch-shots.mjs <outDir>"); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? new Set(onlyArg.slice(7).split(",")) : null;

// [name, path, opts] — opts: {guest, full, noLang}
const PAGES = [
  ["landing", "/landing", { guest: true, full: true }],
  ["get-started", "/get-started", { guest: true }],
  ["home", "/home", {}],
  ["learn", "/ja/learn", {}],
  ["course-map", "/ja/learn/course", {}],
  ["lesson-s0", "/ja/learn/lessons/ja-m4-1-1?step=0", {}],
  ["lesson-s1", "/ja/learn/lessons/ja-m4-1-1?step=1", {}],
  ["lesson-s2", "/ja/learn/lessons/ja-m4-1-1?step=2", {}],
  ["lesson-s4", "/ja/learn/lessons/ja-m4-1-1?step=4", {}],
  ["lesson-s6", "/ja/learn/lessons/ja-m4-1-1?step=6", {}],
  ["lesson-m6-s0", "/ja/learn/lessons/ja-m6-1-1?step=0", {}],
  ["lesson-m6-s3", "/ja/learn/lessons/ja-m6-1-1?step=3", {}],
  ["practice-hub", "/ja/practice", {}],
  ["practice-grammar", "/ja/practice/grammar", {}],
  ["grammar-review", "/ja/practice/grammar/review", {}],
  ["flashcards", "/ja/practice/flashcards", {}],
  ["flashcards-review", "/ja/practice/flashcards/review", {}],
  ["flashcards-cards", "/ja/practice/flashcards/cards", {}],
  ["flashcards-decks", "/ja/practice/flashcards/decks", {}],
  ["stories", "/ja/practice/stories", {}],
  ["alphabet-hub", "/ja/practice/alphabet", {}],
  ["alphabet-hiragana", "/ja/practice/alphabet/hiragana", {}],
  ["kanji", "/ja/practice/kanji", {}],
  ["journey", "/ja/practice/journey", {}],
  ["vocab", "/ja/vocab", {}],
  ["settings", "/settings", {}],
  ["community", "/ja/community/explore", {}],
  ["discuss", "/ja/community/discuss", {}],
  ["leaderboard", "/ja/community/leaderboard", {}],
  ["social", "/ja/social", {}],
  ["shop", "/ja/shop", {}],
];

const VIEWPORTS = [
  ["mobile", 390, 844],
  ["desktop", 1440, 900],
];

const browser = await chromium.launch();
for (const [vpName, width, height] of VIEWPORTS) {
  for (const [name, route, opts = {}] of PAGES) {
    if (only && !only.has(name)) continue;
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    try {
      if (!opts.noLang && !opts.guest) {
        await page.addInitScript(({ key }) => {
          try {
            const raw = window.localStorage.getItem(key);
            const parsed = raw ? JSON.parse(raw) : {};
            parsed.learning = {
              learningLanguageId: "ja",
              uiLocale: parsed.learning?.uiLocale ?? "en",
              showAlphabetRomanization: true,
              showAlphabetFurigana: true,
              showRomaji: true,
              ftueArcSeen: true,
            };
            window.localStorage.setItem(key, JSON.stringify(parsed));
          } catch {}
        }, { key: SETTINGS_KEY });
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
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(600);
      const file = path.join(outDir, `${name}--${vpName}.png`);
      await page.screenshot({ path: file, fullPage: !!opts.full });
      console.log(file);
    } catch (e) {
      console.error(`FAIL ${name}--${vpName}: ${e.message.split("\n")[0]}`);
    } finally {
      await ctx.close();
    }
  }
}
await browser.close();
