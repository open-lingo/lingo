#!/usr/bin/env node
// Find real overflow offenders on mobile: elements that spill past the right
// edge of the viewport, or that overflow their own box. Touch + insets applied.
// Prints the worst offenders per route/viewport with an identifying label.
//
// Usage: PLAYWRIGHT_BASE_URL=http://localhost:5280 \
//   node scripts/ux-loop/overflow-scan.mjs
import { chromium } from "@playwright/test";
import fs from "node:fs";
import { VIEWPORTS } from "../../tests/mobile/routes.mjs";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5280";
const AUTH = ".auth/user.json";
const SETTINGS_KEY = "open-lingo-settings";
const ROUTES = [
  { label: "home", path: "/home" },
  { label: "learn", path: "/ja/learn" },
  { label: "practice", path: "/ja/practice" },
  { label: "shop", path: "/ja/shop" },
  { label: "vocab", path: "/ja/vocab" },
];
const VPS = ["iphone-se", "android-small", "iphone-14-promax"];

const browser = await chromium.launch();
for (const vpName of VPS) {
  const vp = VIEWPORTS.find((v) => v.name === vpName);
  for (const route of ROUTES) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      ...(fs.existsSync(AUTH) ? { storageState: AUTH } : {}),
    });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: vp.insets });
    await page.addInitScript(
      ({ key }) => {
        try {
          const j = JSON.parse(localStorage.getItem(key) || "{}");
          j.learning = { learningLanguageId: "ja", uiLocale: "en", showRomaji: true, ftueArcSeen: true };
          localStorage.setItem(key, JSON.stringify(j));
          localStorage.setItem("lingo_placement_dismissed_v2_ja", "1");
          localStorage.setItem("open-lingo-cookie-consent", JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-01-01T00:00:00.000Z" }));
          sessionStorage.setItem("open-lingo-funding-collapsed", "1");
        } catch {}
      },
      { key: SETTINGS_KEY },
    );
    try {
      await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForFunction(() => !!document.querySelector('a[href], button'), undefined, { timeout: 12000 }).catch(() => {});
      await page.waitForTimeout(700);
      const res = await page.evaluate((vw) => {
        const label = (el) => {
          const cls = (el.className && typeof el.className === "string") ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
          const txt = (el.textContent || "").trim().slice(0, 26).replace(/\s+/g, " ");
          return `${el.tagName.toLowerCase()}${cls} "${txt}"`;
        };
        const doc = document.scrollingElement || document.documentElement;
        const pageOverflow = doc.scrollWidth - doc.clientWidth;
        const offRight = [];
        const selfOverflow = [];
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.right > vw + 1.5) offRight.push({ l: label(el), right: Math.round(r.right), w: Math.round(r.width) });
          // narrow text column forced to wrap hard: scrollWidth well over clientWidth
          if (el.scrollWidth - el.clientWidth > 4 && el.clientWidth > 0 && getComputedStyle(el).overflowX !== "auto" && getComputedStyle(el).overflowX !== "scroll") {
            selfOverflow.push({ l: label(el), over: el.scrollWidth - el.clientWidth, cw: el.clientWidth });
          }
        }
        // dedupe + keep worst 6
        const top = (arr, key) => arr.sort((a, b) => b[key] - a[key]).slice(0, 6);
        return { pageOverflow, offRight: top(offRight, "right"), selfOverflow: top(selfOverflow, "over") };
      }, vp.width);

      const flags = [];
      if (res.pageOverflow > 1) flags.push(`PAGE +${res.pageOverflow}px`);
      if (res.offRight.length) flags.push(`${res.offRight.length} off-right`);
      if (res.selfOverflow.length) flags.push(`${res.selfOverflow.length} self-overflow`);
      console.log(`\n[${vpName} ${vp.width}px] ${route.label} ${flags.length ? "⚠ " + flags.join(", ") : "clean"}`);
      for (const o of res.offRight) console.log(`   off-right → right=${o.right} w=${o.w}  ${o.l}`);
      for (const o of res.selfOverflow) console.log(`   self-overflow +${o.over}px (cw=${o.cw})  ${o.l}`);
    } catch (e) {
      console.log(`\n[${vpName}] ${route.label} ERROR: ${e.message.split("\n")[0]}`);
    } finally {
      await ctx.close();
    }
  }
}
await browser.close();
