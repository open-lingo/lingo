#!/usr/bin/env node
/**
 * Design-review capture harness.
 * Captures every learner-facing UI page + every lesson step type, in light & dark.
 * Uses VITE_DEV_AUTH_BYPASS dev server (logged-in dev user "Trevor").
 *
 * Output: design-review/pages/<name>__<theme>.png
 *         design-review/lesson-steps/<type>__<theme>.png
 *         design-review/INDEX.md  (manifest)
 *
 * Usage: node scripts/capture-design-review.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:5173";
const LANG = "ja";
const OUT = "design-review";
const THEMES = ["light", "dark"];
const VIEWPORT = { width: 1440, height: 900 };

// Learner-facing pages. {name, path, full?} — full=true → fullPage screenshot.
const PAGES = [
  // top-level / marketing
  { name: "landing", path: "/landing", full: true },
  { name: "home", path: "/home", full: true },
  { name: "about", path: "/about", full: true },
  { name: "get-started", path: "/get-started", full: true },
  { name: "preview-lesson-try", path: "/try" },
  { name: "settings", path: "/settings", full: true },
  // learn cluster
  { name: "learn", path: `/${LANG}/learn`, full: true },
  { name: "learn-course-map", path: `/${LANG}/learn/course`, full: true },
  { name: "learn-travel-sprint", path: `/${LANG}/learn/travel-sprint`, full: true },
  { name: "learn-placement-test", path: `/${LANG}/learn/placement-test`, full: true },
  // practice cluster
  { name: "practice", path: `/${LANG}/practice`, full: true },
  { name: "practice-progress-journey", path: `/${LANG}/practice/journey`, full: true },
  { name: "practice-grammar", path: `/${LANG}/practice/grammar`, full: true },
  { name: "flashcards", path: `/${LANG}/practice/flashcards`, full: true },
  { name: "flashcards-review", path: `/${LANG}/practice/flashcards/review`, full: true },
  { name: "flashcards-cards", path: `/${LANG}/practice/flashcards/cards`, full: true },
  { name: "flashcards-decks", path: `/${LANG}/practice/flashcards/decks`, full: true },
  { name: "stories", path: `/${LANG}/practice/stories`, full: true },
  { name: "particles", path: `/${LANG}/practice/particles`, full: true },
  { name: "alphabet-hub", path: `/${LANG}/practice/alphabet`, full: true },
  { name: "kanji", path: `/${LANG}/practice/kanji`, full: true },
  { name: "conjugation", path: `/${LANG}/practice/conjugation`, full: true },
  { name: "reading", path: `/${LANG}/practice/reading`, full: true },
  { name: "speaking", path: `/${LANG}/practice/speaking`, full: true },
  { name: "counters", path: `/${LANG}/practice/counters`, full: true },
  { name: "components", path: `/${LANG}/practice/components`, full: true },
  { name: "videos", path: `/${LANG}/practice/videos`, full: true },
  { name: "external-content", path: `/${LANG}/practice/external-content`, full: true },
  // other lang surfaces
  { name: "vocab", path: `/${LANG}/vocab`, full: true },
  { name: "shop", path: `/${LANG}/shop`, full: true },
  { name: "social", path: `/${LANG}/social`, full: true },
  { name: "social-friends", path: `/${LANG}/social/friends`, full: true },
  { name: "messenger", path: `/${LANG}/messenger`, full: true },
  // community cluster
  { name: "community-explore", path: `/${LANG}/community/explore`, full: true },
  { name: "community-browse", path: `/${LANG}/community/browse`, full: true },
  { name: "community-library", path: `/${LANG}/community/library`, full: true },
  { name: "community-contributors", path: `/${LANG}/community/contributors`, full: true },
  { name: "community-contribute", path: `/${LANG}/community/contribute`, full: true },
  { name: "community-discuss", path: `/${LANG}/community/discuss`, full: true },
  { name: "leaderboard", path: `/${LANG}/community/leaderboard`, full: true },
  // profile (dev user nickname "Trevor")
  { name: "profile", path: `/u/Trevor`, full: true },
];

function initScript(theme) {
  return ({ themeId, lang }) => {
    try {
      window.localStorage.setItem(
        "open-lingo-themes",
        JSON.stringify({ activeThemeId: themeId, customThemes: [] }),
      );
      const k = "open-lingo-settings";
      const raw = window.localStorage.getItem(k);
      const o = raw ? JSON.parse(raw) : {};
      o.learning = {
        ...(o.learning ?? {}),
        learningLanguageId: lang,
        uiLocale: o.learning?.uiLocale ?? "en",
        showAlphabetRomanization: o.learning?.showAlphabetRomanization ?? true,
        showAlphabetFurigana: o.learning?.showAlphabetFurigana ?? true,
        // Suppress first-run modals so they don't obstruct page captures.
        onboardingCompleted: true,
        ftueArcSeen: true,
      };
      window.localStorage.setItem(k, JSON.stringify(o));
      window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
      window.localStorage.setItem(`lingo_placement_dismissed_v2_${lang}`, "1");
      window.localStorage.setItem(
        "open-lingo-cookie-consent",
        JSON.stringify({ essential: true, analytics: false, advertising: false }),
      );
    } catch {
      /* ignore */
    }
  };
}

async function detectState(page) {
  const txt = (await page.locator("body").innerText().catch(() => "")) || "";
  if (/Page not found|404/.test(txt.slice(0, 200))) return "404";
  if (/Something went wrong|Reload|error boundary/i.test(txt.slice(0, 200))) return "error";
  if (txt.trim().length < 20) return "blank";
  return "ok";
}

const manifest = [];

const browser = await chromium.launch();
for (const theme of THEMES) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  await ctx.addInitScript(initScript(theme), { themeId: theme, lang: LANG });
  const page = await ctx.newPage();

  // ---- regular pages ----
  for (const p of PAGES) {
    const dir = path.join(OUT, "pages");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${p.name}__${theme}.png`);
    let state = "ok";
    try {
      await page.goto(BASE + p.path, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(600);
      state = await detectState(page);
      await page.screenshot({ path: file, fullPage: !!p.full });
    } catch (e) {
      state = "ERR:" + (e.message || "").slice(0, 50);
      try { await page.screenshot({ path: file }); } catch { /* */ }
    }
    manifest.push({ kind: "page", name: p.name, path: p.path, theme, state, file });
    console.log(`[${theme}] ${p.name} (${p.path}) -> ${state}`);
  }

  // ---- lesson step gallery: full + per-section ----
  const galleryDir = path.join(OUT, "lesson-steps");
  fs.mkdirSync(galleryDir, { recursive: true });
  try {
    await page.goto(BASE + `/${LANG}/lesson-preview`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(800);
    // full gallery
    await page.screenshot({ path: path.join(galleryDir, `_ALL__${theme}.png`), fullPage: true });
    manifest.push({ kind: "gallery", name: "_ALL", theme, state: "ok", file: path.join(galleryDir, `_ALL__${theme}.png`) });
    // per-section
    const sections = page.locator('section[id^="step-"]');
    const count = await sections.count();
    for (let i = 0; i < count; i++) {
      const sec = sections.nth(i);
      const id = (await sec.getAttribute("id")) || `step-${i}`;
      const type = id.replace(/^step-/, "");
      const f = path.join(galleryDir, `${type}__${theme}.png`);
      await sec.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      await sec.screenshot({ path: f });
      manifest.push({ kind: "step", name: type, theme, state: "ok", file: f });
      console.log(`[${theme}] step:${type}`);
    }
  } catch (e) {
    console.log(`[${theme}] GALLERY ERR ${(e.message || "").slice(0, 60)}`);
  }

  await ctx.close();
}
await browser.close();

// write manifest
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
const bad = manifest.filter((m) => m.state && m.state !== "ok");
console.log(`\nDONE. ${manifest.length} captures. ${bad.length} flagged (404/blank/error):`);
for (const b of bad) console.log(`  - ${b.kind} ${b.name} [${b.theme}] ${b.state}`);
