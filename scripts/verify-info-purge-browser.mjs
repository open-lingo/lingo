/**
 * Browser spot-check for the 2026-07-16 ja info-step purge.
 *
 * Loads three surfaces and asserts none crash and the first screen is
 * correct after the purge:
 *   1. ja-m9-1-2 — lost its opening info card; must open straight into the
 *      first exercise (a particle_cloze), NOT an info/grammar slide.
 *   2. ja-m7-1-1 — its opening card was CONVERTED to grammar_rule; must
 *      render the compact grammar card WITH the read gate (Continue locked
 *      as "Reading…", then unlocks to "Got it").
 *   3. /try — prospective-learner funnel; must not error.
 *
 * Usage: node scripts/verify-info-purge-browser.mjs   (dev server on :5173)
 */
import { chromium } from "@playwright/test";

const BASE = "http://localhost:5173";
let failures = 0;
const report = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch({ channel: "chromium", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
// Seed FTUE-seen so the arc can't overlay the lesson on a fresh profile.
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
const consoleErrors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});

const dismissFtue = async () => {
  await page.click('button:text-is("Skip")', { timeout: 1200 }).catch(() => {});
  await page.click('button:has-text("Commit to my goal")', { timeout: 1000 }).catch(() => {});
  await page.click('button:has-text("Start from the beginning")', { timeout: 1000 }).catch(() => {});
};

// ── 1. Lost-opening-info lesson opens straight into the first exercise ──
{
  errors.length = 0;
  await page.goto(`${BASE}/ja/learn/lessons/ja-m9-1-2`, { waitUntil: "networkidle" });
  await dismissFtue();
  await page.waitForTimeout(1500);
  const body = await page.locator("body").innerText();
  // The removed opening info card title must be gone.
  report(!body.includes("Drill time"), "m9-1-2: removed info card title absent");
  // First screen is NOT a grammar/info card — it's the particle_cloze drill.
  report(!body.includes("Grammar refresher") && !body.includes("Grammar\n"),
    "m9-1-2: first screen is not a grammar/info card");
  // Something interactive rendered (option chips / check affordance).
  const interactive = await page.locator("button, [role=button]").count();
  report(interactive > 1, "m9-1-2: interactive controls rendered", `buttons=${interactive}`);
  report(body.trim().length > 120, "m9-1-2: lesson content non-empty");
  report(errors.length === 0, "m9-1-2: no page errors", errors.slice(0, 2).join(" ; "));
}

// ── 2. Converted grammar_rule renders compact card + read gate ──
{
  errors.length = 0;
  await page.goto(`${BASE}/ja/learn/lessons/ja-m7-1-1`, { waitUntil: "networkidle" });
  await dismissFtue();
  // Compact grammar card should appear as the opening step.
  const eyebrow = await page
    .locator('text="Grammar refresher"')
    .first()
    .waitFor({ timeout: 6000 })
    .then(() => true)
    .catch(() => false);
  report(eyebrow, "m7-1-1: compact grammar card ('Grammar refresher') rendered");
  const titleShown = await page.locator('text="The citation form"').count();
  report(titleShown > 0, "m7-1-1: converted rule title 'The citation form' shown");
  // Read gate: Continue is initially locked ("Reading…").
  const lockedNow = await page.locator('button:has-text("Reading")').count();
  report(lockedNow > 0, "m7-1-1: read gate locks Continue ('Reading…') on open");
  // …and unlocks to "Got it" after the gate elapses (≤5s ceiling + margin).
  const unlocked = await page
    .locator('button:has-text("Got it")')
    .first()
    .waitFor({ timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  report(unlocked, "m7-1-1: read gate releases to 'Got it' after the timer");
  report(errors.length === 0, "m7-1-1: no page errors", errors.slice(0, 2).join(" ; "));
}

// ── 3. /try funnel loads without errors ──
{
  errors.length = 0;
  await page.goto(`${BASE}/try`, { waitUntil: "networkidle" });
  await dismissFtue();
  await page.waitForTimeout(1500);
  const body = await page.locator("body").innerText();
  report(body.trim().length > 80, "/try: renders content (not blank first screen)");
  report(errors.length === 0, "/try: no page errors", errors.slice(0, 2).join(" ; "));
}

if (consoleErrors.length) {
  console.log(`\n(console.error output, informational — ${consoleErrors.length}):`);
  for (const e of consoleErrors.slice(0, 8)) console.log(`   · ${e.slice(0, 160)}`);
}
await browser.close();
console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURES`}`);
process.exit(failures === 0 ? 0 : 1);
