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
// `subQueueLoading` resolves ~1-2s post-nav (one react-query retry's backoff
// under the bypass build's offline short-circuit) — well past the flat
// 1200ms this used to wait, so this screenshot used to capture "Loading…"
// instead of the session (2026-09-02, Task 8). Wait for the fact.
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
// `FlashcardsOnboardingGate` opens in a useEffect gated on `enabled` (card
// present), which fires a render pass AFTER the loading-resolved wait above
// already saw a card — so `gotIt.count()` read 0 here even though the modal
// showed up seconds later (2026-09-02, Task 8: captured a blank fc-front
// because of it). Give the effect a real chance to open it before deciding
// there's nothing to dismiss.
const gotIt = page.getByRole("button", { name: /got it/i });
await gotIt.first().waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
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
