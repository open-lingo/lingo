#!/usr/bin/env node
// Usage: node scripts/profile.mjs <journey> [--writes-har=<path>] [--summary] [--headed] [--lang=<id>]
//
// Journeys:
//   home        — load `/`, wait for network idle
//   learn       — load `/`, navigate to `/ja/learn`, wait
//   flashcards  — load `/`, navigate to `/ja/flashcards`, wait
//   social      — load `/`, navigate to `/ja/social`, wait
//   community   — load `/`, navigate to `/ja/community`, wait
//   full        — home → learn → flashcards → social → community in sequence
//
// Flags:
//   --writes-har=<path>  write a HAR archive to disk (e.g. /tmp/lingo-full.har)
//   --summary            emit a stdout breakdown (req count by domain, top repeats, top slow)
//   --headed             show browser window (default: headless)
//   --lang=<id>          set the learning language in localStorage (default: ja)
//
// Requires:
//   - `npm run dev` already up at http://localhost:5173 (script will not start it)
//   - .auth/user.json (run `npm run test:e2e:auth` once if missing)
//   - node_modules/@playwright/test (already a devDep — don't add new deps)
//
// Output:
//   - HAR file at <path> if --writes-har provided
//   - Summary on stdout if --summary provided
//   - Always prints per-page time-to-network-idle and total request count

import fs from "node:fs";
import path from "node:path";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const AUTH = ".auth/user.json";
const SETTINGS_KEY = "open-lingo-settings";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "usage: node scripts/profile.mjs <journey> [--writes-har=<path>] [--summary] [--headed] [--lang=<id>]",
  );
  console.error("journeys: home, learn, flashcards, social, community, full");
  process.exit(1);
}

const journey = args[0];
const harArg = args.find((a) => a.startsWith("--writes-har="));
const harPath = harArg ? harArg.slice("--writes-har=".length) : null;
const wantSummary = args.includes("--summary");
const headed = args.includes("--headed");
const langArg = args.find((a) => a.startsWith("--lang="));
const lang = langArg ? langArg.slice("--lang=".length) : "ja";

const JOURNEY_SEQUENCES = {
  home: ["/"],
  learn: ["/", "/ja/learn"],
  flashcards: ["/", "/ja/flashcards"],
  social: ["/", "/ja/social"],
  community: ["/", "/ja/community"],
  full: ["/", "/ja/learn", "/ja/flashcards", "/ja/social", "/ja/community"],
};

const sequence = JOURNEY_SEQUENCES[journey];
if (!sequence) {
  console.error(`unknown journey: ${journey}`);
  console.error(`known: ${Object.keys(JOURNEY_SEQUENCES).join(", ")}`);
  process.exit(1);
}

// Preflight: dev server must be up
try {
  const res = await fetch(BASE, { signal: AbortSignal.timeout(3000) });
  if (!res.ok && res.status >= 500) {
    throw new Error(`dev server returned ${res.status}`);
  }
} catch (err) {
  console.error(`dev server not reachable at ${BASE}: ${err.message}`);
  console.error("start it in another shell: `npm run dev`");
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch {
  console.error("playwright not installed — run `npm install`");
  process.exit(3);
}

const browser = await chromium.launch({ headless: !headed });
const ctxOpts = {
  viewport: { width: 1440, height: 900 },
  ...(fs.existsSync(AUTH) ? { storageState: AUTH } : {}),
  ...(harPath ? { recordHar: { path: path.resolve(harPath), content: "embed" } } : {}),
};
const ctx = await browser.newContext(ctxOpts);

// Per-request timing log so we can compute slowest + total bytes without re-parsing the HAR.
// Schema: { method, url, page, startMs, endMs, status, bytes, fromCache }
const events = [];
let currentPage = sequence[0];
const pageStartTimes = new Map(); // page → { start, idleAt }

ctx.on("request", () => {
  // No-op; we listen on response/finished so timing is accurate.
});
ctx.on("response", async (res) => {
  const req = res.request();
  const url = req.url();
  // Skip the dev server's own data: URIs and the HMR ws (handled separately).
  if (url.startsWith("data:") || url.startsWith("blob:")) return;
  const timing = req.timing();
  const startMs = timing.startTime;
  const endMs = timing.responseEnd > 0 ? startMs + timing.responseEnd : Date.now();
  let bytes = 0;
  try {
    const body = await res.body();
    bytes = body.length;
  } catch {
    // Some responses (redirects, aborted) don't expose a body
  }
  events.push({
    method: req.method(),
    url,
    page: currentPage,
    startMs,
    endMs,
    durationMs: endMs - startMs,
    status: res.status(),
    bytes,
    fromCache: res.fromServiceWorker?.() ?? false,
    resourceType: req.resourceType(),
  });
});

const page = await ctx.newPage();

// Match shot.mjs init scripts so authed routes don't trip the lang picker.
await page.addInitScript(
  ({ key, langId }) => {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.learning = {
        learningLanguageId: langId,
        uiLocale: parsed.learning?.uiLocale ?? "en",
        showAlphabetRomanization: parsed.learning?.showAlphabetRomanization ?? true,
        showAlphabetFurigana: parsed.learning?.showAlphabetFurigana ?? true,
      };
      window.localStorage.setItem(key, JSON.stringify(parsed));
    } catch {
      /* ignore */
    }
  },
  { key: SETTINGS_KEY, langId: lang },
);
await page.addInitScript(() => {
  try {
    window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
  } catch {
    /* ignore */
  }
});

async function visit(target) {
  currentPage = target;
  const url = `${BASE}${target.startsWith("/") ? "" : "/"}${target}`;
  const start = Date.now();
  pageStartTimes.set(target, { start, idleAt: null });
  try {
    if (target === sequence[0]) {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    } else {
      // SPA navigation — use client-side router by setting location
      await page.evaluate((to) => {
        window.history.pushState({}, "", to);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, target);
      await page.waitForLoadState("networkidle", { timeout: 30_000 });
    }
  } catch (err) {
    console.error(`warning: ${target} did not reach networkidle within 30s: ${err.message}`);
  }
  // Extra settle window — 3s as the spec requested
  await page.waitForTimeout(3000);
  const idleAt = Date.now();
  pageStartTimes.set(target, { start, idleAt });
  return idleAt - start;
}

for (const target of sequence) {
  const ms = await visit(target);
  console.log(`[${target}] time-to-idle = ${ms}ms`);
}

await ctx.close();
await browser.close();

if (harPath) {
  console.log(`HAR written to ${path.resolve(harPath)}`);
}

// ----- Summary --------------------------------------------------------------

function groupByDomain(events) {
  const groups = new Map();
  for (const ev of events) {
    let host;
    try {
      host = new URL(ev.url).host;
    } catch {
      host = "(invalid)";
    }
    let bucket = "other";
    if (host.endsWith("lambda-url.us-west-1.on.aws") || host.endsWith("on.aws")) bucket = "lambda";
    else if (host.endsWith("cloudfront.net")) bucket = "cloudfront";
    else if (host.includes("auth0.com")) bucket = "auth0";
    else if (host === "localhost:5173" || host === "127.0.0.1:5173") bucket = "vite-dev";
    else if (host.includes("googleapis") || host.includes("gstatic")) bucket = "google";
    else bucket = host;
    if (!groups.has(bucket)) groups.set(bucket, { count: 0, bytes: 0 });
    const g = groups.get(bucket);
    g.count += 1;
    g.bytes += ev.bytes;
  }
  return groups;
}

function pathKey(url) {
  try {
    const u = new URL(url);
    // Drop query so /quests?since=… and /quests group
    return `${u.host}${u.pathname}`;
  } catch {
    return url;
  }
}

function repeatedUrls(events, perPage = false) {
  const counts = new Map();
  for (const ev of events) {
    const k = perPage ? `${ev.page} :: ${pathKey(ev.url)}` : pathKey(ev.url);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

if (wantSummary) {
  const total = events.length;
  const totalBytes = events.reduce((acc, e) => acc + e.bytes, 0);
  const byDomain = groupByDomain(events);
  const topRepeated = repeatedUrls(events).filter(([, n]) => n > 1).slice(0, 20);
  const topRepeatedPerPage = repeatedUrls(events, true).filter(([, n]) => n > 1).slice(0, 20);
  const slowest = [...events].sort((a, b) => b.durationMs - a.durationMs).slice(0, 10);

  const fmt = (n) => n.toLocaleString();
  const fmtBytes = (b) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  console.log("\n=== Summary ===");
  console.log(`journey:        ${journey}`);
  console.log(`total requests: ${fmt(total)}`);
  console.log(`total bytes:    ${fmtBytes(totalBytes)}`);
  console.log("\n--- by domain ---");
  const sortedDomains = [...byDomain.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [bucket, g] of sortedDomains) {
    console.log(`${bucket.padEnd(32)} ${String(g.count).padStart(5)} req  ${fmtBytes(g.bytes)}`);
  }
  console.log("\n--- top repeated URLs (whole journey) ---");
  for (const [k, n] of topRepeated.slice(0, 10)) {
    console.log(`${String(n).padStart(4)}x  ${k}`);
  }
  console.log("\n--- top repeated URLs (per page) ---");
  for (const [k, n] of topRepeatedPerPage.slice(0, 10)) {
    console.log(`${String(n).padStart(4)}x  ${k}`);
  }
  console.log("\n--- top 10 slowest ---");
  for (const ev of slowest) {
    console.log(`${String(Math.round(ev.durationMs)).padStart(6)}ms  ${ev.status}  ${pathKey(ev.url)}`);
  }
  console.log("\n--- time-to-idle per page ---");
  for (const [p, t] of pageStartTimes.entries()) {
    if (t.idleAt) console.log(`${p.padEnd(28)} ${t.idleAt - t.start}ms`);
  }
}
