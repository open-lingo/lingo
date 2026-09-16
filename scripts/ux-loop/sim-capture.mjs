#!/usr/bin/env node
// iOS Simulator capture — REAL WebKit, real safe areas, real fonts.
//
// ONE command, per docs/mobile-testing-setup-2026-08-06.md "Sim capture
// (2026-09-15)":
//
//   npm run sim:capture -- --route "/ja/learn/lessons/ja-m34-neo-3?step=16" \
//     --font-scale 125 [--viewport 15-pro-max|ipad-air] [--allow-fallback-font]
//
// It boots the simulator if needed, builds/installs the CAP_DEV_SERVER app
// shell only when it's missing or stale, launches the app at `--route` with
// the accessibility font-size slider pre-set to `--font-scale` percent
// (`src/shared/dev/simProbe.ts` applies a `?simFontScale=N` query param to
// the SAME localStorage key `ThemeContext`/`SettingsContext` read, so no
// `vite.config.ts` middleware change is needed), waits for the probe's
// scheduled ticks to fire and POST to `/__sim/report`, screenshots the
// device, and writes `artifacts/ux-loop/sim-capture/capture-<slug>.json` +
// `.png`.
//
// Exit code is non-zero when the captured report shows a real defect: any
// tile wrapped or clipped, the stage-vs-viewport over-report exceeds the
// budget (default 40px), or Noto Sans JP did not load (downgrade the last
// one to a warning with `--allow-fallback-font`).
//
// Pure evaluation logic (`evaluateReport`) is exported for
// `sim-capture.test.mjs` (`node --test scripts/ux-loop/sim-capture.test.mjs`)
// so the exit-code contract is pinned without a live simulator.
//
// Prior art this reuses rather than reinvents: the `/tmp/lingo-sim-target` +
// `/__sim` relaunch mechanism and the manifest-producing multi-device loop
// both already existed in this file; `docs/mobile-testing-setup-2026-08-06.md`
// and the `ios-simulator-sizing-harness` memory note record the manual
// three-prereq recipe this automates.

import { execFileSync, execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const BUNDLE_ID = "com.linguiversal.app";
export const DEV_PORT = 5399;
export const DEV_URL = `http://localhost:${DEV_PORT}`;
export const TARGET_FILE = "/tmp/lingo-sim-target";
export const PROBE_LOG = "artifacts/ux-loop/sim-probe.jsonl";
export const OUT_DIR = "artifacts/ux-loop/sim-capture";

export const VIEWPORTS = {
  "15-pro-max": { device: "iPhone 15 Pro Max", w: 430, h: 932 },
  "ipad-air": { device: "iPad Air 11-inch (M4)", w: 820, h: 1180 },
};

const DEFAULT_ROUTE = "/ja/learn/lessons/ja-m34-neo-3?step=16"; // TestFlight #156

// ---------------------------------------------------------------------------
// Pure: exit-code / verdict logic. No DOM, no simctl — testable in isolation.
// ---------------------------------------------------------------------------

/**
 * @param {any} report a single parsed SIMPROBE JSON line (see simProbe.ts)
 * @param {{ overReportBudget?: number, allowFallbackFont?: boolean }} [opts]
 */
export function evaluateReport(report, opts = {}) {
  const overReportBudget = opts.overReportBudget ?? 40;
  const allowFallbackFont = opts.allowFallbackFont ?? false;
  const reasons = [];
  const warnings = [];

  if (!report) {
    reasons.push("no probe report was captured (the app never posted to /__sim/report)");
    return { ok: false, exitCode: 1, reasons, warnings };
  }

  const tiles = Array.isArray(report.tiles) ? report.tiles : [];
  const wrapped = tiles.filter((t) => t.wrapped);
  const clipped = tiles.filter((t) => t.clipped);
  if (wrapped.length > 0) {
    reasons.push(`${wrapped.length} tile(s) wrapped: ${wrapped.map((t) => JSON.stringify(t.text)).join(", ")}`);
  }
  if (clipped.length > 0) {
    reasons.push(`${clipped.length} tile(s) clipped: ${clipped.map((t) => JSON.stringify(t.text)).join(", ")}`);
  }

  const over = report.stageOverReportPx;
  if (typeof over === "number" && over > overReportBudget) {
    reasons.push(`stage over-report ${over}px exceeds budget ${overReportBudget}px`);
  }

  if (report.notoLoaded === false) {
    const msg = "Noto Sans JP did not load — fallback font in effect (document.fonts.check false)";
    if (allowFallbackFont) warnings.push(msg);
    else reasons.push(msg);
  }

  return { ok: reasons.length === 0, exitCode: reasons.length === 0 ? 0 : 1, reasons, warnings };
}

/** Filename-safe slug for a route + font scale. Pure. */
export function captureSlug(route, fontScale) {
  const routeSlug = route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "");
  return `capture-${routeSlug}-${fontScale}`;
}

/** One-screen summary table, plain text. Pure — takes a report, returns a string. */
export function formatSummaryTable(report, { route, fontScale, viewport } = {}) {
  const lines = [];
  lines.push(`route=${route ?? report?.href ?? "?"}  fontScale=${fontScale ?? report?.fontScale ?? "?"}%  viewport=${viewport ?? "?"}`);
  if (!report) {
    lines.push("  (no report captured)");
    return lines.join("\n");
  }
  lines.push(
    `  rootFontPx=${report.rootFontPx}  fontScale(setting)=${report.fontScale}  ` +
      `notoLoaded=${report.notoLoaded}  emRatio=${report.emRatio}  dpr=${report.dpr}  ` +
      `pointerCoarse=${report.pointerCoarse}  textSizeAdjust=${report.textSizeAdjust}`
  );
  lines.push(
    `  vv=${report.vv}  innerHeight=${report.innerHeight}  stageH=${report.stage?.h ?? null}  ` +
      `stageOverReportPx=${report.stageOverReportPx} (budget; scroller clientHeight vs. on-screen intersection)`
  );
  lines.push(
    `  chromeAbovePx=${report.chromeAbovePx}  chromeBelowPx=${report.chromeBelowPx}  ` +
      `(informational only — fixed header/CTA chrome, no budget)`
  );
  lines.push(`  sampleTileFontFamily=${report.sampleTileFontFamily}`);
  const tiles = Array.isArray(report.tiles) ? report.tiles : [];
  lines.push(`  tiles (${tiles.length}):`);
  lines.push("    text                 variant   fontPx boxW boxH lines wrap clip");
  for (const t of tiles) {
    lines.push(
      "    " +
        String(t.text ?? "").padEnd(20).slice(0, 20) +
        " " +
        String(t.variant ?? "-").padEnd(9).slice(0, 9) +
        " " +
        String(t.fontPx).padStart(6) +
        " " +
        String(t.boxW).padStart(4) +
        " " +
        String(t.boxH).padStart(4) +
        " " +
        String(t.lineCount).padStart(5) +
        " " +
        String(t.wrapped).padStart(5) +
        " " +
        String(t.clipped).padStart(5)
    );
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// simctl / process helpers (side-effecting — not exercised by the dry-run test)
// ---------------------------------------------------------------------------

const simctl = (...a) => execFileSync("xcrun", ["simctl", ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findDevice(name) {
  const list = JSON.parse(simctl("list", "devices", "available", "-j"));
  for (const devs of Object.values(list.devices)) {
    const d = devs.find((x) => x.name === name);
    if (d) return d;
  }
  return null;
}

/** Boots the named simulator if it isn't already, kickstarting a stale
 *  CoreSimulator service once on the known failure mode (memory note
 *  "ios-simulator-sizing-harness"; handoff-2026-09-11-mobile-qa.md:378-379). */
async function ensureBooted(deviceName) {
  const dev = findDevice(deviceName);
  if (!dev) {
    throw new Error(
      `no simulator named "${deviceName}" (xcrun simctl list devices available). ` +
        `If Xcode was recently updated, run: sudo xcodebuild -runFirstLaunch`
    );
  }
  if (dev.state === "Booted") return dev;
  try {
    simctl("boot", dev.udid);
  } catch (err) {
    const msg = String(err.stderr || err.message || "");
    console.warn(`xrun simctl boot ${dev.udid} failed: ${msg.trim()}`);
    console.warn("retrying once via: sudo launchctl kickstart -k system/com.apple.CoreSimulator.CoreSimulatorService");
    try {
      execSync("sudo launchctl kickstart -k system/com.apple.CoreSimulator.CoreSimulatorService", { stdio: "inherit" });
    } catch (kerr) {
      throw new Error(
        `xcrun simctl boot ${dev.udid} failed, and the CoreSimulator kickstart also failed: ${kerr.message}. ` +
          `Failing command: xcrun simctl boot ${dev.udid}`
      );
    }
    simctl("boot", dev.udid); // let a second real failure throw its own message
  }
  simctl("bootstatus", dev.udid, "-b");
  const rebooted = findDevice(deviceName);
  return rebooted ?? dev;
}

function isDevServerUp() {
  try {
    execSync(`curl -sf -o /dev/null ${DEV_URL}/`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Reuses an already-running dev server on DEV_PORT (common in this repo —
 *  see docs/mobile-testing-setup-2026-08-06.md) rather than restarting it,
 *  so a capture never kills another session's server. Only starts a fresh
 *  one (VITE_DEV_AUTH_BYPASS + VITE_NATIVE, per capacitor.config.ts's
 *  comment) when nothing is listening. */
async function ensureDevServer() {
  if (isDevServerUp()) return { started: false };
  console.log(`no dev server on :${DEV_PORT} — starting one (VITE_DEV_AUTH_BYPASS=true, VITE_NATIVE=true)`);
  const child = spawn("npx", ["vite", "--port", String(DEV_PORT), "--strictPort"], {
    env: { ...process.env, VITE_DEV_AUTH_BYPASS: "true", VITE_NATIVE: "true" },
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (isDevServerUp()) return { started: true, pid: child.pid };
    await sleep(1000);
  }
  throw new Error(`dev server did not come up on :${DEV_PORT} within 30s (command: npx vite --port ${DEV_PORT} --strictPort)`);
}

/** True if the app shell is installed AND already wired to this exact dev
 *  server (capacitor.config.json is generated by `cap sync` from
 *  capacitor.config.ts + CAP_DEV_SERVER). */
function shellIsFresh(udid) {
  let installed = false;
  try {
    const apps = simctl("listapps", udid);
    installed = apps.includes(BUNDLE_ID);
  } catch { /* simctl listapps failed — treat as not installed */ }
  if (!installed) return false;
  try {
    const cfg = JSON.parse(fs.readFileSync("ios/App/App/capacitor.config.json", "utf8"));
    return cfg?.server?.url === `${DEV_URL}/__sim`;
  } catch {
    return false;
  }
}

function buildAndInstallShell(udid) {
  console.log("app shell missing or stale — syncing + building (this takes a few minutes)");
  execSync(`npx cap sync ios`, {
    stdio: "inherit",
    env: { ...process.env, CAP_DEV_SERVER: `${DEV_URL}/__sim` },
  });
  const dd = path.resolve("artifacts/ux-loop/DerivedData");
  execSync(
    `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug ` +
      `-sdk iphonesimulator -destination "platform=iOS Simulator,id=${udid}" ` +
      `-derivedDataPath "${dd}" CODE_SIGNING_ALLOWED=NO build`,
    { stdio: "inherit" }
  );
  const app = path.join(dd, "Build/Products/Debug-iphonesimulator/App.app");
  if (!fs.existsSync(app)) throw new Error(`xcodebuild reported success but ${app} does not exist`);
  simctl("install", udid, app);
}

function countLines(file) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    if (raw.length === 0) return 0;
    return raw.split("\n").filter(Boolean).length;
  } catch {
    return 0;
  }
}

function readNewReports(file, sinceLine) {
  let raw = "";
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return [];
  }
  const lines = raw.split("\n").filter(Boolean);
  return lines
    .slice(sinceLine)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(argv, name, def) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
}

export function parseArgs(argv) {
  const route = arg(argv, "route", DEFAULT_ROUTE);
  const fontScale = Number(arg(argv, "font-scale", "100"));
  const viewportKey = arg(argv, "viewport", "15-pro-max");
  const allowFallbackFont = Boolean(arg(argv, "allow-fallback-font", false));
  const waitMs = Number(arg(argv, "wait", "13")) * 1000; // probe ticks run to 12000ms
  const overReportBudget = Number(arg(argv, "over-report-budget", "40"));
  return { route, fontScale, viewportKey, allowFallbackFont, waitMs, overReportBudget };
}

async function main() {
  const { route, fontScale, viewportKey, allowFallbackFont, waitMs, overReportBudget } = parseArgs(process.argv.slice(2));
  const viewport = VIEWPORTS[viewportKey];
  if (!viewport) {
    console.error(`unknown --viewport ${viewportKey}; known: ${Object.keys(VIEWPORTS).join(", ")}`);
    process.exit(2);
  }

  console.log(`booting ${viewport.device}…`);
  const dev = await ensureBooted(viewport.device);

  console.log(`ensuring dev server on :${DEV_PORT}…`);
  await ensureDevServer();

  if (!shellIsFresh(dev.udid)) {
    buildAndInstallShell(dev.udid);
  } else {
    console.log("app shell already installed and wired to this dev server — skipping build");
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(PROBE_LOG), { recursive: true });
  const sinceLine = countLines(PROBE_LOG);

  const targetRoute = route.includes("?") ? `${route}&simFontScale=${fontScale}` : `${route}?simFontScale=${fontScale}`;
  fs.writeFileSync(TARGET_FILE, targetRoute);

  try {
    simctl("terminate", dev.udid, BUNDLE_ID);
  } catch { /* not running */ }
  simctl("launch", dev.udid, BUNDLE_ID);
  console.log(`launched at ${targetRoute} — waiting ${waitMs}ms for the probe ticks…`);
  await sleep(waitMs);

  const slug = captureSlug(route, fontScale);
  const screenshotFile = path.join(OUT_DIR, `${slug}.png`);
  simctl("io", dev.udid, "screenshot", screenshotFile);

  const reports = readNewReports(PROBE_LOG, sinceLine);
  const report = reports.length > 0 ? reports[reports.length - 1] : null;

  const jsonFile = path.join(OUT_DIR, `${slug}.json`);
  fs.writeFileSync(
    jsonFile,
    JSON.stringify({ route, fontScale, viewport: viewportKey, device: viewport.device, capturedAt: new Date().toISOString(), screenshot: screenshotFile, report, allReports: reports }, null, 2)
  );

  console.log("");
  console.log(formatSummaryTable(report, { route, fontScale, viewport: viewportKey }));
  console.log("");
  console.log(`wrote ${jsonFile}`);
  console.log(`wrote ${screenshotFile}`);

  const verdict = evaluateReport(report, { overReportBudget, allowFallbackFont });
  for (const w of verdict.warnings) console.warn(`WARN: ${w}`);
  if (!verdict.ok) {
    for (const r of verdict.reasons) console.error(`FAIL: ${r}`);
    process.exit(verdict.exitCode);
  }
  console.log("PASS");
}

const isMain = import.meta.url === `file://${process.argv[1]}` || import.meta.url === `file://${path.resolve(process.argv[1] ?? "")}`;
if (isMain) {
  main().catch((err) => {
    console.error(err?.stack || err);
    process.exit(1);
  });
}
