#!/usr/bin/env node
/**
 * FTUE walk — device-faithful, deliberately UNSEEDED.
 *
 * `scripts/ux-loop/capture.mjs` seeds past the first-time experience
 * (ftueArcSeen, language chosen, placement dismissed, cookie consent). This is
 * the inverse: a genuinely empty browser, so we see what a brand-new user sees.
 *
 * Records console errors, page errors and failed requests per step, because a
 * silent red console is the thing screenshots don't show.
 *
 * Usage: node ftue-walk.mjs <outDir>
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:5173";
const outDir = process.argv[2] ?? ".";
fs.mkdirSync(outDir, { recursive: true });

// iPhone 15 Pro Max, matching the simulator used for the native half.
const VP = { width: 430, height: 932 };
const INSETS = { top: 59, left: 0, bottom: 34, right: 0 };

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: VP,
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: INSETS });

let bucket = [];
page.on("console", (m) => {
  if (m.type() === "error") bucket.push({ kind: "console", text: m.text().slice(0, 300) });
});
page.on("pageerror", (e) => bucket.push({ kind: "pageerror", text: String(e).slice(0, 300) }));
page.on("requestfailed", (r) =>
  bucket.push({ kind: "requestfailed", text: `${r.method()} ${r.url()} — ${r.failure()?.errorText}` }),
);
page.on("response", (r) => {
  if (r.status() >= 400) bucket.push({ kind: "http", text: `${r.status()} ${r.request().method()} ${r.url()}` });
});

const report = [];

async function step(label, fn) {
  bucket = [];
  try {
    await fn();
  } catch (e) {
    bucket.push({ kind: "walk", text: `step threw: ${String(e).slice(0, 200)}` });
  }
  await page.waitForTimeout(900);
  const shot = path.join(outDir, `${label}.png`);
  await page.screenshot({ path: shot });
  // Ignore noise from the dev-server websocket and source maps.
  const issues = bucket.filter(
    (b) => !/vite|@react-refresh|sourcemap|favicon|__vite_ping/i.test(b.text),
  );
  report.push({ label, url: page.url(), issues });
  console.log(`${issues.length ? "⚠ " : "✓ "}${label}  (${issues.length} issue${issues.length === 1 ? "" : "s"})`);
  for (const i of issues.slice(0, 6)) console.log(`     ${i.kind}: ${i.text}`);
}

const go = (route) => async () => {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 45_000 }).catch(() => {});
};

await step("01-guest-landing", async () => {
  await ctx.clearCookies();
  await go("/")();
});
await step("02-first-open-home", go("/home"));
await step("03-learn-map", go("/learn"));
await step("04-practice", go("/practice"));
await step("05-shop", go("/shop"));
await step("06-profile", go("/profile"));

fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
const total = report.reduce((n, r) => n + r.issues.length, 0);
console.log(`\n${total} issue(s) across ${report.length} steps → ${path.join(outDir, "report.json")}`);
await browser.close();
