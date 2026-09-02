#!/usr/bin/env node
// Measure real CSS-px geometry on a mobile surface (touch + insets), so spacing
// and tap-target proposals are justified by getBoundingClientRect, not eyeballed
// off a DSR-3 screenshot. Prints JSON.
//
// Usage: PLAYWRIGHT_BASE_URL=http://localhost:5280 \
//   node scripts/ux-loop/measure.mjs <route> [viewport]
import { chromium } from "@playwright/test";
import fs from "node:fs";
import { VIEWPORTS } from "../../tests/mobile/routes.mjs";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5280";
const AUTH = ".auth/user.json";
const SETTINGS_KEY = "open-lingo-settings";
const [route, vpName = "iphone-se"] = process.argv.slice(2);
const vp = VIEWPORTS.find((v) => v.name === vpName);
const lang = /^\/([a-z]{2})\//.exec(route)?.[1] ?? "ja";

// Same gap `tests/mobile/_seed.ts` documents: the dev-auth-bypass user has
// no unlocked atoms and no subscribed decks, so `/practice/flashcards/review`
// renders its `!queue` empty state and there is no session to measure. Same
// fix, same ids as `scripts/capture-flashcards.mjs`'s desktop-parity capture
// (JA) — mark a handful of M1 vocab atoms unlocked so the course-deck
// injection has unseen cards to surface. Also pre-clear the first-time
// onboarding gate (`FLASHCARDS_ONBOARDING_STORAGE_KEY`) so its "Got it, let's
// start" modal — a PRE-EXISTING surface, unrelated to Wave B, confirmed
// broken at 2 viewports by the mobile gate once seeded (2026-09-02) — doesn't
// get measured as if it were the review session's own geometry.
const IS_FLASHCARDS_REVIEW = /\/practice\/flashcards\/review$/.test(route);
const JA_FLASHCARDS_SEED_ATOMS = [
  "ai", "uma", "kai", "kao", "kame", "kinoko", "sakura", "tsuki", "fune",
  "hoshi", "momo", "ue", "hito", "nani", "koe", "ie", "yama", "kawa", "asa",
  "uta", "ike", "umi", "inu", "neko",
];
const KO_FLASHCARDS_SEED_ATOMS = [
  "ko:아이", "ko:오이", "ko:고기", "ko:아기", "ko:거기", "ko:나", "ko:너",
  "ko:누구", "ko:어머니", "ko:나무",
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: vp.width, height: vp.height },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  ...(fs.existsSync(AUTH) ? { storageState: AUTH } : {}),
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: vp.insets });
await page.addInitScript(
  ({ key, langId, seedFlashcards, atoms }) => {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.learning = { learningLanguageId: langId, uiLocale: "en", showRomaji: true, ftueArcSeen: true };
      window.localStorage.setItem(key, JSON.stringify(parsed));
      window.localStorage.setItem(`lingo_placement_dismissed_v2_${langId}`, "1");
      window.localStorage.setItem("open-lingo-cookie-consent", JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-01-01T00:00:00.000Z" }));
      window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
      if (seedFlashcards) {
        window.localStorage.setItem("lingo:unlocked-atoms", JSON.stringify(atoms));
        window.localStorage.setItem("lingo_flashcards_onboarding_v1", "1");
      }
    } catch {}
  },
  {
    key: SETTINGS_KEY,
    langId: lang,
    seedFlashcards: IS_FLASHCARDS_REVIEW,
    atoms: lang === "ko" ? KO_FLASHCARDS_SEED_ATOMS : JA_FLASHCARDS_SEED_ATOMS,
  },
);
await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
await page.waitForTimeout(Number(process.env.WAIT_MS ?? 2600));
if (IS_FLASHCARDS_REVIEW) {
  // The queue itself gates behind a react-query retry (~1-2s past the flat
  // wait above under the bypass build's offline short-circuit) — see the
  // matching comment in `tests/mobile/_seed.ts`. Give it a real chance to
  // resolve rather than measuring mid-"Loading…".
  await page
    .waitForFunction(
      () => {
        // An unhydrated/pre-paint body is also "" and must NOT read as
        // resolved (Task 8, 2026-09-02).
        const t = document.body.innerText.trim();
        return t.length > 0 && !/Loading…?$/.test(t);
      },
      undefined,
      { timeout: 10_000 },
    )
    .catch(() => {});
}

const out = await page.evaluate((vh) => {
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) };
  };
  const txt = (el) => (el.textContent || "").trim().slice(0, 24);
  // Tap targets: every button / link, flag those under 24x24.
  const smalls = [];
  for (const el of document.querySelectorAll('button, a[href], [role="button"]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.width < 24 || r.height < 24) smalls.push({ label: txt(el), w: Math.round(r.width), h: Math.round(r.height) });
  }
  // CTA fold check: any element that looks like the primary CTA.
  const cta = [...document.querySelectorAll("button")].find((b) => /check|continue/i.test(b.textContent || ""));
  const doc = document.scrollingElement || document.documentElement;
  return {
    viewportH: vh,
    smallTapTargets: smalls,
    cta: cta ? { ...rect(cta), belowFold: cta.getBoundingClientRect().bottom > vh } : null,
    pageScrollHeight: doc.scrollHeight,
    pageClientHeight: doc.clientHeight,
    horizontalOverflow: doc.scrollWidth > doc.clientWidth + 1,
  };
}, vp.height);

console.log(JSON.stringify({ route, viewport: vpName, ...out }, null, 2));
await browser.close();
