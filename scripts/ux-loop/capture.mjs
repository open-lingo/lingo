#!/usr/bin/env node
// Faithful mobile capture for the UX-improvement loop.
//
// mobile-matrix.mjs is a quick visual sweep but is NOT device-faithful: it sets
// only the viewport size — no safe-area insets, no touch/coarse-pointer, no
// placement-modal seed. On a real phone those three change the layout (Dynamic
// Island overlap, the touch-only forced-map with no Path/List toggle, no
// placement prompt for a returning learner). This script closes all three so
// the "before" screenshots match what Spencer actually sees on the 15 Pro Max.
//
//   - safe-area insets  -> Emulation.setSafeAreaInsetsOverride (per tests/mobile/_seed.ts)
//   - touch device      -> newContext({ isMobile, hasTouch }) so (pointer:coarse) matches
//   - seeds             -> lang+ftue, funding-collapsed, cookie-consent, placement-dismissed
//
// Usage:
//   PLAYWRIGHT_BASE_URL=http://localhost:5280 \
//     node scripts/ux-loop/capture.mjs <outDir> <label> <route> [viewport]
//
// viewport defaults to iphone-14-promax (430x932, the actual test device).
// Writes <outDir>/<label>--<viewport>.png (viewport-clipped, what the eye sees
// on open) and <outDir>/<label>--<viewport>--full.png (whole scroll height).

import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { VIEWPORTS } from "../../tests/mobile/routes.mjs";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5280";
const AUTH = ".auth/user.json";
const SETTINGS_KEY = "open-lingo-settings";

const [outDir, label, route, vpName = "iphone-14-promax"] = process.argv.slice(2);
if (!outDir || !label || !route) {
  console.error("usage: node scripts/ux-loop/capture.mjs <outDir> <label> <route> [viewport]");
  process.exit(1);
}
const vp = VIEWPORTS.find((v) => v.name === vpName);
if (!vp) {
  console.error(`unknown viewport ${vpName}; known: ${VIEWPORTS.map((v) => v.name).join(", ")}`);
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const lang = /^\/([a-z]{2})\//.exec(route)?.[1] ?? "ja";
const hasAuth = fs.existsSync(AUTH);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: vp.width, height: vp.height },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  ...(hasAuth ? { storageState: AUTH } : {}),
});
const page = await ctx.newPage();

// Insets must be pushed over CDP BEFORE first paint, exactly like the gate.
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: vp.insets });

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
      window.localStorage.setItem(`lingo_placement_dismissed_v2_${langId}`, "1");
      window.localStorage.setItem(
        "open-lingo-cookie-consent",
        JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-01-01T00:00:00.000Z" }),
      );
      window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
    } catch {
      /* page may not be same-origin yet */
    }
  },
  { key: SETTINGS_KEY, langId: lang },
);

try {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
  await page
    .waitForFunction(() => !!document.querySelector('a[href], button, input, [role="button"]'), undefined, {
      timeout: 15_000,
    })
    .catch(() => {});
  // Lesson routes fire a start-wipe transition; a short settle catches it
  // mid-flight (offset content + mascot). Override with WAIT_MS for those.
  await page.waitForTimeout(Number(process.env.WAIT_MS ?? 700));

  // Round-trip check: did env() actually resolve to our insets? A silent zero
  // means the capture is lying about the notch, same failure the gate guards.
  const gotTop = await page.evaluate(() => {
    const p = document.createElement("div");
    p.style.cssText = "position:fixed;top:0;padding-top:env(safe-area-inset-top)";
    document.body.appendChild(p);
    const v = Math.round(parseFloat(getComputedStyle(p).paddingTop) || 0);
    p.remove();
    return v;
  });
  if (gotTop !== vp.insets.top) {
    console.error(`WARN inset round-trip: env(top)=${gotTop} expected ${vp.insets.top}`);
  }

  const viewShot = path.join(outDir, `${label}--${vpName}.png`);
  const fullShot = path.join(outDir, `${label}--${vpName}--full.png`);
  await page.screenshot({ path: viewShot, fullPage: false });
  await page.screenshot({ path: fullShot, fullPage: true });
  console.log(`OK ${label} ${route} @ ${vpName} (${vp.width}x${vp.height}, insets ${JSON.stringify(vp.insets)})`);
  console.log(viewShot);
  console.log(fullShot);
} finally {
  await browser.close();
}
