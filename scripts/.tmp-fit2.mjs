import { chromium } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch();
for (const [w, h] of [[1512, 840], [1280, 700], [2000, 1248]]) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
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
        if (k && (k.includes("ja-m1-l1-1") || k.includes("ja-m9-1-1"))) localStorage.removeItem(k);
      }
      localStorage.setItem("open-lingo-cookie-consent", JSON.stringify({ essential: true, advertising: false }));
    } catch {}
  }, { key: "open-lingo-settings" });
  const out = [];
  const byText = (re) => page.locator("button", { hasText: re }).first();
  const m = async (n) => out.push(`${n}:${await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)}`);
  await page.goto("http://localhost:5173/ja/learn/lessons/ja-m1-l1-1", { waitUntil: "networkidle" });
  await byText(/^continue$/i).click({ timeout: 15000 }); await page.waitForTimeout(250);
  await byText(/^continue$/i).click({ timeout: 15000 }); await page.waitForTimeout(250);
  await m("trace");
  await byText(/skip this letter/i).click(); await page.waitForTimeout(300);
  await m("recog");
  await page.locator("button", { hasText: "あ" }).first().click();
  await byText(/^check$/i).click(); await page.waitForTimeout(250); await m("recog-ans");
  await byText(/^continue$/i).click(); await page.waitForTimeout(250);
  await byText(/^continue$/i).click(); await page.waitForTimeout(250);
  await byText(/skip this letter/i).click(); await page.waitForTimeout(350);
  await m("wimcq");
  if (h === 1248) await page.screenshot({ path: "/tmp/v2-wimcq-tall.png" });
  await page.goto("http://localhost:5173/ja/learn/lessons/ja-m9-1-1", { waitUntil: "networkidle" });
  await byText(/^continue$/i).click({ timeout: 15000 }); await page.waitForTimeout(250);
  await byText(/^got it$/i).click(); await page.waitForTimeout(250);
  await byText(/き.?k.?i.?れ/).click(); await page.waitForTimeout(150);
  await byText(/^check$/i).click(); await page.waitForTimeout(250);
  await byText(/^continue$/i).click(); await page.waitForTimeout(300);
  await m("listening-comp");
  // advance to vocabMcq (step 5): answer lc, then mcq
  await byText(/pretty|clean/i).click().catch(() => {}); await page.waitForTimeout(150);
  const chk = byText(/^check$/i);
  if (await chk.isVisible().catch(() => false)) { await chk.click(); await page.waitForTimeout(250); }
  await byText(/^continue$/i).click(); await page.waitForTimeout(300);
  await m("vocab-mcq");
  if (h === 1248) await page.screenshot({ path: "/tmp/v2-mcq-tall.png" });
  console.log(`${w}x${h}`, out.join(" "));
  await ctx.close();
}
await browser.close();
