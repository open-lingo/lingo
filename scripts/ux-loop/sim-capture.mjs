#!/usr/bin/env node
// iOS Simulator capture — REAL WebKit, real safe areas, real fonts.
//
// ONE command, per docs/mobile-testing-setup-2026-08-06.md "Sim capture
// (2026-09-15)":
//
//   npm run sim:capture -- --route "/ja/learn/lessons/ja-m34-neo-3?step=16" \
//     --font-scale 125 [--viewport 15-pro-max|ipad-air|<W>x<H>] [--device <key>] \
//     [--allow-fallback-font] [--strict-prose] [--orientation portrait|landscape] \
//     [--allow-emulated-landscape] [--tap <selector>] [--answer-first-option] \
//     [--simulate build [--tap-interval <ms>] [--max-taps <n>] [--frame-burst] \
//       [--enforce-bank-visible]] \
//     [--seed fresh|m10-complete|kanji-mastered] [--keep-dev-server] \
//     [--compare-baseline | --update-baseline]
//
// --- Pixel baseline diff (2026-09-17, lane A5b) --------------------------
// `--compare-baseline` crops the settled screenshot to `[data-lesson-stage]`
// and diffs it (odiff-bin, antialiasing-tolerant) against the committed
// baseline at `tests/visual/baselines/<slug>.png`, printing `pixelDiff=<pct>
// threshold=<pct> PASS|FAIL` and exiting non-zero on FAIL (diff image
// written next to the capture). `--update-baseline` overwrites the baseline
// with the current crop instead of diffing — only after a ledgered visual
// change, never to silence a real FAIL. See the doc comment above
// `compareToBaseline` and docs/mobile-sizing-spec.md §9 for the threshold's
// derivation. `--enforce-bank-visible` (build-simulation only) promotes the
// otherwise-informational `bankVisible` verdict (P1b open item 2 — how much
// of the bank sits behind the sticky CTA at rest) to a real exit-code gate.
//
// --- `--simulate build` (2026-09-17, USER SIMULATION) -------------------
// Founder, three TestFlight rounds running: "the tiles resize while I build
// the sentence… you need a better way to QA this — USER SIMULATION." A
// single `--tap <selector>` only ever taps ONE tile and missed two real
// defects that only show up across SEVERAL taps: the tray's tiles changing
// size the moment it gains its first row, and a placed tray tile rendering
// at a different font size than its own bank sibling. `--simulate build`
// (`--tap-interval <ms>`, default 450) taps bank tiles in turn like a
// learner placing the whole sentence, sampling geometry before the first
// tap and after each one; the report's `simulation: { mode: "build", taps,
// samples, verdicts }` and the printed per-tap table + PASS/FAIL verdict
// lines are this mode's deliverable — see
// `computeBuildVerdicts`/`formatBuildTable` below and `runBuildSimulation`
// in `src/shared/dev/simProbe.ts`. Exits non-zero with `USER-SIM FAIL: …`
// (`formatBuildVerdictFailure`) on any failing verdict, same contract style
// as every other exit-code path in this file.
//
// `--max-taps <n>` DEFAULTS to the real answer length (`resolveAnswerLen`,
// task A, 2026-09-17): the runtime pads a bank with distractor tiles (a
// 6-tile answer can ship a 10-tile bank), so tapping EVERY bank tile grows
// the tray past its reserved rows and fails verdicts for a state no real
// learner is ever in. An explicit `--max-taps N` always overrides
// (including N > answerLen, for a deliberate over-placement study); when
// the answer length can't be resolved (unknown route shape, lesson not
// found, non-build step, …) this falls back to the old default of 20 and
// says so. `formatBuildTable`/`computeBuildVerdicts` label/exclude taps
// past the resolved answerLen as over-placement — see their own doc
// comments (task B).
//
// `--frame-burst` (task D, 2026-09-17) opts BACK into the pre-2026-09-17
// multi-shot-per-tap screenshot behavior (`SCREENSHOT_BURST_MS` window,
// `--tap-interval`-paced fixed cadence in the browser). The DEFAULT is now
// exactly ONE screenshot per tap, taken after that tap's own frame trace
// reports stable (or `--tap-interval`, whichever is later) — the OLD
// default's 700ms burst window per tap was longer than the tap cadence
// itself, so the Node-side capture loop silently fell 2.8-5.2s behind the
// browser's own taps (confirmed live: a "tap 10" contact sheet on
// `ja-m15-neo-6?step=15` showed the SAME bytes as "tap 16"'s). See
// `waitAndCaptureBuildTapShots`/`composeRunContactSheet` below and
// `runBuildSimulation`/`computeNextTapDelayMs` in `simProbe.ts`. Every tap's
// settled shot is composed into ONE contact sheet per run
// (`<slug>.taps.jpg`, ordered tap 0..N) instead of one sheet per tap.
//
// It boots the simulator if needed, ensures the dev server on :5399 is
// running WITH `VITE_NATIVE=true` (restarting a reused server that isn't —
// G1, see `ensureDevServer`/`isDevServerNative`), builds/installs the
// CAP_DEV_SERVER app shell only when the INSTALLED BINARY's own build stamp
// says it's stale — either the dev server URL it was built against no
// longer matches, OR a content hash of the native inputs (every `*.swift`
// file under `ios/App/App` except `ios/App/App/public` — that's the WEB
// bundle, a different freshness axis — plus `Info.plist`,
// `App.xcodeproj/project.pbxproj`, and `capacitor.config.ts`) no longer
// matches what the installed shell was built from, so a native-only edit
// (e.g. an `AppDelegate`/`SceneDelegate` change) forces a rebuild too
// (G3, see `shellIsFresh`/`readInstalledStamp`/`computeNativeHash`), launches
// the app at `--route` with the accessibility font-size slider pre-set to
// `--font-scale` percent, an optional `--seed` learner-state profile, an
// optional `--tap`/`--answer-first-option` post-mount click, and an
// optional `--viewport WxH` layout emulation. `--orientation landscape`
// does a REAL device rotation before launching the app — see "Real device
// rotation" below — and, unless `--allow-emulated-landscape` is also
// passed, FAILS LOUDLY rather than silently degrading to the `--viewport
// WxH` meta-viewport LAYOUT emulation (G5) if that rotation doesn't stick.
// A capture's `orientation` field distinguishes real `"landscape"` from the
// honest `"emulated-landscape"` fallback so a reader never mistakes one for
// the other.
//
// --- Real device rotation (2026-09-16) ---------------------------------
// In-app orientation forcing is DEAD on iPadOS 26.5/Xcode 27.0 — a
// Debug-only, env-gated `SimOrientationOverride` used to live in
// `ios/App/App/SceneDelegate.swift`, driven by
// `SIMCTL_CHILD_OL_SIM_ORIENTATION`; `UIWindowScene.requestGeometryUpdate`
// refuses with "The current windowing mode does not allow for programmatic
// changes to interface orientation" (a confirmed OS-level restriction, not
// a bug here — see Apple Developer Forums threads 715358/802210). It has
// been REMOVED (see git history if you need it back).
//
// What actually works: setting `XCUIDevice.shared.orientation` from INSIDE
// an XCUITest rotates the simulated DEVICE (SpringBoard), not just that
// test's own host app — the same community trick `fastlane snapshot` uses
// (openradar 41005006; Apple Developer Forums 12437/53315). The rotator
// lives at `scripts/ux-loop/sim-rotate/` (a standalone `Rotator.xcodeproj`
// with an empty host app + a `RotatorUITests` XCUITest that reads
// `ROTATE_TO` from its environment, sets `XCUIDevice.shared.orientation`
// twice with a settle between — openradar 45094683 documents a first-
// rotation-after-boot flake — and exits). `rotateDevice()` below drives it:
// `xcodebuild test`/`test-without-building` with `TEST_RUNNER_ROTATE_TO=…`
// set as a REAL PROCESS ENVIRONMENT VARIABLE on the xcodebuild invocation
// (NOT a trailing `KEY=value` xcodebuild argument — that form is a build-
// setting override, shows up in the build log, and is silently never
// forwarded to the running test process; confirmed live 2026-09-16 by
// dumping `ProcessInfo.processInfo.environment` inside the test).
//
// The other live landmine: by default `xcodebuild test` clones the target
// simulator ("Clone 1 of iPad Air 11-inch (M4)") into a SEPARATE device set
// (`~/Library/Developer/XCTestDevices`, `simctl --set testing …`) and rotates
// the CLONE — the harness's actual persistent simulator never moves, and the
// clone is discarded when the test ends, so the whole exercise would be a
// silent no-op. `-parallel-testing-enabled NO` (undocumented in `man
// xcodebuild` but confirmed live) makes it target the destination UDID
// directly — no clone, verified via `simctl io <udid> screenshot` framebuffer
// dims (1640x2360 portrait ↔ 2360x1640 landscape) immediately after the test
// action returns, before the simulator's own idle-shutdown can kick in.
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
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
// Pixel baseline diff (2026-09-17, lane A5b) — see the doc comment above
// `evaluatePixelDiff`. SIMD native binary, exact-pinned in package.json (not
// `^`) so a diff's meaning can't shift under an unrelated `npm install`.
import { compare as odiffCompare } from "odiff-bin";

export const BUNDLE_ID = "com.linguiversal.app";
// `SIM_DEV_PORT` (2026-09-17, lane A2d): the lane-common brief says
// "sim-capture accepts a dev-server option" — checked, it did NOT (this
// was hardcoded); concurrent lanes share ONE simulator + dev server on
// :5399, and a lane whose own worktree's code differs from whoever else
// is running a capture right now needs its OWN server instead of
// restarting the shared one out from under them. An env var (not a new
// `--dev-server-port` CLI flag) so every existing internal reference to
// the `DEV_PORT`/`DEV_URL` constants keeps working unchanged — default
// (unset) is still 5399, the exact prior behavior.
export const DEV_PORT = Number(process.env.SIM_DEV_PORT) || 5399;
export const DEV_URL = `http://localhost:${DEV_PORT}`;
export const TARGET_FILE = "/tmp/lingo-sim-target";
export const PROBE_LOG = "artifacts/ux-loop/sim-probe.jsonl";
export const OUT_DIR = "artifacts/ux-loop/sim-capture";
// Cropped-to-stage PNG baselines, committed to git (`artifacts/` is
// gitignored, so baselines can't live there) — see docs/mobile-sizing-spec.md
// §9 for the flow and `baselineFilename` for the naming rule.
export const BASELINE_DIR = "tests/visual/baselines";
// Pseudo-device key for the GLOBAL launch-critical-section lock — see the
// "Lane isolation" doc comment above. Not a real simulator udid, so it can
// never collide with `acquireAdvisoryLock("<real-udid>", …)`.
export const LAUNCH_LOCK_KEY = "__launch__";

// Real device rotation — see the "Real device rotation" doc comment above.
export const ROTATOR_DIR = path.resolve("scripts/ux-loop/sim-rotate");
export const ROTATOR_PROJECT = path.join(ROTATOR_DIR, "Rotator.xcodeproj");
export const ROTATOR_DD = path.resolve("artifacts/ux-loop/sim-rotate-dd");
export const ROTATOR_STAMP = path.join(ROTATOR_DD, "build-stamp.json");
export const ROTATOR_SOURCES = [
  path.join(ROTATOR_PROJECT, "project.pbxproj"),
  path.join(ROTATOR_DIR, "Rotator", "RotatorApp.swift"),
  path.join(ROTATOR_DIR, "RotatorUITests", "RotatorUITests.swift"),
];

export const VIEWPORTS = {
  "15-pro-max": { device: "OL-15ProMax", w: 430, h: 932, dpr: 3 }, // 2026-09-16: the stock "iPhone 15 Pro Max" (ADE91F3B) carries stale SpringBoard state that pops `Open in "Open Lingo"?` over every shot; OL-15ProMax (942D8E54) is the same model, clean
  "ipad-air": { device: "iPad Air 11-inch (M4)", w: 820, h: 1180, dpr: 2 },
};

/** Golden-learner replay (2026-09-17, lane A2d) — does a "WxH" string
 *  (`sessionLog.ts`'s recorded `window.innerWidth x window.innerHeight`)
 *  match a KNOWN named device's own CSS size? Returns the device key
 *  (`"15-pro-max"`, ...) or `null`. Pure. See the doc comment where this is
 *  called in `main()` for why a match matters (native replay vs `--viewport
 *  WxH` LAYOUT emulation, which zeroes real safe-area insets). */
export function findNamedViewport(wxh) {
  for (const [key, v] of Object.entries(VIEWPORTS)) {
    if (`${v.w}x${v.h}` === String(wxh)) return key;
  }
  return null;
}

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
    return { ok: false, exitCode: 1, reasons, warnings, collapsed: 0 };
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
  // Task C (2026-09-17): on a huge bank (≥12 tiles), a spent bank tile
  // collapses to zero width after 350ms (`useHugeBankCollapse`,
  // `data-collapse="done"` on `[data-tile]`; `"pending"` = the collapse
  // ANIMATION is still in flight, same zero-meaning geometry). A collapsing/
  // collapsed tile's shrinking box measures as "clipped" for a state no
  // learner ever reads — confirmed live: 10 of them flagged on
  // `/ja/learn/lessons/ja-m15-neo-6?step=15`. Excluded from `clipped`/
  // overhang here; counted separately as `collapsed` instead of silently
  // dropped, so a reader can still see how many were skipped.
  const collapsedTiles = tiles.filter((t) => t.collapsed === true);
  const clipped = tiles.filter((t) => t.clipped && t.collapsed !== true);
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
  if (collapsedTiles.length > 0) {
    warnings.push(
      `collapsed=${collapsedTiles.length} spent huge-bank tile(s) excluded from clip/overhang checks (data-collapse done/pending — a real learner never reads this geometry)`
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

  return { ok: reasons.length === 0, exitCode: reasons.length === 0 ? 0 : 1, reasons, warnings, collapsed: collapsedTiles.length };
}

// ---------------------------------------------------------------------------
// `--simulate build` — pure JUDGMENT over the raw per-tap samples
// `src/shared/dev/simProbe.ts`'s `runBuildSimulation` collects and posts as
// `report.simulation.samples` (+ `report.simulation.layoutTrace`). Same
// split as `evaluateReport` above: the browser only COLLECTS (tiles,
// samples), this file JUDGES — keeps the pass/fail contract pinned here,
// testable without a live simulator, same as everything else in this
// section.
// ---------------------------------------------------------------------------

/**
 * @param {any[]} samples `report.simulation.samples` — each `{ tap, h2Top,
 *   trayTop, trayH, bankTop, bankH, stageH, stageTop, rowH, fitScale, tray,
 *   bank }`, `tray`/`bank` being `{ count, fontPxMin, fontPxMax, boxHMin,
 *   boxHMax, fitScaleMin, fitScaleMax }` (see `computeGroupMetrics` in
 *   simProbe.ts).
 * @param {{ layoutTrace?: any, fontTolerancePx?: number, rowHTolerancePx?: number, h2TolerancePx?: number, fitScaleTolerance?: number, stageBudgetPx?: number }} [opts]
 */
/**
 * Task B (2026-09-17, over-placement): re-derives `layoutTrace.maxH2Jump`/
 * `h2Reversals` from only the `changed` frames within `[0, windowMs]` of
 * trace-start, using the SAME algorithm `recordLayoutTrace` (layoutTrace.ts)
 * already runs browser-side over the whole trace — mirrored here by hand
 * (no shared module crosses the browser/Node boundary in this harness, same
 * established pattern as `SCREENSHOT_BURST_MS`/`FRAME_TRACE_MAX_MS`). The
 * trace and the tap loop start at the same moment (`runBuildSimulation`
 * starts `recordLayoutTrace` immediately before its tap loop), so a frame's
 * `t` is directly comparable to `answerLen * tapIntervalMs` — an
 * approximation of "the last real-answer tap's boundary", not an exact tap
 * timestamp (real tap timing jitters around the nominal interval), but
 * conservative in the direction that matters: it only ever ADDS a few
 * trailing over-placement-tap frames to the window, never drops a
 * real-answer frame early.
 */
export function recomputeFlickerWithinWindow(trace, windowMs) {
  const frames = Array.isArray(trace?.changed) ? trace.changed : [];
  const windowed = typeof windowMs === "number" ? frames.filter((f) => typeof f?.t === "number" && f.t <= windowMs) : frames;
  let maxH2Jump = 0;
  let h2Reversals = 0;
  let prevH2 = null;
  let prevDir = 0;
  for (const f of windowed) {
    const h2Top = typeof f?.h2Top === "number" ? f.h2Top : null;
    if (h2Top === null) continue;
    if (prevH2 !== null) {
      const d = h2Top - prevH2;
      maxH2Jump = Math.max(maxH2Jump, Math.abs(d));
      const dir = d > 0.5 ? 1 : d < -0.5 ? -1 : 0;
      if (dir !== 0 && prevDir !== 0 && dir !== prevDir) h2Reversals += 1;
      if (dir !== 0) prevDir = dir;
    }
    prevH2 = h2Top;
  }
  return { maxH2Jump: Math.round(maxH2Jump * 10) / 10, h2Reversals };
}

export function computeBuildVerdicts(samples, opts = {}) {
  const list = Array.isArray(samples) ? samples : [];
  const fontTolerancePx = opts.fontTolerancePx ?? 0.5;
  const rowHTolerancePx = opts.rowHTolerancePx ?? 0.5;
  const h2TolerancePx = opts.h2TolerancePx ?? 0.5;
  const fitScaleTolerance = opts.fitScaleTolerance ?? 0.005;
  const stageBudgetPx = opts.stageBudgetPx ?? 1;
  // Task B: `h2Stable`/`fitScaleStable`/`rowHStable`/`noFlicker` are the
  // verdicts that depend on TRAY GROWTH — a tap past the real answer length
  // (over-placement) grows the tray past its reserved rows and fails these
  // for a state no real learner is ever in. Restricted to `tap <=
  // answerLen` when `answerLen` is known; `null`/`undefined` (unresolved —
  // see `resolveAnswerLen`) means "no restriction", the exact prior
  // behavior. `trayBankFontEqual`/`stageFits` are NOT restricted — they
  // check per-tap invariants (a placed tile's own font, the bank's own
  // stage-boundary), not growth stability, so an over-placement tap is
  // still a real state to hold them to.
  const answerLen = typeof opts.answerLen === "number" && Number.isFinite(opts.answerLen) ? opts.answerLen : null;
  const stabilityList = answerLen === null ? list : list.filter((s) => typeof s?.tap === "number" && s.tap <= answerLen);

  // "Never changes after tap 0": every sample after the first compared
  // against the FIRST sample's value (not consecutive-pair deltas) — a
  // value that drifts away and back would still be a real regression a
  // consecutive-pair check could miss.
  const stability = (pick, tolerance) => {
    if (stabilityList.length === 0) return { ok: true, badTaps: [] };
    const baseline = pick(stabilityList[0]);
    const badTaps = [];
    for (let i = 1; i < stabilityList.length; i++) {
      const v = pick(stabilityList[i]);
      const changed =
        baseline === null || baseline === undefined
          ? v !== null && v !== undefined
          : v === null || v === undefined || Math.abs(v - baseline) > tolerance;
      if (changed) badTaps.push(stabilityList[i].tap);
    }
    return { ok: badTaps.length === 0, badTaps };
  };

  /* ── AN UNSAMPLED FIELD IS N/A, NOT PASS (C4, build 25 / P1b) ─────────
     `stability()` on a field no sample carries compares `null` against
     `null` seven times and returns `{ ok: true }` — a green check that
     cannot fail. That is exactly what `h2Stable` had been doing on every
     `listening_build` route since the verdict was written: that view
     renders no `<h2>`, so the "the prompt never moved" claim was made
     about an element that was never there. P1 made the two build-25
     verdicts SAY so in `detail`; they still printed PASS. They now carry
     `na: true`, the printed line reads `N/A`, and `formatBuildVerdictFailure`
     still ignores them (an absent field is not a failure — it is a claim
     the run is not entitled to make).

     `sampled` is "some windowed sample carries a number for this field",
     which is the honest test: a field present on tap 0 and gone by tap 3
     is a real regression and must stay a FAIL, not become N/A. */
  const sampledSomewhere = (pick) => stabilityList.some((s) => typeof pick(s) === "number");
  const na = (name, verdict, sampled) =>
    sampled ? verdict : { ...verdict, na: true, detail: `${name} not sampled in any tap` };
  const stabilityOf = (name, pick, tolerance) =>
    na(name, stability(pick, tolerance), sampledSomewhere(pick));

  const fitScaleStable = stabilityOf("fitScale", (s) => s.fitScale, fitScaleTolerance);
  const rowHStable = stabilityOf("rowH", (s) => s.rowH, rowHTolerancePx);
  const h2Stable = stabilityOf("h2Top", (s) => s.h2Top, h2TolerancePx);

  /* ── NOTHING MOVES WHILE THE LEARNER BUILDS (build 25, 2026-09-17) ─────
     The lead's ruling after #184/#185: "nothing on screen may move or resize
     between the learner's first tap and the last tap of the answer, at 100%
     and 125%". `fitScaleStable`/`rowHStable` cover RESIZE; these two cover
     MOVE, at the 1px tolerance he stated:
       promptStable  — the prompt heading's own rect top (`promptTop`, read
         by simProbe off the same `<h2>`; `h2Stable` above reads it through
         `layoutTrace.sampleLayout()` at 0.5px and stays as it was).
       chromeStable  — the two ends of the column around the tray: the bank's
         top and the bottom-anchored CTA block's top. A tray that grows
         pushes the bank down without touching the prompt, and a stage that
         starts scrolling moves all three at once, so neither number is
         implied by the other.
     Windowed to `tap <= answerLen` for the same reason the other growth
     verdicts are: an over-placement tap grows the tray past its reservation
     and moves everything for a state no real learner is ever in.

     A FIELD NO SAMPLE CARRIES IS N/A, NOT PASS (C4) — see the `na` helper
     above. `promptStable` is the "nothing moves" verdict for the prompt on
     EVERY route (the view marks its element `data-lesson-prompt` for
     exactly that reason, even a `build_sentence` one that also has an
     `<h2>`). 2026-09-17 (lane A5b, P1b open item 3): `h2Stable` used to be
     N/A on a `listening_build` route (`layoutTrace.ts` read `<h2>` only,
     and that view renders none) — `layoutTrace.ts`'s own selector was
     widened to `"h2, [data-lesson-prompt]"` to match this file's, so
     `h2Stable`/`noFlicker` are now LIVE there too, not N/A. The two
     verdicts stay separate on purpose (`h2Stable` goes through the shared
     `layoutTrace.ts` module at 0.5px; `promptStable` is this file's own
     1px reading, independent of it) even though they read the same element
     today. */
  const promptTolerancePx = opts.promptTolerancePx ?? 1;
  const chromeTolerancePx = opts.chromeTolerancePx ?? 1;

  const promptStable = stabilityOf("promptTop", (s) => s?.promptTop, promptTolerancePx);
  const bankTopStable = stability((s) => s.bankTop, chromeTolerancePx);
  const ctaTopStable = stability((s) => s.ctaTop, chromeTolerancePx);
  const chromeBadTaps = [...new Set([...bankTopStable.badTaps, ...ctaTopStable.badTaps])].sort(
    (a, b) => a - b,
  );
  const chromeStable = na(
    "bankTop/ctaTop",
    { ok: chromeBadTaps.length === 0, badTaps: chromeBadTaps },
    sampledSomewhere((s) => s?.bankTop) && sampledSomewhere((s) => s?.ctaTop),
  );

  // Only evaluated at samples where BOTH groups actually have a tile to
  // compare (a fully-drained bank has nothing left to disagree with the
  // tray about) — the b23 defect this exists to catch: a placed tray tile
  // rendering smaller than its own bank sibling.
  //
  // A FIELD NO SAMPLE CARRIES IS N/A, NOT PASS (C4, vacuity sweep
  // 2026-09-17, lane A5c): both loops below `continue` past every sample
  // whose shape doesn't carry the fields being compared, so an empty
  // `samples` array — or a route whose probe never posts `tray`/`bank`/
  // `stageTop` at all — left `trayBankFontEqual`/`stageFits` at their
  // just-initialized `{ ok: true, badTaps: [] }`: a verdict that had never
  // actually compared anything, printing PASS. Confirmed live:
  // `computeBuildVerdicts([])` returned `trayBankFontEqual.ok === true` /
  // `stageFits.ok === true` with no `na` flag before this fix — exactly the
  // pattern `h2Stable`/`noFlicker` had on `listening_build` (P1b). `evaluated`
  // counts samples that actually reached the comparison (not just bad ones),
  // matching `sampledSomewhere` above; unlike the `stabilityOf` verdicts,
  // these two are unwindowed (`list`, not `stabilityList`) to match their
  // existing over-placement-inclusive behavior.
  let trayBankEvaluated = 0;
  const trayBankBadTaps = [];
  for (const s of list) {
    const tray = s?.tray;
    const bank = s?.bank;
    if (!tray || !bank || !tray.count || !bank.count) continue;
    if (typeof tray.fontPxMax !== "number" || typeof bank.fontPxMax !== "number") continue;
    trayBankEvaluated += 1;
    if (Math.abs(tray.fontPxMax - bank.fontPxMax) > fontTolerancePx) trayBankBadTaps.push(s.tap);
  }
  const trayBankFontEqual = na(
    "tray/bank fontPxMax",
    { ok: trayBankBadTaps.length === 0, badTaps: trayBankBadTaps },
    trayBankEvaluated > 0
  );

  // bankTop + bankH must never exceed the stage's own visible bottom
  // (stageTop + stageH) — a bank row spilling under the CTA/stage floor.
  let stageFitsEvaluated = 0;
  const stageFitsBadTaps = [];
  for (const s of list) {
    if (
      typeof s?.stageTop !== "number" ||
      typeof s?.stageH !== "number" ||
      typeof s?.bankTop !== "number" ||
      typeof s?.bankH !== "number"
    ) {
      continue;
    }
    stageFitsEvaluated += 1;
    const budgetBottom = s.stageTop + s.stageH;
    const actualBottom = s.bankTop + s.bankH;
    if (actualBottom > budgetBottom + stageBudgetPx) stageFitsBadTaps.push(s.tap);
  }
  const stageFits = na(
    "stageTop/stageH/bankTop/bankH",
    { ok: stageFitsBadTaps.length === 0, badTaps: stageFitsBadTaps },
    stageFitsEvaluated > 0
  );

  /* ── bankVisible (P1b open item 2, 2026-09-17) ────────────────────────
     P1b left `stageFits` as "the honest version's stand-in": it compares
     the bank's bottom against the STAGE box's bottom, which extends behind
     the sticky CTA — so it can only fail when a route never fitted at all
     (every tap including tap 0), not the real question, "can the learner
     see the rest of their own answer without scrolling". This is that
     verdict: `bankTop + bankH` vs `ctaTop`, the two rects `chromeStable`
     already samples every tap. Positive = that many px of the bank sit
     BEHIND the sticky CTA at rest — a real, scrollable state (P1b's 21-tile
     route: 137px/212px at 100%/125%, 1-2% of JA `listening_build` steps),
     not a defect on its own. INFORMATIONAL BY DEFAULT (`ok` stays true, so
     it can't fail a run and block routes nobody has ruled on — P1b's stated
     reason for not adding this) — `opts.enforceBankVisible` promotes it to
     a real gate. `detail` always reports the worst px-hidden reading either
     way, so "informational" doesn't mean "silent". */
  const bankVisibleBadTaps = [];
  let maxBankHiddenPx = 0;
  for (const s of list) {
    if (typeof s?.bankTop !== "number" || typeof s?.bankH !== "number" || typeof s?.ctaTop !== "number") continue;
    const pxHidden = Math.round((s.bankTop + s.bankH - s.ctaTop) * 10) / 10;
    if (pxHidden > maxBankHiddenPx) maxBankHiddenPx = pxHidden;
    if (pxHidden > 0) bankVisibleBadTaps.push(s.tap);
  }
  const enforceBankVisible = Boolean(opts.enforceBankVisible);
  const bankVisibleDetail =
    maxBankHiddenPx > 0
      ? `${maxBankHiddenPx}px of the bank hidden behind the sticky CTA at rest (taps ${bankVisibleBadTaps.join(",")})` +
        (enforceBankVisible ? "" : " — informational; pass --enforce-bank-visible to gate on this")
      : "bank fully visible above the sticky CTA at every sampled tap";
  const bankVisible = na(
    "bankVisible",
    {
      ok: enforceBankVisible ? bankVisibleBadTaps.length === 0 : true,
      // badTaps is the REAL reading either way — only `ok` (whether this can
      // fail the run) depends on `enforceBankVisible`. Hiding badTaps when
      // informational would make "informational" mean "silent", not "can't
      // fail" — `bankVisibleDetail` already reports the same information in
      // prose, so this keeps the two representations honest with each other.
      badTaps: bankVisibleBadTaps,
      detail: bankVisibleDetail,
    },
    // Unwindowed (`list`, not `stabilityList`/`sampledSomewhere`) on purpose,
    // matching `stageFits` above: this verdict is about the bank's rest
    // state including any over-placement tap, not tray-growth stability.
    list.some((s) => typeof s?.bankTop === "number" && typeof s?.bankH === "number" && typeof s?.ctaTop === "number"),
  );

  const trace = opts.layoutTrace ?? null;
  const tapIntervalMs = typeof opts.tapIntervalMs === "number" && Number.isFinite(opts.tapIntervalMs) ? opts.tapIntervalMs : null;
  // The flicker metrics are `h2Top` deltas, so a trace with no `h2Top` in
  // any frame reports maxH2Jump=0 / h2Reversals=0 vacuously — N/A, not PASS.
  // Was ALWAYS the case on a `listening_build` route before 2026-09-17
  // (`layoutTrace.ts` read `<h2>` only, and that view renders none); now
  // only when a route renders neither an `<h2>` nor a `[data-lesson-prompt]`
  // element at all (an unmarked step type, or the trace ran before mount).
  // (Frame-level evidence on those routes comes from the per-tap frame
  // capture instead: `formatFrameTable`'s fontMin/dipped/fitScaleChanged
  // columns.)
  // A nonzero jump/reversal is itself proof the trace read an `h2Top`, so a
  // caller that passes only the derived metrics (no `changed` array) is still
  // judged rather than excused.
  const traceSampledH2 = Boolean(
    trace &&
      ((Array.isArray(trace.changed) && trace.changed.some((f) => typeof f?.h2Top === "number")) ||
        trace.maxH2Jump > 0 ||
        trace.h2Reversals > 0),
  );
  let noFlicker;
  if (!trace) {
    noFlicker = { ok: true, na: true, detail: "no layout trace provided" };
  } else if (!traceSampledH2) {
    noFlicker = { ok: true, na: true, detail: `h2Top not sampled in any of ${trace.changed?.length ?? 0} traced frame(s)` };
  } else if (answerLen !== null && tapIntervalMs !== null) {
    // Restrict to the taps that placed a real answer tile — see
    // `recomputeFlickerWithinWindow`'s doc comment for the windowing
    // approximation. Falls back to the FULL trace (unrestricted, prior
    // behavior) whenever either input needed to window it is missing.
    const windowMs = answerLen * tapIntervalMs;
    const w = recomputeFlickerWithinWindow(trace, windowMs);
    noFlicker = {
      ok: w.maxH2Jump === 0 && w.h2Reversals === 0,
      detail:
        `maxH2Jump=${w.maxH2Jump} h2Reversals=${w.h2Reversals} (within answerLen window ≤${windowMs}ms; ` +
        `full-trace maxH2Jump=${trace.maxH2Jump} h2Reversals=${trace.h2Reversals})`,
    };
  } else {
    noFlicker = { ok: trace.maxH2Jump === 0 && trace.h2Reversals === 0, detail: `maxH2Jump=${trace.maxH2Jump} h2Reversals=${trace.h2Reversals}` };
  }

  return {
    fitScaleStable,
    trayBankFontEqual,
    rowHStable,
    h2Stable,
    promptStable,
    chromeStable,
    noFlicker,
    stageFits,
    bankVisible,
  };
}

/** Compact per-tap table — printed after a `--simulate build` run.
 *  `tap# | trayH | bankH | fitScale | tray font min-max | bank font min-max |
 *  rowH | promptTop | bankTop | ctaTop` — the last three are the build-25
 *  "nothing moves" columns behind `promptStable`/`chromeStable`.
 *  Pure. */
/** @param {any[]} samples @param {{ answerLen?: number|null }} [opts] Task B:
 *  when `answerLen` is given, a row whose `tap > answerLen` (an
 *  over-placement tap — beyond the real answer length, still shown for
 *  visibility) gets an inline " (over-placement)" suffix rather than a new
 *  row/line, so the header-line-count contract stays one row per sample. */
export function formatBuildTable(samples, opts = {}) {
  const list = Array.isArray(samples) ? samples : [];
  const answerLen = typeof opts.answerLen === "number" && Number.isFinite(opts.answerLen) ? opts.answerLen : null;
  const fmt = (v) => (typeof v === "number" ? String(v) : "-");
  const fmtRange = (g) => (g && g.count > 0 ? `${fmt(g.fontPxMin)}-${fmt(g.fontPxMax)}` : "-");
  const lines = [];
  lines.push(
    "  tap#   trayH   bankH  fitScale  trayFont(min-max)  bankFont(min-max)   rowH  promptTop  bankTop  ctaTop",
  );
  for (const s of list) {
    const overPlacement = answerLen !== null && typeof s.tap === "number" && s.tap > answerLen;
    lines.push(
      "  " +
        String(s.tap).padStart(4) +
        "  " +
        fmt(s.trayH).padStart(6) +
        "  " +
        fmt(s.bankH).padStart(6) +
        "  " +
        fmt(s.fitScale).padStart(8) +
        "  " +
        fmtRange(s.tray).padStart(17) +
        "  " +
        fmtRange(s.bank).padStart(17) +
        "  " +
        fmt(s.rowH).padStart(6) +
        "  " +
        fmt(s.promptTop).padStart(9) +
        "  " +
        fmt(s.bankTop).padStart(7) +
        "  " +
        fmt(s.ctaTop).padStart(6) +
        (overPlacement ? "  (over-placement)" : "")
    );
  }
  return lines.join("\n");
}

/** "USER-SIM FAIL: <verdict list>" (same contract style as `evaluateReport`'s
 *  FAIL lines) — `null` when every verdict passed. An `na` verdict (the field
 *  it judges was never sampled — see `computeBuildVerdicts`) is neither a
 *  pass nor a failure: it keeps `ok: true` so it cannot fail a run, and the
 *  printed line reads `N/A` so a reader sees the hole. Pure. */
export function formatBuildVerdictFailure(verdicts) {
  const failing = Object.entries(verdicts || {}).filter(([, v]) => v && v.ok === false);
  if (failing.length === 0) return null;
  const parts = failing.map(([name, v]) => {
    if (Array.isArray(v.badTaps) && v.badTaps.length > 0) return `${name} (taps ${v.badTaps.join(",")})`;
    if (v.detail) return `${name} (${v.detail})`;
    return name;
  });
  return `USER-SIM FAIL: ${parts.join("; ")}`;
}

// ---------------------------------------------------------------------------
// Pixel baseline diff (2026-09-17, lane A5b — project review Area 5).
//
// WHY: `evaluateReport`/`computeBuildVerdicts` above are DOM-geometry
// verdicts — box positions, font px, fit scale. Two independent sources in
// the review's research lap said geometry-only checks are blind to a purely
// VISUAL regression (a colour change, an overlap, a z-index fight, a tile
// painting behind another) — and the project's last two weeks of sizing
// bugs were caught on Spencer's TestFlight walks, not by this harness. This
// section adds a pixel comparison, scoped to `[data-lesson-stage]` only (not
// the full screenshot — the status bar clock alone makes an unscoped diff
// flake, see the noise measurement below) with a real threshold behind it.
//
// TOOL CHOICE (measured, not assumed): `odiff-bin` over `pixelmatch` — SIMD
// native binary (the research lap's own citation: ~6x pixelmatch), ships an
// anti-aliasing detection mode (`antialiasing: true`, ignores subpixel font-
// hinting differences a raw byte-diff would flag), and its `ignoreRegions`
// option is exactly the masking primitive task 2 asks for (a rect of the
// crop to exclude from the diff, e.g. a timer/progress element if one is
// ever added inside the stage — none of the 8 canonical routes has one
// today, see docs/mobile-sizing-spec.md §9) — no hand-rolled pixel-blackout
// code needed. Exact-pinned in package.json (`"odiff-bin": "4.5.0"`, no
// `^`), the ONE new devDependency this lane adds.
//
// THRESHOLD (measured 2026-09-17, 15 Pro Max simulator, under the shared
// sim lock): 5 back-to-back captures of `/ja/learn/lessons/ja-m34-neo-7
// ?step=5` at 100%, cropped to the stage and diffed pairwise (10 pairs),
// PLUS 3 captures of `/ja/learn/lessons/ja-m18-neo-8?step=1` (kanji_reading
// — chosen as a second, visually heavier route: furigana ruby text is the
// kind of subpixel-AA-heavy rendering most likely to jitter run to run) for
// 3 more pairs — 13 pairs total, each diffed BOTH with `antialiasing: true`
// and `antialiasing: false` (26 diffs). Observed max differing-pixel ratio:
// **0% (byte-identical) in all 26 diffs, both AA modes.** The harness IS
// deterministic within the cropped stage on a settled (non-mid-animation)
// capture — the only noise found anywhere was OUTSIDE the crop (0.02%, one
// raw/uncropped pair, from the status-bar clock changing between shots),
// which is exactly what cropping to `[data-lesson-stage]` eliminates by
// construction. Full table + commands: docs/mobile-sizing-spec.md §9.
//
// Per the task's own rule ("use >= 3x the observed noise"): 3x an exact 0 is
// 0, and a literal 0% threshold would fail on the first single-pixel
// difference a future run's font rasterizer ever produces, even one nobody
// would call a regression — not "won't flake", just "hasn't yet, on 26
// samples of 2 routes". `PIXEL_DIFF_THRESHOLD_PCT` is set to 0.1% instead —
// ~5x the only nonzero noise actually measured anywhere in this exercise
// (the 0.02% uncropped clock jitter), and three orders of magnitude below a
// real visual regression (a moved/recoloured/overlapping element changes
// thousands to hundreds of thousands of pixels — see `diffPercentage: 4.3`
// two entirely different routes produced when diffed against each other
// during tool evaluation). Still tight enough to fail on the planted-defect
// tests below (a 1% pixel change is 10x this floor).
export const PIXEL_DIFF_THRESHOLD_PCT = 0.1;

/** `tests/visual/baselines/<route-slug>-<viewport>-<scale>.png` — the same
 *  vocabulary `captureSlug` already builds for the artifact filename, minus
 *  the `capture-` prefix (baselines aren't in `artifacts/`, so the prefix
 *  that says "this is a throwaway capture artifact" would be a lie). Pure. */
export function baselineFilename(slug) {
  return `${String(slug ?? "").replace(/^capture-/, "")}.png`;
}

/** The `[data-lesson-stage]` rect in CSS px, assembled from the TWO places a
 *  capture report carries it: `report.stage` (`{top, bottom, h}`, `r()`'s
 *  shape — reused verbatim, not widened, so every OTHER `r()` caller's shape
 *  stays put) plus the sibling `report.stageLeft`/`.stageWidth` fields added
 *  alongside it in `simProbe.ts` for exactly this. `null` when any piece is
 *  missing (no `[data-lesson-stage]` found — an error page, an unmatched
 *  route) rather than a rect with `NaN`s in it. Pure. */
export function stageRectFromReport(report) {
  const stage = report?.stage;
  const left = report?.stageLeft;
  const width = report?.stageWidth;
  if (
    !stage ||
    typeof stage.top !== "number" ||
    typeof stage.h !== "number" ||
    typeof left !== "number" ||
    typeof width !== "number"
  ) {
    return null;
  }
  return { left, top: stage.top, width, height: stage.h };
}

/** CSS-px rect -> device-px crop box (`sips -c H W --cropOffset Y X` order,
 *  see `cropScreenshotToStage`). `dpr` defaults to 1 rather than throwing —
 *  a report missing `dpr` should crop at CSS-px 1:1, not blow up the whole
 *  capture over a cosmetic field. Rounds AFTER multiplying (not before) so a
 *  fractional CSS px doesn't lose a device pixel to premature rounding. Pure. */
export function cropBoxPx(rect, dpr) {
  const d = typeof dpr === "number" && dpr > 0 ? dpr : 1;
  return {
    x: Math.round(rect.left * d),
    y: Math.round(rect.top * d),
    width: Math.round(rect.width * d),
    height: Math.round(rect.height * d),
  };
}

/** Crops `srcPngPath` to `box` (device px, from `cropBoxPx`) via macOS
 *  `sips` — the same tool `mobile-ui-verify`'s own "crop before you read"
 *  rule already uses (no new image-processing dependency; `sips` ships with
 *  macOS, and this harness is macOS-only already — it drives the simulator).
 *  Throws on a `sips` failure (bad box, missing source) rather than writing
 *  a corrupt/partial crop silently. */
export function cropScreenshotToStage(srcPngPath, box, outPngPath) {
  execFileSync("sips", [
    "-c", String(box.height), String(box.width),
    "--cropOffset", String(box.y), String(box.x),
    srcPngPath,
    "--out", outPngPath,
  ], { stdio: "pipe" });
}

/** `{ ok }` for a differing-pixel percentage (`ratioPct`, 0-100 scale —
 *  odiff's own `diffPercentage` shape) against `thresholdPct`. Split out
 *  from `compareToBaseline` (which does real file I/O against odiff) so the
 *  THRESHOLD DECISION itself — the thing a synthetic-image test needs to
 *  pin — is one pure, trivially-testable function with no image library, no
 *  filesystem, no odiff binary involved. Pure. */
export function evaluatePixelDiff(ratioPct, thresholdPct) {
  return { ok: ratioPct <= thresholdPct };
}

/** Full baseline check for one crop: runs `odiff-bin` (antialiasing-tolerant,
 *  `failOnLayoutDiff` so a SIZE change reports its own reason instead of a
 *  silent resize-and-compare — a stage that changed dimensions is itself the
 *  finding, not something to paper over), then judges the result through
 *  `evaluatePixelDiff` so the THRESHOLD decision is the same pure function a
 *  unit test exercises directly. `diffOutPath` is always passed to odiff (it
 *  writes there only on an actual pixel-diff mismatch — confirmed live,
 *  2026-09-17: a `match:true` run leaves no file at that path).
 *
 *  Returns one of:
 *    { ok: true,  ratio: 0,      reason: "match" }
 *    { ok: bool,  ratio: <pct>,  reason: "pixel-diff", diffCount, diffPath }
 *    { ok: false, ratio: null,   reason: "layout-diff" }  — crop dims differ
 *    { ok: false, ratio: null,   reason: "no-baseline" }  — nothing to diff
 *      against; caller should say "run --update-baseline first"
 */
export async function compareToBaseline(croppedPath, baselinePath, diffOutPath, opts = {}) {
  const thresholdPct = opts.thresholdPct ?? PIXEL_DIFF_THRESHOLD_PCT;
  if (!fs.existsSync(baselinePath)) {
    return { ok: false, ratio: null, reason: "no-baseline" };
  }
  const odiffOptions = { antialiasing: true, threshold: 0.1, failOnLayoutDiff: true };
  // odiff-bin's own `optionsToArgs` (node_modules/odiff-bin/odiff.js) calls
  // `.map()` on `ignoreRegions` unconditionally once the KEY is present at
  // all — confirmed live, 2026-09-17: `{ ignoreRegions: undefined }` throws
  // "Cannot read properties of undefined (reading 'map')" rather than being
  // treated as "no masking". So the key is only ever ADDED, never set to
  // undefined — masking (task 2's "mask any region the probe reports as
  // dynamic") stays available via `opts.ignoreRegions` without tripping it.
  if (Array.isArray(opts.ignoreRegions) && opts.ignoreRegions.length > 0) {
    odiffOptions.ignoreRegions = opts.ignoreRegions;
  }
  const r = await odiffCompare(baselinePath, croppedPath, diffOutPath, odiffOptions);
  if (r.match) return { ok: true, ratio: 0, reason: "match" };
  if (r.reason === "layout-diff") return { ok: false, ratio: null, reason: "layout-diff" };
  // r.reason === "pixel-diff" (the only remaining shape odiff returns for two
  // real, existing files — "file-not-exists" can't happen here, both paths
  // were just written/confirmed by this same run).
  const judged = evaluatePixelDiff(r.diffPercentage, thresholdPct);
  return { ok: judged.ok, ratio: r.diffPercentage, reason: "pixel-diff", diffCount: r.diffCount, diffPath: diffOutPath };
}

/**
 * Task D (2026-09-17, single-shot-per-tap precision fix) — the scheduling
 * DECISION: given how long tap N's own frame trace took to report stable,
 * `--tap-interval`, and an estimate of how long a screenshot of tap N takes
 * to return, when may tap N+1 fire? Answer: not before ANY of the three —
 * "after the tap's frame trace reports stable (or after --tap-interval,
 * whichever is later), and do not fire the next tap until that screenshot
 * has returned" is exactly `Math.max` of the three. Pure; all three
 * inputs are ms-since-tap-N's-own-click, `null`/non-finite treated as "no
 * floor from this input" (0), never as a NaN poison.
 *
 * MIRRORED in `src/shared/dev/simProbe.ts` (same name, same formula) — no
 * shared module crosses the browser/Node boundary in this harness (same
 * established pattern as `SCREENSHOT_BURST_MS`/`FRAME_TRACE_MAX_MS` staying
 * in sync by hand): `simProbe.ts`'s copy is what the browser's OWN tap loop
 * actually runs to pace itself (there is no live ack channel from this
 * Node process back to the browser without a `vite.config.ts` change, out
 * of this lane's owned files — `screenshotReturnMs` there is therefore a
 * measured ESTIMATE, not a real synchronous wait for THIS run's actual
 * screenshot; see `ESTIMATED_SCREENSHOT_RETURN_MS`'s doc comment there).
 * This Node-side copy exists so the formula itself is pinned by
 * `node --test`, independent of a browser test runner.
 */
export function computeNextTapDelayMs({ tapIntervalMs, traceStableMs, screenshotReturnMs }) {
  const floor = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return Math.max(floor(tapIntervalMs), floor(traceStableMs), floor(screenshotReturnMs));
}

// ---------------------------------------------------------------------------
// Per-tap FRAME CAPTURE (2026-09-17, Spencer: "the simulation needs FRAME
// CAPTURE so we can analyze animations, not only settled geometry") —
// derived metrics over `report.simulation.frames[i]` (each `{ tap, frames,
// capped }`, from `recordTapFrameTrace` in simProbe.ts). Same
// collection/judgment split as the rest of this file.
// ---------------------------------------------------------------------------

const IDENTITY_TRANSFORM = /^(none|matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*0\))$/;

/**
 * @param {any} frameTrace `report.simulation.frames[i]` — `{ tap, frames,
 *   capped }`; each frame is `{ t, tile: {x,y,w,h,fontPx,transform,opacity}
 *   | null, tileLost, trayRow, trayClientHeight, trayFitScaleMin,
 *   trayFitScaleMax, bankFitScaleMin, bankFitScaleMax }` (see
 *   `TapFrameSample` in simProbe.ts).
 */
export function computeFrameDerivedMetrics(frameTrace) {
  const frames = Array.isArray(frameTrace?.frames) ? frameTrace.frames : [];
  const withTile = frames.filter((f) => f && f.tile);
  const empty = {
    fontPxStart: null,
    fontPxMin: null,
    fontPxEnd: null,
    fontDipped: false,
    transformSettledMs: null,
    fitScaleChanged: false,
    framesWithTile: 0,
    framesTotal: frames.length,
    capped: Boolean(frameTrace?.capped),
  };
  if (withTile.length === 0) return empty;

  const fontPxStart = withTile[0].tile.fontPx;
  const fontPxEnd = withTile[withTile.length - 1].tile.fontPx;
  const fontPxMin = Math.min(...withTile.map((f) => f.tile.fontPx));
  // "Dipped": the label got SMALLER at some point mid-animation than where
  // it ends up — the tile-resizing-while-you-build symptom, not just a
  // tile that shrinks once and stays shrunk (that's a real end-state, not a
  // dip).
  const fontDipped = fontPxMin < fontPxEnd - 1;

  const isIdentity = (t) => IDENTITY_TRANSFORM.test(String(t ?? "").trim());
  let transformSettledMs = null;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (!f.tile || !isIdentity(f.tile.transform)) continue;
    const staysIdentity = frames.slice(i).every((g) => !g.tile || isIdentity(g.tile.transform));
    if (staysIdentity) {
      transformSettledMs = f.t;
      break;
    }
  }

  const fitScaleTolerance = 0.005;
  const firstWith = (pick) => frames.find((f) => pick(f) !== null && pick(f) !== undefined);
  const lastWith = (pick) => [...frames].reverse().find((f) => pick(f) !== null && pick(f) !== undefined);
  const changed = (pick) => {
    const first = firstWith(pick);
    const last = lastWith(pick);
    if (!first || !last) return false;
    return Math.abs(pick(first) - pick(last)) > fitScaleTolerance;
  };
  const fitScaleChanged =
    changed((f) => f.trayFitScaleMin) ||
    changed((f) => f.trayFitScaleMax) ||
    changed((f) => f.bankFitScaleMin) ||
    changed((f) => f.bankFitScaleMax);

  return {
    fontPxStart,
    fontPxMin,
    fontPxEnd,
    fontDipped,
    transformSettledMs,
    fitScaleChanged,
    framesWithTile: withTile.length,
    framesTotal: frames.length,
    capped: Boolean(frameTrace?.capped),
  };
}

/** Compact per-tap FRAME CAPTURE table — printed alongside `formatBuildTable`
 *  (kept as a SEPARATE table rather than more columns bolted onto the first
 *  one: the two tables together already run past 80 columns on most
 *  terminals). Pure. */
export function formatFrameTable(frameTraces) {
  const list = Array.isArray(frameTraces) ? frameTraces : [];
  const fmt = (v) => (v === null || v === undefined ? "-" : typeof v === "boolean" ? String(v) : String(v));
  const lines = [];
  lines.push("  tap#  fontStart  fontMin  fontEnd  dipped  transformSettledMs  fitScaleChanged  frames  capped");
  for (const ft of list) {
    const m = computeFrameDerivedMetrics(ft);
    lines.push(
      "  " +
        String(ft.tap).padStart(4) +
        "  " +
        fmt(m.fontPxStart).padStart(9) +
        "  " +
        fmt(m.fontPxMin).padStart(7) +
        "  " +
        fmt(m.fontPxEnd).padStart(7) +
        "  " +
        fmt(m.fontDipped).padStart(6) +
        "  " +
        fmt(m.transformSettledMs).padStart(18) +
        "  " +
        fmt(m.fitScaleChanged).padStart(15) +
        "  " +
        `${m.framesWithTile}/${m.framesTotal}`.padStart(6) +
        "  " +
        fmt(m.capped).padStart(6)
    );
  }
  return lines.join("\n");
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
  const {
    fontScale, emuW, emuH, tapSelector, answerFirstOption, seedProfile, runNonce, simulate, tapIntervalMs, maxTaps,
    frameBurst, replayTaps, replaySpeed,
  } = opts;
  const params = new URLSearchParams();
  params.set("simFontScale", String(fontScale));
  if (emuW && emuH) {
    params.set("simEmuW", String(emuW));
    params.set("simEmuH", String(emuH));
  }
  if (tapSelector) params.set("simTap", String(tapSelector));
  if (answerFirstOption) params.set("simAnswerFirstOption", "1");
  if (simulate) {
    params.set("simSimulate", String(simulate));
    if (tapIntervalMs) params.set("simTapInterval", String(tapIntervalMs));
    if (maxTaps) params.set("simMaxTaps", String(maxTaps));
    // Task D: tells `runBuildSimulation` (simProbe.ts) whether to pace taps
    // the OLD fast/fire-and-forget way (this Node process is bursting
    // multiple shots per tap, so it doesn't need the browser to wait) or
    // the new default wait-for-settle-and-estimated-screenshot-return pace.
    if (frameBurst) params.set("simFrameBurst", "1");
    // Golden-learner replay (2026-09-17, lane A2d) — `simulate === "replay"`.
    // Taps are small (≤60, capped by `logTileTap`) so a base64 JSON query
    // param comfortably clears WKWebView's URL-length headroom; no
    // vite.config.ts change needed (unlike `--seed`'s localStorage write,
    // this doesn't need server-side state — the browser decodes the param
    // itself, same as every other `sim*` flag here).
    if (simulate === "replay" && Array.isArray(replayTaps)) {
      params.set("simTapsReplay", Buffer.from(JSON.stringify(replayTaps), "utf8").toString("base64"));
      params.set("simReplaySpeed", String(replaySpeed ?? 1));
    }
  }
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

  // `src/index.css`'s `@media (min-width: 1024px) and (max-height: 820px)`
  // legitimately drops `--font-base` 16px → 15px on a short-viewport device
  // (the "font-base drops to 15px on short desktops" rule CLAUDE.md warns
  // about for tap-target floors). A REAL landscape capture is the first
  // time this harness can actually LAND inside that breakpoint — ipad-air's
  // real-rotated 1180×820 hits it exactly (`emulated-landscape`'s height
  // never really reaches 820, see its doc comment, so this never mattered
  // before today). Found live 2026-09-16: without this, every real-landscape
  // capture on ipad-air fails validation on a CORRECT 15px reading.
  // 2026-09-17 (build 23, ca1b210c): that breakpoint now also requires
  // `(pointer: fine)`, precisely so a touch iPad in landscape KEEPS 16px
  // (Spencer: landscape iPad = desktop UI with bigger targets). Every
  // simulator device is a coarse pointer, so no real-rotation capture can
  // land in the 15px rule any more; the expectation is 16px everywhere. A
  // reading of 15 on a simulator now means the CSS regressed.
  const expectedRootBasePx = 16;
  const expectedRootPx = expectedRootBasePx * expectedScale;
  if (typeof report.rootFontPx !== "number" || Math.abs(report.rootFontPx - expectedRootPx) > 0.5) {
    mismatches.push(`rootFontPx: expected ~${expectedRootPx} (${expectedRootBasePx} × ${expectedScale}), got ${report.rootFontPx}`);
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
    } else {
      const tolerance = 24; // 15-pro-max (430) vs ipad-air (820) differ by hundreds — this only needs to separate devices, not pin a px-exact width
      // G6: a REAL (non-emulated) "landscape" orientation swaps which axis
      // is the long one — the validator must expect w/h SWAPPED, not the
      // portrait viewport table entry, or a genuine real-landscape capture
      // (innerWidth≈1180, innerHeight≈820 on ipad-air) would always fail
      // validation. `expected.orientation` is only ever "landscape" for a
      // REAL attempt — "emulated-landscape" takes the `expected.emulated`
      // branch above instead, and plain "portrait" falls through here
      // unswapped exactly as before this change.
      const isRealLandscape = expected.orientation === "landscape";
      const expectedW = isRealLandscape ? v.h : v.w;
      const expectedH = isRealLandscape ? v.w : v.h;
      if (typeof report.innerWidth === "number" && Math.abs(report.innerWidth - expectedW) > tolerance) {
        mismatches.push(
          `viewport width: expected ~${expectedW}px (${expected.viewportKey ?? v.device}${isRealLandscape ? ", landscape" : ""}), got ${report.innerWidth}px`
        );
      }
      if (typeof report.innerHeight === "number" && Math.abs(report.innerHeight - expectedH) > tolerance) {
        mismatches.push(
          `viewport height: expected ~${expectedH}px (${expected.viewportKey ?? v.device}${isRealLandscape ? ", landscape" : ""}), got ${report.innerHeight}px`
        );
      }
      // Belt-and-suspenders for the exact regression this task named: a
      // "landscape" validation must never rubber-stamp a still-PORTRAIT
      // (w<h) report just because both axes happened to fall within
      // tolerance of some other device's dims.
      if (
        isRealLandscape &&
        typeof report.innerWidth === "number" &&
        typeof report.innerHeight === "number" &&
        report.innerWidth <= report.innerHeight
      ) {
        mismatches.push(
          `orientation: expected landscape (innerWidth > innerHeight), got innerWidth=${report.innerWidth} innerHeight=${report.innerHeight} (still portrait-shaped)`
        );
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
    `  vv=${report.vv}  innerWidth=${report.innerWidth}  innerHeight=${report.innerHeight}  stageH=${report.stage?.h ?? null}  ` +
      `stageOverReportPx=${report.stageOverReportPx} (budget; scroller clientHeight vs. on-screen intersection)`
  );
  if (report.safeAreaInsets) {
    const ins = report.safeAreaInsets;
    lines.push(`  safeAreaInsets: top=${ins.top} right=${ins.right} bottom=${ins.bottom} left=${ins.left}`);
  }
  lines.push(
    `  chromeAbovePx=${report.chromeAbovePx}  chromeBelowPx=${report.chromeBelowPx}  ` +
      `(informational only — fixed header/CTA chrome, no budget)`
  );
  lines.push(`  sampleTileFontFamily=${report.sampleTileFontFamily}`);
  const tiles = Array.isArray(report.tiles) ? report.tiles : [];
  // Task C: surface the collapsed count separately from the clip/overhang
  // checks it's excluded from — see evaluateReport's `collapsed` field.
  const collapsedCount = tiles.filter((t) => t.collapsed === true).length;
  lines.push(`  tiles (${tiles.length}, collapsed=${collapsedCount}):`);
  lines.push("    text                 variant   fontPx boxW boxH lines wrap clip   ovh  coll");
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
        String(typeof t.overhangPx === "number" ? t.overhangPx : "-").padStart(5) +
        " " +
        String(t.collapsed === true).padStart(5)
    );
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// simctl / process helpers (side-effecting — not exercised by the dry-run test)
// ---------------------------------------------------------------------------

const simctl = (...a) => execFileSync("xcrun", ["simctl", ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Plain launch — no orientation env to pass any more. Real device rotation
 * (see the "Real device rotation" doc comment at the top of this file) now
 * happens BEFORE this is called, via `rotateDevice()`, and is a property of
 * the whole simulator (SpringBoard), not something re-asserted per app
 * launch — unlike the removed `SimOrientationOverride`, which was an in-app
 * override read fresh on every launch.
 */
function launchApp(udid, bundleId) {
  execFileSync("xcrun", ["simctl", "launch", udid, bundleId], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

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
 *
 * G3 extension (2026-09-17) — the stamp's `devServerUrl` alone only catches
 * a change to WHERE the shell points; it is blind to a change to WHAT was
 * built. A native-only edit (`ios/App/App/*.swift`, `Info.plist`, the
 * pbxproj, `capacitor.config.ts`) never touches `devServerUrl`, so the old
 * check reported "fresh" and reused the stale binary — confirmed live: two
 * "verifications" of an `AppDelegate` orientation change both ran the
 * pre-change binary and reported the pre-change behaviour. The stamp now
 * also carries `nativeHash` (`computeNativeHash()` below), a sha256 over
 * every native input's path + bytes, so either kind of change forces a
 * rebuild.
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

// Native inputs the app shell is built from — everything `xcodebuild`
// actually reads to produce the binary, EXCLUDING `ios/App/App/public`
// (that's the synced WEB bundle, a different freshness axis entirely: it
// changes on every content/code commit and is handled by `npx cap sync`,
// not by a native rebuild).
const NATIVE_SOURCE_ROOT = "ios/App/App";
const NATIVE_SOURCE_EXCLUDE_DIR = path.join(NATIVE_SOURCE_ROOT, "public");
const NATIVE_FIXED_FILES = [
  path.join(NATIVE_SOURCE_ROOT, "Info.plist"),
  "ios/App/App.xcodeproj/project.pbxproj",
  "capacitor.config.ts",
];

/** Every `*.swift` file under `dir`, recursively, skipping
 *  `NATIVE_SOURCE_EXCLUDE_DIR` entirely. A missing/unreadable `dir` yields
 *  no files rather than throwing — freshness should fail safe to "rebuild",
 *  not crash the harness. */
function listSwiftFiles(dir) {
  if (dir === NATIVE_SOURCE_EXCLUDE_DIR) return [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  let out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out = out.concat(listSwiftFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".swift")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Content hash of every native input (see `NATIVE_SOURCE_ROOT`/
 * `NATIVE_FIXED_FILES` above) — sorted by path so the hash is stable
 * regardless of filesystem enumeration order, sha256 over each file's
 * relative path AND bytes (not just bytes — so a rename alone still
 * changes the hash). Impure (reads the filesystem), so it stays OUTSIDE
 * `isStampFresh`: the caller computes it once and passes the value in,
 * keeping `isStampFresh` itself a pure comparison `sim-capture.test.mjs`
 * can pin without touching disk (same split as `isRotatorFresh`/
 * `rotatorIsFresh` below).
 */
function computeNativeHash() {
  const files = [...listSwiftFiles(NATIVE_SOURCE_ROOT), ...NATIVE_FIXED_FILES].sort();
  const hash = createHash("sha256");
  for (const rel of files) {
    let bytes;
    try {
      bytes = fs.readFileSync(rel);
    } catch {
      continue; // listed but unreadable/removed between listing and hashing — rare; skip rather than crash
    }
    hash.update(rel.split(path.sep).join("/"));
    hash.update(Buffer.from([0]));
    hash.update(bytes);
    hash.update(Buffer.from([0]));
  }
  return hash.digest("hex");
}

/** Pure half of the G3 freshness check, split out so `sim-capture.test.mjs`
 *  can pin the comparison without a live simulator (mirrors how
 *  `evaluateReport` is the pure half of the exit-code contract). Stale on
 *  EITHER a `devServerUrl` mismatch OR a `nativeHash` mismatch — including
 *  when `stamp.nativeHash` is absent (a pre-2026-09-17 stamp), which must
 *  rebuild once to pick up the new field. */
export function isStampFresh(stamp, expectedDevServerUrl, expectedNativeHash) {
  return (
    Boolean(stamp) &&
    stamp.devServerUrl === expectedDevServerUrl &&
    stamp.nativeHash === expectedNativeHash
  );
}

function shellIsFresh(udid) {
  const stamp = readInstalledStamp(udid);
  const expectedNativeHash = computeNativeHash();
  const fresh = isStampFresh(stamp, `${DEV_URL}/__sim`, expectedNativeHash);
  if (!fresh && stamp && stamp.devServerUrl === `${DEV_URL}/__sim` && stamp.nativeHash !== expectedNativeHash) {
    const was = stamp.nativeHash ? stamp.nativeHash.slice(0, 12) : "none recorded";
    console.log(
      `native sources changed since the installed shell (${was} → ${expectedNativeHash.slice(0, 12)}), rebuilding`
    );
  }
  return fresh;
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

// `probeRealOrientation` (the pre-2026-09-16 "does the in-app
// `SimOrientationOverride` actually rotate the WKWebView?" launch-and-read
// probe) is REMOVED — that override is gone (see git history), superseded
// by the real XCUITest-based `rotateDevice()` below, which needs no probe:
// the capture's own `validateCapture` (G6) is the oracle.

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
  // G3: stamp the bundle with what dev server it was built against AND a
  // content hash of the native inputs it was built from (2026-09-17 —
  // `computeNativeHash()`), BEFORE install, so shellIsFresh can read it
  // back per-device via `simctl get_app_container` instead of trusting the
  // host's shared capacitor.config.json, and so a native-only edit is
  // caught even when the dev server URL didn't change.
  const stamp = {
    builtAt: new Date().toISOString(),
    devServerUrl: `${DEV_URL}/__sim`,
    gitRev: gitRevShort(),
    nativeHash: computeNativeHash(),
  };
  fs.writeFileSync(path.join(app, "sim-stamp.json"), JSON.stringify(stamp, null, 2));
  simctl("install", udid, app);
}

const CONTACT_SHEET_SCRIPT = path.resolve("scripts/ux-loop/contact_sheet.py");

/**
 * Task D (2026-09-17): ONE contact sheet per RUN, ordered tap 0..N — was
 * one small sheet PER TAP (`composeContactSheet`, since retired). Crops
 * every tap's raw shot(s) down to the stage rect and tiles them all into a
 * single `<slug>.taps.jpg`, via `contact_sheet.py` (Pillow — see that
 * file's own doc comment for why Python/Pillow rather than a Node image
 * library: no ImageMagick and no `canvas`/`sharp`/`jimp` exist in this
 * environment, checked live 2026-09-17; system `python3` DOES have
 * Pillow). `shotsByTap` entries are walked in ASCENDING tap-number order
 * regardless of Map insertion order (a mismatch is exactly the queue-lag
 * defect this fix targets) so the sheet always reads left-to-right as
 * tap 0..N even if capture order ever drifted. Each frame carries its own
 * `tap` number so `contact_sheet.py` can label it `tap<N> t=<ms>ms`
 * instead of a bare timestamp. Best-effort: any failure (missing python3,
 * missing Pillow, a corrupt shot) is caught and logged as a warning — a
 * missing contact sheet doesn't fail the capture, the per-frame geometry
 * trace is the deliverable either way.
 */
function composeRunContactSheet(shotsByTap, stage, dpr, slug) {
  const tapNumbers = [...shotsByTap.keys()].sort((a, b) => a - b);
  const frames = [];
  for (const tapNumber of tapNumbers) {
    const entry = shotsByTap.get(tapNumber);
    for (const s of entry?.shots ?? []) frames.push({ tap: tapNumber, t: s.tMs, path: s.file });
  }
  if (frames.length === 0) return null;
  const outputPath = path.join(OUT_DIR, `${slug}.taps.jpg`);
  const argsFile = path.join(OUT_DIR, `.${slug}.taps.args.json`);
  try {
    fs.writeFileSync(argsFile, JSON.stringify({ outputPath, dpr, stage, frames }));
    execFileSync("python3", [CONTACT_SHEET_SCRIPT, argsFile], { stdio: ["ignore", "pipe", "pipe"] });
    return outputPath;
  } catch (err) {
    console.warn(`WARN: run contact sheet failed: ${String(err.message || err).split("\n")[0]}`);
    return null;
  } finally {
    try { fs.unlinkSync(argsFile); } catch { /* best effort */ }
  }
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

/**
 * Per-tap screenshot timing (2026-09-17, Spencer's FRAME CAPTURE ask:
 * "take WKWebView screenshots at ~50ms intervals... via the existing
 * safaridriver screenshot path"). RESEARCHED FIRST (per this repo's own
 * "research before declaring limits" doctrine) rather than assumed: no
 * safaridriver-driven screenshot path exists anywhere in this repo —
 * `.claude/skills/mobile-ui-verify/SKILL.md` §7 states outright that
 * Appium/XCUITest WebKit attachment (the only channel that WOULD let a
 * driver screenshot just the WKWebView) "is not wired into this repo's
 * tooling"; `docs/mobile-testing-setup-2026-08-06.md` says the native-shell
 * path this file drives "does not need a separate safaridriver WebDriver
 * session"; `rg safaridriver scripts/ src/shared/dev/` is empty. The only
 * screenshot mechanism that exists anywhere in this harness is the same one
 * `main()` already uses for the single end-of-wait shot: `xcrun simctl io
 * <udid> screenshot <file>` (a FULL simulator-screen capture, not a
 * WebKit-scoped one — cropped to the stage afterward by
 * `contact_sheet.py`).
 *
 * MEASURED (not assumed) on this machine, 2026-09-17: 5 back-to-back
 * `xcrun simctl io <udid> screenshot` calls averaged 386ms each
 * (379-394ms).
 *
 * Task D (2026-09-17, single-shot-per-tap precision fix): the ORIGINAL
 * design bursted screenshots for `SCREENSHOT_BURST_MS` (700ms) after EVERY
 * tap marker — a 700ms Node-side block per tap is LONGER than the default
 * 450ms `--tap-interval`, so the poll loop fell behind the browser's own
 * (fire-and-forgotten) tap cadence: confirmed live on
 * `ja-m15-neo-6?step=15` — the "tap 10" burst actually captured the SAME
 * bytes as "tap 16"'s, both already the fully-placed end state, 2.8-5.2s of
 * real queue lag behind the markers they were nominally keyed to. The
 * DEFAULT is now exactly ONE screenshot per tap (`singleScreenshot`,
 * ~386-394ms of Node-side blocking instead of a 700ms window) — paired with
 * `runBuildSimulation`'s own new default pacing (simProbe.ts,
 * `computeNextTapDelayMs`/`ESTIMATED_SCREENSHOT_RETURN_MS`), which now
 * waits for its OWN tap's frame trace to settle (+ this same measured
 * screenshot-latency estimate) before firing the NEXT tap — so the two
 * sides stay roughly in lockstep without a live ack channel (none exists
 * without a `vite.config.ts` change, out of this lane's owned files). The
 * OLD multi-shot burst survives as `--frame-burst` (`burstScreenshots`) for
 * anyone who explicitly wants the whole-transition animation instead of one
 * settled frame — paired with `simFrameBurst=1`, which puts
 * `runBuildSimulation` back into its old fast, non-blocking cadence too
 * (a burst already spans the transition; it doesn't need the browser to
 * wait for a single settled moment).
 */
const SCREENSHOT_BURST_MS = 700;
/** Node-side mirror of `ESTIMATED_SCREENSHOT_RETURN_MS` in
 *  `src/shared/dev/simProbe.ts` (kept in sync by hand — no shared module
 *  crosses the browser/Node boundary here) — sized to this file's own
 *  measured single-shot latency (386-394ms) plus a small margin, used to
 *  size the worst-case wait budget for the new default single-shot mode. */
const ESTIMATED_SCREENSHOT_RETURN_MS = 500;
/** Mirrors `FRAME_TRACE_MAX_MS` in `src/shared/dev/simProbe.ts` (kept in
 *  sync by hand — no shared module crosses the browser/Node boundary here)
 *  — the per-tap DOM frame trace's hard safety cap, used here only to size
 *  `effectiveWaitMs`/the schedule-tick budget generously enough to cover
 *  the worst case (every tap's frame trace hitting its own cap). */
const FRAME_TRACE_MAX_MS = 3000;

/** ONE `simctl io screenshot` call, `{file, tMs}` (tMs = real elapsed ms
 *  this call itself took). Best-effort — a failed shot returns `[]`, not
 *  fatal. Default (non-`--frame-burst`) per-tap capture — see the
 *  "Per-tap screenshot timing" doc comment above. */
function singleScreenshot(udid, filePrefix) {
  const t0 = Date.now();
  const file = `${filePrefix}.f0.png`;
  try {
    simctl("io", udid, "screenshot", file);
    return [{ file, tMs: Date.now() - t0 }];
  } catch {
    return [];
  }
}

/** Back-to-back `simctl io screenshot` calls for `windowMs`, `{file, tMs}`
 *  per shot with the REAL elapsed ms since this call started. Best-effort —
 *  one failed shot is skipped, not fatal. Opt-in via `--frame-burst`. */
function burstScreenshots(udid, windowMs, filePrefix) {
  const shots = [];
  const t0 = Date.now();
  let i = 0;
  while (Date.now() - t0 < windowMs) {
    const tMs = Date.now() - t0;
    const file = `${filePrefix}.f${i}.png`;
    try {
      simctl("io", udid, "screenshot", file);
      shots.push({ file, tMs });
    } catch { /* best effort */ }
    i++;
  }
  return shots;
}

/**
 * `--simulate build` per-tap screenshots (task §3 originally, extended by
 * the 2026-09-17 FRAME CAPTURE ask to run around EVERY tap, not just the
 * first/last): unlike every other capture mode, which takes exactly one
 * screenshot at the end of the fixed wait window, a build simulation is a
 * SEQUENCE — the founder's complaint was about mid-sequence resizing, so a
 * screenshot only of the final state can't show it. `simProbe.ts`'s
 * `runBuildSimulation` POSTs a small `{simMarker: true, phase:
 * "tap"|"final", runNonce, tapNumber?, taps?}` ping to the SAME
 * `/__sim/report` endpoint (no `vite.config.ts` change needed — it appends
 * whatever JSON body it's given) right after EVERY tap's `.click()` and
 * once more when the sequence ends; this polls `PROBE_LOG` for those
 * markers (filtered to THIS attempt's `runNonce`, same lane-isolation
 * discipline as everything else in this file) and, the instant a new tap
 * marker shows up, captures it — instead of guessing a fixed delay.
 *
 * `frameBurstMode` selects `burstScreenshots` (the OLD multi-shot window,
 * `SCREENSHOT_BURST_MS`) vs. the DEFAULT `singleScreenshot` (one shot,
 * ~386-394ms of blocking instead of 700ms) — see the "Per-tap screenshot
 * timing" doc comment above for why the default changed. Either way this
 * loop is synchronous/blocking while a shot is in flight, so once a
 * capture for tap N is running, tap N+1's marker may already have posted
 * before this loop gets back around to it — that tap's capture still runs
 * (nothing is silently dropped), but its "t=0" reference is the moment
 * THIS loop got around to it, not the moment of the real click.
 * `queueDelayMs` per tap (capture-start time minus this tap's EXPECTED
 * click time) makes that visible: self-calibrated off tap 1's OWN observed
 * capture-start time as the anchor (`expectedClickAt = tap1's
 * capture-start + (tapNumber-1)*tapIntervalMs`) rather than guessed off
 * app-launch time, which would be dominated by an unknown, variable
 * app-boot delay and tell a reader nothing about screenshot-loop queuing
 * specifically. Best-effort throughout — a marker that never arrives (the
 * bank empties before its turn is reached, or the page never posts) just
 * means fewer/no extra screenshots for that tap; the per-frame DOM trace
 * (`report.simulation.frames`) and the coarse per-tap samples are the
 * deliverable either way, screenshots are illustrative on top.
 */
async function waitAndCaptureBuildTapShots(udid, waitMs, sinceLine, runNonce, slug, attempt, tapIntervalMs, frameBurstMode) {
  const pollMs = 100;
  const deadline = Date.now() + waitMs;
  /** @type {Map<number, { shots: {file: string, tMs: number}[], capturedAt: number, queueDelayMs: number }>} */
  const shotsByTap = new Map();
  let finalTaps = null;
  let tap1CapturedAt = null;
  while (Date.now() < deadline) {
    await sleep(pollMs);
    const lines = readNewReports(PROBE_LOG, sinceLine);
    for (const r of lines) {
      if (!r || r.simMarker !== true || r.runNonce !== runNonce) continue;
      if (r.phase === "tap" && typeof r.tapNumber === "number" && !shotsByTap.has(r.tapNumber)) {
        const capturedAt = Date.now();
        if (r.tapNumber === 1) tap1CapturedAt = capturedAt;
        const expectedClickAt = tap1CapturedAt !== null ? tap1CapturedAt + (r.tapNumber - 1) * tapIntervalMs : capturedAt;
        const prefix = path.join(OUT_DIR, `${slug}.attempt${attempt}.raw-tap${r.tapNumber}`);
        const shots = frameBurstMode ? burstScreenshots(udid, SCREENSHOT_BURST_MS, prefix) : singleScreenshot(udid, prefix);
        shotsByTap.set(r.tapNumber, { shots, capturedAt, queueDelayMs: capturedAt - expectedClickAt });
      } else if (r.phase === "final" && typeof r.taps === "number" && finalTaps === null) {
        finalTaps = r.taps;
      }
    }
    if (finalTaps !== null && shotsByTap.size >= finalTaps) break; // every expected tap's shot(s) are in
  }
  const remaining = deadline - Date.now();
  console.log(
    `build-sim: captured ${shotsByTap.size} tap(s)${finalTaps !== null ? ` of ${finalTaps} reported` : " (final marker not yet seen)"}` +
      ` (${frameBurstMode ? "--frame-burst" : "single-shot"})`
  );
  if (remaining > 0) {
    console.log(`waiting ${remaining}ms more for the probe ticks…`);
    await sleep(remaining);
  }
  return shotsByTap;
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

// ---------------------------------------------------------------------------
// `--simulate build` OVER-PLACEMENT fix (2026-09-17) — the runtime pads a
// bank with distractor tiles (a 6-tile answer can ship a 10-tile bank:
// `/ja/learn/lessons/ja-m34-neo-7?step=5`), but `--simulate build` taps
// EVERY bank tile — taps past the real answer length grow the tray past its
// reserved rows and fail `h2Stable`/`noFlicker` for a state no real learner
// is ever in. `resolveAnswerLen` resolves the real `correctOrder.length`
// from the BUNDLED content JSON so `--max-taps` can default to it.
// ---------------------------------------------------------------------------

/** Only `mN.<hash>.json` — never `index.<hash>.json` / `_extra.<hash>.json`
 *  / `manifest.json`, which don't hold `lessons[]`. Pure. */
export function isModuleContentFilename(name) {
  return /^m\d+\.[^./]+\.json$/i.test(String(name ?? ""));
}

/**
 * Resolves `correctOrder.length` for the build/listening-build step named by
 * `--route /<lang>/learn/lessons/<lessonId>?step=<i>` (0-indexed `step`).
 *
 * Content lives in `src/pub/content/v1/<lang>/mN.<hash>.json`, one file per
 * module, each `{ lessons: [{ id, steps: [...] }] }`. **Module membership
 * must NEVER be inferred from the lesson id** — CLAUDE.md's "Id landmine":
 * m2's row lessons carry `ja-m1-*` ids (confirmed live:
 * `src/pub/content/v1/ja/m2.*.json` lists `ja-m1-g-1`, `ja-m1-yoon-intro-1`,
 * …) — so this searches EVERY content file for the language rather than
 * guessing a file from the id.
 *
 * `readFile` is the injected, pure FS accessor (so this function needs no
 * `node:fs` import and is directly unit-testable) used two ways, both
 * synchronous:
 *   - called with a DIRECTORY path (always ending in "/") — must return an
 *     ARRAY of filenames (not full paths) inside it, or throw/return a
 *     falsy value if the directory doesn't exist.
 *   - called with a FILE path — must return that file's contents as a
 *     STRING (this function parses it as JSON), or throw/return a falsy
 *     value if the file doesn't exist / isn't readable.
 *
 * Returns `{ ok: true, answerLen, lang, lessonId, stepIndex, stepType, file
 * }` on success. On failure, `{ ok: false, reason: "..." }` — every caller
 * falls back to today's default behavior (`--max-taps 20`) rather than
 * throwing, per the task's "if the lesson id or step cannot be resolved,
 * say so in the output and fall back to today's behavior."
 */
export function resolveAnswerLen(route, readFile) {
  const pathname = routePathname(String(route ?? ""));
  const m = /^\/([a-z]{2})\/learn\/lessons\/([^/?]+)\/?$/i.exec(pathname);
  if (!m) {
    return { ok: false, reason: `route "${pathname}" doesn't look like /<lang>/learn/lessons/<lessonId>` };
  }
  const lang = m[1];
  const lessonId = m[2];
  const qIndex = String(route ?? "").indexOf("?");
  const search = qIndex === -1 ? "" : String(route).slice(qIndex);
  const stepMatch = /[?&]step=(\d+)/.exec(search);
  const stepIndex = stepMatch ? Number(stepMatch[1]) : 0;

  const dir = `src/pub/content/v1/${lang}/`;
  let filenames;
  try {
    filenames = readFile(dir);
  } catch (err) {
    return { ok: false, reason: `could not list content directory ${dir}: ${String(err?.message || err)}` };
  }
  if (!Array.isArray(filenames) || filenames.length === 0) {
    return { ok: false, reason: `no content files found under ${dir} (unknown language "${lang}"?)` };
  }
  const contentFiles = filenames.filter(isModuleContentFilename);
  if (contentFiles.length === 0) {
    return { ok: false, reason: `${dir} has no mN.<hash>.json files (found ${filenames.length} other file(s))` };
  }

  let lessonFoundInAnyFile = false;
  for (const filename of contentFiles) {
    let raw;
    try {
      raw = readFile(dir + filename);
    } catch {
      continue;
    }
    if (typeof raw !== "string" || raw.length === 0) continue;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const lessons = Array.isArray(parsed?.lessons) ? parsed.lessons : [];
    const lesson = lessons.find((l) => l && l.id === lessonId);
    if (!lesson) continue;
    lessonFoundInAnyFile = true;
    const steps = Array.isArray(lesson.steps) ? lesson.steps : [];
    const step = steps[stepIndex];
    if (!step) {
      return {
        ok: false,
        reason: `lesson "${lessonId}" (${filename}) has no step[${stepIndex}] (only ${steps.length} step(s))`,
      };
    }
    if (step.type !== "build_sentence" && step.type !== "listening_build") {
      return {
        ok: false,
        reason: `lesson "${lessonId}" step[${stepIndex}] is type "${step.type ?? "?"}", not build_sentence/listening_build`,
      };
    }
    const correctOrder = Array.isArray(step.correctOrder) ? step.correctOrder : null;
    if (!correctOrder) {
      return { ok: false, reason: `lesson "${lessonId}" step[${stepIndex}] (${step.type}) has no correctOrder array` };
    }
    return { ok: true, answerLen: correctOrder.length, lang, lessonId, stepIndex, stepType: step.type, file: filename };
  }
  return {
    ok: false,
    reason: lessonFoundInAnyFile
      ? `lesson "${lessonId}" matched a file but not on the step lookup path above (unreachable)`
      : `lesson "${lessonId}" not found in any of ${contentFiles.length} content file(s) under ${dir}`,
  };
}

/**
 * Resolves the effective `--max-taps` (task A: "Default --max-taps to
 * answerLen when not given; keep an explicit --max-taps N override (N >
 * answerLen allowed, for over-placement studies)."). Pure — takes the
 * already-parsed `--max-taps` CLI value (`null` when the flag was omitted)
 * and the `resolveAnswerLen` result, returns the number to actually tap
 * plus WHY (`source`), so callers can log an honest provenance line instead
 * of a bare number.
 */
export function resolveMaxTaps({ maxTapsArg, answerLenResolution }) {
  if (maxTapsArg !== null && maxTapsArg !== undefined && Number.isFinite(maxTapsArg) && maxTapsArg > 0) {
    return { maxTaps: maxTapsArg, source: "explicit" };
  }
  if (answerLenResolution && answerLenResolution.ok) {
    return { maxTaps: answerLenResolution.answerLen, source: "answerLen" };
  }
  return { maxTaps: 20, source: "fallback-default" };
}

// ---------------------------------------------------------------------------
// Golden-learner replay (2026-09-17, lane A2d, docs/golden-replay-2026-09-17.md).
//
// `--replay <file.json>` drives the SAME route/viewport/font-scale a real
// tap recording carries (`sessionLog.ts`'s `buildTapReplayDocument()` —
// `{ route, viewport, fontScale, taps }`) and taps by LABEL, not
// coordinates, so a replay survives a shuffled bank or a reordered tile
// list. The actual browser-side tap loop is `runTapReplay` in
// `src/shared/dev/simProbe.ts` — see that file's own doc comment for why
// this needed one narrow, additive touch to a file outside this lane's
// normal ownership list (no live JS-execution channel exists from this
// Node process into the WKWebView; every other sim-capture mode already
// drives the page this same way, through query params read at load).
//
// `parseReplayFile`/`resolveReplayLabelMatch`/`formatReplayTapTable` below
// are pure and Node-testable (`sim-capture.test.mjs`) without a DOM.
// `resolveReplayLabelMatch` mirrors (BY HAND — no shared module crosses
// the browser/Node boundary in this harness, the same established pattern
// as `FRAME_TRACE_MAX_MS`/`ESTIMATED_SCREENSHOT_RETURN_MS`) the matching
// algorithm `runTapReplay` actually runs against the live DOM; it exists
// here so the ALGORITHM has a test that doesn't need a simulator, not
// because Node itself resolves any real tap.
// ---------------------------------------------------------------------------

/**
 * Validates + parses a recorded tap-replay JSON document (as copied out of
 * the Sync panel's "Copy tap replay" button, or written by
 * `--record-golden`). Pure — takes the raw file text, never touches `fs`.
 * Returns `{ ok: true, doc }` or `{ ok: false, error }` — never throws, so
 * a malformed golden file is a clean `FAIL: ...` line, not a stack trace.
 */
export function parseReplayFile(raw) {
  let json;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: `invalid JSON (${String(err.message || err)})` };
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) return { ok: false, error: "not a JSON object" };
  const { route, viewport, fontScale, taps } = json;
  if (typeof route !== "string" || route.length === 0) return { ok: false, error: "missing/empty \"route\" (string)" };
  if (typeof viewport !== "string" || !/^\d+x\d+$/i.test(viewport)) {
    return { ok: false, error: `"viewport" must be a "WxH" string (got ${JSON.stringify(viewport)})` };
  }
  if (typeof fontScale !== "number" || !Number.isFinite(fontScale) || fontScale <= 0) {
    return { ok: false, error: `"fontScale" must be a positive number (got ${JSON.stringify(fontScale)})` };
  }
  if (!Array.isArray(taps) || taps.length === 0) return { ok: false, error: "\"taps\" must be a non-empty array" };
  for (let i = 0; i < taps.length; i++) {
    const t = taps[i];
    if (!t || typeof t !== "object") return { ok: false, error: `taps[${i}] is not an object` };
    if (typeof t.label !== "string" || t.label.length === 0) return { ok: false, error: `taps[${i}].label must be a non-empty string` };
    if (t.source !== "bank" && t.source !== "answer") return { ok: false, error: `taps[${i}].source must be "bank" or "answer" (got ${JSON.stringify(t.source)})` };
    if (typeof t.position !== "number" || !Number.isInteger(t.position) || t.position < 0) {
      return { ok: false, error: `taps[${i}].position must be a non-negative integer` };
    }
    if (typeof t.tMs !== "number" || !Number.isFinite(t.tMs) || t.tMs < 0) {
      return { ok: false, error: `taps[${i}].tMs must be a non-negative number` };
    }
  }
  return {
    ok: true,
    doc: {
      route,
      viewport,
      fontScale,
      taps: taps.map((t) => ({ tMs: t.tMs, label: t.label, source: t.source, position: t.position })),
    },
  };
}

/**
 * Pure label-matching algorithm — given the labels CURRENTLY on screen in
 * the relevant pool (bank or tray, in DOM order) and the label a recorded
 * tap asks for, which element (by index into `poolLabels`) does a replay
 * tap? `source: "bank"` taps the FIRST remaining match (a spent bank tile
 * drops out of its own selector automatically — see `BANK_TAPPABLE_SELECTOR`
 * in simProbe.ts — so "first remaining match" is exact even with duplicate
 * glyphs). `source: "answer"` (removing an already-placed tray tile) trusts
 * the recorded `position` as the tray SLOT index directly (the tray never
 * reorders under a learner's own taps) and only falls back to a label
 * search if the label at that slot doesn't match (a stale/corrupt replay
 * file) — this mirrors `runTapReplay`'s own fallback in simProbe.ts.
 * Returns `{ index }` on a match, `{ missing: true, visible: poolLabels }`
 * (a HARD FAIL per the brief — "a tap whose label is not on screen") when
 * nothing matches.
 */
export function resolveReplayLabelMatch(poolLabels, tap) {
  const labels = Array.isArray(poolLabels) ? poolLabels : [];
  // A kanji tile's rendered text is not always the recorded label exactly:
  // `sessionLog.ts` records the tile's SEMANTIC value (the reading, e.g.
  // "いえ"), but `<ruby>家<rt>いえ</rt></ruby>`'s `textContent` is "家いえ"
  // (base + reading concatenated — found live, 2026-09-17, replaying a
  // real listening_build golden). EXACT match first; a CONTAINS fallback
  // catches the kanji case without giving up the exact match's precision.
  const find = (label) => {
    const exact = labels.indexOf(label);
    if (exact !== -1) return exact;
    return labels.findIndex((l) => l.includes(label));
  };
  if (tap.source === "answer") {
    if (typeof tap.position === "number" && labels[tap.position] === tap.label) {
      return { index: tap.position };
    }
    const fallback = find(tap.label);
    if (fallback !== -1) return { index: fallback };
    return { missing: true, visible: labels };
  }
  const index = find(tap.label);
  if (index !== -1) return { index };
  return { missing: true, visible: labels };
}

/** Pure table formatter for the replayed tap SEQUENCE itself (which label,
 *  from which source, landed in which tray slot, at what recorded delay) —
 *  distinct from `formatBuildTable`'s per-tap GEOMETRY table, which
 *  `--replay` also prints (reused unchanged; `computeBuildVerdicts` and
 *  `formatBuildTable` don't care whether the taps came from `--simulate
 *  build`'s synthetic loop or a replay's recorded one). */
export function formatReplayTapTable(taps) {
  const list = Array.isArray(taps) ? taps : [];
  const lines = ["  tap#   tMs  source  pos  label"];
  list.forEach((t, i) => {
    lines.push(
      "  " +
        String(i + 1).padStart(4) +
        "  " +
        String(t.tMs).padStart(5) +
        "  " +
        String(t.source).padStart(6) +
        "  " +
        String(t.position).padStart(3) +
        "  " +
        String(t.label),
    );
  });
  return lines.join("\n");
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
  // own CSS dims via a REAL rotation (see "Real device rotation" doc
  // comment) — fails the run unless --allow-emulated-landscape opts into
  // the honest `--viewport WxH` LAYOUT-emulation fallback instead.
  const orientationArg = arg(argv, "orientation", "portrait");
  const allowEmulatedLandscape = Boolean(arg(argv, "allow-emulated-landscape", false));
  const tapSelector = arg(argv, "tap", null);
  const answerFirstOption = Boolean(arg(argv, "answer-first-option", false));
  // `--simulate build` — USER SIMULATION for a build-sentence step: taps
  // every bank tile in turn instead of one (`--tap`), see the top-of-file
  // doc comment addition and `runBuildSimulation` in simProbe.ts.
  const simulateArg = arg(argv, "simulate", null);
  const tapIntervalMs = Number(arg(argv, "tap-interval", "450"));
  // `null` = not passed — task A: default to the resolved `answerLen`
  // (see `resolveAnswerLen`/`resolveMaxTaps`), falling back to today's `20`
  // only when resolution fails. An explicit `--max-taps N` always wins,
  // including N > answerLen for a deliberate over-placement study.
  const maxTapsRaw = arg(argv, "max-taps", null);
  const maxTapsArg = maxTapsRaw === null ? null : Number(maxTapsRaw);
  // Task D: opt back into the OLD multi-shot-per-tap Node screenshot burst
  // (and the browser's fast, non-blocking tap cadence that goes with it —
  // see `runBuildSimulation`'s `frameBurstMode` branch in simProbe.ts).
  // Default (false) is the single-settled-screenshot-per-tap behavior.
  const frameBurst = Boolean(arg(argv, "frame-burst", false));
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
  // Pixel baseline diff (2026-09-17, lane A5b) — see the doc comment above
  // `compareToBaseline`. Mutually exclusive in intent (update WRITES the
  // baseline, compare READS it) — `--update-baseline` wins if both are
  // passed, since "capture what's on screen right now as truth" is the
  // more deliberate of the two asks.
  const compareBaseline = Boolean(arg(argv, "compare-baseline", false));
  const updateBaseline = Boolean(arg(argv, "update-baseline", false));
  // bankVisible (P1b open item 2) — informational by default (prints the px
  // hidden behind the sticky CTA, never fails the run); this flag promotes
  // it to a real exit-code gate. See `computeBuildVerdicts`'s `bankVisible`.
  const enforceBankVisible = Boolean(arg(argv, "enforce-bank-visible", false));
  // Golden-learner replay (2026-09-17, lane A2d) — see the doc comment
  // above `parseReplayFile`. `--speed 1` (default) paces taps at their
  // RECORDED real-time intervals; `--speed 0` fires each tap as soon as the
  // previous one settles (as-fast-as-possible, for a quick CI-shaped run).
  const replayFile = arg(argv, "replay", null);
  const replaySpeed = Number(arg(argv, "speed", "1")) === 0 ? 0 : 1;
  // `--record-golden <name>` (paired with `--simulate build`): after the
  // run, reconstructs the tap sequence from the `tile_tap` rows
  // `sessionLog.ts`'s `logTileTap` posted to `/__sim/report` (real
  // `addTile`/`removeTile` clicks — `--simulate build`'s taps are real DOM
  // `.click()`s, so the SAME React handlers fire) and writes
  // `tests/visual/golden/<name>.replay.json` + `<name>.png`.
  const recordGoldenName = arg(argv, "record-golden", null);
  return {
    route, fontScale, viewportKey, allowFallbackFont, waitMs, overReportBudget, strictProse,
    orientationArg, allowEmulatedLandscape, emulatedSize, tapSelector, answerFirstOption, seedProfile, keepDevServer,
    validationMaxAttempts, expectFontScale, simulateArg, tapIntervalMs, maxTapsArg, frameBurst,
    compareBaseline, updateBaseline, enforceBankVisible, replayFile, replaySpeed, recordGoldenName,
  };
}

// `tryRealRotation` (the old `simctl io <device> screenConfig geometry
// <w>x<h>` attempt) is REMOVED — it picks a different device's screen
// MODE, it does not rotate the current one ("No mode found that supports
// size", verified live against the booted iPad Air 11" M4 with its pixel
// dims swapped). For the record, since a stale version of this comment
// claimed the opposite: `xcrun simctl spawn <udid> defaults read
// com.apple.springboard` DOES run inside the GUEST (it prints the
// simulated iPad's own SpringBoard prefs, not the host Mac's) — that's not
// why geometry-swap failed; `screenConfig geometry` is simply the wrong
// verb (a display-mode picker, not a rotation). Superseded by real
// rotation via XCUITest — see below.

/** Newest of [build-stamp.sourceMtimeMs, every ROTATOR_SOURCES file's own
 *  mtime] — pure comparison split out so `sim-capture.test.mjs` can pin it
 *  without touching the filesystem (mirrors `isStampFresh`'s split for the
 *  app-shell G3 freshness check). */
export function isRotatorFresh(stamp, currentSourceMtimeMs) {
  return Boolean(stamp) && typeof stamp.sourceMtimeMs === "number" && stamp.sourceMtimeMs >= currentSourceMtimeMs;
}

function maxMtimeMs(files) {
  let max = 0;
  for (const f of files) {
    try {
      max = Math.max(max, fs.statSync(f).mtimeMs);
    } catch { /* file missing — ignore, freshness check below will just rebuild */ }
  }
  return max;
}

function readRotatorStamp() {
  try {
    return JSON.parse(fs.readFileSync(ROTATOR_STAMP, "utf8"));
  } catch {
    return null;
  }
}

function rotatorIsFresh() {
  return isRotatorFresh(readRotatorStamp(), maxMtimeMs(ROTATOR_SOURCES));
}

/**
 * Real device rotation (see the "Real device rotation" doc comment at the
 * top of this file for the full mechanism/evidence). Builds the standalone
 * `Rotator.xcodeproj` XCUITest bundle once (cached under `ROTATOR_DD` by a
 * source-mtime stamp, same pattern as `shellIsFresh`/G3 for the app shell —
 * `xcodebuild test` on a fresh cache ALSO performs the first rotation, to
 * the value the caller actually asked for, so nothing is wasted), then
 * drives it with `xcodebuild test-without-building` (no rebuild — this is
 * the fast path, seconds not tens-of-seconds) on every subsequent call.
 *
 * `-parallel-testing-enabled NO` is REQUIRED — without it `xcodebuild`
 * clones the destination simulator and rotates the throwaway clone,
 * leaving this harness's actual persistent simulator untouched (see the
 * top-of-file doc comment). `TEST_RUNNER_ROTATE_TO` MUST be a real process
 * environment variable on the `xcodebuild` child process (`env: {...}`
 * below) — passing it as a trailing `KEY=value` xcodebuild argument is
 * silently swallowed as a build-setting override and never reaches the
 * running test (confirmed live 2026-09-16).
 *
 * Throws (propagating the `execSync` failure) on any build/test failure —
 * callers decide whether that's fatal or whether `--allow-emulated-landscape`
 * downgrades it to a fallback.
 */
function rotateDevice(udid, to) {
  const t0 = Date.now();
  const fresh = rotatorIsFresh();
  const action = fresh ? "test-without-building" : "test";
  console.log(
    `${fresh ? "rotating" : "building + rotating"} device to ${to} via XCUITest rotator ` +
      `(scripts/ux-loop/sim-rotate, xcodebuild ${action})…`
  );
  fs.mkdirSync(ROTATOR_DD, { recursive: true });
  execSync(
    `xcodebuild ${action} -project "${ROTATOR_PROJECT}" -scheme Rotator ` +
      `-destination "platform=iOS Simulator,id=${udid}" -derivedDataPath "${ROTATOR_DD}" ` +
      `-parallel-testing-enabled NO`,
    { stdio: "inherit", env: { ...process.env, TEST_RUNNER_ROTATE_TO: to } }
  );
  if (!fresh) {
    fs.writeFileSync(
      ROTATOR_STAMP,
      JSON.stringify({ builtAt: new Date().toISOString(), sourceMtimeMs: maxMtimeMs(ROTATOR_SOURCES) }, null, 2)
    );
  }
  const elapsedSec = (Date.now() - t0) / 1000;
  console.log(`rotator run took ${elapsedSec.toFixed(1)}s (${fresh ? "cached build" : "fresh build"})`);
  return elapsedSec;
}

/** Restore the simulator to portrait after a REAL landscape capture — see
 *  the "Real device rotation" doc comment. Best-effort: a failure here
 *  shouldn't mask whatever exit code the capture itself earned, so it only
 *  warns. No-op for portrait/emulated-* (those never physically rotated the
 *  device). */
function restorePortraitIfNeeded(udid, orientation) {
  if (orientation !== "landscape") return;
  try {
    rotateDevice(udid, "portrait");
  } catch (err) {
    console.warn(`WARN: failed to restore portrait after landscape capture: ${String(err.message || err).split("\n")[0]}`);
  }
}

/** `resolveAnswerLen`'s injected FS accessor, backed by real `node:fs` — see
 *  that function's doc comment for the dir-vs-file contract. */
function realReadFile(p) {
  return p.endsWith("/") ? fs.readdirSync(p) : fs.readFileSync(p, "utf8");
}

async function main() {
  let {
    route, fontScale, viewportKey, allowFallbackFont, waitMs, overReportBudget, strictProse,
    orientationArg, allowEmulatedLandscape, emulatedSize, tapSelector, answerFirstOption, seedProfile, keepDevServer,
    validationMaxAttempts, expectFontScale, simulateArg, tapIntervalMs, maxTapsArg, frameBurst,
    compareBaseline, updateBaseline, enforceBankVisible, replayFile, replaySpeed, recordGoldenName,
  } = parseArgs(process.argv.slice(2));

  // Golden-learner replay (2026-09-17, lane A2d) — `--replay <file>` reads
  // its OWN route/viewport/fontScale from the recorded document, overriding
  // whatever `--route`/`--viewport`/`--font-scale` were also passed (a
  // faithful replay is the whole point — see docs/golden-replay-2026-09-17.md).
  let replayDoc = null;
  if (replayFile) {
    let raw;
    try {
      raw = fs.readFileSync(replayFile, "utf8");
    } catch (err) {
      console.error(`FAIL: --replay ${replayFile}: cannot read file (${String(err.message || err)})`);
      process.exit(1);
    }
    const parsed = parseReplayFile(raw);
    if (!parsed.ok) {
      console.error(`FAIL: --replay ${replayFile}: ${parsed.error}`);
      process.exit(1);
    }
    replayDoc = parsed.doc;
    route = replayDoc.route;
    fontScale = replayDoc.fontScale;
    expectFontScale = replayDoc.fontScale;
    // A recorded "WxH" that matches a KNOWN named device's own CSS size
    // (e.g. "430x932" === 15-pro-max) replays as that NATIVE device, not
    // `--viewport WxH` LAYOUT emulation — emulation zeroes the real
    // `env(safe-area-inset-*)` px (found live: an emulated-portrait replay
    // of a 15-pro-max recording reported safeAreaInsets 0/0/0/0 vs the
    // real capture's 59/0/34/0), which changes the stage crop box and
    // fails `--compare-baseline` for a harness artifact, not a real
    // regression. Only an UNKNOWN WxH (no named device matches) falls back
    // to literal emulation.
    const namedMatch = findNamedViewport(replayDoc.viewport);
    if (namedMatch) {
      viewportKey = namedMatch;
      emulatedSize = null;
    } else {
      const replayEmu = parseEmulatedSize(replayDoc.viewport);
      if (replayEmu) {
        emulatedSize = replayEmu;
        viewportKey = arg(process.argv.slice(2), "device", "15-pro-max");
      } else {
        console.warn(
          `WARN: --replay viewport "${replayDoc.viewport}" is not a "WxH" literal — falling back to --viewport/--device as passed on the CLI`
        );
      }
    }
    simulateArg = "replay";
    console.log(`--replay ${replayFile}: ${replayDoc.taps.length} tap(s), route=${route} viewport=${replayDoc.viewport} fontScale=${fontScale}`);
  }

  const buildSimActive = simulateArg === "build";
  const replayActive = simulateArg === "replay";
  // Task A: resolve the real answer length from the bundled content JSON so
  // `--max-taps` can default to it instead of tapping every distractor tile
  // in a padded bank. Falls back to today's `20` default when resolution
  // fails (unknown route shape, lesson not found, non-build step, …) — see
  // `resolveAnswerLen`'s own doc comment.
  const answerLenResolution = buildSimActive ? resolveAnswerLen(route, realReadFile) : { ok: false, reason: "not a build simulation" };
  const { maxTaps, source: maxTapsSource } = resolveMaxTaps({ maxTapsArg, answerLenResolution });
  if (buildSimActive) {
    if (answerLenResolution.ok) {
      console.log(
        `resolved answerLen=${answerLenResolution.answerLen} for ${answerLenResolution.lessonId} step[${answerLenResolution.stepIndex}] ` +
          `(${answerLenResolution.stepType}, ${answerLenResolution.file}) — max-taps=${maxTaps} (${maxTapsSource})`
      );
    } else if (maxTapsSource === "fallback-default") {
      console.warn(
        `WARN: could not resolve answerLen (${answerLenResolution.reason}) — falling back to --max-taps ${maxTaps} (today's default behavior)`
      );
    }
  }
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
    orientation = "landscape"; // optimistic — downgraded to emulated-landscape below only if --allow-emulated-landscape was passed AND the real rotation fails
  }

  console.log(`booting ${viewport.device}…`);
  const dev = await ensureBooted(viewport.device);

  console.log(`ensuring dev server on :${DEV_PORT}…`);
  await ensureDevServer({ keepExisting: keepDevServer });

  if (!shellIsFresh(dev.udid)) {
    buildAndInstallShell(dev.udid);
  } else {
    console.log("app shell already installed and wired to this dev server — skipping build");
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(PROBE_LOG), { recursive: true });

  // Real device rotation — see the top-of-file doc comment. Runs BEFORE the
  // app is launched (rotation is a SpringBoard/simulator-wide property, not
  // something the app reacts to after the fact). No probe needed here any
  // more: `validateCapture`'s G6 swapped-axis check below is the oracle —
  // if the rotation didn't really stick, the capture just fails validation
  // honestly instead of a separate probe silently deciding to downgrade.
  if (orientation === "landscape") {
    try {
      rotateDevice(dev.udid, "landscapeLeft");
    } catch (err) {
      const msg = `real device rotation failed: ${String(err.message || err).split("\n")[0]}`;
      if (allowEmulatedLandscape) {
        console.warn(`${msg} — falling back to --viewport WxH LAYOUT emulation (--allow-emulated-landscape was passed)`);
        orientation = "emulated-landscape";
        emuW = viewport.h;
        emuH = viewport.w;
      } else {
        throw new Error(`${msg}\nPass --allow-emulated-landscape to fall back to LAYOUT emulation instead of failing.`);
      }
    }
  }

  // A tap sequence needs an extra ~2.3s (1500ms pre-measure + 800ms
  // post-click settle, see simProbe.ts's runTapSequence) before the LAST
  // scheduled tick (12000ms) can carry its result — bump the default wait
  // so --tap/--answer-first-option captures aren't cut short.
  // `--simulate build`'s own worst case mirrors the extra tick
  // `installSimProbe` schedules for this mode (1500ms settle + the tap loop
  // itself + a 3000ms report round-trip tail) PLUS this file's own
  // Node-side screenshot overhead — matched here so the CLI doesn't give up
  // before either tail finishes. +2000 margin on top. Two shapes (task D):
  //   - `--frame-burst`: unchanged — maxTaps*tapIntervalMs (fixed cadence)
  //     + FRAME_TRACE_MAX_MS (the LAST tap's fire-and-forgotten frame
  //     trace) + maxTaps*SCREENSHOT_BURST_MS (worst case every tap gets a
  //     full-length burst).
  //   - default (single-shot): EVERY tap now awaits its own frame trace
  //     before the next fires (simProbe.ts's `runBuildSimulation`), so the
  //     worst case is maxTaps full FRAME_TRACE_MAX_MS caps back to back,
  //     plus one `ESTIMATED_SCREENSHOT_RETURN_MS`-scale shot per tap.
  const buildSimTapLoopWorstMs = frameBurst
    ? maxTaps * tapIntervalMs + FRAME_TRACE_MAX_MS + maxTaps * SCREENSHOT_BURST_MS
    : maxTaps * (Math.max(tapIntervalMs, FRAME_TRACE_MAX_MS, ESTIMATED_SCREENSHOT_RETURN_MS) + 200) + maxTaps * ESTIMATED_SCREENSHOT_RETURN_MS;
  const buildSimTotalMs = 1500 + buildSimTapLoopWorstMs + 3000;
  // Golden-learner replay worst case: `--speed 1` (real-time) waits out the
  // LAST tap's recorded `tMs` (a human's own pauses, not a fixed cadence)
  // on top of each tap's own settle (mirrors the non-burst build-sim
  // formula above); `--speed 0` fires as fast as each tap settles, so only
  // the settle sum matters.
  const replayLastTMs = replayActive && replayDoc ? Math.max(0, ...replayDoc.taps.map((t) => t.tMs)) : 0;
  const replayTapCount = replayActive && replayDoc ? replayDoc.taps.length : 0;
  const replaySettleSumMs = replayTapCount * (FRAME_TRACE_MAX_MS + ESTIMATED_SCREENSHOT_RETURN_MS + 200);
  const replayTotalMs = 1500 + (replaySpeed === 1 ? replayLastTMs : 0) + replaySettleSumMs + 3000;
  const effectiveWaitMs = buildSimActive
    ? Math.max(waitMs, buildSimTotalMs + 2000)
    : replayActive
      ? Math.max(waitMs, replayTotalMs + 2000)
      : tapSelector || answerFirstOption
        ? Math.max(waitMs, 15000)
        : waitMs;
  // The window the GLOBAL launch lock (PHASE2A.md §6.7 item 2) actually
  // needs to cover: write target file → terminate → clear state → launch →
  // enough settle time for the app's own GET /__sim to land and read the
  // file we just wrote, before the OTHER device's run is allowed to
  // overwrite it. Short relative to effectiveWaitMs, so two devices still
  // spend most of a capture running in parallel.
  const LAUNCH_SETTLE_MS = 3000;

  const slug = captureSlug(route, fontScale, { viewportKey, orientation });
  const expected = {
    // `orientation` here drives validateCapture's w/h swap for a REAL
    // (non-emulated) landscape capture — see its doc comment (G6).
    route, fontScale: expectFontScale, viewportKey, viewport, orientation, emulated: Boolean(emuW && emuH), emuW, emuH,
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
        const targetRoute = buildTargetRoute(route, {
          fontScale, emuW, emuH, tapSelector, answerFirstOption, seedProfile, runNonce,
          simulate: simulateArg, tapIntervalMs, maxTaps, frameBurst,
          replayTaps: replayDoc?.taps, replaySpeed,
        });

        const sinceLine = countLines(PROBE_LOG);
        const releaseLaunchLock = await acquireAdvisoryLock(LAUNCH_LOCK_KEY, { timeoutMs: 60000 });
        try {
          fs.writeFileSync(TARGET_FILE, targetRoute);
          try {
            simctl("terminate", dev.udid, BUNDLE_ID);
          } catch { /* not running */ }
          clearSavedAppState(dev.udid);
          // Orientation (real or emulated) was already resolved above, before
          // the app ever launched — see `launchApp`'s doc comment.
          launchApp(dev.udid, BUNDLE_ID);
          console.log(`[attempt ${attempt}/${validationMaxAttempts}] launched at ${targetRoute} (runNonce=${runNonce})`);
          await sleep(Math.min(LAUNCH_SETTLE_MS, effectiveWaitMs));
        } finally {
          releaseLaunchLock();
        }

        const remainingWaitMs = effectiveWaitMs - Math.min(LAUNCH_SETTLE_MS, effectiveWaitMs);
        /** @type {Map<number, { shots: {file: string, tMs: number}[], capturedAt: number, queueDelayMs: number }>} */
        let buildShots = new Map();
        if (remainingWaitMs > 0) {
          if (buildSimActive || replayActive) {
            // Replay reuses the SAME marker-driven per-tap screenshot loop —
            // `runTapReplay` (simProbe.ts) posts the identical `"tap"`/
            // `"final"` markers `runBuildSimulation` does.
            buildShots = await waitAndCaptureBuildTapShots(dev.udid, remainingWaitMs, sinceLine, runNonce, slug, attempt, tapIntervalMs, frameBurst);
          } else {
            console.log(`waiting ${remainingWaitMs}ms more for the probe ticks…`);
            await sleep(remainingWaitMs);
          }
        }

        const attemptScreenshotFile = path.join(OUT_DIR, `${slug}.attempt${attempt}.png`);
        simctl("io", dev.udid, "screenshot", attemptScreenshotFile);

        reports = readNewReports(PROBE_LOG, sinceLine);
        // Golden-learner replay (2026-09-17, lane A2d): `/__sim/report` now
        // also carries `postSimMarker`-style marker posts (pre-existing)
        // AND `sessionLog.ts`'s per-tap `{tapEvent: {...}}` posts (new) —
        // NEITHER carries the full tick() shape (`route`/`href`/`fontScale`/
        // ...) `validateCapture` and the rest of this file need. Taking the
        // literal last LINE (any of these three shapes, whichever happened
        // to be posted last) used to be safe when only ticks and occasional
        // markers competed for that slot; a long tap sequence (21 taps ×
        // one tapEvent post each) makes it common for the LAST line to be
        // one of those instead — found live, 2026-09-17, replaying the
        // 21-tile huge-bank golden ("route: expected ..., got ''"). Filter
        // to the last entry that actually HAS the tick shape (`href` is
        // present on every real tick, never on a marker/tapEvent post).
        const tickReports = reports.filter((r) => r && typeof r.href === "string");
        const report = tickReports.length > 0 ? tickReports[tickReports.length - 1] : null;
        return { report, targetRoute, runNonce, attemptScreenshotFile, buildShots };
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
  /** @type {Map<number, { shots: {file: string, tMs: number}[], capturedAt: number, queueDelayMs: number }>} */
  const buildShots = outcome.result.buildShots || new Map();
  if (validation.ok) {
    // Promote the WINNING attempt's screenshot to the canonical filename —
    // a canonical file only ever exists for a VALIDATED capture.
    fs.copyFileSync(outcome.result.attemptScreenshotFile, path.join(OUT_DIR, `${slug}.png`));
  }

  // `--simulate build`: judge the raw samples the browser collected (see
  // `computeBuildVerdicts`'s doc comment — collection/judgment split).
  // Computed BEFORE the JSON write so the written capture file's
  // `report.simulation` already carries `verdicts`, matching the task's
  // `simulation: { mode, taps, samples, verdicts }` shape. Task B: pass the
  // resolved `answerLen` (+ `tapIntervalMs`, for the noFlicker time window)
  // so the tray-growth verdicts ignore over-placement taps.
  let buildVerdicts = null;
  const frameScreenshots = {}; // tapNumber -> { shots, queueDelayMs }
  let tapContactSheet = null;
  // Golden-learner replay: a `report.simulation.ok === false` (a recorded
  // label wasn't found on screen — `runTapReplay`'s hard fail) has no
  // honest samples to judge; that's handled as its own FAIL below, not run
  // through `computeBuildVerdicts`.
  const replayFailed = report?.simulation?.mode === "replay" && report.simulation.ok === false;
  if ((report?.simulation?.mode === "build" || report?.simulation?.mode === "replay") && !replayFailed) {
    buildVerdicts = computeBuildVerdicts(report.simulation.samples, {
      layoutTrace: report.simulation.layoutTrace,
      answerLen: answerLenResolution.ok ? answerLenResolution.answerLen : null,
      tapIntervalMs,
      enforceBankVisible,
    });
    report.simulation.verdicts = buildVerdicts;

    if (validation.ok) {
      // Crop + tile every tap's raw shot(s) into ONE contact sheet JPG for
      // the whole run (task D — was one small sheet per tap) — done HERE
      // (post-run), not inside the capture loop, because it needs the
      // stage rect + dpr the FULL report only carries once everything's
      // in. `samples[0]` (the pre-tap-1 baseline) is used as the stage-rect
      // reference for every tap: the stage's left/top/width rarely move tap
      // to tap (only its CONTENTS resize within it), so one reference rect
      // is enough and avoids re-deriving a slightly different crop box per
      // tap for no benefit.
      const baseline = report.simulation.samples?.[0];
      const dpr = typeof report.dpr === "number" ? report.dpr : 1;
      const stage =
        baseline && typeof baseline.stageLeft === "number" && typeof baseline.stageTop === "number" &&
        typeof baseline.stageWidth === "number" && typeof baseline.stageH === "number"
          ? { left: baseline.stageLeft, top: baseline.stageTop, width: baseline.stageWidth, height: baseline.stageH }
          : null;
      tapContactSheet = stage ? composeRunContactSheet(buildShots, stage, dpr, slug) : null;
      for (const [tapNumber, entry] of buildShots.entries()) {
        frameScreenshots[tapNumber] = {
          shots: entry.shots.map((s) => ({ file: s.file, tMs: s.tMs })),
          queueDelayMs: entry.queueDelayMs,
        };
      }
      if (!stage) {
        console.warn("WARN: no stage rect in report.simulation.samples[0] — skipping the tap contact sheet");
      }
    }
  }

  const screenshotFile = path.join(OUT_DIR, `${slug}.png`);
  const jsonFile = path.join(OUT_DIR, `${slug}.json`);
  fs.writeFileSync(
    jsonFile,
    JSON.stringify({
      route, fontScale, viewport: viewportKey, orientation, emulated: Boolean(emuW && emuH),
      device: viewport.device, seedProfile, tapSelector, answerFirstOption, targetRoute,
      validation, capturedAt: new Date().toISOString(),
      screenshot: validation.ok ? screenshotFile : null,
      // Task A: the resolved real answer length (and why/why-not, and the
      // final --max-taps decision) for this build-sim capture, `null` for
      // every other mode.
      answerLen: answerLenResolution.ok ? answerLenResolution.answerLen : null,
      answerLenResolution: buildSimActive ? answerLenResolution : null,
      maxTaps: buildSimActive ? maxTaps : null,
      maxTapsSource: buildSimActive ? maxTapsSource : null,
      frameScreenshots,
      tapContactSheet,
      report, allReports: reports,
    }, null, 2)
  );

  if (!validation.ok) {
    console.error("");
    console.error(`FAIL: capture never validated after ${validationMaxAttempts} attempt(s):`);
    for (const m of validation.mismatches) console.error(`FAIL:   ${m}`);
    console.error(`wrote ${jsonFile} (no canonical screenshot promoted — see ${slug}.attempt*.png in ${OUT_DIR})`);
    restorePortraitIfNeeded(dev.udid, orientation);
    process.exit(1);
  }

  // Golden-learner replay HARD FAIL (task 2 of the brief: "a tap whose
  // label is not on screen = hard fail with the visible labels listed") —
  // the capture itself validated (route/viewport/fontScale matched), but
  // the recorded tap sequence couldn't be replayed faithfully, so there is
  // nothing honest left to judge (no verdicts, no pixel compare).
  if (replayFailed) {
    const tapIdx = (report.simulation.missingAtTapIndex ?? 0) + 1;
    console.error("");
    console.error(`FAIL: replay tap ${tapIdx}/${replayDoc?.taps.length ?? "?"} — label ${JSON.stringify(report.simulation.missingLabel)} not found on screen`);
    console.error(`FAIL:   visible labels: ${JSON.stringify(report.simulation.visibleLabels ?? [])}`);
    console.error(`wrote ${jsonFile}`);
    restorePortraitIfNeeded(dev.udid, orientation);
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
  if (report?.simulation?.mode === "build" || report?.simulation?.mode === "replay") {
    console.log("");
    if (report.simulation.mode === "replay") {
      console.log(`replay: ${replayFile} — ${report.simulation.taps} tap(s) replayed, speed=${replaySpeed}`);
      console.log(formatReplayTapTable(replayDoc?.taps ?? []));
      console.log("");
    } else {
      // Task A: "answerLen=6 tapped=6" — the real answer length this run
      // resolved, next to how many taps actually ran.
      const answerLenLabel = answerLenResolution.ok ? String(answerLenResolution.answerLen) : "?";
      console.log(
        `build-simulation: answerLen=${answerLenLabel} tapped=${report.simulation.taps} ` +
          `(--tap-interval ${tapIntervalMs}ms --max-taps ${maxTaps}${maxTapsSource !== "explicit" ? ` [${maxTapsSource}]` : ""}${frameBurst ? " --frame-burst" : ""})`
      );
    }
    console.log(formatBuildTable(report.simulation.samples, { answerLen: answerLenResolution.ok ? answerLenResolution.answerLen : null }));
    for (const [name, v] of Object.entries(buildVerdicts)) {
      const detail = Array.isArray(v.badTaps) && v.badTaps.length > 0 ? ` (taps ${v.badTaps.join(",")})` : v.detail ? ` (${v.detail})` : "";
      // `na` = the field this verdict judges was never sampled, so the run
      // is not entitled to claim PASS (C4). It is not a FAIL either — the
      // exit code is unaffected (`formatBuildVerdictFailure` filters on
      // `ok === false`) — so the reader sees a hole instead of a tick.
      console.log(`  ${name}: ${v.na ? "N/A" : v.ok ? "PASS" : "FAIL"}${detail}`);
    }
    if (Array.isArray(report.simulation.frames) && report.simulation.frames.length > 0) {
      console.log("");
      console.log("frame capture (per-tap, rAF-sampled):");
      console.log(formatFrameTable(report.simulation.frames));
    }
    const shotEntries = Object.entries(frameScreenshots);
    if (shotEntries.length > 0) {
      const allShotGaps = [];
      for (const [, fs2] of shotEntries) {
        for (let i = 1; i < fs2.shots.length; i++) allShotGaps.push(fs2.shots[i].tMs - fs2.shots[i - 1].tMs);
      }
      const meanGap = allShotGaps.length > 0 ? Math.round(allShotGaps.reduce((a, b) => a + b, 0) / allShotGaps.length) : null;
      console.log("");
      console.log(
        `screenshots: ${shotEntries.length} tap(s), ${frameBurst ? "burst mode" : "single-shot mode"}, measured mean gap between shots ` +
          `${meanGap === null ? "n/a (≤1 shot/tap)" : `${meanGap}ms`} (see doc comment on waitAndCaptureBuildTapShots for the honest limits)`
      );
      for (const [tapNumber, fs2] of shotEntries) {
        console.log(`  tap ${tapNumber}: ${fs2.shots.length} shot(s) at t=${fs2.shots.map((s) => s.tMs).join(",")}ms, queueDelayMs=${fs2.queueDelayMs}`);
      }
      console.log(`  tap contact sheet (ordered tap 0..N): ${tapContactSheet ?? "(none)"}`);
    }
  }
  console.log("");
  console.log(`wrote ${jsonFile}`);
  console.log(`wrote ${screenshotFile}`);

  // Golden-learner replay RECORDING (2026-09-17, lane A2d) —
  // `--record-golden <name>`, paired with `--simulate build`. Reconstructs
  // the tap sequence from the `tile_tap` rows `sessionLog.ts`'s
  // `logTileTap` best-effort POSTed to `/__sim/report` DURING this same
  // run (real `addTile`/`removeTile` clicks — `--simulate build` taps are
  // real DOM `.click()`s, so the SAME React handlers that fire for a human
  // tap fired here too) — this is the "drive the app... and export the tap
  // replay" recording path the brief asks the golden set be seeded with,
  // not hand-written JSON.
  if (buildSimActive && recordGoldenName && validation.ok) {
    const tapEvents = reports
      .filter((r) => r && r.tapEvent && r.tapEvent.type === "tile_tap")
      .map((r) => r.tapEvent)
      .sort((a, b) => a.ts - b.ts);
    if (tapEvents.length === 0) {
      console.warn(
        "WARN: --record-golden requested but no tile_tap rows arrived at /__sim/report — " +
          "was the sim-probe flag armed (it always is under sim-capture.mjs) and did any tap actually land? Nothing written."
      );
    } else {
      const goldenDir = "tests/visual/golden";
      fs.mkdirSync(goldenDir, { recursive: true });
      const goldenDoc = {
        route,
        viewport: `${viewport.w}x${viewport.h}`,
        fontScale,
        taps: tapEvents.map((e) => ({
          tMs: e.payload.tMs,
          label: e.payload.label,
          source: e.payload.source,
          position: e.payload.position,
        })),
      };
      const goldenReplayPath = path.join(goldenDir, `${recordGoldenName}.replay.json`);
      fs.writeFileSync(goldenReplayPath, JSON.stringify(goldenDoc, null, 2));
      console.log(`recorded golden: ${goldenReplayPath} (${goldenDoc.taps.length} taps)`);
      const stageRect = stageRectFromReport(report);
      if (stageRect) {
        const box = cropBoxPx(stageRect, report.dpr);
        const goldenPngPath = path.join(goldenDir, `${recordGoldenName}.png`);
        try {
          cropScreenshotToStage(screenshotFile, box, goldenPngPath);
          console.log(`recorded golden baseline: ${goldenPngPath}`);
        } catch (err) {
          console.warn(`WARN: sips crop failed while recording the golden baseline (${String(err?.message || err).split("\n")[0]})`);
        }
      } else {
        console.warn("WARN: no stage rect in the report — golden baseline PNG not written (replay.json still recorded)");
      }
    }
  }

  // Pixel baseline diff (2026-09-17, lane A5b) — `--compare-baseline` /
  // `--update-baseline`. Only runs on a VALIDATED capture (a canonical
  // screenshot exists) — there is nothing honest to crop from a failed
  // attempt. See the doc comment above `compareToBaseline` for the tool
  // choice/threshold/noise-measurement writeup.
  let pixelBaselineResult = null;
  // Golden-learner replay: pixel-compares the settled stage crop against
  // its OWN co-located baseline (`<name>.png` next to `<name>.replay.json`
  // — task 3's golden set, not the shared `tests/visual/baselines/` pool)
  // ALWAYS, not only when `--compare-baseline` is explicitly passed — a
  // replay's whole point is "does this build still match the last approved
  // run", so the pixel check is part of the mode, not an opt-in.
  const goldenBaselinePath =
    replayActive && replayFile ? path.join(path.dirname(replayFile), `${path.basename(replayFile).replace(/\.replay\.json$/i, "")}.png`) : null;
  if (validation.ok && (compareBaseline || updateBaseline || replayActive)) {
    const stageRect = stageRectFromReport(report);
    if (!stageRect) {
      console.warn(
        "WARN: --compare-baseline/--update-baseline/--replay requested but the report has no [data-lesson-stage] rect (stage/stageLeft/stageWidth) — skipping the pixel check"
      );
    } else {
      const box = cropBoxPx(stageRect, report.dpr);
      const croppedPath = path.join(OUT_DIR, `${slug}.stage.png`);
      let cropped = false;
      try {
        cropScreenshotToStage(screenshotFile, box, croppedPath);
        cropped = true;
      } catch (err) {
        console.warn(`WARN: sips crop failed (${String(err?.message || err).split("\n")[0]}) — skipping the pixel check`);
      }
      if (cropped) {
        fs.mkdirSync(goldenBaselinePath ? path.dirname(goldenBaselinePath) : BASELINE_DIR, { recursive: true });
        const baselinePath = goldenBaselinePath ?? path.join(BASELINE_DIR, baselineFilename(slug));
        if (updateBaseline) {
          fs.copyFileSync(croppedPath, baselinePath);
          console.log(`updated baseline: ${baselinePath}`);
        } else {
          const diffOutPath = path.join(OUT_DIR, `${slug}.diff.png`);
          pixelBaselineResult = await compareToBaseline(croppedPath, baselinePath, diffOutPath);
          if (pixelBaselineResult.reason === "no-baseline") {
            console.error(`FAIL: no baseline at ${baselinePath} — run with --update-baseline to create one`);
          } else if (pixelBaselineResult.reason === "layout-diff") {
            console.error(
              `FAIL: stage crop dimensions differ from the baseline (${baselinePath}) — a real sizing change, or a stale baseline (re-run with --update-baseline if this change is expected and ledgered)`
            );
          } else {
            console.log(
              `pixelDiff=${pixelBaselineResult.ratio.toFixed(4)}% threshold=${PIXEL_DIFF_THRESHOLD_PCT}% ${pixelBaselineResult.ok ? "PASS" : "FAIL"}`
            );
            if (!pixelBaselineResult.ok) console.error(`FAIL: pixel baseline diff — see ${pixelBaselineResult.diffPath}`);
          }
        }
      }
    }
  }

  const verdict = evaluateReport(report, { overReportBudget, allowFallbackFont, strictProse });
  const buildFailLine = buildVerdicts ? formatBuildVerdictFailure(buildVerdicts) : null;
  // Restore portrait now — covers both the pass and fail branches below —
  // before whichever exit code this run earns.
  restorePortraitIfNeeded(dev.udid, orientation);
  for (const w of verdict.warnings) console.warn(`WARN: ${w}`);
  let failed = false;
  if (!verdict.ok) {
    failed = true;
    for (const r of verdict.reasons) console.error(`FAIL: ${r}`);
  }
  if (buildFailLine) {
    failed = true;
    console.error(buildFailLine);
  }
  if (pixelBaselineResult && !pixelBaselineResult.ok) {
    failed = true;
  }
  if (failed) {
    process.exit(1);
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
