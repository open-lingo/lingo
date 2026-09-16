#!/usr/bin/env node
// iOS Simulator capture — REAL WebKit, real safe areas, real fonts.
//
// ONE command, per docs/mobile-testing-setup-2026-08-06.md "Sim capture
// (2026-09-15)":
//
//   npm run sim:capture -- --route "/ja/learn/lessons/ja-m34-neo-3?step=16" \
//     --font-scale 125 [--viewport 15-pro-max|ipad-air|<W>x<H>] [--device <key>] \
//     [--allow-fallback-font] [--strict-prose] [--orientation portrait|landscape] \
//     [--tap <selector>] [--answer-first-option] [--seed fresh|m10-complete|kanji-mastered] \
//     [--keep-dev-server]
//
// It boots the simulator if needed, ensures the dev server on :5399 is
// running WITH `VITE_NATIVE=true` (restarting a reused server that isn't —
// G1, see `ensureDevServer`/`isDevServerNative`), builds/installs the
// CAP_DEV_SERVER app shell only when the INSTALLED BINARY's own build stamp
// says it's stale (G3, see `shellIsFresh`/`readInstalledStamp`), launches
// the app at `--route` with the accessibility font-size slider pre-set to
// `--font-scale` percent, an optional `--seed` learner-state profile, an
// optional `--tap`/`--answer-first-option` post-mount click, and an
// optional `--viewport WxH` / `--orientation landscape` layout emulation
// (`src/shared/dev/simProbe.ts` applies all of these from `?simFontScale=`/
// `?simSeed=`/`?simTap=`/`?simEmuW=`&`?simEmuH=` query params written into
// the route, and the `/__sim` seed middleware in `vite.config.ts` does the
// `--seed` localStorage writes server-side via `ssrLoadModule` — no other
// `vite.config.ts` change needed per flag), waits for the probe's scheduled
// ticks to fire and POST to `/__sim/report`, screenshots the device, and
// writes `artifacts/ux-loop/sim-capture/capture-<slug>.json` + `.png` (slug
// now includes the device + orientation — G2).
//
// Exit code is non-zero when the captured report shows a real defect: any
// non-prose tile wrapped or clipped (a `data-size="sentence"` MCQ tile wraps
// by design and is only a warning unless `--strict-prose` — G4), the
// stage-vs-viewport over-report exceeds the budget (default 40px), the dev
// server wasn't in native mode (G1), or Noto Sans JP did not load
// (downgrade the last one to a warning with `--allow-fallback-font`).
//
// Pure evaluation logic (`evaluateReport`, `captureSlug`, `parseEmulatedSize`,
// `validateCapture`, `routePathname`, `buildTargetRoute`, `isLockStale`,
// `lockFilePath`) is exported for `sim-capture.test.mjs`
// (`node --test scripts/ux-loop/sim-capture.test.mjs`) so the exit-code
// contract is pinned without a live simulator.
//
// Prior art this reuses rather than reinvents: the `/tmp/lingo-sim-target` +
// `/__sim` relaunch mechanism and the manifest-producing multi-device loop
// both already existed in this file; `docs/mobile-testing-setup-2026-08-06.md`
// and the `ios-simulator-sizing-harness` memory note record the manual
// three-prereq recipe this automates.
//
// --- Lane isolation (2026-09-16, PHASE2A.md §6.7) ---------------------------
// Two `sim:capture` runs driving one simulator corrupt each other through the
// SHARED `/tmp/lingo-sim-target` (+ the `/__sim` seed): 8 of 40 captures in
// the tile-sweep were silently another lane's route at another lane's font
// scale, and nothing noticed. Two independent defenses, both in this file
// (the `/__sim` middleware in `vite.config.ts` — out of this file's
// ownership — still serves ONE shared target file; true per-request routing
// would need it to become device/nonce-aware):
//   1. VALIDATION + RETRY (the correctness guarantee, works regardless of
//      what raced): every attempt writes a fresh `?simRun=<uuid>` nonce onto
//      the target route (`simProbe.ts` echoes it back as `report.runNonce`);
//      `validateCapture` checks the nonce plus route/viewport/fontScale/
//      rootFontPx/nativeMode against what THIS invocation actually requested
//      and retries the launch (up to `--validation-max-attempts`, default 3,
//      with backoff) on any mismatch, failing non-zero with the mismatch
//      named if it never clears.
//   2. ADVISORY LOCKS (shrinks how often a race happens at all):
//      `acquireAdvisoryLock` backs two locks built on the same primitive —
//      a PER-DEVICE lock (`/tmp/lingo-sim-<udid>.lock`) held for the WHOLE
//      capture, serializing two runs aimed at the SAME simulator instead of
//      letting them interleave; and a short-lived GLOBAL "launch" lock
//      (`/tmp/lingo-sim-__launch__.lock`) held only across the
//      write-target-file → terminate → launch → settle window — the actual
//      moment the shared file is touched — so two DIFFERENT devices can
//      still capture in parallel (the ~13s wait-for-probe-ticks + screenshot
//      phase overlaps freely) while the brief window that touches the shared
//      file is serialized. Both locks record `{pid, startedAt}` and reclaim
//      a lock whose pid is dead or older than 5 minutes rather than hanging
//      forever on a crashed run's leftover lockfile.

import { execFileSync, execSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const BUNDLE_ID = "com.linguiversal.app";
export const DEV_PORT = 5399;
export const DEV_URL = `http://localhost:${DEV_PORT}`;
export const TARGET_FILE = "/tmp/lingo-sim-target";
export const PROBE_LOG = "artifacts/ux-loop/sim-probe.jsonl";
export const OUT_DIR = "artifacts/ux-loop/sim-capture";
// Pseudo-device key for the GLOBAL launch-critical-section lock — see the
// "Lane isolation" doc comment above. Not a real simulator udid, so it can
// never collide with `acquireAdvisoryLock("<real-udid>", …)`.
export const LAUNCH_LOCK_KEY = "__launch__";

export const VIEWPORTS = {
  "15-pro-max": { device: "OL-15ProMax", w: 430, h: 932, dpr: 3 }, // 2026-09-16: the stock "iPhone 15 Pro Max" (ADE91F3B) carries stale SpringBoard state that pops `Open in "Open Lingo"?` over every shot; OL-15ProMax (942D8E54) is the same model, clean
  "ipad-air": { device: "iPad Air 11-inch (M4)", w: 820, h: 1180, dpr: 2 },
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
  // G4 (REPORT.md "Harness defects") — a `sentence`-tier MCQ tile wraps by
  // design (it's prose, not a tile bank: `data-size="sentence"`). Without
  // `--strict-prose`, a sentence-tier wrap is reported as a warning, not a
  // failure; every other tile size (word/particle/build/listen/unset) still
  // fails the run.
  const strictProse = opts.strictProse ?? false;
  const reasons = [];
  const warnings = [];

  if (!report) {
    reasons.push("no probe report was captured (the app never posted to /__sim/report)");
    return { ok: false, exitCode: 1, reasons, warnings };
  }

  // G1 (REPORT.md "Harness defects") — a report captured off a dev server
  // that wasn't started with VITE_NATIVE=true took the web auth path, which
  // covers the middle of the screenshot with a native-scheme alert. Fail
  // loudly rather than let a wrong-server capture silently look clean.
  if (report.nativeMode === false) {
    reasons.push(
      "dev server was not in native mode (nativeMode=false) — the capture likely shows the " +
        '\'Open in "Open Lingo"?\' alert covering the screenshot; restart the dev server with VITE_NATIVE=true'
    );
  }

  const tiles = Array.isArray(report.tiles) ? report.tiles : [];
  const wrapped = tiles.filter((t) => t.wrapped);
  const wrappedProse = wrapped.filter((t) => t.size === "sentence" && !strictProse);
  const wrappedTiles = wrapped.filter((t) => !(t.size === "sentence" && !strictProse));
  const clipped = tiles.filter((t) => t.clipped);
  if (wrappedTiles.length > 0) {
    reasons.push(`${wrappedTiles.length} tile(s) wrapped: ${wrappedTiles.map((t) => JSON.stringify(t.text)).join(", ")}`);
  }
  if (wrappedProse.length > 0) {
    warnings.push(
      `${wrappedProse.length} sentence-tier tile(s) wrapped (allowed; prose wraps by design — pass --strict-prose to fail on these): ` +
        wrappedProse.map((t) => JSON.stringify(t.text)).join(", ")
    );
  }
  if (clipped.length > 0) {
    // G8: overhangPx > 0 means the BASE text itself overhangs (a real clip);
    // overhangPx === 0/absent on an older-shaped report means the clip came
    // from scrollWidth alone (often a ruby/furigana overhang) — surfaced so
    // a reader can tell which without re-running the capture.
    reasons.push(
      `${clipped.length} tile(s) clipped: ${clipped
        .map((t) => `${JSON.stringify(t.text)}${typeof t.overhangPx === "number" ? ` (overhangPx=${t.overhangPx})` : ""}`)
        .join(", ")}`
    );
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

// ---------------------------------------------------------------------------
// Lane isolation (PHASE2A.md §6.7) — pure validation + lock logic. No DOM,
// no simctl — testable in isolation, same pattern as evaluateReport above.
// ---------------------------------------------------------------------------

/**
 * Just the pathname half of a route/href — the validator's route check
 * compares THIS, not full path+search. Found live (2026-09-16) running the
 * `--expect-font-scale` proof below: `LessonPage.tsx`'s `?step=N` dev-jump
 * is CONSUMED, not persisted — every one of dozens of pre-existing real
 * captures in `artifacts/ux-loop/sim-capture/` shows `step` present in the
 * REQUESTED route and absent from the captured `report.href` (confirmed
 * against `LessonPage.tsx:252`'s "dev jump to a step" comment). Comparing
 * full path+search would therefore fail validation on essentially EVERY
 * real `?step=N` capture — not a corruption signal, a false positive that
 * would have made the harness unusable. Corruption from another lane
 * changes the PATHNAME (a different lesson/route entirely — PHASE2A.md
 * §6.7's actual failure shape: "another lane's route"), which this still
 * catches. Pure.
 */
export function routePathname(pathAndSearch) {
  const s = String(pathAndSearch ?? "");
  const qIndex = s.indexOf("?");
  return qIndex === -1 ? s : s.slice(0, qIndex);
}

/**
 * Builds the route string written into `/tmp/lingo-sim-target`, including a
 * fresh per-run `simRun` nonce. Pure (nonce is passed in, not generated
 * here) so `sim-capture.test.mjs` can pin the exact query string without
 * `node:crypto`.
 */
export function buildTargetRoute(route, opts) {
  const { fontScale, emuW, emuH, tapSelector, answerFirstOption, seedProfile, runNonce } = opts;
  const params = new URLSearchParams();
  params.set("simFontScale", String(fontScale));
  if (emuW && emuH) {
    params.set("simEmuW", String(emuW));
    params.set("simEmuH", String(emuH));
  }
  if (tapSelector) params.set("simTap", String(tapSelector));
  if (answerFirstOption) params.set("simAnswerFirstOption", "1");
  if (seedProfile && seedProfile !== "fresh") params.set("simSeed", String(seedProfile));
  if (runNonce) params.set("simRun", String(runNonce));
  const sep = route.includes("?") ? "&" : "?";
  return `${route}${sep}${params.toString()}`;
}

/**
 * Per-capture validation (PHASE2A.md §6.7 item 1) — the correctness
 * guarantee that holds even when the lock in `acquireAdvisoryLock` didn't
 * prevent a race: does this probe report actually show what THIS invocation
 * asked for, or another lane's route/scale/device that landed in the shared
 * `/tmp/lingo-sim-target` between our write and our launch settling?
 *
 * `expected.viewport` is the `VIEWPORTS[...]` entry (`{device, w, h, dpr}`)
 * this run requested; `expected.fontScale` is the CLI's `--font-scale`
 * percent (may be overridden via `--expect-font-scale` for the deliberate
 * failure-proof run — see `parseArgs`/README). `expected.runNonce` is the
 * nonce THIS attempt wrote into the target route.
 */
export function validateCapture(report, expected) {
  const mismatches = [];
  if (!report) {
    mismatches.push("no probe report was captured (the app never posted to /__sim/report)");
    return { ok: false, mismatches };
  }

  const actualPath = routePathname(report.href ?? "");
  const expectedPath = routePathname(expected.route ?? "");
  if (actualPath !== expectedPath) {
    mismatches.push(`route: expected "${expectedPath}", got "${actualPath}"`);
  }

  if (expected.runNonce) {
    if (report.runNonce !== expected.runNonce) {
      mismatches.push(
        `runNonce: expected "${expected.runNonce}", got "${report.runNonce ?? "(none)"}" — this report belongs to a different (concurrent or stale) run`
      );
    }
  }

  const expectedScale = expected.fontScale / 100;
  if (typeof report.fontScale !== "number" || Math.abs(report.fontScale - expectedScale) > 0.005) {
    mismatches.push(`fontScale: expected ${expectedScale}, got ${report.fontScale}`);
  }

  const expectedRootPx = 16 * expectedScale;
  if (typeof report.rootFontPx !== "number" || Math.abs(report.rootFontPx - expectedRootPx) > 0.5) {
    mismatches.push(`rootFontPx: expected ~${expectedRootPx} (16 × ${expectedScale}), got ${report.rootFontPx}`);
  }

  if (report.nativeMode !== true) {
    mismatches.push(`nativeMode: expected true, got ${report.nativeMode}`);
  }

  if (expected.viewport) {
    const v = expected.viewport;
    if (typeof report.dpr === "number" && report.dpr !== v.dpr) {
      mismatches.push(`device: expected dpr ${v.dpr} (${expected.viewportKey ?? v.device}), got dpr ${report.dpr}`);
    }
    if (expected.emulated) {
      const ev = report.emulatedViewport;
      if (!ev || ev.w !== expected.emuW || ev.h !== expected.emuH) {
        mismatches.push(
          `emulated viewport: expected ${expected.emuW}x${expected.emuH}, got ${ev ? `${ev.w}x${ev.h}` : "(none)"}`
        );
      }
    } else if (typeof report.innerWidth === "number") {
      const tolerance = 24; // 15-pro-max (430) vs ipad-air (820) differ by hundreds — this only needs to separate devices, not pin a px-exact width
      if (Math.abs(report.innerWidth - v.w) > tolerance) {
        mismatches.push(`viewport width: expected ~${v.w}px (${expected.viewportKey ?? v.device}), got ${report.innerWidth}px`);
      }
    }
  }

  return { ok: mismatches.length === 0, mismatches };
}

/** Lockfile path for a device (or the pseudo-device `LAUNCH_LOCK_KEY`). Pure. */
export function lockFilePath(key, lockDir = "/tmp") {
  const slug = String(key).replace(/[^A-Za-z0-9_-]/g, "_");
  return path.join(lockDir, `lingo-sim-${slug}.lock`);
}

/**
 * Is a lockfile's contents stale (safe to reclaim)? A lock is stale when its
 * pid is no longer alive (a crashed/killed run) or it's older than `staleMs`
 * (a run wedged well past any real capture's duration — default wait 13s,
 * up to ~20s with `--tap`, times up to 3 validation attempts with backoff,
 * so 5 minutes is generous headroom, not a hair trigger). Pure — `pidAlive`
 * is injected so `sim-capture.test.mjs` can pin both branches without a
 * real process to kill.
 */
export function isLockStale(lockData, { nowMs, staleMs = 5 * 60 * 1000, pidAlive }) {
  if (!lockData || typeof lockData.pid !== "number") return true;
  if (!pidAlive(lockData.pid)) return true;
  if (typeof lockData.startedAt === "number" && nowMs - lockData.startedAt > staleMs) return true;
  return false;
}

function defaultPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err && err.code === "EPERM"; // exists, owned by someone else — treat as alive
  }
}

const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Exclusive advisory lock, `open(…, "wx")`-based (atomic create-if-absent —
 * no separate exists-check-then-create race). Used two ways (PHASE2A.md
 * §6.7 item 2): per-device (`acquireAdvisoryLock(udid)`, held for a whole
 * capture, so two runs aimed at the SAME simulator serialise instead of
 * interleaving through the shared target file) and as the global
 * `LAUNCH_LOCK_KEY` critical section (held only across the moment that file
 * is actually written + the app launches + settles, so two DIFFERENT
 * devices can still run their ~13s waits in parallel). Returns a release
 * function; polls every `pollMs` and reclaims a stale lock (see
 * `isLockStale`) rather than deferring to it.
 */
export async function acquireAdvisoryLock(key, opts = {}) {
  const lockDir = opts.lockDir ?? "/tmp";
  const staleMs = opts.staleMs ?? 5 * 60 * 1000;
  const timeoutMs = opts.timeoutMs ?? 120000;
  const pollMs = opts.pollMs ?? 500;
  const pidAlive = opts.pidAlive ?? defaultPidAlive;
  const file = lockFilePath(key, lockDir);
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const fd = fs.openSync(file, "wx");
      fs.writeSync(fd, JSON.stringify({ pid: process.pid, startedAt: Date.now(), key }));
      fs.closeSync(fd);
      return () => {
        // Only remove it if we still own it — don't tear down a lock a
        // later run reclaimed after treating OUR lock as stale (e.g. this
        // process hung past `staleMs` before getting to call release()).
        let current = null;
        try { current = JSON.parse(fs.readFileSync(file, "utf8")); } catch { /* already gone */ }
        if (current && current.pid === process.pid) {
          try { fs.unlinkSync(file); } catch { /* already gone */ }
        }
      };
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      let existing = null;
      try { existing = JSON.parse(fs.readFileSync(file, "utf8")); } catch { /* race: read after unlink */ }
      if (isLockStale(existing, { nowMs: Date.now(), staleMs, pidAlive })) {
        try { fs.unlinkSync(file); } catch { /* someone else cleared it first */ }
        continue; // retry the exclusive create immediately
      }
      if (Date.now() > deadline) {
        throw new Error(
          `could not acquire lock ${file} within ${timeoutMs}ms — held by pid ${existing?.pid ?? "?"} since ` +
            `${existing?.startedAt ? new Date(existing.startedAt).toISOString() : "?"}`
        );
      }
      await sleepMs(pollMs);
    }
  }
}

/**
 * Generic mismatch → retry → fail driver (PHASE2A.md §6.7 item 1). All the
 * side-effecting work (launch the sim, wait, screenshot, read the probe log)
 * is injected as `attemptFn`; `validateFn` judges its result. This function
 * is otherwise pure control flow — `sleepFn` is injected too — so
 * `sim-capture.test.mjs` can pin "mismatch on attempts 1–2, pass on 3" (and
 * "mismatch on every attempt → fail non-zero") without simctl or a real
 * clock. `main()` supplies the real `attemptFn`/`validateFn`/`sleep`.
 */
export async function runWithValidationRetry({ attemptFn, validateFn, maxAttempts, sleepFn, backoffFn = (n) => n * 2000, onMismatch }) {
  let lastResult = null;
  let lastValidation = { ok: false, mismatches: ["never attempted"] };
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await attemptFn(attempt);
    lastValidation = validateFn(lastResult, attempt);
    if (lastValidation.ok) {
      return { ok: true, result: lastResult, validation: lastValidation, attempts: attempt };
    }
    if (onMismatch) onMismatch(lastValidation, attempt);
    if (attempt < maxAttempts) await sleepFn(backoffFn(attempt));
  }
  return { ok: false, result: lastResult, validation: lastValidation, attempts: maxAttempts };
}

/** Filename-safe slug for a route + font scale + device + orientation.
 *  Pure. G2 (REPORT.md "Harness defects") — the slug used to omit the
 *  viewport, so an iPad capture silently overwrote a phone capture of the
 *  same route + scale (destroyed 7 captures in the tile sweep before it was
 *  noticed). `orientation` defaults to "portrait" (omitted from the slug —
 *  the common case stays readable); "landscape" and "emulated-landscape"
 *  (G5) are both spelled out so a landscape capture can never collide with
 *  or be mistaken for a portrait one. */
export function captureSlug(route, fontScale, opts = {}) {
  const viewportKey = opts.viewportKey ?? "15-pro-max";
  const orientation = opts.orientation ?? "portrait";
  const routeSlug = route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "");
  const orientationSuffix = orientation === "portrait" ? "" : `-${orientation}`;
  return `capture-${viewportKey}${orientationSuffix}-${fontScale}-${routeSlug}`;
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
      `pointerCoarse=${report.pointerCoarse}  textSizeAdjust=${report.textSizeAdjust}  ` +
      `nativeMode=${report.nativeMode}`
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
  lines.push("    text                 variant   fontPx boxW boxH lines wrap clip   ovh");
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
        String(t.clipped).padStart(5) +
        // G8: base-text overhang px — 0 while clip=true means the clip is
        // scrollWidth-only (often a ruby/furigana overhang, not the base text).
        " " +
        String(typeof t.overhangPx === "number" ? t.overhangPx : "-").padStart(5)
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

/** G1 (REPORT.md "Harness defects") — ask the running dev server itself
 *  (`/__sim/env`, added to `vite.config.ts`'s `simTargetMiddleware`)
 *  whether IT was started with `VITE_NATIVE=true`, without needing the app
 *  shell launched. `null` means the endpoint didn't answer (a pre-G1 dev
 *  server, or nothing listening) — treated as "not native" by the caller,
 *  which is the safe direction (triggers a restart rather than trusting a
 *  server that might not even be this repo's). */
function isDevServerNative() {
  try {
    const body = execSync(`curl -sf ${DEV_URL}/__sim/env`, { encoding: "utf8" });
    const parsed = JSON.parse(body);
    return parsed?.native === true;
  } catch {
    return null;
  }
}

/** Kills whatever is listening on DEV_PORT. Scoped to this harness's own
 *  dedicated port (5399, distinct from the app's normal :5173 dev port —
 *  see DEV_PORT), so this should only ever hit a server another sim-capture
 *  run started, not a developer's main `npm run dev`. */
function killDevServerOnPort() {
  try {
    const pids = execSync(`lsof -ti tcp:${DEV_PORT}`, { encoding: "utf8" }).trim();
    if (!pids) return;
    for (const pid of pids.split("\n").filter(Boolean)) {
      try { process.kill(Number(pid), "SIGTERM"); } catch { /* already gone */ }
    }
  } catch { /* nothing listening */ }
}

/** Polls until DEV_PORT is no longer answering (after `killDevServerOnPort`)
 *  or the timeout elapses — whichever first, so a stuck process doesn't hang
 *  the run forever; `spawnDevServer` will fail loudly on `--strictPort` if
 *  the old process is somehow still holding the port. */
async function waitForPortFree(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isDevServerUp()) return;
    await sleep(500);
  }
}

function spawnDevServer() {
  const child = spawn("npx", ["vite", "--port", String(DEV_PORT), "--strictPort"], {
    env: { ...process.env, VITE_DEV_AUTH_BYPASS: "true", VITE_NATIVE: "true" },
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  return child;
}

/**
 * Ensures a dev server is up on DEV_PORT AND started with
 * `VITE_NATIVE=true` — G1 (REPORT.md "Harness defects"): a reused server
 * without it takes the web auth path, which covers every screenshot with a
 * native-scheme `Open in "Open Lingo"?` alert. Reuses an already-running
 * native server as before (so a capture doesn't disturb another session's
 * work for no reason); only restarts when the running server answers
 * `/__sim/env` with `native !== true` — pass `--keep-dev-server` to opt out
 * of that restart (the check still runs and the mismatch still gets logged
 * loudly, but the existing server is left alone).
 */
async function ensureDevServer({ keepExisting = false } = {}) {
  if (isDevServerUp()) {
    const native = isDevServerNative();
    if (native === true) return { started: false, restarted: false };
    if (keepExisting) {
      console.warn(
        `WARN: dev server on :${DEV_PORT} is up but not in native mode (native=${native}) and ` +
          `--keep-dev-server was passed — captures from this run may show the native-scheme alert`
      );
      return { started: false, restarted: false };
    }
    console.log(`dev server on :${DEV_PORT} is up but NOT in native mode (native=${native}) — restarting it with VITE_NATIVE=true`);
    killDevServerOnPort();
    await waitForPortFree(10000);
  } else {
    console.log(`no dev server on :${DEV_PORT} — starting one (VITE_DEV_AUTH_BYPASS=true, VITE_NATIVE=true)`);
  }
  const child = spawnDevServer();
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (isDevServerUp()) {
      const native = isDevServerNative();
      if (native !== true) {
        throw new Error(
          `dev server on :${DEV_PORT} came up but /__sim/env reports native=${native} — ` +
            `it did not inherit VITE_NATIVE=true (checked ${DEV_URL}/__sim/env)`
        );
      }
      return { started: true, restarted: true, pid: child.pid };
    }
    await sleep(1000);
  }
  throw new Error(`dev server did not come up on :${DEV_PORT} within 30s (command: npx vite --port ${DEV_PORT} --strictPort)`);
}

/**
 * G3 (REPORT.md "Harness defects") — freshness must be read off the
 * INSTALLED BINARY on this specific simulator (`simctl get_app_container`),
 * not the host's `ios/App/App/capacitor.config.json`. That file is one
 * shared, global artifact of the last `cap sync` on this machine — with two
 * devices, building for device A leaves the host file saying "fresh" while
 * device B (never rebuilt) still has a stale or non-dev shell installed
 * (the tile sweep hit exactly this: a signed non-dev build with a
 * "Trevor" home screen on the iPad Air passed the old check because it was
 * never actually consulted for that device). `buildAndInstallShell` writes
 * `sim-stamp.json` into the built `.app` right after `xcodebuild`; this
 * reads it back from wherever THIS udid actually has it installed.
 */
function readInstalledStamp(udid) {
  let containerPath;
  try {
    containerPath = simctl("get_app_container", udid, BUNDLE_ID, "app").trim();
  } catch {
    return null; // not installed on this device
  }
  try {
    return JSON.parse(fs.readFileSync(path.join(containerPath, "sim-stamp.json"), "utf8"));
  } catch {
    return null; // installed, but no stamp (a manually-installed / non-dev / pre-G3 build)
  }
}

/** Pure half of the G3 freshness check, split out so `sim-capture.test.mjs`
 *  can pin the comparison without a live simulator (mirrors how
 *  `evaluateReport` is the pure half of the exit-code contract). */
export function isStampFresh(stamp, expectedDevServerUrl) {
  return Boolean(stamp) && stamp.devServerUrl === expectedDevServerUrl;
}

function shellIsFresh(udid) {
  const stamp = readInstalledStamp(udid);
  return isStampFresh(stamp, `${DEV_URL}/__sim`);
}

/**
 * Bonus finding while wiring up G5/G6 (not one of the six named defects,
 * but the same class — a capture that silently shows the WRONG content):
 * `simctl terminate` + `simctl launch` does NOT reliably force a fresh
 * `/__sim` boot. iOS/UIKit state restoration ("Saved Application State")
 * can resurrect the WKWebView's LAST navigation instead of the app cold-
 * booting into `CAP_DEV_SERVER`'s configured URL — confirmed live
 * (2026-09-16): after one real capture, a second `terminate`+`launch` with
 * a brand-new `/tmp/lingo-sim-target` still posted probe ticks with the
 * OLD route's `href` (sometimes — it was not even consistent run to run,
 * which is worse: an intermittent staleness bug). Deleting
 * `Library/Saved Application State/<bundleId>.savedState` from the app's
 * DATA container before every launch fixed it in the same live test.
 * Cheap (a directory delete, not a reinstall) and safe — best-effort, a
 * missing directory (first-ever launch) is not an error.
 */
function clearSavedAppState(udid) {
  try {
    const dataContainer = simctl("get_app_container", udid, BUNDLE_ID, "data").trim();
    const savedState = path.join(dataContainer, "Library", "Saved Application State", `${BUNDLE_ID}.savedState`);
    fs.rmSync(savedState, { recursive: true, force: true });
  } catch { /* not installed yet, or no saved state to clear — fine */ }
}

function gitRevShort() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
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
  // G3: stamp the bundle with what dev server it was built against, BEFORE
  // install, so shellIsFresh can read it back per-device via
  // `simctl get_app_container` instead of trusting the host's shared
  // capacitor.config.json.
  const stamp = { builtAt: new Date().toISOString(), devServerUrl: `${DEV_URL}/__sim`, gitRev: gitRevShort() };
  fs.writeFileSync(path.join(app, "sim-stamp.json"), JSON.stringify(stamp, null, 2));
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

/** `WxH` (e.g. "1180x820") — G5's literal `--viewport WxH` emulation form.
 *  Pure. Returns null for a named device key like "15-pro-max". */
export function parseEmulatedSize(v) {
  const m = /^(\d+)x(\d+)$/i.exec(String(v ?? ""));
  return m ? { w: Number(m[1]), h: Number(m[2]) } : null;
}

export function parseArgs(argv) {
  const route = arg(argv, "route", DEFAULT_ROUTE);
  const fontScale = Number(arg(argv, "font-scale", "100"));
  const viewportArg = arg(argv, "viewport", "15-pro-max");
  const emulatedSize = parseEmulatedSize(viewportArg);
  // When --viewport is a literal WxH, the PHYSICAL simulator to boot comes
  // from --device (default 15-pro-max) instead — the emulation still runs
  // inside a real booted simulator, it just lies to the page about its CSS
  // viewport size (see G5 doc comment on applyViewportEmulationFromUrl).
  const viewportKey = emulatedSize ? arg(argv, "device", "15-pro-max") : viewportArg;
  const allowFallbackFont = Boolean(arg(argv, "allow-fallback-font", false));
  const waitMs = Number(arg(argv, "wait", "13")) * 1000; // probe ticks run to 12000ms
  const overReportBudget = Number(arg(argv, "over-report-budget", "40"));
  const strictProse = Boolean(arg(argv, "strict-prose", false));
  // "landscape" with no explicit --viewport WxH: swap the named device's
  // own CSS dims (real rotation attempted first, emulation on fallback).
  const orientationArg = arg(argv, "orientation", "portrait");
  const tapSelector = arg(argv, "tap", null);
  const answerFirstOption = Boolean(arg(argv, "answer-first-option", false));
  const seedProfile = arg(argv, "seed", "fresh");
  const keepDevServer = Boolean(arg(argv, "keep-dev-server", false));
  // PHASE2A.md §6.7 lane isolation:
  const validationMaxAttempts = Number(arg(argv, "validation-max-attempts", "3"));
  // Internal proof-hook (see docs "Sim capture" §"Proving the validator can
  // fail"): validate against a DIFFERENT expected font scale than the one
  // actually requested/applied, so a real, honest capture deliberately
  // fails validation — e.g. `--font-scale 100 --expect-font-scale 125`
  // requests 100% but tells the validator to expect 125%.
  const expectFontScaleArg = arg(argv, "expect-font-scale", null);
  const expectFontScale = expectFontScaleArg == null ? fontScale : Number(expectFontScaleArg);
  return {
    route, fontScale, viewportKey, allowFallbackFont, waitMs, overReportBudget, strictProse,
    orientationArg, emulatedSize, tapSelector, answerFirstOption, seedProfile, keepDevServer,
    validationMaxAttempts, expectFontScale,
  };
}

/** G5 (REPORT.md "Harness defects") — try a REAL orientation change before
 *  ever falling back to emulation. `xcrun simctl` has no orientation
 *  subcommand; the one geometry knob it exposes,
 *  `simctl io <device> screenConfig geometry <w>x<h>`, was tried against
 *  the booted iPad Air 11" M4 with its real pixel dims swapped
 *  (2360x1640) and failed with "No mode found that supports size" — it
 *  picks a different device's screen MODE, it does not rotate the current
 *  one. `notifyutil`/`defaults write` run on the HOST, not inside the
 *  guest's minimal sandbox that `simctl spawn` executes in, so neither
 *  applies to a Capacitor shell either. Kept as a real, honest attempt
 *  (not skipped) so a future simctl that adds real rotation is picked up
 *  automatically; logs and returns false today.
 */
function tryRealRotation(udid, viewport) {
  try {
    const swapped = `${viewport.h * viewport.dpr}x${viewport.w * viewport.dpr}`;
    simctl("io", udid, "screenConfig", "geometry", swapped);
    return true;
  } catch (err) {
    console.warn(`real rotation via simctl screenConfig geometry failed (expected — see tryRealRotation doc comment): ${String(err.stderr || err.message || err).trim().split("\n")[0]}`);
    return false;
  }
}

async function main() {
  const {
    route, fontScale, viewportKey, allowFallbackFont, waitMs, overReportBudget, strictProse,
    orientationArg, emulatedSize, tapSelector, answerFirstOption, seedProfile, keepDevServer,
    validationMaxAttempts, expectFontScale,
  } = parseArgs(process.argv.slice(2));
  const viewport = VIEWPORTS[viewportKey];
  if (!viewport) {
    console.error(`unknown --viewport/--device ${viewportKey}; known: ${Object.keys(VIEWPORTS).join(", ")}`);
    process.exit(2);
  }

  // G5: resolve orientation + whether emulation is in play.
  let orientation = "portrait";
  let emuW = null;
  let emuH = null;
  if (emulatedSize) {
    orientation = emulatedSize.w >= emulatedSize.h ? "emulated-landscape" : "emulated-portrait";
    emuW = emulatedSize.w;
    emuH = emulatedSize.h;
  } else if (orientationArg === "landscape") {
    orientation = "landscape"; // optimistic — downgraded to emulated-landscape below if the real attempt fails
  }

  console.log(`booting ${viewport.device}…`);
  const dev = await ensureBooted(viewport.device);

  if (orientation === "landscape") {
    const rotated = tryRealRotation(dev.udid, viewport);
    if (!rotated) {
      orientation = "emulated-landscape";
      emuW = viewport.h;
      emuH = viewport.w;
      console.log(`real rotation unavailable — falling back to --viewport WxH emulation (${emuW}x${emuH}, CLEARLY marked emulated-landscape)`);
    }
  }

  console.log(`ensuring dev server on :${DEV_PORT}…`);
  await ensureDevServer({ keepExisting: keepDevServer });

  if (!shellIsFresh(dev.udid)) {
    buildAndInstallShell(dev.udid);
  } else {
    console.log("app shell already installed and wired to this dev server — skipping build");
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(PROBE_LOG), { recursive: true });

  // A tap sequence needs an extra ~2.3s (1500ms pre-measure + 800ms
  // post-click settle, see simProbe.ts's runTapSequence) before the LAST
  // scheduled tick (12000ms) can carry its result — bump the default wait
  // so --tap/--answer-first-option captures aren't cut short.
  const effectiveWaitMs = tapSelector || answerFirstOption ? Math.max(waitMs, 15000) : waitMs;
  // The window the GLOBAL launch lock (PHASE2A.md §6.7 item 2) actually
  // needs to cover: write target file → terminate → clear state → launch →
  // enough settle time for the app's own GET /__sim to land and read the
  // file we just wrote, before the OTHER device's run is allowed to
  // overwrite it. Short relative to effectiveWaitMs, so two devices still
  // spend most of a capture running in parallel.
  const LAUNCH_SETTLE_MS = 3000;

  const slug = captureSlug(route, fontScale, { viewportKey, orientation });
  const expected = {
    route, fontScale: expectFontScale, viewportKey, viewport, emulated: Boolean(emuW && emuH), emuW, emuH,
  };

  let reports = [];

  const releaseDeviceLock = await acquireAdvisoryLock(dev.udid);
  let outcome;
  try {
    outcome = await runWithValidationRetry({
      maxAttempts: validationMaxAttempts,
      sleepFn: sleep,
      attemptFn: async (attempt) => {
        const runNonce = randomUUID();
        const targetRoute = buildTargetRoute(route, { fontScale, emuW, emuH, tapSelector, answerFirstOption, seedProfile, runNonce });

        const sinceLine = countLines(PROBE_LOG);
        const releaseLaunchLock = await acquireAdvisoryLock(LAUNCH_LOCK_KEY, { timeoutMs: 60000 });
        try {
          fs.writeFileSync(TARGET_FILE, targetRoute);
          try {
            simctl("terminate", dev.udid, BUNDLE_ID);
          } catch { /* not running */ }
          clearSavedAppState(dev.udid);
          simctl("launch", dev.udid, BUNDLE_ID);
          console.log(`[attempt ${attempt}/${validationMaxAttempts}] launched at ${targetRoute} (runNonce=${runNonce})`);
          await sleep(Math.min(LAUNCH_SETTLE_MS, effectiveWaitMs));
        } finally {
          releaseLaunchLock();
        }

        const remainingWaitMs = effectiveWaitMs - Math.min(LAUNCH_SETTLE_MS, effectiveWaitMs);
        if (remainingWaitMs > 0) {
          console.log(`waiting ${remainingWaitMs}ms more for the probe ticks…`);
          await sleep(remainingWaitMs);
        }

        const attemptScreenshotFile = path.join(OUT_DIR, `${slug}.attempt${attempt}.png`);
        simctl("io", dev.udid, "screenshot", attemptScreenshotFile);

        reports = readNewReports(PROBE_LOG, sinceLine);
        const report = reports.length > 0 ? reports[reports.length - 1] : null;
        return { report, targetRoute, runNonce, attemptScreenshotFile };
      },
      validateFn: (result) => validateCapture(result.report, { ...expected, runNonce: result.runNonce }),
      onMismatch: (validation, attempt) => {
        console.warn(`VALIDATION MISMATCH (attempt ${attempt}/${validationMaxAttempts}): ${validation.mismatches.join("; ")}`);
        if (attempt < validationMaxAttempts) console.log(`retrying in ${attempt * 2000}ms…`);
      },
    });
  } finally {
    releaseDeviceLock();
  }

  const { report, targetRoute } = outcome.result;
  const validation = outcome.validation;
  if (validation.ok) {
    // Promote the WINNING attempt's screenshot to the canonical filename —
    // a canonical file only ever exists for a VALIDATED capture.
    fs.copyFileSync(outcome.result.attemptScreenshotFile, path.join(OUT_DIR, `${slug}.png`));
  }

  const screenshotFile = path.join(OUT_DIR, `${slug}.png`);
  const jsonFile = path.join(OUT_DIR, `${slug}.json`);
  fs.writeFileSync(
    jsonFile,
    JSON.stringify({
      route, fontScale, viewport: viewportKey, orientation, emulated: Boolean(emuW && emuH),
      device: viewport.device, seedProfile, tapSelector, answerFirstOption, targetRoute,
      validation, capturedAt: new Date().toISOString(),
      screenshot: validation.ok ? screenshotFile : null, report, allReports: reports,
    }, null, 2)
  );

  if (!validation.ok) {
    console.error("");
    console.error(`FAIL: capture never validated after ${validationMaxAttempts} attempt(s):`);
    for (const m of validation.mismatches) console.error(`FAIL:   ${m}`);
    console.error(`wrote ${jsonFile} (no canonical screenshot promoted — see ${slug}.attempt*.png in ${OUT_DIR})`);
    process.exit(1);
  }

  console.log("");
  console.log(formatSummaryTable(report, { route, fontScale, viewport: viewportKey }));
  if (orientation.startsWith("emulated")) {
    console.log(`  orientation=${orientation} (LAYOUT emulation via meta-viewport — the screenshot is still a physical PORTRAIT photo; see docs "emulated-landscape")`);
  }
  if (report?.tapResult) {
    console.log(`  tapResult: tapped=${report.tapResult.tapped} selector=${report.tapResult.tapSelector ?? "(first option)"}`);
    console.log(`    cta   pre=${JSON.stringify(report.tapResult.pre.cta)}`);
    console.log(`    cta  post=${JSON.stringify(report.tapResult.post.cta)}`);
  }
  console.log("");
  console.log(`wrote ${jsonFile}`);
  console.log(`wrote ${screenshotFile}`);

  const verdict = evaluateReport(report, { overReportBudget, allowFallbackFont, strictProse });
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
