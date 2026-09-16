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
import { evaluateReport, captureSlug, formatSummaryTable } from "./sim-capture.mjs";

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

test("captureSlug is filesystem-safe and includes the font scale", () => {
  assert.equal(captureSlug("/ja/learn/lessons/ja-m34-neo-3?step=16", 125), "capture-ja-learn-lessons-ja-m34-neo-3-step-16-125");
});

test("formatSummaryTable renders without a captured report", () => {
  const out = formatSummaryTable(null, { route: "/x", fontScale: 100, viewport: "15-pro-max" });
  assert.match(out, /no report captured/);
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
