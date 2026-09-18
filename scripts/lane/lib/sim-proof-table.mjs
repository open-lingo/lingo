// scripts/lane/lib/sim-proof-table.mjs — pure table-building for
// sim-proof.sh (see its own header), + a thin CLI that crops each
// capture's screenshot to the stage (reusing sim-capture.mjs's own crop
// math — stageRectFromReport/cropBoxPx/cropScreenshotToStage) and prints
// the ONE compact table the brief asks for. PASS/FAIL is never
// re-derived here — it comes from the sim-capture.mjs PROCESS exit code
// sim-proof.sh already captured; this file only explains WHY, and only
// for --simulate build (a single capture's evaluateReport() verdict isn't
// written to its JSON, only to stdout, which sim-proof.sh already showed
// on FAIL).
import fs from "node:fs";
import path from "node:path";
import { stageRectFromReport, cropBoxPx, cropScreenshotToStage } from "../../ux-loop/sim-capture.mjs";

/** verdicts -> { total, failed } EXCLUDING `na` entries (unsampled != PASS,
 *  see computeBuildVerdicts's `na` helper). `failed` names the verdicts. */
export function countVerdicts(verdicts) {
  const entries = Object.entries(verdicts || {}).filter(([, v]) => v && v.na !== true);
  const failed = entries.filter(([, v]) => v.ok === false).map(([name]) => name);
  return { total: entries.length, failed };
}

/** bankVisible.detail leads with the px number when nonzero ("<n>px of the
 *  bank hidden behind the sticky CTA…") — the overlap-vs-CTA reading; 0 for
 *  the all-clear prose. */
export function bankVisiblePx(detail) {
  const m = /^(\d+(?:\.\d+)?)px/.exec(String(detail ?? ""));
  return m ? Number(m[1]) : 0;
}

/** Last sampled fitScale (the settled, post-last-tap reading), or null if
 *  no sample carried one. */
export function lastFitScale(samples) {
  const list = Array.isArray(samples) ? samples : [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (typeof list[i]?.fitScale === "number") return list[i].fitScale;
  }
  return null;
}

/** One table row from a completed sim-capture.mjs run. `passed` is that
 *  run's own exit code (0 = PASS) — the single source of truth for
 *  PASS/FAIL. `capture` is the parsed `<slug>.json` (or null if the run
 *  crashed before writing one). */
export function buildRow({ scale, capture, passed, screenshotPath }) {
  const sim = capture?.report?.simulation;
  const isBuild = sim?.mode === "build" || sim?.mode === "replay";
  let verdictStr = passed ? "PASS" : "FAIL";
  let fitScale = "-";
  let overflowPx = "-";
  if (isBuild && sim.verdicts) {
    const { total, failed } = countVerdicts(sim.verdicts);
    verdictStr = `${passed ? "PASS" : "FAIL"} (${failed.length}/${total} failed${failed.length ? ": " + failed.join(",") : ""})`;
    const fs2 = lastFitScale(sim.samples);
    fitScale = fs2 === null ? "-" : fs2.toFixed(3);
    overflowPx = String(bankVisiblePx(sim.verdicts.bankVisible?.detail));
  } else if (capture?.report && typeof capture.report.stageOverReportPx === "number") {
    overflowPx = String(capture.report.stageOverReportPx);
  }
  return { scale: `${scale}%`, verdictStr, screenshotPath: screenshotPath ?? "(none)", fitScale, overflowPx };
}

/** Plain-text column table, header + one line per row. Pure. */
export function formatTable(rows) {
  const header = ["scale", "verdicts", "screenshot", "fit-scale", "overflow px"];
  const cells = [header, ...rows.map((r) => [r.scale, r.verdictStr, r.screenshotPath, r.fitScale, r.overflowPx])];
  const widths = header.map((_, i) => Math.max(...cells.map((row) => String(row[i]).length)));
  return cells.map((row) => row.map((v, i) => String(v).padEnd(widths[i])).join("  ")).join("\n");
}

// --- CLI: one "scale|jsonPath|exitCode" arg per capture -------------------
function readCapture(jsonPath) {
  try {
    return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch {
    return null;
  }
}

function cropToStage(capture) {
  if (!capture?.screenshot || !capture?.report) return capture?.screenshot ?? null;
  const rect = stageRectFromReport(capture.report);
  if (!rect) return capture.screenshot;
  const box = cropBoxPx(rect, capture.report.dpr);
  const out = capture.screenshot.replace(/\.png$/, ".proof-stage.png");
  try {
    cropScreenshotToStage(capture.screenshot, box, out);
    return out;
  } catch {
    return capture.screenshot; // sips failed (e.g. no stage rect on-screen) — fall back to the full shot
  }
}

function main() {
  const specs = process.argv.slice(2);
  if (specs.length === 0) {
    console.error('usage: sim-proof-table.mjs "<scale>|<jsonPath>|<exitCode>" ...');
    process.exit(2);
  }
  const rows = specs.map((spec) => {
    const [scale, jsonPath, exitCode] = spec.split("|");
    const capture = jsonPath ? readCapture(jsonPath) : null;
    return buildRow({ scale, capture, passed: Number(exitCode) === 0, screenshotPath: cropToStage(capture) });
  });
  console.log(formatTable(rows));
  process.exit(rows.some((r) => r.verdictStr.startsWith("FAIL")) ? 1 : 0);
}

const isMain = import.meta.url === `file://${process.argv[1]}` || import.meta.url === `file://${path.resolve(process.argv[1] ?? "")}`;
if (isMain) main();
