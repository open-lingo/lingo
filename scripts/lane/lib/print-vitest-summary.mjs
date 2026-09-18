#!/usr/bin/env node
// print-vitest-summary.mjs — read a vitest --reporter=json report and print
// ONLY failing test names + their first assertion message, capped to 40
// lines, plus totals. Used by scripts/lane/test.sh; also callable directly:
//   node scripts/lane/lib/print-vitest-summary.mjs <report.json>
import { readFileSync } from "node:fs";

const CAP = 40;

export function summarize(report) {
  const lines = [];
  const failed = [];
  for (const tr of report.testResults ?? []) {
    for (const a of tr.assertionResults ?? []) {
      if (a.status !== "failed") continue;
      const msg = (a.failureMessages?.[0] ?? "").split("\n")[0].slice(0, 200);
      failed.push(`FAIL ${a.fullName || a.title}\n  ${msg}`);
    }
    // A file-level failure (e.g. an import/setup throw) has no assertionResults.
    if ((tr.assertionResults ?? []).length === 0 && tr.status === "failed") {
      const msg = (tr.message ?? "").split("\n")[0].slice(0, 200);
      failed.push(`FAIL (file) ${tr.name}\n  ${msg}`);
    }
  }
  const shown = failed.slice(0, CAP);
  lines.push(...shown);
  if (failed.length > shown.length) {
    lines.push(`... (${failed.length - shown.length} more failures omitted)`);
  }
  lines.push(
    `totals: ${report.numTotalTests ?? 0} tests, ` +
      `${report.numPassedTests ?? 0} passed, ` +
      `${report.numFailedTests ?? 0} failed, ` +
      `${(report.numPendingTests ?? 0) + (report.numTodoTests ?? 0)} skipped`,
  );
  return lines.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: print-vitest-summary.mjs <vitest-json-report>");
    process.exit(2);
  }
  const report = JSON.parse(readFileSync(path, "utf8"));
  console.log(summarize(report));
}
