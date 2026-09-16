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

test("isStampFresh (G3): a stamp built for THIS dev server URL is fresh", () => {
  const stamp = { builtAt: "2026-09-16T00:00:00.000Z", devServerUrl: `${DEV_URL}/__sim`, gitRev: "abc1234" };
  assert.equal(isStampFresh(stamp, `${DEV_URL}/__sim`), true);
});

test("isStampFresh (G3): a stamp built for a DIFFERENT dev server is stale (the 'Trevor' non-dev-shell shape)", () => {
  // The tile sweep's actual failure: an iPad had a signed non-dev build
  // installed (no CAP_DEV_SERVER at all) while the host's shared
  // capacitor.config.json said the current dev server — a per-device
  // stamp is what catches this, not the host file.
  const stamp = { builtAt: "2026-08-01T00:00:00.000Z", devServerUrl: "https://app.openlingoapp.com", gitRev: "def5678" };
  assert.equal(isStampFresh(stamp, `${DEV_URL}/__sim`), false);
});

test("isStampFresh (G3): no stamp at all (not installed, or a pre-G3/manual build) is stale", () => {
  assert.equal(isStampFresh(null, `${DEV_URL}/__sim`), false);
  assert.equal(isStampFresh(undefined, `${DEV_URL}/__sim`), false);
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
  // rootFontPx: 15, not the baseValidateReport() default of 16 — real
  // landscape on ipad-air (1180×820) legitimately lands inside
  // src/index.css's `@media (min-width: 1024px) and (max-height: 820px)`
  // short-viewport breakpoint (confirmed live 2026-09-16: a real-rotated
  // capture at this exact size reported rootFontPx=15, not a flake).
  const report = baseValidateReport({ innerWidth: 1180, innerHeight: 820, dpr: 2, rootFontPx: 15 });
  const v = validateCapture(report, baseExpected({ viewport: IPAD_VIEWPORT, viewportKey: "ipad-air", orientation: "landscape" }));
  assert.equal(v.ok, true);
  assert.deepEqual(v.mismatches, []);
});

test("validateCapture: real landscape on ipad-air REJECTS the portrait 16px root font (the short-viewport breakpoint is not optional)", () => {
  const report = baseValidateReport({ innerWidth: 1180, innerHeight: 820, dpr: 2, rootFontPx: 16 });
  const v = validateCapture(report, baseExpected({ viewport: IPAD_VIEWPORT, viewportKey: "ipad-air", orientation: "landscape" }));
  assert.equal(v.ok, false);
  assert.match(v.mismatches.join(" "), /rootFontPx: expected ~15/);
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
