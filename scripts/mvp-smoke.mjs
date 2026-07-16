// MVP smoke: transit map live at /ja/learn, classic saved, es untouched,
// social/community hidden from nav + routes bounce, register mode survives.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:5173";
let failures = 0;
const report = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch({ channel: "chromium", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
await ctx.addInitScript(() => {
  try {
    const k = "open-lingo-settings";
    const cur = JSON.parse(localStorage.getItem(k) ?? "{}");
    cur.learning = { ...(cur.learning ?? {}), ftueArcSeen: true };
    localStorage.setItem(k, JSON.stringify(cur));
  } catch {}
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

// 1. /ja/learn renders the transit map (live mode: no demo toggle)
await page.goto(`${BASE}/ja/learn`, { waitUntil: "networkidle" });
await page.click("text=Essential only", { timeout: 2500 }).catch(() => {});
// FTUE arc: server settings replay over the local ftueArcSeen seed on fresh
// profiles — walk it like a real first visit so it can't overlay the page.
// (button-scoped: bare `text=Skip` matches the hidden skip-to-content link)
await page.click('button:text-is("Skip")', { timeout: 1500 }).catch(() => {});
await page.click('button:has-text("Commit to my goal")', { timeout: 1500 }).catch(() => {});
await page.click('button:has-text("Start from the beginning")', { timeout: 1500 }).catch(() => {});
await page.waitForTimeout(2500);
report(await page.locator(".tmc-root").count() === 1, "ja/learn renders transit map");
report(await page.locator(".tmc-toggle").count() === 0, "live mode hides demo toggle");
report(await page.locator("text=← Classic view").count() === 1, "classic-view link present");

// 2. classic saved at /ja/learn/classic (no transit root)
await page.goto(`${BASE}/ja/learn/classic`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
report(await page.locator(".tmc-root").count() === 0, "ja/learn/classic is the classic page");
report((await page.locator("main").innerText()).length > 100, "classic page has content");

// 3. preview route still demo-first with toggle
await page.goto(`${BASE}/ja/transit-preview`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
report(await page.locator(".tmc-toggle").count() === 1, "preview keeps demo toggle");

// 4. es learn home stays classic
await page.goto(`${BASE}/es/learn`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
report(await page.locator(".tmc-root").count() === 0, "es/learn stays classic");

// 5. nav: no Social/Community links anywhere in shell
await page.goto(`${BASE}/ja/learn`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const navText = await page.evaluate(() =>
  [...document.querySelectorAll("header a, nav a")].map((a) => a.textContent?.trim()).join("|"),
);
report(!/Social|Community|Leaderboard/i.test(navText), "nav hides social/community/leaderboard", navText);

// 6. gated routes bounce to home
for (const path of ["/ja/social", "/ja/messenger", "/ja/community", "/ja/community/explore", "/u/somebody"]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const url = new URL(page.url());
  report(!url.pathname.startsWith(path), `${path} bounces (landed ${url.pathname})`);
}

// 7. register mode passes the social gate (must NOT bounce to /)
await page.goto(`${BASE}/u/newuser?register=1`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const regUrl = new URL(page.url());
report(regUrl.pathname === "/u/newuser", "register mode survives social gate", page.url());

report(errors.length === 0, "no page errors", errors.slice(0, 3).join(" ; "));
await browser.close();
console.log(failures === 0 ? "ALL PASS" : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
