import { chromium } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1512, height: 840 },
  ...(fs.existsSync(".auth/user.json") ? { storageState: ".auth/user.json" } : {}),
});
const page = await ctx.newPage();
await page.addInitScript(({ key }) => {
  try {
    const raw = localStorage.getItem(key);
    const s = raw ? JSON.parse(raw) : {};
    s.learning = { ...(s.learning ?? {}), learningLanguageId: "ja", onboardingCompleted: true };
    localStorage.setItem(key, JSON.stringify(s));
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.includes("ja-m1-ka-1") || k.includes("ja-m1-ka-test"))) localStorage.removeItem(k);
    }
    localStorage.setItem("open-lingo-cookie-consent", JSON.stringify({ essential: true, advertising: false }));
  } catch {}
}, { key: "open-lingo-settings" });
const log = [];
const byText = (re) => page.locator("button", { hasText: re }).first();
const bar = () => page.locator("text=/^\\d+\\/\\d+$/").first().innerText().catch(() => "?");

// --- ka-1: trace gating + weighted bar ---
await page.goto("http://localhost:5173/ja/learn/lessons/ja-m1-ka-1", { waitUntil: "networkidle" });
await byText(/^continue$/i).click({ timeout: 15000 }); await page.waitForTimeout(250); // info
await byText(/^continue$/i).click({ timeout: 15000 }); await page.waitForTimeout(300); // intro ka
log.push({ at: "trace-ka", bar: await bar(), skipVisibleBeforeCheck: await byText(/skip this letter/i).isVisible().catch(() => false) });
const m1 = await page.evaluate(() => ({ overflow: document.documentElement.scrollHeight - window.innerHeight }));
log.push({ traceOverflow: m1.overflow });
// scribble on the canvas then Check (fails)
const canvas = page.locator("canvas").last();
const box = await canvas.boundingBox();
await page.mouse.move(box.x + 30, box.y + 30);
await page.mouse.down();
await page.mouse.move(box.x + 90, box.y + 80, { steps: 5 });
await page.mouse.up();
await page.waitForTimeout(200);
await byText(/^check$/i).click(); await page.waitForTimeout(700);
log.push({ skipVisibleAfterCheck: await byText(/skip this letter/i).isVisible().catch(() => false) });
await page.screenshot({ path: "/tmp/trace-gated.png" });
await byText(/skip this letter/i).click(); await page.waitForTimeout(400);
log.push({ at: "after-skip", bar: await bar() });

// --- row test: slim header + weighted bar ---
await page.goto("http://localhost:5173/ja/learn/lessons/ja-m1-ka-test", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const cont = byText(/^continue$/i);
if (await cont.isVisible().catch(() => false)) { await cont.click(); await page.waitForTimeout(400); }
log.push({ at: "row-test", bar: await bar(), hasOldLabel: await page.locator("text=/done/i").first().isVisible().catch(() => false) });
await page.screenshot({ path: "/tmp/rowtest-slim.png" });
console.log(log.map((l) => JSON.stringify(l)).join("\n"));
await browser.close();
