import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
const outDir = process.argv[2];
const width = Number(process.argv[3] ?? 390), height = Number(process.argv[4] ?? 844);
const vp = width < 800 ? "mobile" : "desktop";
fs.mkdirSync(outDir, { recursive: true });
const ATOMS = ["ai","uma","kai","kao","kame","kinoko","sakura","tsuki","fune","hoshi","momo","ue","hito","nani","koe","ie","yama","kawa","asa","uta","ike","umi","inu","neko"];
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width, height } })).newPage();
await page.addInitScript(({ atoms }) => {
  window.localStorage.setItem("open-lingo-settings", JSON.stringify({ learning: { learningLanguageId: "ja", uiLocale: "en", showAlphabetRomanization: true, showAlphabetFurigana: true, showRomaji: true, ftueArcSeen: true } }));
  window.localStorage.setItem("open-lingo-cookie-consent", JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-01-01T00:00:00.000Z" }));
  window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
  window.localStorage.setItem("lingo:unlocked-atoms", JSON.stringify(atoms));
}, { atoms: ATOMS });
const shot = async (name) => {
  const f = path.join(outDir, `${name}--${vp}.png`);
  await page.screenshot({ path: f });
  console.log(f);
};
await page.goto("http://localhost:5173/ja/practice/flashcards/review", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const gotIt = page.getByRole("button", { name: /got it/i });
if (await gotIt.count()) { await shot("fc-onboarding-modal"); await gotIt.first().click(); await page.waitForTimeout(400); }
await shot("fc-front");
// dump visible buttons for diagnosis
console.log("BTNS:", JSON.stringify(await page.locator("button:visible").allTextContents()));
// Reveal (click card or a show-answer button)
const reveal = page.getByRole("button", { name: /show answer|reveal|flip/i });
if (await reveal.count()) { await reveal.first().click(); }
else {
  const card = page.locator("main").locator("[class*=card],[class*=Card]").first();
  await card.click({ trial: false }).catch(() => {});
}
await page.waitForTimeout(600);
await shot("fc-back");
console.log("BTNS2:", JSON.stringify(await page.locator("button:visible").allTextContents()));
// Grade one card ("Good"/"Knew it" style button) and shoot the next-card state
const grade = page.getByRole("button", { name: /good|knew|easy/i });
if (await grade.count()) { await grade.first().click(); await page.waitForTimeout(600); await shot("fc-next-after-grade"); }
await browser.close();
