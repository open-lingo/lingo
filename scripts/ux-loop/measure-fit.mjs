#!/usr/bin/env node
// Fit budget for lesson steps: how much each region of a step costs against
// the stage scroller's height, per route × viewport. Numbers, not opinions —
// the input to any "make it fit" change.
//
//   PLAYWRIGHT_BASE_URL=http://localhost:5390 node scripts/ux-loop/measure-fit.mjs routes.json iphone-14-promax,iphone-13,iphone-se
import { chromium } from "@playwright/test";
import fs from "node:fs";
import { VIEWPORTS } from "../../tests/mobile/routes.mjs";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5390";
const routes = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const vps = (process.argv[3] ?? "iphone-14-promax").split(",").map((n) => VIEWPORTS.find((v) => v.name === n));
const SETTINGS_KEY = "open-lingo-settings";

const browser = await chromium.launch();
const rows = [];
for (const vp of vps) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  for (const r of routes) {
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: vp.insets });
    const lang = /^\/([a-z]{2})\//.exec(r.route)?.[1] ?? "ja";
    await page.addInitScript(({ key, langId }) => {
      try {
        const raw = localStorage.getItem(key); const parsed = raw ? JSON.parse(raw) : {};
        parsed.learning = { learningLanguageId: langId, uiLocale: "en", showAlphabetRomanization: true, showAlphabetFurigana: true, showRomaji: true, ftueArcSeen: true };
        parsed.appearance = { ...(parsed.appearance ?? {}), themeId: "dark" };
        localStorage.setItem(key, JSON.stringify(parsed));
        localStorage.setItem(`lingo_placement_dismissed_v2_${langId}`, "1");
        localStorage.setItem("open-lingo-cookie-consent", JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-01-01T00:00:00.000Z" }));
        sessionStorage.setItem("open-lingo-funding-collapsed", "1");
      } catch {}
    }, { key: SETTINGS_KEY, langId: lang });
    try {
      await page.goto(`${BASE}${r.route}`, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(1200);
      const m = await page.evaluate(() => {
        const stage = document.querySelector("[data-lesson-stage]");
        if (!stage) return { error: "no stage" };
        const scroller = stage.parentElement;
        const h = (el) => (el ? Math.round(el.getBoundingClientRect().height) : null);
        const cta = stage.querySelector('[data-testid="primary-cta"]');
        const tray = stage.querySelector(".border-dashed");
        const h2 = stage.querySelector("h2");
        const bank = tray ? tray.parentElement?.querySelector(":scope > .flex-wrap:last-child") ?? null : null;
        const grid = stage.querySelector(".grid");
        const tiles = [...stage.querySelectorAll("button")].filter((b) => !cta?.contains(b));
        const tile = tiles[Math.min(2, tiles.length - 1)];
        const tileFont = tile ? getComputedStyle(tile).fontSize : null;
        const view = scroller.clientHeight;
        const content = scroller.scrollHeight;
        // bottom of the last non-CTA element vs the top of the sticky CTA
        const last = [...stage.children].filter((c) => c !== cta).at(-1);
        const hidden = last && cta ? Math.round(last.getBoundingClientRect().bottom - cta.getBoundingClientRect().top) : null;
        return {
          scroller: view, content, overflow: content - view,
          prompt: h(h2), tray: h(tray), bank: h(bank), grid: h(grid), cta: h(cta),
          tiles: tiles.length, tile: h(tile), tileFont, hiddenUnderCta: hidden,
        };
      });
      rows.push({ vp: vp.name, label: r.label, ...m });
      console.log([vp.name, r.label, `ovf=${m.overflow}`, `under=${m.hiddenUnderCta}`, `view=${m.scroller}`, `prompt=${m.prompt}`, `tray=${m.tray}`, `bank=${m.bank}`, `grid=${m.grid}`, `cta=${m.cta}`, `tiles=${m.tiles}@${m.tile}px/${m.tileFont}`].join("\t"));
    } catch (e) {
      console.log(vp.name, r.label, "FAIL", String(e).slice(0, 120));
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(process.argv[4] ?? "artifacts/ux-loop/fit.json", JSON.stringify(rows, null, 1));
