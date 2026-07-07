#!/usr/bin/env node
// Interactive-state capture for the UI review: lesson player staged/correct/wrong
// feedback states, replay pass, completion screen. Clicks through like a user.
// Usage: node scripts/capture-states.mjs <outDir> [width] [height]
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const SETTINGS_KEY = "open-lingo-settings";
const outDir = process.argv[2];
const width = Number(process.argv[3] ?? 390);
const height = Number(process.argv[4] ?? 844);
const vp = width < 800 ? "mobile" : "desktop";
if (!outDir) { console.error("usage: capture-states.mjs <outDir> [w] [h]"); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height } });
const page = await ctx.newPage();

await page.addInitScript(({ key }) => {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.learning = {
      learningLanguageId: "ja", uiLocale: "en",
      showAlphabetRomanization: true, showAlphabetFurigana: true,
      showRomaji: true, ftueArcSeen: true,
    };
    window.localStorage.setItem(key, JSON.stringify(parsed));
    window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
    window.localStorage.setItem("open-lingo-cookie-consent",
      JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-01-01T00:00:00.000Z" }));
  } catch {}
}, { key: SETTINGS_KEY });

const dismissFtue = async () => {
  const skip = page.getByRole("button", { name: /^skip$/i });
  try {
    if (await skip.count()) { await skip.first().click({ timeout: 3000 }); await page.waitForTimeout(400); }
  } catch {}
};

const shot = async (name) => {
  const file = path.join(outDir, `${name}--${vp}.png`);
  await page.screenshot({ path: file });
  console.log(file);
};

// ---- Lesson player states (ja-m4-1-1) ----
await page.goto(`${BASE}/ja/learn/lessons/ja-m4-1-1?step=1`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await dismissFtue();

// Token-tap step: tap one tile -> staged state
const tiles = page.locator("button", { hasText: "ペ" });
if (await tiles.count()) {
  await tiles.first().click();
  await page.waitForTimeout(300);
  await shot("lesson-tokentap-staged");
  // Check with just the right token (pen -> ペン should be correct alone)
  const check = page.getByRole("button", { name: /check/i });
  if (await check.count()) {
    await check.first().click();
    await page.waitForTimeout(500);
    await shot("lesson-feedback-after-check");
    const cont = page.getByRole("button", { name: /continue|got it|next/i });
    if (await cont.count()) { await cont.first().click(); await page.waitForTimeout(500); await shot("lesson-after-continue"); }
  }
}

// Wrong answer state: reload step 1, tap a wrong tile, check
await page.goto(`${BASE}/ja/learn/lessons/ja-m4-1-1?step=1`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await dismissFtue();
const wrongTile = page.locator("button", { hasText: "み" });
if (await wrongTile.count()) {
  await wrongTile.first().click();
  await page.waitForTimeout(200);
  const check2 = page.getByRole("button", { name: /check/i });
  if (await check2.count()) {
    await check2.first().click();
    await page.waitForTimeout(500);
    await shot("lesson-feedback-wrong");
  }
}

// ---- MCQ step (find one in ja-m4-1-1; step ids suggest mcq-sentence around 4-6) ----
for (const s of [5, 6, 7, 8]) {
  await page.goto(`${BASE}/ja/learn/lessons/ja-m4-1-1?step=${s}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await dismissFtue();
  const opts = page.locator("main button");
  const n = await opts.count();
  if (n >= 3) { await shot(`lesson-step${s}`); }
}

// ---- Grammar review session (may be empty state) ----
await page.goto(`${BASE}/ja/practice/grammar/review`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await shot("grammar-review-entry");

await browser.close();
