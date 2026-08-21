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
  ({ key, langId }) => {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.learning = { learningLanguageId: langId, uiLocale: "en", showRomaji: true, ftueArcSeen: true };
      window.localStorage.setItem(key, JSON.stringify(parsed));
      window.localStorage.setItem(`lingo_placement_dismissed_v2_${langId}`, "1");
      window.localStorage.setItem("open-lingo-cookie-consent", JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-01-01T00:00:00.000Z" }));
      window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
    } catch {}
  },
  { key: SETTINGS_KEY, langId: lang },
);
await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
await page.waitForTimeout(Number(process.env.WAIT_MS ?? 2600));

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
