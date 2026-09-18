#!/usr/bin/env node
// Lane A11 (2026-09-17) — merges TWO devices' `artifacts/devlog/*.jsonl`
// files into one time-ordered table of progress/SRS pushes and pulls, with
// the server's own `X-Request-Id` echo where a record has one. This is the
// tool `docs/device-dev-debug-2026-09-17.md` points the lead at for reading
// a cross-device sync bug (phone vs iPad) as ONE timeline instead of two
// separate tails.
//
// Usage:
//   node scripts/devlog/sync-timeline.mjs                              # two most-recently-modified device files
//   node scripts/devlog/sync-timeline.mjs ios-iPhone-a1b2 ios-iPad-c3d4 # named devices
//
// Only records that are actually about progress/SRS sync are included:
// `kind: "sync"` (the SRS sync queue state machine, `srsSync.ts`),
// `kind: "reconcile"` (progress reconcile decisions,
// `progressReconcile.ts` / `pullFromServerIgnoringReset.ts`), and
// `kind: "api"` records whose `path` looks like a progress/SRS endpoint
// (`/progress`, `/srs`, `/boot` — `/boot` carries the initial progress+SRS
// hydrate in one batched request, see `bootCache.ts`). Everything else
// (console/error/plain api noise) is left to `tail.mjs`.

import fs from "node:fs";
import path from "node:path";
import { parseJsonlLines } from "./tail.mjs";

const DEVLOG_DIR = "artifacts/devlog";

const SYNC_PATH_RE = /\/(progress|srs|boot)\b/i;

export function isSyncRelevant(record) {
  if (record.kind === "sync" || record.kind === "reconcile") return true;
  if (record.kind === "api" && typeof record.path === "string") return SYNC_PATH_RE.test(record.path);
  return false;
}

function listDeviceFiles() {
  if (!fs.existsSync(DEVLOG_DIR)) return [];
  return fs
    .readdirSync(DEVLOG_DIR)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => ({ file: path.join(DEVLOG_DIR, f), device: path.basename(f, ".jsonl"), mtime: fs.statSync(path.join(DEVLOG_DIR, f)).mtimeMs }));
}

function resolveTwo(argv) {
  const named = argv.filter((a) => !a.startsWith("-"));
  if (named.length >= 2) {
    return named.slice(0, 2).map((device) => {
      const file = path.join(DEVLOG_DIR, `${device}.jsonl`);
      if (!fs.existsSync(file)) {
        console.error(`no such devlog file: ${file}`);
        process.exit(1);
      }
      return { device, file };
    });
  }
  const files = listDeviceFiles().sort((a, b) => b.mtime - a.mtime);
  if (files.length < 2) {
    console.error(`need at least two device files under ${DEVLOG_DIR}/ to merge a timeline — found ${files.length}.`);
    console.error(`known devices: ${files.map((f) => f.device).join(", ") || "(none)"}`);
    process.exit(1);
  }
  return files.slice(0, 2).map((f) => ({ device: f.device, file: f.file }));
}

/** One merged, time-sorted row. Pure — no filesystem — so this and
 *  `formatTimelineTable` are directly unit-testable against hand-built
 *  fixtures without writing files. */
export function mergeDeviceRecords(devices) {
  const rows = [];
  for (const { device, records } of devices) {
    for (const r of records) {
      if (!isSyncRelevant(r)) continue;
      rows.push({ ...r, device: r.device || device });
    }
  }
  rows.sort((a, b) => (a.t ?? 0) - (b.t ?? 0) || (a.seq ?? 0) - (b.seq ?? 0));
  return rows;
}

function summarize(record) {
  switch (record.kind) {
    case "api":
      return `${record.method ?? "?"} ${record.path ?? "?"} → ${record.status ?? "?"}${record.ok === false ? " FAIL" : ""} (${record.ms ?? "?"}ms, req=${record.reqBytes ?? "?"}B res=${record.resBytes ?? "?"}B)`;
    case "sync":
      switch (record.phase) {
        case "enqueued":
          return `SRS sync enqueued (queue depth ${record.queueDepth})`;
        case "batch_start":
          return `SRS batch start (${record.batchSize} of ${record.dirtyCount} dirty)`;
        case "batch_ok":
          return `SRS batch ok (${record.syncedCount}/${record.batchSize} synced)`;
        case "batch_error":
          return `SRS batch ERROR (${record.batchSize} cards, anyLanded=${record.anyLanded}): ${record.message}`;
        default:
          return `SRS sync ${record.phase ?? "?"}`;
      }
    case "reconcile":
      if (record.source === "pull-ignoring-reset") {
        return `PULL (ignore reset): local=${record.localCount} server=${record.serverCount ?? "?"}`;
      }
      return `reconcile: ${record.status ?? "?"}${record.reason ? ` (${record.reason})` : ""} queued=${record.queued ?? 0} posted=${record.posted ?? 0}`;
    default:
      return JSON.stringify(record);
  }
}

/** Pure formatter for the printed table — device / requestId column widths
 *  computed from the actual data so the table doesn't ragged-wrap on a
 *  short device name or a missing request id. */
export function formatTimelineTable(rows) {
  if (rows.length === 0) return "(no progress/SRS sync records found)";
  const cols = rows.map((r) => ({
    time: new Date(r.t ?? 0).toISOString().slice(11, 23),
    device: String(r.device ?? "?"),
    kind: String(r.kind ?? "?"),
    requestId: String(r.requestId ?? "-"),
    detail: summarize(r),
  }));
  const w = (key) => Math.max(key.length, ...cols.map((c) => c[key].length));
  const widths = { time: w("time"), device: Math.max(w("device"), "device".length), kind: Math.max(w("kind"), "kind".length), requestId: Math.max(w("requestId"), "request-id".length) };
  const pad = (s, n) => s + " ".repeat(Math.max(0, n - s.length));
  const header = `${pad("time", widths.time)}  ${pad("device", widths.device)}  ${pad("kind", widths.kind)}  ${pad("request-id", widths.requestId)}  detail`;
  const sep = "-".repeat(header.length + 20);
  const lines = cols.map((c) => `${pad(c.time, widths.time)}  ${pad(c.device, widths.device)}  ${pad(c.kind, widths.kind)}  ${pad(c.requestId, widths.requestId)}  ${c.detail}`);
  return [header, sep, ...lines].join("\n");
}

async function main() {
  const pairs = resolveTwo(process.argv.slice(2));
  const devices = pairs.map(({ device, file }) => ({
    device,
    records: parseJsonlLines(fs.readFileSync(file, "utf8")),
  }));
  console.log(`merging: ${devices.map((d) => `${d.device} (${d.records.length} records)`).join(" + ")}`);
  const rows = mergeDeviceRecords(devices);
  console.log(formatTimelineTable(rows));
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
