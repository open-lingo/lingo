// Dry-run tests for sim-capture.mjs's pure exit-code/verdict logic.
//
// Uses Node's built-in test runner (no vitest — `scripts/` is outside the
// vitest project's `include` globs in vite.config.ts, and this file needs
// no DOM). Run with:
//
//   node --test scripts/ux-loop/sim-capture.test.mjs
//
// Nothing here touches simctl/xcodebuild/the network — it only imports the
// pure functions `sim-capture.mjs` exports, guarded so importing the module
// never runs the CLI (see the `isMain` check at the bottom of that file).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  evaluateReport,
  captureSlug,
  formatSummaryTable,
  parseEmulatedSize,
  parseArgs,
  isStampFresh,
  isRotatorFresh,
  DEV_URL,
  routePathname,
  buildTargetRoute,
  validateCapture,
  lockFilePath,
  isLockStale,
  acquireAdvisoryLock,
  runWithValidationRetry,
  computeBuildVerdicts,
  formatBuildTable,
  formatBuildVerdictFailure,
  computeFrameDerivedMetrics,
  formatFrameTable,
  isModuleContentFilename,
  resolveAnswerLen,
  resolveMaxTaps,
  recomputeFlickerWithinWindow,
  computeNextTapDelayMs,
} from "./sim-capture.mjs";

function baseReport(overrides = {}) {
  return {
    rootFontPx: 20,
    fontScale: 1.25,
    notoLoaded: true,
    sampleTileFontFamily: '"Noto Sans JP"',
    emRatio: 1.5,
    textSizeAdjust: "100%",
    dpr: 3,
    pointerCoarse: true,
    nativeMode: true,
    vv: 844,
    innerHeight: 844,
    stage: { top: 0, bottom: 644, h: 644 },
    stageOverReportPx: 0,
    tiles: [],
    ...overrides,
  };
}

test("evaluateReport passes a clean report", () => {
  const v = evaluateReport(baseReport());
  assert.equal(v.ok, true);
  assert.equal(v.exitCode, 0);
  assert.deepEqual(v.reasons, []);
});

test("evaluateReport fails on a wrapped tile (TestFlight #156's shape)", () => {
  const report = baseReport({
    tiles: [{ text: "ばんごはん", variant: "option", fontPx: 30, boxW: 192, boxH: 177, lineCount: 2, wrapped: true, clipped: false }],
  });
  const v = evaluateReport(report);
  assert.equal(v.ok, false);
  assert.equal(v.exitCode, 1);
  assert.match(v.reasons.join(" "), /wrapped/);
});

test("evaluateReport fails on a clipped tile", () => {
  const report = baseReport({
    tiles: [{ text: "れんしゅう", variant: "option", fontPx: 30, boxW: 150, boxH: 60, lineCount: 1, wrapped: false, clipped: true }],
  });
  const v = evaluateReport(report);
  assert.equal(v.ok, false);
  assert.match(v.reasons.join(" "), /clipped/);
});

test("evaluateReport is silent on a wrapped/clipped tile that fits", () => {
  const report = baseReport({
    tiles: [{ text: "こうえん", variant: "option", fontPx: 30, boxW: 192, boxH: 60, lineCount: 1, wrapped: false, clipped: false }],
  });
  assert.equal(evaluateReport(report).ok, true);
});

test("evaluateReport fails when stage over-report exceeds the default 40px budget", () => {
  const report = baseReport({ stageOverReportPx: 200 }); // the b20 #157/#161 shape
  const v = evaluateReport(report);
  assert.equal(v.ok, false);
  assert.match(v.reasons.join(" "), /over-report 200px exceeds budget 40px/);
});

test("evaluateReport passes at exactly the over-report budget (not exceeding it)", () => {
  const report = baseReport({ stageOverReportPx: 40 });
  assert.equal(evaluateReport(report).ok, true);
});

test("evaluateReport respects a custom --over-report-budget", () => {
  const report = baseReport({ stageOverReportPx: 60 });
  assert.equal(evaluateReport(report, { overReportBudget: 100 }).ok, true);
  assert.equal(evaluateReport(report, { overReportBudget: 40 }).ok, false);
});

test("evaluateReport fails when Noto Sans JP did not load", () => {
  const report = baseReport({ notoLoaded: false });
  const v = evaluateReport(report);
  assert.equal(v.ok, false);
  assert.match(v.reasons.join(" "), /Noto Sans JP did not load/);
});

test("--allow-fallback-font downgrades a missing Noto Sans JP to a warning", () => {
  const report = baseReport({ notoLoaded: false });
  const v = evaluateReport(report, { allowFallbackFont: true });
  assert.equal(v.ok, true);
  assert.equal(v.exitCode, 0);
  assert.equal(v.reasons.length, 0);
  assert.match(v.warnings.join(" "), /Noto Sans JP did not load/);
});

test("evaluateReport fails loudly when no report was captured at all", () => {
  const v = evaluateReport(null);
  assert.equal(v.ok, false);
  assert.match(v.reasons.join(" "), /no probe report was captured/);
});

test("evaluateReport can report multiple simultaneous failures", () => {
  const report = baseReport({
    stageOverReportPx: 200,
    notoLoaded: false,
    tiles: [{ text: "x", variant: "option", fontPx: 10, boxW: 10, boxH: 10, lineCount: 2, wrapped: true, clipped: true }],
  });
  const v = evaluateReport(report);
  assert.equal(v.ok, false);
  assert.equal(v.reasons.length, 4); // wrapped, clipped, over-report, font
});

test("evaluateReport fails loudly when the dev server was not in native mode (G1)", () => {
  const report = baseReport({ nativeMode: false });
  const v = evaluateReport(report);
  assert.equal(v.ok, false);
  assert.match(v.reasons.join(" "), /nativeMode=false/);
  assert.match(v.reasons.join(" "), /VITE_NATIVE=true/);
});

test("evaluateReport passes when nativeMode is true", () => {
  assert.equal(evaluateReport(baseReport({ nativeMode: true })).ok, true);
});

test("evaluateReport (G4): a sentence-tier MCQ wrap is a warning, not a failure, by default", () => {
  const report = baseReport({
    tiles: [{ text: "ありがとうございます", variant: "option", size: "sentence", fontPx: 28, boxW: 186, boxH: 90, lineCount: 2, wrapped: true, clipped: false }],
  });
  const v = evaluateReport(report);
  assert.equal(v.ok, true);
  assert.equal(v.reasons.length, 0);
  assert.match(v.warnings.join(" "), /sentence-tier tile\(s\) wrapped/);
});

test("evaluateReport (G4): --strict-prose fails a sentence-tier wrap", () => {
  const report = baseReport({
    tiles: [{ text: "ありがとうございます", variant: "option", size: "sentence", fontPx: 28, boxW: 186, boxH: 90, lineCount: 2, wrapped: true, clipped: false }],
  });
  const v = evaluateReport(report, { strictProse: true });
  assert.equal(v.ok, false);
  assert.match(v.reasons.join(" "), /wrapped/);
});

test("evaluateReport (G4): a non-sentence (tile-bank) wrap still fails even without --strict-prose", () => {
  const report = baseReport({
    tiles: [{ text: "ばんごはん", variant: "option", size: "word", fontPx: 30, boxW: 192, boxH: 177, lineCount: 2, wrapped: true, clipped: false }],
  });
  const v = evaluateReport(report);
  assert.equal(v.ok, false);
  assert.match(v.reasons.join(" "), /1 tile\(s\) wrapped/);
});

test("evaluateReport (G4): a sentence-tier wrap and a word-tier wrap in the same report split into reason vs warning", () => {
  const report = baseReport({
    tiles: [
      { text: "sentence one", variant: "option", size: "sentence", fontPx: 22, boxW: 186, boxH: 90, lineCount: 2, wrapped: true, clipped: false },
      { text: "ばんごはん", variant: "option", size: "word", fontPx: 30, boxW: 192, boxH: 177, lineCount: 2, wrapped: true, clipped: false },
    ],
  });
  const v = evaluateReport(report);
  assert.equal(v.ok, false);
  assert.match(v.reasons.join(" "), /1 tile\(s\) wrapped.*ばんごはん/);
  assert.match(v.warnings.join(" "), /1 sentence-tier tile\(s\) wrapped/);
});

test("captureSlug is filesystem-safe and includes the font scale + device (G2 default)", () => {
  assert.equal(
    captureSlug("/ja/learn/lessons/ja-m34-neo-3?step=16", 125),
    "capture-15-pro-max-125-ja-learn-lessons-ja-m34-neo-3-step-16"
  );
});

test("captureSlug (G2, REPORT.md's G2): an iPad capture never collides with a phone capture of the same route+scale", () => {
  const phone = captureSlug("/ja/review", 100, { viewportKey: "15-pro-max" });
  const ipad = captureSlug("/ja/review", 100, { viewportKey: "ipad-air" });
  assert.notEqual(phone, ipad);
  assert.match(phone, /15-pro-max/);
  assert.match(ipad, /ipad-air/);
});

test("captureSlug includes orientation when non-portrait, and distinguishes real vs. emulated (G5)", () => {
  const portrait = captureSlug("/ja/review", 100, { viewportKey: "ipad-air", orientation: "portrait" });
  const landscape = captureSlug("/ja/review", 100, { viewportKey: "ipad-air", orientation: "landscape" });
  const emulated = captureSlug("/ja/review", 100, { viewportKey: "ipad-air", orientation: "emulated-landscape" });
  assert.doesNotMatch(portrait, /landscape/);
  assert.match(landscape, /-landscape-/);
  assert.match(emulated, /-emulated-landscape-/);
  assert.notEqual(landscape, emulated);
});

test("parseEmulatedSize recognizes WxH and rejects a named device key (G5)", () => {
  assert.deepEqual(parseEmulatedSize("1180x820"), { w: 1180, h: 820 });
  assert.equal(parseEmulatedSize("ipad-air"), null);
  assert.equal(parseEmulatedSize("15-pro-max"), null);
});

test("parseArgs: --viewport WxH selects the physical device via --device and marks emulated-landscape", () => {
  const args = parseArgs(["--viewport", "1180x820", "--device", "ipad-air"]);
  assert.equal(args.viewportKey, "ipad-air");
  assert.deepEqual(args.emulatedSize, { w: 1180, h: 820 });
});

test("parseArgs: --allow-emulated-landscape defaults to false and is settable", () => {
  assert.equal(parseArgs([]).allowEmulatedLandscape, false);
  assert.equal(parseArgs(["--orientation", "landscape"]).allowEmulatedLandscape, false);
  assert.equal(parseArgs(["--orientation", "landscape", "--allow-emulated-landscape"]).allowEmulatedLandscape, true);
});

test("parseArgs: --seed defaults to fresh", () => {
  assert.equal(parseArgs([]).seedProfile, "fresh");
  assert.equal(parseArgs(["--seed", "m10-complete"]).seedProfile, "m10-complete");
});

test("parseArgs: --tap and --answer-first-option", () => {
  const a = parseArgs(["--tap", '[data-testid="primary-cta"]']);
  assert.equal(a.tapSelector, '[data-testid="primary-cta"]');
  assert.equal(a.answerFirstOption, false);
  const b = parseArgs(["--answer-first-option"]);
  assert.equal(b.answerFirstOption, true);
});

test("formatSummaryTable renders without a captured report", () => {
  const out = formatSummaryTable(null, { route: "/x", fontScale: 100, viewport: "15-pro-max" });
  assert.match(out, /no report captured/);
});

test("isStampFresh (G3): a stamp built for THIS dev server URL and native hash is fresh", () => {
  const stamp = { builtAt: "2026-09-16T00:00:00.000Z", devServerUrl: `${DEV_URL}/__sim`, gitRev: "abc1234", nativeHash: "hash-a" };
  assert.equal(isStampFresh(stamp, `${DEV_URL}/__sim`, "hash-a"), true);
});

test("isStampFresh (G3): a stamp built for a DIFFERENT dev server is stale (the 'Trevor' non-dev-shell shape)", () => {
  // The tile sweep's actual failure: an iPad had a signed non-dev build
  // installed (no CAP_DEV_SERVER at all) while the host's shared
  // capacitor.config.json said the current dev server — a per-device
  // stamp is what catches this, not the host file.
  const stamp = { builtAt: "2026-08-01T00:00:00.000Z", devServerUrl: "https://app.openlingoapp.com", gitRev: "def5678", nativeHash: "hash-a" };
  assert.equal(isStampFresh(stamp, `${DEV_URL}/__sim`, "hash-a"), false);
});

test("isStampFresh (G3): no stamp at all (not installed, or a pre-G3/manual build) is stale", () => {
  assert.equal(isStampFresh(null, `${DEV_URL}/__sim`, "hash-a"), false);
  assert.equal(isStampFresh(undefined, `${DEV_URL}/__sim`, "hash-a"), false);
});

// --- native-source freshness (2026-09-17) — a change to
// ios/App/App/*.swift, Info.plist, the pbxproj, or capacitor.config.ts
// never touches devServerUrl, so it used to be reported "fresh" and the
// stale binary got reused — confirmed live: two "verifications" of an
// AppDelegate orientation change both ran the pre-change binary. ------
test("isStampFresh (2026-09-17): same dev server URL but a DIFFERENT native hash is stale (native source changed, e.g. an AppDelegate edit)", () => {
  const stamp = { builtAt: "2026-09-16T00:00:00.000Z", devServerUrl: `${DEV_URL}/__sim`, gitRev: "abc1234", nativeHash: "hash-a" };
  assert.equal(isStampFresh(stamp, `${DEV_URL}/__sim`, "hash-b"), false);
});

test("isStampFresh (2026-09-17): a stamp from before the native-hash fix (no nativeHash field) is stale even with a matching URL — rebuild once", () => {
  const stamp = { builtAt: "2026-09-15T00:00:00.000Z", devServerUrl: `${DEV_URL}/__sim`, gitRev: "abc1234" };
  assert.equal(isStampFresh(stamp, `${DEV_URL}/__sim`, "hash-a"), false);
});

// --- isRotatorFresh — real-device-rotation build cache (2026-09-16) -----
// Same split as isStampFresh (G3): the impure half (`rotatorIsFresh` in
// sim-capture.mjs) reads the stamp file + stats ROTATOR_SOURCES; this pure
// half just compares two numbers, so the cache-invalidation logic is
// pinned without a real Xcode build.
test("isRotatorFresh: a stamp whose recorded source-mtime is >= the current max source mtime is fresh", () => {
  const stamp = { builtAt: "2026-09-16T00:00:00.000Z", sourceMtimeMs: 1000 };
  assert.equal(isRotatorFresh(stamp, 1000), true); // exactly equal — nothing touched since the build
  assert.equal(isRotatorFresh(stamp, 500), true); // sources are OLDER than the stamp — still fresh
});

test("isRotatorFresh: a source file touched AFTER the stamp was written is stale (rebuild)", () => {
  const stamp = { builtAt: "2026-09-16T00:00:00.000Z", sourceMtimeMs: 1000 };
  assert.equal(isRotatorFresh(stamp, 1001), false);
});

test("isRotatorFresh: no stamp at all (never built) is stale", () => {
  assert.equal(isRotatorFresh(null, 1000), false);
  assert.equal(isRotatorFresh(undefined, 1000), false);
});

test("isRotatorFresh: a stamp missing sourceMtimeMs (malformed/older-shape) is stale", () => {
  assert.equal(isRotatorFresh({ builtAt: "2026-09-16T00:00:00.000Z" }, 1000), false);
});

test("formatSummaryTable includes every tile row", () => {
  const report = baseReport({
    tiles: [
      { text: "ばんごはん", variant: "option", fontPx: 30, boxW: 192, boxH: 177, lineCount: 2, wrapped: true, clipped: false },
      { text: "こうえん", variant: "option", fontPx: 30, boxW: 192, boxH: 60, lineCount: 1, wrapped: false, clipped: false },
    ],
  });
  const out = formatSummaryTable(report, { route: "/x", fontScale: 125, viewport: "15-pro-max" });
  assert.match(out, /ばんごはん/);
  assert.match(out, /こうえん/);
  assert.match(out, /rootFontPx=20/);
});

// G8 (PHASE2B.md §4) — overhangPx distinguishes a real base-text clip from a
// scrollWidth-only clip (often a ruby/furigana overhang).
test("formatSummaryTable shows overhangPx per tile, '-' when a tile predates the field", () => {
  const report = baseReport({
    tiles: [
      { text: "ありがとうございます", variant: "option", fontPx: 22, boxW: 186, boxH: 90, lineCount: 2, wrapped: true, clipped: true, overhangPx: 6.5 },
      { text: "こうえん", variant: "option", fontPx: 30, boxW: 192, boxH: 60, lineCount: 1, wrapped: false, clipped: false }, // no overhangPx (older-shaped report)
    ],
  });
  const out = formatSummaryTable(report, { route: "/x", fontScale: 125, viewport: "15-pro-max" });
  assert.match(out, /6\.5/);
  assert.match(out, /-/); // the fallback dash for the tile with no overhangPx
});

test("evaluateReport's clipped reason includes overhangPx when the tile reports one", () => {
  const report = baseReport({
    tiles: [{ text: "れんしゅう", variant: "option", fontPx: 30, boxW: 150, boxH: 60, lineCount: 1, wrapped: false, clipped: true, overhangPx: 9 }],
  });
  const v = evaluateReport(report);
  assert.match(v.reasons.join(" "), /overhangPx=9/);
});

// ---------------------------------------------------------------------------
// Lane isolation (PHASE2A.md §6.7) — validation, retry-target-string, and
// advisory-lock tests. Two lanes driving one simulator corrupted each other
// through the shared /tmp/lingo-sim-target; 8 of 40 captures in the tile
// sweep were silently another lane's route at another lane's font scale.
// ---------------------------------------------------------------------------

test("routePathname keeps only the pathname, dropping everything after '?'", () => {
  assert.equal(
    routePathname("/ja/learn/lessons/ja-m34-neo-3?step=16&simFontScale=125&simRun=abc"),
    "/ja/learn/lessons/ja-m34-neo-3"
  );
  assert.equal(routePathname("/ja/review"), "/ja/review");
});

test("buildTargetRoute round-trips the font scale, seed, tap and nonce as query params", () => {
  const route = buildTargetRoute("/ja/learn/lessons/ja-m34-neo-3?step=16", {
    fontScale: 125,
    tapSelector: '[data-testid="primary-cta"]',
    seedProfile: "m10-complete",
    runNonce: "nonce-1",
  });
  const url = new URL(route, "http://x");
  assert.equal(url.searchParams.get("simFontScale"), "125");
  assert.equal(url.searchParams.get("simSeed"), "m10-complete");
  assert.equal(url.searchParams.get("simRun"), "nonce-1");
  assert.equal(url.searchParams.get("simTap"), '[data-testid="primary-cta"]');
});

test("buildTargetRoute omits simSeed for the default 'fresh' profile", () => {
  const route = buildTargetRoute("/ja/review", { fontScale: 100, seedProfile: "fresh", runNonce: "n" });
  assert.doesNotMatch(route, /simSeed/);
});

test("buildTargetRoute round-trips --simulate build's tap-interval/max-taps as query params", () => {
  const route = buildTargetRoute("/ja/learn/lessons/ja-m15-neo-6?step=15", {
    fontScale: 100,
    simulate: "build",
    tapIntervalMs: 450,
    maxTaps: 20,
    seedProfile: "fresh",
    runNonce: "nonce-2",
  });
  const url = new URL(route, "http://x");
  assert.equal(url.searchParams.get("simSimulate"), "build");
  assert.equal(url.searchParams.get("simTapInterval"), "450");
  assert.equal(url.searchParams.get("simMaxTaps"), "20");
});

test("buildTargetRoute omits simSimulate/simTapInterval/simMaxTaps when --simulate wasn't passed", () => {
  const route = buildTargetRoute("/ja/review", { fontScale: 100, seedProfile: "fresh", runNonce: "n" });
  assert.doesNotMatch(route, /simSimulate|simTapInterval|simMaxTaps/);
});

// ---------------------------------------------------------------------------
// `--simulate build` — computeBuildVerdicts / formatBuildTable /
// formatBuildVerdictFailure. See computeBuildVerdicts's own doc comment for
// the collection (simProbe.ts) vs. judgment (here) split.
// ---------------------------------------------------------------------------

function buildGroup(count, fontPxMin, fontPxMax, overrides = {}) {
  if (count === 0) {
    return { count: 0, fontPxMin: null, fontPxMax: null, boxHMin: null, boxHMax: null, fitScaleMin: null, fitScaleMax: null };
  }
  return {
    count,
    fontPxMin,
    fontPxMax,
    boxHMin: overrides.boxHMin ?? fontPxMin * 1.6,
    boxHMax: overrides.boxHMax ?? fontPxMax * 1.6,
    fitScaleMin: overrides.fitScaleMin ?? 1,
    fitScaleMax: overrides.fitScaleMax ?? 1,
  };
}

function buildSample(tap, overrides = {}) {
  return {
    tap,
    h2Top: 100,
    // The build-25 "nothing moves" fields (simProbe's `BuildSample`):
    // the prompt heading's own rect top and the bottom-anchored CTA block's.
    promptTop: 100,
    ctaTop: 420,
    trayTop: 200,
    trayH: 50,
    bankTop: 260,
    bankH: 100,
    stageH: 500,
    stageTop: 0,
    rowH: 48,
    fitScale: 1,
    tray: buildGroup(0, null, null),
    bank: buildGroup(10, 29, 29),
    ...overrides,
  };
}

test("computeBuildVerdicts: an all-stable sequence passes every verdict", () => {
  const samples = [
    buildSample(0, { tray: buildGroup(0, null, null), bank: buildGroup(10, 29, 29) }),
    buildSample(1, { trayH: 60, bankH: 90, tray: buildGroup(1, 29, 29), bank: buildGroup(9, 29, 29) }),
    buildSample(2, { trayH: 60, bankH: 80, tray: buildGroup(2, 29, 29), bank: buildGroup(8, 29, 29) }),
  ];
  const v = computeBuildVerdicts(samples, { layoutTrace: { maxH2Jump: 0, h2Reversals: 0 } });
  assert.equal(v.fitScaleStable.ok, true);
  assert.equal(v.trayBankFontEqual.ok, true);
  assert.equal(v.rowHStable.ok, true);
  assert.equal(v.h2Stable.ok, true);
  assert.equal(v.promptStable.ok, true);
  assert.equal(v.chromeStable.ok, true);
  assert.equal(v.noFlicker.ok, true);
  assert.equal(v.stageFits.ok, true);
});

// ---------------------------------------------------------------------------
// promptStable / chromeStable (build 25, 2026-09-17) — the lead's ruling that
// nothing on screen may MOVE between the first tap and the last. Every case
// below is fed a deliberately shifted sample, so none of them can pass
// vacuously.
// ---------------------------------------------------------------------------

test("computeBuildVerdicts: a prompt that moves up at tap 1 fails promptStable naming tap 1", () => {
  // The measured defect shape: the tray gains a row, the centred step column
  // re-centres, and the prompt rises 36.8px (15 Pro Max, ja-m15-neo-6?step=15).
  const samples = [
    buildSample(0, { promptTop: 239.8 }),
    buildSample(1, { promptTop: 203 }),
    buildSample(2, { promptTop: 203 }),
  ];
  const v = computeBuildVerdicts(samples);
  assert.equal(v.promptStable.ok, false);
  assert.deepEqual(v.promptStable.badTaps, [1, 2]);
});

test("computeBuildVerdicts: promptStable tolerates sub-pixel drift and fails past 1px", () => {
  const within = computeBuildVerdicts([buildSample(0, { promptTop: 100 }), buildSample(1, { promptTop: 100.9 })]);
  assert.equal(within.promptStable.ok, true);
  const past = computeBuildVerdicts([buildSample(0, { promptTop: 100 }), buildSample(1, { promptTop: 101.6 })]);
  assert.equal(past.promptStable.ok, false);
});

test("computeBuildVerdicts: a CTA that moves fails chromeStable even when the prompt holds", () => {
  const samples = [buildSample(0), buildSample(1, { ctaTop: 458 }), buildSample(2, { ctaTop: 458 })];
  const v = computeBuildVerdicts(samples);
  assert.equal(v.promptStable.ok, true);
  assert.equal(v.chromeStable.ok, false);
  assert.deepEqual(v.chromeStable.badTaps, [1, 2]);
});

test("computeBuildVerdicts: a bank pushed down by a growing tray fails chromeStable", () => {
  // trayH 88 → 162 with the bank riding down under it: the b24 behaviour.
  const samples = [
    buildSample(0, { trayH: 88, bankTop: 416 }),
    buildSample(1, { trayH: 162, bankTop: 452.7 }),
  ];
  const v = computeBuildVerdicts(samples);
  assert.equal(v.chromeStable.ok, false);
  assert.deepEqual(v.chromeStable.badTaps, [1]);
});

test("computeBuildVerdicts: promptStable/chromeStable ignore over-placement taps when answerLen is given", () => {
  const samples = [
    buildSample(0),
    buildSample(1),
    buildSample(2, { promptTop: 60, bankTop: 300, ctaTop: 500 }), // past the answer
  ];
  const restricted = computeBuildVerdicts(samples, { answerLen: 1 });
  assert.equal(restricted.promptStable.ok, true);
  assert.equal(restricted.chromeStable.ok, true);
  const unrestricted = computeBuildVerdicts(samples);
  assert.equal(unrestricted.promptStable.ok, false);
  assert.equal(unrestricted.chromeStable.ok, false);
});

test("computeBuildVerdicts: a field no sample carries is reported as unsampled, not passed silently", () => {
  const bare = [buildSample(0), buildSample(1)].map((s) => {
    const { promptTop: _p, ctaTop: _c, ...rest } = s;
    return rest;
  });
  const v = computeBuildVerdicts(bare);
  assert.equal(v.promptStable.ok, true);
  assert.match(v.promptStable.detail, /promptTop not sampled/);
  assert.match(v.chromeStable.detail, /ctaTop not sampled/);
  // …and with the fields present there is no such caveat.
  const sampled = computeBuildVerdicts([buildSample(0), buildSample(1)]);
  assert.equal(sampled.promptStable.detail, undefined);
  assert.equal(sampled.chromeStable.detail, undefined);
});

test("computeBuildVerdicts: a fitScale drop at tap 1 fails fitScaleStable naming tap 1", () => {
  const samples = [
    buildSample(0, { fitScale: 1 }),
    buildSample(1, { fitScale: 0.8 }), // the tray-gains-its-first-row defect shape
    buildSample(2, { fitScale: 1 }), // recovers — but tap 1 already regressed, must still be flagged
  ];
  const v = computeBuildVerdicts(samples);
  assert.equal(v.fitScaleStable.ok, false);
  assert.deepEqual(v.fitScaleStable.badTaps, [1]);
});

test("computeBuildVerdicts: tray font 19 vs bank font 29 fails trayBankFontEqual", () => {
  const samples = [
    buildSample(0, { tray: buildGroup(0, null, null), bank: buildGroup(10, 29, 29) }),
    // TestFlight/b23 defect shape: the placed tray tile renders at 19px
    // against its own bank sibling still at 29px.
    buildSample(1, { tray: buildGroup(1, 19, 19), bank: buildGroup(9, 29, 29) }),
  ];
  const v = computeBuildVerdicts(samples);
  assert.equal(v.trayBankFontEqual.ok, false);
  assert.deepEqual(v.trayBankFontEqual.badTaps, [1]);
});

test("computeBuildVerdicts: trayBankFontEqual is not evaluated once the bank is fully drained", () => {
  const samples = [
    buildSample(0, { tray: buildGroup(0, null, null), bank: buildGroup(1, 29, 29) }),
    // Last tile placed — bank empty, nothing left to compare the tray to.
    buildSample(1, { tray: buildGroup(1, 19, 19), bank: buildGroup(0, null, null) }),
  ];
  const v = computeBuildVerdicts(samples);
  assert.equal(v.trayBankFontEqual.ok, true);
  assert.deepEqual(v.trayBankFontEqual.badTaps, []);
});

test("computeBuildVerdicts: rowH/h2Top drift after tap 0 fails rowHStable/h2Stable", () => {
  const samples = [
    buildSample(0, { rowH: 48, h2Top: 100 }),
    buildSample(1, { rowH: 52, h2Top: 133 }), // the #174 "prompt drops ~33px" shape
  ];
  const v = computeBuildVerdicts(samples);
  assert.equal(v.rowHStable.ok, false);
  assert.deepEqual(v.rowHStable.badTaps, [1]);
  assert.equal(v.h2Stable.ok, false);
  assert.deepEqual(v.h2Stable.badTaps, [1]);
});

test("computeBuildVerdicts: noFlicker fails when the layout trace shows a jump or reversal", () => {
  const samples = [buildSample(0), buildSample(1)];
  const v = computeBuildVerdicts(samples, { layoutTrace: { maxH2Jump: 33, h2Reversals: 2 } });
  assert.equal(v.noFlicker.ok, false);
  assert.match(v.noFlicker.detail, /maxH2Jump=33/);
  assert.match(v.noFlicker.detail, /h2Reversals=2/);
});

test("computeBuildVerdicts: stageFits fails when the bank's bottom exceeds the stage's own bottom", () => {
  const samples = [
    buildSample(0, { stageTop: 0, stageH: 500, bankTop: 260, bankH: 100 }), // bottom 360 <= 500, fine
    buildSample(1, { stageTop: 0, stageH: 500, bankTop: 460, bankH: 100 }), // bottom 560 > 500
  ];
  const v = computeBuildVerdicts(samples);
  assert.equal(v.stageFits.ok, false);
  assert.deepEqual(v.stageFits.badTaps, [1]);
});

test("formatBuildTable prints one row per sample with the documented columns", () => {
  const samples = [
    buildSample(0, { tray: buildGroup(0, null, null), bank: buildGroup(10, 29, 29) }),
    buildSample(1, { tray: buildGroup(1, 19, 19), bank: buildGroup(9, 29, 29) }),
  ];
  const table = formatBuildTable(samples);
  assert.match(table, /tap#/);
  assert.match(table, /trayH/);
  assert.match(table, /bankH/);
  assert.match(table, /fitScale/);
  assert.match(table, /19-19/);
  assert.match(table, /29-29/);
  // The build-25 "nothing moves" columns.
  assert.match(table, /promptTop/);
  assert.match(table, /bankTop/);
  assert.match(table, /ctaTop/);
  assert.match(table, /420/); // the CTA top of both fixture rows
  assert.equal(table.split("\n").length, 3); // header + 2 sample rows
});

test("formatBuildVerdictFailure returns null when every verdict passed", () => {
  const verdicts = {
    fitScaleStable: { ok: true, badTaps: [] },
    trayBankFontEqual: { ok: true, badTaps: [] },
    rowHStable: { ok: true, badTaps: [] },
    h2Stable: { ok: true, badTaps: [] },
    noFlicker: { ok: true, detail: "maxH2Jump=0 h2Reversals=0" },
    stageFits: { ok: true, badTaps: [] },
  };
  assert.equal(formatBuildVerdictFailure(verdicts), null);
});

// ---------------------------------------------------------------------------
// Per-tap FRAME CAPTURE (2026-09-17) — computeFrameDerivedMetrics /
// formatFrameTable, over fabricated `TapFrameSample[]` arrays (the shape
// `recordTapFrameTrace` in simProbe.ts posts).
// ---------------------------------------------------------------------------

function tapFrame(t, overrides = {}) {
  return {
    t,
    tile: { x: 0, y: 0, w: 100, h: 40, fontPx: 29, transform: "none", opacity: 1 },
    tileLost: false,
    trayRow: null,
    trayClientHeight: null,
    trayFitScaleMin: 1,
    trayFitScaleMax: 1,
    bankFitScaleMin: 1,
    bankFitScaleMax: 1,
    ...overrides,
  };
}

test("computeFrameDerivedMetrics: no frame ever saw the tracked tile", () => {
  const m = computeFrameDerivedMetrics({ tap: 1, frames: [tapFrame(0, { tile: null }), tapFrame(700, { tile: null })], capped: false });
  assert.equal(m.framesWithTile, 0);
  assert.equal(m.fontPxStart, null);
  assert.equal(m.fontDipped, false);
  assert.equal(m.fitScaleChanged, false);
});

test("computeFrameDerivedMetrics: fontDipped is true when the font shrinks mid-animation below where it ends up", () => {
  const frames = [
    tapFrame(0, { tile: { x: 0, y: 0, w: 100, h: 48, fontPx: 29, transform: "none", opacity: 1 } }),
    tapFrame(150, { tile: { x: 0, y: 0, w: 100, h: 32, fontPx: 19, transform: "none", opacity: 1 } }),
    tapFrame(700, { tile: { x: 0, y: 0, w: 100, h: 48, fontPx: 29, transform: "none", opacity: 1 } }),
  ];
  const m = computeFrameDerivedMetrics({ tap: 1, frames, capped: false });
  assert.equal(m.fontPxStart, 29);
  assert.equal(m.fontPxMin, 19);
  assert.equal(m.fontPxEnd, 29);
  assert.equal(m.fontDipped, true);
});

test("computeFrameDerivedMetrics: fontDipped is false when the font just shrinks once and stays shrunk (no dip)", () => {
  const frames = [
    tapFrame(0, { tile: { x: 0, y: 0, w: 100, h: 32, fontPx: 19, transform: "none", opacity: 1 } }),
    tapFrame(700, { tile: { x: 0, y: 0, w: 100, h: 32, fontPx: 19, transform: "none", opacity: 1 } }),
  ];
  const m = computeFrameDerivedMetrics({ tap: 1, frames, capped: false });
  assert.equal(m.fontPxMin, 19);
  assert.equal(m.fontPxEnd, 19);
  assert.equal(m.fontDipped, false);
});

test("computeFrameDerivedMetrics: transformSettledMs is the first frame where transform goes identity AND STAYS", () => {
  const frames = [
    tapFrame(0, { tile: { x: 0, y: -20, w: 100, h: 40, fontPx: 29, transform: "matrix(1,0,0,1,0,-20)", opacity: 0.5 } }),
    tapFrame(150, { tile: { x: 0, y: 0, w: 100, h: 40, fontPx: 29, transform: "none", opacity: 1 } }),
    tapFrame(700, { tile: { x: 0, y: 0, w: 100, h: 40, fontPx: 29, transform: "none", opacity: 1 } }),
  ];
  const m = computeFrameDerivedMetrics({ tap: 1, frames, capped: false });
  assert.equal(m.transformSettledMs, 150);
});

test("computeFrameDerivedMetrics: transformSettledMs is null when an identity frame doesn't stick (flickers back)", () => {
  const frames = [
    tapFrame(0, { tile: { x: 0, y: 0, w: 100, h: 40, fontPx: 29, transform: "none", opacity: 1 } }),
    tapFrame(150, { tile: { x: 0, y: -33, w: 100, h: 40, fontPx: 29, transform: "matrix(1,0,0,1,0,-33)", opacity: 0.5 } }),
  ];
  const m = computeFrameDerivedMetrics({ tap: 1, frames, capped: false });
  assert.equal(m.transformSettledMs, null);
});

test("computeFrameDerivedMetrics: fitScaleChanged is true when the tray's fit-scale differs first-to-last", () => {
  const frames = [
    tapFrame(0, { trayFitScaleMax: 1 }),
    tapFrame(700, { trayFitScaleMax: 0.65 }), // the tray-gains-its-first-row defect shape
  ];
  const m = computeFrameDerivedMetrics({ tap: 1, frames, capped: false });
  assert.equal(m.fitScaleChanged, true);
});

test("computeFrameDerivedMetrics: fitScaleChanged is false when tray/bank fit-scale never moves", () => {
  const frames = [tapFrame(0), tapFrame(350), tapFrame(700)];
  const m = computeFrameDerivedMetrics({ tap: 1, frames, capped: false });
  assert.equal(m.fitScaleChanged, false);
});

test("computeFrameDerivedMetrics: carries capped through from the frame trace", () => {
  const m = computeFrameDerivedMetrics({ tap: 1, frames: [tapFrame(0)], capped: true });
  assert.equal(m.capped, true);
});

test("formatFrameTable prints one row per tap trace with the documented columns", () => {
  const table = formatFrameTable([
    { tap: 1, frames: [tapFrame(0), tapFrame(700)], capped: false },
    { tap: 2, frames: [tapFrame(0, { tile: null })], capped: false },
  ]);
  assert.match(table, /tap#/);
  assert.match(table, /fontStart/);
  assert.match(table, /transformSettledMs/);
  assert.match(table, /fitScaleChanged/);
  assert.equal(table.split("\n").length, 3); // header + 2 tap rows
});

test("formatBuildVerdictFailure names every failing verdict and its bad taps", () => {
  const verdicts = {
    fitScaleStable: { ok: false, badTaps: [1] },
    trayBankFontEqual: { ok: false, badTaps: [1, 2] },
    rowHStable: { ok: true, badTaps: [] },
    h2Stable: { ok: true, badTaps: [] },
    noFlicker: { ok: true, detail: "maxH2Jump=0 h2Reversals=0" },
    stageFits: { ok: true, badTaps: [] },
  };
  const line = formatBuildVerdictFailure(verdicts);
  assert.match(line, /^USER-SIM FAIL:/);
  assert.match(line, /fitScaleStable \(taps 1\)/);
  assert.match(line, /trayBankFontEqual \(taps 1,2\)/);
  assert.doesNotMatch(line, /rowHStable/);
});

function baseValidateReport(overrides = {}) {
  return {
    // No `?step=16` here on purpose — LessonPage.tsx's dev-jump CONSUMES the
    // param and drops it from location.search (confirmed live 2026-09-16
    // against dozens of pre-existing real captures). The route check must
    // not false-positive on that; see the dedicated test below.
    href: "/ja/learn/lessons/ja-m34-neo-3?simFontScale=100&simRun=nonce-1",
    fontScale: 1,
    rootFontPx: 16,
    nativeMode: true,
    dpr: 3,
    innerWidth: 430,
    runNonce: "nonce-1",
    ...overrides,
  };
}

const PHONE_VIEWPORT = { device: "OL-15ProMax", w: 430, h: 932, dpr: 3 };
const IPAD_VIEWPORT = { device: "iPad Air 11-inch (M4)", w: 820, h: 1180, dpr: 2 };

function baseExpected(overrides = {}) {
  return {
    route: "/ja/learn/lessons/ja-m34-neo-3?step=16",
    fontScale: 100,
    viewportKey: "15-pro-max",
    viewport: PHONE_VIEWPORT,
    emulated: false,
    runNonce: "nonce-1",
    ...overrides,
  };
}

test("validateCapture passes when every requested field matches the report", () => {
  const v = validateCapture(baseValidateReport(), baseExpected());
  assert.equal(v.ok, true);
  assert.deepEqual(v.mismatches, []);
});

test("validateCapture does NOT false-positive on the app's own ?step=N consumption (2026-09-16 live finding)", () => {
  // baseExpected() requests "...ja-m34-neo-3?step=16"; baseValidateReport()'s
  // href reflects what a real capture actually shows — step already
  // stripped by LessonPage.tsx's dev-jump. This must still PASS: the route
  // check is pathname-only precisely so a real capture with a real `?step=`
  // request doesn't fail validation on every single run.
  const v = validateCapture(baseValidateReport(), baseExpected());
  assert.equal(v.ok, true);
});

test("validateCapture fails loudly when no report was captured", () => {
  const v = validateCapture(null, baseExpected());
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /no probe report was captured/);
});

test("validateCapture catches another lane's route (the tile-sweep's 8/40 corruption shape)", () => {
  const report = baseValidateReport({ href: "/ja/review?simFontScale=100&simRun=other-nonce", runNonce: "other-nonce" });
  const v = validateCapture(report, baseExpected());
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /route: expected/);
});

test("validateCapture's runNonce check names it as a concurrent-run mismatch even when route/scale happen to match", () => {
  const report = baseValidateReport({ runNonce: "someone-elses-nonce" });
  const v = validateCapture(report, baseExpected());
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /runNonce.*concurrent or stale/);
});

test("validateCapture catches another lane's font scale", () => {
  const report = baseValidateReport({ fontScale: 1.25, rootFontPx: 20 });
  const v = validateCapture(report, baseExpected());
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /fontScale: expected 1/);
});

test("validateCapture checks rootFontPx == 16 × scale within ±0.5px", () => {
  assert.equal(validateCapture(baseValidateReport({ rootFontPx: 16.4 }), baseExpected()).ok, true);
  const v = validateCapture(baseValidateReport({ rootFontPx: 17 }), baseExpected());
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /rootFontPx/);
});

test("validateCapture fails when nativeMode is not true (G1's web-auth-path shape)", () => {
  const v = validateCapture(baseValidateReport({ nativeMode: false }), baseExpected());
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /nativeMode/);
});

test("validateCapture catches the OTHER device (phone report validated against the iPad's expectation)", () => {
  const v = validateCapture(baseValidateReport(), baseExpected({ viewport: IPAD_VIEWPORT, viewportKey: "ipad-air" }));
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /device: expected dpr 2/);
});

test("validateCapture catches an emulated-viewport mismatch", () => {
  const report = baseValidateReport({ emulatedViewport: { w: 375, h: 667 } });
  const v = validateCapture(report, baseExpected({ emulated: true, emuW: 1180, emuH: 820 }));
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /emulated viewport/);
});

test("validateCapture: the internal --expect-font-scale hook produces a real, honest failure", () => {
  // Mirrors `--font-scale 100 --expect-font-scale 125`: the capture actually
  // requested 100% (report reflects 100%) but is validated against 125%.
  const v = validateCapture(baseValidateReport(), baseExpected({ fontScale: 125 }));
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /fontScale: expected 1\.25, got 1/);
});

test("validateCapture can report multiple simultaneous mismatches", () => {
  const report = baseValidateReport({ href: "/ja/review?simRun=x", runNonce: "x", nativeMode: false });
  const v = validateCapture(report, baseExpected());
  assert.equal(v.ok, false);
  assert.ok(v.mismatches.length >= 3); // route, runNonce, nativeMode
});

// --- G6: real-landscape orientation validation --------------------------
// This is the failure-proof named directly in the task: a "landscape"
// validation must NEVER rubber-stamp a report that is still portrait-shaped
// (the fallback emulation trap this whole mechanism exists to catch).

test("validateCapture REJECTS an 820-wide report when landscape was requested (the named regression)", () => {
  // ipad-air's own PORTRAIT dims (820x1180) — exactly what a real-rotation
  // attempt that silently failed would still report.
  const report = baseValidateReport({ innerWidth: 820, innerHeight: 1180, dpr: 2 });
  const v = validateCapture(report, baseExpected({ viewport: IPAD_VIEWPORT, viewportKey: "ipad-air", orientation: "landscape" }));
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /orientation: expected landscape/);
  assert.match(v.mismatches.join(" "), /viewport width: expected ~1180px/);
});

test("validateCapture ACCEPTS a real landscape report (innerWidth/innerHeight swapped vs. the portrait table entry)", () => {
  // rootFontPx: 16. Real landscape on ipad-air (1180×820) used to land in
  // src/index.css's `@media (min-width: 1024px) and (max-height: 820px)` 15px
  // rule (confirmed live 2026-09-16); since build 23 (ca1b210c) that rule also
  // requires `(pointer: fine)`, so a touch iPad keeps 16px — confirmed live
  // 2026-09-17 on the real-rotated ipad-air (rootFontPx=16).
  const report = baseValidateReport({ innerWidth: 1180, innerHeight: 820, dpr: 2, rootFontPx: 16 });
  const v = validateCapture(report, baseExpected({ viewport: IPAD_VIEWPORT, viewportKey: "ipad-air", orientation: "landscape" }));
  assert.equal(v.ok, true);
  assert.deepEqual(v.mismatches, []);
});

test("validateCapture: real landscape on ipad-air REJECTS a 15px root font (the coarse-pointer exclusion from the short-viewport breakpoint is not optional)", () => {
  // A 15px reading on a simulator (always a coarse pointer) means the
  // `(pointer: fine)` term fell off the breakpoint again — the b22 finding
  // Spencer called the opposite of what landscape iPad should do.
  const report = baseValidateReport({ innerWidth: 1180, innerHeight: 820, dpr: 2, rootFontPx: 15 });
  const v = validateCapture(report, baseExpected({ viewport: IPAD_VIEWPORT, viewportKey: "ipad-air", orientation: "landscape" }));
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /rootFontPx: expected ~16/);
});

test("validateCapture: portrait and emulated-landscape are unaffected by the short-viewport breakpoint (still expect 16px)", () => {
  // Only a REAL landscape orientation triggers the breakpoint check —
  // portrait never reaches 820px height at all (it's the full 1180), and
  // emulated-landscape's height never really lands on 820 either (see its
  // doc comment), so both keep expecting the plain 16px root.
  const portrait = validateCapture(
    baseValidateReport({ rootFontPx: 16, dpr: 2, innerWidth: 820 }),
    baseExpected({ viewport: IPAD_VIEWPORT, viewportKey: "ipad-air" })
  );
  assert.equal(portrait.ok, true);
  const emulated = validateCapture(
    baseValidateReport({ rootFontPx: 16, dpr: 2, emulatedViewport: { w: 1180, h: 820 } }),
    baseExpected({ viewport: IPAD_VIEWPORT, viewportKey: "ipad-air", orientation: "emulated-landscape", emulated: true, emuW: 1180, emuH: 820 })
  );
  assert.equal(emulated.ok, true);
});

test("validateCapture: a plain portrait request is unaffected by the G6 swap (no `orientation` field)", () => {
  // baseExpected() carries no `orientation` — every pre-existing portrait
  // capture must validate exactly as before this change.
  const v = validateCapture(baseValidateReport(), baseExpected());
  assert.equal(v.ok, true);
});

test("validateCapture: landscape validation also checks innerHeight, not just innerWidth", () => {
  // Width alone would pass (1180 vs expected 1180) but height is wrong —
  // must still fail, since a `false && true` pair of matching/mismatching
  // axes is not a lower bar than checking both.
  const report = baseValidateReport({ innerWidth: 1180, innerHeight: 932 }); // 932 is the 15-pro-max's height, not ipad-air's
  const v = validateCapture(report, baseExpected({ viewport: IPAD_VIEWPORT, viewportKey: "ipad-air", orientation: "landscape" }));
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /viewport height: expected ~820px/);
});

// --- mismatch → retry → fail driver -----------------------------------------

test("runWithValidationRetry: passes on the first attempt without retrying", async () => {
  let calls = 0;
  const outcome = await runWithValidationRetry({
    maxAttempts: 3,
    sleepFn: async () => { throw new Error("should not sleep — attempt 1 passed"); },
    attemptFn: async () => { calls++; return { value: "corrupted-by-other-lane" }; },
    validateFn: () => ({ ok: true, mismatches: [] }),
  });
  assert.equal(outcome.ok, true);
  assert.equal(outcome.attempts, 1);
  assert.equal(calls, 1);
});

test("runWithValidationRetry: mismatches on attempts 1–2 (another lane's route), passes on 3", async () => {
  let calls = 0;
  const sleeps = [];
  const outcome = await runWithValidationRetry({
    maxAttempts: 3,
    sleepFn: async (ms) => { sleeps.push(ms); },
    attemptFn: async (attempt) => { calls++; return { attempt }; },
    validateFn: (result) =>
      result.attempt < 3
        ? { ok: false, mismatches: [`route: expected "/ja/m34?step=16", got "/ja/review" (attempt ${result.attempt})`] }
        : { ok: true, mismatches: [] },
  });
  assert.equal(outcome.ok, true);
  assert.equal(outcome.attempts, 3);
  assert.equal(calls, 3);
  assert.deepEqual(sleeps, [2000, 4000]); // backoff before attempts 2 and 3, none after the pass
});

test("runWithValidationRetry: fails non-zero-shaped after exhausting every attempt, naming the last mismatch", async () => {
  const onMismatchCalls = [];
  const outcome = await runWithValidationRetry({
    maxAttempts: 3,
    sleepFn: async () => {},
    attemptFn: async (attempt) => ({ attempt }),
    validateFn: (result) => ({ ok: false, mismatches: [`fontScale: expected 1.25, got 1 (attempt ${result.attempt})`] }),
    onMismatch: (validation, attempt) => onMismatchCalls.push({ attempt, mismatches: validation.mismatches }),
  });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.attempts, 3);
  assert.match(outcome.validation.mismatches[0], /attempt 3/); // the LAST attempt's mismatch, not the first
  assert.equal(onMismatchCalls.length, 3); // called on every failing attempt, including the last
});

test("runWithValidationRetry: --validation-max-attempts is respected as the retry ceiling", async () => {
  let calls = 0;
  const outcome = await runWithValidationRetry({
    maxAttempts: 1,
    sleepFn: async () => { throw new Error("must not sleep — only one attempt was allowed"); },
    attemptFn: async () => { calls++; return {}; },
    validateFn: () => ({ ok: false, mismatches: ["nativeMode: expected true, got false"] }),
  });
  assert.equal(outcome.ok, false);
  assert.equal(calls, 1);
});

// --- advisory locks ---------------------------------------------------------

test("lockFilePath is stable and filesystem-safe for a real simulator udid", () => {
  const p = lockFilePath("942D8E54-1234-ABCD-EF00-000000000000", "/tmp");
  assert.equal(p, "/tmp/lingo-sim-942D8E54-1234-ABCD-EF00-000000000000.lock");
});

test("isLockStale: a dead pid is stale regardless of age", () => {
  const stale = isLockStale({ pid: 999999, startedAt: Date.now() }, { nowMs: Date.now(), pidAlive: () => false });
  assert.equal(stale, true);
});

test("isLockStale: a live pid within staleMs is NOT stale", () => {
  const fresh = isLockStale(
    { pid: 111, startedAt: Date.now() - 1000 },
    { nowMs: Date.now(), staleMs: 5 * 60 * 1000, pidAlive: () => true }
  );
  assert.equal(fresh, false);
});

test("isLockStale: a live pid but wedged past staleMs is reclaimed", () => {
  const stale = isLockStale(
    { pid: 111, startedAt: Date.now() - 10 * 60 * 1000 },
    { nowMs: Date.now(), staleMs: 5 * 60 * 1000, pidAlive: () => true }
  );
  assert.equal(stale, true);
});

test("isLockStale: missing/malformed lock data is stale (nothing to reclaim from)", () => {
  assert.equal(isLockStale(null, { nowMs: Date.now(), pidAlive: () => true }), true);
  assert.equal(isLockStale({}, { nowMs: Date.now(), pidAlive: () => true }), true);
});

function tmpLockDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "lingo-sim-lock-test-"));
}

test("acquireAdvisoryLock: acquire then release lets a second acquire through immediately", async () => {
  const lockDir = tmpLockDir();
  const release1 = await acquireAdvisoryLock("device-a", { lockDir });
  assert.equal(fs.existsSync(lockFilePath("device-a", lockDir)), true);
  release1();
  assert.equal(fs.existsSync(lockFilePath("device-a", lockDir)), false);
  const release2 = await acquireAdvisoryLock("device-a", { lockDir });
  assert.equal(fs.existsSync(lockFilePath("device-a", lockDir)), true);
  release2();
});

test("acquireAdvisoryLock: two runs on the SAME device serialise (second waits for the first's release)", async () => {
  const lockDir = tmpLockDir();
  const order = [];
  const release1 = await acquireAdvisoryLock("device-b", { lockDir, pollMs: 20 });
  order.push("first-acquired");
  const second = acquireAdvisoryLock("device-b", { lockDir, pollMs: 20 }).then((release2) => {
    order.push("second-acquired");
    release2();
  });
  await new Promise((r) => setTimeout(r, 100));
  assert.deepEqual(order, ["first-acquired"]); // still blocked — the first lock is held
  release1();
  await second;
  assert.deepEqual(order, ["first-acquired", "second-acquired"]);
});

test("acquireAdvisoryLock: two DIFFERENT device keys never block each other", async () => {
  const lockDir = tmpLockDir();
  const releaseA = await acquireAdvisoryLock("device-c", { lockDir });
  const releaseB = await acquireAdvisoryLock("device-d", { lockDir }); // must not hang
  assert.equal(fs.existsSync(lockFilePath("device-c", lockDir)), true);
  assert.equal(fs.existsSync(lockFilePath("device-d", lockDir)), true);
  releaseA();
  releaseB();
});

test("acquireAdvisoryLock: a stale lock (dead pid) is reclaimed instead of blocking forever", async () => {
  const lockDir = tmpLockDir();
  // Simulate a crashed run's leftover lockfile: a pid that isn't alive.
  fs.writeFileSync(lockFilePath("device-e", lockDir), JSON.stringify({ pid: 999999, startedAt: Date.now(), key: "device-e" }));
  const release = await acquireAdvisoryLock("device-e", { lockDir, pollMs: 20, pidAlive: () => false });
  assert.equal(fs.existsSync(lockFilePath("device-e", lockDir)), true);
  const data = JSON.parse(fs.readFileSync(lockFilePath("device-e", lockDir), "utf8"));
  assert.equal(data.pid, process.pid); // reclaimed by us, not still the dead pid
  release();
});

test("acquireAdvisoryLock: release() does not delete a lock reclaimed by someone else after we went stale", async () => {
  const lockDir = tmpLockDir();
  const release = await acquireAdvisoryLock("device-f", { lockDir });
  // Simulate another process reclaiming our (now-stale) lock before we call release().
  fs.writeFileSync(lockFilePath("device-f", lockDir), JSON.stringify({ pid: process.pid + 1, startedAt: Date.now(), key: "device-f" }));
  release();
  assert.equal(fs.existsSync(lockFilePath("device-f", lockDir)), true); // NOT deleted — it's not ours anymore
});

// ---------------------------------------------------------------------------
// Task A (2026-09-17, over-placement) — resolveAnswerLen / resolveMaxTaps /
// isModuleContentFilename.
// ---------------------------------------------------------------------------

test("isModuleContentFilename: matches mN.<hash>.json, rejects everything else", () => {
  assert.equal(isModuleContentFilename("m34.7e12ac932d.json"), true);
  assert.equal(isModuleContentFilename("m1.abc123.json"), true);
  assert.equal(isModuleContentFilename("_extra.6d977d68b5.json"), false);
  assert.equal(isModuleContentFilename("index.16c305b4b5.json"), false);
  assert.equal(isModuleContentFilename("manifest.json"), false);
});

/** Fake FS accessor matching `resolveAnswerLen`'s dir-vs-file contract —
 *  see that function's doc comment. `filesByLang` shape: `{ ja: {
 *  "m34.def.json": <parsed JSON object> } }`. */
function fakeContentReadFile(filesByLang) {
  return (p) => {
    const m = /^src\/pub\/content\/v1\/([a-z]{2})\/(.*)$/.exec(p);
    if (!m) throw new Error(`unexpected path ${p}`);
    const [, lang, rest] = m;
    const files = filesByLang[lang];
    if (!files) throw new Error(`ENOENT: no such directory ${p}`);
    if (rest === "") return Object.keys(files); // directory listing
    if (!(rest in files)) throw new Error(`ENOENT: no such file ${p}`);
    return JSON.stringify(files[rest]);
  };
}

const JA_M34_LESSON = {
  id: "ja-m34-neo-7",
  steps: [
    { type: "dialogue_sim" }, // 0
    { type: "build_sentence", correctOrder: ["らいげつ", "けっこん", "する", "こと", "に", "なった"] }, // 1
    { type: "teach" }, // 2
    { type: "build_sentence", correctOrder: ["らいねん", "そつぎょう", "する", "こと", "に", "なる"] }, // 3
    { type: "teach" }, // 4
    { type: "build_sentence", correctOrder: ["アメリカ", "で", "はたらく", "こと", "に", "なった"] }, // 5 — the task's own example: answer 6, bank 10
    { type: "teach" }, // 6
    { type: "build_sentence", correctOrder: ["らいねん", "けっこん", "する", "こと", "にした"] }, // 7
    { type: "listening_build", correctOrder: ["けっこん", "する", "こと", "に", "なった"] }, // 8
  ],
};

function jaContentFixture() {
  return {
    ja: {
      // The id landmine (CLAUDE.md): m2's row lessons carry ja-m1-* ids —
      // module membership must never be inferred from the lesson id.
      "m2.abc123.json": {
        lessons: [{ id: "ja-m1-g-1", steps: [{ type: "kana_reveal" }, { type: "build_sentence", correctOrder: ["あ", "い", "う"] }] }],
      },
      "m34.def456.json": { lessons: [JA_M34_LESSON] },
      "_extra.xyz789.json": { lessons: [{ id: "should-never-match", steps: [] }] },
      "index.111222.json": { lessons: [] },
    },
  };
}

test("resolveAnswerLen: normal build_sentence step (the task's own over-placement example: answer 6)", () => {
  const readFile = fakeContentReadFile(jaContentFixture());
  const r = resolveAnswerLen("/ja/learn/lessons/ja-m34-neo-7?step=5", readFile);
  assert.equal(r.ok, true);
  assert.equal(r.answerLen, 6);
  assert.equal(r.stepType, "build_sentence");
  assert.equal(r.file, "m34.def456.json");
});

test("resolveAnswerLen: listening_build step", () => {
  const readFile = fakeContentReadFile(jaContentFixture());
  const r = resolveAnswerLen("/ja/learn/lessons/ja-m34-neo-7?step=8", readFile);
  assert.equal(r.ok, true);
  assert.equal(r.answerLen, 5);
  assert.equal(r.stepType, "listening_build");
});

test("resolveAnswerLen: the m2 id-landmine case — a ja-m1-* id actually lives in m2's file, found by searching every file, not by parsing the id", () => {
  const readFile = fakeContentReadFile(jaContentFixture());
  const r = resolveAnswerLen("/ja/learn/lessons/ja-m1-g-1?step=1", readFile);
  assert.equal(r.ok, true);
  assert.equal(r.answerLen, 3);
  assert.equal(r.file, "m2.abc123.json");
});

test("resolveAnswerLen: defaults step to 0 when ?step= is absent", () => {
  const readFile = fakeContentReadFile({
    ja: { "m1.aaa.json": { lessons: [{ id: "ja-m1-x", steps: [{ type: "build_sentence", correctOrder: ["a", "b"] }] }] } },
  });
  const r = resolveAnswerLen("/ja/learn/lessons/ja-m1-x", readFile);
  assert.equal(r.ok, true);
  assert.equal(r.stepIndex, 0);
  assert.equal(r.answerLen, 2);
});

test("resolveAnswerLen: unknown lesson id falls back honestly (ok: false, reason names the lesson)", () => {
  const readFile = fakeContentReadFile(jaContentFixture());
  const r = resolveAnswerLen("/ja/learn/lessons/does-not-exist?step=0", readFile);
  assert.equal(r.ok, false);
  assert.match(r.reason, /does-not-exist/);
});

test("resolveAnswerLen: a non-build step falls back honestly (ok: false, reason names the type)", () => {
  const readFile = fakeContentReadFile(jaContentFixture());
  const r = resolveAnswerLen("/ja/learn/lessons/ja-m34-neo-7?step=0", readFile); // dialogue_sim
  assert.equal(r.ok, false);
  assert.match(r.reason, /dialogue_sim/);
});

test("resolveAnswerLen: a step index past the lesson's own step count falls back honestly", () => {
  const readFile = fakeContentReadFile(jaContentFixture());
  const r = resolveAnswerLen("/ja/learn/lessons/ja-m34-neo-7?step=99", readFile);
  assert.equal(r.ok, false);
  assert.match(r.reason, /step\[99\]/);
});

test("resolveAnswerLen: a route that doesn't look like /<lang>/learn/lessons/<id> falls back honestly", () => {
  const readFile = fakeContentReadFile(jaContentFixture());
  const r = resolveAnswerLen("/ja/review", readFile);
  assert.equal(r.ok, false);
});

test("resolveAnswerLen: an unknown language (directory listing fails) falls back honestly", () => {
  const readFile = fakeContentReadFile(jaContentFixture());
  const r = resolveAnswerLen("/xx/learn/lessons/whatever?step=0", readFile);
  assert.equal(r.ok, false);
  assert.match(r.reason, /xx/);
});

test("resolveAnswerLen: non-mN content files (_extra./index.) are never searched", () => {
  const readFile = fakeContentReadFile(jaContentFixture());
  const r = resolveAnswerLen("/ja/learn/lessons/should-never-match?step=0", readFile);
  assert.equal(r.ok, false); // only findable if _extra.xyz789.json were (wrongly) searched
});

test("resolveMaxTaps: an explicit --max-taps always wins, even over a resolved answerLen", () => {
  const r = resolveMaxTaps({ maxTapsArg: 20, answerLenResolution: { ok: true, answerLen: 6 } });
  assert.equal(r.maxTaps, 20);
  assert.equal(r.source, "explicit");
});

test("resolveMaxTaps: defaults to the resolved answerLen when --max-taps wasn't passed", () => {
  const r = resolveMaxTaps({ maxTapsArg: null, answerLenResolution: { ok: true, answerLen: 6 } });
  assert.equal(r.maxTaps, 6);
  assert.equal(r.source, "answerLen");
});

test("resolveMaxTaps: falls back to today's 20 when both --max-taps and answerLen resolution are unavailable", () => {
  const r = resolveMaxTaps({ maxTapsArg: null, answerLenResolution: { ok: false, reason: "x" } });
  assert.equal(r.maxTaps, 20);
  assert.equal(r.source, "fallback-default");
});

// ---------------------------------------------------------------------------
// Task B (2026-09-17, over-placement) — computeBuildVerdicts's answerLen
// restriction + formatBuildTable's over-placement label.
// ---------------------------------------------------------------------------

test("computeBuildVerdicts: an over-placement tap's h2/rowH/fitScale drift is IGNORED when answerLen is given", () => {
  const samples = [
    buildSample(0, { h2Top: 100, rowH: 48, fitScale: 1 }),
    buildSample(1, { h2Top: 100, rowH: 48, fitScale: 1 }), // real answer taps 1-2, stable
    buildSample(2, { h2Top: 100, rowH: 48, fitScale: 1 }),
    buildSample(3, { h2Top: 133, rowH: 52, fitScale: 0.8 }), // over-placement tap 3 (answerLen=2) — tray-growth artefact
  ];
  const restricted = computeBuildVerdicts(samples, { answerLen: 2 });
  assert.equal(restricted.h2Stable.ok, true);
  assert.equal(restricted.rowHStable.ok, true);
  assert.equal(restricted.fitScaleStable.ok, true);

  const unrestricted = computeBuildVerdicts(samples); // no answerLen — prior behavior, unchanged
  assert.equal(unrestricted.h2Stable.ok, false);
  assert.deepEqual(unrestricted.h2Stable.badTaps, [3]);
});

test("computeBuildVerdicts: trayBankFontEqual and stageFits are NOT restricted by answerLen — an over-placement tap's own defect still fails", () => {
  const samples = [
    buildSample(0, { tray: buildGroup(0, null, null), bank: buildGroup(10, 29, 29), stageTop: 0, stageH: 500, bankTop: 260, bankH: 100 }),
    buildSample(1, { tray: buildGroup(1, 29, 29), bank: buildGroup(9, 29, 29), stageTop: 0, stageH: 500, bankTop: 260, bankH: 100 }),
    // Over-placement tap 2 (answerLen=1): tray font mismatch AND stage overflow — still real defects even in an over-tapped state.
    buildSample(2, { tray: buildGroup(2, 19, 19), bank: buildGroup(8, 29, 29), stageTop: 0, stageH: 500, bankTop: 460, bankH: 100 }),
  ];
  const v = computeBuildVerdicts(samples, { answerLen: 1 });
  assert.equal(v.trayBankFontEqual.ok, false);
  assert.deepEqual(v.trayBankFontEqual.badTaps, [2]);
  assert.equal(v.stageFits.ok, false);
  assert.deepEqual(v.stageFits.badTaps, [2]);
});

test("recomputeFlickerWithinWindow: only counts changed frames within [0, windowMs]", () => {
  const trace = {
    maxH2Jump: 33,
    h2Reversals: 2,
    changed: [
      { t: 0, h2Top: 100 },
      { t: 400, h2Top: 100 }, // within window — no jump
      { t: 1400, h2Top: 133 }, // OUTSIDE a 900ms window — an over-placement-tap jump
      { t: 1800, h2Top: 100 }, // OUTSIDE — the reversal
    ],
  };
  const restricted = recomputeFlickerWithinWindow(trace, 900);
  assert.equal(restricted.maxH2Jump, 0);
  assert.equal(restricted.h2Reversals, 0);

  const full = recomputeFlickerWithinWindow(trace, 999999);
  assert.equal(full.maxH2Jump, 33);
  assert.equal(full.h2Reversals, 1); // one direction change across the 3 real deltas (100->100->133->100)
});

test("computeBuildVerdicts: noFlicker passes when the flicker is confined to over-placement taps (answerLen + tapIntervalMs given)", () => {
  const samples = [buildSample(0), buildSample(1), buildSample(2), buildSample(3)];
  const trace = {
    maxH2Jump: 33,
    h2Reversals: 1,
    changed: [
      { t: 0, h2Top: 100 },
      { t: 450, h2Top: 100 }, // tap 1 boundary
      { t: 900, h2Top: 100 }, // tap 2 boundary — answerLen*tapIntervalMs = 2*450 = 900
      { t: 1350, h2Top: 133 }, // tap 3 (over-placement) — the jump
      { t: 1800, h2Top: 100 }, // tap 4 (over-placement) — the reversal
    ],
  };
  const restricted = computeBuildVerdicts(samples, { layoutTrace: trace, answerLen: 2, tapIntervalMs: 450 });
  assert.equal(restricted.noFlicker.ok, true);
  assert.match(restricted.noFlicker.detail, /within answerLen window/);

  const unrestricted = computeBuildVerdicts(samples, { layoutTrace: trace }); // no answerLen — prior behavior, unchanged
  assert.equal(unrestricted.noFlicker.ok, false);
});

test("formatBuildTable: labels taps past answerLen '(over-placement)', on the same row", () => {
  const samples = [buildSample(0), buildSample(1), buildSample(2), buildSample(3)];
  const table = formatBuildTable(samples, { answerLen: 1 });
  const lines = table.split("\n");
  assert.equal(lines.length, 5); // header + 4 sample rows — no extra lines added
  assert.doesNotMatch(lines[1], /over-placement/); // tap 0
  assert.doesNotMatch(lines[2], /over-placement/); // tap 1 (== answerLen, not over)
  assert.match(lines[3], /over-placement/); // tap 2
  assert.match(lines[4], /over-placement/); // tap 3
});

test("formatBuildTable: without answerLen, no row is ever labeled (prior behavior unchanged)", () => {
  const samples = [buildSample(0), buildSample(1)];
  const table = formatBuildTable(samples);
  assert.doesNotMatch(table, /over-placement/);
});

// ---------------------------------------------------------------------------
// Task C (2026-09-17) — evaluateReport excludes collapsed tiles from
// clipped/overhang counts, reporting them separately as `collapsed`.
// ---------------------------------------------------------------------------

test("evaluateReport: a collapsed tile's clip is excluded from the FAIL reason and counted separately", () => {
  const report = baseReport({
    tiles: [
      { text: "spent", variant: "option", fontPx: 10, boxW: 0, boxH: 10, lineCount: 1, wrapped: false, clipped: true, collapsed: true },
    ],
  });
  const v = evaluateReport(report);
  assert.equal(v.ok, true); // no FAIL — the only clipped tile is collapsed
  assert.equal(v.collapsed, 1);
  assert.match(v.warnings.join(" "), /collapsed=1/);
});

test("evaluateReport: a NON-collapsed clipped tile still fails exactly as before", () => {
  const report = baseReport({
    tiles: [{ text: "れんしゅう", variant: "option", fontPx: 30, boxW: 150, boxH: 60, lineCount: 1, wrapped: false, clipped: true }],
  });
  const v = evaluateReport(report);
  assert.equal(v.ok, false);
  assert.match(v.reasons.join(" "), /clipped/);
  assert.equal(v.collapsed, 0);
});

test("evaluateReport: a mix of collapsed and real clipped tiles only fails on the real one, and counts both correctly", () => {
  const report = baseReport({
    tiles: [
      { text: "spent1", variant: "option", fontPx: 10, boxW: 0, boxH: 10, lineCount: 1, wrapped: false, clipped: true, collapsed: true },
      { text: "spent2", variant: "option", fontPx: 10, boxW: 0, boxH: 10, lineCount: 1, wrapped: false, clipped: true, collapsed: true },
      { text: "れんしゅう", variant: "option", fontPx: 30, boxW: 150, boxH: 60, lineCount: 1, wrapped: false, clipped: true, collapsed: false },
    ],
  });
  const v = evaluateReport(report);
  assert.equal(v.ok, false);
  assert.match(v.reasons.join(" "), /1 tile\(s\) clipped/);
  assert.equal(v.collapsed, 2);
});

test("evaluateReport: collapsed defaults to 0 when no report was captured at all", () => {
  assert.equal(evaluateReport(null).collapsed, 0);
});

// ---------------------------------------------------------------------------
// Task D (2026-09-17) — computeNextTapDelayMs (Node-side mirror) and
// buildTargetRoute's --frame-burst plumbing.
// ---------------------------------------------------------------------------

test("computeNextTapDelayMs: is the max of tap-interval, trace-stable, and screenshot-return", () => {
  assert.equal(computeNextTapDelayMs({ tapIntervalMs: 450, traceStableMs: 300, screenshotReturnMs: 200 }), 450);
  assert.equal(computeNextTapDelayMs({ tapIntervalMs: 450, traceStableMs: 900, screenshotReturnMs: 200 }), 900);
  assert.equal(computeNextTapDelayMs({ tapIntervalMs: 450, traceStableMs: 300, screenshotReturnMs: 500 }), 500);
});

test("computeNextTapDelayMs: null/non-finite inputs act as no floor, never NaN", () => {
  assert.equal(computeNextTapDelayMs({ tapIntervalMs: 450, traceStableMs: null, screenshotReturnMs: null }), 450);
  assert.equal(Number.isNaN(computeNextTapDelayMs({ tapIntervalMs: 450, traceStableMs: undefined, screenshotReturnMs: NaN })), false);
});

test("buildTargetRoute: --frame-burst sets simFrameBurst=1 only under --simulate build", () => {
  const withBurst = buildTargetRoute("/ja/learn/lessons/x?step=1", {
    fontScale: 100, simulate: "build", tapIntervalMs: 450, maxTaps: 6, frameBurst: true, seedProfile: "fresh", runNonce: "n",
  });
  assert.match(withBurst, /simFrameBurst=1/);

  const withoutBurst = buildTargetRoute("/ja/learn/lessons/x?step=1", {
    fontScale: 100, simulate: "build", tapIntervalMs: 450, maxTaps: 6, frameBurst: false, seedProfile: "fresh", runNonce: "n",
  });
  assert.doesNotMatch(withoutBurst, /simFrameBurst/);

  const notBuildSim = buildTargetRoute("/ja/review", { fontScale: 100, frameBurst: true, seedProfile: "fresh", runNonce: "n" });
  assert.doesNotMatch(notBuildSim, /simFrameBurst/); // only meaningful alongside --simulate build
});

test("parseArgs: --max-taps is null (unresolved) when not passed, and a number when passed", () => {
  assert.equal(parseArgs([]).maxTapsArg, null);
  assert.equal(parseArgs(["--max-taps", "15"]).maxTapsArg, 15);
});

test("parseArgs: --frame-burst defaults to false and is settable", () => {
  assert.equal(parseArgs([]).frameBurst, false);
  assert.equal(parseArgs(["--frame-burst"]).frameBurst, true);
});
