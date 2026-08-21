#!/usr/bin/env node
// run.mjs — THE STEP-TYPE UX PASS.
//
// Third-person UI review of every reachable lesson step type, across device AND
// desktop viewports, with the generator/judge split that keeps it honest:
//
//   capture  → screenshot each (step type × viewport), device-faithful
//   QUOTE    → local 122B vision model proposes candidate issues (free, exhaustive)
//   MEASURE  → DOM geometry probe finds the ground truth independently
//   CLASSIFY → a quote is CONFIRMED only if a measurement backs it; an
//              unbacked measurable quote is a REFUTED false positive; a fact no
//              quote mentioned is a model MISS; taste quotes go to a queue.
//
// Nothing is auto-applied. Output is a ranked report + a per-model
// false-positive rate — a trust metric on the third-person view.
//
//   node scripts/ux-loop/step-pass/run.mjs [--viewports a,b] [--types x,y] [--quote]
//
// Default is measurement-only (fast, trustworthy, no model). Add --quote to run
// the local vision generator too — its measurable claims are still judged by the
// probe, and the report shows its false-positive rate as a per-model trust score.
//
// Prereqs: dev server on :5173, .auth/user.json, Ollama (for the quote phase),
// and artifacts/ux-loop/step-coverage.json (STEP_COVERAGE_EMIT=1 vitest run …).
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { newSurface, gotoStep, probeStep, measureReflow, findViewport, isDesktop } from "./measure.mjs";
import { quoteScreen } from "./quote.mjs";
import { classify } from "./classify.mjs";
import { renderReport } from "./report.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../../..");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const has = (n) => process.argv.includes(`--${n}`);

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const DEFAULT_VPS = ["iphone-se", "iphone-14-promax", "laptop-720", "desktop-1080p"];
const VPS = (arg("viewports", DEFAULT_VPS.join(","))).split(",").map((s) => s.trim()).filter(Boolean);
const TYPE_FILTER = (arg("types", "")).split(",").map((s) => s.trim()).filter(Boolean);
// Measurement-first (2026-08-21): the DOM probe is the trustworthy product; the
// 122B vision quote was a 100%-geometry-false-positive generator on the v2 run
// (76/76 refuted, 0 of the real findings surfaced). So the vision pass is now
// OPT-IN — pass --quote to bring back the third-person view (still free, still
// exhaustive, still fully judged by the measurement). --no-quote kept as a no-op
// alias so old invocations don't break.
const DO_QUOTE = has("quote");

const COVERAGE = join(ROOT, "artifacts/ux-loop/step-coverage.json");
if (!existsSync(COVERAGE)) {
  console.error(`missing ${COVERAGE}\n  build it: STEP_COVERAGE_EMIT=1 npx vitest run src/features/lesson/dev/stepTypeCoverage.emit.test.ts`);
  process.exit(1);
}
const coverage = JSON.parse(readFileSync(COVERAGE, "utf8"));
let types = Object.entries(coverage.byType); // [stepType, {lessonId, stepIndex, lang}]
if (TYPE_FILTER.length) types = types.filter(([t]) => TYPE_FILTER.includes(t));

const stamp = process.env.RUN_STAMP ?? new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT = join(ROOT, "artifacts/ux-loop/step-pass", stamp);
const SHOTS = join(OUT, "shots");
mkdirSync(SHOTS, { recursive: true });

const routeFor = ({ lessonId, stepIndex, lang }) =>
  `/${lang}/learn/lessons/${lessonId}?step=${stepIndex}&trace-gate=0`;

console.log(`[step-pass] ${types.length} step types × ${VPS.length} viewports → ${OUT}`);
console.log(`[step-pass] viewports: ${VPS.join(", ")}`);

// ---- Phase A: capture + measure ----
// Headless Chromium's GPU process can crash under load (exit_code=15) and take
// the whole context with it; we don't need the GPU for screenshots, so disable
// it, and make each cell fully self-contained so ONE browser failure can't kill
// the run — on a crash we relaunch and retry the cell once.
const LAUNCH = { args: ["--disable-gpu", "--disable-software-rasterizer", "--disable-dev-shm-usage"] };
const cells = [];
let browser = await chromium.launch(LAUNCH);

async function measureCell(vp, stepType, loc) {
  const route = routeFor(loc);
  const shot = join(SHOTS, `${stepType}--${vp.name}.png`);
  const { ctx, page } = await newSurface(browser, vp, loc.lang);
  try {
    await gotoStep(page, BASE, route);
    await page.screenshot({ path: shot, fullPage: false });
    const probe = await probeStep(page, vp);
    // Gate: if no lesson stage rendered, the route fell back (e.g. a course not
    // selectable yet → /home). Its geometry is some OTHER page — mark misrouted
    // so it can never become a finding.
    const typeMismatch = probe.landed && probe.seenType && probe.seenType !== stepType;
    const misrouted = !probe.landed || typeMismatch;
    // reflow-on-submit is informational only (classify TASTE_KINDS): trustworthy
    // measurement needs the step answered first, so we don't click a raw CTA.
    const measurement = { ...probe, reflowOnSubmit: 0, misrouted };
    return { stepType, viewport: vp.name, lessonId: loc.lessonId, route, shot, measurement };
  } finally {
    await ctx.close().catch(() => {});
  }
}

for (const vpName of VPS) {
  const vp = findViewport(vpName);
  for (const [stepType, loc] of types) {
    let cell;
    for (let attempt = 0; attempt < 2 && !cell; attempt++) {
      try {
        cell = await measureCell(vp, stepType, loc);
      } catch (e) {
        // browser-level death → relaunch and retry once; otherwise record error
        if (!browser.isConnected() && attempt === 0) {
          try { await browser.close().catch(() => {}); } catch {}
          browser = await chromium.launch(LAUNCH);
          continue;
        }
        cell = { stepType, viewport: vpName, lessonId: loc.lessonId, route: routeFor(loc), shot: join(SHOTS, `${stepType}--${vpName}.png`), measurement: { error: String(e).slice(0, 140) } };
      }
    }
    cells.push(cell);
    process.stdout.write(".");
  }
}
await browser.close().catch(() => {});
console.log(`\n[step-pass] captured + measured ${cells.length} cells`);

// ---- Phase B: quote (local vision model, sequential) ----
if (DO_QUOTE) {
  let i = 0;
  for (const cell of cells) {
    i++;
    if (cell.measurement?.error) { cell.quote = { suggestions: [], skipped: "measure error" }; continue; }
    if (cell.measurement?.misrouted) { cell.quote = { suggestions: [], skipped: "misrouted" }; continue; }
    const q = await quoteScreen(cell.shot, { stepType: cell.stepType, viewport: cell.viewport });
    cell.quote = q;
    process.stdout.write(`\r[step-pass] quoted ${i}/${cells.length} (${q.suggestions.length} on ${cell.stepType}/${cell.viewport}, ${q.ms}ms)   `);
  }
  console.log();
} else {
  for (const cell of cells) cell.quote = { suggestions: [], skipped: "no-quote" };
}

// ---- Phase C: classify (misrouted / errored cells yield nothing) ----
const EMPTY = { confirmed: [], refuted: [], taste: [], stats: { measurableClaims: 0, falsePositives: 0, falsePositiveRate: 0, corroborated: 0, modelMisses: 0, tasteCount: 0, vacuous: 0, measuredFindings: 0 } };
for (const cell of cells) {
  if (cell.measurement?.misrouted || cell.measurement?.error) { cell.result = { ...EMPTY }; continue; }
  cell.result = classify({ claims: cell.quote.suggestions ?? [], measurement: cell.measurement ?? {} });
}
const misroutedCells = cells.filter((c) => c.measurement?.misrouted);

// ---- aggregate + write ----
const agg = {
  stamp,
  base: BASE,
  viewports: VPS,
  typesRun: types.map(([t]) => t),
  missing: coverage.missing ?? [],
  misrouted: [...new Set(misroutedCells.map((c) => c.stepType))].map((t) => ({
    stepType: t,
    lessonId: misroutedCells.find((c) => c.stepType === t).lessonId,
    seenType: misroutedCells.find((c) => c.stepType === t).measurement?.seenType ?? null,
  })),
  cells: cells.map((c) => ({
    stepType: c.stepType, viewport: c.viewport, lessonId: c.lessonId, route: c.route,
    shot: c.shot.replace(ROOT + "/", ""),
    measurement: c.measurement, quote: c.quote, result: c.result,
  })),
};
// portfolio-level trust metric
const allClaims = cells.reduce((n, c) => n + (c.result?.stats.measurableClaims ?? 0), 0);
const allFp = cells.reduce((n, c) => n + (c.result?.stats.falsePositives ?? 0), 0);
agg.trust = { measurableClaims: allClaims, falsePositives: allFp, falsePositiveRate: allClaims ? allFp / allClaims : 0 };

writeFileSync(join(OUT, "findings.json"), JSON.stringify(agg, null, 2));
const reportPath = join(OUT, "report.html");
writeFileSync(reportPath, renderReport(agg));
writeFileSync(join(OUT, "REPORT.md"), agg.__md ?? mdSummary(agg));

console.log(`\n[step-pass] DONE.`);
console.log(`  findings: ${join(OUT, "findings.json").replace(ROOT + "/", "")}`);
console.log(`  report:   ${reportPath.replace(ROOT + "/", "")}`);
console.log(mdSummary(agg));

function mdSummary(a) {
  const confirmed = a.cells.flatMap((c) => c.result.confirmed.map((f) => ({ ...f, stepType: c.stepType, viewport: c.viewport })));
  const byKind = {};
  for (const f of confirmed) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
  const taste = a.cells.reduce((n, c) => n + c.result.taste.length, 0);
  const lines = [
    `\n=== step-pass ${a.stamp} ===`,
    `confirmed findings: ${confirmed.length}  |  taste queue: ${taste}  |  model false-positive rate: ${(a.trust.falsePositiveRate * 100).toFixed(0)}% (${a.trust.falsePositives}/${a.trust.measurableClaims})`,
    `by kind: ${Object.entries(byKind).map(([k, n]) => `${k}:${n}`).join("  ") || "none"}`,
    a.misrouted?.length ? `route fell back, excluded (${a.misrouted.length}): ${a.misrouted.map((m) => m.stepType).join(", ")}` : "",
    a.missing.length ? `unreachable types (${a.missing.length}): ${a.missing.join(", ")}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}
