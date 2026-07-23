#!/usr/bin/env node
// Layer B of the mobile render pipeline (research §6): a visual sweep across the
// VIEWPORTS × ROUTES matrix. Generalizes scripts/batch-shots.mjs but:
//   - passes storageState: ".auth/user.json" (per shot.mjs:52) so authed routes
//     actually render authed (batch-shots.mjs omits this);
//   - uses the §6 mobile viewport matrix;
//   - writes <route-slug>--<viewport>.png;
//   - runs the assertion-1 overflow check per shot and prints PASS/FAIL,
//     exiting non-zero if any shot overflowed (so it can gate too).
//
// Usage:
//   node scripts/mobile-matrix.mjs [outDir] [--public-only] [--only=slug1,slug2] [--serve]
//   PLAYWRIGHT_BASE_URL=http://localhost:5199 node scripts/mobile-matrix.mjs
//
// This Layer-B script needs a running server. By default (no --serve) it assumes
// one is already running at BASE. With --serve (or MOBILE_SELF_SERVE=1) and no
// explicit PLAYWRIGHT_BASE_URL, it spawns its OWN worktree dev server on
// MOBILE_PORT (default 5273, never :5173) with VITE_E2E=true, waits for the port,
// runs the sweep, and always kills the child on exit.
//
// Route/viewport arrays come from the shared single source tests/mobile/routes.mjs
// (also consumed by _matrix.ts) — no drift between the gate specs and this sweep.

import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { VIEWPORTS, PUBLIC_ROUTES, AUTHED_ROUTES } from "../tests/mobile/routes.mjs";

const MOBILE_PORT = process.env.MOBILE_PORT ?? "5273";
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${MOBILE_PORT}`;
const AUTH = ".auth/user.json";
const SETTINGS_KEY = "open-lingo-settings";
const EPS = 1;

const args = process.argv.slice(2);
const publicOnly = args.includes("--public-only") || process.env.MOBILE_PUBLIC_ONLY === "1";
// Self-serve only when the caller hasn't pointed us at an existing server.
const selfServe =
  !process.env.PLAYWRIGHT_BASE_URL &&
  (args.includes("--serve") || process.env.MOBILE_SELF_SERVE === "1");
const onlyArg = args.find((a) => a.startsWith("--only="));
const only = onlyArg ? new Set(onlyArg.slice(7).split(",")) : null;
const outDir = args.find((a) => !a.startsWith("--")) ?? "mobile-shots";
fs.mkdirSync(outDir, { recursive: true });

/** Resolve when a TCP connection to host:port succeeds, or reject after timeout. */
function waitForPort(port, host = "localhost", timeoutMs = 120_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const sock = net.connect(Number(port), host);
      sock.once("connect", () => {
        sock.destroy();
        resolve();
      });
      sock.once("error", () => {
        sock.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`timed out waiting for ${host}:${port}`));
        } else {
          setTimeout(tryOnce, 300);
        }
      });
    };
    tryOnce();
  });
}

let child = null;
async function startServer() {
  console.log(`[mobile-matrix] self-serving VITE_E2E dev server on :${MOBILE_PORT}`);
  child = spawn(
    "npm",
    ["run", "dev", "--", "--port", String(MOBILE_PORT), "--strictPort"],
    { env: { ...process.env, VITE_E2E: "true" }, stdio: "inherit" },
  );
  child.on("exit", (code) => {
    if (code && code !== 0 && !child.__killedByUs) {
      console.error(`[mobile-matrix] dev server exited early (code ${code})`);
    }
  });
  await waitForPort(MOBILE_PORT);
  console.log(`[mobile-matrix] dev server up at ${BASE}`);
}
function stopServer() {
  if (child && !child.killed) {
    child.__killedByUs = true;
    child.kill("SIGTERM");
  }
}

const ROUTES = publicOnly ? PUBLIC_ROUTES : [...PUBLIC_ROUTES, ...AUTHED_ROUTES];

function slug(p) {
  return (
    p
      .replace(/^\//, "")
      .replace(/\?.*$/, (q) => q.replace(/[?=&]/g, "-"))
      .replace(/\//g, "-")
      .replace(/[^a-z0-9-]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/-$/, "") || "root"
  );
}

const hasAuth = fs.existsSync(AUTH);
if (!publicOnly && !hasAuth) {
  console.warn(`[mobile-matrix] ${AUTH} missing — authed routes will bounce to /landing.`);
}

async function seed(page, route) {
  if (route.lang) {
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
            showRomaji: parsed.learning?.showRomaji ?? true,
            ftueArcSeen: true,
          };
          window.localStorage.setItem(key, JSON.stringify(parsed));
        } catch {}
      },
      { key: SETTINGS_KEY, langId: route.lang },
    );
  }
  await page.addInitScript(() => {
    try {
      window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
      window.localStorage.setItem(
        "open-lingo-cookie-consent",
        JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-01-01T00:00:00.000Z" }),
      );
    } catch {}
  });
}

if (selfServe) {
  try {
    await startServer();
  } catch (e) {
    stopServer();
    console.error(`[mobile-matrix] ${e.message}`);
    process.exit(1);
  }
}

let anyOverflow = false;
let anyError = false;

try {
const browser = await chromium.launch();

for (const { name: vpName, width, height } of VIEWPORTS) {
  for (const route of ROUTES) {
    const routeSlug = slug(route.path);
    if (only && !only.has(routeSlug)) continue;
    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      ...(hasAuth ? { storageState: AUTH } : {}),
    });
    const page = await ctx.newPage();
    try {
      await seed(page, route);
      await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(600);
      // Auth-bounce guard: a stale/absent storageState makes authed routes
      // redirect to /landing or /login, where we'd otherwise screenshot the
      // marketing page and report a false PASS. Fail the shot loudly instead.
      if (route.auth) {
        const landed = new URL(page.url()).pathname;
        const requested = new URL(route.path, "http://localhost").pathname;
        if (landed !== requested && (landed === "/landing" || landed === "/login")) {
          throw new Error(
            `auth storageState is stale — refresh with npm run test:e2e:auth ` +
              `(bounced ${requested} -> ${landed})`,
          );
        }
      }
      const o = await page.evaluate((eps) => {
        const el = document.scrollingElement || document.documentElement;
        return { sw: el.scrollWidth, cw: el.clientWidth, overflow: el.scrollWidth > el.clientWidth + eps };
      }, EPS);
      const file = path.join(outDir, `${routeSlug}--${vpName}.png`);
      await page.screenshot({ path: file, fullPage: true });
      if (o.overflow) {
        anyOverflow = true;
        console.log(`FAIL ${routeSlug}--${vpName}  overflow sw=${o.sw} cw=${o.cw}  ->  ${file}`);
      } else {
        console.log(`PASS ${routeSlug}--${vpName}  ->  ${file}`);
      }
    } catch (e) {
      anyError = true;
      console.error(`ERROR ${routeSlug}--${vpName}: ${e.message.split("\n")[0]}`);
    } finally {
      await ctx.close();
    }
  }
}
await browser.close();
} finally {
  stopServer();
}

if (anyOverflow) console.error("\nOverflow detected in one or more shots.");
if (anyError) console.error("One or more routes errored during the sweep.");
process.exit(anyOverflow || anyError ? 1 : 0);
