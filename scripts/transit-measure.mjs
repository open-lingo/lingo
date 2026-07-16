// Measurement pass for the transit-map concept page (dev preview).
// For each viewport (mobile / 1080p / 4K) × theme (light / dark):
//   1. no page-level horizontal overflow (map scrolls inside its own panel)
//   2. no overlapping text labels on the network map ([data-tm="label"], zones)
//   3. touch targets ≥ 44px on mobile (line-diagram rows; station hit circles are r=22 by construction)
//   4. district view opens, its labels don't collide, panel fits the viewport
// Screenshots land in the scratchpad. Usage: node scripts/transit-measure.mjs [outDir]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = process.argv[2] ?? "/tmp/transit-shots";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "1080p", width: 1920, height: 1080 },
  { name: "4k", width: 3840, height: 2160 },
];
const THEMES = ["light", "dark"];

let failures = 0;
const report = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

// Pairwise intersection among label rects, ignoring < 3px grazes.
async function labelOverlaps(page, selector) {
  return page.evaluate((sel) => {
    const els = [...document.querySelectorAll(sel)];
    const rects = els
      .map((el) => ({ r: el.getBoundingClientRect(), t: (el.textContent ?? "").trim() }))
      .filter(({ r }) => r.width > 0 && r.height > 0);
    const bad = [];
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i].r, b = rects[j].r;
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w > 3 && h > 3) bad.push(`"${rects[i].t}" × "${rects[j].t}" (${Math.round(w)}×${Math.round(h)}px)`);
      }
    }
    return bad;
  }, selector);
}

const browser = await chromium.launch({ channel: "chromium", headless: true });

for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: theme,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    const tag = `${vp.name}-${theme}`;
    await page.goto(`${BASE}/ja/transit-preview`, { waitUntil: "networkidle" });
    await page.click("text=Essential only", { timeout: 2500 }).catch(() => {});
    await page
      .click('[aria-label="Dismiss"], button:has-text("✕")', { timeout: 1200 })
      .catch(() => {});
    await page.waitForTimeout(3000); // line draw + train ride settle

    // 1. page-level horizontal overflow
    const overflow = await page.evaluate(() => {
      const d = document.documentElement;
      return { sw: d.scrollWidth, cw: d.clientWidth };
    });
    report(overflow.sw <= overflow.cw + 1, `[${tag}] no page h-overflow`, `scrollWidth ${overflow.sw} vs ${overflow.cw}`);

    const isMobile = vp.name === "mobile";
    if (isMobile) {
      // 3. row touch targets
      const rows = await page.$$eval('[data-tm="row"]', (els) =>
        els.map((el) => el.getBoundingClientRect().height),
      );
      const small = rows.filter((h) => h < 44);
      report(rows.length > 0 && small.length === 0, `[${tag}] rows ≥44px`, `${rows.length} rows, ${small.length} small`);
      // open the network map on mobile too, then check labels
      await page.click("text=View network map").catch(() => {});
      await page.waitForTimeout(3000);
    }

    // 2. network-map label overlaps
    const overlaps = await labelOverlaps(page, '[data-tm="label"], [data-tm="zone"]');
    report(overlaps.length === 0, `[${tag}] map labels collision-free`, overlaps.slice(0, 4).join(" · ") || "clean");

    // 2b. readability: rendered label glyph boxes must stay >= ~10px
    const minLabel = await page.evaluate(() => {
      const hs = [...document.querySelectorAll('[data-tm="label"], [data-tm="zone"]')]
        .map((el) => el.getBoundingClientRect().height)
        .filter((h) => h > 0);
      return hs.length ? Math.min(...hs) : 0;
    });
    report(minLabel >= 9.5, `[${tag}] smallest label readable`, `${minLabel.toFixed(1)}px`);

    await page.screenshot({ path: `${OUT}/map-${tag}.png`, fullPage: false });

    // 4. district view (click a mid-course station / row)
    if (isMobile) {
      await page.evaluate(() => window.scrollTo(0, 0));
      const rows = await page.$$('[data-tm="row"]');
      if (rows[2]) await rows[2].click();
    } else {
      const stations = await page.$$('[data-tm="station"]');
      if (stations[7]) await stations[7].click();
      else if (stations[0]) await stations[0].click();
    }
    await page.waitForTimeout(600);
    const panel = await page.$(".tmc-district-panel");
    report(!!panel, `[${tag}] district opens`);
    if (panel) {
      const pr = await panel.boundingBox();
      const fits = pr && pr.x >= 0 && pr.y >= 0 && pr.x + pr.width <= vp.width + 1 && pr.y + pr.height <= vp.height + 1;
      report(!!fits, `[${tag}] district panel fits viewport`, pr ? `${Math.round(pr.width)}×${Math.round(pr.height)} at ${Math.round(pr.x)},${Math.round(pr.y)}` : "no box");
      const dOverlaps = await labelOverlaps(page, '[data-tm="d-label"]');
      report(dOverlaps.length === 0, `[${tag}] district labels collision-free`, dOverlaps.slice(0, 4).join(" · ") || "clean");
      await page.screenshot({ path: `${OUT}/district-${tag}.png` });
      await page.keyboard.press("Escape");
    }
    await ctx.close();
  }
}

// es course render (no side quests, 16 modules) — one pass
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/es/transit-preview`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const stations = await page.$$eval('[data-tm="station"]', (els) => els.length);
  report(stations >= 16, "[es] 16+ stations render", `${stations} stations`);
  const overlaps = await labelOverlaps(page, '[data-tm="label"], [data-tm="zone"]');
  report(overlaps.length === 0, "[es] map labels collision-free", overlaps.slice(0, 4).join(" · ") || "clean");
  await page.screenshot({ path: `${OUT}/map-es-1080p-light.png` });
  await ctx.close();
}

await browser.close();
console.log(`\n${failures === 0 ? "ALL CLEAN" : `${failures} check(s) failed`} — shots in ${OUT}`);
process.exit(failures === 0 ? 0 : 1);
