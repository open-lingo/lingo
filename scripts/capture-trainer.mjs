import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
const outDir = process.argv[2];
const width = Number(process.argv[3] ?? 390), height = Number(process.argv[4] ?? 844);
const vp = width < 800 ? "mobile" : "desktop";
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width, height } })).newPage();
await page.addInitScript(() => {
  window.localStorage.setItem("open-lingo-settings", JSON.stringify({ learning: { learningLanguageId: "ja", uiLocale: "en", showAlphabetRomanization: true, showAlphabetFurigana: true, showRomaji: true, ftueArcSeen: true } }));
  window.localStorage.setItem("open-lingo-cookie-consent", JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-01-01T00:00:00.000Z" }));
  window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
});
const shot = async (name) => {
  const f = path.join(outDir, `${name}--${vp}.png`);
  await page.screenshot({ path: f });
  console.log(f);
};
// Load once so localStorage is same-origin, then compute completed lessons
// for m1..m15 from the app's own course data and seed the progress store.
await page.goto("http://localhost:5173/ja/practice", { waitUntil: "networkidle" });
await page.evaluate(async () => {
  const mod = await import("/src/shared/domain/mockCourse.ts");
  const course = mod.getMockCourse("ja");
  const completed = {};
  for (const m of course.modules) {
    const n = parseInt(m.id.replace(/^m/, ""), 10);
    if (isNaN(n) || n > 15) continue;
    for (const l of m.lessons) completed[l.id] = { completedAt: "2026-06-01T00:00:00.000Z" };
  }
  const userId = window.localStorage.getItem("open-lingo-last-user-id") ?? "anonymous";
  window.localStorage.setItem(`open-lingo-lesson-progress:${userId}`, JSON.stringify({ completed }));
});
await page.goto("http://localhost:5173/ja/practice/conjugation", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await shot("trainer-hub");
await page.goto("http://localhost:5173/ja/practice/conjugation/te-form", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await shot("trainer-te-drill-or-learn");
// try cheat sheet tab
const cheat = page.getByRole("button", { name: /cheat/i }).or(page.getByRole("tab", { name: /cheat/i }));
if (await cheat.count()) { await cheat.first().click(); await page.waitForTimeout(400); await shot("trainer-te-cheatsheet"); }
// answer one drill question if drill visible
const drill = page.getByRole("button", { name: /^drill$/i });
if (await drill.count()) { await drill.first().click(); await page.waitForTimeout(400); }
await shot("trainer-te-drill");
await page.goto("http://localhost:5173/ja/practice/grammar", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await shot("grammar-hub-with-trainer-row");
console.log("LASTUSER:", await page.evaluate(() => window.localStorage.getItem("open-lingo-last-user-id")));
await browser.close();
