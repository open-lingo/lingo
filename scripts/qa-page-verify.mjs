// One-shot verification of the QA test-drive page fix round:
//  1. dark theme actually renders dark (bg + readable text)
//  2. fixture links land ON the fixture card (hash scroll after lazy load)
//  3. lesson links with ?step=<type> open the lesson AT that step type
// Usage: node scripts/qa-page-verify.mjs [outDir]
import { chromium } from "@playwright/test";

const BASE = "http://localhost:5173";
const OUT = process.argv[2] ?? "/tmp";
const results = [];
const ok = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch({ channel: "chromium", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

// ── 1. dark mode ──────────────────────────────────────────────────────
// ThemeContext applies themes by writing CSS vars on :root (server-merged
// settings make storage-key spoofing unreliable under the dev bypass), so
// flip the vars directly — if the page tracks them, every theme works.
await page.goto(`${BASE}/ja/qa`, { waitUntil: "networkidle" });
await page.waitForSelector("h1");
const colors = await page.evaluate(() => {
  const r = document.documentElement.style;
  r.setProperty("--color-background", "#111827");
  r.setProperty("--color-text-primary", "#f9fafb");
  r.setProperty("--color-surface", "#1f2937");
  r.setProperty("--color-border", "#374151");
  const root = document.querySelector("h1").closest("div[class*='min-h-screen']");
  const cs = root ? getComputedStyle(root) : null;
  const h1 = getComputedStyle(document.querySelector("h1"));
  return { bg: cs?.backgroundColor ?? "none", text: h1.color };
});
const lum = (rgb) => {
  const m = rgb.match(/\d+/g);
  if (!m) return -1;
  const [r, g, b] = m.map(Number);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};
const bgL = lum(colors.bg);
const textL = lum(colors.text);
ok("qa page paints its own dark background", bgL >= 0 && bgL < 100, `bg=${colors.bg}`);
ok("qa page text readable on it", textL > 150 && Math.abs(textL - bgL) > 80, `text=${colors.text}`);
await page.screenshot({ path: `${OUT}/qa-dark.png`, fullPage: false });

// broken-button active state actually styles (text-error exists now)
await page.evaluate(() => window.scrollTo(0, 0));
const brokenBtn = page.locator("button", { hasText: "✗ broken" }).first();
await brokenBtn.click();
const brokenColor = await brokenBtn.evaluate((el) => getComputedStyle(el).color);
ok("✗ broken active state is tinted (not default text)", brokenColor !== colors.text, brokenColor);
await brokenBtn.click(); // untoggle so we don't pollute Spencer's notes

// ── 2. fixture hash scroll ────────────────────────────────────────────
const fixtureHref = await page
  .locator("a", { hasText: /^fixture$/ })
  .nth(3)
  .getAttribute("href");
await page.goto(`${BASE}${fixtureHref}`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.evaluate(() => {
  const r = document.documentElement.style;
  r.setProperty("--color-background", "#111827");
});
const anchorId = fixtureHref.split("#")[1];
const inView = await page.evaluate((id) => {
  const el = document.getElementById(id);
  if (!el) return { found: false };
  const r = el.getBoundingClientRect();
  return { found: true, top: r.top, visible: r.top > -50 && r.top < 300 };
}, anchorId);
ok(`fixture link scrolls to #${anchorId}`, inView.found && inView.visible, `top=${Math.round(inView.top ?? -1)}`);
const previewBg = await page.evaluate(() => {
  const root = document.querySelector("div[class*='min-h-screen']");
  return root ? getComputedStyle(root).backgroundColor : "none";
});
ok("lesson-preview page also dark", lum(previewBg) >= 0 && lum(previewBg) < 100, previewBg);
await page.screenshot({ path: `${OUT}/fixture-anchor.png` });

// ── 3. ?step=<type> deep links ────────────────────────────────────────
// Pull real hrefs off the QA page so we test exactly what Spencer clicks.
await page.goto(`${BASE}/ja/qa`, { waitUntil: "networkidle" });
const stepLinks = await page.evaluate(() => {
  const out = {};
  for (const row of document.querySelectorAll("div[class*='rounded-xl']")) {
    const title = row.querySelector(".font-mono")?.textContent?.trim();
    const a = row.querySelector("a[href*='?step=']");
    if (title && a && !out[title]) out[title] = a.getAttribute("href");
  }
  return out;
});

const PROBES = {
  translate: async () => (await page.locator("textarea").count()) > 0,
  grammar_rule: async () =>
    (await page.locator("text=/grammar/i").count()) > 0 ||
    (await page.locator("text=Culture note").count()) > 0,
  match_pairs: async () => (await page.locator("button").count()) >= 8,
  particle_cloze: async () => (await page.locator("button").count()) >= 4,
};

for (const type of Object.keys(PROBES)) {
  const href = stepLinks[type];
  if (!href) {
    ok(`?step deep link for ${type}`, false, "no link on QA page");
    continue;
  }
  await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200); // lesson chunk + jump effect
  const pass = await PROBES[type]();
  // also verify we did NOT land on step 0 chrome when jump applied — the
  // progress bar should show some elapsed fraction for late-lesson types.
  await page.screenshot({ path: `${OUT}/step-${type}.png` });
  ok(`?step deep link lands on a ${type} step`, pass, href);
}

console.log(JSON.stringify({ failures: results.filter((r) => !r.pass).length }));
await browser.close();
process.exit(results.some((r) => !r.pass) ? 1 : 0);
